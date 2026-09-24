import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getErrorMessage } from "../../../api";
import { useUser } from "../../data/user";
import { fetchProfile } from "../../data/profiles";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import Tabs from "../../ui/Tabs";
import { StreakLine } from "../../ui/TrainerStats";
import "./trainer.css";

const PAGE = 20;
const day = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Full battle log for a trainer: paged, filterable, grouped by day. */
const HistoryScreen = () => {
	const { trainerId: param } = useParams();
	const { user } = useUser();
	const id = param || user?.trainer_id;
	const [profile, setProfile] = useState(null);
	const [battles, setBattles] = useState([]);
	const [next, setNext] = useState(undefined); // undefined = not loaded yet, null = end
	const [filter, setFilter] = useState("all");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	const loadPage = useCallback(
		async (before) => {
			setBusy(true);
			try {
				const { data } = await api.get(`/api/trainers/${id}/battles`, { params: { limit: PAGE, ...(before ? { before } : {}) } });
				setBattles((prev) => (before ? [...prev, ...data.battles] : data.battles));
				setNext(data.next);
			} catch (err) {
				setError(getErrorMessage(err, "Couldn't load battle history"));
			} finally {
				setBusy(false);
			}
		},
		[id]
	);

	useEffect(() => {
		setBattles([]);
		setNext(undefined);
		setError("");
		fetchProfile(id, { fresh: true }).then((r) => setProfile(r.status === "ok" ? r.profile : null));
		loadPage();
	}, [id, loadPage]);

	const shown = battles.filter((b) => filter === "all" || b.result === (filter === "wins" ? "Win" : "Loss"));
	const groups = useMemo(() => {
		const out = [];
		for (const b of shown) {
			const key = day(b.date);
			if (!out.length || out[out.length - 1].key !== key) out.push({ key, items: [] });
			out[out.length - 1].items.push(b);
		}
		return out;
	}, [shown]);

	// Rivals among the battles loaded so far (the list grows with Load more).
	const rivals = useMemo(() => {
		const map = new Map();
		for (const b of battles) {
			const r = map.get(b.opponent) || { name: b.opponent, wins: 0, losses: 0 };
			if (b.result === "Win") r.wins++;
			else r.losses++;
			map.set(b.opponent, r);
		}
		return [...map.values()].sort((a, b) => b.wins + b.losses - (a.wins + a.losses)).slice(0, 5);
	}, [battles]);

	if (error)
		return (
			<div className="page-center">
				<Panel lift title="Battle history unavailable" className="journey-card">
					<p className="read" role="alert">
						{error}
					</p>
					<div className="result__actions">
						<Button variant="primary" onClick={() => loadPage()}>
							Try again
						</Button>
					</div>
				</Panel>
			</div>
		);

	const r = profile?.record;
	return (
		<div className="page history">
			<header className="history__head">
				<div>
					<h1 className="history__title">{profile ? `${profile.name}'s battles` : "Battle history"}</h1>
					{r && (
						<p className="muted">
							{r.wins} wins, {r.losses} losses{r.win_rate != null ? `, ${r.win_rate}% won` : ""}
						</p>
					)}
					{r?.streak && <StreakLine streak={r.streak} />}
				</div>
				<Button size="sm" to={`/trainer/${id}`}>
					Trainer card
				</Button>
			</header>

			<div className="history__grid">
				<Panel plate="Log">
					<Tabs
						label="Filter battles"
						value={filter}
						onChange={setFilter}
						tabs={[
							{ id: "all", label: "All" },
							{ id: "wins", label: "Wins" },
							{ id: "losses", label: "Losses" },
						]}
					/>
					{next === undefined ? (
						<p className="loading-dots muted history__empty">Reading the log</p>
					) : shown.length === 0 ? (
						<p className="read muted history__empty">
							{battles.length ? "Nothing in this filter yet." : "No battles recorded yet. Every win and loss from now on lands here."}
						</p>
					) : (
						groups.map((g) => (
							<section key={g.key} className="history__day">
								<h2 className="history__date">{g.key}</h2>
								<ol className="recent">
									{g.items.map((b) => (
										<li key={b.id} className={`recent__row recent__row--${b.result === "Win" ? "win" : "loss"}`}>
											<span className="recent__result">{b.result === "Win" ? "W" : "L"}</span>
											<span className="recent__opp">
												{b.result === "Win" ? "Beat" : "Lost to"} {b.opponent}
											</span>
											<time className="recent__when muted" dateTime={b.date}>
												{time(b.date)}
											</time>
										</li>
									))}
								</ol>
							</section>
						))
					)}
					{next && (
						<Button className="history__more" disabled={busy} onClick={() => loadPage(next)}>
							{busy ? "Loading…" : "Load older battles"}
						</Button>
					)}
				</Panel>

				<Panel plate="Rivals">
					{rivals.length ? (
						<dl className="stats">
							{rivals.map((rv) => (
								<div className="stats__row" key={rv.name}>
									<dt>{rv.name}</dt>
									<span className="stats__lead" aria-hidden="true" />
									<dd>
										{rv.wins}W {rv.losses}L
									</dd>
								</div>
							))}
						</dl>
					) : (
						<p className="read muted">Opponents you meet most often show up here.</p>
					)}
				</Panel>
			</div>
		</div>
	);
};

export default HistoryScreen;
