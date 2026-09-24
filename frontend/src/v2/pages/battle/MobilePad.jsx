import React from "react";

// Sends the same keys the battle menus and text box already listen for, so
// the pad needs no battle logic of its own. preventDefault on pointerdown
// keeps focus where it was (a focused pad button would swallow Enter).
const press = (key) => (e) => {
	e.preventDefault();
	window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
	window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
};

const Key = ({ k, label, className }) => (
	<button type="button" tabIndex={-1} className={`pad__key ${className}`} onPointerDown={press(k)} aria-label={label}>
		<span aria-hidden="true" />
	</button>
);

/** Handheld-style D-pad + A/B for touch screens (hidden on desktop). */
const MobilePad = () => (
	<div className="pad" aria-label="Touch controls: D-pad moves the cursor, A confirms, B goes back">
		<div className="pad__dpad">
			<Key k="ArrowUp" label="Up" className="pad__up" />
			<Key k="ArrowLeft" label="Left" className="pad__left" />
			<span className="pad__hub" aria-hidden="true" />
			<Key k="ArrowRight" label="Right" className="pad__right" />
			<Key k="ArrowDown" label="Down" className="pad__down" />
		</div>
		<div className="pad__ab">
			<button type="button" tabIndex={-1} className="pad__btn pad__btn--b" onPointerDown={press("Escape")}>
				B
			</button>
			<button type="button" tabIndex={-1} className="pad__btn pad__btn--a" onPointerDown={press("Enter")}>
				A
			</button>
		</div>
	</div>
);

export default MobilePad;
