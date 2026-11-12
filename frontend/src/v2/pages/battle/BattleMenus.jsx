import React, { useState } from "react";
import MenuList from "../../ui/MenuList";
import DialogueBox from "../../ui/DialogueBox";
import Button from "../../ui/Button";
import Panel from "../../ui/Panel";
import { TypeBadge } from "../../ui/Badges";
import PartyRow from "../../ui/PartyRow";
import MenuIcon from "../../ui/MenuIcon";
import { STRUGGLE_MOVE } from "../../battle/useBattle";
import { typeColor } from "../../../utils/typeColors";

/** FIGHT / BAG / POKéMON / RESTART — the 2x2 command box. */
export const CommandMenu = ({ battle }) => (
	<div className="frame panel cmd-box">
		<MenuList
			label="Battle commands"
			columns={2}
			globalKeys
			sound
			items={[
				{ id: "fight", label: "Fight", onSelect: () => battle.setPhase("moveSelect") },
				{ id: "bag", label: "Bag", onSelect: battle.openBag },
				{ id: "mon", label: "Pokémon", onSelect: battle.openParty },
				battle.session?.battleType === "wild"
					? { id: "run", label: "Run", onSelect: battle.run }
					: battle.noEscape
						? { id: "run", label: "Run", onSelect: battle.refuseRun }
						: { id: "restart", label: "Restart", onSelect: () => battle.setPhase("restartConfirm") },
			]}
		/>
	</div>
);

/** Words for the server's type multiplier; neutral hits say nothing. */
const effectLabel = (x) => (x === 0 ? "No effect" : x > 1 ? "Super effective" : x < 1 ? "Not very effective" : null);
const effectTone = (x) => (x > 1 ? "is-good" : "is-low");

/** The multiplier itself, for the move tile: x2, x1/2, x0. */
const multLabel = (x) => (x === 0.5 ? "×½" : x === 0.25 ? "×¼" : `×${x}`);
/** Accuracy arrives as a fraction in battle and as a percent from the learnset. */
const accLabel = (a) => (a == null ? "—" : `${Math.round(a > 1 ? a : a * 100)}%`);
const lowPp = (m) => typeof m.current_pp === "number" && m.current_pp <= Math.ceil((m.max_pp || 0) / 4);

/** One move in a 2x2 grid: name, then type. In a fight (`live`) also PP, and the type multiplier when it is not x1. */
const MoveTile = ({ move, live = true }) => {
	const x = live ? move.effectiveness : null;
	return (
		<span className="move-tile">
			<span className="move-tile__name caps">{move.name}</span>
			<span className="move-tile__meta">
				<span>{move.move_type}</span>
				{live && <span className={lowPp(move) ? "is-low" : ""}>PP {ppLabel(move)}</span>}
				{x != null && x !== 1 && (
					<span className={`move-tile__mult ${effectTone(x)}`} aria-hidden="true">
						{multLabel(x)}
					</span>
				)}
			</span>
		</span>
	);
};

const ppLabel = (m) => (typeof m.current_pp === "number" && typeof m.max_pp === "number" ? `${m.current_pp}/${m.max_pp}` : "—");

