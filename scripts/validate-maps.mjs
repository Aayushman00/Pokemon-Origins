#!/usr/bin/env node
// npm run validate:maps  checks every map and that the server index is current.
// npm run maps:index     validates, then rewrites the server index.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serverIndex, validateMaps } from "../frontend/src/v2/overworld/maps/pipeline.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAPS_DIR = join(ROOT, "frontend/public/maps");
const INDEX_FILE = join(ROOT, "backend/data/world/maps.index.json");

const raw = {};
for (const file of readdirSync(MAPS_DIR).filter((f) => f.endsWith(".json"))) {
	raw[file.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(MAPS_DIR, file), "utf8"));
}

const names = JSON.parse(readFileSync(join(ROOT, "backend/data/world/names.json"), "utf8"));
const errors = validateMaps(raw, { imageExists: (image) => existsSync(join(MAPS_DIR, image)), names });
if (errors.length) {
	for (const e of errors) console.error(`  ${e}`);
	console.error(`validate:maps failed: ${errors.length} problem(s) in ${Object.keys(raw).length} maps`);
	process.exit(1);
}

const index = `${JSON.stringify(serverIndex(raw), null, "\t")}\n`;
if (process.argv.includes("--write")) {
	mkdirSync(dirname(INDEX_FILE), { recursive: true });
	writeFileSync(INDEX_FILE, index);
	console.log(`wrote ${INDEX_FILE}`);
} else if (!existsSync(INDEX_FILE) || readFileSync(INDEX_FILE, "utf8").replace(/\r\n/g, "\n") !== index) {
	console.error("validate:maps failed: backend/data/world/maps.index.json is stale, run npm run maps:index");
	process.exit(1);
}
console.log(`validate:maps ok: ${Object.keys(raw).length} maps`);
