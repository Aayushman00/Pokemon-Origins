import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { HpBar, XpBar } from "../../ui/Bars";
import { GenderMark, StatusBadge } from "../../ui/Badges";
import { DRAIN_MS } from "../../battle/useBattle";

/** Counts a number toward its target in stepped frames (HP readout). */
function useSteppedNumber(target) {
	const reduce = useReducedMotion();
	const [value, setValue] = useState(target);
	const fromRef = useRef(target);
	useEffect(() => {
		if (reduce) {
			setValue(target);
			fromRef.current = target;
			return undefined;
		}
		const from = fromRef.current;
		if (from === target) return undefined;
		const steps = 12;
		let i = 0;
		const id = setInterval(() => {
			i += 1;
			const v = Math.round(from + ((target - from) * i) / steps);
			setValue(v);
			fromRef.current = v;
			if (i >= steps) clearInterval(id);
		}, DRAIN_MS / steps);
		return () => clearInterval(id);
	}, [target, reduce]);
	return value;
}

/** Party balls: one per member, dimmed when fainted. */
const PartyBalls = ({ party = [], label }) => (
	<span className="balls" role="img" aria-label={`${label}: ${party.filter((m) => m.current_hp > 0).length} of ${party.length} able to battle`}>
		{party.map((m) => (
			<span key={m.position} className={`ball ${m.current_hp <= 0 ? "ball--out" : ""}`} />
		))}
	</span>
);

/**
 * HP box. Foe: name, level, status, bar (no numbers, like the originals).
 * Player: adds the HP readout and EXP bar.
 */
const HpPanel = ({ mon, side, party, tick }) => {
	const hp = useSteppedNumber(Math.max(0, mon.current_hp));
	const mine = side === "player";
	return (
		<div className={`hp-panel hp-panel--${side}`}>
			<div className="hp-panel__top">
				<span className="hp-panel__name caps">{mon.nickname}</span>
				<GenderMark gender={mon.gender} />
				<StatusBadge status={mon.status} />
				<span className="hp-panel__lv">Lv{mon.level}</span>
			</div>
			<HpBar current={hp} max={mon.max_hp} />
			{mine && (
				<div className="hp-panel__row">
					<PartyBalls party={party} label="Your party" />
					<span className="hp-panel__hp">
						{hp}/{mon.max_hp}
					</span>
				</div>
			)}
			{mine && mon.xp_to_next ? <XpBar value={mon.experience || 0} max={mon.xp_to_next} className="hp-panel__xp" /> : null}
			{!mine && party?.length > 1 && <PartyBalls party={party} label="Opponent's party" />}
			{tick && (
				<span key={tick.id} className="dmg-tick" aria-hidden="true">
					-{tick.amount}
				</span>
			)}
		</div>
	);
};

export default HpPanel;
