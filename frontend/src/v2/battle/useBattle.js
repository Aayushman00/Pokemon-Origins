import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { api, getErrorMessage } from "../../api";
import { TYPE_COLORS } from "../../utils/typeColors";
import { invalidateProfile } from "../data/profiles";
import { createMessageQueue } from "./battleMessageQueue";
import { getImpactTier, getMoveAnimCategory, hitResultLines } from "./battleAnimation";
import {
	STATUS_APPLIED_TEXT,
	CANT_MOVE_TEXT,
	STATUS_END_TEXT,
	STATUS_HURT_TEXT,
	statChangeText,
	rewardLine,
	REWARD_EVENT_TYPES,
} from "./battleText";

export const DRAIN_MS = 600;
const TICK_MS = 900;
export const STRUGGLE_MOVE = { move_id: -1, name: "Struggle", move_type: "Normal" };
export const TEXT_SPEEDS = { normal: 22, fast: 8 };

const IDLE_FX = { lunge: false, hit: null, crit: false, fainted: false, tick: null, sparkle: false, entering: false, hidden: false };

/**
 * Battle controller: owns the server session (POST /api/battle/start,
 * /api/battle/action) and turns the server's event list into timed beats:
 * text → attacker motion → impact → shake → damage tick → HP drain →
 * result lines. The view reads `fx`/`stage` flags and renders; it never
 * decides battle outcomes (the server is authoritative).
 *
 * phase: encounter → intro → command ↔ (moveSelect | partySelect |
 * bagSelect | restartConfirm) → acting → … → finished; restarting.
 */
