import React from "react";
import { Link } from "react-router-dom";
import Panel from "../../ui/Panel";
import { ProgressBar } from "../../ui/Bars";
import { badgeCount } from "../../data/profiles";
import { BadgeCase, RecentBattles } from "../../ui/TrainerStats";

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
