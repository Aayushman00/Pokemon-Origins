import { TILE, VIEW_H, VIEW_W } from "../constants.js";

/**
 * Integer camera origin (map pixels at the top-left of the 240x160 view).
 * Like the GBA games, the camera never stops at a map edge: the player stays
 * centred (tile at screen x 112, y 72) and whatever lies beyond the map is
 * filled with connected maps or the map's border tiles by the renderer.
 */
export function computeCamera({ px, py }) {
	return { x: Math.round(px + TILE / 2 - VIEW_W / 2), y: Math.round(py + TILE / 2 - VIEW_H / 2) };
}
