const crypto = require("crypto");
const { CampaignError } = require("../campaign/errors");
const {
	STAGE_KEYS,
	clampStage,
	freshStages,
	effectiveSpeed,
	chipDamage,
	rollSleepTurns,
	statusGate,
	movePriority,
	statusAppliedLine,
	cantMoveLine,
	statusEndLine,
	chipLine,
	statChangeLine,
} = require("./battleStatus");
const { createBattleAi } = require("./battleAi");
const { xpNeededForLevel, xpGainForWin } = require("./xpService");
const { rollGenderForSpecies } = require("./genderService");

/**
 * Server-authoritative battle sessions (Phase 3, party-aware since Phase 4,
 * Gen 3 battle fidelity since Phase 14).
 *
 * Storage is an in-memory Map: resume works for the process lifetime only;
 * a backend restart drops mid-battle state and the client re-starts the same
 * progress battle via POST /api/battle/start. (Mid-battle PP usage is lost
 * the same way — PP persists to the DB only at battle end.)
 *
 * Party rules:
 * - The session snapshots the trainer's full party (max 3); the active
 *   Pokémon is session state (`activePosition`), starting at the lowest
 *   position with HP left.
 * - A voluntary switch has priority but consumes the turn: the enemy gets
 *   one free beat against the incoming Pokémon.
 * - When the active Pokémon faints with reserves left, `requiresSwitch` is
 *   set and the replacement switch is free (no enemy beat) — Gen 3-style.
 * - The battle is lost only when every party member has fainted; losses
 *   never touch campaign progress.
 * - Battle HP is session-local and never written back to the DB.
 * - Items (Phase 7): a healing item heals session HP of any non-fainted
 *   party member (default: the active mon) and consumes the turn like a
 *   voluntary switch — the enemy gets one beat. The item quantity IS
 *   persisted (decremented) even though battle HP is not. Items that are
 *   not usableInBattle (evolution stones, Elixirs) are rejected with 400.
 *
 * Enemy party rules (Phase 10):
 * - The enemy side snapshots the full configured party (1–N mons); `enemy`
 *   always references the active enemy. A KO'd enemy with reserves is
 *   auto-replaced via an `enemy_send` event; the fresh mon does not act on
 *   the beat it comes out. The battle is won when all enemy mons faint.
 *
 * Battle fidelity (Phase 14, Gen 3 / FireRed-style):
 * - PP: snapshotted per move (player PP from trainer_pokemon_moves, enemy
 *   full PP). PP is spent when the move executes (misses included; a
 *   sleep/paralysis/freeze block does not spend PP). A 0-PP move is a 400;
 *   with every move at 0 PP the player must use Struggle (moveId -1,
 *   typeless, 1/4 recoil). Player PP persists to trainer_pokemon_moves at
 *   battle end — win or loss. Enemy PP is session-only.
 * - Turn order: move priority (backend/data/move_meta.json) beats speed;
 *   speeds are stage- and paralysis-adjusted; a full tie goes to the player
 *   (unchanged, deterministic).
 * - Major statuses (brn/par/psn/slp/frz): one at a time per mon, session
 *   state only — cleared at battle end, never written to trainer_pokemon.
 *   Sleep blocks 1-4 attempts; freeze thaws 20%/turn (or on a Fire-type
 *   hit); paralysis skips 25% of turns and quarters speed; burn/poison chip
 *   1/8 max HP after rounds that ended with both actives standing. Burn
 *   halves physical damage (engine-side). Statuses persist across switches.
 * - Stat stages (-6..+6): per-mon session state; the engine applies
 *   atk/def/spa/spd/acc/eva, the session applies spe in turn order. Stages
 *   reset when the mon leaves the field; each fresh enemy starts at 0.
 * - Abilities: snapshot carries the species' first non-hidden ability; the
 *   engine implements Levitate, Static, and the pinch boosts
 *   (Overgrow/Blaze/Torrent/Swarm) — everything else is a no-op.
 * - Enemy AI (battleAi.js): scores damaging moves by power x type x STAB
 *   (skipping immune ones), sometimes opens with a status move against a
 *   healthy target, and Struggles when out of PP.
 */

const STRUGGLE_MOVE_ID = -1;

/** Synthetic Struggle (Gen 2-3 style): typeless 50 BP, always hits, 1/4
 * damage recoil — the effects live in the engine's move_effects.json. */
function struggleMove() {
	return {
		move_id: STRUGGLE_MOVE_ID,
		name: "Struggle",
		power: 50,
		accuracy: 1,
		move_type: "Normal",
		status_effect: null,
		effect_chance: null,
		current_pp: null,
		max_pp: null,
	};
}

function sanitizeMove(move) {
	let accuracy = move.accuracy == null ? 1 : Number(move.accuracy);
	if (accuracy > 1) accuracy = accuracy / 100;
	// PP: max from Move.pp (or an explicit max_pp), current from the
	// trainer's persisted current_pp. null PP (legacy fixtures) means "not
	// tracked": the move is always usable and never decremented.
	const maxPp =
		move.max_pp != null
			? Number(move.max_pp)
			: move.pp != null
			? Number(move.pp)
			: null;
	const currentPp =
		move.current_pp != null
			? Math.max(0, Math.min(Number(move.current_pp), maxPp ?? Infinity))
			: maxPp;
	return {
		move_id: move.move_id,
		name: move.name,
		power: move.power == null ? 0 : Number(move.power),
		accuracy,
		move_type: move.move_type || "Normal",
		status_effect: move.status_effect ?? null,
		effect_chance: move.effect_chance ?? null,
		current_pp: currentPp,
		max_pp: maxPp,
	};
}

