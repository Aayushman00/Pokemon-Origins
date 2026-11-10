// Fixed GBA geometry. Everything in the overworld is measured in these units.
export const TILE = 16;
export const VIEW_W = 240;
export const VIEW_H = 160;
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

// Frame timings at 60 Hz, derived from pret/pokefirered (re-implemented, not copied):
//  - walk: MOVE_SPEED_NORMAL = 16 steps of 1 px (src/event_object_movement.c, sSpeedNormalStepFuncs)
//  - run:  MOVE_SPEED_FAST_1 = 8 steps of 2 px (sSpeedFast1StepFuncs; PlayerRun in src/field_player_avatar.c)
//  - turn: PlayerTurnInPlace = WALK_IN_PLACE_FAST, 8 frames (InitMoveInPlace(..., 8))
//  - bump: PlayerNotOnBikeCollide = WALK_IN_PLACE_SLOW, 32 frames
//  - ledge: PlayerJumpLedge = JUMP_2 (JUMP_DISTANCE_FAR, JUMP_TYPE_HIGH): 32 frames, 1 px/frame over 2 tiles
export const WALK_TICKS = 16;
export const RUN_TICKS = 8;
export const TURN_TICKS = 8;
export const BUMP_TICKS = 32;
export const HOP_TICKS = 32; // two tiles
// Jump height per half-frame index (JUMP_TYPE_HIGH arc, GetJumpY(timer >> 1)); negative = up.
export const HOP_ARC = [-4, -6, -8, -10, -11, -12, -12, -12, -11, -10, -9, -8, -6, -4, 0, 0];

export const DIRS = {
	up: { dx: 0, dy: -1 },
	down: { dx: 0, dy: 1 },
	left: { dx: -1, dy: 0 },
	right: { dx: 1, dy: 0 },
};

// Values of the collision layer after parsing (0 = free).
export const COL = { FREE: 0, SOLID: 1, LEDGE_DOWN: 2, LEDGE_LEFT: 3, LEDGE_RIGHT: 4, LEDGE_UP: 5 };
export const LEDGE_DIR = { 2: "down", 3: "left", 4: "right", 5: "up" };
