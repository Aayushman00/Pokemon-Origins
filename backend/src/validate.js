// validate.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("./middleware/auth");
const authService = require("./services/authService");

router.get("/validate", requireAuth, async (req, res) => {
	try {
		const user = await authService.validateTrainer(req.user.trainer_id);
		return res.json({ success: true, user });
	} catch (error) {
		if (error.status) {
			return res
				.status(error.status)
				.json({ success: false, error: error.message });
		}
		console.error("Error during validation:", error);
		return res
			.status(500)
			.json({ success: false, error: "Server error during validation" });
	}
});

module.exports = router;
