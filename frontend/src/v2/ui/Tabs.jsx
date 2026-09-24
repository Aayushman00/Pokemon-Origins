import React from "react";

/** Pixel tabs. `tabs`: [{ id, label }]. */
const Tabs = ({ tabs, value, onChange, label, className = "" }) => (
	<div className={`tabs ${className}`} role="tablist" aria-label={label}>
		{tabs.map((t) => (
			<button key={t.id} type="button" role="tab" className="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
				{t.label}
			</button>
		))}
	</div>
);

export default Tabs;
