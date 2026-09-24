import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../../data/user";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import { fetchProfile } from "../../data/profiles";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import PixelTrainer from "../../ui/PixelTrainer";
import { ProgressBar, XpBar } from "../../ui/Bars";
import { GenderMark, TypeList } from "../../ui/Badges";
import { BadgeCase, RecentBattles } from "../../ui/TrainerStats";
import "./trainer.css";

const Row = ({ label, value }) => (
	<div className="stats__row">
		<dt>{label}</dt>
		<span className="stats__lead" aria-hidden="true" />
		<dd>{value}</dd>
	</div>
);

/** FRLG-style trainer card for yourself (/trainer) or anyone (/trainer/:id). */
const TrainerScreen = () => {
	const { trainerId: param } = useParams();
	const { user } = useUser();
	const id = param || user?.trainer_id;
	const [state, setState] = useState({ status: "loading" });

	useEffect(() => {
		let alive = true;
		setState({ status: "loading" });
		fetchProfile(id, { fresh: true }).then((r) => alive && setState(r));
		return () => {
			alive = false;
		};
	}, [id]);

	if (state.status === "loading")
		return (
			<div className="page-center">
				<p className="loading-dots">Reading trainer card</p>
			</div>
		);

	if (state.status !== "ok")
		return (
			<div className="page-center">
				<Panel lift className="tcard-missing">
					<span className="hovercard__glyph" aria-hidden="true">
						?
					</span>
					<h1 className="journey-card__title">{state.status === "error" ? "Records unavailable" : "Unknown trainer"}</h1>
					<p className="read">
						{state.status === "error"
							? "Trainer records couldn't be loaded. Try again in a moment."
							: "No Pokémon Origins trainer has this ID. They may have been a guest, who don't get trainer cards."}
					</p>
					<div className="result__actions">
						<Button to="/playground">Back to Playground</Button>
					</div>
				</Panel>
			</div>
		);

	const p = state.profile;
	const c = p.campaign;
	const r = p.record;
	const mine = user && Number(user.trainer_id) === Number(p.trainer_id);

	return (
		<div className="page tpage">
			<article className="tcard frame frame--lift" aria-labelledby="tcard-name">
				<header className="tcard__band">
					<span>Trainer card</span>
					<span className="tcard__id">ID No. {String(p.trainer_id).padStart(5, "0")}</span>
				</header>
				<div className="tcard__body">
					<div className="tcard__main">
						<h1 id="tcard-name" className="tcard__name">
							{p.name}
						</h1>
						<p className="tcard__title">
							{c.champion ? "Champion of the journey" : `On the road to ${c.level_name || `stage ${c.current_level}`}`}
						</p>
						<dl className="stats tcard__stats">
							<Row label="Wins" value={r.wins} />
							<Row label="Losses" value={r.losses} />
							<Row label="Battles fought" value={r.battles} />
							<Row label="Win rate" value={r.win_rate == null ? "No battles yet" : `${r.win_rate}%`} />
							<Row label="Started" value={new Date(p.joined).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} />
						</dl>
						<div className="tcard__journey">
							<p className="record__heading">
								Journey <span className="muted">{c.battles_cleared} of {c.total_battles} battles</span>
							</p>
							<ProgressBar value={c.battles_cleared} max={c.total_battles} label="Campaign battles cleared" showValue={false} />
						</div>
					</div>
					<div className="tcard__portrait" aria-hidden="true">
						<PixelTrainer gender={p.gender} size={168} />
					</div>
				</div>
				<footer className="tcard__badges">
					<BadgeCase campaign={c} />
				</footer>
			</article>

			<div className="tpage__grid">
				<Panel plate="Party">
					{p.party.length ? (
						<ul className="tparty">
							{p.party.map((m) => (
								<li key={m.position} className="tparty__mon">
									<PokemonSprite pokemonId={m.pokemon_id} variant="front" alt="" className="sprite tparty__sprite bob" />
									<div className="tparty__info">
										<p className="tparty__name">
											<span className="caps">{m.nickname}</span> <GenderMark gender={m.gender} />
										</p>
										<p>Lv. {m.level}</p>
										<TypeList types={m.types} />
										<XpBar value={m.experience} max={m.xp_to_next} />
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="muted read">No partner chosen yet.</p>
					)}
					{mine && (
						<Button to="/game#party" size="sm" className="tpage__more">
							Manage on the hub
						</Button>
					)}
				</Panel>

				<Panel plate="Recent battles">
					<RecentBattles recent={p.recent} />
				</Panel>
			</div>
		</div>
	);
};

export default TrainerScreen;
