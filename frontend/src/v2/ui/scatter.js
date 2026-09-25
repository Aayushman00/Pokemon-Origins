/** N items scattered at random left/top % + a staggered animation delay/duration. */
export function scatter(count, { minTop = 0, maxTop = 100, dur = [2.5, 5] } = {}) {
	return Array.from({ length: count }, () => ({
		left: Math.random() * 100,
		top: minTop + Math.random() * (maxTop - minTop),
		delay: Math.random() * dur[1],
		dur: dur[0] + Math.random() * (dur[1] - dur[0]),
	}));
}
