const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { validateBody, inventoryUseSchema } = require("../middleware/validate");
const inventoryService = require("../services/inventoryService");

// GET /api/inventory — owned items (quantity > 0) with catalog data.
router.get("/", requireAuth, async (req, res) => {
	try {
		const items = await inventoryService.getInventory(req.user.trainer_id);
		return res.json({ success: true, items });
	} catch (err) {
		console.error("Inventory fetch error:", err.message);
		return res.status(err.status || 500).json({
			success: false,
			error: err.message || "Failed to load inventory",
		});
	}
});

// POST /api/inventory/use — overworld use only (no sessionId). In-battle
// item use goes through POST /api/battle/action with { type: "item" }.
// Body: { itemId, partyPosition? }
router.post(
	"/use",
	requireAuth,
	validateBody(inventoryUseSchema),
	async (req, res) => {
		try {
			const result = await inventoryService.useItemOverworld(
				req.user.trainer_id,
				req.validated
			);
			return res.json({ success: true, ...result });
		} catch (err) {
			const status = err.status || 500;
			if (status >= 500) {
				console.error("Inventory use error:", err);
			}
			return res.status(status).json({
				success: false,
				error: err.message || "Failed to use item",
				...(err.code ? { code: err.code } : {}),
			});
		}
	}
);

module.exports = router;
