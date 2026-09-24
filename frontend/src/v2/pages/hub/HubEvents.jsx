import React, { useState } from "react";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import { api, getErrorMessage } from "../../../api";
import Button from "../../ui/Button";
import { TypeBadge } from "../../ui/Badges";
import { useToast } from "../../ui/toastContext";

/**
 * Hub "events": server-derived pending evolutions and move-learn offers.
 * Same contracts as V1 (POST /api/evolutions/confirm, /api/moves/learn);
 * the server re-validates every choice. Shown one decision at a time.
 */
const HubEvents = ({ pendingEvos, pendingLearns, reloadEvos, reloadLearns, reloadParty }) => {
	const toast = useToast();
	const [busy, setBusy] = useState(false);
	const [evoResult, setEvoResult] = useState(null);
	const [armed, setArmed] = useState(null); // "skip" | move_id — destructive choice awaiting confirm

	const evolve = async (position) => {
		setBusy(true);
		try {
			const { data } = await api.post("/api/evolutions/confirm", { partyPosition: position });
			if (!data?.success) throw new Error(data?.error || "Evolution failed");
			setEvoResult(data.evolved);
			reloadParty();
		} catch (err) {
			toast(getErrorMessage(err, "Evolution failed"), { tone: "error" });
		} finally {
			reloadEvos();
			setBusy(false);
		}
	};

	const resolveLearn = async (offer, action, forgetMoveId = null) => {
		setBusy(true);
		try {
			const { data } = await api.post("/api/moves/learn", {
				pendingId: offer.pendingId,
				action,
				...(forgetMoveId != null ? { forgetMoveId } : {}),
			});
			if (!data?.success) throw new Error(data?.error || "Failed to update moves");
			const r = data.result;
			toast(
				r.action === "skip"
					? `${offer.nickname.toUpperCase()} did not learn ${offer.move.name.toUpperCase()}.`
					: `${offer.nickname.toUpperCase()}${r.forgot ? ` forgot ${r.forgot.name.toUpperCase()} and` : ""} learned ${r.learned.name.toUpperCase()}!`
			);
			reloadParty();
		} catch (err) {
			toast(getErrorMessage(err, "Could not update moves"), { tone: "error" });
		} finally {
			setArmed(null);
			reloadLearns();
			setBusy(false);
		}
	};

	if (evoResult) {
		return (
			<section className="frame panel panel--navy hub-event" aria-live="polite">
				<div className="evo-reveal">
					<PokemonSprite pokemonId={evoResult.fromPokemonId} variant="front" alt="" className="sprite evo-reveal__from" />
					<span className="evo-reveal__arrow" aria-hidden="true" />
					<PokemonSprite pokemonId={evoResult.toPokemonId} variant="front" alt={evoResult.toName} className="sprite evo-reveal__to" />
				</div>
				<p className="hub-event__text">
					Congratulations! {evoResult.fromNickname.toUpperCase()} evolved into {evoResult.toName.toUpperCase()}!
				</p>
				<div className="hub-event__actions">
					<Button variant="primary" onClick={() => setEvoResult(null)}>
						OK
					</Button>
				</div>
			</section>
		);
	}

	const evo = pendingEvos[0];
	if (evo) {
		return (
			<section className="frame panel panel--navy hub-event">
				<div className="hub-event__row">
					<PokemonSprite pokemonId={evo.fromPokemonId} variant="front" alt="" className="sprite hub-event__sprite evo-shimmer" />
					<p className="hub-event__text">
						What? {evo.nickname.toUpperCase()} (Lv. {evo.level}) is ready to evolve into {evo.toName.toUpperCase()}!
					</p>
				</div>
				<div className="hub-event__actions">
					<Button variant="go" disabled={busy} onClick={() => evolve(evo.position)}>
						{busy ? "Evolving…" : "Evolve"}
					</Button>
					{pendingEvos.length > 1 && <span className="hub-event__more">{pendingEvos.length - 1} more waiting</span>}
				</div>
			</section>
		);
	}

	const offer = pendingLearns[0];
	if (!offer) return null;
	const needsForget = offer.currentMoves.length >= 4;
	const armedMove = armed != null && armed !== "skip" ? offer.currentMoves.find((m) => m.move_id === armed) : null;
	const moveName = offer.move.name.toUpperCase();

	return (
		<section className="frame panel panel--navy hub-event">
			<div className="hub-event__row">
				<PokemonSprite pokemonId={offer.pokemon_id} variant="front" alt="" className="sprite hub-event__sprite" />
				<div>
					<p className="hub-event__text">
						{armed === "skip"
							? `Stop learning ${moveName}?`
							: armedMove
							? `Forget ${armedMove.name.toUpperCase()} and learn ${moveName}?`
							: needsForget
							? `${offer.nickname.toUpperCase()} wants to learn ${moveName}, but already knows 4 moves. Pick one to forget.`
							: `${offer.nickname.toUpperCase()} wants to learn ${moveName}!`}
					</p>
					<p className="hub-event__meta">
						<TypeBadge type={offer.move.move_type} /> Power {offer.move.power ?? "—"}, PP {offer.move.pp ?? "—"}
					</p>
				</div>
			</div>

			{armed != null ? (
				<div className="hub-event__actions">
					<Button
						variant={armed === "skip" ? "danger" : "go"}
						disabled={busy}
						onClick={() => (armed === "skip" ? resolveLearn(offer, "skip") : resolveLearn(offer, "learn", armed))}
					>
						{armed === "skip" ? "Don't learn" : "Forget and learn"}
					</Button>
					<Button disabled={busy} onClick={() => setArmed(null)}>
						Back
					</Button>
				</div>
			) : (
				<>
					{needsForget && (
						<div className="hub-event__moves" role="group" aria-label="Move to forget">
							{offer.currentMoves.map((m) => (
								<Button key={m.move_id} size="sm" disabled={busy} onClick={() => setArmed(m.move_id)}>
									<TypeBadge type={m.move_type} />
									<span className="caps">{m.name}</span>
								</Button>
							))}
						</div>
					)}
					<div className="hub-event__actions">
						{!needsForget && (
							<Button variant="go" disabled={busy} onClick={() => resolveLearn(offer, "learn")}>
								Learn {moveName}
							</Button>
						)}
						<Button disabled={busy} onClick={() => setArmed("skip")}>
							Don&apos;t learn
						</Button>
						{pendingLearns.length > 1 && <span className="hub-event__more">{pendingLearns.length - 1} more waiting</span>}
					</div>
				</>
			)}
		</section>
	);
};

export default HubEvents;
