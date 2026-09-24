export const MAX_PARTY = 3;

/**
 * Result of dropping Pokémon `id` (currently in `from`: "party" | "pc") on
 * a target: { zone: "party" | "pc", index } where index is the slot it was
 * dropped on (defaults to the end). Pure; returns the new
 * { party, pc } id lists, or null when the drop is not allowed or changes
 * nothing. Mirrors the server's arrange() rules: party keeps 1..MAX_PARTY.
 *
 * - party → party: move to that slot (reorder).
 * - pc → party with room: insert at that slot.
 * - pc → party when full: swap with the member on that slot; the member
 *   takes the dragged Pokémon's old place in the PC.
 * - party → pc: deposit at that box slot (never the last party member).
 * - pc → pc: reorder the box.
 */
export function applyDrop(layout, { id, from }, { zone, index }) {
	const party = [...layout.party];
	const pc = [...layout.pc];
	const src = from === "party" ? party : pc;
	const fromIndex = src.indexOf(id);
	if (fromIndex === -1) return null;
	const clamp = (i, list) => Math.max(0, Math.min(i ?? list.length, list.length));

	if (zone === "party" && from === "pc" && party.length >= MAX_PARTY) {
		const slot = clamp(index, party.slice(0, -1));
		const outgoing = party[slot];
		party[slot] = id;
		pc[fromIndex] = outgoing;
		return { party, pc };
	}

	if (zone === "pc" && from === "party" && party.length <= 1) return null;

	src.splice(fromIndex, 1);
	const dest = zone === "party" ? party : pc;
	dest.splice(clamp(index, dest), 0, id);
	if (dest.length > (zone === "party" ? MAX_PARTY : Infinity)) return null;

	const same = party.join() === layout.party.join() && pc.join() === layout.pc.join();
	return same ? null : { party, pc };
}
