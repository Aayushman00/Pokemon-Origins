const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createBattleSessionService } = require("./battleSessionService");
const { createBattleAi } = require("./battleAi");

const tackle = () => ({ move_id: 33, name: "Tackle", power: 40, accuracy: 100, move_type: "Normal", pp: 35, current_pp: 35 });

function mon(nickname, position, overrides = {}) {
	return {
		pokemon_id: 1,
		nickname,
		position,
		level: 50,
		max_hp: 100,
		current_hp: 100,
		attack: 50,
		defense: 50,
		speed: 50,
		special_atk: 50,
		special_def: 50,
		types: ["Normal"],
		moves: [tackle()],
		...overrides,
	};
}

/** Priority then speed; every hit does `damage`. Records each defender. */
function stubEngine(damage = 10) {
	return {
		defenders: [],
		async turnOrder(p1, p2, pr = {}) {
			const a = pr.priority1 ?? 0;
			const b = pr.priority2 ?? 0;
			if (a !== b) return { first: a > b ? "pokemon1" : "pokemon2" };
			return { first: p1.speed >= p2.speed ? "pokemon1" : "pokemon2" };
		},
		async calculateDamage({ defender }) {
			this.defenders.push(defender.nickname);
			return { result: "hit", damage };
		},
	};
}

function spyStore() {
	const calls = [];
	const record = (name) => async (...args) => { calls.push([name, ...args]); };
	return { calls, savePp: record("savePp"), saveHp: record("saveHp"), record: record("record"), recordResult: record("recordResult") };
}

function setup({ damage = 10, a, b } = {}) {
	const engine = stubEngine(damage);
	const store = spyStore();
	const svc = createBattleSessionService({
		engine,
		ai: createBattleAi({ chart: {}, random: () => 0 }),
		random: () => 0,
		ppStore: store,
		hpStore: store,
		history: store,
	});
	const parties = {
		a: { trainerId: 1, name: "Ash", party: a || [mon("Alpha", 1, { speed: 60 }), mon("Beta", 2)] },
		b: { trainerId: 2, name: "Gary", party: b || [mon("Gamma", 1, { speed: 30 }), mon("Delta", 2)] },
	};
	return { svc, engine, store, parties };
}

const move = { type: "move", moveId: 33 };

describe("pvp round resolver", () => {
	it("resolves only when both sides have acted", async () => {
		const { svc, parties } = setup();
		const s = await svc.createPvpSession(parties);
		assert.deepEqual(await svc.submitPvpAction(s, "player", move), { resolved: false });
		const r = await svc.submitPvpAction(s, "enemy", move);
		assert.equal(r.resolved, true);
		assert.ok(r.events.some((e) => e.actor === "player" && e.type === "move"));
		assert.ok(r.events.some((e) => e.actor === "enemy" && e.type === "move"));
		assert.deepEqual(s.pvp.pending, { player: null, enemy: null });
		assert.equal(s.pvp.round, 2);
	});

	it("rejects a second action from the same side in one round", async () => {
		const { svc, parties } = setup();
		const s = await svc.createPvpSession(parties);
		await svc.submitPvpAction(s, "player", move);
		await assert.rejects(svc.submitPvpAction(s, "player", move), /Already chose/);
	});

	it("rejects an unknown move", async () => {
		const { svc, parties } = setup();
		const s = await svc.createPvpSession(parties);
		await assert.rejects(svc.submitPvpAction(s, "enemy", { type: "move", moveId: 999 }), /Unknown move/);
	});

	it("switches resolve before moves for both sides", async () => {
		const { svc, engine, parties } = setup();
		const s = await svc.createPvpSession(parties);
		await svc.submitPvpAction(s, "player", move);
		const r = await svc.submitPvpAction(s, "enemy", { type: "switch", partyPosition: 2 });
		assert.equal(s.enemy.nickname, "Delta");
		assert.deepEqual(engine.defenders, ["Delta"]);
		assert.ok(r.events.findIndex((e) => e.type === "enemy_send") < r.events.findIndex((e) => e.type === "move"));
	});

	it("a KO makes that side pick its replacement before the next round", async () => {
		const { svc, parties } = setup({ damage: 100 });
		const s = await svc.createPvpSession(parties);
		await svc.submitPvpAction(s, "player", move);
		await svc.submitPvpAction(s, "enemy", move);
		assert.equal(s.status, "active");
		assert.deepEqual(s.pvp.needsSend, { player: false, enemy: true });
		await assert.rejects(svc.submitPvpAction(s, "enemy", move), /choose your next/i);
		await assert.rejects(svc.submitPvpAction(s, "player", move), /Waiting/);
		const r = await svc.submitPvpAction(s, "enemy", { type: "switch", partyPosition: 2 });
		assert.equal(r.resolved, true);
		assert.deepEqual(r.events.map((e) => [e.actor, e.type]), [["enemy", "enemy_send"]]);
		assert.equal(s.enemy.nickname, "Delta");
		assert.deepEqual(s.pvp.needsSend, { player: false, enemy: false });
	});

	it("last mon fainting ends the match", async () => {
		const { svc, parties } = setup({ damage: 100, b: [mon("Gamma", 1, { speed: 30 })] });
		const s = await svc.createPvpSession(parties);
		await svc.submitPvpAction(s, "player", move);
		await svc.submitPvpAction(s, "enemy", move);
		assert.equal(s.status, "won");
		await assert.rejects(svc.submitPvpAction(s, "player", move), /over/);
	});

	it("forfeitPvp hands the win to the other side", async () => {
		const { svc, parties } = setup();
		const s = await svc.createPvpSession(parties);
		svc.forfeitPvp(s, "player");
		assert.equal(s.status, "lost");
	});

	it("viewFor mirrors for side B and hides opponent moves and reserve HP", async () => {
		const { svc, parties } = setup();
		const s = await svc.createPvpSession(parties);
		await svc.submitPvpAction(s, "player", move);
		const v = svc.viewFor(s, "enemy");
		assert.equal(v.player.nickname, "Gamma");
		assert.equal(v.enemy.nickname, "Alpha");
		assert.equal(v.trainerName, "Ash");
		assert.equal(v.battleType, "pvp");
		assert.ok(v.player.moves.length > 0);
		assert.ok(!("moves" in v.enemy));
		assert.ok(v.enemyParty.every((m) => !("moves" in m)));
		assert.ok(v.enemyParty.filter((m) => m.position !== v.enemyActivePosition).every((m) => !("current_hp" in m)));
		assert.equal(v.pvp.waitingOn, null); // B has not chosen yet
		assert.equal(svc.viewFor(s, "player").pvp.waitingOn, "opponent");
	});

	it("mirrorEvents swaps player/enemy values only", () => {
		const { svc } = setup();
		assert.deepEqual(svc.mirrorEvents([{ actor: "player", target: "enemy", type: "move", damage: 5 }]), [
			{ actor: "enemy", target: "player", type: "move", damage: 5 },
		]);
	});

	it("never touches pp/hp/history stores", async () => {
		const { svc, store, parties } = setup({ damage: 100, b: [mon("Gamma", 1, { speed: 30 })] });
		const s = await svc.createPvpSession(parties);
		await svc.submitPvpAction(s, "player", move);
		await svc.submitPvpAction(s, "enemy", move);
		assert.equal(s.status, "won");
		assert.deepEqual(store.calls, []);
	});
});
