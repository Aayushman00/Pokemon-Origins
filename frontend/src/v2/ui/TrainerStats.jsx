import React from "react";
import { badgeCount } from "../data/profiles";
import GymBadge from "./GymBadge";

const GYM_LEVELS = 8;

/** The eight pixel gym badges; won ones in colour, the rest as silhouettes. */
export const BadgeCase = ({ campaign }) => {
	const earned = badgeCount(campaign);
	const route = campaign?.route || [];
	return (
		<ol className="badge-case" aria-label={`${earned} of ${GYM_LEVELS} badges`}>
			{Array.from({ length: GYM_LEVELS }, (_, i) => {
				const lit = i < earned;
				const town = route[i]?.name || `Stage ${i + 1}`;
				return (
					<li key={i} className="badge-case__slot" title={lit ? `${town} badge` : `${town}: not yet earned`}>
						<GymBadge index={i} state={lit ? "won" : "locked"} />
						<span className="sr-only">{lit ? `${town} badge earned` : `${town} badge not earned`}</span>
					</li>
				);
			})}
		</ol>
	);
};

export const RecentBattles = ({ recent }) =>
	recent?.length ? (
		<ul className="recent">
			{recent.map((b, i) => (
				<li key={i} className={`recent__row recent__row--${b.result === "Win" ? "win" : "loss"}`}>
					<span className="recent__result">{b.result === "Win" ? "W" : "L"}</span>
					<span className="recent__opp">{b.opponent}</span>
					<time className="recent__when muted" dateTime={b.date}>
						{new Date(b.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
					</time>
				</li>
			))}
		</ul>
	) : (
		<p className="muted read">No battles recorded yet. Your next win or loss will show up here.</p>
	);

/** "3-win streak" / "2-loss streak"; nothing before the first battle. */
export const StreakLine = ({ streak }) =>
	streak ? (
		<p className={`streak streak--${streak.type === "Win" ? "win" : "loss"}`}>
			<span className="streak__flame" aria-hidden="true" />
			{streak.count}-{streak.type === "Win" ? "win" : "loss"} streak
		</p>
	) : null;
