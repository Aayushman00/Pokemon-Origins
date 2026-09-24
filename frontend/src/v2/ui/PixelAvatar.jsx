import React, { useMemo } from "react";

// Original generated trainer emblem: a mirrored 7x7 pixel face-mask on a
// palette-locked background, seeded from the trainer's id/name so the same
// trainer always gets the same emblem in hub, chat, and hover cards.
const BG = ["#9fd3ec", "#a6d86f", "#f3c64b", "#e8b4a0", "#c7b8e6", "#8fd1c2"];
const INK = ["#243452", "#3f7f37", "#9e2f25", "#5e4c3f", "#2b211c", "#8a6236"];

function hash(value) {
	let h = 2166136261;
	for (const ch of String(value)) {
		h ^= ch.charCodeAt(0);
		h = Math.imul(h, 16777619) >>> 0;
	}
	return h;
}

function cells(seed) {
	let s = seed || 1;
	const next = () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return (s >>> 0) / 4294967296;
	};
	const out = [];
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < 4; x++) {
			// Denser middle rows read as a face/helmet silhouette.
			const bias = y > 0 && y < 6 ? 0.55 : 0.3;
			if (next() < bias) {
				out.push([x, y]);
				if (x !== 3) out.push([6 - x, y]);
			}
		}
	}
	return out;
}

const PixelAvatar = ({ seed, size = 40, guest = false, className = "", label }) => {
	const h = useMemo(() => hash(seed), [seed]);
	const pixels = useMemo(() => cells(h), [h]);
	const bg = guest ? "#e6d6ab" : BG[h % BG.length];
	const ink = guest ? "#8a7662" : INK[(h >>> 3) % INK.length];
	return (
		<span
			className={`avatar ${className}`}
			style={{ width: size, height: size }}
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
		>
			<svg viewBox="0 0 9 9">
				<rect width="9" height="9" fill={bg} />
				{pixels.map(([x, y]) => (
					<rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1" fill={ink} />
				))}
			</svg>
		</span>
	);
};

export default PixelAvatar;
