/**
 * The park's clock: the server's local time decides day or night, so the
 * whole room shares one sky (and one wild table, see campaign/park.js).
 */
const DAY_FROM = 6; // 06:00
const NIGHT_FROM = 18; // 18:00

const timeOfDay = (date) => {
	const h = date.getHours();
	return h >= DAY_FROM && h < NIGHT_FROM ? "day" : "night";
};

/** Polled once a minute by the room; `onFlip(time)` fires only when the sky changes. */
function createSkyWatch({ getTime, onFlip }) {
	let time = getTime();
	return {
		current: () => time,
		check() {
			const next = getTime();
			if (next === time) return;
			time = next;
			onFlip(next);
		},
	};
}

module.exports = { timeOfDay, createSkyWatch };
