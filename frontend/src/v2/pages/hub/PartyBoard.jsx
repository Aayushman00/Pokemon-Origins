import React, { useState } from "react";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Panel from "../../ui/Panel";
import Button from "../../ui/Button";
import { HpBar, XpBar } from "../../ui/Bars";
import { GenderMark, TypeList } from "../../ui/Badges";
import usePointerDrag from "../../ui/usePointerDrag";
import { useToast } from "../../ui/toastContext";
import { applyDrop, MAX_PARTY } from "../../data/partyLayout";
import { typeColor } from "../../../utils/typeColors";

/** Pixel "grip" — the touch drag handle (mouse can drag the whole row). */
const Grip = ({ label }) => (
	<span className="grip" data-drag-handle aria-hidden="true" title={label}>
		<span />
	</span>
);

/** One compact party row. Also used by the battle switch menu and rewards. */
export const PartyRow = ({ mon, selected, onSelect, tag, dragProps, grip }) => {
	const fainted = mon.current_hp <= 0;
	return (
		<button
			type="button"
			className={`party-row ${selected ? "is-selected" : ""} ${fainted ? "is-fainted" : ""}`}
			onClick={onSelect}
			aria-pressed={onSelect ? !!selected : undefined}
			{...dragProps}
		>
			{grip}
			<PokemonSprite pokemonId={mon.pokemon_id} variant="front" alt="" className="sprite party-row__sprite" />
			<span className="party-row__body">
				<span className="party-row__name">
					<span className="caps">{mon.nickname}</span> <GenderMark gender={mon.gender} />
					<span className="party-row__lv">Lv. {mon.level}</span>
				</span>
				<HpBar current={mon.current_hp} max={mon.max_hp} showValue />
			</span>
			{(tag || fainted) && <span className="party-row__tag">{tag || "Fainted"}</span>}
		</button>
	);
};

const MoveLine = ({ move }) => (
	<li className="move-line" style={{ "--type": typeColor(move.move_type) }}>
		<span className="move-line__name caps">{move.name}</span>
		<span className="move-line__type">{move.move_type}</span>
		<span className="move-line__pp">
			PP {move.current_pp ?? move.pp ?? "—"}/{move.pp ?? "—"}
		</span>
	</li>
);

const same = (a, b) => a && b && a.zone === b.zone && a.index === b.index;

/**
 * FRLG-style party screen plus the PC box. Drag a party member to reorder
 * (the lead leads the next battle), onto the PC to store it, or a PC
 * Pokémon onto the party to bring it along (swapping when the party is
 * full). Every drag has a button equivalent for keyboard and screen readers.
 */
