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

describe("party + PC layout (arrange)", () => {
	async function setup() {
		const svc = createPartyService({ store: createMemoryPartyStore() });
		const ids = [];
		for (const name of ["A", "B", "C"]) ids.push((await svc.addPokemon(1, mon({ nickname: name }))).id);
		return { svc, ids };
	}
	const names = (rows) => rows.map((r) => r.nickname);

	it("reorders the party and renumbers positions from 1", async () => {
		const { svc, ids } = await setup();
		const out = await svc.arrange(1, { party: [ids[2], ids[0], ids[1]], pc: [] });
		assert.deepEqual(names(out.party), ["C", "A", "B"]);
		assert.deepEqual(out.party.map((r) => r.position), [1, 2, 3]);
	});

	it("deposits to and withdraws from the PC, and swaps in one write", async () => {
		const { svc, ids } = await setup();
		let out = await svc.arrange(1, { party: [ids[0], ids[1]], pc: [ids[2]] });
		assert.deepEqual(names(out.pc), ["C"]);
		assert.deepEqual(names(await svc.getPartyRows(1)), ["A", "B"]);
		out = await svc.arrange(1, { party: [ids[2], ids[1]], pc: [ids[0]] });
		assert.deepEqual(names(out.party), ["C", "B"]);
		assert.deepEqual(names(out.pc), ["A"]);
	});

	it("rejects an empty party, more than MAX_PARTY, and unknown or duplicate ids", async () => {
		const { svc, ids } = await setup();
		const bad = (layout) => assert.rejects(() => svc.arrange(1, layout), (e) => e instanceof PartyError && e.status === 400);
		await bad({ party: [], pc: ids });
		await bad({ party: [ids[0], ids[0], ids[1]], pc: [ids[2]] });
		await bad({ party: [ids[0], ids[1]], pc: [] }); // omits C
		await bad({ party: [ids[0], ids[1], ids[2], 999], pc: [] });
		await svc.arrange(1, { party: [ids[0]], pc: [ids[1], ids[2]] });
		assert.equal(MAX_PARTY, 3);
		await bad({ party: [ids[0], ids[1], ids[2], ids[2]], pc: [] });
	});

	it("depositByPosition keeps the freed slot for the next addPokemon", async () => {
		const { svc } = await setup();
		await svc.depositByPosition(1, 2);
		const added = await svc.addPokemon(1, mon({ nickname: "D" }));
		assert.equal(added.position, 2);
		assert.deepEqual(names(await svc.getPcRows(1)), ["B"]);
	});
});
