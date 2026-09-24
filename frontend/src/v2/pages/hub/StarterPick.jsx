import React, { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import { api, getErrorMessage } from "../../../api";
import DialogueBox from "../../ui/DialogueBox";
import Button from "../../ui/Button";
import { TypeBadge } from "../../ui/Badges";
import Cursor from "../../ui/Cursor";

// The backend accepts exactly these ids (POST /api/choose-starter).
const STARTERS = [
	{ id: "bulbasaur", name: "Bulbasaur", dex: 1, type: "Grass", blurb: "the Grass type" },
	{ id: "charmander", name: "Charmander", dex: 4, type: "Fire", blurb: "the Fire type" },
	{ id: "squirtle", name: "Squirtle", dex: 7, type: "Water", blurb: "the Water type" },
];

/** First-run lab scene: pick a partner, confirm in the text box. */
const StarterPick = ({ user, setUser }) => {
	const reduce = useReducedMotion();
	const [cursor, setCursor] = useState(1);
	const [picked, setPicked] = useState(null);
	const [saving, setSaving] = useState(false);
	const [joined, setJoined] = useState(null);
	const [error, setError] = useState("");
	const refs = useRef([]);

	const onKey = (e) => {
		if (picked) return;
		if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			e.preventDefault();
			const next = (cursor + (e.key === "ArrowRight" ? 1 : -1) + STARTERS.length) % STARTERS.length;
			setCursor(next);
			refs.current[next]?.focus();
		}
	};

	const confirm = async () => {
		setSaving(true);
		setError("");
		try {
			await api.post("/api/choose-starter", { chosenPokemon: picked.id });
			const updated = { ...user, starterChosen: true, starter: picked.id };
			localStorage.setItem("trainer", JSON.stringify(updated));
			setJoined(picked);
			setTimeout(() => setUser(updated), reduce ? 0 : 1600);
		} catch (err) {
			setError(getErrorMessage(err, "Could not register your partner. Try again."));
			setSaving(false);
		}
	};

	const text = joined
		? `${joined.name.toUpperCase()} joined your party! Your journey starts now.`
		: error
		? error
		: picked
		? `So you want ${picked.name.toUpperCase()}, ${picked.blurb}?`
		: `${user.name}, three Pokémon are waiting on the table. Which one will be your partner?`;

	return (
		<div className="page starter">
			<h1 className="starter__title">Choose your partner</h1>
			<div className="starter__table" role="radiogroup" aria-label="Starter Pokémon" onKeyDown={onKey}>
				{STARTERS.map((s, i) => {
					const isPicked = picked?.id === s.id || joined?.id === s.id;
					return (
						<button
							key={s.id}
							ref={(el) => (refs.current[i] = el)}
							type="button"
							role="radio"
							aria-checked={isPicked}
							tabIndex={i === cursor ? 0 : -1}
							disabled={!!picked && !isPicked}
							className={`starter__slot ${i === cursor ? "is-cursor" : ""} ${isPicked ? "is-picked" : ""}`}
							onMouseEnter={() => !picked && setCursor(i)}
							onFocus={() => setCursor(i)}
							onClick={() => !picked && setPicked(s)}
						>
							<span className="starter__cursor">
								<Cursor down hidden={i !== cursor || !!picked} />
							</span>
							<PokemonSprite pokemonId={s.dex} variant="front" alt="" className={`sprite starter__sprite ${isPicked && joined ? "starter__sprite--joined" : ""}`} />
							<span className="starter__pedestal" aria-hidden="true" />
							<span className="starter__name caps">{s.name}</span>
							<TypeBadge type={s.type} />
						</button>
					);
				})}
			</div>

			<DialogueBox text={text} keys={false} className="starter__dialogue">
				{picked && !joined && (
					<div className="starter__confirm" onClick={(e) => e.stopPropagation()}>
						<Button variant="go" disabled={saving} onClick={confirm}>
							{saving ? "Saving…" : "Yes, I choose you"}
						</Button>
						<Button variant="navy" disabled={saving} onClick={() => { setPicked(null); setError(""); }}>
							No, look again
						</Button>
					</div>
				)}
			</DialogueBox>
		</div>
	);
};

export default StarterPick;
