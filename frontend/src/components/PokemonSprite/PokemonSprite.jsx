import React, { useEffect, useState } from "react";
import {
	getPokemonSprite,
	getPokemonSpriteFallback,
} from "../../sprites/pokemonSprites";

/**
 * Renders a local Pokémon sprite. Never points at PokeAPI.
 * Pass `as={motion.img}` when the caller needs Framer Motion props.
 */
const PokemonSprite = ({
	pokemon,
	pokemonId,
	variant = "front",
	frame,
	gender,
	shiny = false,
	alt,
	className,
	as: Component = "img",
	...rest
}) => {
	const id = pokemonId ?? pokemon?.pokemon_id ?? pokemon?.id ?? null;

	const primary = getPokemonSprite({
		pokemonId: id,
		variant,
		frame,
		gender,
		shiny,
	});

	const [src, setSrc] = useState(primary);
	const [stage, setStage] = useState("primary");

	useEffect(() => {
		setSrc(primary);
		setStage("primary");
	}, [primary]);

	const handleError = () => {
		if (stage === "primary" && variant !== "front") {
			setSrc(getPokemonSprite({ pokemonId: id, variant: "front" }));
			setStage("sameFront");
			return;
		}
		if (stage !== "fallback") {
			setSrc(getPokemonSpriteFallback(variant));
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

export default PokemonSprite;
