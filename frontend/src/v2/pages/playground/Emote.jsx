import React from "react";

const INK = {
	k: "#2a2238",
	w: "#ffffff",
	r: "#e04848",
	b: "#3c7cd8",
	p: "#9a5ad8",
	y: "#f4c840",
	c: "#6ab0e8",
	o: "#f08840",
	n: "#4a5aa8",
};

/** Ids must match the server's EMOTES set (backend/src/playground/index.js). Order = keys 1-8. */
export const EMOTES = [
	{ id: "heart", label: "Heart", grid: [".rr.rr.", "rwrrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."] },
	{ id: "exclaim", label: "Surprised", grid: ["rr", "rr", "rr", "rr", "..", "rr"] },
	{ id: "question", label: "Puzzled", grid: [".bbbb.", "bb..bb", "....bb", "...bb.", "..bb..", "......", "..bb.."] },
	{ id: "music", label: "Humming", grid: ["..ppppp", "..p...p", "..p...p", "..p...p", "ppp.ppp", "ppp.ppp"] },
	{ id: "happy", label: "Happy", grid: [".yyyyy.", "yyyyyyy", "yykykyy", "yyyyyyy", "ykyyyky", "yykkkyy", ".yyyyy."] },
	{ id: "sad", label: "Sad", grid: [".ccccc.", "ccccccc", "cckckcc", "ccccccc", "cckkkcc", "ckcccck", ".ccccc."] },
	{ id: "angry", label: "Cross", grid: [".ooooo.", "okoooko", "ookokoo", "ooooooo", "ookkkoo", "okoooko", ".ooooo."] },
	{ id: "sleep", label: "Sleepy", grid: ["nnnnn..", "...n...", "..n....", ".n..nnn", "nnnnnn.", "....nnn"] },
];

export const EMOTE_BY_ID = Object.fromEntries(EMOTES.map((e) => [e.id, e]));

/** A pixel icon: one SVG rect per filled cell, so it stays crisp at any scale. */
export const EmoteIcon = ({ id, px = 3 }) => {
	const e = EMOTE_BY_ID[id];
	if (!e) return null;
	const w = Math.max(...e.grid.map((r) => r.length));
	const h = e.grid.length;
	return (
		<svg className="emote-icon" width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
			{e.grid.flatMap((row, y) => [...row].map((ch, x) => (INK[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={INK[ch]} /> : null)))}
		</svg>
	);
};
