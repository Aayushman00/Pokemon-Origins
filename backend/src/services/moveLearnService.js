/**
 * Move learning (classic FireRed 4-move flow).
 *
 * The learnset is `pokedex.Pokemon_Move` (level_learned per species) — the
 * same table the campaign hydrator reads. When a party mon levels up
 * (xpService win path), every learnset move with
 * `oldLevel < level_learned <= newLevel` becomes a candidate, in
 * `level_learned ASC, move_id ASC` order:
 *
 * - already known            -> skipped silently (never offered again)
 * - fewer than 4 moves known -> learned immediately (row appended to
 *   `trainer_pokemon_moves` with current_pp = Move.pp), `move_learned` event
 * - already 4 moves          -> a PENDING offer row is inserted into
 *   `trainer_pending_move_learns` (`move_learn_available` event). The mon's
 *   moves are NOT touched until the trainer resolves the offer via
 *   POST /api/moves/learn: learn+forgetMoveId (transactional swap that also
 *   archives the forgotten move into `forgotten_moves`) or skip.
 *
 * The UNIQUE (trainer_pokemon_id, move_id, learned_at_level) key makes offer
 * creation idempotent — a replayed win cannot duplicate offers. Offers
 * survive refresh (DB rows), mirroring the Phase 9 pending-evolution UX.
 * The client never authors move ids: learn applies the offer's own move,
 * and forgetMoveId must be one of the mon's current moves.
 *
 * Max 4 moves is enforced here (service), not by a DB constraint — same
 * documented pattern as the party cap in partyService.
 */

const MAX_MOVES = 4;

class MoveLearnError extends Error {
	constructor(status, message, code = null) {
		super(message);
		this.name = "MoveLearnError";
		this.status = status;
		if (code) this.code = code;
	}
}

/* ------------------------------------------------------------------ *
 * Learnset store (pokedex schema): level-up candidates + move metadata
 * ------------------------------------------------------------------ */

/**
 * In-memory learnset for tests.
 * `learnset`: [{ pokemon_id, move_id, level_learned }]
 * `moves`:    { [move_id]: { name, power, accuracy, pp, move_type } }
 */
function createMemoryLearnsetStore({ learnset = [], moves = {} } = {}) {
	const meta = (moveId) => ({
		move_id: Number(moveId),
		name: moves[moveId]?.name ?? `Move ${moveId}`,
		power: moves[moveId]?.power ?? null,
		accuracy: moves[moveId]?.accuracy ?? null,
		pp: moves[moveId]?.pp ?? null,
		move_type: moves[moveId]?.move_type ?? "Normal",
	});
	return {
		async getLevelUpMoves(pokemonId, fromLevel, toLevel) {
			return learnset
				.filter(
					(row) =>
						Number(row.pokemon_id) === Number(pokemonId) &&
						row.level_learned != null &&
						Number(row.level_learned) > Number(fromLevel) &&
						Number(row.level_learned) <= Number(toLevel)
				)
				.sort(
					(a, b) =>
						a.level_learned - b.level_learned || a.move_id - b.move_id
				)
				.map((row) => ({
					...meta(row.move_id),
					level_learned: Number(row.level_learned),
				}));
		},
		async getMoveMeta(moveIds) {
			const map = new Map();
			for (const id of moveIds) map.set(Number(id), meta(id));
			return map;
		},
	};
}

function createMysqlLearnsetStore(pool) {
	const META_SELECT = `
    SELECT m.move_id, m.name, m.power, m.accuracy, m.pp, t.name AS move_type
    FROM \`Move\` m
    LEFT JOIN Type t ON m.type_id = t.type_id`;
	return {
		async getLevelUpMoves(pokemonId, fromLevel, toLevel) {
			const [rows] = await pool.query(
				`SELECT pm.move_id, pm.level_learned,
                m.name, m.power, m.accuracy, m.pp, t.name AS move_type
         FROM Pokemon_Move pm
         JOIN \`Move\` m ON pm.move_id = m.move_id
         LEFT JOIN Type t ON m.type_id = t.type_id
         WHERE pm.pokemon_id = ?
           AND pm.level_learned IS NOT NULL
           AND pm.level_learned > ?
           AND pm.level_learned <= ?
         ORDER BY pm.level_learned ASC, pm.move_id ASC`,
				[pokemonId, fromLevel, toLevel]
			);
			return rows;
		},
		async getMoveMeta(moveIds) {
			const map = new Map();
			if (!moveIds.length) return map;
			const [rows] = await pool.query(
				`${META_SELECT} WHERE m.move_id IN (?)`,
				[moveIds]
			);
			for (const row of rows) map.set(Number(row.move_id), row);
			return map;
		},
	};
}

