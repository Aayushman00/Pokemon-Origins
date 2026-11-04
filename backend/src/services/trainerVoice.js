/**
 * What a trainer says during a battle. addVoice reads a round's events and
 * slips `trainer_line` events in at the moment each line belongs, once per
 * battle. Lines live in data/trainers/voices.json; a missing line is silence.
 */
const VOICES = require("../../data/trainers/voices.json");

const LOW_HP = 0.25;

const fill = (text, playerName) => text.replaceAll("{player_name}", playerName || "Trainer");

function introLine(voiceId, playerName) {
	const text = VOICES[voiceId]?.intro;
	return text ? fill(text, playerName) : null;
}

/** True when this trainer's lines use the player's name, so it must be looked up. */
function usesPlayerName(voiceId) {
	return JSON.stringify(VOICES[voiceId] || {}).includes("{player_name}");
}

function overworldLines(voiceId) {
	const { greet, badge, after } = VOICES[voiceId] || {};
	return { greet, badge, after };
}

/** `events` with the trainer's lines added. Remembers what was said on session.voiced. */
function addVoice(session, events) {
	const lines = VOICES[session.voiceId];
	if (!lines) return events;
	session.voiced = session.voiced || [];
	const out = [];
	const say = (name) => {
		if (session.voiced.includes(name) || !lines[name]) return;
		session.voiced.push(name);
		const text = fill(lines[name], session.playerName);
		session.log.push(`${session.trainerName}: ${text}`);
		out.push({ actor: "enemy", type: "trainer_line", event: name, text });
	};

	for (const event of events) {
		if (event.type === "enemy_send") {
			say("first_faint");
			if (event.remaining === 1) say("ace");
		}
		out.push(event);
		if (event.type === "move" && event.actor === "player" && event.result === "hit") {
			if (event.type_multiplier > 1) say("super_effective");
			if (!event.targetFainted && event.targetHpAfter > 0 && event.targetHpAfter < session.enemy.max_hp * LOW_HP) say("low_hp");
		}
	}
	if (session.status === "won") say("lose");
	if (session.status === "lost") say("win");
	return out;
}

module.exports = { addVoice, introLine, overworldLines, usesPlayerName };
