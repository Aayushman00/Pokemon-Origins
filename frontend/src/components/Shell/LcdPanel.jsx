import React from "react";

/**
 * Green LCD screen area with optional scanlines.
 * `on` drives the boot fade (opacity transition defined in tokens.css).
 */
const LcdPanel = ({ on = true, scanlines = true, className = "", children }) => (
	<div
		className={`lcd-panel ${on ? "lcd-panel--on" : "lcd-panel--off"} ${className}`}
	>
		{scanlines && (
			<div className="lcd-scanlines bg-scanlines" aria-hidden="true" />
		)}
		<div className="lcd-content">{children}</div>
	</div>
);

export default LcdPanel;
