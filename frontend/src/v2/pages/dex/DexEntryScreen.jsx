import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../api";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import DialogueBox from "../../ui/DialogueBox";
import { TypeBadge, TypeList } from "../../ui/Badges";
import { formatStatLabel } from "../../../utils/statLabels";
import "./dex.css";

const MAX_STAT = 255;
const dexNo = (id) => String(id).padStart(3, "0");

const Matchups = ({ label, types }) => (
	<div className="entry__match">
		<p className="record__heading">{label}</p>
		{types?.length ? <TypeList types={types} /> : <p className="muted">None</p>}
	</div>
);

/** Dex entry: portrait, vitals, flavor text in the text box, stats, chain. */
const DexEntryScreen = () => {
	const { id } = useParams();
	const [mon, setMon] = useState(null);
	const [status, setStatus] = useState("loading");

	const load = useCallback(async () => {
		setStatus("loading");
		try {
			const { data } = await api.get(`/pokemon-detail/${id}`);
			setMon(data);
			setStatus("ok");
		} catch (err) {
			console.error(err);
			setStatus("error");
		}
	}, [id]);

	useEffect(() => {
		load();
		window.scrollTo(0, 0);
	}, [load]);

	if (status === "loading")
		return (
			<div className="page-center">
				<p className="loading-dots">Reading entry</p>
			</div>
		);

	if (status === "error" || !mon)
		return (
			<div className="page-center">
				<Panel lift title="Entry unavailable" className="journey-card">
					<p className="read" role="alert">
						This entry couldn&apos;t be loaded.
					</p>
					<div className="result__actions">
						<Button variant="primary" onClick={load}>
							Try again
						</Button>
						<Button to="/pokedex">Back to Pokédex</Button>
					</div>
				</Panel>
			</div>
		);

	const n = Number(mon.id);
	const chain = [...(mon.previous_evolutions || []), { id: mon.id, name: mon.name, types: mon.types, requirement: mon.requirement, current: true }, ...(mon.next_evolutions || [])];

	return (
		<div className="page entry">
			<nav className="entry__nav" aria-label="Entries">
				<Button size="sm" to="/pokedex">
					All entries
				</Button>
				<span className="entry__step">
					{n > 1 && (
						<Button size="sm" to={`/pokedex/${n - 1}`} aria-label="Previous entry">
							No. {dexNo(n - 1)}
						</Button>
					)}
					{n < 151 && (
						<Button size="sm" to={`/pokedex/${n + 1}`} aria-label="Next entry">
							No. {dexNo(n + 1)}
						</Button>
					)}
				</span>
			</nav>

			<article className="frame panel entry__card frame--lift">
				<div className="entry__portrait">
					<PokemonSprite pokemonId={mon.id} variant="front" alt={mon.name} className="sprite entry__sprite" />
				</div>
				<div className="entry__vitals">
					<p className="dex__no">No. {dexNo(mon.id)}</p>
					<h1 className="entry__name caps">{mon.name}</h1>
					<p className="entry__cat">{mon.details?.category}</p>
					<TypeList types={mon.types} />
					<dl className="stats entry__facts">
						<div className="stats__row">
							<dt>Height</dt>
							<span className="stats__lead" aria-hidden="true" />
							<dd>{mon.height} m</dd>
						</div>
						<div className="stats__row">
							<dt>Weight</dt>
							<span className="stats__lead" aria-hidden="true" />
							<dd>{mon.weight} kg</dd>
						</div>
						<div className="stats__row">
							<dt>Ability</dt>
							<span className="stats__lead" aria-hidden="true" />
							<dd>{(mon.abilities || []).join(", ") || "—"}</dd>
						</div>
					</dl>
				</div>
			</article>

			{mon.details?.flavor_text && <DialogueBox text={mon.details.flavor_text} keys={false} />}

			<div className="entry__grid">
				<Panel plate="Base stats">
					<ul className="basestats">
						{Object.entries(mon.stats || {}).map(([k, v]) => (
							<li key={k} className="basestats__row">
								<span className="basestats__label">{formatStatLabel(k)}</span>
								<span className="basestats__value">{v}</span>
								<span className="bar__track">
									<span className="bar__fill" style={{ "--pct": `${(v / MAX_STAT) * 100}%`, "--bar-color": v >= 100 ? "var(--c-grass)" : v >= 60 ? "var(--c-sun)" : "var(--c-red)" }} />
								</span>
							</li>
						))}
					</ul>
				</Panel>

				<Panel plate="Matchups">
					<Matchups label="Takes extra damage from" types={mon.weaknesses} />
					<Matchups label="Resists" types={mon.resistances} />
					<Matchups label="Immune to" types={mon.immunities} />
				</Panel>
			</div>

			{chain.length > 1 && (
				<Panel plate="Evolution">
					<ol className="chain">
						{chain.map((c) => (
							<li key={c.id} className={`chain__step ${c.current ? "is-current" : ""}`}>
								{c.requirement && <span className="chain__req">{c.requirement}</span>}
								<Link to={`/pokedex/${c.id}`} className="chain__mon" aria-current={c.current ? "page" : undefined}>
									<PokemonSprite pokemonId={c.id} variant="front" alt="" className="sprite chain__sprite" />
									<span className="caps">{c.name}</span>
									<span className="chain__types">
										{(c.types || []).map((t) => (
											<TypeBadge key={t} type={t} />
										))}
									</span>
								</Link>
							</li>
						))}
					</ol>
				</Panel>
			)}
		</div>
	);
};

export default DexEntryScreen;