const PartyBoard = ({ party, pc, onArrange }) => {
	const toast = useToast();
	const [selectedId, setSelectedId] = useState(null);
	const [pcSelectedId, setPcSelectedId] = useState(null);

	const layout = { party: (party || []).map((m) => Number(m.id)), pc: (pc || []).map((m) => Number(m.id)) };
	const byId = new Map([...(party || []), ...(pc || [])].map((m) => [Number(m.id), m]));

	const commit = async (next, message) => {
		if (!next) return;
		const error = await onArrange(next);
		if (error) toast(error, { tone: "error" });
		else if (message) toast(message);
	};

	const { drag, bind } = usePointerDrag((item, over) => {
		const next = applyDrop(layout, item, over);
		if (!next) {
			if (over.zone === "pc" && item.from === "party" && layout.party.length <= 1) {
				toast("Keep at least one Pokémon in your party.", { tone: "error" });
			}
			return;
		}
		const mon = byId.get(item.id);
		const name = mon?.nickname?.toUpperCase();
		const msg =
			item.from === over.zone
				? null
				: over.zone === "pc"
				? `${name} was sent to the PC.`
				: layout.party.length >= MAX_PARTY
				? `${name} swapped in from the PC.`
				: `${name} joined your party.`;
		commit(next, msg);
	});

	if (!party) {
		return (
			<Panel plate="Party" className="party-board">
				<p className="loading-dots muted">Calling your Pokémon</p>
			</Panel>
		);
	}

	const focus = party.find((m) => Number(m.id) === selectedId) || party[0];
	const focusIndex = party.indexOf(focus);
	const pcFocus = (pc || []).find((m) => Number(m.id) === pcSelectedId);
	const empties = Math.max(0, MAX_PARTY - party.length);
	const move = (from, id, zone, index) => commit(applyDrop(layout, { id: Number(id), from }, { zone, index }));

	const dropClass = (zone, index) => (drag && same(drag.over, { zone, index }) ? "is-drop-target" : "");

	return (
		<>
			<Panel plate="Party" className="party-board" id="party">
				<div className="party-board__grid">
					{focus && (
						<article className="party-focus" aria-label={`${focus.nickname} summary`}>
							<div className="party-focus__stage">
								<PokemonSprite pokemonId={focus.pokemon_id} variant="front" alt={focus.nickname} className="sprite party-focus__sprite bob" />
								<span className="party-focus__shadow" aria-hidden="true" />
							</div>
							<div className="party-focus__info">
								<h3 className="party-focus__name">
									<span className="caps">{focus.nickname}</span> <GenderMark gender={focus.gender} />
								</h3>
								<p className="party-focus__lv">
									Lv. {focus.level}
									{focus.ability?.name && <span className="muted"> with {focus.ability.name}</span>}
								</p>
								<TypeList types={focus.types} />
								<HpBar current={focus.current_hp} max={focus.max_hp} showValue className="party-focus__hp" />
								{focus.xp_to_next ? (
									<>
										<XpBar value={focus.experience || 0} max={focus.xp_to_next} />
										<p className="party-focus__xp muted">
											{Math.max(0, focus.xp_to_next - (focus.experience || 0))} EXP to Lv. {focus.level + 1}
										</p>
									</>
								) : null}
							</div>
							{focus.moves?.length > 0 && (
								<ul className="party-focus__moves" aria-label="Moves">
									{focus.moves.map((m) => (
										<MoveLine key={m.move_id} move={m} />
									))}
								</ul>
							)}
							<div className="party-focus__actions">
								<Button size="sm" disabled={focusIndex <= 0} onClick={() => move("party", focus.id, "party", 0)}>
									Make lead
								</Button>
								<Button size="sm" disabled={focusIndex <= 0} onClick={() => move("party", focus.id, "party", focusIndex - 1)} aria-label="Move up">
									Up
								</Button>
								<Button
									size="sm"
									disabled={focusIndex >= party.length - 1}
									onClick={() => move("party", focus.id, "party", focusIndex + 1)}
									aria-label="Move down"
								>
									Down
								</Button>
								<Button size="sm" variant="navy" disabled={party.length <= 1} onClick={() => move("party", focus.id, "pc")}>
									Send to PC
								</Button>
							</div>
						</article>
					)}

					<div className="party-bench" aria-label="Party order: the first Pokémon leads in battle">
						{party.map((mon, i) => (
							<div
								key={mon.id}
								className={`drop-slot ${dropClass("party", i)} ${drag?.item.id === Number(mon.id) ? "is-dragging" : ""}`}
								data-drop-zone="party"
								data-drop-index={i}
							>
								<PartyRow
									mon={mon}
									selected={Number(mon.id) === Number(focus?.id)}
									onSelect={() => setSelectedId(Number(mon.id))}
									tag={i === 0 ? "Lead" : undefined}
									dragProps={bind({ id: Number(mon.id), from: "party", pokemonId: mon.pokemon_id })}
									grip={<Grip label="Drag to reorder or store" />}
								/>
							</div>
						))}
						{Array.from({ length: empties }, (_, i) => (
							<div
								key={`empty-${i}`}
								className={`drop-slot party-row party-row--empty ${dropClass("party", party.length)}`}
								data-drop-zone="party"
								data-drop-index={party.length}
							>
								{pc?.length ? "Empty slot. Drag a Pokémon here from the PC." : "Empty slot. Win a boss battle to recruit."}
							</div>
						))}
						<p className="party-bench__hint muted">Drag to reorder. The top Pokémon leads your next battle.</p>
					</div>
				</div>
			</Panel>

			<Panel plate={`PC Box 1 (${pc?.length ?? 0})`} className={`pc ${drag?.item.from === "party" ? "pc--armed" : ""}`}>
				<div className={`pc__box ${dropClass("pc", undefined)}`} data-drop-zone="pc">
					{pc === null ? (
						<p className="loading-dots muted">Booting up the PC</p>
					) : pc.length === 0 ? (
						<p className="pc__empty read">
							The box is empty. Drag a party member here to store it, or use Send to PC. Stored Pokémon keep their level and moves.
						</p>
					) : (
						<ul className="pc__grid" aria-label="Stored Pokémon">
							{pc.map((mon, i) => (
								<li key={mon.id} className={`drop-slot ${dropClass("pc", i)}`} data-drop-zone="pc" data-drop-index={i}>
									<button
										type="button"
										className={`pc__cell ${Number(mon.id) === pcSelectedId ? "is-selected" : ""} ${
											drag?.item.id === Number(mon.id) ? "is-dragging" : ""
										}`}
										aria-pressed={Number(mon.id) === pcSelectedId}
										aria-label={`${mon.nickname}, level ${mon.level}`}
										onClick={() => setPcSelectedId(Number(mon.id) === pcSelectedId ? null : Number(mon.id))}
										{...bind({ id: Number(mon.id), from: "pc", pokemonId: mon.pokemon_id })}
									>
										<Grip label="Drag into your party" />
										<PokemonSprite pokemonId={mon.pokemon_id} variant="front" alt="" className="sprite pc__sprite" />
										<span className="pc__lv">Lv{mon.level}</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
				{pcFocus && (
					<div className="pc__info">
						<PokemonSprite pokemonId={pcFocus.pokemon_id} variant="front" alt="" className="sprite pc__info-sprite" />
						<p>
							<span className="caps">{pcFocus.nickname}</span> <GenderMark gender={pcFocus.gender} /> Lv. {pcFocus.level}
							<span className="muted">
								{" "}
								HP {pcFocus.current_hp}/{pcFocus.max_hp}
							</span>
						</p>
						{party.length < MAX_PARTY ? (
							<Button size="sm" variant="go" onClick={() => (move("pc", pcFocus.id, "party"), setPcSelectedId(null))}>
								Take into party
							</Button>
						) : (
							<Button size="sm" variant="go" onClick={() => (move("pc", pcFocus.id, "party", focusIndex), setPcSelectedId(null))}>
								Swap with {focus?.nickname?.toUpperCase()}
							</Button>
						)}
					</div>
				)}
			</Panel>

			{drag && (
				<div className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
					<PokemonSprite pokemonId={drag.item.pokemonId} variant="front" alt="" className="sprite" />
				</div>
			)}
		</>
	);
};

export default PartyBoard;
