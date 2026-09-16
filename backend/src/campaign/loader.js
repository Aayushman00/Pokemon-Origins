const fs = require("fs");
const path = require("path");
const {
	levelSchema,
	trainerCatalogSchema,
	encounterCatalogSchema,
} = require("./schemas");
const { CampaignError } = require("./errors");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const TRAINER_FILES = [
	"regular.json",
	"gym_leaders.json",
	"elite_four.json",
	"champion.json",
];
const ENCOUNTER_FILE = path.join("encounters", "legendary.json");

let cache = null;

function readJson(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new CampaignError(500, `Campaign file missing: ${filePath}`);
	}
	let raw;
	try {
		raw = fs.readFileSync(filePath, "utf8");
	} catch (err) {
		throw new CampaignError(500, `Cannot read campaign file: ${filePath}`);
	}
	try {
		return JSON.parse(raw);
	} catch {
		throw new CampaignError(500, `Invalid JSON: ${filePath}`);
	}
}

function loadTrainerCatalogs(dataDir = DATA_DIR) {
	const catalog = {};
	for (const file of TRAINER_FILES) {
		const filePath = path.join(dataDir, "trainers", file);
		const parsed = readJson(filePath);
		const result = trainerCatalogSchema.safeParse(parsed);
		if (!result.success) {
			throw new CampaignError(
				500,
				`Invalid trainer catalog ${file}: ${result.error.issues
					.map((i) => i.message)
					.join("; ")}`
			);
		}
		for (const [id, trainer] of Object.entries(result.data)) {
			if (catalog[id]) {
				throw new CampaignError(
					500,
					`Duplicate trainer id "${id}" in ${file}`
				);
			}
			if (trainer.id !== id) {
				throw new CampaignError(
					500,
					`Trainer key "${id}" does not match id "${trainer.id}" in ${file}`
				);
			}
			catalog[id] = trainer;
		}
	}
	return catalog;
}

function loadEncounterCatalog(dataDir = DATA_DIR) {
	const filePath = path.join(dataDir, ENCOUNTER_FILE);
	const parsed = readJson(filePath);
	const result = encounterCatalogSchema.safeParse(parsed);
	if (!result.success) {
		throw new CampaignError(
			500,
			`Invalid encounter catalog: ${result.error.issues
				.map((i) => i.message)
				.join("; ")}`
		);
	}
	for (const [id, encounter] of Object.entries(result.data)) {
		if (encounter.id !== id) {
			throw new CampaignError(
				500,
				`Encounter key "${id}" does not match id "${encounter.id}"`
			);
		}
	}
	return result.data;
}

function loadLevelFile(levelNumber, dataDir = DATA_DIR) {
	const filePath = path.join(
		dataDir,
		"campaign",
		`level${levelNumber}.json`
	);
	if (!fs.existsSync(filePath)) {
		throw new CampaignError(
			404,
			`Campaign level ${levelNumber} is not configured`
		);
	}
	const parsed = readJson(filePath);
	const result = levelSchema.safeParse(parsed);
	if (!result.success) {
		throw new CampaignError(
			500,
			`Invalid level ${levelNumber} config: ${result.error.issues
				.map((i) => i.message)
				.join("; ")}`
		);
	}
	if (result.data.level !== Number(levelNumber)) {
		throw new CampaignError(
			500,
			`Level file level${levelNumber}.json has mismatched level field`
		);
	}
	const numbers = result.data.battles.map((b) => b.battleNumber);
	const sorted = [...numbers].sort((a, b) => a - b);
	if (numbers.join(",") !== sorted.join(",")) {
		throw new CampaignError(
			500,
			`Level ${levelNumber} battles must be in battleNumber order`
		);
	}
	return result.data;
}

function loadAll(dataDir = DATA_DIR) {
	if (cache && dataDir === DATA_DIR) return cache;
	const trainers = loadTrainerCatalogs(dataDir);
	const encounters = loadEncounterCatalog(dataDir);
	const loaded = { dataDir, trainers, encounters, levels: new Map() };
	if (dataDir === DATA_DIR) cache = loaded;
	return loaded;
}

function resetCache() {
	cache = null;
}

function getTrainer(trainerId, dataDir = DATA_DIR) {
	const { trainers } = loadAll(dataDir);
	const trainer = trainers[trainerId];
	if (!trainer) {
		throw new CampaignError(
			500,
			`Unknown trainerId "${trainerId}" — not in trainer catalogs`
		);
	}
	return trainer;
}

function getEncounter(encounterId, dataDir = DATA_DIR) {
	const { encounters } = loadAll(dataDir);
	const encounter = encounters[encounterId];
	if (!encounter) {
		throw new CampaignError(
			500,
			`Unknown encounterId "${encounterId}" — not in encounters/legendary.json`
		);
	}
	return encounter;
}

function loadLevel(levelNumber, dataDir = DATA_DIR) {
	const store = loadAll(dataDir);
	const key = Number(levelNumber);
	if (!store.levels.has(key)) {
		store.levels.set(key, loadLevelFile(key, dataDir));
	}
	const level = store.levels.get(key);
	for (const battle of level.battles) {
		if (battle.trainerId) getTrainer(battle.trainerId, dataDir);
		if (battle.encounterId) getEncounter(battle.encounterId, dataDir);
	}
	return level;
}

function countBattles(levelNumber, dataDir = DATA_DIR) {
	return loadLevel(levelNumber, dataDir).battles.length;
}

function listBattles(levelNumber, dataDir = DATA_DIR) {
	const level = loadLevel(levelNumber, dataDir);
	return level.battles.map((battle) => {
		if (battle.type === "legendary") {
			const encounter = getEncounter(battle.encounterId, dataDir);
			return {
				battleNumber: battle.battleNumber,
				type: battle.type,
				encounterId: battle.encounterId,
				encounter: { ...encounter },
			};
		}
		const trainer = getTrainer(battle.trainerId, dataDir);
		return {
			battleNumber: battle.battleNumber,
			type: battle.type,
			trainerId: battle.trainerId,
			trainer: {
				id: trainer.id,
				name: trainer.name,
				title: trainer.title,
				sprite: trainer.sprite,
				party: trainer.party,
			},
		};
	});
}

module.exports = {
	DATA_DIR,
	CampaignError,
	loadAll,
	loadLevel,
	listBattles,
	countBattles,
	getTrainer,
	getEncounter,
	resetCache,
};
