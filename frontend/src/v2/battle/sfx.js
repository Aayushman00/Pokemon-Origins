/**
 * Chiptune sound effects synthesized with WebAudio: square/triangle blips
 * and a noise burst, so there are no audio files to ship or license. Muted
 * state is remembered per browser; off under prefers-reduced-motion until
 * the player turns it on.
 */
const KEY = "po.sound";
let ctx = null;
let noise = null;

function audio() {
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
	}
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}

export function isSoundOn() {
	try {
		const saved = localStorage.getItem(KEY);
		if (saved === "on" || saved === "off") return saved === "on";
	} catch {
		/* storage blocked */
	}
	return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function setSoundOn(on) {
	try {
		localStorage.setItem(KEY, on ? "on" : "off");
	} catch {
		/* won't persist */
	}
	if (on) play("select");
}

// Each note: [frequency Hz, start s, length s, wave]; "noise" = white noise.
const CUES = {
	select: [[880, 0, 0.05, "square"]],
	cursor: [[660, 0, 0.03, "square"]],
	sendOut: [[523, 0, 0.06, "square"], [784, 0.06, 0.08, "square"]],
	lunge: [[220, 0, 0.05, "triangle"]],
	shot: [[1200, 0, 0.08, "square"], [900, 0.04, 0.08, "square"]],
	hit: [["noise", 0, 0.12]],
	hitWeak: [["noise", 0, 0.06]],
	hitSuper: [["noise", 0, 0.16], [110, 0, 0.14, "square"]],
	crit: [["noise", 0, 0.18], [1320, 0.02, 0.06, "square"], [1320, 0.1, 0.06, "square"]],
	miss: [[330, 0, 0.06, "triangle"], [247, 0.06, 0.08, "triangle"]],
	faint: [[392, 0, 0.1, "square"], [330, 0.1, 0.1, "square"], [262, 0.2, 0.1, "square"], [196, 0.3, 0.2, "square"]],
	heal: [[523, 0, 0.06, "triangle"], [659, 0.06, 0.06, "triangle"], [784, 0.12, 0.1, "triangle"]],
	status: [[440, 0, 0.05, "square"], [415, 0.05, 0.05, "square"], [440, 0.1, 0.05, "square"]],
	statUp: [[523, 0, 0.05, "square"], [659, 0.05, 0.05, "square"], [784, 0.1, 0.07, "square"]],
	statDown: [[784, 0, 0.05, "square"], [659, 0.05, 0.05, "square"], [523, 0.1, 0.07, "square"]],
	exp: [[988, 0, 0.04, "square"], [1175, 0.05, 0.04, "square"]],
	levelUp: [[523, 0, 0.08, "square"], [659, 0.08, 0.08, "square"], [784, 0.16, 0.08, "square"], [1047, 0.24, 0.2, "square"]],
	victory: [[784, 0, 0.1, "square"], [784, 0.12, 0.1, "square"], [784, 0.24, 0.1, "square"], [1047, 0.36, 0.3, "square"]],
	defeat: [[392, 0, 0.18, "triangle"], [370, 0.2, 0.18, "triangle"], [349, 0.4, 0.3, "triangle"]],
};

function noiseBuffer(ac) {
	if (noise) return noise;
	noise = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
	const data = noise.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	return noise;
}

/** Plays a named cue if sound is on. Never throws: audio is optional. */
export function play(name) {
	const cue = CUES[name];
	if (!cue || !isSoundOn()) return;
	try {
		const ac = audio();
		if (!ac) return;
		const t0 = ac.currentTime;
		for (const [freq, start, len, wave] of cue) {
			const gain = ac.createGain();
			gain.gain.setValueAtTime(0.06, t0 + start);
			gain.gain.exponentialRampToValueAtTime(0.001, t0 + start + len);
			gain.connect(ac.destination);
			let src;
			if (freq === "noise") {
				src = ac.createBufferSource();
				src.buffer = noiseBuffer(ac);
			} else {
				src = ac.createOscillator();
				src.type = wave;
				src.frequency.setValueAtTime(freq, t0 + start);
			}
			src.connect(gain);
			src.start(t0 + start);
			src.stop(t0 + start + len + 0.02);
		}
	} catch {
		/* audio unavailable: silent */
	}
}

export const CUE_NAMES = Object.keys(CUES);
