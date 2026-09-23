const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
	MAX_PARTY,
	PartyError,
	createPartyService,
	createMemoryPartyStore,
} = require("./partyService");

function mon(overrides = {}) {
	return {
		pokemon_id: 16,
		nickname: "Pidgey",
		level: 5,
		current_hp: 20,
		max_hp: 20,
		attack: 10,
		defense: 10,
		speed: 12,
		special_atk: 8,
		special_def: 8,
		experience: 0,
		status: "Healthy",
		...overrides,
	};
}

describe("partyService", () => {
	it("assigns positions 1..3 in insert order", async () => {
		const service = createPartyService({ store: createMemoryPartyStore() });
		const first = await service.addPokemon(1, mon(), []);
		const second = await service.addPokemon(1, mon({ pokemon_id: 19 }), []);
		const third = await service.addPokemon(1, mon({ pokemon_id: 10 }), []);
		assert.equal(first.position, 1);
		assert.equal(second.position, 2);
		assert.equal(third.position, 3);

		const rows = await service.getPartyRows(1);
		assert.equal(rows.length, 3);
		assert.deepEqual(
			rows.map((row) => row.position),
			[1, 2, 3]
		);
	});

	it("rejects the 4th Pokémon with a 400", async () => {
		const service = createPartyService({ store: createMemoryPartyStore() });
		for (let i = 0; i < MAX_PARTY; i++) {
			await service.addPokemon(1, mon({ pokemon_id: 10 + i }), []);
		}
		await assert.rejects(
			() => service.addPokemon(1, mon({ pokemon_id: 99 }), []),
			(err) => {
				assert.equal(err instanceof PartyError, true);
				assert.equal(err.status, 400);
				assert.match(err.message, /Party is full \(max 3 Pokémon\)/);
				return true;
			}
		);
		const rows = await service.getPartyRows(1);
		assert.equal(rows.length, 3);
	});

	it("fills the lowest free position when there is a gap", async () => {
		const service = createPartyService({
			store: createMemoryPartyStore({
				1: [mon({ position: 1 }), mon({ position: 3, pokemon_id: 19 })],
			}),
		});
		const added = await service.addPokemon(1, mon({ pokemon_id: 10 }), []);
		assert.equal(added.position, 2);
	});

	it("caps are per trainer", async () => {
		const service = createPartyService({ store: createMemoryPartyStore() });
		for (let i = 0; i < MAX_PARTY; i++) {
			await service.addPokemon(1, mon({ pokemon_id: 10 + i }), []);
		}
		const other = await service.addPokemon(2, mon(), []);
		assert.equal(other.position, 1);
	});

	it("stores moves with the new row", async () => {
		const service = createPartyService({ store: createMemoryPartyStore() });
		await service.addPokemon(1, mon(), [
			{ move_id: 33, pp: 35 },
			{ move_id: 45 },
		]);
		const rows = await service.getPartyRows(1);
		assert.equal(rows[0].moves.length, 2);
		assert.equal(rows[0].moves[0].move_id, 33);
	});

	it("assigns a gender to a newly added Pokémon", async () => {
		const service = createPartyService({ store: createMemoryPartyStore() });
		await service.addPokemon(1, mon({ pokemon_id: 132 }), []); // Ditto: genderless
		const rows = await service.getPartyRows(1);
		assert.equal(rows[0].gender, "genderless");
	});

	it("does not overwrite an explicitly provided gender", async () => {
		const service = createPartyService({ store: createMemoryPartyStore() });
		await service.addPokemon(1, mon({ gender: "female" }), []);
		const rows = await service.getPartyRows(1);
		assert.equal(rows[0].gender, "female");
	});
});
