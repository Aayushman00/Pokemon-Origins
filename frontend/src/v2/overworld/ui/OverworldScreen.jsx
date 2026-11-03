import React, { useCallback, useEffect, useRef, useState } from "react";
import DialogueBox from "../../ui/DialogueBox";
import { play } from "../../battle/sfx";
import { attachInput, drainEdges, snapshot } from "../engine/input";
import { createLoop } from "../engine/loop";
import { computeScale } from "../engine/scale";
import { createMapStore } from "../maps/mapStore";
import { createOverworld } from "../game/overworld";
import { createMemoryFlags } from "../game/flags";
import { createRenderer } from "../render/renderer";
import { loadAssets } from "../render/assets";
import { VIEW_H, VIEW_W } from "../constants";
import { actorPose } from "../logic/movement";
import OverworldPad from "./OverworldPad";
import { TEXT_SPEEDS, cycleTextSpeed, getTextSpeed } from "./textSpeed";
import "./overworld.css";

const START = { mapId: "test_town", x: 14, y: 12, facing: "up" };

const fetchJson = async (url) => {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
	return r.json();
};

const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Phase 1 test world: tile movement, dialogue, warps, streaming. No server state yet. */
const OverworldScreen = () => {
	const wrapRef = useRef(null);
	const canvasRef = useRef(null);
	const sessionRef = useRef(null);
	const [status, setStatus] = useState("loading");
	const [input, setInput] = useState(null);
	const [size, setSize] = useState({ cssW: VIEW_W, cssH: VIEW_H, left: 0, top: 0 });
	const [dialogue, setDialogue] = useState(null); // { pages, i }
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
				await store.loadAround(START.mapId);
				const assets = await loadAssets([...["test_town", "test_route", "test_house"].map((id) => store.get(id)).filter(Boolean)]);
				if (disposed) return;
				const game = createOverworld({
					store,
					flags: createMemoryFlags(),
					start: START,
					reducedMotion: reduced(),
					emit: (e) => {
						if (e.type === "sound") play(e.cue);
						else if (e.type === "dialogue") setDialogue({ pages: e.pages, i: 0 });
					},
				});
				const renderer = createRenderer({ canvas: canvasRef.current, assets });
				inputApi = attachInput();
				setInput(inputApi);
				loop = createLoop({
					step: () => {
						inputApi.poll();
						const snap = snapshot(inputApi.state);
						const edges = drainEdges(inputApi.state);
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
	}, [resize, debug]);

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
					{dialogue && (
						<div className="ow__dialogue">
							<DialogueBox key={`${dialogue.i}:${dialogue.pages[dialogue.i]}`} text={dialogue.pages[dialogue.i]} onAdvance={advance} charMs={TEXT_SPEEDS[speed]} />
						</div>
					)}
					{debug && hud && (
						<pre className="ow__hud" aria-hidden="true">{`${hud.tps} tps / ${hud.fps} fps  x${size.scale}  dropped ${hud.dropped}\n${hud.map} (${hud.x},${hud.y})${frame ? `\ntick ${frame.tick}  ${frame.facing}\n${frame.phase} ${frame.t}/${frame.dur} ${frame.pose}${frame.running ? " run" : ""}${frame.moving ? " MOVING" : ""}` : ""}`}</pre>
					)}
				</div>
			</div>
			<div className="ow__bar font-pixel">
				<span>Arrows/WASD walk · X run · Z/Enter talk</span>
				<button type="button" className="pixel-btn" onClick={() => setSpeed((s) => cycleTextSpeed(s))}>
					Text: {speed}
				</button>
			</div>
			{input && <OverworldPad input={input} />}
		</div>
	);
};

export default OverworldScreen;
