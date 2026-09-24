import { useCallback, useEffect, useRef, useState } from "react";

const START_PX = 6;

function targetAt(x, y) {
	const el = document.elementFromPoint(x, y)?.closest?.("[data-drop-zone]");
	if (!el) return null;
	const raw = el.dataset.dropIndex;
	return { zone: el.dataset.dropZone, index: raw === undefined ? undefined : Number(raw) };
}

/**
 * Minimal pointer drag-and-drop (mouse, pen and touch; no HTML5 DnD, which
 * doesn't work on phones). Items call bind(item) for their onPointerDown;
 * drop targets carry data-drop-zone (+ optional data-drop-index). With touch,
 * only an element marked data-drag-handle starts a drag, so swiping the rest
 * of a row still scrolls the page. Escape cancels. A drag swallows the click
 * that follows it, so rows can stay clickable for selection.
 */
export default function usePointerDrag(onDrop) {
	const [drag, setDrag] = useState(null); // { item, x, y, over }
	const onDropRef = useRef(onDrop);
	onDropRef.current = onDrop;
	const cleanupRef = useRef(null);

	useEffect(() => () => cleanupRef.current?.(), []);

	const bind = useCallback(
		(item) => ({
			onPointerDown: (e) => {
				if (e.button !== 0) return;
				if (e.pointerType !== "mouse" && !e.target.closest?.("[data-drag-handle]")) return;
				const sx = e.clientX;
				const sy = e.clientY;
				let started = false;

				const move = (ev) => {
					if (!started) {
						if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < START_PX) return;
						started = true;
					}
					ev.preventDefault();
					setDrag({ item, x: ev.clientX, y: ev.clientY, over: targetAt(ev.clientX, ev.clientY) });
				};
				const end = (ev, cancelled = false) => {
					cleanup();
					if (!started) return;
					setDrag(null);
					// Eat the click the browser fires after a drag.
					// (removed next tick so it can't eat a later, real click)
					const eat = (c) => c.stopPropagation();
					window.addEventListener("click", eat, { capture: true, once: true });
					setTimeout(() => window.removeEventListener("click", eat, true), 0);
					if (!cancelled) {
						const over = targetAt(ev.clientX, ev.clientY);
						if (over) onDropRef.current(item, over);
					}
				};
				const up = (ev) => end(ev);
				const key = (ev) => ev.key === "Escape" && end(ev, true);
				const cleanup = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
					window.removeEventListener("pointercancel", up);
					window.removeEventListener("keydown", key);
					cleanupRef.current = null;
				};
				cleanupRef.current?.();
				cleanupRef.current = cleanup;
				window.addEventListener("pointermove", move, { passive: false });
				window.addEventListener("pointerup", up);
				window.addEventListener("pointercancel", up);
				window.addEventListener("keydown", key);
			},
		}),
		[]
	);

	return { drag, bind };
}
