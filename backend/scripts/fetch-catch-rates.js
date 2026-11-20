// One-off: writes backend/data/catch_rates.json ({ dexNumber: capture_rate }) for
// Gen 1 from PokeAPI. The server reads the committed file and never calls PokeAPI
// during a battle. Re-run only if the dex grows: node backend/scripts/fetch-catch-rates.js
const fs = require("fs");
const path = require("path");
const { createPokeApiClient } = require("../src/services/pokeApiClient");

const LAST_DEX = 151;
const OUT = path.join(__dirname, "..", "data", "catch_rates.json");

(async () => {
	const api = createPokeApiClient();
	const rates = {};
	for (let id = 1; id <= LAST_DEX; id++) {
		rates[id] = (await api.getSpecies(id)).capture_rate;
	}
	fs.writeFileSync(OUT, `${JSON.stringify(rates, null, "\t")}\n`);
	console.log(`Wrote ${Object.keys(rates).length} catch rates to ${OUT}`);
})().catch((err) => {
	console.error("Fetch failed:", err.message);
	process.exit(1);
});
