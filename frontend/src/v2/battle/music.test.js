import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { parseVoice, TRACKS, trackFor } from "./music.js";

describe("music", () => {
	it("reads notes, sharps, flats, rests and hits with their lengths", () => {
		assert.deepEqual(parseVoice("A4:4 C#5 Bb3:1 r:3 x"), [
			{ at: 0, len: 4, midi: 69 },
			{ at: 4, len: 2, midi: 73 },
			{ at: 6, len: 1, midi: 58 },
			{ at: 10, len: 2, midi: "x" },
		]);
		assert.throws(() => parseVoice("H4"), /H4/);
	});

	it("every voice of a track loops on the same bar", () => {
		for (const [name, t] of Object.entries(TRACKS)) {
			const steps = t.voices.map((v) => v.steps);
			assert.equal(new Set(steps).size, 1, `${name} voices drift apart: ${steps}`);
			assert.equal(steps[0] % 16, 0, `${name} ends mid-bar`);
		}
	});

	it("gives every shipped map a track", () => {
		const ids = readdirSync(new URL("../../../public/maps", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
		for (const id of ids) assert.ok(TRACKS[trackFor(id)], id);
		assert.deepEqual(
			["dawnbrook", "dawnbrook_home", "route_4", "mossgate_gym", "saltmere_center", "league_3", "zenith_league", "crater_throne", "hidden_grove"].map(trackFor),
			["town", "town", "route", "gym", "center", "league", "league", "cave", "cave"]
		);
	});
});
