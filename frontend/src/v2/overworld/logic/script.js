// Data-driven event scripts. A script is a JSON array of ops. Resolving a
// script is pure: it turns ops + current flags into an ordered effect list
// for the host to play (dialogue, warps, cutscene walks...). The client never
// decides outcomes: effects like give/heal/battle/shop are *requests* that the
// server confirms (wired up in Phase 3); setFlag effects mirror server flags.

export class ScriptError extends Error {}

const DIRS = new Set(["up", "down", "left", "right"]);
const need = (cond, msg) => {
	if (!cond) throw new ScriptError(msg);
};
const isStr = (v) => typeof v === "string" && v.length > 0;

const VALIDATORS = {
	say: (o) => need(isStr(o.text) || (Array.isArray(o.text) && o.text.length && o.text.every(isStr)), "say needs text"),
	give: (o) => need(isStr(o.item) && (o.qty === undefined || (Number.isInteger(o.qty) && o.qty > 0)), "give needs item[, qty>0]"),
	setFlag: (o) => need(isStr(o.flag), "setFlag needs flag"),
	requireFlag: (o) => {
		need(isStr(o.flag), "requireFlag needs flag");
		if (o.else !== undefined) validateScript(o.else);
	},
	heal: () => {},
	battle: (o) => need(isStr(o.trainer), "battle needs trainer"),
	warp: (o) => need(isStr(o.map) && Number.isInteger(o.x) && Number.isInteger(o.y), "warp needs map,x,y"),
	shop: (o) => need(isStr(o.shop), "shop needs shop"),
	cutsceneMove: (o) =>
		need(isStr(o.actor) && Array.isArray(o.path) && o.path.length > 0 && o.path.every((d) => DIRS.has(d)), "cutsceneMove needs actor,path[dirs]"),
};

export function validateScript(script) {
	need(Array.isArray(script), "script must be an array of ops");
	for (const op of script) {
		need(op && typeof op === "object", "op must be an object");
		const check = VALIDATORS[op.op];
		need(check, `unknown op "${op.op}"`);
		check(op);
	}
	return script;
}

export function parseScript(json, where = "script") {
	let value = json;
	if (typeof json === "string") {
		try {
			value = JSON.parse(json);
		} catch (e) {
			throw new ScriptError(`${where}: invalid JSON (${e.message})`);
		}
	}
	try {
		return validateScript(value);
	} catch (e) {
		throw new ScriptError(`${where}: ${e.message}`);
	}
}

/**
 * Resolve `script` against `flags` (anything with `.has(name)`).
 * Returns { effects }. A failed requireFlag runs its `else` ops (if any) and
 * stops the script. Flags set earlier in the same script count for later ops.
 */
export function resolveScript(script, flags) {
	const local = new Set();
	const has = (f) => local.has(f) || flags.has(f);
	const effects = [];
	const run = (ops) => {
		for (const op of ops) {
			if (op.op === "requireFlag") {
				const ok = op.not ? !has(op.flag) : has(op.flag);
				if (!ok) {
					if (op.else) run(op.else);
					return false;
				}
			} else if (op.op === "setFlag") {
				local.add(op.flag);
				effects.push({ type: "setFlag", flag: op.flag });
			} else if (op.op === "say") {
				effects.push({ type: "say", pages: Array.isArray(op.text) ? op.text : [op.text] });
			} else {
				const { op: type, ...rest } = op;
				effects.push({ type, ...rest });
			}
		}
		return true;
	};
	run(script);
	return { effects };
}
