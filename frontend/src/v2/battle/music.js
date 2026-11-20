/**
 * Per-map background music, synthesized with WebAudio like sfx.js: no audio files to
 * ship or license. Each track is a few short voices looping on one shared 16th-note
 * clock, scheduled a little ahead so timer jitter never reaches the ear. Follows the
 * same sound on/off setting as the effects.
 */
import { audio, isSoundOn, noiseBuffer } from "./sfx.js";

const PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * "A4:4 C#5 Bb3:1 r:3 x" -> [{ at, len, midi }] in 16th-note steps. Length defaults to 2
 * (an eighth), "r" rests, "x" is a noise hit, "|" marks bars for the reader only.
 */
export function parseVoice(src) {
	const notes = [];
	let at = 0;
	for (const tok of src.split(/\s+/).filter((t) => t && t !== "|")) {
		const [name, n = "2"] = tok.split(":");
		const len = Number(n);
		const m = /^([A-G])([#b]?)(\d)$/.exec(name);
		if (!m && name !== "r" && name !== "x") throw new Error(`bad note "${tok}"`);
		if (name !== "r") notes.push({ at, len, midi: m ? 12 * (Number(m[3]) + 1) + PITCH[m[1]] + (m[2] === "#") - (m[2] === "b") : "x" });
		at += len;
	}
	return notes;
}

function voice(wave, vol, src) {
	const notes = parseVoice(src);
	const steps = src.split(/\s+/).filter((t) => t && t !== "|").reduce((s, t) => s + Number(t.split(":")[1] ?? 2), 0);
	const starts = [];
	for (const n of notes) starts[n.at] = n;
	return { wave, vol, notes, steps, starts };
}

const SQ = 0.03; // squares are loud; triangles and noise sit lower in the ear
const TRI = 0.07;
const HIT = 0.03;

export const TRACKS = {
	town: {
		bpm: 100,
		voices: [
			voice("square", SQ, "E5 G5 C6:4 B5 A5 G5:4 | A5 F5 A5 C6 B5:4 G5:4 | E5 G5 C6:4 D6 C6 B5 A5 | G5 E5 F5 D5 C5:8"),
			voice("triangle", TRI, "C3:4 G3:4 C3:4 G3:4 | F3:4 C4:4 G3:4 D3:4 | C3:4 G3:4 E3:4 A3:4 | F3:4 G3:4 C3:8"),
		],
	},
	route: {
		bpm: 138,
		voices: [
			voice("square", SQ, "D5 G5 B5 G5 A5:3 G5:1 F#5 D5 | E5 G5 C6 B5 A5:4 r:4 | D5 G5 B5 D6 C6 B5 A5 G5 | F#5 A5 G5:4 D5 B4 G4:4"),
			voice("triangle", TRI, "G2 D3 G3 D3 G2 D3 G3 D3 | C3 G3 C4 G3 D3 A3 D4 A3 | G2 D3 G3 D3 E3 B3 E3 B3 | C3 D3 G2:4 D3:4 G2:4"),
			voice("noise", HIT, "r x ".repeat(16)),
		],
	},
	gym: {
		bpm: 150,
		voices: [
			voice("square", SQ, "A4 C5 E5 A5 G5 E5 C5 E5 | F5 E5 D5 C5 B4:4 E5:4 | A4 C5 E5 A5 B5 C6 B5 A5 | G#5:4 E5:4 A5:8"),
			voice("triangle", TRI, `${"A2 A3 ".repeat(4)} F2 F3 F2 F3 E2 E3 E2 E3 ${"A2 A3 ".repeat(4)} E2 E3 E2 E3 A2 A3 A2 A3`),
			voice("noise", HIT, "x:4 ".repeat(16)),
		],
	},
	league: {
		bpm: 112,
		voices: [
			voice("square", SQ, "D5:4 F5:4 A5:6 G5 | F5:4 E5 D5 E5:8 | D5:4 F5:4 A5:4 D6:4 | C#6:4 A5:4 D6:8"),
			voice("triangle", TRI, "D3:8 A2:8 | Bb2:8 A2:8 | D3:8 F3:8 | A2:8 D3:8"),
			voice("noise", HIT, "x:4 r:4 x x r:4 ".repeat(4)),
		],
	},
	center: {
		bpm: 92,
		voices: [
			voice("triangle", TRI, "A5:4 C6:4 F5:4 A5:4 | G5:4 Bb5:4 E5:4 G5:4 | A5:4 C6:4 D6 C6 A5:4 | G5:4 E5:4 F5:8"),
			voice("triangle", TRI * 0.8, "F3:8 A3:8 | C3:8 E3:8 | F3:8 D3:8 | C3:8 F3:8"),
		],
	},
	cave: {
		bpm: 72,
		voices: [
			voice("triangle", TRI, "E5:6 r:2 G5:4 F#5:4 | E5:8 r:8 | B4:6 r:2 C5:4 B4:4 | A4:8 r:8"),
			voice("triangle", TRI * 0.8, "E2:16 | E2:16 | C3:16 | B2:16"),
		],
	},
	battle: {
		bpm: 168,
		voices: [
			voice("square", SQ, "A4 B4 C5 E5 D5 C5 B4 G4 | A4 B4 C5 D5 E5:4 r:4 | F5 E5 D5 C5 D5 C5 B4 A4 | G#4 B4 E5:4 G#5:4 r:4"),
			voice("triangle", TRI, "A2 A2 A3 A2 A2 A2 A3 A2 | A2 A2 A3 A2 A2 A2 A3 A2 | F2 F2 F3 F2 G2 G2 G3 G2 | E2 E2 E3 E2 E2 E2 E3 E2"),
			voice("noise", HIT, "x x r x ".repeat(8)),
		],
	},
};

// Where the legendaries wait (scripts/overworld_art/lairs.py), plus the dev showcase grove.
const LAIRS = new Set(["hidden_grove", "frostveil_cavern", "stormcrown_pylon", "crater_throne", "hollow_lab", "legend_grove"]);

/** Which track a map plays, from its id: rooms share their town's tune unless they have their own. */
export function trackFor(mapId) {
	if (/_gym$/.test(mapId)) return "gym";
	if (/^league_|_league$/.test(mapId)) return "league";
	if (/_center$/.test(mapId)) return "center";
	if (LAIRS.has(mapId)) return "cave";
	if (/^route_/.test(mapId)) return "route";
	return "town";
}

const LOOKAHEAD = 0.3; // seconds scheduled ahead of the clock
let cur = null; // { name, track, bus, step, at, timer }

function note(ac, bus, v, n, t, step) {
	const len = n.midi === "x" ? 0.05 : n.len * step * 0.9;
	const g = ac.createGain();
	g.gain.setValueAtTime(v.vol, t);
	g.gain.exponentialRampToValueAtTime(0.001, t + len);
	g.connect(bus);
	let src;
	if (n.midi === "x") {
		src = ac.createBufferSource();
		src.buffer = noiseBuffer(ac);
	} else {
		src = ac.createOscillator();
		src.type = v.wave;
		src.frequency.setValueAtTime(440 * 2 ** ((n.midi - 69) / 12), t);
	}
	src.connect(g);
	src.start(t);
	src.stop(t + len + 0.02);
}

function pump() {
	try {
		const ac = audio();
		if (!ac || !cur) return;
		const step = 15 / cur.track.bpm; // one 16th note in seconds
		if (cur.at < ac.currentTime) cur.at = ac.currentTime + 0.05; // stalled (hidden tab, locked audio): pick up from now
		const on = isSoundOn();
		while (cur.at < ac.currentTime + LOOKAHEAD) {
			if (on) {
				for (const v of cur.track.voices) {
					const n = v.starts[cur.step % v.steps];
					if (n) note(ac, cur.bus, v, n, cur.at, step);
				}
			}
			cur.step += 1;
			cur.at += step;
		}
	} catch {
		/* audio unavailable: silent */
	}
}

/** Starts `name` looping, fading out whatever played before. Same track again: keeps playing. */
export function playTrack(name) {
	if (cur?.name === name || !TRACKS[name]) return;
	stopMusic();
	try {
		const ac = audio();
		if (!ac) return;
		const bus = ac.createGain();
		bus.connect(ac.destination);
		cur = { name, track: TRACKS[name], bus, step: 0, at: 0, timer: setInterval(pump, 100) };
		pump();
	} catch {
		/* audio unavailable: silent */
	}
}

export function stopMusic() {
	if (!cur) return;
	const { bus, timer } = cur;
	cur = null;
	clearInterval(timer);
	try {
		const t = audio().currentTime;
		bus.gain.setValueAtTime(bus.gain.value, t);
		bus.gain.linearRampToValueAtTime(0, t + 0.3);
		setTimeout(() => bus.disconnect(), 400);
	} catch {
		/* audio unavailable: nothing to fade */
	}
}
