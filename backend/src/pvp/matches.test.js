const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createMatchRegistry, CHALLENGE_MS, ROUND_MS, MAX_MATCHES } = require("./matches");
const { createBattleSessionService } = require("../services/battleSessionService");
const { createBattleAi } = require("../services/battleAi");

const tackle = () => ({ move_id: 33, name: "Tackle", power: 40, accuracy: 100, move_type: "Normal", pp: 35, current_pp: 35 });
const mon = (nickname, position, speed) => ({
	pokemon_id: 1, nickname, position, level: 50, max_hp: 100, current_hp: 100, attack: 50, defense: 50,
	speed, special_atk: 50, special_def: 50, types: ["Normal"], moves: [tackle()],
});
const PARTIES = { 1: [mon("Alpha", 1, 60)], 2: [mon("Gamma", 1, 30), mon("Delta", 2, 30)], 3: [mon("Omega", 1, 10)], 4: [] };
const NAMES = { 1: "Ash", 2: "Gary", 3: "Misty", 4: "Brock" };
// Trainers 5-14 fill the stands (the 5-match cap).
for (let id = 5; id <= 14; id++) {
	PARTIES[id] = [mon(`Mon${id}`, 1, 20)];
	NAMES[id] = `Trainer ${id}`;
}

function setup({ damage = 10, far = [], recordResult, hold = [] } = {}) {
	const battle = createBattleSessionService({
		engine: {
			async turnOrder(p1, p2) { return { first: p1.speed >= p2.speed ? "pokemon1" : "pokemon2" }; },
			async calculateDamage() { return { result: "hit", damage }; },
		},
		ai: createBattleAi({ chart: {}, random: () => 0 }),
		random: () => 0,
	});
	const sent = [];
	const lobby = []; // broadcast(): the room's live match list
	const watched = []; // emitWatchers(): what the stands see
	const timers = [];
	const results = [];
	const registry = createMatchRegistry({
		battle,
		// `hold`: these trainers' parties never finish loading (a match stuck "starting").
		loadParty: async (id) => hold.includes(id) ? new Promise(() => {}) : PARTIES[id].map((m) => ({ ...m, moves: m.moves.map((x) => ({ ...x })) })),
		recordResult: recordResult || (async (r) => { results.push(r); return { a: { rating: 1016, delta: 16 }, b: { rating: 984, delta: -16 }, rated: true }; }),
		emitTo: (id, event, payload) => sent.push({ id, event, payload }),
		broadcast: (event, payload) => lobby.push({ event, payload }),
		emitWatchers: (matchId, event, payload) => watched.push({ matchId, event, payload }),
		distance: (a, b) => (far.includes(a) || far.includes(b) ? 999 : 16),
		setTimer: (fn, ms) => { const t = { fn, ms, cleared: false }; timers.push(t); return t; },
		clearTimer: (t) => { if (t) t.cleared = true; },
	});
	const fire = async (ms) => {
		const t = timers.filter((x) => !x.cleared && x.ms === ms).at(-1);
		assert.ok(t, `no live ${ms} ms timer`);
		t.cleared = true;
		await t.fn();
	};
	const to = (id, event) => sent.filter((s) => s.id === id && s.event === event);
	const startMatch = async (a = 1, b = 2) => {
		registry.challenge(a, NAMES[a], b);
		await registry.respond(b, NAMES[b], a, true);
	};
	return { registry, sent, results, fire, to, startMatch, lobby, watched };
}
const move = { type: "move", moveId: 33 };

