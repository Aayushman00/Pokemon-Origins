// Server feature flags, read from env FLAG_<NAME>=1|true. Everything new is off by default.
// The server is authoritative: gated routes check these, never the client.
const NAMES = ["OVERWORLD"];

const truthy = (v) => v === "1" || v === "true" || v === true;

function createFlags(env = process.env) {
	const state = Object.fromEntries(NAMES.map((n) => [n, truthy(env[`FLAG_${n}`])]));
	return {
		isEnabled: (name) => state[name] === true,
		all: () => ({ ...state }),
	};
}

const defaults = createFlags();

module.exports = { createFlags, NAMES, isEnabled: defaults.isEnabled, all: defaults.all };
