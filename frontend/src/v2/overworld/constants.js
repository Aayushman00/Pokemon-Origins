// Fixed GBA geometry. Everything in the overworld is measured in these units.
export const TILE = 16;
export const VIEW_W = 240;
export const VIEW_H = 160;
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

// Ticks per action at 60 Hz. Walk = 1 px/tick (16 ticks per tile), run = 2 px/tick.
export const WALK_TICKS = 16;
export const RUN_TICKS = 8;
export const TURN_TICKS = 6;
export const BUMP_TICKS = 16;
export const HOP_TICKS = 32; // two tiles

export const DIRS = {
	up: { dx: 0, dy: -1 },
	down: { dx: 0, dy: 1 },
	left: { dx: -1, dy: 0 },
	right: { dx: 1, dy: 0 },
};
export const DIR_NAMES = Object.keys(DIRS);
export const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

// Values of the collision layer after parsing (0 = free).
export const COL = { FREE: 0, SOLID: 1, LEDGE_DOWN: 2, LEDGE_LEFT: 3, LEDGE_RIGHT: 4, LEDGE_UP: 5 };
export const LEDGE_DIR = { 2: "down", 3: "left", 4: "right", 5: "up" };
