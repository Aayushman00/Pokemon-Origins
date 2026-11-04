const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const flags = require("../config/flags");
const flagService = require("../services/flagService");
const { solveGym } = require("../gyms/gymPuzzles");
const { validateBody, gymSolveSchema } = require("../middleware/validate");

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