describe("pvp match registry", () => {
	it("rejects guests, self, out-of-range and busy challenges", async () => {
		const { registry, to, startMatch } = setup({ far: [3] });
		registry.challenge("guest-x", "Guest", 2);
		registry.challenge(1, "Ash", "guest-y");
		registry.challenge(1, "Ash", 1);
		registry.challenge(1, "Ash", 3);
		assert.equal(to(1, "pvp:error").length, 3);
		assert.equal(to("guest-x", "pvp:error").length, 1);
		await startMatch(1, 2);
		registry.challenge(4, "Brock", 1);
		assert.match(to(4, "pvp:error")[0].payload.message, /already in a battle/i);
		assert.equal(to(2, "pvp:challenged").length, 1);
	});

	it("an empty party cannot start a match", async () => {
		const { registry, to } = setup();
		registry.challenge(1, "Ash", 4);
		await registry.respond(4, "Brock", 1, true);
		assert.equal(to(1, "pvp:start").length, 0);
		assert.match(to(4, "pvp:error")[0].payload.message, /no Pokémon/);
		assert.equal(registry.inMatch(1), false);
	});

	it("accept starts a match and sends each side its own view", async () => {
		const { registry, to, startMatch } = setup();
		await startMatch();
		assert.equal(to(1, "pvp:start")[0].payload.state.player.nickname, "Alpha");
		assert.equal(to(2, "pvp:start")[0].payload.state.player.nickname, "Gamma");
		assert.equal(registry.inMatch(1) && registry.inMatch(2), true);
	});

	it("decline tells the challenger", async () => {
		const { registry, to } = setup();
		registry.challenge(1, "Ash", 2);
		await registry.respond(2, "Gary", 1, false);
		assert.deepEqual(to(1, "pvp:declined")[0].payload, { byId: 2 });
		assert.equal(registry.inMatch(1), false);
	});

	it("challenge expires after 30 s", async () => {
		const { registry, to, fire } = setup();
		registry.challenge(1, "Ash", 2);
		await fire(CHALLENGE_MS);
		assert.equal(to(1, "pvp:expired").length, 1);
		assert.equal(to(2, "pvp:expired").length, 1);
		await registry.respond(2, "Gary", 1, true);
		assert.equal(to(2, "pvp:error").length, 1);
		assert.equal(registry.inMatch(1), false);
	});

	it("round resolves once, mirrored to B", async () => {
		const { registry, to, startMatch } = setup();
		await startMatch();
		await registry.act(1, move);
		assert.equal(to(1, "pvp:waiting").length, 1);
		await registry.act(2, move);
		const [a] = to(1, "pvp:round");
		const [b] = to(2, "pvp:round");
		assert.ok(a && b);
		assert.equal(to(1, "pvp:round").length, 1);
		assert.equal(a.payload.events[0].actor, "player"); // Alpha is faster: A's beat first
		assert.equal(b.payload.events[0].actor, "enemy");
		assert.equal(b.payload.state.player.nickname, "Gamma");
	});

	it("illegal action reaches only the sender as pvp:error", async () => {
		const { registry, to, startMatch } = setup();
		await startMatch();
		await registry.act(1, { type: "move", moveId: 999 });
		assert.match(to(1, "pvp:error")[0].payload.message, /Unknown move/);
		assert.equal(to(2, "pvp:error").length, 0);
		await registry.act(3, move);
		assert.match(to(3, "pvp:error")[0].payload.message, /not in a battle/);
	});

	it("60 s with no action forfeits the idle side", async () => {
		const { registry, to, results, startMatch, fire } = setup();
		await startMatch();
		await registry.act(1, move);
		await fire(ROUND_MS);
		assert.deepEqual(results, [{ aId: 1, bId: 2, winnerId: 1, endedBy: "timeout" }]);
		assert.deepEqual(to(1, "pvp:end")[0].payload.rating, { rating: 1016, delta: 16, rated: true });
		assert.deepEqual(to(2, "pvp:end")[0].payload.rating, { rating: 984, delta: -16, rated: true });
		assert.equal(registry.inMatch(1) || registry.inMatch(2), false);
	});

	it("both idle for 60 s voids the match without a result", async () => {
		const { to, results, startMatch, fire } = setup();
		await startMatch();
		await fire(ROUND_MS);
		assert.deepEqual(results, []);
		assert.equal(to(1, "pvp:end")[0].payload.winnerId, null);
	});

	it("disconnect forfeits once; second forfeit is a no-op", async () => {
		const { registry, to, results, startMatch } = setup();
		await startMatch();
		await registry.forfeit(2, "disconnect");
		await registry.forfeit(2, "disconnect");
		assert.deepEqual(results, [{ aId: 1, bId: 2, winnerId: 1, endedBy: "disconnect" }]);
		assert.equal(to(1, "pvp:end").length, 1);
	});

	it("leaving also cancels an open challenge", async () => {
		const { registry, to } = setup();
		registry.challenge(1, "Ash", 2);
		await registry.forfeit(1, "disconnect");
		assert.equal(to(2, "pvp:expired").length, 1);
		await registry.respond(2, "Gary", 1, true);
		assert.equal(registry.inMatch(2), false);
	});

	it("KO ends the match with endedBy 'ko'", async () => {
		const { registry, results, startMatch } = setup({ damage: 100 });
		await startMatch(1, 3); // Misty has one mon
		await registry.act(1, move);
		await registry.act(3, move);
		assert.deepEqual(results, [{ aId: 1, bId: 3, winnerId: 1, endedBy: "ko" }]);
	});

	it("recordResult throwing still sends pvp:end with rating null", async () => {
		const { registry, to, startMatch } = setup({ recordResult: async () => { throw new Error("db down"); } });
		await startMatch();
		await registry.forfeit(1);
		assert.equal(to(2, "pvp:end")[0].payload.winnerId, 2);
		assert.equal(to(2, "pvp:end")[0].payload.rating, null);
	});
});