/** Move grid on the left, details of the highlighted move on the right. */
export const MoveMenu = ({ battle }) => {
	const [focus, setFocus] = useState(null);
	const moves = battle.player?.moves || [];
	const back = () => battle.setPhase("command");

	if (battle.session?.mustStruggle) {
		return (
			<div className="hud__split">
				<div className="frame panel move-box">
					<MenuList
						label="Moves"
						globalKeys
			sound
						onBack={back}
						items={[{ id: "struggle", label: "STRUGGLE", hint: "No PP left", onSelect: () => battle.chooseMove(STRUGGLE_MOVE) }]}
					/>
				</div>
				<div className="frame panel move-info">
					<p className="move-info__note">Every move is out of PP.</p>
					<Button size="sm" onClick={back}>
						Back
					</Button>
				</div>
			</div>
		);
	}

	const items = moves.map((m) => {
		const empty = typeof m.current_pp === "number" && m.current_pp <= 0;
		const effect = m.effectiveness == null ? null : effectLabel(m.effectiveness);
		return {
			id: m.move_id,
			disabled: empty,
			className: "move-item",
			ariaLabel: `${m.name}, ${m.move_type}, PP ${ppLabel(m)}${effect ? `, ${effect}` : ""}${empty ? ", no PP left" : ""}`,
			icon: <span className="move-item__swatch" style={{ "--type": typeColor(m.move_type) }} aria-hidden="true" />,
			label: <MoveTile move={m} />,
			move: m,
			onSelect: () => battle.chooseMove(m),
		};
	});
	const m = focus?.move || moves[0];
	const stab = m && m.power > 0 && (battle.player?.types || []).some((t) => String(t).toLowerCase() === String(m.move_type).toLowerCase());

	return (
		<div className="hud__split">
			<div className="frame panel move-box">
				<MenuList label="Moves" columns={2} globalKeys
			sound onBack={back} items={items} onActiveChange={setFocus} />
			</div>
			<div className="frame panel move-info" aria-live="polite">
				{m && (
					<>
						<div className="move-info__row">
							<span>PP</span>
							<strong className={lowPp(m) ? "is-low" : ""}>{ppLabel(m)}</strong>
						</div>
						<div className="move-info__row">
							<span>Type</span>
							<TypeBadge type={m.move_type} />
						</div>
						<div className="move-info__row">
							<span>Power</span>
							<strong>{m.power ? m.power : "Status"}</strong>
						</div>
						<div className="move-info__row">
							<span>Accuracy</span>
							<strong>{accLabel(m.accuracy)}</strong>
						</div>
						{stab && <p className="move-info__note">Same type as {battle.player.nickname}: hits harder.</p>}
						{m.status_effect && <p className="move-info__note">May inflict {String(m.status_effect).toLowerCase()}.</p>}
						{m.effectiveness != null && effectLabel(m.effectiveness) && (
							<p className={`move-info__effect ${effectTone(m.effectiveness)}`}>{effectLabel(m.effectiveness)}</p>
						)}
					</>
				)}
				<Button size="sm" className="move-info__back" onClick={back}>
					Back
				</Button>
			</div>
		</div>
	);
};

/** Switch screen: the same party rows as the hub. */
export const PartyMenu = ({ battle }) => {
	const party = battle.session?.party || [];
	const forced = !!battle.session?.requiresSwitch;
	const active = battle.session?.activePosition;
	return (
		<Panel plate={forced ? "Choose your next Pokémon" : "Switch to which Pokémon?"} className="hud__list">
			<div className="hud__rows">
				{party.map((mon) => {
					const isActive = mon.position === active && !forced;
					const live = mon.position === battle.player?.position ? { ...mon, ...battle.player } : mon;
					return (
						<PartyRow
							key={mon.position}
							mon={live}
							tag={isActive ? "In battle" : undefined}
							onSelect={() => !isActive && live.current_hp > 0 && battle.switchTo(mon)}
						/>
					);
				})}
			</div>
			{!forced && (
				<Button onClick={() => battle.setPhase("command")} className="hud__cancel">
					Cancel
				</Button>
			)}
		</Panel>
	);
};

export const BagMenu = ({ battle }) => (
	<Panel plate={`Use an item on ${battle.player?.nickname}`} className="hud__list">
		<MenuList
			label="Battle items"
			globalKeys
			sound
			autoFocus
			onBack={() => battle.setPhase("command")}
			items={battle.bagItems.map((item) => ({
				id: item.itemId,
				icon: <MenuIcon name={item.category} />,
				label: (
					<span className="bag-line">
						<span>{item.name}</span>
						<span className="bag-line__desc read">{item.description}</span>
					</span>
				),
				hint: `×${item.quantity}`,
				onSelect: () => battle.chooseItem(item),
			}))}
		/>
		<Button onClick={() => battle.setPhase("command")} className="hud__cancel">
			Cancel
		</Button>
	</Panel>
);

export const RestartMenu = ({ battle }) => (
	<div className="frame panel cmd-box">
		<MenuList
			label="Restart this battle?"
			globalKeys
			sound
			initialIndex={1}
			onBack={() => battle.setPhase("command")}
			items={[
				{ id: "yes", label: "Yes, restart", onSelect: battle.restart },
				{ id: "no", label: "No", onSelect: () => battle.setPhase("command") },
			]}
		/>
	</div>
);

