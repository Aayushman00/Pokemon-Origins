// Game.jsx — post-login hub + starter selection, rendered as one in-device screen
// The hub also lists pending level-up evolutions (Phase 9): the server derives
// them from trainer_pokemon + pokedex Evolution and the trainer confirms here.
// Phase 10: the Continue button follows GET /api/campaign/progress into the
// trainer's current level (1–10) instead of hardcoding Level 1.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useUser } from "../../App";
import { api, getErrorMessage } from "../../api";
import Shell from "../../components/Shell/Shell";
import LcdPanel from "../../components/Shell/LcdPanel";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { MAX_CAMPAIGN_LEVEL } from "./Level";
import { typeColor } from "../../utils/typeColors";

const STARTERS = [
	{ id: "bulbasaur", name: "Bulbasaur", dex: 1, type: "GRASS", typeColor: "#78c850" },
	{ id: "charmander", name: "Charmander", dex: 4, type: "FIRE", typeColor: "#f08030" },
	{ id: "squirtle", name: "Squirtle", dex: 7, type: "WATER", typeColor: "#6890f0" },
];

const Game = () => {
	const { user, setUser } = useUser();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const [selectedStarter, setSelectedStarter] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [celebrating, setCelebrating] = useState(false);
	const celebrateTimer = useRef(null);
	const [pendingEvos, setPendingEvos] = useState([]);
	const [evoResult, setEvoResult] = useState(null);
	const [evolving, setEvolving] = useState(false);
	const [evoError, setEvoError] = useState("");
	const [progress, setProgress] = useState(null);
	const [party, setParty] = useState([]);
	const [coins, setCoins] = useState(null);
	// Move learning (pending "wants to learn" offers, one decision at a time)
	const [pendingLearns, setPendingLearns] = useState([]);
	const [learnResult, setLearnResult] = useState(null);
	const [learnError, setLearnError] = useState("");
	const [learnResolving, setLearnResolving] = useState(false);
	// "skip" | move_id | null — destructive choice awaiting confirmation
	const [armedLearnChoice, setArmedLearnChoice] = useState(null);

	// Redirect to auth if not logged in
	useEffect(() => {
		if (!user) {
			navigate("/auth");
		}
	}, [user, navigate]);

	useEffect(() => () => clearTimeout(celebrateTimer.current), []);

	const loadPendingEvolutions = useCallback(async () => {
		try {
			const { data } = await api.get("/api/evolutions/pending");
			setPendingEvos(data?.pending || []);
		} catch (err) {
			// The hub still works without the list; just log it.
			console.error("Failed to load pending evolutions:", err.message);
		}
	}, []);

	// Pending move-learn offers (DB-backed, so they survive refresh). The
	// panel resolves them one at a time in server (learnset) order.
	const loadPendingLearns = useCallback(async () => {
		try {
			const { data } = await api.get("/api/moves/pending");
			setPendingLearns(data?.pending || []);
			setArmedLearnChoice(null);
		} catch (err) {
			console.error("Failed to load pending move offers:", err.message);
		}
	}, []);

	const loadProgress = useCallback(async () => {
		try {
			const { data } = await api.get("/api/campaign/progress");
			if (data?.success && data.progress) setProgress(data.progress);
		} catch (err) {
			// Continue falls back to Level 1 when progress can't load.
			console.error("Failed to load campaign progress:", err.message);
		}
	}, []);

	// Party status for the hub (Phase 11): live species/level/HP from the
	// server, so an evolved starter no longer shows its old portrait.
	const loadParty = useCallback(async () => {
		if (!user?.trainer_id) return;
		try {
			const { data } = await api.get(`/trainer/${user.trainer_id}/data`);
			setParty(data?.pokemon || []);
		} catch (err) {
			// The hub falls back to the chosen-starter portrait.
			console.error("Failed to load party:", err.message);
		}
	}, [user]);

	// Read-only coin balance; GET /api/mart reports it even while the shop
	// itself is still locked.
	const loadCoins = useCallback(async () => {
		try {
			const { data } = await api.get("/api/mart");
			if (data?.success && typeof data.coins === "number") {
				setCoins(data.coins);
			}
		} catch (err) {
			// The hub simply omits the coin line when the wallet can't load.
			console.error("Failed to load coins:", err.message);
		}
	}, []);

	useEffect(() => {
		if (user?.starterChosen) {
			loadPendingEvolutions();
			loadPendingLearns();
			loadProgress();
			loadParty();
			loadCoins();
		}
	}, [
		user,
		loadPendingEvolutions,
		loadPendingLearns,
		loadProgress,
		loadParty,
		loadCoins,
	]);

	const handleEvolve = async (partyPosition) => {
		setEvolving(true);
		setEvoError("");
		try {
			const { data } = await api.post("/api/evolutions/confirm", {
				partyPosition,
			});
			if (!data?.success) {
				throw new Error(data?.error || "Evolution failed");
			}
			setEvoResult(data.evolved);
			// Refetch — a chain evolution (e.g. → Charizard later) may still
			// be pending, and the server is the only truth. The party strip
			// also changes species/stats on evolve.
			loadPendingEvolutions();
			loadParty();
		} catch (err) {
			console.error("Evolution failed:", err.response || err.message);
			setEvoError(getErrorMessage(err, "Evolution failed"));
			loadPendingEvolutions();
		} finally {
			setEvolving(false);
		}
	};

	// Resolve one offer: { action: "learn", forgetMoveId? } or { action:
	// "skip" }. The server re-validates everything (ownership, forget
	// target, 4-move cap) — the client only picks among offered options.
	const handleResolveLearn = async (offer, action, forgetMoveId = null) => {
		setLearnResolving(true);
		setLearnError("");
		try {
			const { data } = await api.post("/api/moves/learn", {
				pendingId: offer.pendingId,
				action,
				...(forgetMoveId != null ? { forgetMoveId } : {}),
			});
			if (!data?.success) {
				throw new Error(data?.error || "Failed to update moves");
			}
			const r = data.result;
			setLearnResult(
				r.action === "skip"
					? `${offer.nickname.toUpperCase()} gave up on learning ${offer.move.name.toUpperCase()}.`
					: `${offer.nickname.toUpperCase()}${
							r.forgot
								? ` forgot ${r.forgot.name.toUpperCase()} and`
								: ""
					  } learned ${r.learned.name.toUpperCase()}!`
			);
			loadPendingLearns();
			loadParty();
		} catch (err) {
			console.error("Move learn failed:", err.response || err.message);
			setLearnError(getErrorMessage(err, "Could not update moves"));
			// The offer may have auto-resolved server-side (mon released /
			// move already known) — refresh instead of showing a dead card.
			loadPendingLearns();
		} finally {
			setLearnResolving(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("trainer");
		localStorage.removeItem("token");
		setUser(null);
		navigate("/auth", { replace: true });
	};

	const handleChooseStarter = async () => {
		if (!selectedStarter) {
			setMessage("Choose a partner first!");
			return;
		}
		setLoading(true);
		setMessage("");
		try {
			await api.post("/api/choose-starter", {
				chosenPokemon: selectedStarter,
			});
			const updatedUser = {
				...user,
				starterChosen: true,
				starter: selectedStarter,
			};
			localStorage.setItem("trainer", JSON.stringify(updatedUser));

			// Brief pokéball-style select feedback before the hub unlocks
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				setUser(updatedUser);
			} else {
				setCelebrating(true);
				celebrateTimer.current = setTimeout(() => setUser(updatedUser), 1600);
			}
		} catch (error) {
			console.error("Error selecting starter:", error);
			setMessage(
				getErrorMessage(error, "An error occurred while choosing your starter.")
			);
		} finally {
			setLoading(false);
		}
	};

	const chosen = STARTERS.find((s) => s.id === (selectedStarter || user?.starter));

	// --- Starter selection (Prof. Oak's lab) ---
	if (!user?.starterChosen) {
		return (
			<div className="device-backdrop flex items-center justify-center p-4">
				<div className="w-full max-w-xl">
					<Shell poweredOn>
						<LcdPanel>
							<p
								className="font-pixel text-[0.55rem] text-center tracking-widest"
								style={{ color: "var(--lcd-ink-dim)" }}
							>
								POKEMON ORIGINS
							</p>

							<AnimatePresence mode="wait">
								{celebrating && chosen ? (
									<motion.div
										key="celebrate"
										className="flex flex-col items-center justify-center py-10 text-center"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
									>
										<PokemonSprite
											as={motion.img}
											pokemonId={chosen.dex}
											variant="front"
											alt={chosen.name}
											className="w-28 h-28 pixelated"
											initial={{ scale: 0 }}
											animate={{ scale: [0, 1.25, 1], rotate: [0, -6, 0] }}
											transition={{ duration: 0.6, ease: "easeOut" }}
										/>
										<motion.p
											className="font-pixel text-[0.7rem] mt-4 leading-relaxed"
											style={{ color: "var(--lcd-ink-bright)" }}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.5 }}
										>
											{chosen.name.toUpperCase()} joined your party!
										</motion.p>
									</motion.div>
								) : (
									<motion.div key="pick" exit={{ opacity: 0 }}>
										<h1
											className="font-pixel text-base text-center mt-3 leading-relaxed"
											style={{
												color: "var(--lcd-ink-bright)",
												textShadow: "0 2px 0 var(--lcd-shadow)",
											}}
										>
											PROF. OAK&apos;S LAB
										</h1>
										<p
											className="font-pixel text-[0.6rem] text-center mt-3 leading-relaxed"
											style={{ color: "var(--lcd-ink)" }}
										>
											{user?.name}! Choose your first partner.
										</p>

										<div className="grid grid-cols-3 gap-3 mt-5">
											{STARTERS.map((starter) => (
												<motion.button
													key={starter.id}
													type="button"
													whileTap={{ scale: 0.94 }}
													aria-pressed={selectedStarter === starter.id}
													className={`starter-slot ${
														selectedStarter === starter.id
															? "starter-slot--active"
															: ""
													}`}
													onClick={() => setSelectedStarter(starter.id)}
												>
													<span className="starter-cursor" aria-hidden="true">
														&#9654;
													</span>
													<PokemonSprite
														pokemonId={starter.dex}
														variant="front"
														alt={starter.name}
														className="w-20 h-20 pixelated"
													/>
													<span
														className="font-pixel text-[0.55rem]"
														style={{ color: "var(--lcd-ink-bright)" }}
													>
														{starter.name.toUpperCase()}
													</span>
													<span
														className="font-pixel text-[0.45rem] px-1.5 py-0.5 rounded"
														style={{ background: starter.typeColor, color: "#fff" }}
													>
														{starter.type}
													</span>
												</motion.button>
											))}
										</div>

										<button
											onClick={handleChooseStarter}
											disabled={loading || !selectedStarter}
											className="pixel-btn pixel-btn--primary w-full mt-5"
										>
											{loading ? "Choosing..." : "I choose you!"}
										</button>

										{message && (
											<p
												className="font-pixel text-[0.6rem] text-center mt-3 leading-relaxed"
												role="alert"
												style={{ color: "var(--hp-red)" }}
											>
												{message}
											</p>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</LcdPanel>
					</Shell>
				</div>
			</div>
		);
	}

	// --- Hub (starter already chosen) ---
	return (
		<div className="device-backdrop flex items-center justify-center p-4">
			<div className="w-full max-w-xl">
				<Shell poweredOn>
					<LcdPanel>
						<h1
							className="font-pixel text-xl text-center leading-relaxed"
							style={{
								color: "var(--lcd-ink-bright)",
								textShadow: "0 3px 0 var(--lcd-shadow)",
							}}
						>
							POKEMON ORIGINS
						</h1>
						<hr className="lcd-divider" />

						<div className="flex flex-col sm:flex-row gap-5 items-center">
							{party.length > 0 ? (
								<div className="starter-portrait shrink-0 !items-stretch gap-2">
									<span
										className="font-pixel text-[0.5rem] text-center tracking-widest"
										style={{ color: "var(--lcd-accent)" }}
									>
										PARTY
									</span>
									{party.map((mon, index) => (
										<div
											key={mon.position}
											className="flex items-center gap-2"
										>
											<PokemonSprite
												as={
													index === 0 && !reduceMotion
														? motion.img
														: undefined
												}
												pokemon={mon}
												variant="front"
												alt={mon.nickname}
												className="w-12 h-12 pixelated shrink-0"
												{...(index === 0 && !reduceMotion
													? {
															animate: { y: [0, -3, 0] },
															transition: {
																duration: 2.4,
																repeat: Infinity,
																ease: "easeInOut",
															},
													  }
													: {})}
											/>
											<div className="flex flex-col items-start">
												<span
													className="font-pixel text-[0.5rem]"
													style={{ color: "var(--lcd-ink-bright)" }}
												>
													{mon.nickname.toUpperCase()}
												</span>
												<span
													className="font-pixel text-[0.45rem]"
													style={{ color: "var(--lcd-ink-dim)" }}
												>
													Lv.{mon.level}
												</span>
												<span
													className="font-pixel text-[0.45rem]"
													style={{
														color:
															mon.current_hp <= 0
																? "var(--hp-red)"
																: mon.current_hp <= mon.max_hp / 4
																? "var(--hp-red)"
																: "var(--lcd-ink)",
													}}
												>
													{mon.current_hp <= 0
														? "FAINTED"
														: `HP ${mon.current_hp}/${mon.max_hp}`}
												</span>
											</div>
										</div>
									))}
								</div>
							) : chosen ? (
								<div className="starter-portrait shrink-0">
									<PokemonSprite
										as={reduceMotion ? undefined : motion.img}
										pokemonId={chosen.dex}
										variant="front"
										alt={chosen.name}
										className="w-24 h-24 pixelated"
										{...(reduceMotion
											? {}
											: {
													animate: { y: [0, -4, 0] },
													transition: {
														duration: 2.4,
														repeat: Infinity,
														ease: "easeInOut",
													},
											  })}
									/>
									<span
										className="font-pixel text-[0.55rem]"
										style={{ color: "var(--lcd-ink-bright)" }}
									>
										{chosen.name.toUpperCase()}
									</span>
									<span
										className="font-pixel text-[0.45rem] px-1.5 py-0.5 rounded"
										style={{ background: chosen.typeColor, color: "#fff" }}
									>
										{chosen.type}
									</span>
								</div>
							) : null}

							<div className="flex-1 w-full">
								<p
									className="font-pixel text-[0.75rem]"
									style={{ color: "var(--lcd-ink-bright)" }}
								>
									TRAINER {user.name?.toUpperCase()}
								</p>
								<p
									className="font-pixel text-[0.55rem] mt-2"
									style={{ color: "var(--lcd-ink-dim)" }}
								>
									GENDER: {user.gender?.toUpperCase() || "—"}
								</p>
								{coins !== null && (
									<p
										className="font-pixel text-[0.55rem] mt-1"
										style={{ color: "var(--lcd-ink-dim)" }}
									>
										COINS: {coins}
									</p>
								)}

								{(() => {
									// Server progress decides where Continue goes;
									// past level 10 the campaign is finished.
									const currentLevel = progress?.current_level ?? 1;
									const campaignDone = currentLevel > MAX_CAMPAIGN_LEVEL;
									const entryLevel = Math.min(currentLevel, MAX_CAMPAIGN_LEVEL);
									return campaignDone ? (
										<div
											className="font-pixel text-[0.6rem] text-center mt-4 leading-relaxed pixel-btn w-full"
											style={{ color: "var(--lcd-accent)" }}
										>
											CHAMPION — campaign complete!
										</div>
									) : (
										<button
											onClick={() => navigate(`/level/${entryLevel}`)}
											className="pixel-btn pixel-btn--primary w-full mt-4"
										>
											Continue &mdash; Level {entryLevel}
											{progress ? ` · Battle ${progress.current_battle}` : ""}
										</button>
									);
								})()}

								<nav className="mt-3 space-y-1" aria-label="Hub menu">
									<button
										className="menu-row"
										onClick={() => navigate("/game/bag")}
									>
										Bag
									</button>
									<button
										className="menu-row"
										onClick={() => navigate("/game/mart")}
									>
										Mart
									</button>
									<button
										className="menu-row"
										onClick={() => navigate("/pokedex")}
									>
										Pokedex
									</button>
									<button className="menu-row" onClick={handleLogout}>
										Log out
									</button>
								</nav>
							</div>
						</div>

						{(pendingEvos.length > 0 || evoResult) && (
							<>
								<hr className="lcd-divider" />
								<p
									className="font-pixel text-[0.6rem] text-center tracking-widest"
									style={{ color: "var(--lcd-accent)" }}
								>
									EVOLUTION
								</p>

								{evoResult ? (
									<div className="mt-3 text-center">
										<div className="flex items-center justify-center gap-4">
											<PokemonSprite
												pokemon={{ pokemon_id: evoResult.fromPokemonId }}
												variant="front"
												className="w-14 h-14 pixelated opacity-50"
											/>
											<span
												className="font-pixel text-sm"
												style={{ color: "var(--lcd-ink-bright)" }}
											>
												▶
											</span>
											<PokemonSprite
												pokemon={{ pokemon_id: evoResult.toPokemonId }}
												variant="front"
												className="w-16 h-16 pixelated"
											/>
										</div>
										<p
											className="font-pixel text-[0.55rem] mt-3 leading-relaxed"
											role="status"
											style={{ color: "var(--lcd-ink-bright)" }}
										>
											{evoResult.fromNickname.toUpperCase()} evolved into{" "}
											{evoResult.toName.toUpperCase()}!
										</p>
										<button
											className="pixel-btn w-full mt-3"
											onClick={() => setEvoResult(null)}
										>
											OK
										</button>
									</div>
								) : (
									<div className="mt-3 space-y-2">
										{pendingEvos.map((evo) => (
											<div
												key={evo.position}
												className="starter-slot w-full !flex-row !items-center gap-3"
											>
												<PokemonSprite
													pokemon={{ pokemon_id: evo.fromPokemonId }}
													variant="front"
													className="w-12 h-12 pixelated shrink-0"
												/>
												<span
													className="font-pixel text-[0.5rem] flex-1 text-left leading-relaxed"
													style={{ color: "var(--lcd-ink-bright)" }}
												>
													{evo.nickname.toUpperCase()} Lv.{evo.level}
													<span
														className="block"
														style={{ color: "var(--lcd-ink-dim)" }}
													>
														can evolve into {evo.toName.toUpperCase()}
													</span>
												</span>
												<button
													className="pixel-btn"
													disabled={evolving}
													onClick={() => handleEvolve(evo.position)}
												>
													{evolving ? "..." : "Evolve"}
												</button>
											</div>
										))}
									</div>
								)}

								{evoError && (
									<p
										className="font-pixel text-[0.55rem] text-center mt-3 leading-relaxed"
										role="alert"
										style={{ color: "var(--hp-red)" }}
									>
										{evoError}
									</p>
								)}
							</>
						)}

						{(pendingLearns.length > 0 || learnResult) && (
							<>
								<hr className="lcd-divider" />
								<p
									className="font-pixel text-[0.6rem] text-center tracking-widest"
									style={{ color: "var(--lcd-accent)" }}
								>
									MOVE LEARNING
								</p>

								{learnResult ? (
									<div className="mt-3 text-center">
										<p
											className="font-pixel text-[0.55rem] leading-relaxed"
											role="status"
											style={{ color: "var(--lcd-ink-bright)" }}
										>
											{learnResult}
										</p>
										<button
											className="pixel-btn w-full mt-3"
											onClick={() => setLearnResult(null)}
										>
											OK
										</button>
									</div>
								) : (
									(() => {
										// One decision at a time, in server (learnset) order.
										const offer = pendingLearns[0];
										const needsForget = offer.currentMoves.length >= 4;
										const armedMove =
											armedLearnChoice !== null && armedLearnChoice !== "skip"
												? offer.currentMoves.find(
														(m) => m.move_id === armedLearnChoice
												  )
												: null;
										return (
											<div className="mt-3">
												<div className="flex items-center gap-3">
													<PokemonSprite
														pokemon={{ pokemon_id: offer.pokemon_id }}
														variant="front"
														alt={offer.nickname}
														className="w-12 h-12 pixelated shrink-0"
													/>
													<p
														className="font-pixel text-[0.55rem] leading-relaxed flex-1 text-left"
														style={{ color: "var(--lcd-ink-bright)" }}
													>
														{offer.nickname.toUpperCase()} wants to learn{" "}
														{offer.move.name.toUpperCase()}!
													</p>
												</div>

												<div className="flex items-center gap-2 mt-2">
													<span
														className="font-pixel text-[0.45rem] px-1.5 py-0.5 rounded"
														style={{
															background: typeColor(offer.move.move_type),
															color: "#fff",
														}}
													>
														{(offer.move.move_type || "???").toUpperCase()}
													</span>
													<span
														className="font-pixel text-[0.45rem]"
														style={{ color: "var(--lcd-ink-dim)" }}
													>
														PWR {offer.move.power ?? "—"} · PP{" "}
														{offer.move.pp ?? "—"}
													</span>
												</div>

												{armedLearnChoice !== null ? (
													<div className="mt-3">
														<p
															className="font-pixel text-[0.55rem] leading-relaxed"
															style={{ color: "var(--lcd-ink)" }}
														>
															{armedLearnChoice === "skip"
																? `Give up on learning ${offer.move.name.toUpperCase()}?`
																: `Forget ${armedMove?.name?.toUpperCase()} and learn ${offer.move.name.toUpperCase()}?`}
														</p>
														<div className="flex gap-2 mt-2">
															<button
																className="pixel-btn pixel-btn--primary flex-1"
																disabled={learnResolving}
																onClick={() =>
																	armedLearnChoice === "skip"
																		? handleResolveLearn(offer, "skip")
																		: handleResolveLearn(
																				offer,
																				"learn",
																				armedLearnChoice
																		  )
																}
															>
																{learnResolving
																	? "..."
																	: armedLearnChoice === "skip"
																	? "Don't learn"
																	: "Forget & learn"}
															</button>
															<button
																className="pixel-btn flex-1"
																disabled={learnResolving}
																onClick={() => setArmedLearnChoice(null)}
															>
																Cancel
															</button>
														</div>
													</div>
												) : (
													<div className="mt-3 space-y-1">
														{needsForget ? (
															<>
																<p
																	className="font-pixel text-[0.5rem] leading-relaxed"
																	style={{ color: "var(--lcd-ink-dim)" }}
																>
																	{offer.nickname.toUpperCase()} already knows 4
																	moves. Choose one to forget:
																</p>
																{offer.currentMoves.map((m) => (
																	<button
																		key={m.move_id}
																		className="menu-row"
																		disabled={learnResolving}
																		onClick={() =>
																			setArmedLearnChoice(m.move_id)
																		}
																	>
																		<span className="flex-1">
																			{m.name.toUpperCase()}
																		</span>
																		<span
																			className="font-pixel text-[0.45rem] px-1.5 py-0.5 rounded"
																			style={{
																				background: typeColor(m.move_type),
																				color: "#fff",
																			}}
																		>
																			{(m.move_type || "???").toUpperCase()}
																		</span>
																		<span
																			className="font-pixel text-[0.45rem]"
																			style={{ color: "var(--lcd-ink-dim)" }}
																		>
																			PWR {m.power ?? "—"}
																		</span>
																	</button>
																))}
															</>
														) : (
															<button
																className="pixel-btn pixel-btn--primary w-full"
																disabled={learnResolving}
																onClick={() =>
																	handleResolveLearn(offer, "learn")
																}
															>
																Learn {offer.move.name.toUpperCase()}
															</button>
														)}
														<button
															className="pixel-btn w-full"
															disabled={learnResolving}
															onClick={() => setArmedLearnChoice("skip")}
														>
															Don&apos;t learn{" "}
															{offer.move.name.toUpperCase()}
														</button>
													</div>
												)}

												{pendingLearns.length > 1 && (
													<p
														className="font-pixel text-[0.45rem] mt-2 text-center leading-relaxed"
														style={{ color: "var(--lcd-ink-dim)" }}
													>
														+{pendingLearns.length - 1} more move decision
														{pendingLearns.length > 2 ? "s" : ""} queued
													</p>
												)}
											</div>
										);
									})()
								)}

								{learnError && (
									<p
										className="font-pixel text-[0.55rem] text-center mt-3 leading-relaxed"
										role="alert"
										style={{ color: "var(--hp-red)" }}
									>
										{learnError}
									</p>
								)}
							</>
						)}
					</LcdPanel>
				</Shell>
			</div>
		</div>
	);
};

export default Game;
