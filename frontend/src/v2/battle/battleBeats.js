/**
 * Pure event → beat planner. Turns one server battle event into an ordered
 * list of plain-data steps; useBattle just runs them. Keeping the sequencing
 * here (no React, no timers) makes it testable.
 *
 * Step shapes:
 *   { say }                       text line (awaited: waits for it to paint)
 *   { wait }                      pause, ms (collapsed under reduced motion)
 *   { turn }                      "player" | "enemy" | "none"
 *   { fx, patch }                 per-side animation flags
 *   { replaceFx, entering }       reset a side's flags (fresh send-out)
 *   { mon, patch }                patch the displayed Pokémon on a side
 *   { setMon, pokemon }           replace the displayed Pokémon on a side
 *   { enemyFainted, position }    mark the old enemy fainted, new one active
 *   { stage }                     stage-wide effects (flash, shake, projectile, impact)
 *   { stageClear, keys, after }   clear stage keys after `after` ms (not awaited)
 *   { tick, amount, id }          floating damage number on a side
 *   { sfx }                       sound cue name (see sfx.js)
 *
 * planEvent returns { steps, view } where view is the next { player, enemy }
 * the rest of the round should see (switches and HP changes land there).
 */
import { TYPE_COLORS } from "../../utils/typeColors.js";
import { getImpactTier, getMoveAnimCategory, hitResultLines } from "./battleAnimation.js";
import { STATUS_APPLIED_TEXT, CANT_MOVE_TEXT, STATUS_END_TEXT, STATUS_HURT_TEXT, statChangeText, rewardLine } from "./battleText.js";

export const DRAIN_MS = 600;

const other = (side) => (side === "player" ? "enemy" : "player");
const withFallback = (table, key, fallback) => table[key] || fallback;

function faintSteps(side, nickname) {
	return [{ fx: side, patch: { fainted: true } }, { sfx: "faint" }, { say: `${nickname} fainted!` }, { wait: 700 }];
}

/** HP drop not caused by a move (burn/poison chip, recoil). */
function chipSteps(side, text, hpAfter, nickname, fainted) {
	return [
		{ say: text },
		{ fx: side, patch: { hit: "normal" } },
		{ sfx: "hitWeak" },
		{ mon: side, patch: { current_hp: hpAfter } },
		{ wait: DRAIN_MS },
		{ fx: side, patch: { hit: null } },
		...(fainted ? faintSteps(side, nickname) : []),
	];
}

export function planEvent(event, view, { trainerName = "The trainer", nextId = () => Date.now() } = {}) {
	const state = { view: { ...view } };
	const patch = (side, p) => {
		state.view = { ...state.view, [side]: { ...state.view[side], ...p } };
		return { mon: side, patch: p };
	};
	const replace = (side, pokemon) => {
		state.view = { ...state.view, [side]: { ...pokemon } };
	};
	// Steps are built first (patch() runs while building), then the view is read.
	const done = (steps) => ({ steps, view: state.view });

	switch (event.type) {
		case "switch":
			replace("player", event.pokemon);
			return done([
					{ turn: "none" },
					{ replaceFx: "player", entering: true },
					{ setMon: "player", pokemon: event.pokemon },
					{ sfx: "sendOut" },
					{ say: `Go! ${event.pokemon.nickname}!` },
					{ wait: 600 },
					{ fx: "player", patch: { entering: false } },
				]);

		case "enemy_send":
			replace("enemy", event.pokemon);
			return done([
					{ turn: "none" },
					{ enemyFainted: view.enemy?.position, position: event.position },
					{ replaceFx: "enemy", entering: true },
					{ setMon: "enemy", pokemon: event.pokemon },
					{ sfx: "sendOut" },
					{ say: `${trainerName} sent out ${event.pokemon.nickname}!` },
					{ wait: 700 },
					{ fx: "enemy", patch: { entering: false } },
				]);

		case "item": {
			const steps = [{ turn: "none" }, { say: `Used ${event.itemName}! ${event.nickname} recovered ${event.amount} HP.` }];
			if (view.player?.position === event.position) {
				steps.push(
					{ fx: "player", patch: { sparkle: true } },
					{ sfx: "heal" },
					patch("player", { current_hp: event.targetHpAfter }),
					{ wait: DRAIN_MS },
					{ fx: "player", patch: { sparkle: false } }
				);
			}
			return done(steps);
		}

		case "pp_change": {
			if (event.actor !== "player") return done([]);
			const moves = (view.player?.moves || []).map((m) => (m.move_id === event.moveId ? { ...m, current_pp: event.currentPp } : m));
			return done([patch("player", { moves })]);
		}

		case "level_up":
			return done([{ sfx: "levelUp" }, { say: `${event.nickname} grew to Lv. ${event.level}!` }, { levelUp: event.nickname, level: event.level }, { wait: 300 }]);

		case "xp_gain":
			return done([
				{ say: rewardLine(event, { forBattle: true }) },
				{ xp: event.position, experience: event.xp, xp_to_next: event.xpToNext, level: event.level },
				{ sfx: "exp" },
				{ wait: DRAIN_MS },
			]);

		case "coins":
		case "evolution_available":
		case "move_learned":
		case "move_learn_available":
			return done([{ say: rewardLine(event, { forBattle: true }) }, { wait: 250 }]);

		case "cant_move":
			return done([{ turn: "none" }, { say: withFallback(CANT_MOVE_TEXT, event.status, (n) => `${n} can't move!`)(event.nickname) }, { wait: 400 }]);

		case "status_applied":
			return done([
				{ sfx: "status" },
				{ say: withFallback(STATUS_APPLIED_TEXT, event.status, (n) => `${n} was afflicted!`)(event.nickname) },
				patch(event.target, { status: event.status }),
				{ wait: 300 },
			]);

		case "status_end":
			return done([
				{ say: withFallback(STATUS_END_TEXT, event.status, (n) => `${n} returned to normal!`)(event.nickname) },
				patch(event.target, { status: null }),
				{ wait: 250 },
			]);

		case "status_damage":
			patch(event.target, { current_hp: event.targetHpAfter });
			return done(
				chipSteps(
					event.target,
					withFallback(STATUS_HURT_TEXT, event.status, (n) => `${n} was hurt!`)(event.nickname),
					event.targetHpAfter,
					event.nickname,
					event.targetFainted
				)
			);

		case "recoil":
			patch(event.target, { current_hp: event.hpAfter });
			return done(chipSteps(event.target, `${event.nickname} is damaged by recoil!`, event.hpAfter, event.nickname, event.targetFainted));

		case "stat_change":
			return done([{ sfx: event.delta > 0 ? "statUp" : "statDown" }, { say: statChangeText(event) }, { wait: 250 }]);

		case "drain":
		case "heal_move":
			return done([
					{ say: event.type === "drain" ? `${event.nickname} drained energy!` : `${event.nickname} regained health!` },
					{ fx: event.target, patch: { sparkle: true } },
					{ sfx: "heal" },
					patch(event.target, { current_hp: event.hpAfter }),
					{ wait: DRAIN_MS },
					{ fx: event.target, patch: { sparkle: false } },
				]);

		default:
			return planMove(event, view, patch, done, nextId);
	}
}

