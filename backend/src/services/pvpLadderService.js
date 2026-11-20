/**
 * PvP ladder: Elo ratings (services/elo.js) plus a "most wins today" board.
 * A pair's 4th+ game of a UTC day still counts W/L but moves no rating and
 * no daily-board win, so farming an alt earns nothing.
 */
const { START, rate, dayKey } = require("./elo");

const BOARDS = new Set(["rating", "today"]);

function createPvpLadderService({ store, now = () => Date.now() }) {
	async function recordResult({ aId, bId, winnerId, endedBy }) {
		const day = dayKey(now());
		return store.withTransaction(async (tx) => {
			const rows = await tx.getRatings([aId, bId]);
			const ratingOf = (id) => rows.find((r) => r.trainer_id === id)?.rating ?? START;
			const pairGames = await tx.pairCountToday(aId, bId, day);
			const score = winnerId === aId ? 1 : 0;
			const r = rate(ratingOf(aId), ratingOf(bId), score, pairGames);
			await tx.saveResult({ winnerId, loserId: winnerId === aId ? bId : aId, ratings: { [aId]: r.a, [bId]: r.b } });
			await tx.insertMatch({ a_id: aId, b_id: bId, winner_id: winnerId, day, rated: r.rated, delta: r.delta, ended_by: endedBy });
			return { a: { rating: r.a, delta: r.delta }, b: { rating: r.b, delta: 0 - r.delta } /* 0 - x, so an unrated game is 0 not -0 */, rated: r.rated };
		});
	}

	async function leaderboard(board, limit = 20) {
		if (!BOARDS.has(board)) throw Object.assign(new Error("Unknown board"), { status: 400 });
		const rows = board === "rating" ? await store.topRatings(limit) : await store.topWinsToday(dayKey(now()), limit);
		return rows.map((row, i) => ({ rank: i + 1, trainerId: row.trainer_id, name: row.name, rating: row.rating ?? null, wins: Number(row.wins) }));
	}

	return { recordResult, leaderboard };
}

/** In-process store for tests. Same contract as the MySQL one. */
function createMemoryLadderStore({ ratings = {}, names = {} } = {}) {
	const rows = new Map(Object.entries(ratings).map(([id, rating]) => [Number(id), { trainer_id: Number(id), rating, wins: 0, losses: 0 }]));
	const matches = [];
	const named = (row) => ({ ...row, name: names[row.trainer_id] ?? `Trainer ${row.trainer_id}` });
	const store = {
		withTransaction: (fn) => fn(store),
		async getRatings(ids) {
			return ids.filter((id) => rows.has(id)).map((id) => ({ ...rows.get(id) }));
		},
		async pairCountToday(aId, bId, day) {
			return matches.filter((m) => m.day === day && ((m.a_id === aId && m.b_id === bId) || (m.a_id === bId && m.b_id === aId))).length;
		},
		async saveResult({ winnerId, loserId, ratings: next }) {
			for (const [id, rating] of Object.entries(next)) {
				const key = Number(id);
				const row = rows.get(key) || { trainer_id: key, rating: START, wins: 0, losses: 0 };
				row.rating = rating;
				if (key === winnerId) row.wins += 1;
				if (key === loserId) row.losses += 1;
				rows.set(key, row);
			}
		},
		async insertMatch(match) {
			matches.push(match);
		},
		async topRatings(limit) {
			return [...rows.values()].filter((r) => r.wins + r.losses > 0).sort((a, b) => b.rating - a.rating).slice(0, limit).map(named);
		},
		async topWinsToday(day, limit) {
			const wins = new Map();
			for (const m of matches) if (m.day === day && m.rated && m.winner_id != null) wins.set(m.winner_id, (wins.get(m.winner_id) || 0) + 1);
			return [...wins].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([trainer_id, n]) => named({ trainer_id, wins: n }));
		},
	};
	return store;
}

/** `pool` is the promise pool from config/trainerdb. */
function createMysqlLadderStore(pool) {
	const queries = (conn) => ({
		async getRatings(ids) {
			const [rows] = await conn.query("SELECT trainer_id, rating, wins, losses FROM pvp_rating WHERE trainer_id IN (?) FOR UPDATE", [ids]);
			return rows;
		},
		async pairCountToday(aId, bId, day) {
			const [[row]] = await conn.query(
				"SELECT COUNT(*) AS n FROM pvp_match WHERE day = ? AND ((a_id = ? AND b_id = ?) OR (a_id = ? AND b_id = ?))",
				[day, aId, bId, bId, aId]
			);
			return Number(row.n);
		},
		async saveResult({ winnerId, loserId, ratings }) {
			for (const [id, rating] of Object.entries(ratings)) {
				const key = Number(id);
				await conn.query(
					`INSERT INTO pvp_rating (trainer_id, rating, wins, losses) VALUES (?, ?, ?, ?)
					 ON DUPLICATE KEY UPDATE rating = VALUES(rating), wins = wins + VALUES(wins), losses = losses + VALUES(losses)`,
					[key, rating, key === winnerId ? 1 : 0, key === loserId ? 1 : 0]
				);
			}
		},
		async insertMatch(m) {
			await conn.query(
				"INSERT INTO pvp_match (a_id, b_id, winner_id, day, rated, delta, ended_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
				[m.a_id, m.b_id, m.winner_id, m.day, m.rated ? 1 : 0, m.delta, m.ended_by]
			);
		},
	});
	return {
		async withTransaction(fn) {
			const conn = await pool.getConnection();
			try {
				await conn.beginTransaction();
				const out = await fn(queries(conn));
				await conn.commit();
				return out;
			} catch (err) {
				await conn.rollback();
				throw err;
			} finally {
				conn.release();
			}
		},
		async topRatings(limit) {
			const [rows] = await pool.query(
				`SELECT r.trainer_id, t.name, r.rating, r.wins FROM pvp_rating r JOIN trainers t ON t.trainer_id = r.trainer_id
				 WHERE r.wins + r.losses > 0 ORDER BY r.rating DESC, r.wins DESC LIMIT ?`,
				[limit]
			);
			return rows;
		},
		async topWinsToday(day, limit) {
			const [rows] = await pool.query(
				`SELECT m.winner_id AS trainer_id, t.name, COUNT(*) AS wins FROM pvp_match m JOIN trainers t ON t.trainer_id = m.winner_id
				 WHERE m.day = ? AND m.rated = 1 AND m.winner_id IS NOT NULL GROUP BY m.winner_id, t.name ORDER BY wins DESC LIMIT ?`,
				[day, limit]
			);
			return rows;
		},
	};
}

let defaultLadder = null;
/** Lazily bound to the trainer DB so requiring this file never opens a pool. */
function getDefaultLadder() {
	return (defaultLadder ||= createPvpLadderService({ store: createMysqlLadderStore(require("../config/trainerdb")) }));
}

module.exports = { createPvpLadderService, createMemoryLadderStore, createMysqlLadderStore, getDefaultLadder };
