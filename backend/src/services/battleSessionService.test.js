const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	createBattleSessionService,
	createMemoryHistoryStore,
	snapshotPokemon,
} = require("./battleSessionService");
const {
	createProgressService,
	createMemoryStore,
} = require("./progressService");
const {
	createXpService,
	createMemoryXpStore,
	xpNeededForLevel,
} = require("./xpService");
const {
	createRewardService,
	createMemoryRewardStore,
} = require("./rewardService");
const {
	createInventoryService,
	createMemoryInventoryStore,
} = require("./inventoryService");
const {
	createWalletService,
	createMemoryWalletStore,
	STARTING_COINS,
	WIN_COINS,
	BOSS_WIN_COINS,
} = require("./walletService");
const { createBattleAi } = require("./battleAi");
const { CampaignError } = require("../campaign/errors");

function playerMon(overrides = {}) {
	return {
		id: 101,
		pokemon_id: 4,
		nickname: "Charmander",
		level: 5,
		max_hp: 40,
		current_hp: 40,
		attack: 20,
		defense: 15,
		speed: 60,
		special_atk: 18,
		special_def: 14,
		status: "Healthy",
		types: ["Fire"],
		moves: [
			{
				move_id: 33,
				name: "Tackle",
				power: 40,
				accuracy: 1,
				move_type: "Normal",
			},
			{
				move_id: 52,
				name: "Ember",
				power: 40,
				accuracy: 1,
				move_type: "Fire",
			},
		],
		...overrides,
	};
}

function enemyMon(overrides = {}) {
	return {
		pokemon_id: 19,
		nickname: "Rattata",
		level: 4,
		max_hp: 30,
		current_hp: 30,
		attack: 12,
		defense: 10,
		speed: 30,
		special_atk: 8,
		special_def: 9,
		status: "Healthy",
		types: ["Normal"],
		moves: [
			{
				move_id: 33,
				name: "Tackle",
				power: 40,
				accuracy: 100,
				move_type: "Normal",
			},
		],
		...overrides,
	};
}

/**
 * Engine stub: turn order by priority then speed (tie -> pokemon1), damage
 * from a queue of results (repeats the last entry when the queue runs dry).
 * Mirrors the Python determine_turn_order contract (Phase 14 priorities).
 */
function stubEngine(results) {
	const queue = [...results];
	return {
		calls: [],
		orderCalls: [],
		async turnOrder(p1, p2, priorities = {}) {
			this.orderCalls.push({ p1, p2, priorities });
			const pr1 = priorities.priority1 ?? 0;
			const pr2 = priorities.priority2 ?? 0;
			if (pr1 !== pr2) {
				return { first: pr1 > pr2 ? "pokemon1" : "pokemon2" };
			}
			return { first: p1.speed >= p2.speed ? "pokemon1" : "pokemon2" };
		},
		async calculateDamage(payload) {
			this.calls.push(payload);
			const next = queue.length > 1 ? queue.shift() : queue[0];
			return { ...next };
		},
	};
}

describe("snapshotPokemon gender/xp fields", () => {
	it("carries a raw.gender straight through unchanged", () => {
		const snap = snapshotPokemon(playerMon({ gender: "female" }), 1);
		assert.equal(snap.gender, "female");
	});

	it("rolls a gender when raw.gender is absent (e.g. enemy config data)", () => {
		const snap = snapshotPokemon(enemyMon({ pokemon_id: 132 }), 1); // Ditto: genderless
		assert.equal(snap.gender, "genderless");
	});

	it("keeps a player row's null gender null instead of rolling one (pre-migration rows)", () => {
		// Player-shaped raw data always has a DB id; a null gender here means
		// a real pre-migration row, not "no data" like enemy config.
		const snap = snapshotPokemon(playerMon({ id: 101, gender: null }), 1);
		assert.equal(snap.gender, null);
	});

	it("exposes experience and xp_to_next matching xpService's curve", () => {
		const snap = snapshotPokemon(playerMon({ level: 5, experience: 30 }), 1);
		assert.equal(snap.experience, 30);
		assert.equal(snap.xp_to_next, xpNeededForLevel(5));
	});

	it("defaults experience to 0 when raw.experience is absent", () => {
		const snap = snapshotPokemon(playerMon({ experience: undefined }), 1);
		assert.equal(snap.experience, 0);
	});
});

function defaultParty() {
	return [
		playerMon({ id: 101, position: 1 }),
		playerMon({
			id: 102,
			position: 2,
			pokemon_id: 7,
			nickname: "Squirtle",
			speed: 40,
			types: ["Water"],
		}),
		playerMon({
			id: 103,
			position: 3,
			pokemon_id: 1,
			nickname: "Bulbasaur",
			speed: 35,
			types: ["Grass"],
		}),
	];
}

/**
 * `trainerId` seeds the XP store rows so wins can persist XP for the
 * trainer a given test battles with.
 */
function makeService({
	party = defaultParty(),
	enemy = enemyMon(),
	// Phase 10: pass a full multi-mon enemy party; `enemy` remains the
	// single-mon legacy shape used by most tests.
	enemyParty = null,
	engine = stubEngine([{ result: "hit", damage: 5 }]),
	trainerName = "Youngster Joey",
	trainerSprite = "youngster_joey",
	trainerId = 1,
	battleType = "trainer",
	rewards,
	inventory,
	// No evolution rules by default so level-up tests don't touch the
	// real evolutionService (which would open a pokedex DB pool).
	evolution = { findLevelEvolution: async () => null },
	// Same for move learning: default to "no learnset moves crossed".
	moveLearn = { processLevelUp: async () => ({ learned: [], pending: [] }) },
	// Neutral type chart so the enemy AI never opens a pokedex DB pool;
	// random() => 0 keeps the AI deterministic (best damaging move).
	ai = createBattleAi({ chart: {}, random: () => 0 }),
	// Memory ppStore so battle-end PP persistence never opens a DB pool.
	ppStore = { savePp: async () => {} },
	// Memory battle history so win/loss recording never opens a DB pool.
	history = createMemoryHistoryStore(),
	random = () => 0,
} = {}) {
	const progress = createProgressService({
		store: createMemoryStore(),
		countBattles: () => 5,
	});
	const xpStore = createMemoryXpStore(
		party
			.filter((mon) => mon.id != null)
			.map((mon) => ({
				id: mon.id,
				trainer_id: trainerId,
				pokemon_id: mon.pokemon_id,
				nickname: mon.nickname,
				level: mon.level,
				experience: mon.experience ?? 0,
				current_hp: mon.current_hp ?? mon.max_hp,
				max_hp: mon.max_hp,
				attack: mon.attack,
				defense: mon.defense,
				speed: mon.speed,
				special_atk: mon.special_atk,
				special_def: mon.special_def,
			}))
	);
	const xp = createXpService({ store: xpStore });
	// Every win awards coins, so all tests get a memory wallet (starting
	// balance seeded for the test's trainer).
	const walletStore = createMemoryWalletStore({
		[trainerId]: STARTING_COINS,
	});
	const wallet = createWalletService({ store: walletStore });
	const service = createBattleSessionService({
		progress,
		engine,
		xp,
		wallet,
		evolution,
		moveLearn,
		ai,
		ppStore,
		history,
		...(rewards ? { rewards } : {}),
		...(inventory ? { inventory } : {}),
		random,
		getPlayerParty: async () => party,
		getEnemyBattle: async (level, battleNumber) => ({
			trainerName,
			trainerSprite,
			...(enemyParty ? { party: enemyParty } : { pokemon: enemy }),
			battleType,
		}),
	});
	return { service, progress, engine, xp, xpStore, wallet, history };
}

