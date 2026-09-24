import React, { useEffect, useMemo, useRef, useState } from "react";
import PixelTrainer from "../../ui/PixelTrainer";
import TrainerTrigger from "../../ui/TrainerHoverCard";

const LERP = 0.25;
const CAMERA_LERP = 0.15;
const EMIT_MS = 50;
const WALK_PX_PER_S = 420;
const CLICK_SLOP = 5;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// Deterministic scenery so every visitor sees the same map.
function scenery(width, height) {
	let s = 1337;
	const rnd = () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x7fffffff;
	};
	const cx = width / 2;
	const cy = height / 2;
	const trees = [];
	for (let i = 0; i < 70; i++) {
		const x = rnd() * width;
		const y = rnd() * height;
		if (Math.hypot(x - cx, y - cy) < 380) continue; // keep the plaza open
		trees.push({ x, y, big: rnd() > 0.6 });
	}
	const flowers = [];
	for (let i = 0; i < 90; i++) flowers.push({ x: rnd() * width, y: rnd() * height, c: i % 3 });
	return { trees, flowers };
}

const Tree = ({ big }) => (
	<svg viewBox="0 0 10 12" width={big ? 60 : 44} height={big ? 72 : 53} shapeRendering="crispEdges" aria-hidden="true">
		<path fill="#2b211c" d="M3 0h4v1h2v2h1v5H9v1H6v3H4V9H1V8H0V3h1V1h2z" />
		<path fill="#3f7f37" d="M3 1h4v1h2v6H1V2h2z" />
		<path fill="#62b14f" d="M3 2h3v1h2v2H7v1H3V5H2V3h1z" />
		<path fill="#8a6236" d="M4 9h2v2H4z" />
	</svg>
);

/**
 * Overworld viewport. Camera follows you; drag the ground to look around,
 * click/tap the ground to walk there, drag your own trainer, or focus the
 * map and use arrow keys / WASD.
 */
