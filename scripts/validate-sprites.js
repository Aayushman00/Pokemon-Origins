/**
 * Validate canonical Pokémon sprite files for dex 001–151.
 * Exits non-zero if required variants are missing.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "frontend", "public", "sprites", "pokemon");
const REQUIRED = ["front.png", "back.png", "icon.png"];
const OPTIONAL = ["front-b.png", "back-b.png", "front-female.png", "back-female.png"];
const ALLOWED = new Set([...REQUIRED, ...OPTIONAL, "shiny"]);

const args = new Set(process.argv.slice(2));
const frontOnly = args.has("--front-only");

function listMalformed(dexDir, files) {
	const bad = [];
	for (const name of files) {
		if (name === "shiny" && fs.statSync(path.join(dexDir, name)).isDirectory()) {
			continue;
		}
		if (!ALLOWED.has(name) && !name.endsWith(".png")) {
			bad.push(name);
		}
	}
	return bad;
}

if (!fs.existsSync(DIR)) {
	console.error("validate-sprites: missing directory", DIR);
	console.error("Run: npm run sprites:bootstrap   or   python scripts/slice-pokemon-sprites.py");
	process.exit(1);
}

const missing = [];
const malformed = [];
const seen = new Set();

for (let id = 1; id <= 151; id++) {
	const dex = String(id).padStart(3, "0");
	if (seen.has(dex)) {
		console.error("validate-sprites: duplicate dex mapping", dex);
		process.exit(1);
	}
	seen.add(dex);
	const dexDir = path.join(DIR, dex);
	if (!fs.existsSync(dexDir)) {
		missing.push(`${dex}/ (directory)`);
		continue;
	}
	const files = fs.readdirSync(dexDir);
	malformed.push(...listMalformed(dexDir, files).map((f) => `${dex}/${f}`));
	const need = frontOnly ? ["front.png"] : REQUIRED;
	for (const file of need) {
		if (!fs.existsSync(path.join(dexDir, file))) {
			missing.push(`${dex}/${file}`);
		}
	}
}

for (const variant of ["front", "back", "icon"]) {
	const fb = path.join(DIR, "_fallback", `${variant}.png`);
	if (!fs.existsSync(fb)) {
		missing.push(`_fallback/${variant}.png`);
	}
}

if (malformed.length) {
	console.error("validate-sprites: unexpected files:");
	malformed.slice(0, 20).forEach((m) => console.error("  ", m));
	if (malformed.length > 20) console.error(`  … +${malformed.length - 20} more`);
}

if (missing.length) {
	console.error(`validate-sprites: ${missing.length} missing required asset(s):`);
	missing.slice(0, 40).forEach((m) => console.error("  ", m));
	if (missing.length > 40) console.error(`  … +${missing.length - 40} more`);
	if (!frontOnly) {
		console.error(
			"If only local battle fronts exist, run with --front-only after npm run sprites:bootstrap.\n" +
				"Full front/back/icon requires assets/sprites/source/gen1-sheet.png + the slicer."
		);
	}
	process.exit(1);
}

console.log(
	frontOnly
		? "validate-sprites: 151 front sprites + fallbacks OK (--front-only)"
		: "validate-sprites: 151 × front/back/icon + fallbacks OK"
);