/**
 * Real inventory service on a memory store (real items.json catalog), for
 * battle item-action tests. `bag` maps itemId -> quantity for `trainerId`.
 */
function makeInventory(trainerId, bag) {
	const store = createMemoryInventoryStore({ [trainerId]: bag });
	const inventory = createInventoryService({ store });
	return inventory;
}

/**
 * Real reward service on memory stores with a stub pool + hydration, so the
 * boss win path is exercised end to end without a DB. `source`/`poolLevel`
 * shape the stub pool (Phase 10: champion/legendary pools).
 */
function makeRewards({
	optionCount = 3,
	source = "gym_boss",
	poolLevel = 1,
} = {}) {
	const store = createMemoryRewardStore();
	const created = [];
	const rewards = createRewardService({
		store,
		loadPool: (level) =>
			level === poolLevel
				? {
						level: poolLevel,
						source,
						optionCount,
						pool: [
							{ pokemonId: 25, level: 10 },
							{ pokemonId: 133, level: 10 },
							{ pokemonId: 66, level: 11 },
							{ pokemonId: 74, level: 11 },
						],
				  }
				: null,
		hydrateOption: async ({ pokemonId, level }) => {
			created.push(pokemonId);
			return {
				pokemon_id: pokemonId,
				nickname: `Mon${pokemonId}`,
				level,
				max_hp: 30 + level,
				current_hp: 30 + level,
				attack: 10 + level,
				defense: 10,
				speed: 12,
				special_atk: 11,
				special_def: 9,
				types: ["Normal"],
				moves: [{ move_id: 33, pp: 0 }],
			};
		},
	});
	return { rewards, store, created };
}

/** Marches a trainer's progress to the boss battle (battleNumber 5). */
async function advanceToBoss(progress, trainerId) {
	for (let battleNumber = 1; battleNumber <= 4; battleNumber++) {
		await progress.completeBattle(trainerId, { level: 1, battleNumber });
	}
}

