const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const flags = require("../config/flags");
const flagService = require("../services/flagService");

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

module.exports = router;
