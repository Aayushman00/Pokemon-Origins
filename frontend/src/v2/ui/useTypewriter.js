import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export const CHAR_MS = 22;

/** Reveals `text` one character at a time; `skip()` shows it all at once. */
export default function useTypewriter(text, { charMs = CHAR_MS } = {}) {
	const reduce = useReducedMotion();
	const full = text || "";
	const [count, setCount] = useState(reduce ? full.length : 0);

	useEffect(() => {
		if (reduce) {
			setCount(full.length);
			return undefined;
		}
		setCount(0);
		if (!full) return undefined;
		// Derive progress from elapsed time so throttled timers skip ahead
		// instead of slowing the text down.
		const start = performance.now();
		const id = setInterval(() => {
			const n = Math.min(full.length, Math.floor((performance.now() - start) / charMs) + 1);
			setCount((c) => Math.max(c, n));
			if (n >= full.length) clearInterval(id);
		}, Math.min(charMs, 30));
		return () => clearInterval(id);
	}, [full, charMs, reduce]);

	return {
		shown: full.slice(0, count),
		done: count >= full.length,
		skip: () => setCount(full.length),
	};
}
