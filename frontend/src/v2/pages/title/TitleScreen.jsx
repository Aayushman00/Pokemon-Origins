import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../data/user";
import { api } from "../../../api";
import BattlePokemonSprite from "../../../components/PokemonSprite/BattlePokemonSprite";
import MenuList from "../../ui/MenuList";
import "./title.css";

const ROTATE_MS = 3200;

/** Title screen: wordmark, a rotating creature from the real dex, main menu. */
const TitleScreen = () => {
	const { user } = useUser();
	const navigate = useNavigate();
	const [pool, setPool] = useState([]);
	const [idx, setIdx] = useState(0);

	useEffect(() => {
		let alive = true;
		api
			.get("/pokemon")
			.then(({ data }) => {
				if (!alive || !Array.isArray(data)) return;
				const ids = data.map((p) => p.pokemon_id).filter(Boolean);
				const picks = [];
				while (picks.length < Math.min(8, ids.length)) {
					const id = ids[Math.floor(Math.random() * ids.length)];
					if (!picks.includes(id)) picks.push(id);
				}
				setPool(picks);
			})
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		if (pool.length < 2) return undefined;
		const id = setInterval(() => setIdx((i) => (i + 1) % pool.length), ROTATE_MS);
		return () => clearInterval(id);
	}, [pool.length]);

	const items = user
		? [
				{ id: "continue", label: "Continue", hint: user.name, onSelect: () => navigate("/game") },
				{ id: "play", label: "Playground", onSelect: () => navigate("/playground") },
				{ id: "dex", label: "Pokédex", onSelect: () => navigate("/pokedex") },
		]
		: [
				{ id: "new", label: "New game", onSelect: () => navigate("/auth?mode=register") },
				{ id: "continue", label: "Continue", hint: "log in", onSelect: () => navigate("/auth") },
				{ id: "play", label: "Visit the Playground", hint: "as a guest", onSelect: () => navigate("/playground") },
				{ id: "dex", label: "Pokédex", onSelect: () => navigate("/pokedex") },
		];

	const featured = pool[idx];

	return (
		<div className="title">
			<div className="title__sky" aria-hidden="true" />
			<div className="title__inner">
				<h1 className="title__word">
					<span className="title__battle">Battle</span>
					<span className="title__sim">SIM</span>
				</h1>
				<p className="title__tag read">Build a party, clear ten towns, and meet other trainers along the way.</p>

				<div className="title__stage" aria-hidden="true">
					<span className="title__plat" />
					{featured && (
						<BattlePokemonSprite key={featured} pokemonId={featured} variant="front" alt="" className="sprite title__mon" />
					)}
				</div>

				<nav className="frame panel title__menu frame--lift" aria-label="Title menu">
					<MenuList items={items} label="Title menu" autoFocus />
				</nav>
			</div>
		</div>
	);
};

export default TitleScreen;
