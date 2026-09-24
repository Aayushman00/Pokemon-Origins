import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Cursor from "./Cursor";
import { moveCursor } from "./moveCursor";

const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

/**
 * Cursor-driven menu (START menu, battle commands, moves, bag, mart).
 * Arrow keys move the cursor (2-D when `columns` = 2), Enter/Space select,
 * and hover moves the same cursor, so mouse and keyboard never disagree.
 * `globalKeys` listens on window so the battle menu works without focus
 * (Enter/Z select, Escape/X back).
 */
const MenuList = ({ items, columns = 1, label, globalKeys = false, autoFocus = false, onBack, onActiveChange, initialIndex, className = "" }) => {
	const [active, setActive] = useState(() => initialIndex ?? Math.max(0, items.findIndex((i) => !i.disabled)));
	const refs = useRef([]);

	useEffect(() => {
		if (active >= items.length) setActive(0);
	}, [items.length, active]);

	useEffect(() => {
		onActiveChange?.(items[active], active);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [active]);

	useEffect(() => {
		if (autoFocus) refs.current[active]?.focus({ preventScroll: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoFocus]);

	const handleKey = (e) => {
		if (ARROWS.includes(e.key)) {
			e.preventDefault();
			const next = moveCursor(active, e.key, items.length, columns);
			setActive(next);
			if (!globalKeys || document.activeElement?.closest?.(".menu")) {
				refs.current[next]?.focus({ preventScroll: true });
			}
		} else if (e.key === "Escape" || (globalKeys && (e.key === "x" || e.key === "X"))) {
			if (onBack) {
				e.preventDefault();
				onBack();
			}
		} else if (globalKeys && (e.key === "Enter" || e.key === "z" || e.key === "Z")) {
			// A focused button already handles Enter natively.
			if (document.activeElement?.closest?.("button, a")) return;
			const item = items[active];
			if (item && !item.disabled) {
				e.preventDefault();
				item.onSelect?.();
			}
		}
	};

	const handleKeyRef = useRef(handleKey);
	handleKeyRef.current = handleKey;
	useEffect(() => {
		if (!globalKeys) return undefined;
		const onKey = (e) => {
			if (e.target.closest?.("input, textarea, select, [role=dialog]")) return;
			handleKeyRef.current(e);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [globalKeys]);

	return (
		<ul className={`menu ${columns > 1 ? "menu--grid" : ""} ${className}`} aria-label={label} onKeyDown={globalKeys ? undefined : handleKey}>
			{items.map((item, i) => {
				const common = {
					ref: (el) => (refs.current[i] = el),
					className: `menu__item ${i === active ? "is-active" : ""} ${item.className || ""}`,
					onMouseEnter: () => setActive(i),
					onFocus: () => setActive(i),
					tabIndex: i === active ? 0 : -1,
				};
				const body = (
					<>
						<Cursor />
						{item.icon}
						<span className="menu__label">{item.label}</span>
						{item.hint != null && <span className="menu__hint">{item.hint}</span>}
					</>
				);
				return (
					<li key={item.id}>
						{item.to && !item.disabled ? (
							<Link to={item.to} {...common} onClick={item.onSelect}>
								{body}
							</Link>
						) : (
							<button type="button" {...common} disabled={item.disabled} aria-label={item.ariaLabel} onClick={() => item.onSelect?.()}>
								{body}
							</button>
						)}
					</li>
				);
			})}
		</ul>
	);
};

export default MenuList;
