// Short field effects driven by what the player does. No canvas here, so the
// rules test headless; the renderer draws `fx.effects`.
const DURATION = { rustle: 18, dust: 16 };

export function createFx() {
	return { effects: [], last: null, lastTick: 0 };
}

/** Advance effects to `tick` and add any the player's move just caused. */
export function stepFx(fx, { tick, player, isGrass }) {
	const dt = tick - fx.lastTick;
	fx.lastTick = tick;
	const last = fx.last;
	if (last && last.mapId !== player.mapId) fx.effects = [];
	for (const e of fx.effects) e.t += dt;
	fx.effects = fx.effects.filter((e) => e.t < DURATION[e.kind]);

	const to = player.phase === "walk" ? player.to : null;
	const sameStep = to && last?.to && last.to.x === to.x && last.to.y === to.y;
	if (to && !sameStep && isGrass(to.x, to.y)) fx.effects.push({ kind: "rustle", x: to.x, y: to.y, t: 0, dur: DURATION.rustle });
	if (last?.phase === "hop" && player.phase !== "hop") fx.effects.push({ kind: "dust", x: player.x, y: player.y, t: 0, dur: DURATION.dust });

	fx.last = { mapId: player.mapId, phase: player.phase, to };
	return fx;
}
