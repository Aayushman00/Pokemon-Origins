export const TEXT_SPEEDS = { slow: 45, mid: 22, fast: 8 };
const KEY = "po.textSpeed";
const ORDER = ["slow", "mid", "fast"];

export function getTextSpeed(storage = typeof localStorage === "undefined" ? null : localStorage) {
	try {
		const v = storage?.getItem(KEY);
		if (ORDER.includes(v)) return v;
	} catch {
		/* storage blocked */
	}
	return "mid";
}

export function cycleTextSpeed(current, storage = typeof localStorage === "undefined" ? null : localStorage) {
	const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
	try {
		storage?.setItem(KEY, next);
	} catch {
		/* won't persist */
	}
	return next;
}
