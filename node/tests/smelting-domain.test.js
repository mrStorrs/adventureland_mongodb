"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { items } = require("../../design/items");
const { skills } = require("../../design/skills");
const { smelting } = require("../../design/smelting");
const { buildProgressionData } = require("../game/skill_domain");
const { prepareSmeltingCraft, validateSmeltingData } = require("../game/smelting");
const { loadBenchmarkData } = require("../tools/progression-benchmark");

const recipeContext = {};
vm.createContext(recipeContext);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../design/recipes.js"), "utf8"), recipeContext, {
	filename: "recipes.js",
});
const craft = JSON.parse(JSON.stringify(recipeContext.craft));

const expectedTiers = [
	[0, "copper", "Copper", 1, "copperore", "copperbar", 10, 8000, 200],
	[1, "iron", "Iron", 15, "ironore", "ironbar", 10, 12000, 1000],
	[2, "gold", "Gold", 30, "goldore", "goldbar", 10, 18000, 5000],
	[3, "mithril", "Mithril", 55, "mithrilore", "mithrilbar", 10, 28000, 20000],
	[4, "adamantite", "Adamantite", 70, "adamantiteore", "adamantitebar", 10, 40000, 80000],
	[5, "runite", "Runite", 85, "runiteore", "runitebar", 10, 60000, 320000],
];

function progressionInput(source, smeltingData) {
	return {
		items: source.items,
		skills: source.skills,
		skill_xp: source.skillXp,
		abilities: source.abilities,
		character: source.character,
		item_requirements: source.itemRequirements,
		mining: source.mining,
		smelting: smeltingData,
	};
}

test("[AC-1] canonical Smelting data defines six zero-cost ten-ore bar recipes", () => {
	assert.equal(validateSmeltingData(smelting, { items, craft }), smelting);
	assert.equal(smelting.version, 1);
	assert.deepEqual(
		smelting.tiers.map((tier) => [tier.index, tier.id, tier.name, tier.level, tier.ore, tier.bar, tier.ore_quantity, tier.xp, tier.bar_g]),
		expectedTiers,
	);
	assert.deepEqual(skills.smelting, { id: "smelting", name: "Smelting", kind: "noncombat", max_level: 99 });
	for (const [, id, name, level, ore, bar, oreQuantity, xp, barValue] of expectedTiers) {
		assert.deepEqual(craft[bar], { items: [[oreQuantity, ore]], cost: 0 }, id);
		assert.deepEqual(
			items[bar],
			{ type: "material", skin: items[ore].skin, name: `${name} Bar`, s: 9999, g: barValue, exclusive: true },
			id,
		);
		assert.equal(xp, smelting.tiers.find((tier) => tier.id === id).xp);
		assert.equal(level, smelting.tiers.find((tier) => tier.id === id).level);
	}
});

test("[AC-2] Smelting validation rejects altered tiers, catalog values, and recipe shapes", () => {
	const alteredTier = structuredClone(smelting);
	alteredTier.tiers[2].xp = 18001;
	assert.throws(() => validateSmeltingData(alteredTier), { code: "invalid_smelting_tier", tier: "gold" });
	const alteredOre = structuredClone(smelting);
	alteredOre.tiers[0].ore = "ironore";
	assert.throws(() => validateSmeltingData(alteredOre), { code: "invalid_smelting_tier", tier: "copper" });

	const alteredItems = structuredClone(items);
	alteredItems.runitebar.g = 319999;
	assert.throws(() => validateSmeltingData(smelting, { items: alteredItems, craft }), { code: "invalid_smelting_tier", tier: "runite" });

	const alteredCraft = structuredClone(craft);
	alteredCraft.ironbar = { items: [[9, "ironore"]], cost: 0 };
	assert.throws(() => validateSmeltingData(smelting, { items, craft: alteredCraft }), { code: "invalid_smelting_tier", tier: "iron" });

	const source = loadBenchmarkData();
	assert.throws(() => buildProgressionData(progressionInput(source, alteredOre)), { code: "invalid_smelting_tier", tier: "copper" });
	assert.throws(() => buildProgressionData(progressionInput(source, undefined)));
});

test("[AC-4] prepareSmeltingCraft returns canonical work and rejects an underlevel character before mutation", () => {
	assert.deepEqual(prepareSmeltingCraft(smelting, { output: "goldbar", level: 30 }), {
		index: 2,
		id: "gold",
		name: "Gold",
		level: 30,
		ore: "goldore",
		bar: "goldbar",
		ore_quantity: 10,
		xp: 18000,
		bar_g: 5000,
	});
	assert.equal(prepareSmeltingCraft(smelting, { output: "blade", level: 99 }), null);
	assert.throws(
		() => prepareSmeltingCraft(smelting, { output: "runitebar", level: 84 }),
		(error) => error.code === "smelting_level" && error.required_level === 85 && error.bar === "runitebar",
	);
});
