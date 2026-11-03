import { VIEW_H, VIEW_W } from "../constants.js";

/**
 * Largest integer *device-pixel* scale that fits the container. Working in
 * device pixels (css * dpr) keeps every game pixel an exact block of screen
 * pixels at any zoom or devicePixelRatio, so nothing shimmers.
 * Also returns the letterbox offset, floored to a whole *device* pixel: a canvas
 * placed at a fractional device-pixel position is resampled by the browser and
 * shimmers while scrolling, so we never centre with plain CSS flex.
 * -> { scale, backingW, backingH, cssW, cssH, left, top }  (left/top in css px)
 */
export function computeScale(containerCssW, containerCssH, dpr = 1) {
	const d = dpr > 0 ? dpr : 1;
	const fit = Math.min(Math.floor((containerCssW * d) / VIEW_W), Math.floor((containerCssH * d) / VIEW_H));
	const scale = Math.max(1, fit);
	const backingW = VIEW_W * scale;
	const backingH = VIEW_H * scale;
	const left = Math.max(0, Math.floor((containerCssW * d - backingW) / 2)) / d;
	const top = Math.max(0, Math.floor((containerCssH * d - backingH) / 2)) / d;
	return { scale, backingW, backingH, cssW: backingW / d, cssH: backingH / d, left, top };
}