/** "Wants to learn" after a win: yes or no, then which move to forget. */
export const LearnMenu = ({ battle, charMs }) => {
	const [step, setStep] = useState("ask"); // ask | stop | pick
	const [forget, setForget] = useState(null);
	const offer = battle.learnOffer;
	const name = offer.move.name.toUpperCase();
	const full = offer.currentMoves.length >= 4;

	if (step === "pick") {
		const items = offer.currentMoves.map((m) => ({
			id: m.move_id,
			className: "move-item",
			ariaLabel: `Forget ${m.name}, ${m.move_type}`,
			icon: <span className="move-item__swatch" style={{ "--type": typeColor(m.move_type) }} aria-hidden="true" />,
			label: <MoveTile move={m} live={false} />,
			move: m,
			onSelect: () => battle.resolveLearn("learn", m.move_id),
		}));
		const old = forget?.move || offer.currentMoves[0];
		const rows = [
			["Type", (mv) => <TypeBadge type={mv.move_type} />],
			["Power", (mv) => mv.power || "Status"],
			["Accuracy", (mv) => accLabel(mv.accuracy)],
			["PP", (mv) => mv.max_pp ?? mv.pp ?? "—"],
		];
		return (
			<div className="hud__split">
				<div className="frame panel move-box">
					<MenuList label="Move to forget" columns={2} globalKeys sound onBack={() => setStep("ask")} items={items} onActiveChange={setForget} />
				</div>
				<div className="frame panel move-info" aria-live="polite">
					<p className="move-info__note">Forget which move for {name}?</p>
					{/* What you give up beside what you get: the choice is the comparison. */}
					<table className="move-compare">
						<thead>
							<tr>
								<td />
								<th scope="col" className="caps">{old.name}</th>
								<th scope="col" className="caps move-compare__new">{offer.move.name}</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(([label, cell]) => (
								<tr key={label}>
									<th scope="row">{label}</th>
									<td>{cell(old)}</td>
									<td className="move-compare__new">{cell(offer.move)}</td>
								</tr>
							))}
						</tbody>
					</table>
					<Button size="sm" className="move-info__back" onClick={() => setStep("ask")}>
						Back
					</Button>
				</div>
			</div>
		);
	}

	const stopping = step === "stop";
	const text = stopping
		? `Stop learning ${name}?`
		: full
		? `${offer.nickname} wants to learn ${name}, but already knows 4 moves. Forget one?`
		: `${offer.nickname} wants to learn ${name}. Teach it?`;
	const yes = stopping ? () => battle.resolveLearn("skip") : full ? () => setStep("pick") : () => battle.resolveLearn("learn");
	const no = stopping ? () => setStep("ask") : () => setStep("stop");
	return (
		<div className="hud__split hud__split--cmd">
			<DialogueBox text={text} keys={false} charMs={charMs} className="hud__dialogue" />
			<div className="frame panel cmd-box">
				<MenuList
					key={step}
					label={text}
					globalKeys
					sound
					onBack={no}
					items={[
						{ id: "yes", label: "Yes", onSelect: yes },
						{ id: "no", label: "No", onSelect: no },
					]}
				/>
			</div>
		</div>
	);
};

/** Post-battle results: rewards, save state, next step. */
export const ResultPanel = ({ battle, onContinue, onLeave, onLost }) => {
	const win = battle.outcome?.result === "win";
	return (
		<Panel variant={win ? undefined : "inset"} className="result" plate={win ? "Victory" : "Defeat"} plateTone={win ? "grass" : undefined}>
			<p className="result__head">
				{win ? `${battle.outcome.name} and your team won the battle!` : `${battle.outcome?.name} won this one. Your party is out of Pokémon that can fight.`}
			</p>
			{win && battle.rewards.length > 0 && (
				<ul className="result__rewards">
					{battle.rewards.map((r, i) => (
						<li key={i}>{r}</li>
					))}
				</ul>
			)}
			{win && battle.progressSave === "error" && (
				<p className="form-error" role="alert">
					Your win happened, but progress didn&apos;t save. Retry to record it.
				</p>
			)}
			<div className="result__actions">
				{win ? (
					battle.progressSave === "error" || battle.progressSave === "saving" ? (
						<Button variant="primary" disabled={battle.progressSave === "saving"} onClick={battle.retrySave}>
							{battle.progressSave === "saving" ? "Saving…" : "Retry save"}
						</Button>
					) : (
						<Button variant="go" size="lg" onClick={onContinue} autoFocus>
							Continue
						</Button>
					)
				) : onLost ? (
					<Button variant="go" size="lg" onClick={onLost} autoFocus>
						Continue
					</Button>
				) : (
					<>
						<Button variant="primary" size="lg" onClick={battle.restart} autoFocus>
							Battle again
						</Button>
						<Button onClick={onLeave}>Back to hub</Button>
					</>
				)}
			</div>
		</Panel>
	);
};
