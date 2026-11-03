import { VIEW_H, VIEW_W } from "../constants.js";

function axis(playerCenter, mapPx, view, openLow, openHigh) {
	let cam = Math.round(playerCenter - view / 2);
	if (mapPx <= view && !openLow && !openHigh) return Math.floor((mapPx - view) / 2); // small map: centre it
	if (!openLow) cam = Math.max(cam, 0);
	if (!openHigh) cam = Math.min(cam, mapPx - view);
	return cam;
}

/**
 * Integer camera origin (map pixels at the top-left of the 240x160 view).
 * `open` marks sides with a connected neighbour, where the camera may scroll past the edge.
 */
export function computeCamera({ px, py, mapW, mapH, open = {} }) {
	return {
		x: axis(px + 8, mapW * 16, VIEW_W, open.west, open.east),
		y: axis(py + 8, mapH * 16, VIEW_H, open.north, open.south),
	};
}
