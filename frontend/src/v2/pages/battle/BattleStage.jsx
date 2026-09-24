import React from "react";
import BattlePokemonSprite from "../../../components/PokemonSprite/BattlePokemonSprite";
import HpPanel from "./HpPanel";

// Original backdrops per battle type (no ripped battle backgrounds).
const THEMES = {
	trainer: "field",
	elite_four: "hall",
	champion: "hall",
	gym_boss: "arena",
	legendary: "mystic",
};

function monClass(f) {
	return [
		"mon__sprite",
		f.hidden && "is-hidden",
		f.entering && "is-entering",
		f.lunge && "is-lunge",
		f.hit && `is-hit is-hit--${f.hit}`,
		f.crit && "is-crit",
		f.fainted && "is-fainted",
		f.sparkle && "is-sparkle",
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The battlefield: backdrop, platforms, both creatures, HP boxes and all
 * impact effects. Laid out in container-query units so the whole
 * composition scales as one picture from phone to desktop.
 */
const BattleStage = ({ battle }) => {
	const { session, player, enemy, fx, stage, phase, turn, outcome } = battle;
	const theme = THEMES[session?.battleType] || "field";
	const showTrainer =
		session?.trainerSprite && (phase === "encounter" || (phase === "intro" && fx.enemy.hidden));
	const panelsIn = phase !== "encounter" && phase !== "loading";

	return (
		<div
			className={`stage stage--${theme} ${stage.shake ? `shake shake--${stage.shake}` : ""}`}
			role="img"
			aria-label={
				player && enemy
					? `Battle: your ${player.nickname}, ${player.current_hp} of ${player.max_hp} HP, against ${enemy.nickname}, ${Math.round(
							(enemy.current_hp / enemy.max_hp) * 100
					)}% HP`
					: "Battlefield"
			}
		>
			<div className="stage__sky" aria-hidden="true" />
			<div className="stage__far" aria-hidden="true" />
			<div className="stage__ground" aria-hidden="true" />
			<div className="stage__plat stage__plat--foe" aria-hidden="true" />
			<div className="stage__plat stage__plat--me" aria-hidden="true" />

			{showTrainer && (
				<img
					src={`/sprites/trainers/${session.trainerSprite}.png`}
					alt=""
					className="sprite stage__trainer"
					onError={(e) => (e.currentTarget.style.display = "none")}
				/>
			)}

			{enemy && (
				<div className="mon mon--foe" aria-hidden="true">
					<BattlePokemonSprite key={`foe-${enemy.pokemon_id}-${enemy.position}`} pokemonId={enemy.pokemon_id} variant="front" alt="" className={`sprite ${monClass(fx.enemy)}`} />
					{fx.enemy.sparkle && <span className="sparkle" />}
				</div>
			)}
			{player && (
				<div className="mon mon--me" aria-hidden="true">
					<BattlePokemonSprite key={`me-${player.pokemon_id}-${player.position}`} pokemonId={player.pokemon_id} variant="back" alt="" className={`sprite ${monClass(fx.player)}`} />
					{fx.player.entering && <span className="ball-burst" />}
					{fx.player.sparkle && <span className="sparkle" />}
				</div>
			)}

			{stage.projectile && (
				<span
					key={stage.projectile.key}
					className={`projectile projectile--from-${stage.projectile.from}`}
					style={{ "--fx": stage.projectile.color }}
					aria-hidden="true"
				/>
			)}
			{stage.flash && <span className="flash" style={{ "--fx": stage.flash }} aria-hidden="true" />}
			{stage.critFlash && <span className="flash flash--crit" aria-hidden="true" />}

			{panelsIn && enemy && !fx.enemy.hidden && !fx.enemy.fainted && (
				<HpPanel mon={enemy} side="foe" party={session?.enemyParty} tick={fx.enemy.tick} />
			)}
			{panelsIn && player && !fx.player.hidden && (
				<HpPanel mon={player} side="player" party={session?.party} tick={fx.player.tick} />
			)}

			{turn !== "none" && (
				<span className={`turn-chip turn-chip--${turn}`}>{turn === "player" ? "Your move" : "Foe's move"}</span>
			)}

			{phase === "encounter" && <div className="wipe" aria-hidden="true" />}

			{phase === "finished" && outcome && (
				<div className={`banner banner--${outcome.result}`} aria-hidden="true">
					{outcome.result === "win" ? "Victory!" : "Defeated"}
				</div>
			)}
		</div>
	);
};

export default BattleStage;
