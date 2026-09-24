import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../../../api";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import { TypeList } from "../../ui/Badges";
import Cursor from "../../ui/Cursor";
import "./dex.css";

const dexNo = (id) => String(id).padStart(3, "0");

/** Two-pane dex: numbered list with a cursor, preview of the highlighted entry. */
const DexScreen = () => {
	const navigate = useNavigate();
	const [list, setList] = useState(null);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [type, setType] = useState("");
	const [active, setActive] = useState(0);

	const load = useCallback(async () => {
		setError("");
		try {
			const { data } = await api.get("/pokemon");
			setList(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(getErrorMessage(err, "Couldn't load the Pokédex"));
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const types = useMemo(() => [...new Set((list || []).flatMap((p) => p.types))].sort(), [list]);
	const shown = useMemo(
		() =>
			(list || []).filter(
				(p) =>
					(!query || p.name.toLowerCase().includes(query.toLowerCase()) || dexNo(p.pokemon_id).includes(query)) &&
					(!type || p.types.includes(type))
			),
		[list, query, type]
	);

	useEffect(() => setActive(0), [query, type]);

	const onKey = (e) => {
		if (!shown.length) return;
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			const next = Math.max(0, Math.min(shown.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
			setActive(next);
			document.getElementById(`dex-${shown[next].pokemon_id}`)?.focus();
		}
	};

	if (error)
		return (
			<div className="page-center">
				<Panel lift title="Couldn't load the Pokédex" className="journey-card">
					<p className="read" role="alert">
						{error}
					</p>
					<div className="result__actions">
						<Button variant="primary" onClick={load}>
							Try again
						</Button>
					</div>
				</Panel>
			</div>
		);

	const focus = shown[active];

	return (
		<div className="page dex">
			<header className="dex__head">
				<h1 className="dex__title">Pokédex</h1>
				<p className="muted">{list ? `${shown.length} of ${list.length} entries` : "Loading entries…"}</p>
			</header>

			<div className="dex__filters">
				<label className="field dex__search">
					<span className="sr-only">Search by name or number</span>
					<input className="field__input" type="search" placeholder="Search name or number" value={query} onChange={(e) => setQuery(e.target.value)} />
				</label>
				<label className="field dex__type">
					<span className="sr-only">Filter by type</span>
					<select className="field__input" value={type} onChange={(e) => setType(e.target.value)}>
						<option value="">All types</option>
						{types.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="dex__panes">
				<div className="frame panel dex__list" onKeyDown={onKey}>
					{!list ? (
						<p className="loading-dots muted">Reading entries</p>
					) : shown.length === 0 ? (
						<p className="read muted">Nothing matches. Try another name or clear the type filter.</p>
					) : (
						<ol className="dex__rows">
							{shown.map((p, i) => (
								<li key={p.pokemon_id}>
									<Link
										id={`dex-${p.pokemon_id}`}
										to={`/pokedex/${p.pokemon_id}`}
										className={`dex__row ${i === active ? "is-active" : ""}`}
										tabIndex={i === active ? 0 : -1}
										onMouseEnter={() => setActive(i)}
										onFocus={() => setActive(i)}
									>
										<Cursor hidden={i !== active} />
										<PokemonSprite pokemonId={p.pokemon_id} variant="front" alt="" className="sprite dex__mini" loading="lazy" />
										<span className="dex__no">No. {dexNo(p.pokemon_id)}</span>
										<span className="dex__name caps">{p.name}</span>
									</Link>
								</li>
							))}
						</ol>
					)}
				</div>

				<aside className="frame panel dex__preview" aria-live="polite">
					{focus && (
						<>
							<div className="dex__stage">
								<PokemonSprite key={focus.pokemon_id} pokemonId={focus.pokemon_id} variant="front" alt={focus.name} className="sprite dex__big" />
							</div>
							<p className="dex__no">No. {dexNo(focus.pokemon_id)}</p>
							<h2 className="dex__pname caps">{focus.name}</h2>
							<TypeList types={focus.types} />
							<Button variant="primary" onClick={() => navigate(`/pokedex/${focus.pokemon_id}`)}>
								Open entry
							</Button>
						</>
					)}
				</aside>
			</div>
		</div>
	);
};

export default DexScreen;
