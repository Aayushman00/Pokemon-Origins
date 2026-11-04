// Ambient life as pure functions of the tick: no state to save or reset, and
// every particle wraps inside the 240x160 view.
import { VIEW_H, VIEW_W } from "../constants.js";

const wrap = (v, size) => ((v % size) + size) % size;
const seeded = (i, salt) => {
	const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
	return s - Math.floor(s);
};
const list = (n, make) => Array.from({ length: n }, (_, i) => make(i, seeded(i, 1), seeded(i, 2)));

const KINDS = {
	butterflies: (t) =>
		list(4, (i, a, b) => ({
			x: wrap(a * VIEW_W + t * 0.12 + Math.sin(t / 37 + i) * 20, VIEW_W),
			y: wrap(b * VIEW_H + Math.sin(t / 23 + i * 2) * 12, VIEW_H),
			w: Math.floor(t / 8 + i) % 2 ? 3 : 1,
			h: 2,
			c: ["#fff4c4", "#f6a6b6", "#ffffff", "#f4c0f0"][i],
		})),
	leaves: (t) =>
		list(7, (i, a, b) => ({
			x: wrap(a * VIEW_W + t * 0.25 + Math.sin(t / 41 + i) * 10, VIEW_W),
			y: wrap(b * VIEW_H + t * (0.2 + a * 0.2), VIEW_H),
			w: 2,
			h: 1,
			c: i % 2 ? "#a8d060" : "#e0b860",
		})),
	fireflies: (t) =>
		list(10, (i, a, b) => ({
			x: wrap(a * VIEW_W + Math.sin(t / 53 + i) * 18, VIEW_W),
			y: wrap(b * VIEW_H + Math.cos(t / 47 + i * 3) * 14, VIEW_H),
			w: 1,
			h: 1,
			c: Math.sin(t / 19 + i * 5) > 0 ? "#fff4a0" : "#b8c860",
		})),
	rain: (t) =>
		list(44, (i, a, b) => ({
			x: wrap(a * VIEW_W - t * 1.2, VIEW_W),
			y: wrap(b * VIEW_H + t * (3.4 + a), VIEW_H),
			w: 1,
			h: 4,
			c: "rgba(190, 220, 245, 0.7)",
		})),
	snow: (t) =>
		list(36, (i, a, b) => ({
			x: wrap(a * VIEW_W + Math.sin(t / 31 + i) * 8, VIEW_W),
			y: wrap(b * VIEW_H + t * (0.35 + b * 0.4), VIEW_H),
			w: i % 3 ? 1 : 2,
			h: i % 3 ? 1 : 2,
			c: "#ffffff",
		})),
};

/** Rects for this tick, placed in the world so they stay put as `cam` pans; [] for no ambient. */
export function particles(kind, tick, cam = { x: 0, y: 0 }) {
	const make = KINDS[kind];
	const place = (v, c, size) => wrap(Math.floor(v) - Math.round(c), size);
	return make ? make(tick).map((p) => ({ ...p, x: place(p.x, cam.x, VIEW_W), y: place(p.y, cam.y, VIEW_H) })) : [];
}

/** Puffs above a chimney, offsets from its mouth. `seed` keeps neighbours out of step. */
export function smoke(tick, seed = 0) {
	return list(4, (i) => {
		const age = (tick / 150 + i / 4 + seed * 0.37) % 1;
		return {
			dx: Math.round(age * 7 + Math.sin(age * 6 + seed) * 2),
			dy: -Math.round(age * 26),
			size: 2 + Math.floor(age * 3),
			alpha: +(0.6 * (1 - age)).toFixed(2),
		};
	});
}

const TINTS = { dusk: "#ffb98e", night: "#5a68b0" };

/** Multiply colour for a map's fixed time of day, or null for plain daylight. */
export function tintFor(time) {
	return TINTS[time] || null;
}
