/**
 * Live PvP over the Playground socket: challenges, matches, round timers.
 * One match per trainer, in memory (lost on restart, like battle sessions).
 * Side A (challenger) is the battle's "player" seat, side B the "enemy" seat.
 * Anyone in the room may watch from the stands (seat A's view, nothing hidden
 * revealed); at most MAX_MATCHES run at once.
 */
const { CHAT_RADIUS_PX } = require("../playground/movement");

const CHALLENGE_MS = 30_000;
const ROUND_MS = 60_000;
const SIDES = ["player", "enemy"];
const MAX_MATCHES = 5;
const FULL = "The stadium is full — wait for a battle to finish";

const isTrainer = (id) => Number.isInteger(id);

function createMatchRegistry({
	battle,
	loadParty,
	recordResult = async () => null,
	emitTo,
	broadcast = () => {}, // to the whole room: the live match list
	emitWatchers = () => {}, // to everyone watching one match
	distance,
	maxDistance = CHAT_RADIUS_PX,
	setTimer = setTimeout,
	clearTimer = clearTimeout,
}) {
	const challenges = new Map(); // fromId -> { toId, name, timer }
	const byTrainer = new Map(); // trainerId -> match
	const starting = new Set(); // trainerIds whose match is being built (parties loading)
	const byMatch = new Map(); // matchId (the session id) -> match

	// A match still loading parties holds its place: two trainers per match.
	const full = () => byMatch.size + starting.size / 2 >= MAX_MATCHES;
	const list = () =>
		[...byMatch.values()].map(({ session }) => ({ matchId: session.sessionId, names: { ...session.pvp.names }, round: session.pvp.round }));
	const announce = () => broadcast("pvp:matches", { matches: list() });

	const busy = (id) => byTrainer.has(id) || starting.has(id);
	const error = (id, message) => emitTo(id, "pvp:error", { message });
	const sideOf = (match, id) => (match.seats.player === id ? "player" : "enemy");

	function challenge(fromId, fromName, toId) {
		if (!isTrainer(fromId) || !isTrainer(toId)) return error(fromId, "Sign in to battle other trainers");
		if (fromId === toId) return error(fromId, "You can't battle yourself");
		if (busy(fromId)) return error(fromId, "You're already in a battle");
		if (busy(toId)) return error(fromId, "That trainer is already in a battle");
		if (challenges.has(fromId)) return error(fromId, "You already have a challenge out");
		if (full()) return error(fromId, FULL);
		const gap = distance(fromId, toId);
		if (gap == null || gap > maxDistance) return error(fromId, "Too far away — walk closer first");
		const timer = setTimer(() => expire(fromId), CHALLENGE_MS);
		challenges.set(fromId, { toId, name: fromName, timer });
		emitTo(toId, "pvp:challenged", { fromId, name: fromName });
	}

	function expire(fromId) {
		const open = challenges.get(fromId);
		if (!open) return;
		clearTimer(open.timer);
		challenges.delete(fromId);
		emitTo(fromId, "pvp:expired", { fromId, toId: open.toId });
		emitTo(open.toId, "pvp:expired", { fromId, toId: open.toId });
	}

	async function respond(toId, toName, fromId, accept) {
		const open = challenges.get(fromId);
		if (!open || open.toId !== toId) return error(toId, "That challenge is gone");
		clearTimer(open.timer);
		challenges.delete(fromId);
		if (!accept) return emitTo(fromId, "pvp:declined", { byId: toId });
		if (busy(fromId) || busy(toId)) return error(toId, "One of you is already in a battle");
		if (full()) {
			for (const id of [fromId, toId]) error(id, FULL);
			return;
		}

		starting.add(fromId);
		starting.add(toId);
		try {
			const [partyA, partyB] = await Promise.all([loadParty(fromId), loadParty(toId)]);
			const empty = !partyA.length ? open.name : !partyB.length ? toName : null;
			if (empty) {
				for (const id of [fromId, toId]) error(id, `${empty} has no Pokémon to battle with`);
				return;
			}
			const session = await battle.createPvpSession({
				a: { trainerId: fromId, name: open.name, party: partyA },
				b: { trainerId: toId, name: toName, party: partyB },
			});
			const match = { session, seats: { player: fromId, enemy: toId }, timer: null, ended: false };
			byTrainer.set(fromId, match);
			byTrainer.set(toId, match);
			byMatch.set(session.sessionId, match);
			armRoundTimer(match);
			for (const side of SIDES) {
				emitTo(match.seats[side], "pvp:start", { matchId: session.sessionId, state: battle.viewFor(session, side) });
			}
			announce();
		} catch (err) {
			console.error("PvP start failed:", err.message);
			for (const id of [fromId, toId]) error(id, "Could not start the battle");
		} finally {
			starting.delete(fromId);
			starting.delete(toId);
		}
	}

	function armRoundTimer(match) {
		clearTimer(match.timer);
		match.timer = setTimer(() => roundTimeout(match), ROUND_MS);
	}

	/** Whoever still owes a choice when the clock runs out loses; both idle voids the match. */
	async function roundTimeout(match) {
		if (match.ended) return;
		const { pvp } = match.session;
		const owing = pvp.needsSend.player || pvp.needsSend.enemy ? SIDES.filter((s) => pvp.needsSend[s]) : SIDES;
		const idle = owing.filter((s) => !pvp.pending[s]);
		if (idle.length === 1) battle.forfeitPvp(match.session, idle[0]);
		await end(match, "timeout");
	}

	async function act(trainerId, action) {
		const match = byTrainer.get(trainerId);
		if (!match) return error(trainerId, "You're not in a battle");
		const side = sideOf(match, trainerId);
		let result;
		try {
			result = await battle.submitPvpAction(match.session, side, action);
		} catch (err) {
			return error(trainerId, err.message);
		}
		if (!result.resolved) return emitTo(trainerId, "pvp:waiting", {});
		const { session } = match;
		emitTo(match.seats.player, "pvp:round", { events: result.events, state: battle.viewFor(session, "player") });
		emitTo(match.seats.enemy, "pvp:round", { events: battle.mirrorEvents(result.events), state: battle.viewFor(session, "enemy") });
		emitWatchers(session.sessionId, "pvp:watch-round", { matchId: session.sessionId, events: result.events, state: battle.spectatorView(session) });
		if (session.status !== "active") await end(match, "ko");
		else armRoundTimer(match);
	}

	/** Gives up the trainer's match (if any) and drops every open challenge they are part of. */
	async function forfeit(trainerId, endedBy = "forfeit") {
		for (const [fromId, open] of challenges) {
			if (fromId === trainerId || open.toId === trainerId) expire(fromId);
		}
		const match = byTrainer.get(trainerId);
		if (!match) return;
		battle.forfeitPvp(match.session, sideOf(match, trainerId));
		await end(match, endedBy);
	}

	async function end(match, endedBy) {
		if (match.ended) return;
		match.ended = true;
		clearTimer(match.timer);
		const { session, seats } = match;
		byTrainer.delete(seats.player);
		byTrainer.delete(seats.enemy);
		byMatch.delete(session.sessionId);
		const winnerId = session.status === "won" ? seats.player : session.status === "lost" ? seats.enemy : null;
		let result = null;
		if (winnerId != null) {
			try {
				result = await recordResult({ aId: seats.player, bId: seats.enemy, winnerId, endedBy });
			} catch (err) {
				console.error("PvP result not recorded:", err.message);
			}
		}
		for (const side of SIDES) {
			const mine = result && (side === "player" ? result.a : result.b);
			emitTo(seats[side], "pvp:end", {
				winnerId,
				endedBy,
				rating: mine ? { rating: mine.rating, delta: mine.delta, rated: result.rated } : null,
				state: battle.viewFor(session, side),
			});
		}
		const winnerSide = SIDES.find((side) => seats[side] === winnerId);
		emitWatchers(session.sessionId, "pvp:watch-end", {
			matchId: session.sessionId,
			winnerName: winnerSide ? session.pvp.names[winnerSide] : null,
			endedBy,
			state: battle.spectatorView(session),
		});
		announce();
	}

	/** A seat in the stands: `viewerId` may be a guest. The caller joins the socket to the match's watch room. */
	function watch(viewerId, matchId) {
		const match = byMatch.get(matchId);
		if (!match) return { error: "That battle is over" };
		if (SIDES.some((side) => match.seats[side] === viewerId)) return { error: "You're in this battle" };
		return { state: battle.spectatorView(match.session) };
	}

	return { challenge, respond, act, forfeit, list, watch, inMatch: (id) => byTrainer.has(id) };
}

module.exports = { createMatchRegistry, CHALLENGE_MS, ROUND_MS, MAX_MATCHES };
