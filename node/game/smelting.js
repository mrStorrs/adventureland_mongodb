"use strict";

const EXPECTED_TIERS = Object.freeze([
	[0, "copper", "Copper", 1, "copperore", "copperbar", 10, 8000, 200],
	[1, "iron", "Iron", 15, "ironore", "ironbar", 10, 12000, 1000],
	[2, "gold", "Gold", 30, "goldore", "goldbar", 10, 18000, 5000],
	[3, "mithril", "Mithril", 55, "mithrilore", "mithrilbar", 10, 28000, 20000],
	[4, "adamantite", "Adamantite", 70, "adamantiteore", "adamantitebar", 10, 40000, 80000],
	[5, "runite", "Runite", 85, "runiteore", "runitebar", 10, 60000, 320000],
]);

function fail(code, message, details = {}) {
	const error = new Error(message);
	error.code = code;
	Object.assign(error, details);
	return error;
}

function tierForBar(data, bar) {
	return typeof bar === "string" ? data.tiers.find((tier) => tier.bar === bar) || null : null;
}

function validateSmeltingData(data, catalogs = {}) {
	if (!data || typeof data !== "object" || data.version !== 1 || !Array.isArray(data.tiers) || data.tiers.length !== EXPECTED_TIERS.length) {
		throw fail("invalid_smelting_data", "Smelting data must have version 1 and six tiers");
	}
	for (let index = 0; index < EXPECTED_TIERS.length; index += 1) {
		const tier = data.tiers[index];
		const expected = EXPECTED_TIERS[index];
		const actual = tier && [tier.index, tier.id, tier.name, tier.level, tier.ore, tier.bar, tier.ore_quantity, tier.xp, tier.bar_g];
		if (JSON.stringify(actual) !== JSON.stringify(expected)) {
			throw fail("invalid_smelting_tier", `Invalid Smelting tier ${tier?.id || index}`, { tier: tier?.id || String(index) });
		}
		if (catalogs.items) {
			const ore = catalogs.items[tier.ore];
			const bar = catalogs.items[tier.bar];
			if (
				!ore ||
				!bar ||
				bar.type !== "material" ||
				bar.skin !== ore.skin ||
				bar.name !== `${tier.name} Bar` ||
				bar.s !== 9999 ||
				bar.g !== tier.bar_g ||
				bar.exclusive !== true ||
				bar.g !== ore.g * tier.ore_quantity
			) {
				throw fail("invalid_smelting_tier", `Invalid Smelting item contract for ${tier.id}`, { tier: tier.id });
			}
		}
		if (catalogs.craft && JSON.stringify(catalogs.craft[tier.bar]) !== JSON.stringify({ items: [[tier.ore_quantity, tier.ore]], cost: 0 })) {
			throw fail("invalid_smelting_tier", `Invalid Smelting recipe for ${tier.id}`, { tier: tier.id });
		}
	}
	return data;
}

function prepareSmeltingCraft(data, { output, level }) {
	const tier = tierForBar(data, output);
	if (!tier) return null;
	if (!Number.isInteger(level) || level < tier.level) {
		throw fail("smelting_level", `Smelting level ${tier.level} is required for ${tier.name} Bar`, {
			required_level: tier.level,
			bar: tier.bar,
		});
	}
	return tier;
}

module.exports = { prepareSmeltingCraft, tierForBar, validateSmeltingData };
