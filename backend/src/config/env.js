/**
 * Shared backend configuration.
 * Fail fast on missing JWT_SECRET so tokens cannot be forged with a default.
 */
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === "your_jwt_secret") {
	console.error(
		"[config] JWT_SECRET is missing or insecure. Set a strong value in backend/.env"
	);
	process.exit(1);
}

module.exports = {
	JWT_SECRET,
	PORT: Number(process.env.PORT) || 5000,
	CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
	BATTLE_ENGINE_URL:
		process.env.BATTLE_ENGINE_URL || "http://localhost:8000",
};
