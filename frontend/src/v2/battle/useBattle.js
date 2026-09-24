import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { api, getErrorMessage } from "../../api";
import { invalidateProfile } from "../data/profiles";
import { createMessageQueue } from "./battleMessageQueue";
import { planEvent, DRAIN_MS } from "./battleBeats";
import { play as sfx } from "./sfx";
import { rewardLine, REWARD_EVENT_TYPES } from "./battleText";

export { DRAIN_MS };
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
			sfx("sendOut");
			await say(`${state.trainerName || "The trainer"} sent out ${state.enemy.nickname}!`);
			later(() => patchFx("enemy", { entering: false }), 600);
		}
		await wait(400);
		if (myGen !== gen.current) return;
		if (state.player.current_hp > 0) {
			patchFx("player", { entering: true, hidden: false });
			sfx("sendOut");
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

	// ---- Run one server event's beats (sequencing lives in battleBeats) -----
	const runStep = async (step) => {
		if (step.say !== undefined) return say(step.say);
		if (step.wait !== undefined) return wait(step.wait);
		if (step.turn) return setTurn(step.turn);
		if (step.sfx) return sfx(step.sfx);
		if (step.fx) return patchFx(step.fx, step.patch);
		if (step.replaceFx) return setFx((prev) => ({ ...prev, [step.replaceFx]: { ...IDLE_FX, entering: !!step.entering } }));
		if (step.mon) return setSideMon(step.mon, (prev) => (prev ? { ...prev, ...step.patch } : prev));
		if (step.setMon) return setSideMon(step.setMon, () => step.pokemon);
		if (step.stage) return patchStage(step.stage);
		if (step.stageClear) {
			return later(() => patchStage(Object.fromEntries(step.keys.map((k) => [k, k === "critFlash" ? false : null]))), step.after);
		}
		if (step.tick) {
			patchFx(step.tick, { tick: { id: step.id, amount: step.amount } });
			return later(() => setFx((prev) => (prev[step.tick].tick?.id === step.id ? { ...prev, [step.tick]: { ...prev[step.tick], tick: null } } : prev)), TICK_MS);
		}
		if (step.enemyFainted !== undefined) {
			return setSession((prev) =>
				prev
					? {
							...prev,
							enemyParty: (prev.enemyParty || []).map((m) => (m.position === step.enemyFainted ? { ...m, current_hp: 0 } : m)),
							enemyActivePosition: step.position,
					}
					: prev
			);
		}
		if (step.levelUp) return setPlayer((prev) => (prev && prev.nickname === step.levelUp ? { ...prev, level: step.level } : prev));
		if (step.xp !== undefined) {
			return setPlayer((prev) =>
				prev && prev.position === step.xp ? { ...prev, experience: step.experience, xp_to_next: step.xp_to_next, level: step.level } : prev
			);
		}
		return undefined;
	};

	const playEvent = async (event, view, myGen) => {
		const { steps, view: next } = planEvent(event, view, {
			trainerName: liveRef.current.session?.trainerName || "The trainer",
		});
		Object.assign(view, next);
		for (const step of steps) {
			if (myGen !== gen.current) return;
			await runStep(step);
		}
	};

	// ---- Actions -------------------------------------------------------------
	const finish = (state, progress) => {
		invalidateProfile(trainerId);
		sfx(state.status === "won" ? "victory" : "defeat");
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
				await playEvent(event, view, myGen);
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
