import React, { useCallback, useEffect, useRef, useState } from "react";
import TrainerTrigger from "../../ui/TrainerHoverCard";
import { attachInput, drainEdges, snapshot } from "../../overworld/engine/input";
import { createLoop } from "../../overworld/engine/loop";
import { computeScale } from "../../overworld/engine/scale";
import { createMapStore } from "../../overworld/maps/mapStore";
import { createRenderer } from "../../overworld/render/renderer";
import { loadAssets, playerSpriteFor } from "../../overworld/render/assets";
import { actorPixel } from "../../overworld/logic/movement";
import { computeCamera } from "../../overworld/logic/camera";
import { TILE, VIEW_H, VIEW_W } from "../../overworld/constants";
import OverworldPad from "../../overworld/ui/OverworldPad";
import { createPlaygroundGame } from "./playgroundGame";
import { EMOTES, EmoteIcon } from "./Emote";

const fetchJson = async (url) => {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
	return r.json();
};

const isTyping = (el) => !!el?.closest?.("input, textarea, select, [contenteditable=true]");
const isNight = () => document.documentElement.dataset.theme === "dark";
const calm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** What the plaza says when you walk up and press A (Space / Z). */
function spotText(kind, count, n) {
	if (kind === "board") {
		return {
			title: "Park notices",
			lines: [
				`${count} trainer${count === 1 ? "" : "s"} in the park right now.`,
				"Walk with WASD or the arrows, hold Shift to run.",
				"E opens emotes. Enter opens chat: trainers inside your dotted ring hear you.",
			],
		};
	}
	if (kind === "bench") return { title: "Bench", lines: ["You sit for a moment. The fountain sounds nice from here."] };
	const fountain = [
		"The fountain burbles away. The water is cold and clear.",
		"Coins glint at the bottom. Someone made a lot of wishes.",
		"A breeze carries the spray. It catches the light for a second.",
	];
	return { title: "Fountain", lines: [fountain[n % fountain.length]] };
}

/** Head-top anchor of every trainer on screen, in game pixels. */
function tagsOf(game) {
	const cam = computeCamera(actorPixel(game.player));
	return [game.player, ...game.npcs()]
		.map((a) => {
			const { px, py } = actorPixel(a);
			return { id: a.id, x: px + TILE / 2 - cam.x, y: py - TILE / 2 - cam.y };
		})
		.filter((t) => t.x > -24 && t.x < VIEW_W + 24 && t.y > -16 && t.y < VIEW_H + 32);
}

/**
 * Earshot, drawn over the finished frame: a faint disc and a slow dotted ring
 * of exactly the server's chat radius, centred on you. Drawn at game
 * resolution then blown up, so the dots are real pixels.
 */
