// Node-only helper for tests: serve /maps/*.json from frontend/public/maps.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MAPS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../../public/maps");
export const fetchFromDisk = async (url) => JSON.parse(readFileSync(join(MAPS_DIR, url.replace(/^\/maps\//, "")), "utf8"));
