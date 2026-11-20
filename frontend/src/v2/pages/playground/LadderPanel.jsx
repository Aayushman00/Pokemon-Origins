import React, { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../../api";
import Tabs from "../../ui/Tabs";

const BOARDS = [
	{ id: "rating", label: "Rating" },
	{ id: "today", label: "Wins today" },
];

/** The park notice board: the PvP Elo ladder, and who has won the most rated matches today (UTC). */
const LadderPanel = ({ selfId }) => {
	const [board, setBoard] = useState("rating");
	const [rows, setRows] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let live = true;
		setRows(null);
		setError("");
		api
			.get(`/api/pvp/leaderboard?board=${board}`)
			.then(({ data }) => live && setRows(data.rows || []))
			.catch((err) => live && setError(err.response?.status === 401 ? "Sign in to see the ladder." : getErrorMessage(err, "Couldn't load the ladder")));
		return () => {
			live = false;
		};
	}, [board]);

	return (
		<div className="ladder">
			<Tabs tabs={BOARDS} value={board} onChange={setBoard} label="Ladder boards" />
			{error ? (
				<p className="read" role="alert">
					{error}
				</p>
			) : !rows ? (
				<p className="muted loading-dots">Reading the board</p>
			) : !rows.length ? (
				<p className="read">{board === "today" ? "No rated wins yet today. Be the first!" : "Nobody has battled yet. Face a trainer and press A to challenge them."}</p>
			) : (
				<ol className="ladder__list">
					{rows.map((r) => (
						<li key={r.trainerId} className={`ladder__row ${r.trainerId === selfId ? "is-self" : ""}`}>
							<span className="ladder__rank font-pixel">{r.rank}</span>
							<span className="ladder__name">{r.name}</span>
							<span className="ladder__score font-pixel">{board === "rating" ? r.rating : `${r.wins} win${r.wins === 1 ? "" : "s"}`}</span>
						</li>
					))}
				</ol>
			)}
			<p className="muted ladder__note">Beating a stronger trainer earns more. After 3 matches with the same trainer in a day, more matches with them stop counting.</p>
		</div>
	);
};

export default LadderPanel;
