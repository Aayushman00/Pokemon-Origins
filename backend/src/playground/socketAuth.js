// backend/src/playground/socketAuth.js
/**
 * Socket.IO handshake middleware factory. Verifies the JWT the same way
 * backend/src/middleware/auth.js does for REST, then resolves the trainer's
 * display name via a lookup (the JWT payload only carries trainer_id — see
 * authService.js). verifyToken/findTrainerById are injected so this module
 * has no direct dependency on jsonwebtoken or the DB pool, matching the
 * DI pattern used by backend/src/services/*.
 */

function createSocketAuthMiddleware({ verifyToken, findTrainerById }) {
	return function socketAuthMiddleware(socket, next) {
		const token = socket.handshake?.auth?.token;
		if (!token) {
			return next(new Error("No token provided"));
		}

		let decoded;
		try {
			decoded = verifyToken(token);
		} catch {
			return next(new Error("Invalid token"));
		}

		if (!decoded || !decoded.trainer_id) {
			return next(new Error("Invalid token payload"));
		}

		let lookupPromise;
		try {
			lookupPromise = Promise.resolve(findTrainerById(decoded.trainer_id));
		} catch {
			return next(new Error("Trainer lookup failed"));
		}

		lookupPromise.then(
			(trainer) => {
				if (!trainer) {
					next(new Error("Trainer not found"));
					return;
				}
				socket.trainer = { trainerId: trainer.trainer_id, name: trainer.name };
				next();
			},
			() => next(new Error("Trainer lookup failed"))
		);
	};
}

module.exports = { createSocketAuthMiddleware };
