import React from "react";
import { Link } from "react-router-dom";
import Panel from "../../ui/Panel";
import { ProgressBar } from "../../ui/Bars";
import { badgeCount } from "../../data/profiles";

const GYM_LEVELS = 8;

/** Eight original gem emblems; lit ones are gyms actually cleared. */
export const BadgeCase = ({ campaign }) => {
	const earned = badgeCount(campaign);
	const route = campaign?.route || [];
	return (
		<ol className="badge-case" aria-label={`${earned} of ${GYM_LEVELS} badges`}>
			{Array.from({ length: GYM_LEVELS }, (_, i) => {
				const lit = i < earned;
				const town = route[i]?.name || `Stage ${i + 1}`;
				return (
					<li key={i} className={`badge-gem badge-gem--${i} ${lit ? "is-lit" : ""}`} title={lit ? `${town} badge` : `${town}: not yet earned`}>
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

const TrainerRecord = ({ profile, coins }) => {
	if (!profile) {
		return (
			<Panel plate="Trainer" className="record">
				<p className="loading-dots muted">Reading trainer card</p>
			</Panel>
		);
	}
	const r = profile.record;
	const c = profile.campaign;
	return (
		<Panel plate="Trainer" className="record">
			<div className="record__numbers">
				<div className="record__big">
					<span className="record__value">{r.wins}</span>
					<span className="record__label">wins</span>
				</div>
				<div className="record__big">
					<span className="record__value">{r.losses}</span>
					<span className="record__label">losses</span>
				</div>
				<div className="record__big">
					<span className="record__value">{r.win_rate == null ? "–" : `${Math.round(r.win_rate)}%`}</span>
					<span className="record__label">win rate</span>
				</div>
			</div>

			<div className="record__block">
				<p className="record__heading">Journey</p>
				<ProgressBar value={c.battles_cleared} max={c.total_battles} label="Campaign battles cleared" />
			</div>

			<div className="record__block">
				<p className="record__heading">
					Badges <span className="muted">{badgeCount(c)}/8</span>
				</p>
				<BadgeCase campaign={c} />
			</div>

			{coins != null && (
				<p className="record__coins">
					<span className="coin" aria-hidden="true" /> {coins.toLocaleString()} coins
				</p>
			)}

			<div className="record__block">
				<p className="record__heading">Recent battles</p>
				<RecentBattles recent={profile.recent} />
			</div>

			<Link className="record__link" to="/trainer">
				Open trainer card
			</Link>
		</Panel>
	);
};

export default TrainerRecord;
