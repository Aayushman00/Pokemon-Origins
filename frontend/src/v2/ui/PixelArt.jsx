import React from "react";

/** Rects for a string-map sprite: one char per pixel, "." is transparent. */
export const pixelRects = (map, pal, keyPrefix = "") =>
	map.flatMap((row, y) =>
		[...row].map((ch, x) =>
			ch === "." ? null : <rect key={`${keyPrefix}${x}-${y}`} x={x} y={y} width="1" height="1" fill={pal[ch]} />
		)
	);

/**
 * Crisp pixel-art SVG from a string map (same technique as PixelTrainer).
 * `children` draw on top in grid units (overlays like eyelids or sparkles).
 */
const PixelArt = ({ map, pal, className, children, ...rest }) => (
	<svg
		className={className}
		viewBox={`0 0 ${map[0].length} ${map.length}`}
		shapeRendering="crispEdges"
		aria-hidden="true"
		{...rest}
	>
		{pixelRects(map, pal)}
		{children}
	</svg>
);

export default PixelArt;
