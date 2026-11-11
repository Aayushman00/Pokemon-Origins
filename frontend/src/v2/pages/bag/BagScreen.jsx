import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../data/user";
import { api, getErrorMessage } from "../../../api";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import MenuList from "../../ui/MenuList";
import Modal from "../../ui/Modal";
import DialogueBox from "../../ui/DialogueBox";
import { useToast } from "../../ui/toastContext";
import PartyRow from "../../ui/PartyRow";
import Tabs from "../../ui/Tabs";
import MenuIcon from "../../ui/MenuIcon";
import { HpBar } from "../../ui/Bars";
import "./items.css";

const NEEDS_TARGET = new Set(["healing", "evolution_stone", "pp_restore"]);
// Two pockets, as on a handheld: stones in one, everything you drink or spray in the other.
const POCKETS = [
	{ id: "medicine", label: "Medicine" },
	{ id: "stones", label: "Stones" },
];
const pocketOf = (item) => (item.category === "evolution_stone" ? "stones" : "medicine");
/** What the item does, in a few words, for the list row. */
const effectOf = (item) =>
	item.healAmount ? `+${item.healAmount} HP` : item.category === "pp_restore" ? "Full PP" : item.category === "evolution_stone" ? "Evolves" : "";

/** Overworld bag: heal, restore PP, evolution stones (server-validated). */
const BagScreen = () => {
	const { user } = useUser();
	const toast = useToast();
	const navigate = useNavigate();
	const [pocket, setPocket] = useState("medicine");
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

	const shown = (items || []).filter((it) => pocketOf(it) === pocket);
	const current = shown.find((it) => it.itemId === focus?.item?.itemId) || shown[0];
	const count = (id) => (items || []).filter((it) => pocketOf(it) === id).reduce((n, it) => n + it.quantity, 0);

	return (
		<div className="page items">
			<div className="items__side">
				<div className="items__bag" aria-hidden="true">
					<span className="items__bag-flap" />
				</div>
				<p className="items__pocket">{POCKETS.find((p) => p.id === pocket).label}</p>
				{party.length > 0 && (
					<ul className="items__party" aria-label="Your party's HP">
						{party.map((m) => (
							<li key={m.position} className={m.current_hp <= 0 ? "is-fainted" : ""}>
								<span className="caps">{m.nickname}</span>
								<HpBar current={m.current_hp} max={m.max_hp} showValue />
							</li>
						))}
					</ul>
				)}
			</div>

			<Panel className="items__list" plate="Bag">
				{items === null ? (
					<p className="loading-dots muted">Opening the bag</p>
				) : items.length === 0 ? (
					<div className="empty">
						<p className="read">Your bag is empty. Win battles for coins, then spend them at the Mart.</p>
						<Button to="/game/mart" variant="primary">
							Check the Mart
						</Button>
					</div>
				) : (
					<>
						<Tabs
							label="Bag pockets"
							className="items__pockets"
							value={pocket}
							onChange={setPocket}
							tabs={POCKETS.map((p) => ({ id: p.id, label: `${p.label} ${count(p.id)}` }))}
						/>
						{shown.length === 0 ? (
							<p className="read muted items__none">Nothing in this pocket.</p>
						) : (
							<MenuList
								key={pocket}
								label={`${pocket} pocket`}
								autoFocus
								onBack={() => navigate("/game")}
								onActiveChange={(it) => setFocus(it)}
								items={shown.map((it) => ({
									id: it.itemId,
									icon: <MenuIcon name={it.category} />,
									label: (
										<span className="bag-row">
											<span>{it.name}</span>
											<span className="bag-row__fx">{effectOf(it)}</span>
										</span>
									),
									ariaLabel: `${it.name}, ${effectOf(it)}, ${it.quantity} left`,
									hint: `×${it.quantity}`,
									item: it,
									disabled: busy,
									onSelect: () => (NEEDS_TARGET.has(it.category) ? setTarget(it) : applyItem(it)),
								}))}
							/>
						)}
					</>
				)}
				<Button to="/game" className="items__back">
					Close bag
				</Button>
			</Panel>

			<DialogueBox className="items__desc" keys={false} text={current ? `${current.name}: ${current.description || effectOf(current)}` : "Pick an item to see what it does."} />

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
