// login.js
const express = require("express");
const router = express.Router();
const { validateBody, loginSchema } = require("./middleware/validate");
const authService = require("./services/authService");

router.post("/login", validateBody(loginSchema), async (req, res) => {
	try {
		const { user, token } = await authService.login(req.validated);
		return res.json({ success: true, user, token });
	} catch (err) {
		if (err.status) {
			return res
				.status(err.status)
				.json({ success: false, error: err.message });
		}
		console.error("Error during login:", err);
		return res
			.status(500)
			.json({ success: false, error: "Server error during login." });
	}
});

module.exports = router;
