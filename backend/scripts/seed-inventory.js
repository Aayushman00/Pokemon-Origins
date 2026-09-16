/**
 * Seed inventory items for a trainer (dev utility).
 *
 * Usage:
 *   node scripts/seed-inventory.js <trainerId> [itemId:qty ...]
 *   npm run seed:inventory -- <trainerId> [itemId:qty ...]
 *
 * Without itemId:qty args it grants 3× Potion (1), 1× Super Potion (2) and
 * 1× Fire Stone (3). Item ids come from backend/data/items.json; grants go
 * through inventoryService.addItem so unknown items are rejected. There is
 * no public grant API — this script (and the Phase 8 mart) are the only
 * ways quantities go up.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const inventoryService = require("../src/services/inventoryService");

function parseArgs(argv) {
	const [trainerIdRaw, ...itemArgs] = argv;
	const trainerId = Number(trainerIdRaw);
	if (!Number.isInteger(trainerId) || trainerId <= 0) {
		throw new Error(
			"Usage: node scripts/seed-inventory.js <trainerId> [itemId:qty ...]"
		);
	}
	const specs = itemArgs.length ? itemArgs : ["1:3", "2:1", "3:1"];
	const grants = specs.map((spec) => {
		const [idRaw, qtyRaw = "1"] = spec.split(":");
		const itemId = Number(idRaw);
		const quantity = Number(qtyRaw);
		if (
			!Number.isInteger(itemId) ||
			itemId <= 0 ||
			!Number.isInteger(quantity) ||
			quantity <= 0
		) {
			throw new Error(`Invalid itemId:qty spec "${spec}"`);
		}
		return { itemId, quantity };
	});
	return { trainerId, grants };
}

async function main() {
	const { trainerId, grants } = parseArgs(process.argv.slice(2));

	for (const grant of grants) {
		const { name } = await inventoryService.addItem(
			trainerId,
			grant.itemId,
			grant.quantity
		);
		console.log(`Granted ${grant.quantity}x ${name} to trainer ${trainerId}`);
	}

	const items = await inventoryService.getInventory(trainerId);
	console.log(
		"Inventory now:",
		items.map((item) => `${item.name} x${item.quantity}`).join(", ") ||
			"(empty)"
	);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(`seed-inventory failed: ${err.message}`);
		process.exit(1);
	});
