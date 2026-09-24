import React, { useEffect, useRef } from "react";
import Cursor from "./Cursor";
import useTypewriter from "./useTypewriter";

/**
 * Classic RPG text box: typewriter reveal, ▼ continuation cursor, and
 * click / Enter / Space / Z to fast-forward (then advance, when `onAdvance`
 * is given). The full line sits in an aria-live region so screen readers
 * get it at once instead of character by character.
 */
const DialogueBox = ({ text = "", onAdvance, onSkip, showNext = false, keys = true, charMs, className = "", children }) => {
	const { shown, done, skip } = useTypewriter(text, charMs ? { charMs } : undefined);
	const stateRef = useRef();
	stateRef.current = { done, skip, onAdvance, onSkip };

	const press = () => {
		const s = stateRef.current;
		if (!s.done) s.skip();
		else if (s.onAdvance) s.onAdvance();
		s.onSkip?.();
	};

	useEffect(() => {
		if (!keys) return undefined;
		const onKey = (e) => {
			if (e.target.closest?.("input, textarea, select, [role=dialog]")) return;
			if (e.key === "Enter" || e.key === " " || e.key === "z" || e.key === "Z") {
				const s = stateRef.current;
				if (!s.done || s.onAdvance || s.onSkip) {
					e.preventDefault();
					press();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [keys]);

	return (
		<div className={`frame panel panel--navy dialogue ${className}`} onClick={press}>
			<p className="dialogue__text" aria-hidden="true">
				{shown}
				<span className="dialogue__ghost">{text.slice(shown.length)}</span>
			</p>
			<p className="sr-only" aria-live="polite">
				{text}
			</p>
			{children}
			{done && (showNext || onAdvance) && (
				<span className="dialogue__next">
					<Cursor down />
				</span>
			)}
		</div>
	);
};

export default DialogueBox;
