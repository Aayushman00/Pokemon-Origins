// Screen transition timeline: cover the screen ('out'), swap the map, uncover ('in').
export const TRANSITION_TICKS = { iris: 24, fade: 20, none: 0 };
export const DOOR_PAUSE_TICKS = 8;

export function startTransition(kind = "fade") {
	const k = TRANSITION_TICKS[kind] === undefined ? "fade" : kind;
	return { kind: k, phase: "out", t: 0, dur: TRANSITION_TICKS[k] };
}

/** -> { tr, swap, done }; `swap` is true on the tick the screen is fully covered. */
export function tickTransition(tr) {
	if (tr.dur === 0) return { tr: { ...tr, phase: "done" }, swap: true, done: true };
	const next = { ...tr, t: tr.t + 1 };
	if (next.phase === "out" && next.t >= next.dur) return { tr: { ...next, phase: "in", t: 0 }, swap: true, done: false };
	if (next.phase === "in" && next.t >= next.dur) return { tr: { ...next, phase: "done" }, swap: false, done: true };
	return { tr: next, swap: false, done: false };
}

/** 0 = clear screen, 1 = fully covered; quantised to 8 steps for a GBA wipe look. */
export function coverage(tr) {
	if (tr.dur === 0 || tr.phase === "done") return 0;
	const p = tr.t / tr.dur;
	const raw = tr.phase === "out" ? p : 1 - p;
	return Math.ceil(raw * 8) / 8;
}
