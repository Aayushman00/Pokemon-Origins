import { COL, DIRS } from "../constants.js";
import { collisionAt } from "./mapModel.js";

const inside = (o, x, y) => x >= o.x && y >= o.y && x < o.x + o.w && y < o.y + o.h;
/** The wild table of the grass at this cell, or undefined. */
export const wildTable = (map, pos) => map.encounters.find((e) => inside(e, pos.x, pos.y))?.table;
export const doneFlag = (mapId, obj) => `done:${mapId}:${obj.name}`;

export const defeatedFlag = (trainer) => `trainer:${trainer}`;

/** The first unbeaten trainer who can see `actor`: { npc, steps } (tiles to walk), or null. */
export function spotter(map, actor, npcs, flags) {
	const foes = npcs.filter((n) => n.trainer && !flags.has(defeatedFlag(n.trainer))).sort((a, b) => a.order - b.order);
	for (const npc of foes) {
		const { dx, dy } = DIRS[npc.facing];
		for (let i = 1; i <= npc.sight; i++) {
			const x = npc.x + dx * i;
			const y = npc.y + dy * i;
			if (x === actor.x && y === actor.y) return { npc, steps: i - 1 };
			if (collisionAt(map, x, y) !== COL.FREE || npcs.some((o) => o.x === x && o.y === y)) break;
		}
	}
	return null;
}

/** Triggers of `kind` ('step'|'enter'|'flag') that currently apply. */
export function dueTriggers(map, kind, flags, pos) {
	return map.triggers.filter((t) => {
		if (t.when !== kind) return false;
		if (kind === "step" && !inside(t, pos.x, pos.y)) return false;
		if (kind === "flag" && !flags.has(t.flag)) return false;
		if (t.requires && !flags.has(t.requires)) return false;
		if (t.once && flags.has(doneFlag(map.id, t))) return false;
		return true;
	});
}

/** Script for a trigger, with the once-guard flag appended. */
export function triggerScript(map, trigger) {
	return trigger.once ? [...trigger.script, { op: "setFlag", flag: doneFlag(map.id, trigger) }] : trigger.script;
}

/** warp the actor would take by standing on (x,y) after moving in `dir`. */
export function warpFor(map, x, y, dir) {
	const w = map.warpIndex.get(`${x},${y}`);
	if (!w) return null;
	if (w.enterDir && w.enterDir !== dir) return null;
	return w;
}

/** What the facing tile offers for the A button. actors: [{id,mapId,x,y,script}] */
export function interactionAt(map, actor, actors) {
	const { dx, dy } = DIRS[actor.facing];
	const x = actor.x + dx;
	const y = actor.y + dy;
	const npc = actors.find((n) => n.mapId === map.id && n.x === x && n.y === y && n.script);
	if (npc) return { kind: "npc", npc, script: npc.script };
	const sign = map.signs.find((s) => inside(s, x, y));
	if (sign) return { kind: "sign", sign, script: sign.script || [{ op: "say", text: sign.text }] };
	return null;
}

/** Which way an NPC should face when talked to from `from`. */
export function facingToward(from, target) {
	if (Math.abs(target.x - from.x) > Math.abs(target.y - from.y)) return target.x > from.x ? "right" : "left";
	return target.y > from.y ? "down" : "up";
}
