// Input: keyboard + gamepad + on-screen pad all feed one button state.
// The state machine is pure (testable); the DOM wiring is at the bottom.

export const BUTTONS = ["up", "down", "left", "right", "a", "b", "start", "select"];
const DIR_BUTTONS = ["up", "down", "left", "right"];

export const KEY_MAP = {
	ArrowUp: "up", w: "up", W: "up",
	ArrowDown: "down", s: "down", S: "down",
	ArrowLeft: "left", a: "left", A: "left",
	ArrowRight: "right", d: "right", D: "right",
	z: "a", Z: "a", Enter: "a", " ": "a",
	x: "b", X: "b", Shift: "b",
	Escape: "start", Tab: "start",
	Backspace: "select",
};

export function createInputState() {
	return { held: Object.fromEntries(BUTTONS.map((b) => [b, new Set()])), stack: [], edges: [] };
}

/** source: 'keyboard' | 'gamepad' | 'virtual' */
export function setButton(state, button, down, source) {
	const set = state.held[button];
	if (!set) return;
	const was = set.size > 0;
	if (down) set.add(source);
	else set.delete(source);
	const now = set.size > 0;
	if (now === was) return;
	if (DIR_BUTTONS.includes(button)) {
		state.stack = state.stack.filter((b) => b !== button);
		if (now) state.stack.push(button);
	}
	if (now) state.edges.push({ button, source });
}

export function releaseAll(state, source) {
	for (const b of BUTTONS) setButton(state, b, false, source);
}

/** Most recently pressed held direction wins (so reversing direction is instant). */
export function snapshot(state) {
	const dir = state.stack.length ? state.stack[state.stack.length - 1] : null;
	return { dir, run: state.held.b.size > 0, aHeld: state.held.a.size > 0 };
}

/** Pressed-this-frame buttons since the last call. */
export function drainEdges(state) {
	const e = state.edges;
	state.edges = [];
	return e;
}

/** Standard-mapping gamepad -> set of pressed button names. */
export function padButtons(gp, deadzone = 0.5) {
	const out = new Set();
	if (!gp) return out;
	const b = (i) => !!gp.buttons?.[i]?.pressed;
	if (b(12)) out.add("up");
	if (b(13)) out.add("down");
	if (b(14)) out.add("left");
	if (b(15)) out.add("right");
	const [ax = 0, ay = 0] = gp.axes || [];
	if (ay < -deadzone) out.add("up");
	if (ay > deadzone) out.add("down");
	if (ax < -deadzone) out.add("left");
	if (ax > deadzone) out.add("right");
	if (b(0)) out.add("a");
	if (b(1) || b(2)) out.add("b");
	if (b(9)) out.add("start");
	if (b(8)) out.add("select");
	return out;
}

/** Poll first connected pad and diff against `prev` (a Set) into the state. Returns the new Set. */
export function pollGamepad(state, prev, pads) {
	const gp = Array.from(pads || []).find((p) => p && p.connected !== false);
	const cur = padButtons(gp);
	for (const b of BUTTONS) {
		if (cur.has(b) && !prev.has(b)) setButton(state, b, true, "gamepad");
		else if (!cur.has(b) && prev.has(b)) setButton(state, b, false, "gamepad");
	}
	return cur;
}

const isTyping = (e) => !!e.target?.closest?.("input, textarea, select, [contenteditable=true]");

/** Wire keyboard + gamepad polling. Returns { state, poll(), virtual(button, down), dispose() }. */
export function attachInput(win = window) {
	const state = createInputState();
	let pad = new Set();
	const onDown = (e) => {
		const b = KEY_MAP[e.key];
		if (!b || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
		e.preventDefault();
		setButton(state, b, true, "keyboard");
	};
	const onUp = (e) => {
		const b = KEY_MAP[e.key];
		if (b) setButton(state, b, false, "keyboard");
	};
	const onBlur = () => BUTTONS.forEach((b) => setButton(state, b, false, "keyboard"));
	win.addEventListener("keydown", onDown);
	win.addEventListener("keyup", onUp);
	win.addEventListener("blur", onBlur);
	return {
		state,
		poll() {
			try {
				pad = pollGamepad(state, pad, win.navigator?.getGamepads?.());
			} catch {
				/* gamepad API unavailable */
			}
		},
		virtual: (button, down) => setButton(state, button, down, "virtual"),
		dispose() {
			win.removeEventListener("keydown", onDown);
			win.removeEventListener("keyup", onUp);
			win.removeEventListener("blur", onBlur);
		},
	};
}
