/** Next cursor index for an arrow key in a list/grid. Pure (tested). */
export function moveCursor(from, key, count, columns = 1) {
	if (!count) return from;
	if (columns > 1 && (key === "ArrowLeft" || key === "ArrowRight")) {
		const row = Math.floor(from / columns);
		const col = ((from % columns) + (key === "ArrowRight" ? 1 : -1) + columns) % columns;
		const next = row * columns + col;
		return next < count ? next : from;
	}
	const step = key === "ArrowDown" || key === "ArrowRight" ? columns : key === "ArrowUp" || key === "ArrowLeft" ? -columns : 0;
	if (!step) return from;
	const next = from + step;
	if (columns > 1) return next >= 0 && next < count ? next : from;
	return (next + count) % count;
}