function planMove(event, view, patch, done, nextId) {
	const atk = event.actor === "player" ? "player" : "enemy";
	const def = other(atk);
	const attackerName = view[atk]?.nickname;
	const defenderName = view[def]?.nickname;
	const type = String(event.moveType || "normal").toLowerCase();
	const color = TYPE_COLORS[type] || "#ffffff";
	const steps = [{ turn: atk }, { say: `${attackerName} used ${String(event.moveName || "").toUpperCase()}!` }];

	const statusLike = event.result === "status" || event.result === "heal";
	if (statusLike) {
		steps.push({ fx: atk, patch: { sparkle: true } }, { sfx: "status" }, { wait: 450 }, { fx: atk, patch: { sparkle: false } });
	} else if (getMoveAnimCategory(event.moveType) === "physical") {
		steps.push({ fx: atk, patch: { lunge: true } }, { sfx: "lunge" }, { wait: 260 }, { fx: atk, patch: { lunge: false } });
	} else {
		steps.push({ stage: { projectile: { from: atk, type, color, key: nextId() } } }, { sfx: "shot" }, { wait: 360 }, { stage: { projectile: null } });
	}

	if (event.result === "miss") return done([...steps, { sfx: "miss" }, { say: `${attackerName}'s attack missed!` }, { wait: 200 }]);
	if (event.result === "failed") {
		return done([...steps, { say: event.type_multiplier === 0 ? `It doesn't affect ${defenderName}...` : "But it failed!" }, { wait: 200 }]);
	}
	if (statusLike) return done(steps);

	const tier = getImpactTier(event.type_multiplier);
	if (tier === "none") return done([...steps, { say: `It doesn't affect ${defenderName}...` }]);

	const crit = !!event.critical_hit;
	steps.push(
		{
			stage: {
				flash: tier === "weak" ? null : color,
				critFlash: crit,
				shake: crit ? "crit" : tier,
				impact: { side: def, type, key: nextId() },
			},
		},
		{ stageClear: true, keys: ["flash", "critFlash"], after: 180 },
		{ stageClear: true, keys: ["shake"], after: 320 },
		{ stageClear: true, keys: ["impact"], after: 520 },
		{ sfx: crit ? "crit" : tier === "super" ? "hitSuper" : tier === "weak" ? "hitWeak" : "hit" },
		{ fx: def, patch: { hit: tier, crit } },
		...(event.damage > 0 ? [{ tick: def, amount: event.damage, id: nextId() }] : []),
		patch(def, { current_hp: event.targetHpAfter }),
		{ wait: DRAIN_MS },
		{ fx: def, patch: { hit: null, crit: false } },
		...hitResultLines(event).map((say) => ({ say }))
	);
	if (event.targetFainted) steps.push({ wait: 250 }, ...faintSteps(def, defenderName));
	return done(steps);
}
