// server.js
const { PORT, CORS_ORIGIN } = require("./src/config/env");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
const pinoHttp = require("pino-http");
const crypto = require("crypto");

const registerRoutes = require("./src/register");
const loginRoutes = require("./src/login");
const validateRoutes = require("./src/validate");
const pokemonRoutes = require("./src/Pokedex");
const pokemonDetailRoutes = require("./src/PokemonDetailRoutes");
const gamestarter = require("./src/games");
const trainerRouter = require("./src/trainer");
const battleRoutes = require("./src/routes/battle");
const campaignRoutes = require("./src/routes/campaign");
const rewardRoutes = require("./src/routes/rewards");
const inventoryRoutes = require("./src/routes/inventory");
const martRoutes = require("./src/routes/mart");
const evolutionRoutes = require("./src/routes/evolutions");
const moveRoutes = require("./src/routes/moves");
const attachPlayground = require("./src/playground");
const trainerPool = require("./src/config/trainerdb");

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN,
		credentials: true,
	})
);
app.use(bodyParser.json({ limit: "1mb" }));
app.use(
	pinoHttp({
		genReqId: (req) =>
			req.headers["x-request-id"] || crypto.randomUUID(),
		customProps: (req) => ({ requestId: req.id }),
		serializers: {
			req: (req) => ({
				id: req.id,
				method: req.method,
				url: req.url,
			}),
		},
	})
);

app.use((req, res, next) => {
	res.setHeader("X-Request-Id", req.id);
	next();
});

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		error: "Too many requests. Please try again later.",
	},
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		error: "Too many auth attempts. Please try again later.",
	},
});

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api", apiLimiter);
app.use("/pokemon", apiLimiter);
app.use("/pokemon-detail", apiLimiter);
app.use("/trainer", apiLimiter);

app.use("/api", registerRoutes);
app.use("/api", loginRoutes);
app.use("/api", validateRoutes);
app.use("/api", gamestarter);
app.use("/api/battle", battleRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/mart", martRoutes);
app.use("/api/evolutions", evolutionRoutes);
app.use("/api/moves", moveRoutes);

app.use("/pokemon", pokemonRoutes);
app.use("/pokemon-detail", pokemonDetailRoutes);

app.use("/trainer", trainerRouter);
app.get("/", (req, res) => {
	res.send("Pokémon API is running.");
});

// Single HTTP server: REST + Socket.IO on PORT
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

attachPlayground(io, trainerPool);

server.listen(PORT, () => {
	console.log(`API + Socket.IO running on http://localhost:${PORT}`);
});
