import React from "react";

/**
 * GBA-style plastic casing: power LED + screen bezel around LCD content.
 * Shared chrome for Auth and Hub so the whole app reads as one device.
 * `children` render inside the screen bezel; `controls` render on the
 * casing below it (D-pad, A/B, SELECT/START...).
 */
const Shell = ({ poweredOn = true, className = "", children, controls }) => (
	<div className={`shell-case ${className}`}>
		<div
			className={`shell-led ${poweredOn ? "shell-led--on" : ""}`}
			aria-hidden="true"
		/>
		<div className="shell-bezel">{children}</div>
		{controls}
	</div>
);

export default Shell;
