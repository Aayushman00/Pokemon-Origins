const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const flags = require("../config/flags");
const flagService = require("../services/flagService");
const { solveGym } = require("../gyms/gymPuzzles");
const worldService = require("../services/worldService");
const { validateBody, gymSolveSchema, worldPositionSchema, worldHealSchema, worldFlagSchema } = require("../middleware/validate");

// Whole router is dark unless the OVERWORLD flag is on.
router.use((req, res, next) => (flags.isEnabled("OVERWORLD") ? next() : res.status(404).json({ success: false, error: "Not found" })));

// GET /api/world/flags — the trainer's server-owned world flags (read-only for clients).
router.get("/flags", requireAuth, async (req, res) => {
	try {
		return res.json({ success: true, flags: await flagService.listFlags(req.user.trainer_id) });
	} catch (err) {
		console.error("World flags error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to load flags" });
	}
});

// POST /api/world/flags — a one-shot story beat the client played. Wins and solves stay server-only.
router.post("/flags", requireAuth, validateBody(worldFlagSchema), async (req, res) => {
	try {
		if (!worldService.storyFlag(req.validated.flag)) return res.status(403).json({ success: false, error: "Not a story flag" });
		await flagService.setFlag(req.user.trainer_id, req.validated.flag);
		return res.json({ success: true });
	} catch (err) {
		console.error("World flag error:", err.message);
		return res.status(err.status || 500).json({ success: false, error: err.status ? err.message : "Failed to save the flag" });
	}
});

// GET /api/world/state — where the trainer stands and where they last healed.
router.get("/state", requireAuth, async (req, res) => {
	try {
		return res.json({ success: true, ...(await worldService.getState(req.user.trainer_id)) });
	} catch (err) {
		console.error("World state error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to load the save" });
	}
});

// POST /api/world/position — save where the trainer stands.
router.post("/position", requireAuth, validateBody(worldPositionSchema), async (req, res) => {
	try {
		await worldService.savePosition(req.user.trainer_id, req.validated);
		return res.json({ success: true });
	} catch (err) {
		console.error("World position error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to save" });
	}
});

// POST /api/world/heal — the Center's full heal; the spot is where a whiteout returns to.
router.post("/heal", requireAuth, validateBody(worldHealSchema), async (req, res) => {
	try {
		await worldService.heal(req.user.trainer_id, req.validated);
		return res.json({ success: true });
	} catch (err) {
		console.error("World heal error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to heal" });
	}
});

// POST /api/world/gym/solve — replay a gym puzzle's moves and record the solve.
router.post("/gym/solve", requireAuth, validateBody(gymSolveSchema), async (req, res) => {
	try {
		await solveGym(flagService, req.user.trainer_id, req.validated.leaderId, req.validated.moves);
		return res.json({ success: true });
	} catch (err) {
		console.error("Gym solve error:", err.message);
		return res.status(err.status || 500).json({ success: false, error: err.status ? err.message : "Failed to record the solve" });
	}
});

module.exports = router;
