import React from "react";

/** Blinking pixel arrow. `down` = the dialogue "more text" marker. */
const Cursor = ({ down = false, hidden = false }) => (
	<span
		aria-hidden="true"
		className={`cursor ${down ? "cursor--down" : ""} ${hidden ? "cursor--hidden" : ""}`}
	/>
);

export default Cursor;
