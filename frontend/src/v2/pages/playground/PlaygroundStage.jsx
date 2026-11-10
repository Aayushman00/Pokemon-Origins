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

const fetchJson = async (url) => {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${url}: ${r.status}`);
	return r.json();
};

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
 * The Playground map, drawn and walked exactly like the overworld: the game's
 * renderer, tile movement and input (WASD or arrows walk, Shift runs, the
 * touch pad on phones). Names and chat bubbles float over the canvas.
 */
const PlaygroundStage = ({ play, bubbles, nearIds }) => {
	const { playersRef, selfId, emitMove, roster } = play;
	const wrapRef = useRef(null);
	const canvasRef = useRef(null);
	const redrawRef = useRef(null);
	const [size, setSize] = useState({ cssW: VIEW_W, cssH: VIEW_H, left: 0, top: 0 });
	const [tags, setTags] = useState([]);
	const [input, setInput] = useState(null);
	const [status, setStatus] = useState("loading");

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

	useEffect(() => {
		let disposed = false;
		let loop;
		let inputApi;
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
				const renderer = createRenderer({ canvas: canvasRef.current, assets, playerSprite: playerSpriteFor(players.get(selfId)?.gender) });
				let last = "";
				const draw = () => {
					if (!game.player) return;
					renderer.draw(game);
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
						drainEdges(inputApi.state); // no A/B/Start actions here; walking reads the held state
						game.tick(snapshot(inputApi.state));
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
			redrawRef.current = null;
		};
	}, [selfId, playersRef, emitMove, resize]);

	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return undefined;
		const ro = new ResizeObserver(resize);
		ro.observe(wrap);
		return () => ro.disconnect();
	}, [resize]);

	const k = size.cssW / VIEW_W;
	const names = Object.fromEntries(roster.map((r) => [r.trainerId, r.name]));

	return (
		<div className="pgs">
			<div className="pgs__viewport" ref={wrapRef}>
				<div className="pgs__stage" style={{ width: size.cssW, height: size.cssH, left: size.left, top: size.top }}>
					<canvas
						ref={canvasRef}
						className="pgs__canvas pixelated"
						role="img"
						aria-label="Playground map. W A S D or the arrow keys walk, hold Shift to run, Enter opens the chat."
					/>
					{status === "loading" && <p className="pgs__msg font-pixel">Loading the park…</p>}
					{status === "error" && <p className="pgs__msg font-pixel">Could not load the park map.</p>}
					{tags.map((t) => {
						const self = t.id === selfId;
						const name = names[t.id] || "Trainer";
						const bubble = bubbles[t.id];
						return (
							<div key={t.id} className={`pgs__tag ${self ? "is-self" : ""} ${nearIds.has(t.id) ? "is-near" : ""}`} style={{ left: t.x * k, top: t.y * k }}>
								{bubble && <span className="pgs__bubble">{bubble.text}</span>}
								{self ? (
									<span className="pgs__name font-pixel">You</span>
								) : (
									<TrainerTrigger trainerId={t.id} name={name} online className="pgs__name font-pixel">
										{name}
									</TrainerTrigger>
								)}
							</div>
						);
					})}
				</div>
			</div>
			{input && <OverworldPad input={input} />}
		</div>
	);
};

export default PlaygroundStage;
