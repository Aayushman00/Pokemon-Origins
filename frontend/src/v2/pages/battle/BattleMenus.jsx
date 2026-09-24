import React, { useState } from "react";
import MenuList from "../../ui/MenuList";
import Button from "../../ui/Button";
import Panel from "../../ui/Panel";
import { TypeBadge } from "../../ui/Badges";
import { PartyRow } from "../hub/PartyBoard";
import { STRUGGLE_MOVE } from "../../battle/useBattle";
import { typeColor } from "../../../utils/typeColors";

/** FIGHT / BAG / POKéMON / RESTART — the 2x2 command box. */
export const CommandMenu = ({ battle }) => (
	<div className="frame panel cmd-box">
		<MenuList
			label="Battle commands"
			columns={2}
			globalKeys
			items={[
				{ id: "fight", label: "Fight", onSelect: () => battle.setPhase("moveSelect") },
				{ id: "bag", label: "Bag", onSelect: battle.openBag },
				{ id: "mon", label: "Pokémon", onSelect: battle.openParty },
				{ id: "restart", label: "Restart", onSelect: () => battle.setPhase("restartConfirm") },
			]}
		/>
	</div>
);

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
		return {
			id: m.move_id,
			disabled: empty,
			className: "move-item",
			ariaLabel: `${m.name}, ${m.move_type}, PP ${ppLabel(m)}${empty ? ", no PP left" : ""}`,
			icon: <span className="move-item__swatch" style={{ "--type": typeColor(m.move_type) }} aria-hidden="true" />,
			label: <span className="caps">{m.name}</span>,
			move: m,
			onSelect: () => battle.chooseMove(m),
		};
	});
	const m = focus?.move || moves[0];

	return (
		<div className="hud__split">
			<div className="frame panel move-box">
				<MenuList label="Moves" columns={2} globalKeys onBack={back} items={items} onActiveChange={setFocus} />
			</div>
			<div className="frame panel move-info" aria-live="polite">
				{m && (
					<>
						<div className="move-info__row">
							<span>PP</span>
							<strong className={typeof m.current_pp === "number" && m.current_pp <= Math.ceil((m.max_pp || 0) / 4) ? "is-low" : ""}>{ppLabel(m)}</strong>
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
							<strong>{m.accuracy == null ? "—" : `${Math.round(m.accuracy * 100)}%`}</strong>
						</div>
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
			autoFocus
			onBack={() => battle.setPhase("command")}
			items={battle.bagItems.map((item) => ({
				id: item.itemId,
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
			initialIndex={1}
			onBack={() => battle.setPhase("command")}
			items={[
				{ id: "yes", label: "Yes, restart", onSelect: battle.restart },
				{ id: "no", label: "No", onSelect: () => battle.setPhase("command") },
			]}
		/>
	</div>
);

/** Post-battle results: rewards, save state, next step. */
export const ResultPanel = ({ battle, onContinue, onLeave }) => {
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
