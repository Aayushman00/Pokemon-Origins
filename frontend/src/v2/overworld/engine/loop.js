import { TICK_MS } from "../constants.js";

/**
 * Fixed-timestep loop: logic always advances in 1/60 s ticks regardless of the
 * display refresh rate; render runs only when at least one tick ran, so a
 * 144 Hz monitor does not redraw identical frames. Clock/raf are injectable.
 */
export function createLoop({ step, render, now = () => performance.now(), raf = (f) => requestAnimationFrame(f), caf = (id) => cancelAnimationFrame(id), maxCatchup = 5 }) {
	let id = null;
	let last = 0;
	let acc = 0;
	const stats = { ticks: 0, frames: 0, dropped: 0 };

	function frame() {
		const t = now();
		const dt = t - last;
		last = t;
		acc += dt;
		const cap = TICK_MS * maxCatchup;
		if (acc > cap) {
			stats.dropped += Math.floor((acc - cap) / TICK_MS); // tab was hidden / long stall: do not fast-forward
			acc = cap;
		}
		let ran = 0;
		while (acc >= TICK_MS) {
			step();
			acc -= TICK_MS;
			ran += 1;
		}
		stats.ticks += ran;
		if (ran > 0) {
			render();
			stats.frames += 1;
		}
		id = raf(frame);
	}

	return {
		stats,
		start() {
			if (id !== null) return;
			last = now();
			acc = 0;
			id = raf(frame);
		},
		stop() {
			if (id !== null) caf(id);
			id = null;
		},
	};
}
