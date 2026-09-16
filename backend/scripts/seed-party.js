/**
 * Seed extra party members for a trainer (dev utility).
 *
 * Usage:
 *   node scripts/seed-party.js <trainerId> [pokemonId:level ...]
 *   npm run seed:party -- <trainerId> [pokemonId:level ...]
 *
 * Without pokemonId:level args it adds Pidgey (16) and Rattata (19) at
 * level 5, which fills a party that already has a starter to the cap of 3.
 *
 * Stats and moves are hydrated from the pokedex DB (same math as campaign
 * hydration); inserts go through partyService so the 3-Pokémon cap and
 * position assignment apply. current_pp starts at the move's full base PP
 * (pokedex.Move.pp) — battles decrement and persist it (Phase 14).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
	lookupSpecies,
	hydrateFromSpecies,
} = require("../src/campaign/hydrate");
const partyService = require("../src/services/partyService");

function parseArgs(argv) {
	const [trainerIdRaw, ...monArgs] = argv;
	const trainerId = Number(trainerIdRaw);
	if (!Number.isInteger(trainerId) || trainerId <= 0) {
		throw new Error(
			"Usage: node scripts/seed-party.js <trainerId> [pokemonId:level ...]"
		);
	}
	const specs = monArgs.length ? monArgs : ["16:5", "19:5"];
	const members = specs.map((spec) => {
		const [idRaw, levelRaw = "5"] = spec.split(":");
		const pokemonId = Number(idRaw);
		const level = Number(levelRaw);
		if (
			!Number.isInteger(pokemonId) ||
			pokemonId <= 0 ||
			!Number.isInteger(level) ||
			level <= 0
		) {
			throw new Error(`Invalid pokemonId:level spec "${spec}"`);
		}
		return { pokemonId, level };
	});
	return { trainerId, members };
}

async function main() {
	const { trainerId, members } = parseArgs(process.argv.slice(2));

	for (const member of members) {
		const species = await lookupSpecies(member.pokemonId);
		const hydrated = hydrateFromSpecies(member, species);
		const { moves, types, ...mon } = hydrated;
		const { id, position } = await partyService.addPokemon(
			trainerId,
			mon,
			moves.map((m) => ({ move_id: m.move_id, pp: m.pp ?? 0 }))
		);
		console.log(
			`Added ${mon.nickname} (Lv ${mon.level}) to trainer ${trainerId} at position ${position} (row id ${id})`
		);
	}
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(`seed-party failed: ${err.message}`);
		process.exit(1);
	});
