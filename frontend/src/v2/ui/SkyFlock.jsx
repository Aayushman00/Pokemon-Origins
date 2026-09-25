import React, { useState } from "react";
import { pixelRects } from "./PixelArt";

// 12x12 Pidgey in flight, facing right: wings-up and wings-down frames that CSS
// flips between. K outline, B body, b wing/tail, C belly, E eye, Y beak.
const PIDGEY_PAL = { K: "#3a2618", B: "#b07a45", b: "#7e5430", C: "#f1dfb0", E: "#1b1410", Y: "#e8a13a" };
export const PIDGEY_UP = [
	"..K.........",
	"..KbK.......",
	"...KbK......",
	"...KbBK.KKK.",
	"KK..KBBKBBBK",
	"KbK.KBBBBBEY",
	".KbKKCCCBBBK",
	"..KbCCCCCBK.",
	"...KKCCCBK..",
	".....KKKK...",
	"............",
	"............",
];
export const PIDGEY_DOWN = [
	"............",
	"............",
	"............",
	"........KKK.",
	"KK..KKKKBBBK",
	"KbK.KBBBBBEY",
	".KbKKCCCBBBK",
	"..KbCbbCCBK.",
	"...KKbbbBK..",
	".....KbbK...",
	"......KbK...",
	".......K....",
];

const PixelPidgey = ({ style }) => (
	<svg className="flock__bird" style={style} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
		<g className="flock__up">{pixelRects(PIDGEY_UP, PIDGEY_PAL, "u")}</g>
		<g className="flock__down">{pixelRects(PIDGEY_DOWN, PIDGEY_PAL, "d")}</g>
	</svg>
);

// Loose V behind a leader (px offsets back / up-down, bird size).
const V = [
	{ x: 0, y: 0, s: 36 },
	{ x: -34, y: -16, s: 30 },
	{ x: -34, y: 18, s: 32 },
	{ x: -66, y: -30, s: 26 },
	{ x: -64, y: 34, s: 28 },
];

const roll = () => ({ top: 6 + Math.random() * 30, count: 3 + Math.floor(Math.random() * 3) });

/**
 * A flock of Pidgey that crosses the sky every so often (timing lives in the
 * CSS `flock-cross` cycle). Each pass re-rolls its height (% of the parent)
 * and size while it's off-screen. Parent must be positioned + overflow-hidden.
 */
const SkyFlock = () => {
	const [pass, setPass] = useState(roll);
	return (
		<div
			className="flock"
			style={{ top: `${pass.top}%` }}
			aria-hidden="true"
			onAnimationIteration={(e) => {
				if (e.animationName === "flock-cross") setPass(roll());
			}}
		>
			{V.slice(0, pass.count).map((b, i) => (
				<PixelPidgey
					key={i}
					style={{ left: b.x, top: b.y, width: b.s, height: b.s, "--d": `${-i * 170}ms` }}
				/>
			))}
		</div>
	);
};

export default SkyFlock;
