/**
 * Live PvP battle over the Playground socket, shaped like the REST battle
 * API so useBattle can drive it unchanged: start() and act() resolve with
 * { success, state, events }. A deciding round waits for pvp:end so the
 * result carries the rating change (`pvpEnd`).
 */
export function createPvpTransport(socket, startPayload) {
	let pending = null; // { resolve, reject, round }
	let ended = false;
	const endListeners = [];

	const settle = (fn) => {
		const p = pending;
		pending = null;
		fn(p);
	};
	const onRound = ({ events, state }) => {
		if (!pending) return;
		if (state.status !== "active") pending.round = { events, state };
		else settle((p) => p.resolve({ success: true, state, events }));
	};
	const onError = ({ message }) => {
		if (!pending) return;
		const err = Object.assign(new Error(message), { response: { status: 400, data: { error: message } } });
		settle((p) => p.reject(err));
	};
	const onEnd = (end) => {
		if (ended) return;
		ended = true;
		if (pending) {
			settle((p) => p.resolve({ success: true, state: p.round?.state || end.state, events: p.round?.events || [], pvpEnd: end }));
		} else {
			endListeners.forEach((cb) => cb(end));
		}
	};
	socket.on("pvp:round", onRound);
	socket.on("pvp:error", onError);
	socket.on("pvp:end", onEnd);

	return {
		start: async () => ({ success: true, state: startPayload.state }),
		act: (action) =>
			new Promise((resolve, reject) => {
				pending = { resolve, reject, round: null };
				socket.emit("pvp:action", action);
			}),
		forfeit: () => socket.emit("pvp:forfeit"),
		onEnd: (cb) => {
			endListeners.push(cb);
			return () => endListeners.splice(endListeners.indexOf(cb), 1);
		},
		close: () => {
			socket.off("pvp:round", onRound);
			socket.off("pvp:error", onError);
			socket.off("pvp:end", onEnd);
		},
	};
}

/** The rating line under a PvP result. */
export function ratingLine(rating, opponent) {
	if (!rating) return "This match wasn't rated.";
	if (!rating.rated) return `Unrated: you've already played ${opponent} 3 times today.`;
	return `Rating ${rating.rating} (${rating.delta >= 0 ? "+" : ""}${rating.delta})`;
}
