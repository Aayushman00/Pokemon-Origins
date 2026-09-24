import React, { useEffect, useState } from "react";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import { api, getErrorMessage } from "../../../api";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import { TypeList } from "../../ui/Badges";
import { PartyRow } from "../hub/PartyBoard";

const MAX_PARTY = 3;
const TITLES = {
	gym_boss: "Gym victory reward",
	champion: "Champion's reward",
	legendary: "Legendary reward",
};

/**
 * Boss reward offer (GET /api/rewards/pending, POST /api/rewards/claim).
 * Calls onDone immediately when nothing is pending; "Decide later" keeps
 * the offer server-side for the next visit.
 */
const RewardScreen = ({ onDone }) => {
	const [reward, setReward] = useState(null);
	const [party, setParty] = useState([]);
	const [picked, setPicked] = useState(null);
	const [step, setStep] = useState("cards"); // cards | replace | claimed
	const [claimed, setClaimed] = useState(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		api
			.get("/api/rewards/pending")
			.then(({ data }) => {
				if (cancelled) return;
				if (!data?.success || !data.reward) onDone();
				else {
					setReward(data.reward);
					setParty(data.party || []);
				}
			})
			.catch(() => !cancelled && onDone());
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const option = reward?.options?.find((o) => o.optionId === picked);

	const claim = async (replacePartyPosition = null) => {
		setBusy(true);
		setError("");
		try {
			const { data } = await api.post("/api/rewards/claim", {
				offerId: reward.offerId,
				optionId: option.optionId,
				...(replacePartyPosition != null ? { replacePartyPosition } : {}),
			});
			if (!data?.success) throw new Error(data?.error || "Failed to claim reward");
			setClaimed(data);
			setStep("claimed");
		} catch (err) {
			const code = err.response?.status;
			if (code === 404 || code === 409) return onDone();
			setError(getErrorMessage(err, "Couldn't claim the reward"));
		} finally {
			setBusy(false);
		}
	};

	if (!reward)
		return (
			<div className="page-center">
				<p className="loading-dots">Checking for rewards</p>
			</div>
		);

	if (step === "claimed")
		return (
			<div className="page reward">
				<h1 className="reward__title">{claimed.pokemon.nickname} joined your party!</h1>
				<Panel lift className="journey-card" style={{ justifySelf: "center" }}>
					<PokemonSprite pokemon={claimed.pokemon} variant="front" className="sprite reward-card__sprite" />
					<p className="read">
						Lv. {claimed.pokemon.level}, now in slot {claimed.position}.
					</p>
					<div className="hud__rows" style={{ marginTop: 16 }}>
						{(claimed.party || []).map((m) => (
							<PartyRow key={m.position} mon={m} />
						))}
					</div>
					<div className="result__actions">
						<Button variant="go" onClick={onDone} autoFocus>
							Continue
						</Button>
					</div>
				</Panel>
			</div>
		);

	if (step === "replace")
		return (
			<div className="page reward">
				<h1 className="reward__title">Your party is full</h1>
				<Panel lift plate={`Who goes to the PC to make room for ${option.nickname}?`}>
					<div className="hud__rows">
						{party.map((m) => (
							<PartyRow key={m.position} mon={m} tag="To PC" onSelect={() => !busy && claim(m.position)} />
						))}
					</div>
					{error && (
						<p className="form-error" role="alert">
							{error}
						</p>
					)}
					<div className="result__actions">
						<Button disabled={busy} onClick={() => setStep("cards")}>
							Back to choices
						</Button>
					</div>
				</Panel>
			</div>
		);

	return (
		<div className="page reward">
			<h1 className="reward__title">{TITLES[reward.source] || "Victory reward"}</h1>
			<p className="read" style={{ textAlign: "center" }}>
				Choose one Pokémon to join your party.
			</p>
			<div className="reward__cards" role="group" aria-label="Reward choices">
				{reward.options.map((o) => (
					<button
						key={o.optionId}
						type="button"
						className="frame reward-card frame--lift"
						aria-pressed={picked === o.optionId}
						onClick={() => setPicked(o.optionId)}
					>
						<PokemonSprite pokemon={o} variant="front" alt="" className="sprite reward-card__sprite bob" />
						<span className="reward-card__name caps">{o.nickname}</span>
						<span>Lv. {o.level}</span>
						<TypeList types={o.types} />
						<span className="reward-card__stats">
							<span>HP {o.max_hp}</span>
							<span>Atk {o.attack}</span>
							<span>Def {o.defense}</span>
							<span>Spd {o.speed}</span>
						</span>
					</button>
				))}
			</div>
			{error && (
				<p className="form-error" role="alert">
					{error}
				</p>
			)}
			<div className="result__actions" style={{ justifyContent: "center" }}>
				<Button variant="go" size="lg" disabled={!option || busy} onClick={() => (party.length >= MAX_PARTY ? setStep("replace") : claim())}>
					{busy ? "Claiming…" : option ? `Take ${option.nickname}` : "Pick one first"}
				</Button>
				<Button disabled={busy} onClick={onDone}>
					Decide later
				</Button>
			</div>
		</div>
	);
};

export default RewardScreen;