/* ------------------------------------------------------------------ *
 * Move store (trainer schema): current moves, pending offers, forget
 * ------------------------------------------------------------------ */

/**
 * In-memory trainer-side store for tests.
 * `movesByMon`: { [trainerPokemonId]: [{ move_id, current_pp }] }
 * Exposes `forgotten` (array) and `pendingRows` for assertions.
 */
function createMemoryMoveStore({ movesByMon = {} } = {}) {
	const moves = new Map(
		Object.entries(movesByMon).map(([monId, rows]) => [
			Number(monId),
			rows.map((row) => ({ ...row })),
		])
	);
	const pendingRows = [];
	const forgotten = [];
	let nextId = 1;

	const monMoves = (monId) => {
		if (!moves.has(Number(monId))) moves.set(Number(monId), []);
		return moves.get(Number(monId));
	};

	return {
		pendingRows,
		forgotten,
		async listMonMoves(trainerPokemonId) {
			return monMoves(trainerPokemonId).map((row) => ({ ...row }));
		},
		async addMove(trainerPokemonId, moveId, pp) {
			monMoves(trainerPokemonId).push({
				move_id: Number(moveId),
				current_pp: Number(pp) || 0,
			});
		},
		async insertPending({ trainerId, trainerPokemonId, moveId, learnedAtLevel }) {
			const duplicate = pendingRows.some(
				(row) =>
					row.trainer_pokemon_id === Number(trainerPokemonId) &&
					row.move_id === Number(moveId) &&
					row.learned_at_level === Number(learnedAtLevel)
			);
			if (duplicate) return null;
			const row = {
				id: nextId++,
				trainer_id: Number(trainerId),
				trainer_pokemon_id: Number(trainerPokemonId),
				move_id: Number(moveId),
				learned_at_level: Number(learnedAtLevel),
				status: "pending",
			};
			pendingRows.push(row);
			return { id: row.id };
		},
		async listPending(trainerId) {
			return pendingRows
				.filter(
					(row) =>
						row.trainer_id === Number(trainerId) &&
						row.status === "pending"
				)
				.sort(
					(a, b) => a.learned_at_level - b.learned_at_level || a.id - b.id
				)
				.map((row) => ({ ...row }));
		},
		async getPending(pendingId) {
			const row = pendingRows.find((r) => r.id === Number(pendingId));
			return row ? { ...row } : null;
		},
		async resolvePending(pendingId) {
			const row = pendingRows.find((r) => r.id === Number(pendingId));
			if (!row || row.status !== "pending") return false;
			row.status = "resolved";
			return true;
		},
		async applyLearn({ pendingId, trainerPokemonId, moveId, pp, forgetMoveId }) {
			const rows = monMoves(trainerPokemonId);
			if (forgetMoveId != null) {
				const idx = rows.findIndex(
					(row) => row.move_id === Number(forgetMoveId)
				);
				if (idx === -1) {
					throw new Error("Forget target not found on this Pokémon");
				}
				rows.splice(idx, 1);
				forgotten.push({
					trainer_pokemon_id: Number(trainerPokemonId),
					move_id: Number(forgetMoveId),
				});
			}
			rows.push({ move_id: Number(moveId), current_pp: Number(pp) || 0 });
			const pending = pendingRows.find((r) => r.id === Number(pendingId));
			if (pending) pending.status = "resolved";
		},
	};
}

