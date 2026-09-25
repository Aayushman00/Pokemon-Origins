import React from "react";

// Original 12x16 overworld trainer tokens (front-facing). Slots:
// K outline, S skin, W white, H hair, T top, L bottom.
// Male: spiky short hair, jacket, trousers.
const MALE = [
	"...K.KK.K...",
	"..KHKHHKHK..",
	".KHHHHHHHHK.",
	".KHHHHHHHHK.",
	".KHSSSSSSHK.",
	"..KSKSSKSK..",
	"..KSSSSSSK..",
	"...KKSSKK...",
	"..KTTSSTTK..",
	".KTTTTTTTTK.",
	".KTKTTTTKTK.",
	".KSKTTTTKSK.",
	"..KKLLLLKK..",
	"...KLLLLK...",
	"...KLKKLK...",
	"..KKK..KKK..",
];

// Female: long hair framing the face down to the shoulders, flared skirt.
const FEMALE = [
	"....KKKK....",
	"...KHHHHK...",
	"..KHHHHHHK..",
	".KHHHHHHHHK.",
	".KHHSSSSHHK.",
	".KHSKSSKSHK.",
	".KHSSSSSSHK.",
	".KHHKSSKHHK.",
	".KHKTWWTKHK.",
	".KSKTTTTKSK.",
	".KSKTTTTKSK.",
	"..KKLLLLKK..",
	"..KLLLLLLK..",
	".KLLLLLLLLK.",
	"...KSKKSK...",
	"..KKK..KKK..",
];

const TRAINERS = {
	Male: { map: MALE, pal: { H: "#5a3a24", T: "#d5473a", L: "#3b5fa8" } },
	Female: { map: FEMALE, pal: { H: "#b4502c", T: "#3fa37a", L: "#5a3f6a" } },
	Other: { map: MALE, pal: { H: "#2b3a55", T: "#f3c64b", L: "#62b14f" } },
};

/** `tint` recolors the top (Playground uses the server-assigned colour). */
const PixelTrainer = ({ gender = "Male", tint, size = 48, className = "", title }) => {
	const { map, pal: slots } = TRAINERS[gender] || TRAINERS.Other;
	const pal = { K: "#2b211c", S: "#f2c79a", W: "#fbf6e6", ...slots, ...(tint ? { T: tint } : {}) };
	const rects = [];
	map.forEach((row, y) => {
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
