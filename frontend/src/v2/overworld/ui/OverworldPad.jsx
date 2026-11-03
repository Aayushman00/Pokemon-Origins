import React from "react";

// Hold-aware on-screen pad. Unlike the battle pad (which fires one synthetic key
// tap), walking needs a button that stays down: pointer down/up feed the same
// input state as the keyboard. B is the run button.
const Hold = ({ input, button, label, className, children }) => {
	const down = (e) => {
		e.preventDefault();
		e.currentTarget.setPointerCapture?.(e.pointerId);
		input.virtual(button, true);
	};
	const up = () => input.virtual(button, false);
	return (
		<button
			type="button"
			tabIndex={-1}
			className={className}
			aria-label={label}
			onPointerDown={down}
			onPointerUp={up}
			onPointerCancel={up}
			onLostPointerCapture={up}
			onContextMenu={(e) => e.preventDefault()}
		>
			{children}
		</button>
	);
};

const OverworldPad = ({ input }) => (
	<div className="pad" aria-label="Touch controls: D-pad walks, hold B to run, A talks and confirms">
		<div className="pad__dpad">
			{["up", "left", "right", "down"].map((d) => (
				<Hold key={d} input={input} button={d} label={d[0].toUpperCase() + d.slice(1)} className={`pad__key pad__${d}`}>
					<span aria-hidden="true" />
				</Hold>
			))}
			<span className="pad__hub" aria-hidden="true" />
		</div>
		<div className="pad__ab">
			<Hold input={input} button="b" label="B (hold to run)" className="pad__btn pad__btn--b">B</Hold>
			<Hold input={input} button="a" label="A" className="pad__btn pad__btn--a">A</Hold>
		</div>
	</div>
);

export default OverworldPad;
