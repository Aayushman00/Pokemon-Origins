const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
	validateBody,
	calculateDamageSchema,
	battleStartSchema,
	battleActionSchema,
} = require("../middleware/validate");
const battleService = require("../services/battleService");
const battleSessionService = require("../services/battleSessionService");

// POST /api/battle/start — create/resume the server-authoritative session
router.post(
	"/start",
	requireAuth,
	validateBody(battleStartSchema),
	async (req, res) => {
		try {
			const result = await battleSessionService.startBattle(
				req.user.trainer_id,
				req.validated
			);
			return res.json({ success: true, ...result });
		} catch (err) {
			const status = err.status || 500;
			console.error("Battle start error:", err.message);
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to start battle",
			});
		}
	}
);

// POST /api/battle/action — resolve one round server-side
router.post(
	"/action",
	requireAuth,
	validateBody(battleActionSchema),
	async (req, res) => {
		try {
			const result = await battleSessionService.performAction(
				req.user.trainer_id,
				req.validated
			);
			return res.json({ success: true, ...result });
		} catch (err) {
			const status = err.status || 500;
			console.error("Battle action error:", err.message);
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to resolve battle action",
			});
		}
	}
);

// GET /api/battle/level/1 (legacy shim; must stay above /:sessionId)
router.get("/level/1", requireAuth, async (req, res) => {
	try {
		const level = await battleService.getLevel1();
		return res.json({ success: true, level });
	} catch (err) {
		console.error("Battle level proxy error:", err.message);
		return res.status(err.status || 502).json({
			success: false,
			error: err.message || "Failed to load level",
		});
	}
});

// POST /api/battle/calculate-damage (engine proxy; UI no longer uses it)
router.post(
	"/calculate-damage",
	requireAuth,
	validateBody(calculateDamageSchema),
	async (req, res) => {
		try {
			const result = await battleService.calculateDamage(req.validated);
			return res.json({ success: true, ...result });
		} catch (err) {
			console.error("Battle damage proxy error:", err.message);
			return res.status(err.status || 502).json({
				success: false,
				error: err.message || "Failed to calculate damage",
			});
		}
	}
);

// GET /api/battle/:sessionId — authoritative state for resume/render
router.get("/:sessionId", requireAuth, (req, res) => {
	try {
		const result = battleSessionService.getSession(
			req.user.trainer_id,
			req.params.sessionId
		);
		return res.json({ success: true, ...result });
	} catch (err) {
		const status = err.status || 500;
		if (status >= 500) {
			console.error("Battle session fetch error:", err.message);
		}
		return res.status(status).json({
			success: false,
			error: err.message || "Failed to load battle session",
		});
	}
});

module.exports = router;
