import { useCallback, useEffect, useState } from "react";

const KEY = "po.theme";

/** Saved choice, else the OS preference. index.html applies it pre-paint. */
function initialTheme() {
	try {
		const saved = localStorage.getItem(KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch {
		/* storage blocked: fall through to the OS preference */
	}
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Day / night theme on <html data-theme>, remembered per browser. */
export default function useTheme() {
	const [theme, setTheme] = useState(initialTheme);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1a2340" : "#243452");
	}, [theme]);

	const toggle = useCallback(() => {
		setTheme((t) => {
			const next = t === "dark" ? "light" : "dark";
			try {
				localStorage.setItem(KEY, next);
			} catch {
				/* choice just won't persist */
			}
			return next;
		});
	}, []);

	return [theme, toggle];
}
