// Bag.jsx — overworld inventory (Phase 7) + stone evolution (Phase 9).
// Items and quantities are server truth (GET /api/inventory); using an item
// posts to /api/inventory/use and renders the server-updated HP/quantities.
// Evolution stones target a party member; on success the server returns the
// evolved snapshot and we show a before/after PokemonSprite reveal.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../App";
import { api, getErrorMessage } from "../../api";
import Shell from "../../components/Shell/Shell";
import LcdPanel from "../../components/Shell/LcdPanel";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";

const Bag = () => {
	const { user } = useUser();
	const navigate = useNavigate();
	const [items, setItems] = useState(null);
	const [party, setParty] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null); // item awaiting a party target
	const [evolution, setEvolution] = useState(null); // server evolution result to reveal
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const [messageTone, setMessageTone] = useState("info"); // 'info' | 'error'
	const [error, setError] = useState("");

	useEffect(() => {
		if (!user) navigate("/auth");
	}, [user, navigate]);

	const load = useCallback(async () => {
		try {
			const [invRes, trainerRes] = await Promise.all([
				api.get("/api/inventory"),
				api.get(`/trainer/${user.trainer_id}/data`),
			]);
			if (!invRes.data?.success) {
				throw new Error(invRes.data?.error || "Failed to load inventory");
			}
			setItems(invRes.data.items || []);
			setParty(trainerRes.data?.pokemon || []);
		} catch (err) {
			console.error("Failed to load bag:", err.response || err.message);
			setError(getErrorMessage(err, "Failed to load your bag"));
		}
	}, [user]);

	useEffect(() => {
		if (user) load();
	}, [user, load]);

	const say = (text, tone = "info") => {
		setMessage(text);
		setMessageTone(tone);
	};

	const useItem = async (item, partyPosition) => {
		setBusy(true);
		setMessage("");
		try {
			const { data } = await api.post("/api/inventory/use", {
				itemId: item.itemId,
				...(partyPosition != null ? { partyPosition } : {}),
			});
			if (!data?.success) {
				throw new Error(data?.error || "Failed to use item");
			}
			setItems(data.items || []);
			if (data.restoredMoves != null) {
				// Elixir (Phase 14): PP was topped up — no HP change.
				say(`${data.pokemon.nickname}'s move PP was fully restored!`);
			} else if (data.pokemon) {
				setParty((prev) =>
					prev.map((mon) =>
						Number(mon.position) === Number(data.pokemon.position)
							? { ...mon, current_hp: data.pokemon.current_hp }
							: mon
					)
				);
				say(
					`${data.pokemon.nickname} recovered ${data.amount} HP! (${data.pokemon.current_hp}/${data.pokemon.max_hp})`
				);
			}
			if (data.evolved) {
				const evo = data.evolved;
				setParty((prev) =>
					prev.map((mon) =>
						Number(mon.position) === Number(evo.position)
							? {
									...mon,
									pokemon_id: evo.toPokemonId,
									nickname: evo.nickname,
									current_hp: evo.stats.current_hp,
									max_hp: evo.stats.max_hp,
							  }
							: mon
					)
				);
				setEvolution(evo);
			}
			setSelectedItem(null);
		} catch (err) {
			console.error("Item use failed:", err.response || err.message);
			say(getErrorMessage(err, "Could not use that item"), "error");
			// Target-level rejections (fainted / full HP / stone with no
			// effect on that species) keep the picker open to retry.
		} finally {
			setBusy(false);
		}
	};

	const handleItemClick = (item) => {
		if (busy) return;
		setMessage("");
		if (
			item.category === "healing" ||
			item.category === "evolution_stone" ||
			item.category === "pp_restore"
		) {
			// All need a party target; the server validates the choice.
			setSelectedItem(item);
			return;
		}
		useItem(item, null);
	};

	if (error)
		return (
			<div className="device-backdrop flex items-center justify-center p-4">
				<div className="font-pixel text-center max-w-md space-y-4">
					<p
						className="text-[0.7rem] leading-relaxed"
						role="alert"
						style={{ color: "var(--hp-red)" }}
					>
						{error}
					</p>
					<div className="flex gap-2 justify-center">
						<button
							className="pixel-btn pixel-btn--primary"
							onClick={() => {
								setError("");
								load();
							}}
						>
							Retry
						</button>
						<button className="pixel-btn" onClick={() => navigate("/game")}>
							Back to hub
						</button>
					</div>
				</div>
			</div>
		);

	return (
		<div className="device-backdrop flex items-center justify-center p-4">
			<div className="w-full max-w-xl">
				<Shell poweredOn>
					<LcdPanel>
						<h1
							className="font-pixel text-base text-center leading-relaxed"
							style={{
								color: "var(--lcd-ink-bright)",
								textShadow: "0 2px 0 var(--lcd-shadow)",
							}}
						>
							BAG
						</h1>
						<hr className="lcd-divider" />

						{items === null ? (
							<p
								className="font-pixel text-[0.6rem] text-center"
								style={{ color: "var(--lcd-ink-dim)" }}
							>
								Opening the bag...
							</p>
						) : evolution ? (
							<>
								<p
									className="font-pixel text-[0.65rem] text-center leading-relaxed"
									role="status"
									style={{ color: "var(--lcd-accent)" }}
								>
									What? {evolution.fromNickname.toUpperCase()} is evolving!
								</p>
								<div className="flex items-center justify-center gap-4 mt-4">
									<PokemonSprite
										pokemon={{ pokemon_id: evolution.fromPokemonId }}
										variant="front"
										className="w-16 h-16 pixelated opacity-50"
									/>
									<span
										className="font-pixel text-sm"
										style={{ color: "var(--lcd-ink-bright)" }}
									>
										▶
									</span>
									<PokemonSprite
										pokemon={{ pokemon_id: evolution.toPokemonId }}
										variant="front"
										className="w-20 h-20 pixelated"
									/>
								</div>
								<p
									className="font-pixel text-[0.6rem] text-center mt-4 leading-relaxed"
									style={{ color: "var(--lcd-ink-bright)" }}
								>
									{evolution.fromNickname.toUpperCase()} evolved into{" "}
									{evolution.toName.toUpperCase()}!
								</p>
								<button
									className="pixel-btn w-full mt-5"
									onClick={() => setEvolution(null)}
								>
									OK
								</button>
							</>
						) : selectedItem ? (
							<>
								<p
									className="font-pixel text-[0.6rem] leading-relaxed"
									style={{ color: "var(--lcd-ink)" }}
								>
									Use {selectedItem.name.toUpperCase()} on which Pokémon?
								</p>
								<div className="mt-3 space-y-2">
									{party.map((mon) => (
										<button
											key={mon.position}
											className="starter-slot w-full !flex-row !items-center gap-3"
											disabled={busy}
											onClick={() => useItem(selectedItem, mon.position)}
										>
											<PokemonSprite
												pokemon={mon}
												variant="front"
												className="w-12 h-12 pixelated shrink-0"
											/>
											<span
												className="font-pixel text-[0.55rem] flex-1 text-left"
												style={{ color: "var(--lcd-ink-bright)" }}
											>
												{mon.nickname}{" "}
												<span style={{ color: "var(--lcd-ink-dim)" }}>
													Lv.{mon.level}
												</span>
											</span>
											<span
												className="font-pixel text-[0.5rem]"
												style={{
													color:
														mon.current_hp <= 0
															? "var(--hp-red)"
															: "var(--lcd-ink)",
												}}
											>
												{mon.current_hp <= 0
													? "FNT"
													: `HP ${mon.current_hp}/${mon.max_hp}`}
											</span>
										</button>
									))}
								</div>
								<button
									className="pixel-btn w-full mt-4"
									disabled={busy}
									onClick={() => {
										setSelectedItem(null);
										setMessage("");
									}}
								>
									Cancel
								</button>
							</>
						) : items.length === 0 ? (
							<p
								className="font-pixel text-[0.6rem] text-center leading-relaxed"
								style={{ color: "var(--lcd-ink-dim)" }}
							>
								Your bag is empty.
							</p>
						) : (
							<div className="space-y-2">
								{items.map((item) => (
									<button
										key={item.itemId}
										className="starter-slot w-full !flex-row !items-start gap-3 text-left"
										disabled={busy}
										onClick={() => handleItemClick(item)}
									>
										<span className="flex-1">
											<span
												className="font-pixel text-[0.6rem] block"
												style={{ color: "var(--lcd-ink-bright)" }}
											>
												{item.name.toUpperCase()}{" "}
												<span style={{ color: "var(--lcd-ink-dim)" }}>
													x{item.quantity}
												</span>
											</span>
											<span
												className="font-pixel text-[0.45rem] block mt-1 leading-relaxed"
												style={{ color: "var(--lcd-ink-dim)" }}
											>
												{item.description}
											</span>
										</span>
									</button>
								))}
							</div>
						)}

						{message && (
							<p
								className="font-pixel text-[0.55rem] text-center mt-4 leading-relaxed"
								role={messageTone === "error" ? "alert" : "status"}
								style={{
									color:
										messageTone === "error"
											? "var(--hp-red)"
											: "var(--lcd-accent)",
								}}
							>
								{message}
							</p>
						)}

						<button
							className="pixel-btn w-full mt-5"
							onClick={() => navigate("/game")}
						>
							Back to hub
						</button>
					</LcdPanel>
				</Shell>
			</div>
		</div>
	);
};

export default Bag;
