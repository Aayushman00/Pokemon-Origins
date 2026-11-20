const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getDefaultLadder } = require("../services/pvpLadderService");

// GET /api/pvp/leaderboard?board=rating|today — top 20 by Elo, or by rated wins today (UTC).
router.get("/leaderboard", requireAuth, async (req, res) => {
	try {
		const rows = await getDefaultLadder().leaderboard(String(req.query.board || "rating"));
		return res.json({ success: true, rows });
	} catch (err) {
		if (err.status) return res.status(err.status).json({ success: false, error: err.message });
		console.error("PvP leaderboard error:", err.message);
		return res.status(500).json({ success: false, error: "Failed to load the leaderboard" });
	}
});

module.exports = router;