function createMysqlMoveStore(pool) {
	return {
		async listMonMoves(trainerPokemonId) {
			const [rows] = await pool.query(
				`SELECT move_id, current_pp FROM trainer_pokemon_moves
         WHERE trainer_pokemon_id = ? ORDER BY id ASC`,
				[trainerPokemonId]
			);
			return rows;
		},
		async addMove(trainerPokemonId, moveId, pp) {
			await pool.query(
				`INSERT INTO trainer_pokemon_moves (trainer_pokemon_id, move_id, current_pp)
         VALUES (?, ?, ?)`,
				[trainerPokemonId, moveId, pp || 0]
			);
		},
		async insertPending({ trainerId, trainerPokemonId, moveId, learnedAtLevel }) {
			// INSERT IGNORE + UNIQUE key = idempotent offer creation.
			const [result] = await pool.query(
				`INSERT IGNORE INTO trainer_pending_move_learns
           (trainer_id, trainer_pokemon_id, move_id, learned_at_level)
         VALUES (?, ?, ?, ?)`,
				[trainerId, trainerPokemonId, moveId, learnedAtLevel]
			);
			return result.affectedRows > 0 ? { id: result.insertId } : null;
		},
		async listPending(trainerId) {
			const [rows] = await pool.query(
				`SELECT id, trainer_id, trainer_pokemon_id, move_id,
                learned_at_level, status
         FROM trainer_pending_move_learns
         WHERE trainer_id = ? AND status = 'pending'
         ORDER BY learned_at_level ASC, id ASC`,
				[trainerId]
			);
			return rows;
		},
		async getPending(pendingId) {
			const [rows] = await pool.query(
				`SELECT id, trainer_id, trainer_pokemon_id, move_id,
                learned_at_level, status
         FROM trainer_pending_move_learns WHERE id = ?`,
				[pendingId]
			);
			return rows[0] || null;
		},
		async resolvePending(pendingId) {
			const [result] = await pool.query(
				`UPDATE trainer_pending_move_learns
         SET status = 'resolved', resolved_at = NOW()
         WHERE id = ? AND status = 'pending'`,
				[pendingId]
			);
			return result.affectedRows > 0;
		},
		/**
		 * Transactional learn: (optionally) forget + archive, insert the new
		 * move, resolve the offer — all or nothing.
		 */
		async applyLearn({ pendingId, trainerPokemonId, moveId, pp, forgetMoveId }) {
			const connection = await pool.getConnection();
			try {
				await connection.beginTransaction();
				if (forgetMoveId != null) {
					const [deleted] = await connection.query(
						`DELETE FROM trainer_pokemon_moves
             WHERE trainer_pokemon_id = ? AND move_id = ?`,
						[trainerPokemonId, forgetMoveId]
					);
					if (!deleted.affectedRows) {
						throw new Error("Forget target not found on this Pokémon");
					}
					await connection.query(
						`INSERT INTO forgotten_moves (trainer_pokemon_id, move_id)
             VALUES (?, ?)`,
						[trainerPokemonId, forgetMoveId]
					);
				}
				await connection.query(
					`INSERT INTO trainer_pokemon_moves (trainer_pokemon_id, move_id, current_pp)
           VALUES (?, ?, ?)`,
					[trainerPokemonId, moveId, pp || 0]
				);
				const [resolved] = await connection.query(
					`UPDATE trainer_pending_move_learns
           SET status = 'resolved', resolved_at = NOW()
           WHERE id = ? AND status = 'pending'`,
					[pendingId]
				);
				if (!resolved.affectedRows) {
					// Raced with another resolve — leave the moves untouched.
					throw new Error("Offer already resolved");
				}
				await connection.commit();
			} catch (txError) {
				await connection.rollback();
				throw txError;
			} finally {
				connection.release();
			}
		},
	};
}

/* ------------------------------------------------------------------ *
 * Service
 * ------------------------------------------------------------------ */

function publicMove(meta, extra = {}) {
	return {
		move_id: Number(meta.move_id),
		name: meta.name,
		move_type: meta.move_type || "Normal",
		power: meta.power ?? null,
		accuracy: meta.accuracy ?? null,
		pp: meta.pp ?? null,
		...extra,
	};
}

