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

/** Screen-space rects for this tick; [] for no ambient. */
export function particles(kind, tick) {
	const make = KINDS[kind];
	return make ? make(tick).map((p) => ({ ...p, x: Math.floor(p.x), y: Math.floor(p.y) })) : [];
}

const TINTS = { dusk: "#ffb98e", night: "#5a68b0" };

/** Multiply colour for a map's fixed time of day, or null for plain daylight. */
export function tintFor(time) {
	return TINTS[time] || null;
}
