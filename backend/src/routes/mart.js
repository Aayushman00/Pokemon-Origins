const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { validateBody, martPurchaseSchema } = require("../middleware/validate");
const martService = require("../services/martService");

// GET /api/mart — availability, coin balance, and stock (empty when locked).
router.get("/", requireAuth, async (req, res) => {
	try {
		const mart = await martService.getMart(req.user.trainer_id);
		return res.json({ success: true, ...mart });
	} catch (err) {
		console.error("Mart fetch error:", err.message);
		return res.status(err.status || 500).json({
			success: false,
			error: err.message || "Failed to load the mart",
		});
	}
});

// POST /api/mart/purchase — transactional coin debit + inventory credit.
// Body: { itemId, quantity? } (quantity 1–10, default 1)
router.post(
	"/purchase",
	requireAuth,
	validateBody(martPurchaseSchema),
	async (req, res) => {
		try {
			const result = await martService.purchase(
				req.user.trainer_id,
				req.validated
			);
			return res.json({ success: true, ...result });
		} catch (err) {
			const status = err.status || 500;
			if (status >= 500) {
				console.error("Mart purchase error:", err);
			}
			return res.status(status).json({
				success: false,
				error: err.message || "Purchase failed",
				...(err.code ? { code: err.code } : {}),
			});
		}
	}
);

module.exports = router;
