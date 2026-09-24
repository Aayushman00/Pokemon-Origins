import React, { useState } from "react";
import PokemonSprite from "../../../components/PokemonSprite/PokemonSprite";
import Panel from "../../ui/Panel";
import { HpBar, XpBar } from "../../ui/Bars";
import { GenderMark, TypeList } from "../../ui/Badges";
import { typeColor } from "../../../utils/typeColors";

const MAX_PARTY = 3;

/** One compact party row (bench slot). Also used by the battle switch menu. */
export const PartyRow = ({ mon, selected, onSelect, tag }) => {
	const fainted = mon.current_hp <= 0;
	return (
		<button
			type="button"
			className={`party-row ${selected ? "is-selected" : ""} ${fainted ? "is-fainted" : ""}`}
			onClick={onSelect}
			aria-pressed={selected}
		>
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

/**
 * FRLG-style party screen: the selected member gets the big summary card,
 * the others sit in a stack of slots. Selection is local (inspect only).
 */
const PartyBoard = ({ party, xpByPosition = {} }) => {
	const [selectedPos, setSelectedPos] = useState(null);
	if (!party) {
		return (
			<Panel plate="Party" className="party-board">
				<p className="loading-dots muted">Calling your Pokémon</p>
			</Panel>
		);
	}
	const focus = party.find((m) => m.position === selectedPos) || party[0];
	const xpToNext = focus ? xpByPosition[focus.position] : null;
	const empties = Math.max(0, MAX_PARTY - party.length);

	return (
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
							{xpToNext ? (
								<>
									<XpBar value={focus.experience || 0} max={xpToNext} />
									<p className="party-focus__xp muted">
										{Math.max(0, xpToNext - (focus.experience || 0))} EXP to Lv. {focus.level + 1}
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
					</article>
				)}

				<div className="party-bench" aria-label="Party members">
					{party.map((mon, i) => (
						<PartyRow
							key={mon.position}
							mon={mon}
							selected={mon.position === focus?.position}
							onSelect={() => setSelectedPos(mon.position)}
							tag={i === 0 ? "Lead" : undefined}
						/>
					))}
					{Array.from({ length: empties }, (_, i) => (
						<div key={`empty-${i}`} className="party-row party-row--empty">
							Empty slot. Win a boss battle to recruit.
						</div>
					))}
				</div>
			</div>
		</Panel>
	);
};

export default PartyBoard;
