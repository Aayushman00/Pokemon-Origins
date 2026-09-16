/**
 * Copy existing local battle fronts into the canonical sprite tree.
 * Does not invent back/icon frames (those come from slicing gen1-sheet.png).
 *
 * Source: frontend/public/things/pokemonOpp/{id}.png
 * Dest:   frontend/public/sprites/pokemon/{ddd}/front.png
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "frontend", "public", "things", "pokemonOpp");
const DEST = path.join(ROOT, "frontend", "public", "sprites", "pokemon");
const FALLBACK = path.join(DEST, "_fallback");

function copyFile(from, to) {
	fs.mkdirSync(path.dirname(to), { recursive: true });
	fs.copyFileSync(from, to);
}

if (!fs.existsSync(SRC)) {
	console.error("sprites:bootstrap: missing", SRC);
	process.exit(1);
}

fs.mkdirSync(FALLBACK, { recursive: true });
const placeholder = path.join(SRC, "0.png");
if (!fs.existsSync(placeholder)) {
	console.error("sprites:bootstrap: missing placeholder", placeholder);
	process.exit(1);
}
for (const variant of ["front", "back", "icon"]) {
	copyFile(placeholder, path.join(FALLBACK, `${variant}.png`));
}

let copied = 0;
let missing = [];
for (let id = 1; id <= 151; id++) {
	const src = path.join(SRC, `${id}.png`);
	if (!fs.existsSync(src)) {
		missing.push(id);
		continue;
	}
	const dex = String(id).padStart(3, "0");
	copyFile(src, path.join(DEST, dex, "front.png"));
	copied += 1;
}

console.log(`sprites:bootstrap: copied ${copied} front sprites to ${DEST}`);
console.log("sprites:bootstrap: wrote _fallback/{front,back,icon}.png from 0.png");
if (missing.length) {
	console.error("sprites:bootstrap: missing source ids:", missing.join(", "));
	process.exit(1);
}
console.log(
	"Note: back.png and icon.png are not created. Add assets/sprites/source/gen1-sheet.png and run the slicer."
);
