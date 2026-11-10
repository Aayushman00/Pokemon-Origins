// Client feature flags. Build-time defaults come from VITE_FLAG_<NAME>=1|true.
// In dev builds a flag can also be toggled per browser with
// localStorage["po.flag.<NAME>"] = "1" | "0". The server's own flags
// (GET /api/flags) remain authoritative for anything it enforces.


const truthy = (v) => v === true || v === "1" || v === "true" || v === 1;

export function createFlags({ env = {}, storage = null } = {}) {
	function isEnabled(name) {
		if (env.DEV && storage) {
			try {
				const o = storage.getItem(`po.flag.${name}`);
				if (o === "1") return true;
				if (o === "0") return false;
			} catch {
				/* storage blocked: fall through to build-time default */
			}
		}
		return truthy(env[`VITE_FLAG_${name}`]);
	}
	return { isEnabled };
}

function safeStorage() {
	try {
		return typeof localStorage === "undefined" ? null : localStorage;
	} catch {
		return null;
	}
}

const defaults = createFlags({ env: import.meta.env || {}, storage: safeStorage() });
export const isEnabled = defaults.isEnabled;
