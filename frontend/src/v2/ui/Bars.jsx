import React from "react";

function hpTone(current, max) {
	const pct = max > 0 ? (current / max) * 100 : 0;
	if (pct <= 20) return "low";
	if (pct <= 50) return "mid";
	return "hi";
}

const pct = (value, max) => `${max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0}%`;

/** HP bar with the classic "HP" tag; `showValue` prints current/max. */
export const HpBar = ({ current, max, showValue = false, className = "" }) => (
	<div
		className={`bar bar--hp ${className}`}
		data-tone={hpTone(current, max)}
		role="meter"
		aria-label="HP"
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={current}
	>
		<span className="bar__tag">HP</span>
		<span className="bar__track">
			<span className="bar__fill" style={{ "--pct": pct(current, max) }} />
		</span>
		{showValue && (
			<span className="bar__value">
				{Math.max(0, current)}/{max}
			</span>
		)}
	</div>
);

/** Creature EXP buffer toward next level. */
export const XpBar = ({ value, max, className = "" }) => (
	<div
		className={`bar bar--xp ${className}`}
		role="meter"
		aria-label="Experience to next level"
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={value}
	>
		<span className="bar__tag">EXP</span>
		<span className="bar__track">
			<span className="bar__fill" style={{ "--pct": pct(value, max) }} />
		</span>
	</div>
);

/** Generic progression bar (journey, win rate). */
export const ProgressBar = ({ value, max, label, tag, showValue = true, className = "" }) => (
	<div
		className={`bar bar--progress ${className}`}
		role="meter"
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={value}
	>
		{tag && <span className="bar__tag">{tag}</span>}
		<span className="bar__track">
			<span className="bar__fill" style={{ "--pct": pct(value, max) }} />
		</span>
		{showValue && (
			<span className="bar__value">
				{value}/{max}
			</span>
		)}
	</div>
);
