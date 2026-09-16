// register.js
const express = require("express");
const router = express.Router();
const { validateBody, registerSchema } = require("./middleware/validate");
const authService = require("./services/authService");

router.post("/register", validateBody(registerSchema), async (req, res) => {
	try {
		const { user, token } = await authService.register(req.validated);
		return res.status(201).json({ success: true, user, token });
	} catch (err) {
		if (err.status) {
			return res
				.status(err.status)
				.json({ success: false, error: err.message });
		}
		console.error("Error during registration:", err);
		return res.status(500).json({
			success: false,
			error: "Database error during registration.",
		});
	}
});

router.get("/register", async (req, res) => {
	try {
		const count = await authService.getTrainerCount();
		res.status(200).json({ success: true, count });
	} catch (err) {
		console.error("Error retrieving trainer count:", err);
		res.status(500).json({
			success: false,
			error: "Database error retrieving count.",
		});
	}
});

module.exports = router;
