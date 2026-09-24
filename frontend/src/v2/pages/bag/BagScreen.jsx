import React, { useCallback, useEffect, useState } from "react";
import { useUser } from "../../data/user";
import { api, getErrorMessage } from "../../../api";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import MenuList from "../../ui/MenuList";
import Modal from "../../ui/Modal";
import DialogueBox from "../../ui/DialogueBox";
import { useToast } from "../../ui/toastContext";
import { PartyRow } from "../hub/PartyBoard";
import "../hub/hub.css";
import "./items.css";

const NEEDS_TARGET = new Set(["healing", "evolution_stone", "pp_restore"]);

/** Overworld bag: heal, restore PP, evolution stones (server-validated). */
const BagScreen = () => {
	const { user } = useUser();
	const toast = useToast();
	const [items, setItems] = useState(null);
	const [party, setParty] = useState([]);
	const [focus, setFocus] = useState(null);
	const [target, setTarget] = useState(null); // item awaiting a party member
	const [evolution, setEvolution] = useState(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		setError("");
		try {
			const [inv, tr] = await Promise.all([api.get("/api/inventory"), api.get(`/trainer/${user.trainer_id}/data`)]);
			if (!inv.data?.success) throw new Error(inv.data?.error || "Failed to load inventory");
			setItems(inv.data.items || []);
			setParty(tr.data?.pokemon || []);
		} catch (err) {
			setError(getErrorMessage(err, "Couldn't open your bag"));
		}
	}, [user.trainer_id]);

	useEffect(() => {
		load();
	}, [load]);

	const applyItem = async (item, partyPosition = null) => {
		setBusy(true);
		try {
			const { data } = await api.post("/api/inventory/use", { itemId: item.itemId, ...(partyPosition != null ? { partyPosition } : {}) });
			if (!data?.success) throw new Error(data?.error || "Failed to use item");
			setItems(data.items || []);
			if (data.restoredMoves != null) {
				toast(`${data.pokemon.nickname}'s PP was fully restored!`);
			} else if (data.pokemon) {
				setParty((prev) => prev.map((m) => (Number(m.position) === Number(data.pokemon.position) ? { ...m, current_hp: data.pokemon.current_hp } : m)));
				toast(`${data.pokemon.nickname} recovered ${data.amount} HP!`);
			}
			if (data.evolved) {
				const evo = data.evolved;
				setParty((prev) =>
					prev.map((m) =>
						Number(m.position) === Number(evo.position)
							? { ...m, pokemon_id: evo.toPokemonId, nickname: evo.nickname, current_hp: evo.stats.current_hp, max_hp: evo.stats.max_hp }
							: m
					)
				);
				setEvolution(evo);
			}
			setTarget(null);
		} catch (err) {
			// Target-level rejections keep the picker open for another try.
			toast(getErrorMessage(err, "That item can't be used there"), { tone: "error" });
		} finally {
			setBusy(false);
		}
	};

	if (error)
		return (
			<div className="page-center">
				<Panel lift title="Couldn't open your bag" className="journey-card">
					<p className="read" role="alert">
						{error}
					</p>
					<div className="result__actions">
						<Button variant="primary" onClick={load}>
							Try again
						</Button>
						<Button to="/game">Back to hub</Button>
					</div>
				</Panel>
			</div>
		);

	const current = focus?.item || items?.[0];

	return (
		<div className="page items">
			<div className="items__side">
				<div className="items__bag" aria-hidden="true">
					<span className="items__bag-flap" />
				</div>
				<p className="items__pocket">Items</p>
			</div>

			<Panel className="items__list" plate="Bag">
				{items === null ? (
					<p className="loading-dots muted">Opening the bag</p>
				) : items.length === 0 ? (
					<div className="empty">
						<p className="read">Your bag is empty. Win battles for coins; the Mart opens once you beat the first Gym Leader.</p>
						<Button to="/game/mart" variant="primary">
							Check the Mart
						</Button>
					</div>
				) : (
					<MenuList
						label="Items"
						autoFocus
						onActiveChange={(it) => setFocus(it)}
						items={items.map((it) => ({
							id: it.itemId,
							label: it.name,
							hint: `×${it.quantity}`,
							item: it,
							disabled: busy,
							onSelect: () => (NEEDS_TARGET.has(it.category) ? setTarget(it) : applyItem(it)),
						}))}
					/>
				)}
				<Button to="/game" className="items__back">
					Close bag
				</Button>
			</Panel>

			<DialogueBox className="items__desc" keys={false} text={current ? current.description || current.name : "Pick an item to see what it does."} />

			<Modal open={!!target} onClose={() => !busy && setTarget(null)} title={target ? `Use ${target.name} on…` : ""}>
				<div className="hud__rows items__targets">
					{party.map((m) => (
						<PartyRow key={m.position} mon={m} onSelect={() => !busy && applyItem(target, m.position)} />
					))}
				</div>
				<div className="result__actions">
					<Button disabled={busy} onClick={() => setTarget(null)}>
						Cancel
					</Button>
				</div>
			</Modal>

			<Modal open={!!evolution} onClose={() => setEvolution(null)} title="Evolution!" variant="navy">
				{evolution && (
					<>
						<div className="evo-reveal">
							<PokemonSprite pokemonId={evolution.fromPokemonId} variant="front" alt="" className="sprite evo-reveal__from" />
							<span className="evo-reveal__arrow" aria-hidden="true" />
							<PokemonSprite pokemonId={evolution.toPokemonId} variant="front" alt={evolution.toName} className="sprite evo-reveal__to" />
						</div>
						<p className="hub-event__text">
							{evolution.fromNickname.toUpperCase()} evolved into {evolution.toName.toUpperCase()}!
						</p>
						<div className="result__actions">
							<Button variant="primary" onClick={() => setEvolution(null)}>
								OK
							</Button>
						</div>
					</>
				)}
			</Modal>
		</div>
	);
};

export default BagScreen;
