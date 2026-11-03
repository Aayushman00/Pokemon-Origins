const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createMovePlaygroundService } = require("./movePlaygroundService");
const { CampaignError } = require("../campaign/errors");

const CHARMANDER = {
	pokemon_id: 4,
	name: "charmander",
	hp: 39,
	attack: 52,
	defense: 43,
	special_attack: 60,
	special_defense: 50,
	speed: 65,
	types: ["Fire"],
	ability: { id: 1, name: "Blaze" },
};

const SQUIRTLE = {
	pokemon_id: 7,
	name: "squirtle",
	hp: 44,
	attack: 48,
	defense: 65,
	special_attack: 50,
	special_defense: 64,
	speed: 43,
	types: ["Water"],
	ability: { id: 2, name: "Torrent" },
};

const EMBER = {
	move_id: 52,
	name: "Ember",
	power: 40,
	accuracy: 1,
	move_type: "Fire",
	pp: 25,
};

const TACKLE = {
	move_id: 33,
	name: "Tackle",
	power: 40,
	accuracy: 1,
	move_type: "Normal",
	pp: 35,
};

function fakeLookupSpecies(pokemonId) {
	const species = { 4: CHARMANDER, 7: SQUIRTLE }[pokemonId];
	if (!species) throw new Error("not found");
	return Promise.resolve(species);
}

function fakeLookupMove(moveId) {
	const move = { 52: EMBER, 33: TACKLE }[moveId];
	if (!move) return Promise.reject(new CampaignError(400, "unknown move"));
	return Promise.resolve(move);
}

/** Mirrors battleSessionService.test.js's stubEngine: deterministic hit/damage. */
function stubEngine(results) {
	const queue = [...results];
	return {
		calls: [],
		async turnOrder(p1, p2, priorities = {}) {
			const pr1 = priorities.priority1 ?? 0;
			const pr2 = priorities.priority2 ?? 0;
			if (pr1 !== pr2) return { first: pr1 > pr2 ? "pokemon1" : "pokemon2" };
			return { first: p1.speed >= p2.speed ? "pokemon1" : "pokemon2" };
		},
		async calculateDamage(payload) {
			this.calls.push(payload);
			const next = queue.length > 1 ? queue.shift() : queue[0];
			return { ...next };
		},
	};
}

function makeService(overrides = {}) {
	return createMovePlaygroundService({
		lookupSpecies: fakeLookupSpecies,
		lookupMove: fakeLookupMove,
		engine: stubEngine([{ result: "hit", damage: 5, critical_hit: false }]),
		...overrides,
	});
}

describe("movePlaygroundService.listSpecies / listMoves", () => {
	it("returns species from the injected listSpeciesRaw", async () => {
		const service = createMovePlaygroundService({
			listSpeciesRaw: async () => [CHARMANDER, SQUIRTLE],
		});
		const species = await service.listSpecies();
		assert.equal(species.length, 2);
		assert.equal(species[0].name, "charmander");
	});

	it("returns moves from the injected listMovesRaw", async () => {
		const service = createMovePlaygroundService({
			listMovesRaw: async () => [EMBER, TACKLE],
		});
		const moves = await service.listMoves();
		assert.equal(moves.length, 2);
		assert.equal(moves[0].name, "Ember");
	});
});

describe("movePlaygroundService.runExchange", () => {
	it("resolves one round and returns an event log", async () => {
		const service = makeService();
		const result = await service.runExchange(
			{ pokemonId: 4, level: 50, moveId: 52, status: "Healthy", hpPercent: 100, stages: {} },
			{ pokemonId: 7, level: 5, moveId: 33, status: "Healthy", hpPercent: 100, stages: {} }
		);
		assert.ok(Array.isArray(result.events));
		assert.ok(result.events.length > 0);
		assert.ok(Array.isArray(result.log));
	});

	it("applies debugStatus/debugStages without throwing", async () => {
		const service = makeService();
		const result = await service.runExchange(
			{ pokemonId: 4, level: 50, moveId: 52, status: "brn", hpPercent: 100, stages: { atk: -2 } },
			{ pokemonId: 7, level: 100, moveId: 33, status: "Healthy", hpPercent: 100, stages: {} }
		);
		assert.ok(Array.isArray(result.events));
	});

	it("forwards force_hit/force_crit through to the engine payload", async () => {
		const engine = stubEngine([{ result: "hit", damage: 5, critical_hit: true }]);
		const service = makeService({ engine });
		await service.runExchange(
			{ pokemonId: 4, level: 50, moveId: 52, status: "Healthy", hpPercent: 100, stages: {}, forceHit: true, forceCrit: true },
			{ pokemonId: 7, level: 100, moveId: 33, status: "Healthy", hpPercent: 5, stages: {} }
		);
		const call = engine.calls.find((c) => c.move.move_id === 52);
		assert.equal(call.force_hit, true);
		assert.equal(call.force_crit, true);
	});

	it("handles a one-shot KO (win pipeline) without throwing", async () => {
		const engine = stubEngine([{ result: "hit", damage: 9999, critical_hit: true }]);
		const service = makeService({ engine });
		const result = await service.runExchange(
			{ pokemonId: 4, level: 100, moveId: 52, status: "Healthy", hpPercent: 100, stages: {}, forceHit: true },
			{ pokemonId: 7, level: 1, moveId: 33, status: "Healthy", hpPercent: 5, stages: {} }
		);
		assert.ok(Array.isArray(result.events));
	});

	it("rejects an unknown pokemonId with a 400 CampaignError", async () => {
		const service = makeService();
		await assert.rejects(
			() =>
				service.runExchange(
					{ pokemonId: 999999, level: 5, moveId: 33, status: "Healthy", hpPercent: 100, stages: {} },
					{ pokemonId: 7, level: 5, moveId: 33, status: "Healthy", hpPercent: 100, stages: {} }
				),
			(err) => {
				assert.ok(err instanceof CampaignError);
				assert.equal(err.status, 400);
				return true;
			}
		);
	});

	it("rejects an unknown moveId with a 400 CampaignError", async () => {
		const service = makeService();
		await assert.rejects(
			() =>
				service.runExchange(
					{ pokemonId: 4, level: 5, moveId: 999999, status: "Healthy", hpPercent: 100, stages: {} },
					{ pokemonId: 7, level: 5, moveId: 33, status: "Healthy", hpPercent: 100, stages: {} }
				),
			(err) => {
				assert.ok(err instanceof CampaignError);
				assert.equal(err.status, 400);
				return true;
			}
		);
	});

	it("rejects hpPercent: 0 on either side with a 400 (can't battle already fainted)", async () => {
		const service = makeService();
		await assert.rejects(
			() =>
				service.runExchange(
					{ pokemonId: 4, level: 5, moveId: 52, status: "Healthy", hpPercent: 0, stages: {} },
					{ pokemonId: 7, level: 5, moveId: 33, status: "Healthy", hpPercent: 100, stages: {} }
				),
			(err) => {
				assert.ok(err instanceof CampaignError);
				assert.equal(err.status, 400);
				return true;
			}
		);
	});
});
