const { CampaignError } = require("./errors");

function getPokedexDb() {
	return require("../config/db");
}

function displayName(raw) {
	if (!raw) return "Pokémon";
	return String(raw)
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function statAtLevel(base, level, isHp) {
	const b = Number(base) || 1;
	const lv = Number(level) || 1;
	if (isHp) return Math.floor((2 * b * lv) / 100) + lv + 10;
	return Math.floor((2 * b * lv) / 100) + 5;
}

async function lookupSpecies(pokemonId) {
	const [rows] = await getPokedexDb().query(
		`SELECT pokemon_id, name, hp, attack, defense, special_attack, special_defense, speed
     FROM Pokemon WHERE pokemon_id = ?`,
		[pokemonId]
	);
	if (!rows.length) {
		throw new CampaignError(
			500,
			`Cannot hydrate campaign: unknown pokemonId ${pokemonId}`
		);
	}
	const species = rows[0];
	const [typeRows] = await getPokedexDb().query(
		`SELECT t.name AS type_name
     FROM Pokemon_Type pt
     JOIN Type t ON pt.type_id = t.type_id
     WHERE pt.pokemon_id = ?`,
		[pokemonId]
	);
	const [moveRows] = await getPokedexDb().query(
		`SELECT
        m.move_id,
        m.name AS move_name,
        m.power,
        m.accuracy,
        m.pp,
        t.name AS move_type,
        pm.level_learned
      FROM Pokemon_Move pm
      JOIN \`Move\` m ON pm.move_id = m.move_id
      LEFT JOIN Type t ON m.type_id = t.type_id
      WHERE pm.pokemon_id = ?
        AND (pm.level_learned IS NULL OR pm.level_learned <= ?)
      ORDER BY pm.level_learned ASC, m.move_id ASC`,
		[pokemonId, 100]
	);
	// First non-hidden ability (lowest ability_id — documented rule).
	const [abilityRows] = await getPokedexDb().query(
		`SELECT a.ability_id, a.name
     FROM Pokemon_Ability pa
     JOIN Ability a ON pa.ability_id = a.ability_id
     WHERE pa.pokemon_id = ? AND pa.is_hidden = 0
     ORDER BY a.ability_id ASC
     LIMIT 1`,
		[pokemonId]
	);
	return {
		pokemon_id: species.pokemon_id,
		name: species.name,
		hp: species.hp,
		attack: species.attack,
		defense: species.defense,
		special_attack: species.special_attack,
		special_defense: species.special_defense,
		speed: species.speed,
		types: typeRows.map((r) => r.type_name),
		ability: abilityRows.length
			? { id: abilityRows[0].ability_id, name: abilityRows[0].name }
			: null,
		learnset: moveRows,
	};
}

function pickMoves(learnset, level) {
	const available = (learnset || []).filter(
		(m) => m.level_learned == null || m.level_learned <= level
	);
	const lastFour = available.slice(-4);
	return lastFour.map((row) => ({
		move_id: row.move_id,
		name: row.move_name,
		power: row.power,
		accuracy:
			row.accuracy == null ? 1 : Number(row.accuracy) > 1
				? Number(row.accuracy) / 100
				: Number(row.accuracy),
		move_type: row.move_type || "Normal",
		status_effect: null,
		effect_chance: null,
		// Base PP from pokedex.Move (Phase 14): enemies battle at full PP;
		// reward claims persist it as the starting current_pp.
		pp: row.pp ?? null,
	}));
}

function hydrateFromSpecies(member, species) {
	const level = member.level;
	const maxHp = statAtLevel(species.hp, level, true);
	const moves = pickMoves(species.learnset, level);
	if (!moves.length) {
		throw new CampaignError(
			500,
			`Cannot hydrate campaign: no moves for pokemonId ${member.pokemonId} at level ${level}`
		);
	}
	return {
		pokemon_id: species.pokemon_id,
		nickname: displayName(species.name),
		level,
		max_hp: maxHp,
		current_hp: maxHp,
		attack: statAtLevel(species.attack, level, false),
		defense: statAtLevel(species.defense, level, false),
		speed: statAtLevel(species.speed, level, false),
		special_atk: statAtLevel(species.special_attack, level, false),
		special_def: statAtLevel(species.special_defense, level, false),
		status: "Healthy",
		types: species.types.length ? species.types : ["Normal"],
		ability: species.ability ?? null,
		moves,
	};
}

async function hydrateParty(party, lookup = lookupSpecies) {
	const hydrated = [];
	for (const member of party) {
		const species = await lookup(member.pokemonId);
		hydrated.push(hydrateFromSpecies(member, species));
	}
	return hydrated;
}

module.exports = {
	statAtLevel,
	displayName,
	pickMoves,
	hydrateFromSpecies,
	hydrateParty,
	lookupSpecies,
};
