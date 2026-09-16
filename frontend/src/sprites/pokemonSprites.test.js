import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getPokemonSprite,
	getPokemonSpriteFallback,
	isLocalSpriteUrl,
	padDex,
	variantFilename,
} from "./pokemonSprites.js";

describe("getPokemonSprite", () => {
	it("resolves #001 front", () => {
		assert.equal(
			getPokemonSprite({ pokemonId: 1, variant: "front" }),
			"/sprites/pokemon/001/front.png"
		);
	});

	it("resolves #025 back", () => {
		assert.equal(
			getPokemonSprite({ pokemonId: 25, variant: "back" }),
			"/sprites/pokemon/025/back.png"
		);
	});

	it("resolves #150 front", () => {
		assert.equal(
			getPokemonSprite({ pokemonId: 150, variant: "front" }),
			"/sprites/pokemon/150/front.png"
		);
	});

	it("resolves #151 icon", () => {
		assert.equal(
			getPokemonSprite({ pokemonId: 151, variant: "icon" }),
			"/sprites/pokemon/151/icon.png"
		);
	});

	it("pads single-digit dex numbers", () => {
		assert.equal(padDex(4), "004");
		assert.equal(
			getPokemonSprite({ pokemonId: 7, variant: "front" }),
			"/sprites/pokemon/007/front.png"
		);
	});

	it("uses fallback for null / 0 / 152 / undefined", () => {
		assert.equal(
			getPokemonSprite({ pokemonId: null, variant: "front" }),
			"/sprites/pokemon/_fallback/front.png"
		);
		assert.equal(
			getPokemonSprite({ pokemonId: 0, variant: "back" }),
			"/sprites/pokemon/_fallback/back.png"
		);
		assert.equal(
			getPokemonSprite({ pokemonId: 152, variant: "icon" }),
			"/sprites/pokemon/_fallback/icon.png"
		);
		assert.equal(
			getPokemonSprite({ variant: "front" }),
			"/sprites/pokemon/_fallback/front.png"
		);
	});

	it("never returns a PokeAPI URL", () => {
		const samples = [
			getPokemonSprite({ pokemonId: 1, variant: "front" }),
			getPokemonSprite({ pokemonId: 25, variant: "back" }),
			getPokemonSprite({ pokemonId: 150, variant: "front" }),
			getPokemonSprite({ pokemonId: 151, variant: "icon" }),
			getPokemonSprite({ pokemonId: 999, variant: "front" }),
			getPokemonSpriteFallback("front"),
		];
		for (const url of samples) {
			assert.equal(isLocalSpriteUrl(url), true);
			assert.equal(url.toLowerCase().includes("pokeapi"), false);
			assert.equal(url.includes("githubusercontent"), false);
			assert.equal(url.startsWith("http"), false);
		}
	});

	it("names optional frame / gender files deterministically", () => {
		assert.equal(variantFilename({ variant: "front", frame: "b" }), "front-b.png");
		assert.equal(
			variantFilename({ variant: "front", gender: "female" }),
			"front-female.png"
		);
	});
});
