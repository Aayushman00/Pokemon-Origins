/** In-memory flag set. Phase 3 swaps in a server-backed implementation with the same has/add surface. */
export function createMemoryFlags(initial = []) {
	const set = new Set(initial);
	return {
		has: (f) => set.has(f),
		add: (f) => void set.add(f),
		list: () => [...set],
	};
}
