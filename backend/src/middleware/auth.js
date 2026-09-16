const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

/**
 * Require Authorization: Bearer <token> and attach decoded claims to req.user.
 */
function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	const token =
		authHeader && authHeader.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

	if (!token) {
		return res.status(401).json({ success: false, error: "No token provided" });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		if (!decoded.trainer_id) {
			return res
				.status(401)
				.json({ success: false, error: "Invalid token payload" });
		}
		req.user = decoded;
		return next();
	} catch {
		return res.status(401).json({ success: false, error: "Invalid token" });
	}
}

module.exports = { requireAuth };
