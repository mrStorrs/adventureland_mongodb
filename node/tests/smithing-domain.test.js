"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { item_requirements } = require("../../design/item_requirements");
const { items } = require("../../design/items");
const { mining } = require("../../design/mining");
const { smithing } = require("../../design/smithing");
const { cumulativeXp } = require("../game/skill_domain");
const { smithingChance, validateSmithingData } = require("../game/smithing");
const { loadBenchmarkData } = require("../tools/progression-benchmark");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");

function publishedCraft() {
	const context = { smithing: structuredClone(smithing), smithing_weapon_chain: structuredClone(smithing.weapons) };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../design/recipes.js"), "utf8"), context, { filename: "recipes.js" });
	return context.craft;
}

test("[AC-3, AC-4, AC-5, AC-8] Smithing has the locked timed six-tier balance", () => {
	assert.equal(validateSmithingData(smithing), smithing);
	assert.deepEqual(
		smithing.tiers.map((tier) => [tier.level, tier.ore_quantity, tier.bars_per_weapon, tier.duration_ms, tier.xp, tier.base_success, tier.scrap_g]),
		[
			[1, 2, 5, 30000, 4958, 0.076098, 639],
			[20, 2, 5, 36000, 11997, 0.049492, 1013],
			[40, 2, 5, 42000, 19055, 0.036459, 1766],
			[60, 2, 5, 48000, 72944, 0.032022, 2687],
			[80, 2, 5, 54000, 85834, 0.02574, 3772],
			[90, 2, 5, 60000, 104909, 0.015367, 5574],
		],
	);
	assert.equal(smithingChance(smithing, smithing.tiers[0], 1), 0.076098);
	assert.equal(smithingChance(smithing, smithing.tiers[0], 20), 0.0951225);
	assert.doesNotThrow(() => validateSmithingData(smithing, { items, craft: publishedCraft(), item_requirements }));
});

test("[AC-3] Mining and Smithing each meet the approved Warrior-curve time bands", () => {
	const expectedBands = [37.7, 138.3, 352.0, 619.1, 1147.1, 2085.7];
	for (const [name, tiers, actionsPerHour] of [
		["mining", mining.tiers, () => 90],
		["smithing", smithing.tiers, (tier) => 3600000 / tier.duration_ms],
	]) {
		const hours = tiers.map((tier, index) => {
			const nextLevel = tiers[index + 1]?.level || 99;
			return (cumulativeXp(nextLevel, name) - cumulativeXp(tier.level, name)) / (actionsPerHour(tier) * tier.xp);
		});
		hours.forEach((value, index) => assert.ok(Math.abs(value - expectedBands[index]) <= 0.1, `${name}/${tiers[index].id}`));
		assert.equal(Number(hours.reduce((sum, value) => sum + value, 0).toFixed(1)), 4380.0, name);
	}
});

test("[AC-7] every Smithing weapon copies only its anchor's basic combat profile", () => {
	const data = loadBenchmarkData();
	const calculators = loadPropertyCalculators(data);
	const materials = ["copper", "iron", "gold", "mithril", "adamantite", "runite"];
	const suffixes = ["blade", "mace", "staff", "book", "bow", "claw"];
	const anchors = [["fsword", "ololipop", "firestaff", "wbook3", "hbow", "stinger"], ["swifty", "glolipop", "froststaff", "wbook5", "merry", "fclaw"], ["sword", "pmaceofthedead", "arcstaff", "wbook6", "crossbow", "firestars"], ["bataxe", "xmace", "vstaff", "wbook8", "t3bow", "rapier"], ["scythe", "vhammer", "wblade", "wbook9", "weaver", "vdagger"], ["vsword", "lmace", "pinkie", "wbookhs", "gbow", "dragondagger"]];
	for (let tier = 0; tier < materials.length; tier += 1) {
		for (let kind = 0; kind < suffixes.length; kind += 1) {
			const item = data.items[materials[tier] + suffixes[kind]];
			const anchor = data.items[anchors[tier][kind]];
			assert.equal(item.damage, anchor.damage);
			assert.equal(item.attacks_per_second, anchor.attacks_per_second);
			assert.deepEqual(item.upgrade, Object.fromEntries(Object.entries(anchor.upgrade).filter(([key]) => ["damage", "range", "attacks_per_second"].includes(key))));
			assert.equal(item.requirements[0].level, [20, 40, 60, 80, 90, 99][tier]);
			assert.equal(item.exclusive, true);
			assert.equal(item.projectile, undefined);
			assert.equal(Object.keys(item).some((key) => /lifesteal|reflection|stun|explosion|attr|piercing|evasion|luck|hp|mp|resistance/.test(key)), false);
			for (let level = 0; level <= 4; level += 1) {
				const crafted = calculators.current.calculate_item_properties({ name: materials[tier] + suffixes[kind], level });
				const target = calculators.current.calculate_item_properties({ name: anchors[tier][kind], level });
				assert.equal(crafted.damage, target.damage, `${materials[tier]}${suffixes[kind]}+${level} damage`);
				assert.equal(crafted.attacks_per_second, target.attacks_per_second, `${materials[tier]}${suffixes[kind]}+${level} attack speed`);
				assert.equal(crafted.range, target.range, `${materials[tier]}${suffixes[kind]}+${level} range`);
			}
		}
	}
});

test("[AC-8] the complete refinement and forging failure loop returns the locked combat-relative scrap gold rate", () => {
	const targets = [45000, 60000, 90000, 120000, 150000, 200000];
	for (const [index, tier] of smithing.tiers.entries()) {
		const chance = tier.base_success;
		const actionsPerHour = 3600000 / tier.duration_ms;
		const refineAttempts = actionsPerHour / (1 + chance / tier.bars_per_weapon);
		const refiningScrap = refineAttempts * (1 - chance);
		const forgingScrap = (refineAttempts * chance / tier.bars_per_weapon) * (1 - chance) * tier.bars_per_weapon;
		const failuresPerHourGold = (refiningScrap + forgingScrap) * tier.scrap_g * mining.balance.sell_multiplier;
		const rawOreSalePerHour = 90 * mining.tiers[index].ore_g * mining.balance.sell_multiplier;
		assert.ok(Math.abs(failuresPerHourGold - targets[index]) <= 100, `${tier.id} scrap gold/h`);
		assert.ok(Math.abs(rawOreSalePerHour - targets[index] * 1.25) <= 30, `${tier.id} raw-ore premium`);
	}
});
