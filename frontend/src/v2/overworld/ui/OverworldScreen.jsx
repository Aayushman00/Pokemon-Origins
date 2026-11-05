import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";
import DialogueBox from "../../ui/DialogueBox";
import BattleView from "../../pages/battle/BattleView";
import RewardScreen from "../../pages/battle/RewardScreen";
import { play } from "../../battle/sfx";
import { attachInput, drainEdges, snapshot } from "../engine/input";
import { createLoop } from "../engine/loop";
import { computeScale } from "../engine/scale";
import { createMapStore } from "../maps/mapStore";
import { createOverworld } from "../game/overworld";
import { createMemoryFlags } from "../game/flags";
import { createRenderer } from "../render/renderer";
import { loadAssets, playerSpriteFor } from "../render/assets";
import { UserContext } from "../../data/user";
import { VIEW_H, VIEW_W } from "../constants";
import { actorPose } from "../logic/movement";
import OverworldPad from "./OverworldPad";
import StartMenu from "./StartMenu";
import { TEXT_SPEEDS, cycleTextSpeed, getTextSpeed } from "./textSpeed";
import "./overworld.css";

const DEFAULT_START = { mapId: "dawnbrook", x: 7, y: 7, facing: "down" };
// Dev starts reachable with ?map=<id> (maps not yet linked into the world).
const DEV_STARTS = { legend_grove: { mapId: "legend_grove", x: 8, y: 10, facing: "up" } };
const DEV_START = DEV_STARTS[new URLSearchParams(window.location.search).get("map")];

const fetchJson = async (url) => {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
	return r.json();
};

const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const fetchFlags = async () => (await api.get("/api/world/flags")).data.flags;
// A save that won't load must not lock the player out of the world.
const fetchWorld = () => api.get("/api/world/state").then((r) => r.data).catch(() => ({}));
const logFailure = (what) => (err) => console.error(`Could not ${what}:`, err);

/** Saves where the player stands, unless a puzzle is mid-solve: the door they came in by stays the save. */
const savePosition = async (game) => {
	if (game.puzzleActive) return;
	const { mapId, x, y, facing } = game.player;
	await api.post("/api/world/position", { mapId, x, y, facing }).catch(logFailure("save the position"));
};

