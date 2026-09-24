import React from "react";
import { typeColor } from "../../utils/typeColors";

export const TypeBadge = ({ type }) =>
	type ? (
		<span className="type-badge" style={{ "--type": typeColor(type) }}>
			{type}
		</span>
	) : null;

export const TypeList = ({ types = [] }) => (
	<span className="type-list">
		{types.map((t) => (
			<TypeBadge key={t} type={t} />
		))}
	</span>
);

const STATUS_NAMES = {
	brn: "Burned",
	par: "Paralyzed",
	psn: "Poisoned",
	slp: "Asleep",
	frz: "Frozen",
	fnt: "Fainted",
};

export const StatusBadge = ({ status }) =>
	status ? (
		<span className={`status-badge status-badge--${status}`} title={STATUS_NAMES[status]}>
			{String(status).toUpperCase()}
			<span className="sr-only"> ({STATUS_NAMES[status] || status})</span>
		</span>
	) : null;

export const GenderMark = ({ gender }) => {
	const g = String(gender || "").toLowerCase();
	if (g !== "male" && g !== "female") return null;
	return (
		<span className={`gender gender--${g}`} aria-label={g}>
			{g === "male" ? "♂" : "♀"}
		</span>
	);
};