function snapshotPokemon(raw, fallbackPosition = null) {
	const maxHp = Number(raw.max_hp);
	const currentHp = raw.current_hp == null ? maxHp : Number(raw.current_hp);
	const level = Number(raw.level) || 1;
	return {
		// DB row id (trainer_pokemon.id) — used to persist XP/PP after battle
		id: raw.id ?? null,
		position: raw.position != null ? Number(raw.position) : fallbackPosition,
		pokemon_id: raw.pokemon_id,
		nickname: raw.nickname,
		level,
		max_hp: maxHp,
		current_hp: Math.max(0, Math.min(maxHp, currentHp)),
		attack: Number(raw.attack),
		defense: Number(raw.defense),
		speed: Number(raw.speed),
		special_atk: Number(raw.special_atk),
		special_def: Number(raw.special_def),
		// Major battle status (brn/par/psn/slp/frz) — session-scoped, always
		// starts clean (the DB's cosmetic status string is ignored).
		status: null,
		statusTurns: 0,
		stages: freshStages(),
		ability: raw.ability
			? {
					id: raw.ability.id ?? raw.ability.ability_id ?? null,
					name: raw.ability.name,
			  }
			: null,
		types: Array.isArray(raw.types) && raw.types.length ? raw.types : ["Normal"],
		moves: (raw.moves || []).map(sanitizeMove),
		// Battle UI redesign: gender symbol + live EXP bar. Player rows carry
		// a real assigned gender (Task 2); enemy config data has none, so one
		// is rolled here once, at session-start snapshot time, and stays
		// stable for the whole battle (session.player/enemyParty are mutated
		// in place across turns, not re-snapshotted).
		// Player rows have a real DB id and must keep a null gender as-is
		// (pre-migration rows); only gender-less enemy config data gets a
		// rolled fallback.
		gender: raw.gender ?? (raw.id == null ? rollGenderForSpecies(raw.pokemon_id) : null),
		experience: Number(raw.experience) || 0,
		xp_to_next: xpNeededForLevel(level),
	};
}

function clonePokemon(pokemon) {
	return {
		...pokemon,
		types: [...pokemon.types],
		stages: { ...pokemon.stages },
		ability: pokemon.ability ? { ...pokemon.ability } : null,
		moves: pokemon.moves.map((m) => ({ ...m })),
	};
}

/** True when every tracked move is out of PP (Struggle time). */
function outOfPp(mon) {
	return (
		mon.moves.length > 0 &&
		mon.moves.every(
			(m) => typeof m.current_pp === "number" && m.current_pp <= 0
		)
	);
}

function toPublicState(session) {
	return {
		sessionId: session.sessionId,
		level: session.level,
		battleNumber: session.battleNumber,
		status: session.status,
		battleType: session.battleType,
		trainerName: session.trainerName,
		trainerSprite: session.trainerSprite || null,
		player: clonePokemon(session.player),
		enemy: clonePokemon(session.enemy),
		party: session.party.map(clonePokemon),
		activePosition: session.activePosition,
		requiresSwitch: session.requiresSwitch,
		// Phase 14: the client shows a single STRUGGLE button when true.
		mustStruggle: outOfPp(session.player),
		// Phase 10: full enemy party (1–N) + which member is out.
		enemyParty: session.enemyParty.map(clonePokemon),
		enemyActivePosition: session.enemyActivePosition,
		log: [...session.log],
		progressAwarded: session.progressAwarded,
		createdAt: session.createdAt,
		updatedAt: session.updatedAt,
	};
}

function defaultGetPlayerParty() {
	return async (trainerId) => {
		const trainerService = require("./trainerService");
		const data = await trainerService.getTrainerData(trainerId);
		return data?.pokemon || [];
	};
}

function defaultGetEnemyBattle() {
	return async (level, battleNumber) => {
		const campaignService = require("./campaignService");
		const campaign = await campaignService.getLevel(level);
		const battle = campaign.battles.find(
			(b) => b.battleNumber === battleNumber
		);
		if (battle?.type === "legendary") {
			if (!battle.encounter?.party?.length) {
				throw new CampaignError(400, "Battle has no enemy configured");
			}
			return {
				trainerName: battle.encounter.name,
				party: battle.encounter.party,
				battleType: "legendary",
			};
		}
		if (!battle || !battle.trainer?.party?.length) {
			throw new CampaignError(400, "Battle has no enemy configured");
		}
		return {
			trainerName: battle.trainer.name,
			trainerSprite: battle.trainer.sprite || null,
			party: battle.trainer.party,
			battleType: battle.type || "trainer",
		};
	};
}

function defaultEngine() {
	const battleService = require("./battleService");
	return {
		turnOrder: battleService.turnOrder,
		calculateDamage: battleService.calculateDamage,
	};
}

/** Persists end-of-battle PP back to trainer_pokemon_moves. */
function createMysqlPpStore() {
	return {
		async savePp(entries) {
			const pool = require("../config/trainerdb");
			for (const entry of entries) {
				await pool.query(
					`UPDATE trainer_pokemon_moves SET current_pp = ?
           WHERE trainer_pokemon_id = ? AND move_id = ?`,
					[entry.currentPp, entry.trainerPokemonId, entry.moveId]
				);
			}
		},
	};
}

/** Appends one finished battle to the (previously unused) `battles` table. */
function createMysqlHistoryStore() {
	return {
		async record({ trainerId, opponent, result }) {
			const pool = require("../config/trainerdb");
			await pool.query(
				"INSERT INTO battles (trainer_id, opponent, result) VALUES (?, ?, ?)",
				[trainerId, String(opponent || "Unknown").slice(0, 50), result]
			);
		},
	};
}

/** In-memory history store for tests; exposes `rows`. */
function createMemoryHistoryStore() {
	const rows = [];
	return {
		rows,
		async record(row) {
			rows.push({ ...row });
		},
	};
}

/** In-memory ppStore for tests; exposes `saved` for assertions. */
function createMemoryPpStore() {
	const saved = [];
	return {
		saved,
		async savePp(entries) {
			saved.push(...entries.map((e) => ({ ...e })));
		},
	};
}

/** Persists end-of-battle HP back to trainer_pokemon. */
function createMysqlHpStore() {
	return {
		async saveHp(entries) {
			const pool = require("../config/trainerdb");
			for (const entry of entries) {
				await pool.query(
					`UPDATE trainer_pokemon SET current_hp = ? WHERE id = ?`,
					[entry.currentHp, entry.trainerPokemonId]
				);
			}
		},
	};
}

/** In-memory hpStore for tests; exposes `saved` for assertions. */
function createMemoryHpStore() {
	const saved = [];
	return {
		saved,
		async saveHp(entries) {
			saved.push(...entries.map((e) => ({ ...e })));
		},
	};
}

// Battle types that may create a boss reward offer on a first-time win
// (rewardService still requires a matching level pool `source`).
const OFFER_BATTLE_TYPES = new Set(["gym_boss", "champion", "legendary"]);

// An "active" session idle longer than this is treated as abandoned rather
// than resumed: the player left without finishing (closed the tab, backed
// out to the hub) and may since have evolved or leveled a party member
// through some other flow (a stone, another battle). Resuming the old
// snapshot past this point would show stale pre-change data; falling
// through to a fresh snapshot picks up whatever the DB says now.
const ABANDONED_SESSION_MS = 10 * 60 * 1000;

