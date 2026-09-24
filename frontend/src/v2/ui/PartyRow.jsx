import React from "react";
import PokemonSprite from "../../components/PokemonSprite/PokemonSprite";
import { HpBar } from "./Bars";
import { GenderMark } from "./Badges";

/** Pixel "grip" — the touch drag handle (mouse can drag the whole row). */
export const Grip = ({ label }) => (
	<span className="grip" data-drag-handle aria-hidden="true" title={label}>
		<span />
	</span>
);

/** One compact party row. Also used by the battle switch menu and rewards. */
const PartyRow = ({ mon, selected, onSelect, tag, dragProps, grip }) => {
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

export default PartyRow;