export default function useBattle({ levelNumber, battleNumber, trainerId, onBattleWon, textSpeed = "normal" }) {
	const reduce = useReducedMotion();
	const [session, setSession] = useState(null);
	const [player, setPlayer] = useState(null);
	const [enemy, setEnemy] = useState(null);
	const [phase, setPhase] = useState("loading");
	const [turn, setTurn] = useState("none");
	const [line, setLine] = useState(null);
	const [log, setLog] = useState([]);
	const [fx, setFx] = useState({ player: IDLE_FX, enemy: IDLE_FX });
	const [stage, setStage] = useState({ flash: null, critFlash: false, projectile: null, shake: null });
	const [outcome, setOutcome] = useState(null);
	const [rewards, setRewards] = useState([]);
	const [progressSave, setProgressSave] = useState("idle");
	const [bagItems, setBagItems] = useState([]);
	const [error, setError] = useState("");

	const timers = useRef([]);
	const gen = useRef(0);
	const sessionId = useRef(null);
	const reduceRef = useRef(reduce);
	reduceRef.current = reduce;
	const speedRef = useRef(textSpeed);
	speedRef.current = textSpeed;
	const liveRef = useRef({});
	liveRef.current = { session, player, enemy, phase };

	const ms = (n) => (reduce ? 0 : n);
	const wait = (n) =>
		new Promise((resolve) => {
			timers.current.push(setTimeout(resolve, reduceRef.current ? 0 : n));
		});
	const later = (fn, n) => timers.current.push(setTimeout(fn, n));

	const queueRef = useRef(null);
	if (!queueRef.current) {
		queueRef.current = createMessageQueue({
			onLine: (text) => {
				setLine(text);
				setLog((prev) => [...prev.slice(-59), text]);
			},
			// Hold each line long enough for the typewriter plus a beat to read it.
			gapMs: (text) => (reduceRef.current ? 0 : Math.max(650, text.length * TEXT_SPEEDS[speedRef.current] + 420)),
			setTimer: (fn, n) => {
				const t = setTimeout(fn, n);
				timers.current.push(t);
				return t;
			},
		});
	}
	const say = (text) => queueRef.current.push(text);
	const skipLine = useCallback(() => queueRef.current.skip(), []);

	const patchFx = (side, patch) => setFx((prev) => ({ ...prev, [side]: { ...prev[side], ...patch } }));
	const patchStage = (patch) => setStage((prev) => ({ ...prev, ...patch }));
	const setSideMon = (side, updater) => (side === "player" ? setPlayer : setEnemy)(updater);

	const resetVisuals = () => {
		timers.current.forEach(clearTimeout);
		timers.current = [];
		queueRef.current.clear();
		setFx({ player: IDLE_FX, enemy: IDLE_FX });
		setStage({ flash: null, critFlash: false, projectile: null, shake: null });
		setTurn("none");
		setLine(null);
	};

	const drainQueue = async () => {
		while (!queueRef.current.isIdle()) {
			await new Promise((r) => timers.current.push(setTimeout(r, 80)));
		}
	};

	// ---- Encounter / intro -------------------------------------------------
	const runIntro = async (state, myGen) => {
		setPhase("encounter");
		await wait(900); // transition wipe + opponent slide-in
		if (myGen !== gen.current) return;
		setPhase("intro");
		if (state.battleType === "legendary") {
			await say(`A wild ${state.enemy.nickname} appeared!`);
		} else {
			await say(`${state.trainerName || "A trainer"} wants to battle!`);
			await wait(500);
			if (myGen !== gen.current) return;
			patchFx("enemy", { hidden: false, entering: true });
			await say(`${state.trainerName || "The trainer"} sent out ${state.enemy.nickname}!`);
			later(() => patchFx("enemy", { entering: false }), 600);
		}
		await wait(400);
		if (myGen !== gen.current) return;
		if (state.player.current_hp > 0) {
			patchFx("player", { entering: true, hidden: false });
			await say(`Go! ${state.player.nickname}!`);
			await wait(600);
			patchFx("player", { entering: false });
		}
		await drainQueue();
		if (myGen !== gen.current) return;
		setLine(null);
		if (state.requiresSwitch) {
			setPhase("partySelect");
			say("Choose your next Pokémon!");
		} else {
			setPhase("command");
		}
	};

	const start = useCallback(
		async (force = false) => {
			const myGen = ++gen.current;
			resetVisuals();
			setLog([]);
			setOutcome(null);
			setRewards([]);
			setProgressSave("idle");
			setError("");
			try {
				const { data } = await api.post("/api/battle/start", {
					level: levelNumber,
					battleNumber,
					...(force ? { force: true } : {}),
				});
				if (!data?.success || !data.state) throw new Error(data?.error || "Failed to start battle");
				if (myGen !== gen.current) return;
				sessionId.current = data.state.sessionId;
				setSession(data.state);
				setPlayer(data.state.player);
				setEnemy(data.state.enemy);
				setFx({
					player: { ...IDLE_FX, hidden: true },
					enemy: { ...IDLE_FX, hidden: data.state.battleType !== "legendary" },
				});
				runIntro(data.state, myGen);
			} catch (err) {
				console.error("Error starting battle:", err.response || err.message);
				setError(getErrorMessage(err, "Could not start this battle"));
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[levelNumber, battleNumber]
	);

	useEffect(() => {
		start();
		const t = timers;
		const g = gen;
		return () => {
			g.current++;
			t.current.forEach(clearTimeout);
		};
	}, [start]);

	// ---- One server event → one beat ----------------------------------------
	const faintBeat = async (side, nickname) => {
		patchFx(side, { fainted: true });
		await say(`${nickname} fainted!`);
		await wait(700);
	};

	const chipBeat = async (side, text, hpAfter, nickname, fainted) => {
		await say(text);
		patchFx(side, { hit: "normal" });
		setSideMon(side, (prev) => (prev ? { ...prev, current_hp: hpAfter } : prev));
		await wait(DRAIN_MS);
		patchFx(side, { hit: null });
		if (fainted) await faintBeat(side, nickname);
	};

	const playEvent = async (event, view) => {
		const patchSide = (side, patch) => {
			view[side] = { ...view[side], ...patch };
			setSideMon(side, (prev) => (prev ? { ...prev, ...patch } : prev));
		};

		switch (event.type) {
			case "switch": {
				setTurn("none");
				view.player = { ...event.pokemon };
				setFx((prev) => ({ ...prev, player: { ...IDLE_FX, entering: true } }));
				setPlayer(event.pokemon);
				await say(`Go! ${event.pokemon.nickname}!`);
				await wait(600);
				patchFx("player", { entering: false });
				return;
			}
			case "enemy_send": {
				setTurn("none");
				const prevPos = view.enemy.position;
				view.enemy = { ...event.pokemon };
				setSession((prev) =>
					prev
						? {
								...prev,
								enemyParty: (prev.enemyParty || []).map((m) => (m.position === prevPos ? { ...m, current_hp: 0 } : m)),
								enemyActivePosition: event.position,
						}
						: prev
				);
				setFx((prev) => ({ ...prev, enemy: { ...IDLE_FX, entering: true } }));
				setEnemy(event.pokemon);
				await say(`${liveRef.current.session?.trainerName || "The trainer"} sent out ${event.pokemon.nickname}!`);
				await wait(700);
				patchFx("enemy", { entering: false });
				return;
			}
			case "item": {
				setTurn("none");
				await say(`Used ${event.itemName}! ${event.nickname} recovered ${event.amount} HP.`);
				if (view.player.position === event.position) {
					patchFx("player", { sparkle: true });
					patchSide("player", { current_hp: event.targetHpAfter });
					await wait(DRAIN_MS);
					patchFx("player", { sparkle: false });
				}
				return;
			}
			case "pp_change": {
				if (event.actor === "player") {
					const patch = (moves) => (moves || []).map((m) => (m.move_id === event.moveId ? { ...m, current_pp: event.currentPp } : m));
					view.player = { ...view.player, moves: patch(view.player.moves) };
					setPlayer((prev) => (prev ? { ...prev, moves: patch(prev.moves) } : prev));
				}
				return;
			}
			case "level_up": {
				await say(`${event.nickname} grew to Lv. ${event.level}!`);
				setPlayer((prev) => (prev && prev.nickname === event.nickname ? { ...prev, level: event.level } : prev));
				await wait(300);
				return;
			}
			case "xp_gain": {
				await say(rewardLine(event, { forBattle: true }));
				// Fill the EXP bar to the server's post-award buffer.
				setPlayer((prev) =>
					prev && prev.position === event.position
						? { ...prev, experience: event.xp, xp_to_next: event.xpToNext, level: event.level }
						: prev
				);
				await wait(DRAIN_MS);
				return;
			}
			case "coins":
			case "evolution_available":
			case "move_learned":
			case "move_learn_available": {
				await say(rewardLine(event, { forBattle: true }));
				await wait(250);
				return;
			}
			case "cant_move": {
				setTurn("none");
				await say((CANT_MOVE_TEXT[event.status] || ((n) => `${n} can't move!`))(event.nickname));
				await wait(400);
				return;
			}
			case "status_applied": {
				await say((STATUS_APPLIED_TEXT[event.status] || ((n) => `${n} was afflicted!`))(event.nickname));
				patchSide(event.target, { status: event.status });
				await wait(300);
				return;
			}
			case "status_end": {
				await say((STATUS_END_TEXT[event.status] || ((n) => `${n} returned to normal!`))(event.nickname));
				patchSide(event.target, { status: null });
				await wait(250);
				return;
			}
			case "status_damage": {
				view[event.target] = { ...view[event.target], current_hp: event.targetHpAfter };
				await chipBeat(
					event.target,
					(STATUS_HURT_TEXT[event.status] || ((n) => `${n} was hurt!`))(event.nickname),
					event.targetHpAfter,
					event.nickname,
					event.targetFainted
				);
				return;
			}
			case "recoil": {
				view[event.target] = { ...view[event.target], current_hp: event.hpAfter };
				await chipBeat(event.target, `${event.nickname} is damaged by recoil!`, event.hpAfter, event.nickname, event.targetFainted);
				return;
			}
			case "stat_change": {
				await say(statChangeText(event));
				await wait(250);
				return;
			}
			case "drain":
			case "heal_move": {
				await say(event.type === "drain" ? `${event.nickname} drained energy!` : `${event.nickname} regained health!`);
				patchFx(event.target, { sparkle: true });
				patchSide(event.target, { current_hp: event.hpAfter });
				await wait(DRAIN_MS);
				patchFx(event.target, { sparkle: false });
				return;
			}
			default:
				break;
		}

		// ---- A move ----
		const isPlayer = event.actor === "player";
		const atk = isPlayer ? "player" : "enemy";
		const def = isPlayer ? "enemy" : "player";
		const attackerName = view[atk].nickname;
		const defenderName = view[def].nickname;
		const color = TYPE_COLORS[String(event.moveType || "").toLowerCase()] || "#ffffff";

		setTurn(atk);
		await say(`${attackerName} used ${String(event.moveName || "").toUpperCase()}!`);

		const statusLike = event.result === "status" || event.result === "heal";
		if (statusLike) {
			patchFx(atk, { sparkle: true });
			await wait(450);
			patchFx(atk, { sparkle: false });
		} else if (getMoveAnimCategory(event.moveType) === "physical") {
			patchFx(atk, { lunge: true });
			await wait(260); // wind-up + contact frame
			patchFx(atk, { lunge: false });
		} else {
			patchStage({ projectile: { from: atk, color, key: Date.now() } });
			await wait(360);
			patchStage({ projectile: null });
		}

		if (event.result === "miss") {
			await say(`${attackerName}'s attack missed!`);
			await wait(200);
			return;
		}
		if (event.result === "failed") {
			await say(event.type_multiplier === 0 ? `It doesn't affect ${defenderName}...` : "But it failed!");
			await wait(200);
			return;
		}
		if (statusLike) return; // follow-up status/stat/heal events carry the outcome

		const tier = getImpactTier(event.type_multiplier);
		if (tier === "none") {
			await say(`It doesn't affect ${defenderName}...`);
			return;
		}

		// Impact: flash + shake + defender blink, then tick + stepped drain.
		if (!reduce) {
			if (tier !== "weak") patchStage({ flash: color });
			if (event.critical_hit) patchStage({ critFlash: true });
			patchStage({ shake: event.critical_hit ? "crit" : tier });
			later(() => patchStage({ flash: null, critFlash: false }), 180);
			later(() => patchStage({ shake: null }), 320);
		}
		view[def] = { ...view[def], current_hp: event.targetHpAfter };
		patchFx(def, { hit: tier, crit: !!event.critical_hit, tick: event.damage > 0 ? { id: Date.now(), amount: event.damage } : null });
		setSideMon(def, (prev) => ({ ...prev, current_hp: event.targetHpAfter }));
		later(() => setFx((prev) => ({ ...prev, [def]: { ...prev[def], tick: null } })), TICK_MS);
		await wait(DRAIN_MS);
		patchFx(def, { hit: null, crit: false });

		for (const text of hitResultLines(event)) await say(text);

		if (event.targetFainted) {
			await wait(250);
			await faintBeat(def, defenderName);
		}
	};

	// ---- Actions -------------------------------------------------------------
	const finish = (state, progress) => {
		invalidateProfile(trainerId);
		if (state.status === "won") {
			setOutcome({ result: "win", name: state.player.nickname });
			if (progress) {
				setProgressSave("saved");
				onBattleWon?.(progress);
			} else {
				setProgressSave("error");
			}
		} else {
			setOutcome({ result: "lose", name: state.enemy.nickname });
		}
		setPhase("finished");
	};

	const act = async (action) => {
		const myGen = gen.current;
		const { player: p, enemy: e, session: s } = liveRef.current;
		setPhase("acting");
		setLine(null);
		queueRef.current.clear();
		try {
			const { data } = await api.post("/api/battle/action", { sessionId: sessionId.current, action });
			if (!data?.success || !data.state) throw new Error(data?.error || "Battle action failed");
			const view = { player: { ...p }, enemy: { ...e } };
			for (const event of data.events || []) {
				if (myGen !== gen.current) return;
				await playEvent(event, view);
			}
			if (myGen !== gen.current) return;
			const lines = (data.events || []).filter((ev) => REWARD_EVENT_TYPES.has(ev.type)).map((ev) => rewardLine(ev));
			if (lines.length) setRewards(lines);
			await drainQueue();
			if (myGen !== gen.current) return;
			setSession(data.state);
			setPlayer(data.state.player);
			setEnemy(data.state.enemy);
			setTurn("none");
			setLine(null);
			if (data.state.status === "active") {
				setPhase(data.state.requiresSwitch ? "partySelect" : "command");
				if (data.state.requiresSwitch) say("Choose your next Pokémon!");
			} else {
				finish(data.state, data.progress);
			}
		} catch (err) {
			console.error("Battle action failed:", err.response || err.message);
			const message = getErrorMessage(err, "That action didn't go through");
			if (err.response?.status === 400) {
				// Recoverable rule rejection: say it and hand the menu back.
				say(message);
				setPhase(s?.requiresSwitch ? "partySelect" : "command");
			} else {
				setError(message);
			}
		}
	};

	const chooseMove = (move) => {
		if (!move || liveRef.current.phase === "acting") return;
		act({ type: "move", moveId: move.move_id });
	};
	const switchTo = (mon) => liveRef.current.phase !== "acting" && act({ type: "switch", partyPosition: mon.position });
	const chooseItem = (item) => liveRef.current.phase !== "acting" && act({ type: "item", itemId: item.itemId });

	const openBag = async () => {
		try {
			const { data } = await api.get("/api/inventory");
			if (!data?.success) throw new Error(data?.error || "Failed to load the bag");
			const usable = (data.items || []).filter((i) => i.usableInBattle && i.quantity > 0);
			if (!usable.length) {
				say("There's nothing in the Bag you can use in battle.");
				return;
			}
			setBagItems(usable);
			setPhase("bagSelect");
		} catch (err) {
			say(getErrorMessage(err, "Couldn't open the Bag"));
		}
	};

	const openParty = () => {
		if ((liveRef.current.session?.party?.length || 0) > 1) setPhase("partySelect");
		else say("There's no other Pokémon to switch to!");
	};

	const retrySave = async () => {
		setProgressSave("saving");
		try {
			const { data } = await api.post("/api/campaign/progress/complete-battle", { level: levelNumber, battleNumber });
			if (!data?.success || !data.progress) throw new Error(data?.error || "Failed to save progress");
			setProgressSave("saved");
			onBattleWon?.(data.progress);
		} catch (err) {
			console.error("Failed to save campaign progress:", err);
			setProgressSave("error");
		}
	};

	const restart = () => {
		setPhase("restarting");
		start(true);
	};

	return {
		session,
		player,
		enemy,
		phase,
		setPhase,
		turn,
		line,
		log,
		fx,
		stage,
		outcome,
		rewards,
		progressSave,
		bagItems,
		error,
		chooseMove,
		switchTo,
		chooseItem,
		openBag,
		openParty,
		retrySave,
		restart,
		skipLine,
		reduceMotion: reduce,
		ms,
	};
}
