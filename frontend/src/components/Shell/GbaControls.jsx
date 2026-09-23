import React from "react";

/**
 * Shared D-pad + A/B + SELECT/START block for Shell's `controls` slot.
 * One markup source keeps the pad the same size on every screen that
 * uses it (AuthPage, Hub, ...). All handlers are optional no-ops.
 */
const GbaControls = ({ onA, onB, onSelect, onStart }) => (
	<>
		<div className="flex justify-between items-center mt-6 px-1">
			<div className="relative w-24 h-24" aria-hidden="true">
				<div className="absolute inset-0 bg-stone-900 rounded-full shadow-inner"></div>
				<div className="absolute left-8 top-0 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
				<div className="absolute left-0 top-8 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
				<div className="absolute left-8 bottom-0 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
				<div className="absolute right-0 top-8 w-8 h-8 bg-stone-700 rounded-md shadow-md"></div>
				<div className="absolute left-8 top-8 w-8 h-8 bg-stone-800 rounded-sm"></div>
			</div>

			<div className="flex space-x-4 items-center">
				<button
					type="button"
					className="shell-btn-round"
					onClick={onB}
					title="B"
					aria-label="B"
				>
					B
				</button>
				<button
					type="button"
					className="shell-btn-round"
					onClick={onA}
					title="A"
					aria-label="A"
				>
					A
				</button>
			</div>
		</div>

		<div className="flex justify-center mt-6 space-x-8">
			<button
				type="button"
				className="shell-btn-pill -rotate-6"
				onClick={onSelect}
			>
				SELECT
			</button>
			<button
				type="button"
				className="shell-btn-pill -rotate-6"
				onClick={onStart}
			>
				START
			</button>
		</div>
	</>
);

export default GbaControls;