describe("battleSessionService", () => {
	it("start rejects a non-current battle", async () => {
		const { service } = makeService();
		await assert.rejects(
			() => service.startBattle(1, { level: 1, battleNumber: 3 }),
			(err) => {
				assert.equal(err instanceof CampaignError, true);
				assert.equal(err.status, 403);
				assert.match(err.message, /Not the active battle/);
				return true;
			}
		);
		await assert.rejects(
			() => service.startBattle(1, { level: 2, battleNumber: 1 }),
			(err) => err.status === 403
		);
	});

	it("start returns authoritative party snapshots and resumes an active session", async () => {
		const { service } = makeService();
		const started = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(started.resumed, false);
		assert.equal(started.state.status, "active");
		assert.equal(started.state.trainerName, "Youngster Joey");
		assert.equal(started.state.player.current_hp, 40);
		assert.equal(started.state.enemy.current_hp, 30);
		assert.ok(started.state.player.moves.length >= 1);

		// Party snapshots: 3 mons, active is the lowest healthy position
		assert.equal(started.state.party.length, 3);
		assert.deepEqual(
			started.state.party.map((mon) => mon.position),
			[1, 2, 3]
		);
		assert.equal(started.state.activePosition, 1);
		assert.equal(started.state.requiresSwitch, false);
		assert.equal(started.state.player.position, 1);

		const again = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(again.resumed, true);
		assert.equal(again.state.sessionId, started.state.sessionId);
	});

	it("start with force:true resets an active session instead of resuming it", async () => {
		const { service } = makeService({
			engine: stubEngine([{ result: "hit", damage: 5 }]),
		});
		const started = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(started.state.enemy.current_hp, 30);

		// Deal damage so the active session's state visibly differs from a
		// fresh one.
		await service.performAction(1, {
			sessionId: started.state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const midFight = service.getSession(1, started.state.sessionId);
		assert.equal(midFight.state.enemy.current_hp, 25);

		const restarted = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
			force: true,
		});
		assert.equal(restarted.resumed, false);
		assert.notEqual(restarted.state.sessionId, started.state.sessionId);
		assert.equal(restarted.state.enemy.current_hp, 30);
		assert.equal(restarted.state.player.current_hp, 40);
		assert.equal(restarted.state.status, "active");
	});

	it("start exposes trainerSprite for trainer battles and null for legendary encounters", async () => {
		const { service } = makeService({ trainerSprite: "brock" });
		const trainerBattle = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(trainerBattle.state.trainerSprite, "brock");

		const { service: legendaryService } = makeService({
			trainerSprite: null,
			battleType: "legendary",
		});
		const legendaryBattle = await legendaryService.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(legendaryBattle.state.trainerSprite, null);
	});

	it("start rejects an empty party and an all-fainted party", async () => {
		const empty = makeService({ party: [] });
		await assert.rejects(
			() => empty.service.startBattle(1, { level: 1, battleNumber: 1 }),
			(err) => err.status === 400 && /No Pokémon found/.test(err.message)
		);

		const fainted = makeService({
			party: defaultParty().map((mon) => ({ ...mon, current_hp: 0 })),
		});
		await assert.rejects(
			() => fainted.service.startBattle(1, { level: 1, battleNumber: 1 }),
			(err) =>
				err.status === 400 && /All of your Pokémon have fainted/.test(err.message)
		);
	});

	it("start skips fainted leads and activates the first healthy position", async () => {
		const party = defaultParty();
		party[0].current_hp = 0;
		const { service } = makeService({ party });
		const { state } = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(state.activePosition, 2);
		assert.equal(state.player.nickname, "Squirtle");
		assert.equal(state.requiresSwitch, false);
	});

	it("action applies damage server-side and GET reflects it", async () => {
		const { service } = makeService({
			engine: stubEngine([{ result: "hit", damage: 7 }]),
		});
		const { state } = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(1, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		// Player is faster: player hit (enemy 30 -> 23), enemy hit (player 40 -> 33)
		assert.equal(result.state.enemy.current_hp, 23);
		assert.equal(result.state.player.current_hp, 33);
		assert.equal(result.events.length, 2);
		assert.equal(result.events[0].actor, "player");
		assert.equal(result.events[0].targetHpAfter, 23);
		assert.equal(result.events[1].actor, "enemy");
		assert.equal(result.state.status, "active");

		const fetched = service.getSession(1, state.sessionId);
		assert.equal(fetched.state.enemy.current_hp, 23);
		assert.equal(fetched.state.player.current_hp, 33);
		assert.equal(fetched.state.status, "active");
	});

	it("a miss leaves HP unchanged", async () => {
		const { service } = makeService({
			engine: stubEngine([{ result: "miss", damage: 0 }]),
		});
		const { state } = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(1, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.enemy.current_hp, 30);
		assert.equal(result.state.player.current_hp, 40);
		assert.equal(result.events[0].result, "miss");
		assert.equal(result.state.status, "active");
	});

	it("rejects invalid moves and unsupported action types", async () => {
		const { service } = makeService();
		const { state } = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		await assert.rejects(
			() =>
				service.performAction(1, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 999 },
				}),
			(err) => err.status === 400 && /Unknown move/.test(err.message)
		);
		await assert.rejects(
			() =>
				service.performAction(1, {
					sessionId: state.sessionId,
					action: { type: "bag" },
				}),
			(err) => err.status === 400 && /Unsupported action/.test(err.message)
		);
	});

	it("win completes progress exactly once and grants XP once", async () => {
		const { service, progress, xpStore, wallet, history } = makeService({
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 7,
		});
		const { state } = await service.startBattle(7, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(7, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		// One-shot: the enemy never gets a beat; XP then coins follow
		assert.equal(result.events.length, 3);
		assert.equal(result.events[0].targetFainted, true);
		assert.equal(result.events[1].type, "xp_gain");
		assert.equal(result.events[1].amount, 24); // enemy level 4 × 6
		assert.equal(result.events[1].nickname, "Charmander");
		assert.equal(result.events[1].level, 5); // 24 XP < 60 threshold
		assert.equal(result.events[2].type, "coins");
		assert.equal(result.events[2].amount, WIN_COINS);
		assert.equal(result.events[2].balance, STARTING_COINS + WIN_COINS);
		assert.equal(await wallet.getBalance(7), STARTING_COINS + WIN_COINS);
		assert.equal(result.state.progressAwarded, true);
		assert.equal(result.progress.current_battle, 2);
		assert.equal(service.hasWonBattle(7, 1, 1), true);
		assert.deepEqual(history.rows, [
			{ trainerId: 7, opponent: "Youngster Joey", result: "Win" },
		]);

		// XP persisted exactly once to the active mon's row
		const savedRow = await xpStore.getMon(7, 101);
		assert.equal(savedRow.experience, 24);
		assert.equal(savedRow.level, 5);

		// Acting on the finished session is rejected, progress unchanged
		await assert.rejects(
			() =>
				service.performAction(7, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 33 },
				}),
			(err) => err.status === 409
		);
		const after = await progress.getProgress(7);
		assert.equal(after.current_battle, 2);
		const rowAfterReplay = await xpStore.getMon(7, 101);
		assert.equal(rowAfterReplay.experience, 24); // still granted once

		// Replaying complete for the same battle stays idempotent
		const replay = await progress.completeBattle(7, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(replay.alreadyCompleted, true);
		assert.equal(replay.current_battle, 2);
	});

	it("a level-up crosses the threshold, persists, and is reported as events", async () => {
		const party = defaultParty();
		party[0].experience = 36; // 36 + 24 = 60 = level 5 threshold
		const { service, xpStore } = makeService({
			party,
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 23,
		});
		const { state } = await service.startBattle(23, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(23, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		assert.equal(result.events.length, 4); // move, xp, level_up, coins
		assert.equal(result.events[1].type, "xp_gain");
		assert.equal(result.events[1].level, 6);
		assert.equal(result.events[3].type, "coins");
		assert.equal(result.events[2].type, "level_up");
		assert.equal(result.events[2].fromLevel, 5);
		assert.equal(result.events[2].level, 6);
		assert.deepEqual(result.events[2].statIncreases, {
			max_hp: 5,
			attack: 2,
			defense: 2,
			speed: 1,
			special_atk: 2,
			special_def: 2,
		});
		// Final session snapshot reflects the new level
		assert.equal(result.state.player.level, 6);

		const saved = await xpStore.getMon(23, 101);
		assert.equal(saved.level, 6);
		assert.equal(saved.experience, 0);
		assert.equal(saved.max_hp, 45);
		assert.equal(saved.current_hp, 45);
		assert.equal(saved.attack, 22);
		assert.equal(saved.defense, 17);
		assert.equal(saved.speed, 61);
	});

	it("a level-up that meets an evolution rule emits evolution_available", async () => {
		const party = defaultParty();
		party[0].experience = 36; // levels 5 -> 6 on this win
		const seen = [];
		const { service } = makeService({
			party,
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 29,
			evolution: {
				// Phase 9 rule stub: this species evolves at level 6
				findLevelEvolution: async (pokemonId, level) => {
					seen.push([pokemonId, level]);
					return level >= 6
						? { evolvedPokemonId: 5, requiredLevel: 6 }
						: null;
				},
			},
		});
		const { state } = await service.startBattle(29, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(29, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		// move, xp_gain, level_up, evolution_available, coins
		assert.equal(result.events.length, 5);
		const evo = result.events.find((e) => e.type === "evolution_available");
		assert.ok(evo, "expected an evolution_available event");
		assert.equal(evo.toPokemonId, 5);
		assert.equal(evo.requiredLevel, 6);
		assert.equal(evo.level, 6);
		assert.equal(evo.nickname, party[0].nickname);
		// The check used the species + post-award level
		assert.deepEqual(seen, [[party[0].pokemon_id, 6]]);
		// Evolution is NOT applied on the win path — the hub confirms it
		assert.equal(result.state.player.pokemon_id, party[0].pokemon_id);
	});

	it("a level-up into a learnset level auto-learns with < 4 moves (move_learned)", async () => {
		const {
			createMoveLearnService,
			createMemoryLearnsetStore,
			createMemoryMoveStore,
		} = require("./moveLearnService");
		const party = defaultParty();
		party[0].experience = 36; // levels 5 -> 6 on this win
		// DB-side moves mirror the session snapshot's two moves.
		const moveStore = createMemoryMoveStore({
			movesByMon: {
				101: [
					{ move_id: 33, current_pp: 35 },
					{ move_id: 52, current_pp: 25 },
				],
			},
		});
		const moveLearn = createMoveLearnService({
			learnsetStore: createMemoryLearnsetStore({
				learnset: [{ pokemon_id: 4, move_id: 108, level_learned: 6 }],
				moves: {
					108: {
						name: "Smokescreen",
						power: null,
						accuracy: 100,
						pp: 20,
						move_type: "Normal",
					},
				},
			}),
			moveStore,
		});
		const { service } = makeService({
			party,
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 31,
			moveLearn,
		});
		const { state } = await service.startBattle(31, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(31, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		const learned = result.events.find((e) => e.type === "move_learned");
		assert.ok(learned, "expected a move_learned event");
		assert.equal(learned.moveId, 108);
		assert.equal(learned.moveName, "Smokescreen");
		assert.equal(learned.level, 6);
		assert.equal(learned.nickname, party[0].nickname);
		// Persisted with current_pp from Move.pp
		const rows = await moveStore.listMonMoves(101);
		assert.deepEqual(
			rows.find((r) => r.move_id === 108),
			{ move_id: 108, current_pp: 20 }
		);
		// Final session snapshot shows the new move too
		assert.ok(
			result.state.player.moves.some((m) => m.move_id === 108),
			"session snapshot includes the learned move"
		);
		assert.equal(moveStore.pendingRows.length, 0);
	});

	it("a level-up into a learnset level with 4 moves creates a pending offer (move_learn_available)", async () => {
		const {
			createMoveLearnService,
			createMemoryLearnsetStore,
			createMemoryMoveStore,
		} = require("./moveLearnService");
		const party = defaultParty();
		party[0].experience = 36; // levels 5 -> 6 on this win
		const fourMoves = [
			{ move_id: 33, current_pp: 35 },
			{ move_id: 52, current_pp: 25 },
			{ move_id: 10, current_pp: 35 },
			{ move_id: 45, current_pp: 40 },
		];
		const moveStore = createMemoryMoveStore({
			movesByMon: { 101: fourMoves.map((m) => ({ ...m })) },
		});
		const moveLearn = createMoveLearnService({
			learnsetStore: createMemoryLearnsetStore({
				learnset: [{ pokemon_id: 4, move_id: 108, level_learned: 6 }],
				moves: {
					108: {
						name: "Smokescreen",
						power: null,
						accuracy: 100,
						pp: 20,
						move_type: "Normal",
					},
				},
			}),
			moveStore,
		});
		const { service } = makeService({
			party,
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 32,
			moveLearn,
		});
		const { state } = await service.startBattle(32, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(32, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		const offer = result.events.find(
			(e) => e.type === "move_learn_available"
		);
		assert.ok(offer, "expected a move_learn_available event");
		assert.equal(offer.moveId, 108);
		assert.equal(offer.moveName, "Smokescreen");
		// Moves are untouched until the trainer resolves the offer
		assert.deepEqual(
			(await moveStore.listMonMoves(101)).map((r) => r.move_id),
			fourMoves.map((m) => m.move_id)
		);
		assert.equal(moveStore.pendingRows.length, 1);
		assert.equal(moveStore.pendingRows[0].status, "pending");
		assert.equal(moveStore.pendingRows[0].trainer_id, 32);
	});

	it("a second completion of the same battle cannot double XP or coins", async () => {
		const { service, progress, xpStore, wallet } = makeService({
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 25,
		});
		const { state } = await service.startBattle(25, {
			level: 1,
			battleNumber: 1,
		});
		// The battle gets completed out-of-band (e.g. recovery endpoint)
		// before the session win resolves.
		await progress.completeBattle(25, { level: 1, battleNumber: 1 });

		const result = await service.performAction(25, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		// completeBattle replay is idempotent -> alreadyCompleted -> no
		// XP and no coins
		assert.equal(result.progress.alreadyCompleted, true);
		assert.equal(
			result.events.some((e) => e.type === "xp_gain"),
			false
		);
		assert.equal(
			result.events.some((e) => e.type === "coins"),
			false
		);
		assert.equal(await wallet.getBalance(25), STARTING_COINS);
		const saved = await xpStore.getMon(25, 101);
		assert.equal(saved.experience, 0);
		assert.equal(saved.level, 5);

		const after = await progress.getProgress(25);
		assert.equal(after.current_battle, 2); // not double-advanced
	});

	it("all-faint loss does not advance progress and grants no XP", async () => {
		// Only the lead can fight (5 HP); the bench has already fainted,
		// so its members must not count as reserves.
		const { service, progress, xpStore, wallet, history } = makeService({
			party: [
				playerMon({
					id: 101,
					position: 1,
					speed: 10,
					current_hp: 5,
					max_hp: 40,
				}),
				playerMon({ id: 102, position: 2, nickname: "Down1", current_hp: 0 }),
				playerMon({ id: 103, position: 3, nickname: "Down2", current_hp: 0 }),
			],
			engine: stubEngine([{ result: "hit", damage: 10 }]),
			trainerId: 9,
		});
		const { state } = await service.startBattle(9, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(9, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		// Enemy is faster and one-shots the weakened player: whole party down
		assert.equal(result.state.status, "lost");
		assert.equal(result.state.requiresSwitch, false);
		assert.equal(result.events.length, 1);
		assert.equal(result.events[0].actor, "enemy");
		assert.equal(result.state.player.current_hp, 0);
		assert.equal(result.progress, undefined);
		assert.equal(service.hasWonBattle(9, 1, 1), false);
		assert.deepEqual(history.rows, [
			{ trainerId: 9, opponent: "Youngster Joey", result: "Loss" },
		]);

		// No XP and no coins on a loss
		const lead = await xpStore.getMon(9, 101);
		assert.equal(lead.experience, 0);
		assert.equal(lead.level, 5);
		assert.equal(await wallet.getBalance(9), STARTING_COINS);

		const after = await progress.getProgress(9);
		assert.equal(after.current_battle, 1);

		// A fresh start after a loss replaces the finished session
		const restarted = await service.startBattle(9, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(restarted.resumed, false);
		assert.notEqual(restarted.state.sessionId, state.sessionId);
		assert.equal(restarted.state.status, "active");
	});

	it("a faint with reserves forces a free switch, then the battle continues", async () => {
		// Slow 40 HP lead vs a one-shot enemy: enemy strikes first and KOs it
		const party = defaultParty();
		party[0].speed = 10;
		const { service, progress, xpStore } = makeService({
			party,
			engine: stubEngine([{ result: "hit", damage: 40 }]),
			trainerId: 13,
		});
		const { state } = await service.startBattle(13, {
			level: 1,
			battleNumber: 1,
		});

		const round1 = await service.performAction(13, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(round1.state.status, "active");
		assert.equal(round1.state.requiresSwitch, true);
		assert.equal(round1.events.length, 1); // player beat never happens
		assert.equal(round1.events[0].actor, "enemy");
		assert.equal(round1.events[0].targetFainted, true);

		// Moves are rejected until the player switches
		await assert.rejects(
			() =>
				service.performAction(13, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 33 },
				}),
			(err) => err.status === 400 && /must switch first/.test(err.message)
		);

		// Forced switch is free: no enemy beat follows
		const switched = await service.performAction(13, {
			sessionId: state.sessionId,
			action: { type: "switch", partyPosition: 2 },
		});
		assert.equal(switched.events.length, 1);
		assert.equal(switched.events[0].type, "switch");
		assert.equal(switched.events[0].fromPosition, 1);
		assert.equal(switched.events[0].toPosition, 2);
		assert.equal(switched.state.activePosition, 2);
		assert.equal(switched.state.requiresSwitch, false);
		assert.equal(switched.state.player.nickname, "Squirtle");
		assert.equal(switched.state.player.current_hp, 40);

		// The new active mon can attack; it is faster and one-shots the enemy
		const round2 = await service.performAction(13, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(round2.state.status, "won");
		assert.equal(round2.state.progressAwarded, true);
		const after = await progress.getProgress(13);
		assert.equal(after.current_battle, 2);

		// XP goes to the mon active at the win (Squirtle), not the fainted lead
		const xpEvent = round2.events.find((e) => e.type === "xp_gain");
		assert.equal(xpEvent.nickname, "Squirtle");
		const squirtle = await xpStore.getMon(13, 102);
		assert.equal(squirtle.experience, 24);
		const lead = await xpStore.getMon(13, 101);
		assert.equal(lead.experience, 0);
	});

	it("a voluntary switch consumes the turn: the enemy hits the incoming mon", async () => {
		const { service } = makeService();
		const { state } = await service.startBattle(15, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(15, {
			sessionId: state.sessionId,
			action: { type: "switch", partyPosition: 2 },
		});
		assert.equal(result.events.length, 2);
		assert.equal(result.events[0].type, "switch");
		assert.equal(result.events[0].fromPosition, 1);
		assert.equal(result.events[0].toPosition, 2);
		assert.equal(result.events[1].actor, "enemy");
		assert.equal(result.events[1].type, "move");

		assert.equal(result.state.activePosition, 2);
		assert.equal(result.state.player.nickname, "Squirtle");
		// The incoming mon took the hit; the previous active is untouched
		assert.equal(result.state.player.current_hp, 35);
		const byPosition = new Map(
			result.state.party.map((mon) => [mon.position, mon])
		);
		assert.equal(byPosition.get(1).current_hp, 40);
		assert.equal(byPosition.get(2).current_hp, 35);
		assert.equal(result.state.status, "active");
	});

	it("rejects switching to the active, a fainted, or an unknown position", async () => {
		const party = defaultParty();
		party[2].current_hp = 0;
		const { service } = makeService({ party });
		const { state } = await service.startBattle(17, {
			level: 1,
			battleNumber: 1,
		});

		await assert.rejects(
			() =>
				service.performAction(17, {
					sessionId: state.sessionId,
					action: { type: "switch", partyPosition: 1 },
				}),
			(err) => err.status === 400 && /already in battle/.test(err.message)
		);
		await assert.rejects(
			() =>
				service.performAction(17, {
					sessionId: state.sessionId,
					action: { type: "switch", partyPosition: 3 },
				}),
			(err) => err.status === 400 && /has fainted/.test(err.message)
		);
		await assert.rejects(
			() =>
				service.performAction(17, {
					sessionId: state.sessionId,
					action: { type: "switch", partyPosition: 9 },
				}),
			(err) =>
				err.status === 400 &&
				/No Pokémon at that party position/.test(err.message)
		);
	});

	it("cannot act on or read another trainer's session", async () => {
		const { service } = makeService();
		const { state } = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		await assert.rejects(
			() =>
				service.performAction(2, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 33 },
				}),
			(err) => err.status === 403 && /Not your battle session/.test(err.message)
		);
		assert.throws(
			() => service.getSession(2, state.sessionId),
			(err) => err.status === 403
		);
		assert.throws(
			() => service.getSession(1, "missing-session"),
			(err) => err.status === 404
		);
	});

	it("rejects a second action while one is still resolving", async () => {
		let release;
		const gate = new Promise((resolve) => {
			release = resolve;
		});
		const engine = {
			async turnOrder(p1, p2) {
				return { first: "pokemon1" };
			},
			async calculateDamage() {
				await gate;
				return { result: "hit", damage: 1 };
			},
		};
		const { service } = makeService({ engine });
		const { state } = await service.startBattle(1, {
			level: 1,
			battleNumber: 1,
		});
		const firstAction = service.performAction(1, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		// Let the first action reach the engine before spamming a second
		await new Promise((resolve) => setImmediate(resolve));
		await assert.rejects(
			() =>
				service.performAction(1, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 33 },
				}),
			(err) => err.status === 409 && /already resolving/.test(err.message)
		);
		release();
		const result = await firstAction;
		assert.equal(result.state.enemy.current_hp, 29);
	});

	it("skips the second beat when the first striker wins the round", async () => {
		// Enemy faster, but misses; player then lands a knockout
		const party = defaultParty();
		party[0].speed = 10;
		const { service } = makeService({
			party,
			engine: stubEngine([
				{ result: "miss", damage: 0 },
				{ result: "hit", damage: 40 },
			]),
			trainerId: 11,
		});
		const { state } = await service.startBattle(11, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(11, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const moveEvents = result.events.filter((e) => e.type === "move");
		assert.equal(moveEvents.length, 2);
		assert.equal(moveEvents[0].actor, "enemy");
		assert.equal(moveEvents[0].result, "miss");
		assert.equal(moveEvents[1].actor, "player");
		assert.equal(moveEvents[1].targetFainted, true);
		assert.equal(result.state.status, "won");
	});

	it("a gym_boss win creates a one-time 3-option reward offer (XP still granted)", async () => {
		const { rewards } = makeRewards();
		const { service, progress, xpStore, wallet } = makeService({
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 31,
			battleType: "gym_boss",
			rewards,
		});
		await advanceToBoss(progress, 31);

		const { state } = await service.startBattle(31, {
			level: 1,
			battleNumber: 5,
		});
		const result = await service.performAction(31, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");

		// Reward offer in the win response, bound to this battle
		assert.ok(result.reward);
		assert.equal(result.reward.level, 1);
		assert.equal(result.reward.battleNumber, 5);
		assert.equal(result.reward.source, "gym_boss");
		assert.equal(result.reward.options.length, 3);
		const first = result.reward.options[0];
		assert.ok(first.optionId);
		assert.ok(first.pokemon_id);
		assert.ok(first.max_hp > 0);
		assert.ok(Array.isArray(first.types));
		// Options are distinct picks from the pool
		const ids = result.reward.options.map((o) => o.pokemon_id);
		assert.equal(new Set(ids).size, 3);

		// XP and progress still land exactly once alongside the offer
		assert.equal(
			result.events.filter((e) => e.type === "xp_gain").length,
			1
		);
		const row = await xpStore.getMon(31, 101);
		assert.equal(row.experience, 24);
		assert.equal(result.progress.alreadyCompleted, false);

		// Boss win pays the boss coin award, exactly once
		const coinEvents = result.events.filter((e) => e.type === "coins");
		assert.equal(coinEvents.length, 1);
		assert.equal(coinEvents[0].amount, BOSS_WIN_COINS);
		assert.equal(await wallet.getBalance(31), STARTING_COINS + BOSS_WIN_COINS);

		// The offer is fetchable as pending afterwards
		const pending = await rewards.getPendingOffer(31);
		assert.equal(pending.offerId, result.reward.offerId);
	});

	it("a non-boss win does not create a reward offer", async () => {
		const { rewards } = makeRewards();
		const { service } = makeService({
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 32,
			rewards, // battleType stays "trainer"
		});
		const { state } = await service.startBattle(32, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(32, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		assert.equal(result.reward, undefined);
		assert.equal(await rewards.getPendingOffer(32), null);
	});

	it("a replayed boss completion creates no offer and no XP", async () => {
		const { rewards } = makeRewards();
		const { service, progress, xpStore } = makeService({
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 33,
			battleType: "gym_boss",
			rewards,
		});
		await advanceToBoss(progress, 33);
		const { state } = await service.startBattle(33, {
			level: 1,
			battleNumber: 5,
		});
		// Battle 5 completes out-of-band before the session win resolves
		await progress.completeBattle(33, { level: 1, battleNumber: 5 });

		const result = await service.performAction(33, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		assert.equal(result.progress.alreadyCompleted, true);
		assert.equal(result.reward, undefined);
		assert.equal(await rewards.getPendingOffer(33), null);
		const row = await xpStore.getMon(33, 101);
		assert.equal(row.experience, 0);
	});

	// --- Enemy multi-Pokémon parties (Phase 10) ---

	it("sends the next enemy mon on faint and wins only after all faint", async () => {
		const enemyParty = [
			enemyMon({
				nickname: "Geodude",
				pokemon_id: 74,
				max_hp: 10,
				current_hp: 10,
				level: 4,
				speed: 10,
			}),
			enemyMon({
				nickname: "Onix",
				pokemon_id: 95,
				max_hp: 20,
				current_hp: 20,
				level: 6,
				speed: 15,
			}),
		];
		const { service, xpStore } = makeService({
			enemyParty,
			engine: stubEngine([{ result: "hit", damage: 10 }]),
			trainerId: 61,
			trainerName: "Brock",
		});
		const { state } = await service.startBattle(61, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(state.enemyParty.length, 2);
		assert.equal(state.enemyActivePosition, 1);
		assert.equal(state.enemy.nickname, "Geodude");

		// Player (speed 60) KOs Geodude; the enemy beat is skipped and Onix
		// comes out in the same response without attacking this round.
		const first = await service.performAction(61, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(first.state.status, "active");
		assert.equal(first.events.filter((e) => e.type === "move").length, 1);
		const send = first.events.find((e) => e.type === "enemy_send");
		assert.ok(send, "enemy_send event after the faint");
		assert.equal(send.pokemon.nickname, "Onix");
		assert.equal(send.remaining, 1);
		assert.equal(first.state.enemy.nickname, "Onix");
		assert.equal(first.state.enemyActivePosition, 2);
		assert.equal(
			first.state.enemyParty.find((m) => m.position === 1).current_hp,
			0
		);
		// Free send-out: the player took no damage this round
		assert.equal(first.state.player.current_hp, 40);

		// Round 2: Onix takes 10 (20 -> 10) and strikes back
		const second = await service.performAction(61, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(second.state.status, "active");
		assert.equal(second.state.enemy.current_hp, 10);
		assert.equal(second.state.player.current_hp, 30);

		// Round 3: Onix faints — now the battle is won; win XP covers the
		// whole beaten party: 6 × (4 + 6) = 60, exactly the level 5
		// threshold (12 × 5), so the mon levels up with an empty buffer.
		const third = await service.performAction(61, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(third.state.status, "won");
		const xpEvent = third.events.find((e) => e.type === "xp_gain");
		assert.equal(xpEvent.amount, 60);
		const row = await xpStore.getMon(61, 101);
		assert.equal(row.level, 6);
		assert.equal(row.experience, 0);
	});

	it("champion and legendary wins create offers and pay boss coins", async () => {
		for (const [trainerId, battleType] of [
			[62, "champion"],
			[63, "legendary"],
		]) {
			const { rewards } = makeRewards({ source: battleType });
			const { service, wallet } = makeService({
				engine: stubEngine([{ result: "hit", damage: 30 }]),
				trainerId,
				battleType,
				rewards,
			});
			const { state } = await service.startBattle(trainerId, {
				level: 1,
				battleNumber: 1,
			});
			const result = await service.performAction(trainerId, {
				sessionId: state.sessionId,
				action: { type: "move", moveId: 33 },
			});
			assert.equal(result.state.status, "won");
			assert.ok(result.reward, `${battleType} win creates an offer`);
			assert.equal(result.reward.source, battleType);
			assert.equal(result.reward.options.length, 3);
			const coins = result.events.find((e) => e.type === "coins");
			assert.equal(coins.amount, BOSS_WIN_COINS);
			assert.equal(
				await wallet.getBalance(trainerId),
				STARTING_COINS + BOSS_WIN_COINS
			);
		}
	});

	it("an elite_four win creates no offer but pays boss coins (Phase 11)", async () => {
		// The level 9 pool has source "champion" — E4 wins must not draw it.
		const { rewards } = makeRewards({ source: "champion" });
		const { service, wallet } = makeService({
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			trainerId: 64,
			battleType: "elite_four",
			rewards,
		});
		const { state } = await service.startBattle(64, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(64, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		assert.equal(result.reward, undefined);
		assert.equal(await rewards.getPendingOffer(64), null);
		const coins = result.events.find((e) => e.type === "coins");
		assert.equal(coins.amount, BOSS_WIN_COINS);
		assert.equal(
			await wallet.getBalance(64),
			STARTING_COINS + BOSS_WIN_COINS
		);
	});

	it("a potion heals the active mon, costs the turn, and consumes one item", async () => {
		const party = defaultParty();
		party[0].current_hp = 10; // max 40
		const inventory = makeInventory(41, { 1: 2 }); // 2x Potion
		const { service } = makeService({
			party,
			inventory,
			trainerId: 41,
			engine: stubEngine([{ result: "hit", damage: 5 }]),
		});
		const { state } = await service.startBattle(41, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(41, {
			sessionId: state.sessionId,
			action: { type: "item", itemId: 1 },
		});

		assert.equal(result.events.length, 2);
		const [itemEvent, enemyBeat] = result.events;
		assert.equal(itemEvent.type, "item");
		assert.equal(itemEvent.itemName, "Potion");
		assert.equal(itemEvent.position, 1);
		assert.equal(itemEvent.amount, 20);
		assert.equal(itemEvent.targetHpAfter, 30);
		// The item costs the turn: the enemy gets its beat
		assert.equal(enemyBeat.type, "move");
		assert.equal(enemyBeat.actor, "enemy");
		assert.equal(result.state.player.current_hp, 25); // 10 +20 -5
		assert.equal(result.state.status, "active");
		assert.equal(await inventory.getQuantity(41, 1), 1);
	});

	it("a stone is rejected in battle before anything is consumed", async () => {
		const party = defaultParty();
		party[0].current_hp = 10;
		const inventory = makeInventory(42, { 3: 1 }); // Fire Stone
		const { service } = makeService({ party, inventory, trainerId: 42 });
		const { state } = await service.startBattle(42, {
			level: 1,
			battleNumber: 1,
		});
		await assert.rejects(
			() =>
				service.performAction(42, {
					sessionId: state.sessionId,
					action: { type: "item", itemId: 3 },
				}),
			(err) =>
				err.status === 400 && /can't be used in battle/.test(err.message)
		);
		// No turn passed and the stone is still owned
		const after = service.getSession(42, state.sessionId);
		assert.equal(after.state.player.current_hp, 10);
		assert.equal(after.state.enemy.current_hp, 30);
		assert.equal(await inventory.getQuantity(42, 3), 1);
	});

	it("battle items reject full HP, empty stock, and unknown items", async () => {
		const inventory = makeInventory(43, { 1: 1 });
		const { service } = makeService({ inventory, trainerId: 43 });
		const { state } = await service.startBattle(43, {
			level: 1,
			battleNumber: 1,
		});
		await assert.rejects(
			() =>
				service.performAction(43, {
					sessionId: state.sessionId,
					action: { type: "item", itemId: 1 },
				}),
			(err) => err.status === 400 && /already at full HP/.test(err.message)
		);
		assert.equal(await inventory.getQuantity(43, 1), 1); // not consumed

		const hurt = defaultParty();
		hurt[0].current_hp = 10;
		const emptyInventory = makeInventory(44, {});
		const second = makeService({
			party: hurt,
			inventory: emptyInventory,
			trainerId: 44,
		});
		const started = await second.service.startBattle(44, {
			level: 1,
			battleNumber: 1,
		});
		await assert.rejects(
			() =>
				second.service.performAction(44, {
					sessionId: started.state.sessionId,
					action: { type: "item", itemId: 1 },
				}),
			(err) => err.status === 400 && /don't have/.test(err.message)
		);
		await assert.rejects(
			() =>
				second.service.performAction(44, {
					sessionId: started.state.sessionId,
					action: { type: "item", itemId: 999 },
				}),
			(err) => err.status === 400 && /Unknown item/.test(err.message)
		);
	});

	it("a benched mon can be healed; the enemy still hits the active mon", async () => {
		const party = defaultParty();
		party[1].current_hp = 10; // Squirtle at position 2 (max 40)
		const inventory = makeInventory(45, { 1: 1 });
		const { service } = makeService({
			party,
			inventory,
			trainerId: 45,
			engine: stubEngine([{ result: "hit", damage: 5 }]),
		});
		const { state } = await service.startBattle(45, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(45, {
			sessionId: state.sessionId,
			action: { type: "item", itemId: 1, partyPosition: 2 },
		});
		assert.equal(result.events[0].position, 2);
		assert.equal(result.events[0].targetHpAfter, 30);
		const byPosition = new Map(
			result.state.party.map((mon) => [mon.position, mon])
		);
		assert.equal(byPosition.get(2).current_hp, 30); // healed on the bench
		assert.equal(byPosition.get(1).current_hp, 35); // enemy hit the active
		assert.equal(result.state.activePosition, 1);
	});

	it("items are blocked while a forced switch is pending", async () => {
		const party = defaultParty();
		party[0].current_hp = 5;
		party[0].speed = 10; // enemy (speed 30) strikes first
		const inventory = makeInventory(46, { 1: 1 });
		const { service } = makeService({
			party,
			inventory,
			trainerId: 46,
			engine: stubEngine([{ result: "hit", damage: 40 }]),
		});
		const { state } = await service.startBattle(46, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(46, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.requiresSwitch, true);

		await assert.rejects(
			() =>
				service.performAction(46, {
					sessionId: state.sessionId,
					action: { type: "item", itemId: 1 },
				}),
			(err) => err.status === 400 && /must switch first/.test(err.message)
		);
		assert.equal(await inventory.getQuantity(46, 1), 1);
	});

	// ---- Battle fidelity (Phase 14): PP, Struggle, priority, statuses, ----
	// ---- stages, abilities, PP persistence --------------------------------

	function ppMoves() {
		return [
			{
				move_id: 33,
				name: "Tackle",
				power: 40,
				accuracy: 1,
				move_type: "Normal",
				pp: 2,
			},
			{
				move_id: 52,
				name: "Ember",
				power: 40,
				accuracy: 1,
				move_type: "Fire",
				pp: 5,
			},
		];
	}

	it("PP decrements on use (pp_change) and a 0-PP move is rejected", async () => {
		const party = [playerMon({ id: 101, position: 1, moves: ppMoves() })];
		const { service } = makeService({
			party,
			trainerId: 71,
			engine: stubEngine([{ result: "hit", damage: 2 }]),
		});
		const { state } = await service.startBattle(71, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(state.player.moves[0].current_pp, 2);
		assert.equal(state.player.moves[0].max_pp, 2);
		assert.equal(state.mustStruggle, false);

		const round1 = await service.performAction(71, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const ppEvent = round1.events.find((e) => e.type === "pp_change");
		assert.deepEqual(
			{ actor: ppEvent.actor, moveId: ppEvent.moveId, currentPp: ppEvent.currentPp },
			{ actor: "player", moveId: 33, currentPp: 1 }
		);
		assert.equal(
			round1.state.player.moves.find((m) => m.move_id === 33).current_pp,
			1
		);

		await service.performAction(71, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		// Tackle is now at 0 PP; Ember still has PP so Struggle is refused too.
		await assert.rejects(
			() =>
				service.performAction(71, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 33 },
				}),
			(err) => err.status === 400 && /has no PP left/.test(err.message)
		);
		await assert.rejects(
			() =>
				service.performAction(71, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: -1 },
				}),
			(err) => err.status === 400 && /still have PP left/.test(err.message)
		);
	});

	it("with every move at 0 PP the player must Struggle (typeless recoil)", async () => {
		const party = [
			playerMon({
				id: 101,
				position: 1,
				moves: [
					{
						move_id: 33,
						name: "Tackle",
						power: 40,
						accuracy: 1,
						move_type: "Normal",
						pp: 5,
						current_pp: 0,
					},
				],
			}),
		];
		const engine = stubEngine([
			{ result: "hit", damage: 8, recoil_fraction: 0.25 },
			{ result: "hit", damage: 3 },
		]);
		const { service } = makeService({ party, trainerId: 72, engine });
		const { state } = await service.startBattle(72, {
			level: 1,
			battleNumber: 1,
		});
		assert.equal(state.mustStruggle, true);

		await assert.rejects(
			() =>
				service.performAction(72, {
					sessionId: state.sessionId,
					action: { type: "move", moveId: 33 },
				}),
			(err) => err.status === 400 && /use Struggle/.test(err.message)
		);

		const result = await service.performAction(72, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: -1 },
		});
		const struggleEvent = result.events.find((e) => e.type === "move");
		assert.equal(struggleEvent.moveId, -1);
		assert.equal(struggleEvent.moveName, "Struggle");
		// No pp_change for Struggle.
		assert.equal(
			result.events.some((e) => e.type === "pp_change"),
			false
		);
		const recoil = result.events.find((e) => e.type === "recoil");
		assert.equal(recoil.target, "player");
		assert.equal(recoil.damage, 2); // 1/4 of 8
		// 40 - 2 recoil - 3 enemy hit
		assert.equal(result.state.player.current_hp, 35);
		assert.equal(result.state.mustStruggle, true);
	});

	it("move priority beats speed in turn order", async () => {
		const party = [
			playerMon({
				id: 101,
				position: 1,
				speed: 10, // much slower than the enemy's 30
				moves: [
					{
						move_id: 98,
						name: "Quick-attack",
						power: 40,
						accuracy: 1,
						move_type: "Normal",
						pp: 30,
					},
				],
			}),
		];
		const engine = stubEngine([{ result: "hit", damage: 4 }]);
		const { service } = makeService({ party, trainerId: 73, engine });
		const { state } = await service.startBattle(73, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(73, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 98 },
		});
		// move_meta.json gives Quick-attack +1 vs Tackle 0.
		assert.equal(engine.orderCalls[0].priorities.priority1, 1);
		assert.equal(engine.orderCalls[0].priorities.priority2, 0);
		const firstMove = result.events.find((e) => e.type === "move");
		assert.equal(firstMove.actor, "player");
	});

	it("paralysis quarters effective speed and can skip the turn", async () => {
		const engine = stubEngine([
			{ result: "hit", damage: 5 },
			{ result: "hit", damage: 5, status_effect_applied: "par" },
		]);
		// random() => 0 makes the round-2 paralysis gate always block.
		const { service } = makeService({ trainerId: 74, engine });
		const { state } = await service.startBattle(74, {
			level: 1,
			battleNumber: 1,
		});
		const round1 = await service.performAction(74, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const applied = round1.events.find((e) => e.type === "status_applied");
		assert.equal(applied.target, "player");
		assert.equal(applied.status, "par");
		assert.equal(round1.state.player.status, "par");

		const round2 = await service.performAction(74, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		// Effective speed 60 -> 15, so the enemy (30) now goes first…
		assert.equal(engine.orderCalls[1].p1.speed, 15);
		assert.equal(round2.events.find((e) => e.type === "move").actor, "enemy");
		// …and full paralysis blocked the player's beat entirely.
		const blocked = round2.events.find((e) => e.type === "cant_move");
		assert.equal(blocked.actor, "player");
		assert.equal(blocked.status, "par");
	});

	it("burn chips 1/8 max HP at end of round and rides the engine payload", async () => {
		const engine = stubEngine([
			{ result: "hit", damage: 5 },
			{ result: "hit", damage: 5, status_effect_applied: "brn" },
		]);
		const { service } = makeService({ trainerId: 75, engine });
		const { state } = await service.startBattle(75, {
			level: 1,
			battleNumber: 1,
		});
		const round1 = await service.performAction(75, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const chip = round1.events.find((e) => e.type === "status_damage");
		assert.equal(chip.target, "player");
		assert.equal(chip.status, "brn");
		assert.equal(chip.damage, 5); // floor(40/8)
		// 40 - 5 (enemy hit) - 5 (burn chip)
		assert.equal(round1.state.player.current_hp, 30);

		// The next engine call carries the burn so damage math can halve it.
		await service.performAction(75, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(engine.calls[2].attacker.status, "brn");
	});

	it("sleep blocks 1-4 attempts and wakes on the counter hitting zero", async () => {
		const engine = stubEngine([
			{ result: "hit", damage: 5 },
			{ result: "hit", damage: 5, status_effect_applied: "slp" },
			{ result: "hit", damage: 5 },
			{ result: "hit", damage: 5 },
			{ result: "hit", damage: 5 },
		]);
		// random() => 0 rolls exactly 1 blocked sleep turn.
		const { service } = makeService({ trainerId: 76, engine });
		const { state } = await service.startBattle(76, {
			level: 1,
			battleNumber: 1,
		});
		const round1 = await service.performAction(76, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(round1.state.player.status, "slp");

		const round2 = await service.performAction(76, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(round2.events[0].type, "cant_move");
		assert.equal(round2.events[0].status, "slp");
		// Only the enemy attacked this round.
		assert.equal(
			round2.events.filter((e) => e.type === "move").length,
			1
		);

		const round3 = await service.performAction(76, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(round3.events[0].type, "status_end");
		assert.equal(round3.events[0].status, "slp");
		assert.equal(round3.events[0].reason, "wake");
		// Awake again: the player's move landed this round.
		assert.equal(
			round3.events.filter((e) => e.type === "move")[0].actor,
			"player"
		);
		assert.equal(round3.state.player.status, null);
	});

	it("a Fire-type hit thaws a frozen target", async () => {
		const enemy = enemyMon({
			moves: [
				{
					move_id: 52,
					name: "Ember",
					power: 40,
					accuracy: 100,
					move_type: "Fire",
				},
			],
		});
		const engine = stubEngine([
			{ result: "hit", damage: 5 },
			{ result: "hit", damage: 5, status_effect_applied: "frz" },
			{ result: "hit", damage: 5 },
		]);
		// random() => 0.5 keeps the 20% thaw roll failing (0.5 >= 0.2).
		const { service } = makeService({
			trainerId: 77,
			enemy,
			engine,
			random: () => 0.5,
		});
		const { state } = await service.startBattle(77, {
			level: 1,
			battleNumber: 1,
		});
		const round1 = await service.performAction(77, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(round1.state.player.status, "frz");

		const round2 = await service.performAction(77, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		// Frozen solid on the player's beat, then Ember thawed it.
		assert.equal(round2.events[0].type, "cant_move");
		assert.equal(round2.events[0].status, "frz");
		const thaw = round2.events.find((e) => e.type === "status_end");
		assert.equal(thaw.reason, "fire_thaw");
		assert.equal(round2.state.player.status, null);
	});

	it("stat stages raise, clamp at +6, reset on switch — status persists", async () => {
		const engine = stubEngine([
			{
				result: "status",
				stat_changes: [{ stat: "atk", delta: 6, target: "self" }],
			},
			{ result: "hit", damage: 3, status_effect_applied: "brn" },
			{
				result: "status",
				stat_changes: [{ stat: "atk", delta: 2, target: "self" }],
			},
			{ result: "hit", damage: 3 },
		]);
		const { service } = makeService({ trainerId: 78, engine });
		const { state } = await service.startBattle(78, {
			level: 1,
			battleNumber: 1,
		});

		const round1 = await service.performAction(78, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const raise = round1.events.find((e) => e.type === "stat_change");
		assert.deepEqual(
			{ target: raise.target, stat: raise.stat, stage: raise.stage, failed: raise.failed },
			{ target: "player", stat: "atk", stage: 6, failed: false }
		);
		assert.equal(round1.state.player.stages.atk, 6);
		assert.equal(round1.state.player.status, "brn");

		const round2 = await service.performAction(78, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const clamped = round2.events.find((e) => e.type === "stat_change");
		assert.equal(clamped.failed, true);
		assert.equal(round2.state.player.stages.atk, 6);

		// Voluntary switch: the outgoing mon keeps its burn, loses its stages.
		const round3 = await service.performAction(78, {
			sessionId: state.sessionId,
			action: { type: "switch", partyPosition: 2 },
		});
		const benched = round3.state.party.find((mon) => mon.position === 1);
		assert.equal(benched.stages.atk, 0);
		assert.equal(benched.status, "brn");
	});

	it("Static-style ability verdicts paralyze the attacker; drain heals it", async () => {
		const party = defaultParty();
		party[0].current_hp = 20;
		const engine = stubEngine([
			{ result: "hit", damage: 10, drain_fraction: 0.5 },
			{ result: "hit", damage: 5, attacker_status_applied: "par" },
		]);
		const { service } = makeService({ party, trainerId: 79, engine });
		const { state } = await service.startBattle(79, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(79, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		const drain = result.events.find((e) => e.type === "drain");
		assert.equal(drain.target, "player");
		assert.equal(drain.amount, 5); // half of 10
		// Static paralyzed the ENEMY (it attacked into the ability).
		const applied = result.events.find((e) => e.type === "status_applied");
		assert.equal(applied.target, "enemy");
		assert.equal(result.state.enemy.status, "par");
		// 20 + 5 drain - 5 enemy hit
		assert.equal(result.state.player.current_hp, 20);
	});

	it("snapshots carry ability and stages into the engine payload", async () => {
		const party = [
			playerMon({
				id: 101,
				position: 1,
				ability: { id: 9, name: "Static" },
			}),
		];
		const engine = stubEngine([{ result: "hit", damage: 2 }]);
		const { service } = makeService({ party, trainerId: 80, engine });
		const { state } = await service.startBattle(80, {
			level: 1,
			battleNumber: 1,
		});
		assert.deepEqual(state.player.ability, { id: 9, name: "Static" });
		await service.performAction(80, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(engine.calls[0].attacker.ability.name, "Static");
		assert.deepEqual(engine.calls[0].attacker.stages, {
			atk: 0,
			def: 0,
			spa: 0,
			spd: 0,
			spe: 0,
			acc: 0,
			eva: 0,
		});
		assert.equal(engine.calls[0].attacker.status, null);
	});

	it("persists player PP once on a win", async () => {
		const { createMemoryPpStore } = require("./battleSessionService");
		const ppStore = createMemoryPpStore();
		const party = [playerMon({ id: 101, position: 1, moves: ppMoves() })];
		const { service } = makeService({
			party,
			trainerId: 81,
			engine: stubEngine([{ result: "hit", damage: 30 }]),
			ppStore,
		});
		const { state } = await service.startBattle(81, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(81, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "won");
		assert.deepEqual(ppStore.saved, [
			{ trainerPokemonId: 101, moveId: 33, currentPp: 1 }, // used once
			{ trainerPokemonId: 101, moveId: 52, currentPp: 5 },
		]);
	});

	it("persists player PP on a loss too", async () => {
		const { createMemoryPpStore } = require("./battleSessionService");
		const ppStore = createMemoryPpStore();
		const party = [
			playerMon({
				id: 101,
				position: 1,
				current_hp: 5,
				speed: 10, // enemy strikes first and KOs the whole party
				moves: ppMoves(),
			}),
		];
		const { service } = makeService({
			party,
			trainerId: 82,
			engine: stubEngine([{ result: "hit", damage: 40 }]),
			ppStore,
		});
		const { state } = await service.startBattle(82, {
			level: 1,
			battleNumber: 1,
		});
		const result = await service.performAction(82, {
			sessionId: state.sessionId,
			action: { type: "move", moveId: 33 },
		});
		assert.equal(result.state.status, "lost");
		// The player never got to act: PP persists at full.
		assert.deepEqual(ppStore.saved, [
			{ trainerPokemonId: 101, moveId: 33, currentPp: 2 },
			{ trainerPokemonId: 101, moveId: 52, currentPp: 5 },
		]);
	});
});