function createBattleSessionService(deps = {}) {
	const sessions = new Map(); // sessionId -> session
	const sessionByTrainer = new Map(); // trainerId -> sessionId
	const wonBattles = new Set(); // "trainerId:level:battleNumber"

	const random = deps.random || Math.random;
	const clock = deps.now || (() => Date.now());
	const ai = deps.ai || createBattleAi({ random });
	let mysqlPpStore = null;
	const getPpStore = () =>
		deps.ppStore || (mysqlPpStore ||= createMysqlPpStore());
	let mysqlHpStore = null;
	const getHpStore = () =>
		deps.hpStore || (mysqlHpStore ||= createMysqlHpStore());
	let mysqlHistoryStore = null;
	const getHistoryStore = () =>
		deps.history || (mysqlHistoryStore ||= createMysqlHistoryStore());
	const getProgressService = () =>
		deps.progress || require("./progressService");
	const getXpService = () => deps.xp || require("./xpService");
	const getRewardService = () => deps.rewards || require("./rewardService");
	const getInventoryService = () =>
		deps.inventory || require("./inventoryService");
	const getWalletService = () => deps.wallet || require("./walletService");
	const getEvolutionService = () =>
		deps.evolution || require("./evolutionService");
	const getMoveLearnService = () =>
		deps.moveLearn || require("./moveLearnService");
	const getPlayerParty = deps.getPlayerParty || defaultGetPlayerParty();
	const getEnemyBattle = deps.getEnemyBattle || defaultGetEnemyBattle();
	const getEngine = () => deps.engine || defaultEngine();

	const winKey = (trainerId, level, battleNumber) =>
		`${Number(trainerId)}:${level}:${battleNumber}`;

	function getOwnedSession(trainerId, sessionId) {
		const session = sessions.get(sessionId);
		if (!session) {
			throw new CampaignError(404, "Battle session not found");
		}
		if (session.trainerId !== Number(trainerId)) {
			throw new CampaignError(403, "Not your battle session");
		}
		return session;
	}

	async function startBattle(trainerId, { level, battleNumber, force }) {
		const progressService = getProgressService();
		const progress = await progressService.getProgress(trainerId);
		if (
			progress.current_level !== level ||
			progress.current_battle !== battleNumber
		) {
			throw new CampaignError(
				403,
				`Not the active battle (currently at level ${progress.current_level}, battle ${progress.current_battle})`
			);
		}

		// Resume a live session for this exact battle instead of resetting it,
		// unless the caller explicitly asked for a forced restart (mid-battle
		// RESTART command) — force always falls through to a fresh session.
		// A session idle past ABANDONED_SESSION_MS is treated the same as a
		// forced restart: the player left it behind, and re-snapshotting from
		// the DB picks up any evolution/level-up that happened meanwhile
		// instead of showing the stale pre-change party.
		const existingId = sessionByTrainer.get(Number(trainerId));
		if (existingId) {
			const existing = sessions.get(existingId);
			const idleMs = existing
				? clock() - new Date(existing.updatedAt).getTime()
				: Infinity;
			if (
				!force &&
				existing &&
				existing.status === "active" &&
				existing.level === level &&
				existing.battleNumber === battleNumber &&
				idleMs < ABANDONED_SESSION_MS
			) {
				return { state: toPublicState(existing), resumed: true };
			}
			sessions.delete(existingId);
		}

		const [partyRaw, enemyBattle] = await Promise.all([
			getPlayerParty(trainerId),
			getEnemyBattle(level, battleNumber),
		]);
		if (!Array.isArray(partyRaw) || !partyRaw.length) {
			throw new CampaignError(400, "No Pokémon found for this trainer");
		}
		const party = partyRaw
			.map((raw, idx) => snapshotPokemon(raw, idx + 1))
			.sort((a, b) => a.position - b.position);
		const active = party.find((mon) => mon.current_hp > 0);
		if (!active) {
			throw new CampaignError(
				400,
				"All of your Pokémon have fainted — heal your party first"
			);
		}
		if (!active.moves.length) {
			throw new CampaignError(400, "Your Pokémon has no usable moves");
		}
		// Phase 10: enemies are full parties (1–N). `pokemon` is the legacy
		// single-mon shape kept for injected test fixtures.
		const enemyPartyRaw = enemyBattle.party?.length
			? enemyBattle.party
			: enemyBattle.pokemon
			? [enemyBattle.pokemon]
			: [];
		if (!enemyPartyRaw.length) {
			throw new CampaignError(500, "Enemy has no Pokémon configured");
		}
		const enemyParty = enemyPartyRaw.map((raw, idx) =>
			snapshotPokemon(raw, idx + 1)
		);
		for (const mon of enemyParty) {
			if (!mon.moves.length) {
				throw new CampaignError(
					500,
					"Enemy Pokémon has no moves configured"
				);
			}
		}

		const now = new Date(clock()).toISOString();
		const session = {
			sessionId: crypto.randomUUID(),
			trainerId: Number(trainerId),
			level,
			battleNumber,
			battleType: enemyBattle.battleType || "trainer",
			trainerName: enemyBattle.trainerName,
			trainerSprite: enemyBattle.trainerSprite || null,
			party,
			// `player` always references the active party entry, so beat
			// resolution mutates the party snapshot in place.
			player: active,
			activePosition: active.position,
			requiresSwitch: false,
			// Party positions that were ever the active mon this battle — win
			// XP is split evenly across these, not dumped on whoever landed
			// the finishing blow.
			participants: new Set([active.position]),
			// `enemy` references the active enemyParty entry the same way.
			enemyParty,
			enemy: enemyParty[0],
			enemyActivePosition: enemyParty[0].position,
			enemyNeedsSend: false,
			status: "active",
			log: [`Battle started against ${enemyBattle.trainerName}!`],
			progressAwarded: false,
			createdAt: now,
			updatedAt: now,
		};
		sessions.set(session.sessionId, session);
		sessionByTrainer.set(session.trainerId, session.sessionId);
		return { state: toPublicState(session), resumed: false };
	}

	/** Faint bookkeeping shared by beat damage, recoil, and chip damage. */
	function processFaint(session, side) {
		const mon = session[side];
		session.log.push(`${mon.nickname} fainted!`);
		if (side === "enemy") {
			if (session.enemyParty.some((m) => m.current_hp > 0)) {
				// Enemy reserves remain: the server auto-sends the next mon
				// after the round resolves (see sendNextEnemy).
				session.enemyNeedsSend = true;
			} else {
				session.status = "won";
			}
		} else if (session.party.some((m) => m.current_hp > 0)) {
			// Reserves remain: battle stays active, a switch is required
			// (and will be free — no enemy beat).
			session.requiresSwitch = true;
			session.log.push("Choose your next Pokémon!");
		} else {
			session.status = "lost";
		}
	}

	/** Applies a fresh major status (no-op if fainted or already statused). */
	function applyStatus(session, side, status, events) {
		const mon = session[side];
		if (mon.current_hp <= 0 || mon.status) return;
		mon.status = status;
		mon.statusTurns = status === "slp" ? rollSleepTurns(random) : 0;
		session.log.push(statusAppliedLine(mon.nickname, status));
		events.push({
			target: side,
			type: "status_applied",
			position: mon.position,
			nickname: mon.nickname,
			status,
		});
	}

	/** Clears a mon's status with a log + event (wake/thaw/fire_thaw). */
	function cureStatus(session, side, reason, events) {
		const mon = session[side];
		const status = mon.status;
		if (!status) return;
		mon.status = null;
		mon.statusTurns = 0;
		session.log.push(statusEndLine(mon.nickname, status));
		events.push({
			target: side,
			type: "status_end",
			position: mon.position,
			nickname: mon.nickname,
			status,
			reason,
		});
	}

	/** Applies engine stat-change verdicts with clamping + events. */
	function applyStatChanges(session, attackerKey, changes, events) {
		const defenderKey = attackerKey === "player" ? "enemy" : "player";
		for (const change of changes || []) {
			const side = change.target === "self" ? attackerKey : defenderKey;
			const mon = session[side];
			const stat = change.stat;
			const delta = Math.trunc(Number(change.delta) || 0);
			if (mon.current_hp <= 0 || !STAGE_KEYS.includes(stat) || !delta) {
				continue;
			}
			const current = mon.stages[stat] ?? 0;
			const next = clampStage(current + delta);
			const failed = next === current;
			if (!failed) mon.stages[stat] = next;
			session.log.push(statChangeLine(mon.nickname, stat, delta, failed));
			events.push({
				target: side,
				type: "stat_change",
				position: mon.position,
				nickname: mon.nickname,
				stat,
				delta,
				stage: next,
				failed,
			});
		}
	}

	/**
	 * One attack resolution against the engine. Returns the events it
	 * produced (move event first, then any secondary effects). Faint flags
	 * land on the session (requiresSwitch / enemyNeedsSend / status).
	 */
	async function executeBeat(session, attackerKey, move) {
		const defenderKey = attackerKey === "player" ? "enemy" : "player";
		const attacker = session[attackerKey];
		const defender = session[defenderKey];
		const engine = getEngine();

		session.log.push(`${attacker.nickname} used ${move.name}!`);
		const result = await engine.calculateDamage({
			attacker: clonePokemon(attacker),
			defender: clonePokemon(defender),
			move: { ...move },
		});

		const kind = ["miss", "failed", "status", "heal"].includes(result.result)
			? result.result
			: "hit";
		const events = [];
		const event = {
			actor: attackerKey,
			type: "move",
			moveId: move.move_id,
			moveName: move.name,
			moveType: move.move_type,
			result: kind,
			damage: 0,
			targetHpAfter: defender.current_hp,
			targetFainted: false,
		};
		events.push(event);

		if (kind === "miss") {
			session.log.push(`${attacker.nickname}'s attack missed!`);
			return events;
		}

		if (kind === "failed") {
			// OHKO level check / status move with no possible effect.
			if (result.type_multiplier === 0) {
				event.type_multiplier = 0;
				session.log.push(
					`It doesn't affect ${defender.nickname}...`
				);
			} else {
				session.log.push("But it failed!");
			}
			return events;
		}

		if (kind === "heal") {
			// Self-heal move (Recover / Soft-boiled).
			const requested = Math.max(0, Math.round(Number(result.heal_amount) || 0));
			const healed =
				Math.min(attacker.max_hp, attacker.current_hp + requested) -
				attacker.current_hp;
			attacker.current_hp += healed;
			session.log.push(`${attacker.nickname} regained health!`);
			events.push({
				target: attackerKey,
				type: "heal_move",
				position: attacker.position,
				nickname: attacker.nickname,
				amount: healed,
				hpAfter: attacker.current_hp,
			});
			return events;
		}

		if (kind === "status") {
			// Pure status / stat-change move that connected.
			if (result.status_effect_applied) {
				applyStatus(session, defenderKey, result.status_effect_applied, events);
			}
			applyStatChanges(session, attackerKey, result.stat_changes, events);
			return events;
		}

		// kind === "hit": damage plus secondary effects.
		const damage = Math.max(0, Math.round(Number(result.damage) || 0));
		defender.current_hp = Math.max(0, defender.current_hp - damage);
		event.damage = damage;
		if (typeof result.critical_hit === "boolean") {
			event.critical_hit = result.critical_hit;
		}
		if (typeof result.type_multiplier === "number") {
			event.type_multiplier = result.type_multiplier;
		}
		if (typeof result.stab === "boolean") {
			event.stab = result.stab;
		}
		if (result.hits > 1) {
			event.hits = result.hits;
		}
		if (result.ohko) {
			event.ohko = true;
		}
		event.targetHpAfter = defender.current_hp;
		session.log.push(`${attacker.nickname} dealt ${damage} damage!`);
		if (result.hits > 1) {
			session.log.push(`Hit ${result.hits} time(s)!`);
		}

		// A Fire-type hit thaws a frozen target (before any new status).
		if (
			damage > 0 &&
			defender.current_hp > 0 &&
			defender.status === "frz" &&
			String(move.move_type).toLowerCase() === "fire"
		) {
			cureStatus(session, defenderKey, "fire_thaw", events);
		}

		if (defender.current_hp <= 0) {
			event.targetFainted = true;
			processFaint(session, defenderKey);
		} else {
			if (result.status_effect_applied) {
				applyStatus(session, defenderKey, result.status_effect_applied, events);
			}
			applyStatChanges(session, attackerKey, result.stat_changes, events);
		}

		// Drain (Absorb family): heal a fraction of the damage dealt.
		if (result.drain_fraction && damage > 0 && attacker.current_hp > 0) {
			const amount =
				Math.min(
					attacker.max_hp,
					attacker.current_hp +
						Math.max(1, Math.round(damage * Number(result.drain_fraction)))
				) - attacker.current_hp;
			if (amount > 0) {
				attacker.current_hp += amount;
				session.log.push(
					`${defender.nickname} had its energy drained!`
				);
				events.push({
					target: attackerKey,
					type: "drain",
					position: attacker.position,
					nickname: attacker.nickname,
					amount,
					hpAfter: attacker.current_hp,
				});
			}
		}

		// Recoil (Take-down family, Struggle): fraction of damage dealt.
		if (result.recoil_fraction && damage > 0) {
			const recoil = Math.max(
				1,
				Math.round(damage * Number(result.recoil_fraction))
			);
			attacker.current_hp = Math.max(0, attacker.current_hp - recoil);
			session.log.push(`${attacker.nickname} is damaged by recoil!`);
			events.push({
				target: attackerKey,
				type: "recoil",
				position: attacker.position,
				nickname: attacker.nickname,
				damage: recoil,
				hpAfter: attacker.current_hp,
				targetFainted: attacker.current_hp <= 0,
			});
			// Recoil can faint the attacker. If the defender's faint already
			// won the battle, the win stands (campaign rule, documented).
			if (attacker.current_hp <= 0 && session.status === "active") {
				processFaint(session, attackerKey);
			}
		}

		// Static: the defender's ability paralyzed the attacker.
		if (result.attacker_status_applied && attacker.current_hp > 0) {
			applyStatus(session, attackerKey, result.attacker_status_applied, events);
		}

		return events;
	}

	/**
	 * A full beat: pre-move status gate, PP spend, then the attack itself.
	 * Blocked turns (sleep/para/freeze) consume the beat but not PP.
	 */
	async function runBeat(session, attackerKey, move) {
		const attacker = session[attackerKey];
		const events = [];

		const gate = statusGate(attacker, random);
		if (gate.cured) {
			cureStatus(
				session,
				attackerKey,
				gate.cured === "slp" ? "wake" : "thaw",
				events
			);
		} else if (gate.nextTurns != null) {
			attacker.statusTurns = gate.nextTurns;
		}
		if (!gate.act) {
			session.log.push(cantMoveLine(attacker.nickname, gate.blocked));
			events.push({
				actor: attackerKey,
				type: "cant_move",
				position: attacker.position,
				nickname: attacker.nickname,
				status: gate.blocked,
			});
			return events;
		}

		if (
			move.move_id !== STRUGGLE_MOVE_ID &&
			typeof move.current_pp === "number"
		) {
			move.current_pp = Math.max(0, move.current_pp - 1);
			events.push({
				actor: attackerKey,
				type: "pp_change",
				moveId: move.move_id,
				moveName: move.name,
				currentPp: move.current_pp,
			});
		}

		events.push(...(await executeBeat(session, attackerKey, move)));
		return events;
	}

	/**
	 * Auto-sends the enemy's next healthy mon (party order) after the
	 * active one fainted. The incoming mon does not act this round — the
	 * player gets a fresh command menu, FireRed-style.
	 */
	function sendNextEnemy(session) {
		const next = session.enemyParty.find((mon) => mon.current_hp > 0);
		session.enemy = next;
		session.enemyActivePosition = next.position;
		session.enemyNeedsSend = false;
		session.log.push(`${session.trainerName} sent out ${next.nickname}!`);
		return {
			actor: "enemy",
			type: "enemy_send",
			position: next.position,
			pokemon: clonePokemon(next),
			remaining: session.enemyParty.filter((mon) => mon.current_hp > 0)
				.length,
		};
	}

	/** AI-selected enemy move; Struggle when everything is out of PP. */
	async function pickEnemyMove(session) {
		const move = await ai.pickMove(session.enemy, session.player);
		return move || struggleMove();
	}

	/**
	 * End-of-round burn/poison chip, in beat order, only when the round
	 * finished with both actives standing (documented simplification).
	 * Chip can faint and even decide the battle.
	 */
	function endOfRoundChip(session, firstKey) {
		if (
			session.status !== "active" ||
			session.requiresSwitch ||
			session.enemyNeedsSend
		) {
			return [];
		}
		const events = [];
		const orderKeys =
			firstKey === "enemy" ? ["enemy", "player"] : ["player", "enemy"];
		for (const side of orderKeys) {
			if (session.status !== "active") break;
			const mon = session[side];
			if (mon.current_hp <= 0) continue;
			const damage = chipDamage(mon);
			if (!damage) continue;
			mon.current_hp = Math.max(0, mon.current_hp - damage);
			session.log.push(chipLine(mon.nickname, mon.status));
			const event = {
				target: side,
				type: "status_damage",
				position: mon.position,
				nickname: mon.nickname,
				status: mon.status,
				damage,
				targetHpAfter: mon.current_hp,
				targetFainted: mon.current_hp <= 0,
			};
			events.push(event);
			if (mon.current_hp <= 0) {
				processFaint(session, side);
			}
		}
		return events;
	}

	async function resolveMove(session, action) {
		if (session.requiresSwitch) {
			throw new CampaignError(
				400,
				"Your Pokémon fainted — you must switch first"
			);
		}

		let playerMove;
		if (action.moveId === STRUGGLE_MOVE_ID) {
			if (!outOfPp(session.player)) {
				throw new CampaignError(
					400,
					"You still have PP left — Struggle is only for when every move is out"
				);
			}
			playerMove = struggleMove();
		} else {
			playerMove = session.player.moves.find(
				(m) => m.move_id === action.moveId
			);
			if (!playerMove) {
				throw new CampaignError(400, "Unknown move for this Pokémon");
			}
			if (
				typeof playerMove.current_pp === "number" &&
				playerMove.current_pp <= 0
			) {
				throw new CampaignError(
					400,
					outOfPp(session.player)
						? `${playerMove.name} has no PP left — use Struggle`
						: `${playerMove.name} has no PP left`
				);
			}
		}

		const enemyMove = await pickEnemyMove(session);

		// Priority beats speed; speeds carry stat stages and paralysis.
		const engine = getEngine();
		const playerForOrder = clonePokemon(session.player);
		playerForOrder.speed = effectiveSpeed(session.player);
		const enemyForOrder = clonePokemon(session.enemy);
		enemyForOrder.speed = effectiveSpeed(session.enemy);
		const order = await engine.turnOrder(playerForOrder, enemyForOrder, {
			priority1: movePriority(playerMove.name),
			priority2: movePriority(enemyMove.name),
		});
		// Full tie resolves in the player's favor (deterministic).
		const first = order.first === "pokemon2" ? "enemy" : "player";

		const beats =
			first === "player"
				? [
						["player", playerMove],
						["enemy", enemyMove],
				  ]
				: [
						["enemy", enemyMove],
						["player", playerMove],
				  ];

		const events = [];
		for (const [attackerKey, move] of beats) {
			events.push(...(await runBeat(session, attackerKey, move)));
			// A faint anywhere ends the round (the pending switch/send or the
			// battle result replaces the remaining beat).
			if (
				session.status !== "active" ||
				session.requiresSwitch ||
				session.enemyNeedsSend
			) {
				break;
			}
		}

		events.push(...endOfRoundChip(session, first));

		// Phase 10: a KO'd enemy with reserves is replaced right away; the
		// incoming mon does not attack until the next round.
		if (session.enemyNeedsSend) {
			events.push(sendNextEnemy(session));
		}
		return events;
	}

	async function resolveSwitch(session, action) {
		const target = session.party.find(
			(mon) => mon.position === Number(action.partyPosition)
		);
		if (!target) {
			throw new CampaignError(400, "No Pokémon at that party position");
		}
		if (target.position === session.activePosition) {
			throw new CampaignError(
				400,
				`${target.nickname} is already in battle`
			);
		}
		if (target.current_hp <= 0) {
			throw new CampaignError(
				400,
				`${target.nickname} has fainted and can't battle`
			);
		}
		if (!target.moves.length) {
			throw new CampaignError(400, `${target.nickname} has no usable moves`);
		}

		const forced = session.requiresSwitch;
		const outgoing = session.player;
		// Stat stages reset when a mon leaves the field (status persists).
		outgoing.stages = freshStages();
		const fromPosition = session.activePosition;
		session.player = target;
		session.activePosition = target.position;
		session.requiresSwitch = false;
		session.participants.add(target.position);
		session.log.push(`Go! ${target.nickname}!`);

		const events = [
			{
				actor: "player",
				type: "switch",
				fromPosition,
				toPosition: target.position,
				pokemon: clonePokemon(target),
			},
		];

		// A voluntary switch has priority but consumes the turn: the enemy
		// gets one beat against the incoming Pokémon (and the round still
		// ends with chip damage). A forced replacement after a faint is
		// free (Gen 3-style switching).
		if (!forced) {
			events.push(...(await runBeat(session, "enemy", await pickEnemyMove(session))));
			events.push(...endOfRoundChip(session, "enemy"));
			if (session.enemyNeedsSend) {
				events.push(sendNextEnemy(session));
			}
		}
		return events;
	}

	/**
	 * In-battle item use (Phase 7). Only usableInBattle items (healing) are
	 * allowed; stones and other overworld-only items are rejected before
	 * anything is consumed. The heal targets `partyPosition` when given,
	 * else the active mon, applies to session-local HP, consumes one item
	 * from the persisted inventory, and then costs the turn: the enemy gets
	 * one beat (against the active mon), like a voluntary switch.
	 */
	async function resolveItem(session, action, trainerId) {
		if (session.requiresSwitch) {
			throw new CampaignError(
				400,
				"Your Pokémon fainted — you must switch first"
			);
		}
		const inventory = getInventoryService();
		const item = inventory.getItem(action.itemId);
		if (!item) {
			throw new CampaignError(400, "Unknown item");
		}
		if (!item.usableInBattle) {
			throw new CampaignError(400, `${item.name} can't be used in battle`);
		}
		const target =
			action.partyPosition != null
				? session.party.find(
						(mon) => mon.position === Number(action.partyPosition)
				  )
				: session.player;
		if (!target) {
			throw new CampaignError(400, "No Pokémon at that party position");
		}
		if (target.current_hp <= 0) {
			throw new CampaignError(
				400,
				`${target.nickname} has fainted — potions can't revive it`
			);
		}
		if (target.current_hp >= target.max_hp) {
			throw new CampaignError(
				400,
				`${target.nickname} is already at full HP`
			);
		}

		// Persisted decrement is the atomic stock gate; nothing has been
		// applied yet when it fails, so the turn is not consumed either.
		const consumed = await inventory.consumeItem(trainerId, item.itemId);
		if (!consumed) {
			throw new CampaignError(400, `You don't have a ${item.name}`);
		}

		const healedTo = Math.min(
			target.max_hp,
			target.current_hp + Number(item.healAmount)
		);
		const amount = healedTo - target.current_hp;
		target.current_hp = healedTo;
		session.log.push(
			`Used ${item.name}! ${target.nickname} recovered ${amount} HP.`
		);

		const events = [
			{
				actor: "player",
				type: "item",
				itemId: item.itemId,
				itemName: item.name,
				position: target.position,
				nickname: target.nickname,
				amount,
				targetHpAfter: target.current_hp,
			},
		];

		// Using an item consumes the turn: one enemy beat, aimed at the
		// active mon (even when the heal went to a benched one), then the
		// round closes with chip damage.
		events.push(...(await runBeat(session, "enemy", await pickEnemyMove(session))));
		events.push(...endOfRoundChip(session, "enemy"));
		if (session.enemyNeedsSend) {
			events.push(sendNextEnemy(session));
		}
		return events;
	}

	/**
	 * Applies one already-computed XP award to a single participant: log +
	 * xp_gain/level_up events, evolution-available check, move learning, and
	 * reflecting the new level/stats onto the session mon in place.
	 */
	async function applyWinAward(session, trainerId, mon, award) {
		const events = [];
		session.log.push(`${mon.nickname} gained ${award.gained} XP!`);
		events.push({
			actor: "player",
			type: "xp_gain",
			position: mon.position,
			nickname: mon.nickname,
			amount: award.gained,
			xp: award.after.experience,
			xpToNext: award.xpToNext,
			level: award.after.level,
		});
		if (award.levelsGained > 0) {
			session.log.push(`${mon.nickname} grew to Lv ${award.after.level}!`);
			events.push({
				actor: "player",
				type: "level_up",
				position: mon.position,
				nickname: mon.nickname,
				fromLevel: award.before.level,
				level: award.after.level,
				statIncreases: award.statIncreases,
			});
			// Phase 9: if the new level meets a level-up evolution rule,
			// surface it. Evolution is NOT applied here — the trainer
			// confirms via /api/evolutions (pending list on the hub).
			try {
				const pendingEvo = await getEvolutionService().findLevelEvolution(
					mon.pokemon_id,
					award.after.level
				);
				if (pendingEvo) {
					session.log.push(`${mon.nickname} can now evolve!`);
					events.push({
						actor: "player",
						type: "evolution_available",
						position: mon.position,
						nickname: mon.nickname,
						fromPokemonId: mon.pokemon_id,
						toPokemonId: pendingEvo.evolvedPokemonId,
						requiredLevel: pendingEvo.requiredLevel,
						level: award.after.level,
					});
				}
			} catch (evoErr) {
				// Availability is a nicety; never fail the win over it.
				console.error(
					"Failed to check evolution availability:",
					evoErr.message
				);
			}
			// Move learning: learnset moves crossed by this level-up either
			// auto-learn (< 4 known) or become a pending forget-or-skip offer
			// (4 known) — moves are never silently overwritten. Idempotent
			// via the pending table's UNIQUE key; a failure never voids the win.
			try {
				const learns = await getMoveLearnService().processLevelUp({
					trainerId,
					trainerPokemonId: mon.id,
					pokemonId: mon.pokemon_id,
					fromLevel: award.before.level,
					toLevel: award.after.level,
				});
				for (const move of learns.learned) {
					session.log.push(`${mon.nickname} learned ${move.name}!`);
					events.push({
						actor: "player",
						type: "move_learned",
						position: mon.position,
						nickname: mon.nickname,
						moveId: move.move_id,
						moveName: move.name,
						moveType: move.move_type,
						level: move.level_learned,
					});
					// Keep the final session snapshot truthful (the battle is
					// over, but the client renders this state).
					if (mon.moves.length < 4) {
						mon.moves.push(sanitizeMove(move));
					}
				}
				for (const move of learns.pending) {
					session.log.push(
						`${mon.nickname} wants to learn ${move.name}!`
					);
					events.push({
						actor: "player",
						type: "move_learn_available",
						position: mon.position,
						nickname: mon.nickname,
						moveId: move.move_id,
						moveName: move.name,
						moveType: move.move_type,
						level: move.level_learned,
					});
				}
			} catch (learnErr) {
				console.error(
					"Failed to process move learning:",
					learnErr.message
				);
			}
			// Reflect the new level/stats in the final session snapshot
			// (battle HP stays as the fight left it).
			mon.level = award.after.level;
			mon.max_hp = award.after.max_hp;
			mon.attack = award.after.attack;
			mon.defense = award.after.defense;
			mon.speed = award.after.speed;
			mon.special_atk = award.after.special_atk;
			mon.special_def = award.after.special_def;
		}
		return events;
	}

	/**
	 * Grants win XP split evenly across every party mon that took the field
	 * this battle (`session.participants`), not just whoever landed the
	 * finishing blow. Multi-enemy battles (Phase 10) pay XP for the whole
	 * beaten party — gain formula is 6 × (sum of enemy party levels) — and
	 * that total is what gets divided; any remainder from the division goes
	 * to the earliest participants (by party position) so no XP is lost to
	 * rounding.
	 */
	async function grantWinXp(session, trainerId) {
		const totalEnemyLevels = session.enemyParty.reduce(
			(sum, mon) => sum + mon.level,
			0
		);
		const totalGain = xpGainForWin({ level: totalEnemyLevels });
		const participants = session.party.filter(
			(mon) => mon.id != null && session.participants.has(mon.position)
		);
		if (!participants.length) return [];

		const share = Math.floor(totalGain / participants.length);
		const remainder = totalGain - share * participants.length;

		const events = [];
		for (const [index, mon] of participants.entries()) {
			const gained = share + (index < remainder ? 1 : 0);
			if (gained <= 0) continue;
			const award = await getXpService().awardWinXp({
				trainerId,
				pokemonRowId: mon.id,
				gained,
			});
			if (!award) continue;
			events.push(...(await applyWinAward(session, trainerId, mon, award)));
		}
		return events;
	}

	/**
	 * Full-restore rule: a boss-tier win (gym_boss/champion/legendary — same
	 * set that can offer a reward) or ANY loss fully heals the whole party's
	 * HP and PP, like a Pokémon Center visit. A regular trainer win instead
	 * carries battle damage/PP forward as-is (only leveling grows HP). Runs
	 * once per session, before the HP/PP persistence below, so the healed
	 * values are what get written and what the client sees in the response.
	 */
	function fullHealPartyIfEarned(session) {
		if (session.status === "active" || session.fullHealApplied) return false;
		session.fullHealApplied = true;
		const earnsFullHeal =
			session.status === "lost" ||
			(session.status === "won" && OFFER_BATTLE_TYPES.has(session.battleType));
		if (!earnsFullHeal) return false;
		for (const mon of session.party) {
			// Revives fainted mons too, Pokémon Center-style — a loss shouldn't
			// leave the party unable to fight when they return to the hub.
			mon.current_hp = mon.max_hp;
			for (const move of mon.moves) {
				if (typeof move.max_pp === "number") move.current_pp = move.max_pp;
			}
		}
		return true;
	}

	/**
	 * Persists the party's end-of-battle HP once per session (win AND loss)
	 * through the hpStore. Mons without a DB row id are skipped, and a
	 * fainted mon's 0 HP is persisted too (it stays fainted outside battle
	 * unless healed) — a store failure never breaks the battle result.
	 */
	async function persistHpOnBattleEnd(session) {
		if (session.status === "active" || session.hpPersisted) return;
		session.hpPersisted = true;
		const entries = session.party
			.filter((mon) => mon.id != null)
			.map((mon) => ({ trainerPokemonId: mon.id, currentHp: mon.current_hp }));
		if (!entries.length) return;
		try {
			await getHpStore().saveHp(entries);
		} catch (err) {
			console.error("Failed to persist HP after battle:", err.message);
		}
	}

	/**
	 * Persists the party's end-of-battle PP once per session (win AND loss)
	 * through the ppStore. Moves without tracked PP (legacy fixtures) and
	 * mons without a DB row id are skipped; a store failure never breaks
	 * the battle result.
	 */
	async function persistPpOnBattleEnd(session) {
		if (session.status === "active" || session.ppPersisted) return;
		session.ppPersisted = true;
		const entries = [];
		for (const mon of session.party) {
			if (mon.id == null) continue;
			for (const move of mon.moves) {
				if (
					move.move_id > 0 &&
					typeof move.current_pp === "number" &&
					typeof move.max_pp === "number"
				) {
					entries.push({
						trainerPokemonId: mon.id,
						moveId: move.move_id,
						currentPp: move.current_pp,
					});
				}
			}
		}
		if (!entries.length) return;
		try {
			await getPpStore().savePp(entries);
		} catch (err) {
			console.error("Failed to persist PP after battle:", err.message);
		}
	}

	// Win/loss record for trainer profiles. Best-effort, once per session:
	// a history write failure must never break the battle response.
	async function recordResultOnBattleEnd(session, trainerId) {
		if (session.status === "active" || session.historyRecorded) return;
		session.historyRecorded = true;
		try {
			await getHistoryStore().record({
				trainerId: Number(trainerId),
				opponent: session.trainerName,
				result: session.status === "won" ? "Win" : "Loss",
			});
		} catch (err) {
			console.error("Failed to record battle result:", err.message);
		}
	}

	async function performAction(trainerId, { sessionId, action }) {
		const session = getOwnedSession(trainerId, sessionId);
		if (session.status !== "active") {
			throw new CampaignError(409, "Battle session is already finished");
		}
		if (session.busy) {
			throw new CampaignError(409, "A battle action is already resolving");
		}
		if (
			!action ||
			!["move", "switch", "item"].includes(action.type)
		) {
			throw new CampaignError(400, "Unsupported action type");
		}

		session.busy = true;
		try {
			const events =
				action.type === "switch"
					? await resolveSwitch(session, action)
					: action.type === "item"
					? await resolveItem(session, action, trainerId)
					: await resolveMove(session, action);

			session.updatedAt = new Date(clock()).toISOString();

			// Win-path order (documented): battle beats resolve above, then
			// progress completeBattle → XP award → coin award → boss reward
			// offer. XP, coins, and rewards are all gated on the first-time
			// completion.
			let progress;
			let reward;
			if (session.status === "won") {
				wonBattles.add(
					winKey(trainerId, session.level, session.battleNumber)
				);
				if (!session.progressAwarded) {
					try {
						progress = await getProgressService().completeBattle(
							trainerId,
							{
								level: session.level,
								battleNumber: session.battleNumber,
							}
						);
						session.progressAwarded = true;
					} catch (err) {
						// Session stays won; the client can recover through the
						// session-gated POST /api/campaign/progress/complete-battle.
						console.error(
							"Failed to award progress after win:",
							err.message
						);
					}
				}
				// XP exactly once, and only for a first-time completion:
				// replayed battles (alreadyCompleted) and losses never grant
				// XP. If progress persistence failed above, XP is skipped too
				// (documented limitation — the recovery endpoint does not
				// re-run rewards).
				if (progress && !progress.alreadyCompleted && !session.xpAwarded) {
					try {
						const xpEvents = await grantWinXp(session, trainerId);
						session.xpAwarded = true;
						events.push(...xpEvents);
					} catch (xpErr) {
						console.error(
							"Failed to award XP after win:",
							xpErr.message
						);
					}
				}
				// Coins (Phase 8): flat award (boss pays more) on the
				// first-time completion only — same idempotency gate as XP,
				// so replays and losses never pay.
				if (
					progress &&
					!progress.alreadyCompleted &&
					!session.coinsAwarded
				) {
					try {
						const award = await getWalletService().awardWinCoins({
							trainerId,
							battleType: session.battleType,
						});
						session.coinsAwarded = true;
						session.log.push(`Got ${award.amount} coins!`);
						events.push({
							actor: "player",
							type: "coins",
							amount: award.amount,
							balance: award.balance,
						});
					} catch (coinErr) {
						console.error(
							"Failed to award coins after win:",
							coinErr.message
						);
					}
				}
				// Boss reward offer (Phase 6, extended in Phase 10): only
				// boss-type battles can create offers — gym_boss (levels
				// 1–8), champion (level 9 final), legendary (each level 10
				// battle). rewardService additionally matches the type
				// against the level pool's `source`, so elite_four wins and
				// road trainers never create offers. First-time completion
				// only, one-time per battle (DB UNIQUE).
				if (
					OFFER_BATTLE_TYPES.has(session.battleType) &&
					progress &&
					!progress.alreadyCompleted &&
					!session.rewardOffered
				) {
					try {
						reward = await getRewardService().createOfferForWin({
							trainerId,
							level: session.level,
							battleNumber: session.battleNumber,
							sessionId: session.sessionId,
							battleType: session.battleType,
						});
						session.rewardOffered = true;
					} catch (rewardErr) {
						// Progress + XP stand; the offer is simply absent and
						// GET /api/rewards/pending returns null (documented
						// limitation — no retry hook).
						console.error(
							"Failed to create reward offer:",
							rewardErr.message
						);
					}
				}
			}

			// Boss win / any loss: full-heal the party before it's persisted.
			if (fullHealPartyIfEarned(session)) {
				session.log.push("Your party was fully healed!");
				events.push({ actor: "player", type: "party_full_heal" });
			}
			await persistHpOnBattleEnd(session);
			// Phase 14: PP persists at battle end — after a win AND a loss.
			await persistPpOnBattleEnd(session);
			await recordResultOnBattleEnd(session, trainerId);

			return {
				state: toPublicState(session),
				events,
				...(progress ? { progress } : {}),
				...(reward ? { reward } : {}),
			};
		} finally {
			session.busy = false;
		}
	}

	function getSession(trainerId, sessionId) {
		const session = getOwnedSession(trainerId, sessionId);
		return { state: toPublicState(session) };
	}

	function hasWonBattle(trainerId, level, battleNumber) {
		return wonBattles.has(winKey(trainerId, level, battleNumber));
	}

	return {
		startBattle,
		performAction,
		getSession,
		hasWonBattle,
	};
}

const defaultService = createBattleSessionService();

module.exports = {
	startBattle: defaultService.startBattle,
	performAction: defaultService.performAction,
	getSession: defaultService.getSession,
	hasWonBattle: defaultService.hasWonBattle,
	createBattleSessionService,
	createMemoryPpStore,
	createMemoryHpStore,
	createMemoryHistoryStore,
	snapshotPokemon,
	STRUGGLE_MOVE_ID,
};
