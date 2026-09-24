import { api } from "../../api";

const TTL_MS = 30_000;
const cache = new Map(); // trainerId -> { at, promise }

/** Playground guests get a `guest-<socket>` id and never have a profile. */
export function isGuestId(trainerId) {
	return typeof trainerId === "string" && trainerId.startsWith("guest-");
}

/** Gyms are campaign levels 1–8; each level cleared earns that city's badge. */
export function badgeCount(campaign) {
	return Math.max(0, Math.min(8, (campaign?.current_level || 1) - 1));
}

/**
 * Resolves to { status: "ok", profile } | { status: "guest" } |
 * { status: "missing" } | { status: "error" }. Cached briefly so hovering
 * the same trainer in chat, roster, and map costs one request.
 */
export function fetchProfile(trainerId, { fresh = false } = {}) {
	if (trainerId == null || isGuestId(trainerId)) return Promise.resolve({ status: "guest" });
	const key = String(trainerId);
	const hit = cache.get(key);
	if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.promise;
	const promise = api
		.get(`/api/trainers/${encodeURIComponent(key)}/profile`)
		.then(({ data }) => (data?.success ? { status: "ok", profile: data.profile } : { status: "missing" }))
		.catch((err) => {
			const code = err?.response?.status;
			if (code === 404 || code === 400) return { status: "missing" };
			cache.delete(key);
			return { status: "error" };
		});
	cache.set(key, { at: Date.now(), promise });
	return promise;
}

/** Drop a cached profile (after a battle changes the viewer's own record). */
export function invalidateProfile(trainerId) {
	cache.delete(String(trainerId));
}
