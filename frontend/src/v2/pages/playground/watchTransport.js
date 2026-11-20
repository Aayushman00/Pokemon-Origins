/**
 * The battle stands: a read-only feed of someone else's PvP match, shaped for
 * useBattle (`watch: true`). Rounds are pushed, so they queue until the screen
 * has finished animating the last one and asks for the next; none are dropped.
 */
export function createWatchTransport(socket, { matchId, state }) {
	const queue = []; // rounds (and then the end) not yet asked for
	let end = null;
	let waiting = null; // resolve of a nextRound() with nothing queued

	const push = (item) => {
		if (waiting) {
			const resolve = waiting;
			waiting = null;
			resolve(item);
		} else queue.push(item);
	};
	const onRound = (r) => r?.matchId === matchId && push({ events: r.events || [], state: r.state });
	const onEnd = (e) => {
		if (e?.matchId !== matchId || end) return;
		end = { end: { winnerName: e.winnerName, endedBy: e.endedBy, state: e.state } };
		push(end);
	};
	socket.on("pvp:watch-round", onRound);
	socket.on("pvp:watch-end", onEnd);

	return {
		watch: true,
		start: async () => ({ success: true, state }),
		/** The next round in arrival order, or `{ end }` once the match is over (and every time after). */
		nextRound: () => (queue.length ? Promise.resolve(queue.shift()) : end ? Promise.resolve(end) : new Promise((resolve) => (waiting = resolve))),
		close() {
			socket.off("pvp:watch-round", onRound);
			socket.off("pvp:watch-end", onEnd);
			socket.emit("pvp:unwatch");
		},
	};
}
