import React from "react";
import { TRAINER_ART } from "./trainerArt.generated";

// The UI token is the overworld sprite itself (front-facing stand frame),
// generated from scripts/overworld_art so the canvas and the React UI never
// drift apart. Rows are palette-indexed; "." is transparent.
const BY_GENDER = { Male: "player", Female: "player_f" };

const mix = (hex, to, t) => {
	const a = parseInt(hex.slice(1), 16);
	const b = parseInt(to.slice(1), 16);
	const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
	return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

/** Recolour the top with `tint`, keeping the hue-shifted ramp (warm light, cool shade). */
function tinted(art, tint) {
	if (!tint || !/^#[0-9a-f]{6}$/i.test(tint)) return art.pal;
	const tone = { hi: mix(tint, "#fff4d0", 0.4), base: tint, shadow: mix(tint, "#20184a", 0.4) };
	const INDEX = "0123456789abcdefghijklmnopqrstuvwxyz";
	return art.pal.map((c, i) => (art.top[INDEX[i]] ? tone[art.top[INDEX[i]]] : c));
}

// Avatar crop: every cast sheet is 16 wide with the head in the top rows.
const HEAD_BOX = "1 0 14 14";

/** `tint` recolours the top (Playground uses the server-assigned colour); `sprite` picks any cast member; `head` crops to the face and fills its box. */
const PixelTrainer = ({ gender = "Male", sprite, tint, size = 48, className = "", title, head = false }) => {
	const art = TRAINER_ART[sprite] || TRAINER_ART[BY_GENDER[gender] || "npc"];
	const pal = tinted(art, tint);
	const w = art.rows[0].length;
	const h = art.rows.length;
	const rects = [];
	art.rows.forEach((row, y) => {
		for (let x = 0; x < row.length; x++) {
			const ch = row[x];
			if (ch !== ".") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={pal[parseInt(ch, 36)]} />);
		}
	});
	return (
		<svg
			className={className}
			viewBox={head ? HEAD_BOX : `0 0 ${w} ${h}`}
			width={head ? "100%" : (size * w) / h}
			height={head ? "100%" : size}
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
