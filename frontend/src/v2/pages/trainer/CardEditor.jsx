import React, { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../../api";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";

const CARD_THEMES = [
	{ id: "sky", label: "Sky" },
	{ id: "grass", label: "Meadow" },
	{ id: "ember", label: "Ember" },
	{ id: "ocean", label: "Ocean" },
	{ id: "dusk", label: "Dusk" },
	{ id: "gold", label: "Gold" },
];
const MOTTO_MAX = 40;

/**
 * Edit your own trainer card: colour theme, motto, favourite Pokémon (any
 * you own, party or PC). Saves through PUT /api/trainers/me/card and hands
 * the refreshed public profile back.
 */
const CardEditor = ({ open, onClose, trainerId, card, onSaved }) => {
	const [theme, setTheme] = useState(card.theme);
	const [motto, setMotto] = useState(card.motto || "");
	const [favoriteId, setFavoriteId] = useState(card.favorite?.id ?? null);
	const [owned, setOwned] = useState(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!open) return;
		setTheme(card.theme);
		setMotto(card.motto || "");
		setFavoriteId(card.favorite?.id ?? null);
		setError("");
		Promise.all([api.get(`/trainer/${trainerId}/data`), api.get("/api/party/pc")])
			.then(([party, pc]) => setOwned([...(party.data?.pokemon || []), ...(pc.data?.pc || [])]))
			.catch(() => setOwned([]));
	}, [open, card, trainerId]);

	const save = async () => {
		setBusy(true);
		setError("");
		try {
			const { data } = await api.put("/api/trainers/me/card", { theme, motto, favoriteId });
			onSaved(data.profile);
			onClose();
		} catch (err) {
			setError(getErrorMessage(err, "Couldn't save your card"));
		} finally {
			setBusy(false);
		}
	};

	return (
		<Modal open={open} onClose={() => !busy && onClose()} title="Customize trainer card">
			<div className="card-editor">
				<fieldset className="card-editor__group">
					<legend className="field__label">Card colour</legend>
					<div className="card-editor__swatches" role="radiogroup" aria-label="Card colour">
						{CARD_THEMES.map((t) => (
							<button
								key={t.id}
								type="button"
								role="radio"
								aria-checked={theme === t.id}
								className={`swatch swatch--${t.id}`}
								onClick={() => setTheme(t.id)}
							>
								<span className="swatch__chip" aria-hidden="true" />
								{t.label}
							</button>
						))}
					</div>
				</fieldset>

				<div className="field">
					<label className="field__label" htmlFor="card-motto">
						Motto <span className="muted">({MOTTO_MAX - motto.length} left)</span>
					</label>
					<input
						id="card-motto"
						className="field__input"
						value={motto}
						maxLength={MOTTO_MAX}
						onChange={(e) => setMotto(e.target.value)}
						placeholder="A line other trainers see on your card"
					/>
				</div>

				<fieldset className="card-editor__group">
					<legend className="field__label">Favourite Pokémon</legend>
					{owned === null ? (
						<p className="loading-dots muted">Checking your Pokémon</p>
					) : (
						<div className="card-editor__mons" role="radiogroup" aria-label="Favourite Pokémon">
							<button type="button" role="radio" aria-checked={favoriteId == null} className="fav-pick" onClick={() => setFavoriteId(null)}>
								None
							</button>
							{owned.map((m) => (
								<button
									key={m.id}
									type="button"
									role="radio"
									aria-checked={favoriteId === Number(m.id)}
									aria-label={`${m.nickname}, level ${m.level}`}
									className="fav-pick"
									onClick={() => setFavoriteId(Number(m.id))}
								>
									<PokemonSprite pokemonId={m.pokemon_id} variant="front" alt="" className="sprite" />
								</button>
							))}
						</div>
					)}
				</fieldset>

				{error && (
					<p className="form-error" role="alert">
						{error}
					</p>
				)}
				<div className="result__actions">
					<Button variant="go" disabled={busy} onClick={save}>
						{busy ? "Saving…" : "Save card"}
					</Button>
					<Button disabled={busy} onClick={onClose}>
						Cancel
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default CardEditor;