/** The overworld: tile movement, dialogue, warps, streaming, and trainer battles over the top of it. */
const OverworldScreen = () => {
	const { user } = useContext(UserContext) || {};
	const playerSprite = playerSpriteFor(user?.gender);
	const wrapRef = useRef(null);
	const canvasRef = useRef(null);
	const sessionRef = useRef(null);
	const [place, setPlace] = useState(null);
	const [status, setStatus] = useState("loading");
	const [input, setInput] = useState(null);
	const [size, setSize] = useState({ cssW: VIEW_W, cssH: VIEW_H, left: 0, top: 0 });
	const [dialogue, setDialogue] = useState(null); // { pages, i }
	const [battle, setBattle] = useState(null); // { trainer } | { wild }, then reward: true while claiming a boss's prize
	const [menuOpen, setMenuOpen] = useState(false);
	const menuKeys = useRef(null); // the open Start menu's button handler
	const healSpot = useRef(null); // where a whiteout returns to
	const navigate = useNavigate();
	const [speed, setSpeed] = useState(getTextSpeed);
	const [hud, setHud] = useState(null);
	// Debug overlay: always in dev builds, or with ?debug elsewhere.
	const debug = typeof window !== "undefined" && (import.meta.env.DEV || new URLSearchParams(window.location.search).has("debug"));
	const [frame, setFrame] = useState(null);

	const resize = useCallback(() => {
		const wrap = wrapRef.current;
		const canvas = canvasRef.current;
		if (!wrap || !canvas) return;
		const s = computeScale(wrap.clientWidth, wrap.clientHeight, window.devicePixelRatio || 1);
		if (canvas.width !== s.backingW || canvas.height !== s.backingH) {
			canvas.width = s.backingW;
			canvas.height = s.backingH;
		}
		setSize({ cssW: s.cssW, cssH: s.cssH, left: s.left, top: s.top, scale: s.scale });
		sessionRef.current?.redraw();
	}, []);

	useEffect(() => {
		let disposed = false;
		let loop;
		let inputApi;
		let hudTimer;
		(async () => {
			try {
				const store = createMapStore({ fetchJson });
				const [flagList, save] = await Promise.all([fetchFlags(), fetchWorld()]);
				const start = DEV_START || save.position || DEFAULT_START;
				healSpot.current = save.heal || DEFAULT_START;
				await Promise.all([store.loadAround(start.mapId), store.loadAround(DEFAULT_START.mapId)]);
				// the start map, Dawnbrook (its doors reach the interior tileset wherever the save
				// starts), every map their doors / edges lead to, and the test maps
				const home = DEFAULT_START.mapId;
				const reachable = [start.mapId, ...store.neighbours(store.get(start.mapId)), home, ...store.neighbours(store.get(home)), "test_town", "test_route", "test_house"];
				const assets = await loadAssets([...new Set(reachable)].map((id) => store.get(id)).filter(Boolean));
				if (disposed) return;
				const game = createOverworld({
					store,
					flags: createMemoryFlags(flagList),
					start,
					reducedMotion: reduced(),
					encounterRoll: Math.random,
					emit: (e) => {
						if (e.type === "sound") play(e.cue);
						else if (e.type === "dialogue") setDialogue({ pages: e.pages, i: 0 });
						else if (e.type === "flag") {
							if (/^(done|story):/.test(e.flag)) api.post("/api/world/flags", { flag: e.flag }).catch(logFailure("save a story flag"));
						} else if (e.type === "mapChange") {
							if (e.reason !== "start") savePosition(game);
						} else if (e.type === "effect" && e.effect.type === "battle" && e.effect.trainer) setBattle({ trainer: e.effect.trainer });
						else if (e.type === "effect" && e.effect.type === "battle" && e.effect.table) setBattle({ wild: e.effect.table });
						else if (e.type === "effect" && e.effect.type === "heal") {
							const { mapId, x, y } = game.player;
							healSpot.current = { mapId, x, y };
							api.post("/api/world/heal", { mapId, x, y }).catch(logFailure("heal the party"));
						} else if (e.type === "effect" && e.effect.type === "shop") {
							savePosition(game).finally(() => navigate("/game/mart"));
						} else if (e.type === "effect" && e.effect.type === "solve") {
							const { leaderId, moves } = e.effect;
							api
								.post("/api/world/gym/solve", { leaderId, moves })
								.then(() => game.flags.add(`gym:${leaderId}:solved`))
								.catch((err) => console.error("Could not record the solve:", err));
						}
					},
				});
				const renderer = createRenderer({ canvas: canvasRef.current, assets, playerSprite });
				let lastPlace = null;
				inputApi = attachInput();
				setInput(inputApi);
				loop = createLoop({
					step: () => {
						inputApi.poll();
						const snap = snapshot(inputApi.state);
						const edges = drainEdges(inputApi.state);
						if (menuKeys.current) {
							for (const e of edges) menuKeys.current?.(e.button);
							return;
						}
						if (game.mode === "explore" && edges.some((e) => e.button === "start")) {
							setMenuOpen(true);
							return;
						}
						if (game.mode === "dialogue") {
							// Keyboard A already reaches the DialogueBox itself; relay pad/gamepad A as the same key.
							if (edges.some((e) => e.button === "a" && e.source !== "keyboard")) {
								window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
								window.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
							}
							return;
						}
						game.tick(snap, edges);
					},
					render: () => {
						renderer.draw(game);
						const name = game.map?.properties.mapName;
						if (name && name !== lastPlace) {
							lastPlace = name;
							setPlace({ name, id: game.tickCount });
						}
						if (debug) {
							const p = game.player;
							setFrame({ tick: game.tickCount, facing: p.facing, phase: p.phase, t: p.t, dur: p.dur, pose: actorPose(p), moving: p.moving, running: p.running });
						}
					},
				});
				sessionRef.current = { game, loop, redraw: () => renderer.draw(game) };
				game.enter();
				resize();
				loop.start();
				if (debug) {
					let prev = { ticks: 0, frames: 0, t: performance.now() };
					hudTimer = setInterval(() => {
						const now = performance.now();
						const s = loop.stats;
						const dt = (now - prev.t) / 1000;
						const p = game.player;
						setHud({ tps: Math.round((s.ticks - prev.ticks) / dt), fps: Math.round((s.frames - prev.frames) / dt), dropped: s.dropped, map: p.mapId, x: p.x, y: p.y, phase: p.phase });
						prev = { ticks: s.ticks, frames: s.frames, t: now };
					}, 500);
				}
				window.__overworld = debug ? game : undefined;
				setStatus("ready");
			} catch (e) {
				console.error(e);
				if (!disposed) setStatus("error");
			}
		})();
		return () => {
			disposed = true;
			loop?.stop();
			inputApi?.dispose();
			clearInterval(hudTimer);
			sessionRef.current = null;
			delete window.__overworld;
		};
	}, [resize, debug, playerSprite, navigate]);

	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return undefined;
		const ro = new ResizeObserver(resize);
		ro.observe(wrap);
		window.addEventListener("resize", resize);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", resize);
		};
	}, [resize]);

	const endBattle = async (lost = false) => {
		const { game } = sessionRef.current;
		try {
			for (const f of await fetchFlags()) game.flags.add(f);
		} catch (e) {
			console.error("Could not refresh flags after a battle:", e);
		}
		setBattle(null);
		if (lost) game.whiteout(healSpot.current);
		else game.endBattle();
	};

	const closeMenu = useCallback(() => setMenuOpen(false), []);
	const menuItems = useMemo(() => {
		if (!menuOpen) return [];
		const { game } = sessionRef.current;
		const go = (path) => () => savePosition(game).finally(() => navigate(path));
		const save = async () => {
			await savePosition(game);
			setMenuOpen(false);
			setPlace({ name: "Game saved", id: `saved:${game.tickCount}` });
		};
		const leave = () => {
			setMenuOpen(false);
			game.leaveRoom();
		};
		return [
			{ label: "Party", run: go("/game") },
			{ label: "Bag", run: go("/game/bag") },
			{ label: "Pokedex", run: go("/pokedex") },
			{ label: "Trainer", run: go("/trainer") },
			{ label: "Save", run: save },
			...(game.puzzleActive ? [{ label: "Leave puzzle", run: leave }] : []),
			{ label: "Close", run: () => setMenuOpen(false) },
		];
	}, [menuOpen, navigate]);

	const advance = () => {
		const d = dialogue;
		if (!d) return;
		if (d.i + 1 < d.pages.length) setDialogue({ ...d, i: d.i + 1 });
		else {
			setDialogue(null);
			sessionRef.current?.game.closeDialogue();
		}
	};

	return (
		<div className="ow">
			<div className="ow__viewport" ref={wrapRef}>
				<div className="ow__stage" style={{ width: size.cssW, height: size.cssH, left: size.left, top: size.top }}>
					<canvas ref={canvasRef} className="ow__canvas pixelated" aria-label="Overworld test map. Arrow keys or WASD to walk, X to run, Z or Enter to talk." role="img" />
					{status === "loading" && <p className="ow__msg font-pixel">Loading map…</p>}
					{status === "error" && <p className="ow__msg font-pixel">Could not load the test map.</p>}
					{place && (
						<div key={place.id} className="ow__place font-pixel" role="status">
							{place.name}
						</div>
					)}
					{dialogue && (
						<div className="ow__dialogue">
							<DialogueBox key={`${dialogue.i}:${dialogue.pages[dialogue.i]}`} text={dialogue.pages[dialogue.i]} onAdvance={advance} charMs={TEXT_SPEEDS[speed]} />
						</div>
					)}
					{menuOpen && <StartMenu items={menuItems} keys={menuKeys} onClose={closeMenu} />}
					{debug && hud && (
						<pre className="ow__hud" aria-hidden="true">{`${hud.tps} tps / ${hud.fps} fps  x${size.scale}  dropped ${hud.dropped}\n${hud.map} (${hud.x},${hud.y})${frame ? `\ntick ${frame.tick}  ${frame.facing}\n${frame.phase} ${frame.t}/${frame.dur} ${frame.pose}${frame.running ? " run" : ""}${frame.moving ? " MOVING" : ""}` : ""}`}</pre>
					)}
				</div>
			</div>
			<div className="ow__bar font-pixel">
				<span>Arrows/WASD walk · X run · Z/Enter talk · Esc menu</span>
				<button type="button" className="pixel-btn" onClick={() => sessionRef.current?.game.mode === "explore" && setMenuOpen(true)}>
					Menu
				</button>
				<button type="button" className="pixel-btn" onClick={() => setSpeed((s) => cycleTextSpeed(s))}>
					Text: {speed}
				</button>
			</div>
			{input && <OverworldPad input={input} />}
			{battle && (
				<div className="ow__battle">
					{battle.reward ? (
						<RewardScreen onDone={() => endBattle()} />
					) : (
						<BattleView
							key={battle.trainer || battle.wild}
							worldTrainer={battle.trainer}
							wild={battle.wild}
							levelName={battle.wild ? "In the tall grass" : "On the road"}
							onContinue={() => (battle.wild ? endBattle() : setBattle({ ...battle, reward: true }))}
							onLeave={() => endBattle()}
							onLost={() => endBattle(true)}
							onRun={() => endBattle()}
						/>
					)}
				</div>
			)}
		</div>
	);
};

export default OverworldScreen;