describe("battle stands", () => {
	const FULL = "The stadium is full — wait for a battle to finish";
	const matchIdOf = (to, id) => to(id, "pvp:start")[0].payload.matchId;
	const fill = async (startMatch, pairs) => {
		for (const [a, b] of pairs) await startMatch(a, b);
	};
	const FIVE = [[1, 2], [5, 6], [7, 8], [9, 10], [11, 12]];

	it(`a 6th match is refused while ${MAX_MATCHES} run`, async () => {
		const { registry, to, startMatch } = setup();
		assert.equal(MAX_MATCHES, 5);
		await fill(startMatch, FIVE);
		registry.challenge(13, NAMES[13], 14);
		assert.equal(to(13, "pvp:error").at(-1).payload.message, FULL);
		assert.equal(to(14, "pvp:challenged").length, 0);
	});

	it("counts matches that are still starting", async () => {
		const { registry, to, startMatch } = setup({ hold: [11] });
		await fill(startMatch, FIVE.slice(0, 4));
		registry.challenge(11, NAMES[11], 12);
		registry.respond(12, NAMES[12], 11, true); // parties still loading
		registry.challenge(13, NAMES[13], 14);
		assert.equal(to(13, "pvp:error").at(-1).payload.message, FULL);
	});

	it("an accept is refused when the stands filled up after the challenge", async () => {
		const { registry, to, startMatch } = setup();
		await fill(startMatch, FIVE.slice(0, 4));
		registry.challenge(13, NAMES[13], 14);
		await startMatch(11, 12);
		await registry.respond(14, NAMES[14], 13, true);
		assert.equal(to(14, "pvp:error").at(-1).payload.message, FULL);
		assert.equal(to(13, "pvp:start").length, 0);
	});

	it("lists live matches and broadcasts the list on start and end", async () => {
		const { registry, to, startMatch, lobby } = setup();
		await startMatch(1, 2);
		const matchId = matchIdOf(to, 1);
		assert.deepEqual(registry.list(), [{ matchId, names: { player: "Ash", enemy: "Gary" }, round: registry.list()[0].round }]);
		assert.deepEqual(lobby.at(-1), { event: "pvp:matches", payload: { matches: registry.list() } });
		await registry.forfeit(1);
		assert.deepEqual(registry.list(), []);
		assert.deepEqual(lobby.at(-1), { event: "pvp:matches", payload: { matches: [] } });
	});

	it("watch hands a spectator view; seated trainers and finished matches are refused", async () => {
		const { registry, to, startMatch } = setup();
		await startMatch(1, 2);
		const matchId = matchIdOf(to, 1);
		const seen = registry.watch(5, matchId);
		assert.equal(seen.state.pvp.spectator, true);
		assert.ok(!("moves" in seen.state.player));
		assert.deepEqual(registry.watch(1, matchId), { error: "You're in this battle" });
		assert.deepEqual(registry.watch("guest-1", "nope"), { error: "That battle is over" });
		assert.ok(registry.watch("guest-1", matchId).state, "guests may watch");
	});

	it("rounds and the end reach the watchers", async () => {
		const { registry, to, startMatch, watched } = setup();
		await startMatch(1, 2);
		const matchId = matchIdOf(to, 1);
		await registry.act(1, move);
		await registry.act(2, move);
		const round = watched.find((w) => w.event === "pvp:watch-round");
		assert.equal(round.matchId, matchId);
		assert.ok(round.payload.events.length > 0);
		assert.equal(round.payload.state.pvp.spectator, true);
		await registry.forfeit(2);
		const end = watched.find((w) => w.event === "pvp:watch-end");
		assert.deepEqual({ ...end.payload, state: undefined }, { matchId, winnerName: "Ash", endedBy: "forfeit", state: undefined });
		assert.equal(end.payload.state.pvp.spectator, true);
	});
});