const World = ({ play, bubbles }) => {
	const { playersRef, selfId, world, emitMove, roster } = play;
	const [, force] = useState(0);
	const viewRef = useRef(null);
	const size = useRef({ w: 800, h: 520 });
	const camera = useRef({ x: world.width / 2, y: world.height / 2 });
	const walkTo = useRef(null);
	const lastEmit = useRef(0);
	const pointer = useRef(null); // { mode: "pan" | "drag", sx, sy, camX, camY, moved }
	const keys = useRef(new Set());
	const decor = useMemo(() => scenery(world.width, world.height), [world.width, world.height]);

	const clampCam = (x, y) => {
		const hw = size.current.w / 2;
		const hh = size.current.h / 2;
		return { x: clamp(x, hw, Math.max(hw, world.width - hw)), y: clamp(y, hh, Math.max(hh, world.height - hh)) };
	};

	useEffect(() => {
		const el = viewRef.current;
		if (!el) return undefined;
		const ro = new ResizeObserver(([entry]) => {
			size.current = { w: entry.contentRect.width, h: entry.contentRect.height };
			force((n) => n + 1);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const moveSelf = (x, y, now) => {
		const me = playersRef.current.get(selfId);
		if (!me) return;
		me.x = me.targetX = clamp(x, 0, world.width);
		me.y = me.targetY = clamp(y, 0, world.height);
		if (now - lastEmit.current > EMIT_MS) {
			lastEmit.current = now;
			emitMove(me.x, me.y);
		}
	};

	useEffect(() => {
		let raf;
		let last = performance.now();
		const tick = (now) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			let changed = false;
			const me = playersRef.current.get(selfId);

			// Keyboard / click-to-walk drive your own trainer locally.
			if (me && pointer.current?.mode !== "drag") {
				let dx = 0;
				let dy = 0;
				const k = keys.current;
				if (k.has("left")) dx -= 1;
				if (k.has("right")) dx += 1;
				if (k.has("up")) dy -= 1;
				if (k.has("down")) dy += 1;
				if (dx || dy) {
					walkTo.current = null;
					const len = Math.hypot(dx, dy);
					moveSelf(me.x + (dx / len) * WALK_PX_PER_S * dt, me.y + (dy / len) * WALK_PX_PER_S * dt, now);
					changed = true;
				} else if (walkTo.current) {
					const tx = walkTo.current.x - me.x;
					const ty = walkTo.current.y - me.y;
					const dist = Math.hypot(tx, ty);
					const step = WALK_PX_PER_S * dt;
					if (dist <= step) {
						moveSelf(walkTo.current.x, walkTo.current.y, Infinity);
						walkTo.current = null;
					} else {
						moveSelf(me.x + (tx / dist) * step, me.y + (ty / dist) * step, now);
					}
					changed = true;
				}
			}

			playersRef.current.forEach((p, id) => {
				if (id === selfId) return;
				const dx = p.targetX - p.x;
				const dy = p.targetY - p.y;
				if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
					p.x += dx * LERP;
					p.y += dy * LERP;
					changed = true;
				}
			});

			if (pointer.current?.mode !== "pan" && me) {
				const want = clampCam(me.x, me.y);
				const cam = camera.current;
				if (Math.abs(want.x - cam.x) > 0.25 || Math.abs(want.y - cam.y) > 0.25) {
					camera.current = { x: cam.x + (want.x - cam.x) * CAMERA_LERP, y: cam.y + (want.y - cam.y) * CAMERA_LERP };
					changed = true;
				}
			}
			if (changed) force((n) => n + 1);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selfId, world.width, world.height]);

	const toWorld = (e) => {
		const r = viewRef.current.getBoundingClientRect();
		const cam = camera.current;
		return { x: cam.x - size.current.w / 2 + (e.clientX - r.left), y: cam.y - size.current.h / 2 + (e.clientY - r.top) };
	};

	const onPointerDown = (e) => {
		viewRef.current.setPointerCapture?.(e.pointerId);
		const onSelf = e.target.closest?.("[data-self]");
		pointer.current = {
			mode: onSelf ? "drag" : "pan",
			sx: e.clientX,
			sy: e.clientY,
			camX: camera.current.x,
			camY: camera.current.y,
			moved: false,
		};
	};

	const onPointerMove = (e) => {
		const p = pointer.current;
		if (!p) return;
		const dx = e.clientX - p.sx;
		const dy = e.clientY - p.sy;
		if (Math.hypot(dx, dy) > CLICK_SLOP) p.moved = true;
		if (!p.moved) return;
		if (p.mode === "drag") {
			const w = toWorld(e);
			walkTo.current = null;
			moveSelf(w.x, w.y, performance.now());
		} else {
			camera.current = clampCam(p.camX - dx, p.camY - dy);
		}
		force((n) => n + 1);
	};

	const onPointerUp = (e) => {
		const p = pointer.current;
		pointer.current = null;
		if (!p) return;
		if (p.mode === "drag") {
			const me = playersRef.current.get(selfId);
			if (me) emitMove(me.x, me.y);
		} else if (!p.moved) {
			walkTo.current = toWorld(e); // tap/click the ground: walk there
		}
	};

	const KEYMAP = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowUp: "up", w: "up", ArrowDown: "down", s: "down" };
	const onKeyDown = (e) => {
		const dir = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()];
		if (!dir) return;
		e.preventDefault();
		keys.current.add(dir);
	};
	const onKeyUp = (e) => {
		const dir = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()];
		if (!dir) return;
		keys.current.delete(dir);
		const me = playersRef.current.get(selfId);
		if (me && keys.current.size === 0) emitMove(me.x, me.y);
	};

	const cam = camera.current;
	const me = playersRef.current.get(selfId);
	const offX = -(cam.x - size.current.w / 2);
	const offY = -(cam.y - size.current.h / 2);
	const players = Array.from(playersRef.current.values()).sort((a, b) => a.y - b.y);
	const names = Object.fromEntries(roster.map((r) => [r.trainerId, r.name]));

	return (
		<div
			ref={viewRef}
			className="world"
			tabIndex={0}
			role="application"
			aria-label="Playground map. Use arrow keys or WASD to walk. Click the ground to walk there."
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={() => (pointer.current = null)}
			onKeyDown={onKeyDown}
			onKeyUp={onKeyUp}
			onBlur={() => keys.current.clear()}
		>
			<div className="world__map" style={{ width: world.width, height: world.height, transform: `translate3d(${offX}px, ${offY}px, 0)` }}>
				<div className="world__plaza" style={{ left: world.width / 2 - 260, top: world.height / 2 - 180 }} />
				<div className="world__path world__path--h" style={{ top: world.height / 2 - 24 }} />
				<div className="world__path world__path--v" style={{ left: world.width / 2 - 24 }} />
				{decor.flowers.map((f, i) => (
					<span key={`f${i}`} className={`flower flower--${f.c}`} style={{ left: f.x, top: f.y }} />
				))}
				{me && (
					<div
						className="earshot"
						style={{ left: me.x - world.chatRadius, top: me.y - world.chatRadius, width: world.chatRadius * 2, height: world.chatRadius * 2 }}
					/>
				)}
				{decor.trees.map((t, i) => (
					<span key={`t${i}`} className="tree" style={{ left: t.x, top: t.y, zIndex: Math.round(t.y) }}>
						<Tree big={t.big} />
					</span>
				))}
				{players.map((p) => {
					const self = p.trainerId === selfId;
					const bubble = bubbles[p.trainerId];
					return (
						<div
							key={p.trainerId}
							className={`token ${self ? "token--self" : ""}`}
							style={{ left: p.x, top: p.y, zIndex: Math.round(p.y) + 1 }}
							{...(self ? { "data-self": true } : {})}
						>
							{bubble && <span className="token__bubble read">{bubble.text}</span>}
							{self ? (
								<span className="token__tag token__tag--self">You</span>
							) : (
								<TrainerTrigger trainerId={p.trainerId} name={names[p.trainerId] || p.name} online className="token__tag">
									{names[p.trainerId] || p.name}
								</TrainerTrigger>
							)}
							<PixelTrainer gender={null} tint={p.color} size={40} />
							<span className="token__shadow" aria-hidden="true" />
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default World;
