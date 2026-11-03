import { DIRS } from "../constants.js";

const inside = (o, x, y) => x >= o.x && y >= o.y && x < o.x + o.w && y < o.y + o.h;
export const doneFlag = (mapId, obj) => `done:${mapId}:${obj.name}`;

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