function createMoveLearnService(deps = {}) {
	let learnsetStore = deps.learnsetStore || null;
	let moveStore = deps.moveStore || null;
	function getLearnsetStore() {
		if (!learnsetStore) {
			// Learnset rows live in the pokedex schema (lazy pool).
			learnsetStore = createMysqlLearnsetStore(require("../config/db"));
		}
		return learnsetStore;
	}
	function getMoveStore() {
		if (!moveStore) {
			moveStore = createMysqlMoveStore(require("../config/trainerdb"));
		}
		return moveStore;
	}
	const getParty = () => deps.party || require("./partyService");

	/**
	 * Level-up hook (battle win path). Auto-learns while slots are free and
	 * queues one pending offer per remaining candidate. Returns
	 * `{ learned, pending }` where each entry carries the move metadata plus
	 * `level_learned`; duplicates (already known / offer already queued)
	 * are omitted, so replays emit nothing new.
	 */
	async function processLevelUp({
		trainerId,
		trainerPokemonId,
		pokemonId,
		fromLevel,
		toLevel,
	}) {
		const result = { learned: [], pending: [] };
		if (trainerPokemonId == null || Number(toLevel) <= Number(fromLevel)) {
			return result;
		}
		const candidates = await getLearnsetStore().getLevelUpMoves(
			pokemonId,
			fromLevel,
			toLevel
		);
		if (!candidates.length) return result;

		const currentRows = await getMoveStore().listMonMoves(trainerPokemonId);
		const known = new Set(currentRows.map((row) => Number(row.move_id)));

		for (const candidate of candidates) {
			const moveId = Number(candidate.move_id);
			if (known.has(moveId)) continue;
			if (known.size < MAX_MOVES) {
				await getMoveStore().addMove(
					trainerPokemonId,
					moveId,
					candidate.pp
				);
				known.add(moveId);
				result.learned.push(publicMove(candidate, {
					level_learned: Number(candidate.level_learned),
				}));
			} else {
				const inserted = await getMoveStore().insertPending({
					trainerId,
					trainerPokemonId,
					moveId,
					learnedAtLevel: candidate.level_learned,
				});
				if (inserted) {
					result.pending.push(publicMove(candidate, {
						level_learned: Number(candidate.level_learned),
					}));
				}
			}
		}
		return result;
	}

	/**
	 * Pending offers for the hub, enriched with the mon (party position,
	 * nickname, level) and full move metadata for the new move and the
	 * current moveset. Offers whose mon left the party are omitted.
	 */
	async function getPendingLearns(trainerId) {
		const rows = await getMoveStore().listPending(trainerId);
		if (!rows.length) return [];

		const partyRows = await getParty().getPartyRows(trainerId);
		const monById = new Map(partyRows.map((row) => [Number(row.id), row]));

		const entries = [];
		for (const row of rows) {
			const mon = monById.get(Number(row.trainer_pokemon_id));
			if (!mon) continue; // released via reward replacement
			const currentRows = await getMoveStore().listMonMoves(mon.id);
			const metaMap = await getLearnsetStore().getMoveMeta([
				Number(row.move_id),
				...currentRows.map((r) => Number(r.move_id)),
			]);
			const newMeta = metaMap.get(Number(row.move_id)) || {
				move_id: row.move_id,
			};
			entries.push({
				pendingId: Number(row.id),
				position: Number(mon.position),
				nickname: mon.nickname,
				pokemon_id: Number(mon.pokemon_id),
				level: Number(mon.level),
				learnedAtLevel: Number(row.learned_at_level),
				move: publicMove(newMeta),
				currentMoves: currentRows.map((r) => {
					const meta = metaMap.get(Number(r.move_id)) || {
						move_id: r.move_id,
					};
					return publicMove(meta, { current_pp: r.current_pp ?? null });
				}),
			});
		}
		return entries;
	}

	/**
	 * Resolves one offer.
	 * - skip: mark resolved, moves untouched.
	 * - learn: applies the OFFER's move (client cannot pick another). With 4
	 *   moves a valid forgetMoveId is required and the swap+archive+resolve
	 *   runs in one transaction; with a freed-up slot the move is appended.
	 */
	async function resolveLearn(trainerId, { pendingId, action, forgetMoveId }) {
		const row = await getMoveStore().getPending(pendingId);
		if (!row) {
			throw new MoveLearnError(404, "Move offer not found");
		}
		if (Number(row.trainer_id) !== Number(trainerId)) {
			throw new MoveLearnError(403, "Not your move offer");
		}
		if (row.status !== "pending") {
			throw new MoveLearnError(409, "Move offer already resolved");
		}

		if (action === "skip") {
			await getMoveStore().resolvePending(row.id);
			return { action: "skip", pendingId: Number(row.id) };
		}

		const partyRows = await getParty().getPartyRows(trainerId);
		const mon = partyRows.find(
			(r) => Number(r.id) === Number(row.trainer_pokemon_id)
		);
		if (!mon) {
			// Mon left the party (reward replacement) — offer is moot.
			await getMoveStore().resolvePending(row.id);
			throw new MoveLearnError(
				400,
				"That Pokémon is no longer in your party"
			);
		}

		const currentRows = await getMoveStore().listMonMoves(mon.id);
		if (currentRows.some((r) => Number(r.move_id) === Number(row.move_id))) {
			await getMoveStore().resolvePending(row.id);
			throw new MoveLearnError(
				400,
				`${mon.nickname} already knows that move`
			);
		}

		const metaMap = await getLearnsetStore().getMoveMeta([
			Number(row.move_id),
			...(forgetMoveId != null ? [Number(forgetMoveId)] : []),
		]);
		const newMeta = metaMap.get(Number(row.move_id)) || {
			move_id: row.move_id,
		};

		let forgot = null;
		if (currentRows.length >= MAX_MOVES) {
			if (forgetMoveId == null) {
				throw new MoveLearnError(
					400,
					`${mon.nickname} already knows ${MAX_MOVES} moves — choose one to forget or skip`,
					"FORGET_REQUIRED"
				);
			}
			if (
				!currentRows.some(
					(r) => Number(r.move_id) === Number(forgetMoveId)
				)
			) {
				throw new MoveLearnError(
					400,
					`${mon.nickname} doesn't know that move`
				);
			}
			await getMoveStore().applyLearn({
				pendingId: row.id,
				trainerPokemonId: mon.id,
				moveId: Number(row.move_id),
				pp: newMeta.pp,
				forgetMoveId: Number(forgetMoveId),
			});
			const forgotMeta = metaMap.get(Number(forgetMoveId)) || {
				move_id: forgetMoveId,
			};
			forgot = publicMove(forgotMeta);
		} else {
			// A slot freed up since the offer was created (e.g. another offer
			// forgot a move) — no forget needed.
			await getMoveStore().applyLearn({
				pendingId: row.id,
				trainerPokemonId: mon.id,
				moveId: Number(row.move_id),
				pp: newMeta.pp,
				forgetMoveId: null,
			});
		}

		const afterRows = await getMoveStore().listMonMoves(mon.id);
		const afterMeta = await getLearnsetStore().getMoveMeta(
			afterRows.map((r) => Number(r.move_id))
		);
		return {
			action: "learn",
			pendingId: Number(row.id),
			position: Number(mon.position),
			nickname: mon.nickname,
			learned: publicMove(newMeta),
			forgot,
			moves: afterRows.map((r) => {
				const meta = afterMeta.get(Number(r.move_id)) || {
					move_id: r.move_id,
				};
				return publicMove(meta, { current_pp: r.current_pp ?? null });
			}),
		};
	}

	return { processLevelUp, getPendingLearns, resolveLearn };
}

const defaultService = createMoveLearnService();

module.exports = {
	MAX_MOVES,
	MoveLearnError,
	createMoveLearnService,
	createMemoryLearnsetStore,
	createMemoryMoveStore,
	createMysqlLearnsetStore,
	createMysqlMoveStore,
	processLevelUp: defaultService.processLevelUp,
	getPendingLearns: defaultService.getPendingLearns,
	resolveLearn: defaultService.resolveLearn,
};