function createEarshot(canvas, radius) {
	const off = document.createElement("canvas");
	off.width = VIEW_W;
	off.height = VIEW_H;
	const g = off.getContext("2d");
	const out = canvas.getContext("2d");
	const dashes = Math.round((2 * Math.PI * radius) / 3);
	return (game) => {
		const { px, py } = actorPixel(game.player);
		const cam = computeCamera({ px, py });
		const cx = px + TILE / 2 - cam.x;
		const cy = py + TILE / 2 - cam.y;
		const loud = document.activeElement?.id === "chat-input"; // brighter while you type
		g.clearRect(0, 0, VIEW_W, VIEW_H);
		g.fillStyle = `rgba(255, 255, 255, ${loud ? 0.09 : 0.045})`;
		g.beginPath();
		g.arc(cx, cy, radius, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = `rgba(255, 255, 255, ${loud ? 0.85 : 0.5})`;
		const spin = calm ? 0 : game.tickCount / 900;
		for (let i = 0; i < dashes; i++) {
			if (i % 3 === 2) continue; // two on, one off
			const a = (i / dashes) * Math.PI * 2 + spin;
			g.fillRect(Math.round(cx + radius * Math.cos(a)), Math.round(cy + radius * Math.sin(a)), 1, 1);
		}
		out.imageSmoothingEnabled = false;
		out.drawImage(off, 0, 0, VIEW_W, VIEW_H, 0, 0, canvas.width, canvas.height);
	};
}

/** Eight reactions in a ring round you. Keys 1-8 or a click picks; E or Esc closes. */
const EmoteWheel = ({ x, y, onPick }) => (
	<div className="pgs__wheel" style={{ left: x, top: y }} role="menu" aria-label="Emotes">
		{EMOTES.map((e, i) => {
			const a = (i / EMOTES.length) * Math.PI * 2 - Math.PI / 2;
			return (
				<button
					key={e.id}
					type="button"
					role="menuitem"
					className="pgs__wheel-item"
					style={{ "--dx": Math.cos(a).toFixed(3), "--dy": Math.sin(a).toFixed(3) }}
					onClick={() => onPick(e.id)}
					aria-label={`${e.label} (${i + 1})`}
					title={`${e.label} (${i + 1})`}
				>
					<EmoteIcon id={e.id} px={3} />
					<span className="pgs__wheel-key font-pixel">{i + 1}</span>
				</button>
			);
		})}
	</div>
);

/**
 * The Playground map, drawn and walked exactly like the overworld: the game's
 * renderer, tile movement and input (WASD or arrows walk, Shift runs, the
 * touch pad on phones). Names, bubbles, emotes and menus float over the canvas.
 */
const PlaygroundStage = ({ play, nearIds }) => {
	const { playersRef, selfId, emitMove, roster, bubbles, emotes, emote, world } = play;
	const wrapRef = useRef(null);
	const canvasRef = useRef(null);
	const redrawRef = useRef(null);
	const gameRef = useRef(null);
	const uiRef = useRef({ wheel: false, dialog: null });
	const countRef = useRef(roster.length);
	const [size, setSize] = useState({ cssW: VIEW_W, cssH: VIEW_H, left: 0, top: 0 });
	const [tags, setTags] = useState([]);
	const [input, setInput] = useState(null);
	const [status, setStatus] = useState("loading");
	const [wheel, setWheel] = useState(false);
	const [dialog, setDialog] = useState(null);
	countRef.current = roster.length;
	uiRef.current = { wheel, dialog };

	const resize = useCallback(() => {
		const wrap = wrapRef.current;
		const canvas = canvasRef.current;
		if (!wrap || !canvas) return;
		const s = computeScale(wrap.clientWidth, wrap.clientHeight, window.devicePixelRatio || 1);
		if (canvas.width !== s.backingW || canvas.height !== s.backingH) {
			canvas.width = s.backingW;
			canvas.height = s.backingH;
		}
		setSize({ cssW: s.cssW, cssH: s.cssH, left: s.left, top: s.top });
		redrawRef.current?.();
	}, []);

	const pick = useCallback(
		(id) => {
			emote(id);
			setWheel(false);
		},
		[emote]
	);

	useEffect(() => {
		let disposed = false;
		let loop;
		let inputApi;
		let night;
		let talks = 0;
		(async () => {
			try {
				const map = await createMapStore({ fetchJson }).load("playground");
				const assets = await loadAssets([map], { sheets: ["player", "player_f"] });
				if (disposed) return;
				// usePlayground swaps the Map on a reconnect, so read through the ref every time.
				const players = {
					get: (id) => playersRef.current.get(id),
					has: (id) => playersRef.current.has(id),
					forEach: (f) => playersRef.current.forEach(f),
				};
				const game = createPlaygroundGame({ map, selfId, players, emitMove });
				gameRef.current = game;
				game.setNight(isNight());
				night = new MutationObserver(() => game.setNight(isNight()));
				night.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
				const renderer = createRenderer({ canvas: canvasRef.current, assets, playerSprite: playerSpriteFor(players.get(selfId)?.gender) });
				const earshot = createEarshot(canvasRef.current, world.chatRadius);
				let last = "";
				const draw = () => {
					if (!game.player) return;
					renderer.draw(game);
					earshot(game);
					const next = tagsOf(game);
					const key = next.map((t) => `${t.id}:${t.x}:${t.y}`).join("|");
					if (key !== last) {
						last = key;
						setTags(next);
					}
				};
				inputApi = attachInput();
				setInput(inputApi);
				loop = createLoop({
					step: () => {
						inputApi.poll();
						const pressedA = drainEdges(inputApi.state).some((e) => e.button === "a");
						const ui = uiRef.current;
						if (ui.dialog && pressedA) setDialog(null);
						else if (!ui.dialog && !ui.wheel && pressedA) {
							const spot = game.facingSpot();
							if (spot) setDialog(spotText(spot.kind, countRef.current, talks++));
						}
						game.tick(snapshot(inputApi.state), !!(ui.dialog || ui.wheel));
					},
					render: draw,
				});
				redrawRef.current = draw;
				resize();
				loop.start();
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
			night?.disconnect();
			redrawRef.current = null;
			gameRef.current = null;
		};
	}, [selfId, playersRef, emitMove, resize, world.chatRadius]);

	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return undefined;
		const ro = new ResizeObserver(resize);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [resize]);

	// E toggles the emote wheel, 1-8 picks, Esc closes whatever is open.
	useEffect(() => {
		const onKey = (e) => {
			if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
			const { wheel: open, dialog: talking } = uiRef.current;
			if (e.key === "e" || e.key === "E") {
				if (talking || !gameRef.current?.player) return;
				e.preventDefault();
				setWheel((w) => !w);
			} else if (open && /^[1-8]$/.test(e.key)) {
				e.preventDefault();
				pick(EMOTES[Number(e.key) - 1].id);
			} else if (e.key === "Escape" && (open || talking)) {
				setWheel(false);
				setDialog(null);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [pick]);

	const k = size.cssW / VIEW_W;
	const names = Object.fromEntries(roster.map((r) => [r.trainerId, r.name]));
	const me = tags.find((t) => t.id === selfId);

	return (
		<div className="pgs">
			<div className="pgs__viewport" ref={wrapRef}>
				<div className="pgs__stage" style={{ width: size.cssW, height: size.cssH, left: size.left, top: size.top, "--k": k }}>
					<canvas
						ref={canvasRef}
						className="pgs__canvas pixelated"
						role="img"
						aria-label="Playground map. W A S D or the arrow keys walk, hold Shift to run, Space looks at things, E opens emotes, Enter opens the chat."
					/>
					{status === "loading" && <p className="pgs__msg font-pixel">Loading the park…</p>}
					{status === "error" && <p className="pgs__msg font-pixel">Could not load the park map.</p>}
					{tags.map((t) => {
						const self = t.id === selfId;
						const name = names[t.id] || "Trainer";
						const bubble = bubbles[t.id];
						const react = emotes[t.id];
						return (
							<div key={t.id} className={`pgs__tag ${self ? "is-self" : ""} ${nearIds.has(t.id) ? "is-near" : ""}`} style={{ left: t.x * k, top: t.y * k }}>
								{react && (
									<span key={react.ts} className="pgs__emote">
										<EmoteIcon id={react.emote} px={Math.max(2, Math.round(k * 0.75))} />
									</span>
								)}
								{bubble && !react && <span className="pgs__bubble">{bubble.text}</span>}
								{self ? (
									<span className="pgs__name font-pixel">You</span>
								) : (
									<TrainerTrigger trainerId={t.id} name={name} online className="pgs__name font-pixel">
										{name}
										<span className="pgs__hit" aria-hidden="true" />
									</TrainerTrigger>
								)}
							</div>
						);
					})}
					{wheel && me && <EmoteWheel x={me.x * k} y={(me.y + TILE * 0.75) * k} onPick={pick} />}
					{dialog && (
						<button type="button" className="pgs__dialog" onClick={() => setDialog(null)} aria-live="polite">
							<span className="pgs__dialog-title font-pixel">{dialog.title}</span>
							{dialog.lines.map((l) => (
								<span key={l} className="pgs__dialog-line">
									{l}
								</span>
							))}
							<span className="pgs__dialog-more" aria-hidden="true">
								▼
							</span>
						</button>
					)}
					{status === "ready" && (
						<button
							type="button"
							className={`pgs__emote-btn font-pixel ${wheel ? "is-open" : ""}`}
							onClick={() => setWheel((w) => !w)}
							aria-expanded={wheel}
							aria-label="Emotes (E)"
						>
							<EmoteIcon id="happy" px={2} />
							<kbd>E</kbd>
						</button>
					)}
				</div>
			</div>
			{input && <OverworldPad input={input} />}
		</div>
	);
};

export default PlaygroundStage;
