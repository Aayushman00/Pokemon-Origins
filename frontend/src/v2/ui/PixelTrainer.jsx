import React from "react";

// Original 12x16 overworld trainer token (front-facing). One map, recolored
// per trainer so every screen draws people the same way.
const MAP = [
	"....KKKK....",
	"...KCCCCK...",
	"..KCCCCCCK..",
	".KKKKKKKKKK.",
	"..KSSSSSSK..",
	"..KSKSSKSK..",
	"..KSSSSSSK..",
	"...KKKKKK...",
	"..KBBWWBBK..",
	".KSKBBBBKSK.",
	".KSKBBBBKSK.",
	"..KKBBBBKK..",
	"...KPPPPK...",
	"...KPKKPK...",
	"...KPK.KPK..",
	"..KKK..KKK..",
];

const PALETTES = {
	Male: { C: "#d5473a", B: "#3b5fa8", P: "#3a3f55" },
	Female: { C: "#3fa37a", B: "#d9864a", P: "#5a3f6a" },
	Other: { C: "#f3c64b", B: "#62b14f", P: "#3a3f55" },
};

/** `tint` recolors the cap (Playground uses the server-assigned colour). */
const PixelTrainer = ({ gender = "Male", tint, size = 48, className = "", title }) => {
	const pal = { K: "#2b211c", S: "#f2c79a", W: "#fbf6e6", ...(PALETTES[gender] || PALETTES.Other), ...(tint ? { C: tint } : {}) };
	const rects = [];
	MAP.forEach((row, y) => {
		[...row].forEach((ch, x) => {
			if (ch !== ".") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={pal[ch]} />);
		});
	});
	return (
		<svg
			className={className}
			viewBox="0 0 12 16"
			width={(size * 12) / 16}
			height={size}
			shapeRendering="crispEdges"
			role={title ? "img" : undefined}
			aria-label={title}
			aria-hidden={title ? undefined : true}
		>
			{rects}
		</svg>
	);
};

export default PixelTrainer;
