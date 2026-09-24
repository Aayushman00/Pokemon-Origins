import React, { useEffect, useState } from "react";
import { getBattleSprite } from "../../sprites/battleSprites";
import {
	getPokemonSprite,
	getPokemonSpriteFallback,
} from "../../sprites/pokemonSprites";

const FRAME_INTERVAL_MS = 900;

/**
 * Battle-screen Pokémon sprite: alternates between the two sheet-extracted
 * idle frames (front/front-b or back/back-b) at a slow interval, and falls
 * back to the existing curated sprite / fallback art on load error so a
 * missing battle asset never breaks the screen.
 *
 * Same prop surface as PokemonSprite (pass `as={motion.img}` for Framer
 * Motion props via ...rest) so it drops into BattleSim's existing markup.
 */
const BattlePokemonSprite = ({
	pokemon,
	pokemonId,
	variant = "front",
	animateFrames = true,
	alt,
	className,
	as: Component = "img",
	...rest
}) => {
	const id = pokemonId ?? pokemon?.pokemon_id ?? pokemon?.id ?? null;
	const [frame, setFrame] = useState("a");
	const [stage, setStage] = useState("battle"); // battle -> classic -> fallback

	useEffect(() => {
		setFrame("a");
		setStage("battle");
	}, [id, variant]);

	useEffect(() => {
		if (!animateFrames || stage !== "battle") return undefined;
		const timer = setInterval(() => {
			setFrame((f) => (f === "a" ? "b" : "a"));
		}, FRAME_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [animateFrames, stage, id, variant]);

	const battleSrc =
		stage === "battle" ? getBattleSprite({ pokemonId: id, variant, frame }) : null;
	const src =
		stage === "battle" && battleSrc
			? battleSrc
			: stage === "fallback"
			? getPokemonSpriteFallback(variant)
			: getPokemonSprite({ pokemonId: id, variant });

	const handleError = () => {
		if (stage === "battle") {
			setStage("classic");
			return;
		}
		if (stage === "classic") {
			setStage("fallback");
		}
	};

	const label =
		alt ??
		pokemon?.nickname ??
		pokemon?.name ??
		(id ? `Pokémon #${id}` : "Unknown Pokémon");

	return (
		<Component
			src={src}
			alt={label}
			className={className}
			onError={handleError}
			draggable={false}
			{...rest}
		/>
	);
};

export default BattlePokemonSprite;
