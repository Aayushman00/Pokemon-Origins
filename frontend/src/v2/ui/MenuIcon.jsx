import React from "react";
import PixelArt from "./PixelArt";

// 8x8 one-colour glyphs for menu rows and item lists. They take the row's text
// colour, so they follow the theme and the disabled state for free.
const ICONS = {
	hub: ["...xx...", "..xxxx..", ".xxxxxx.", "xxxxxxxx", ".x....x.", ".x.xx.x.", ".x.xx.x.", ".xxxxxx."],
	party: ["..xxxx..", ".xxxxxx.", "xxxxxxxx", "xx.xx.xx", "x.x..x.x", "x..xx..x", ".x....x.", "..xxxx.."],
	bag: ["..xxxx..", "..x..x..", ".xxxxxx.", "xxxxxxxx", "xx.xx.xx", "xxxxxxxx", "xxxxxxxx", ".xxxxxx."],
	mart: ["..xxxx..", ".x....x.", "x..xx..x", "x.x....x", "x.x....x", "x..xx..x", ".x....x.", "..xxxx.."],
	dex: ["xxxxxxx.", "x.....xx", "x.xxx.xx", "x.....xx", "x.xxx.xx", "x.....xx", "xxxxxxxx", ".xxxxxxx"],
	play: [".xxxxxx.", "x......x", "x.x.x..x", "x......x", ".xxxxxx.", "..xx....", "..x.....", "........"],
	card: ["xxxxxxxx", "x......x", "x.xx...x", "x.xx.xxx", "x......x", "x.xxxx.x", "x......x", "xxxxxxxx"],
	save: ["xxxxxxx.", "x.xxx.xx", "x.xxx.xx", "x......x", "x.xxxx.x", "x.x..x.x", "x.x..x.x", "xxxxxxxx"],
	out: ["xxxxx...", "x...x.x.", "x...x..x", "x..xxxxx", "x...x..x", "x...x.x.", "xxxxx...", "........"],
	exit: ["x......x", ".x....x.", "..x..x..", "...xx...", "...xx...", "..x..x..", ".x....x.", "x......x"],
	// Item pockets, keyed by the server's item category.
	healing: ["...xx...", "..xxxx..", "...xx...", "..xxxx..", ".x....x.", ".x.xx.x.", ".x....x.", "..xxxx.."],
	pp_restore: ["...x....", "..xxx...", "..xxx...", ".xxxxx..", ".x.xxx..", ".xxxxx..", "..xxx...", "........"],
	evolution_stone: ["...xx...", "..x.xx..", ".x...xx.", "x..x..xx", "x.....xx", ".x...xx.", "..xxxx..", "........"],
};
const PAL = { x: "currentColor" };

/** `name`: a menu id or an item category. Unknown names draw nothing but keep the column. */
const MenuIcon = ({ name, className = "" }) =>
	ICONS[name] ? <PixelArt map={ICONS[name]} pal={PAL} className={`menu-icon menu-icon--${name} ${className}`} /> : <span className="menu-icon" aria-hidden="true" />;

export default MenuIcon;
