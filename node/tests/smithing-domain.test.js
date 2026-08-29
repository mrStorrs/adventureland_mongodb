"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { positions } = require("../../design/dimensions");
const { item_requirements } = require("../../design/item_requirements");
const { items } = require("../../design/items");
const { mining } = require("../../design/mining");
const { smithing } = require("../../design/smithing");
const { imagesets } = require("../../design/sprites");
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

function publishedImages() {
	const context = {};
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../design/precomputed_images.js"), "utf8"), context, { filename: "precomputed_images.js" });
	return context.precomputed.images;
}

const smithingWeaponClasses = [
	["blade", "blade"],
	["mace", "mace"],
	["staff", "staff"],
	["book", "wbook0"],
	["bow", "bow"],
	["claw", "claw"],
];

test("[AC-1, AC-4] Smithing has locked six-tier Mining-ore parity", () => {
	assert.equal(validateSmithingData(smithing), smithing);
	assert.deepEqual(
		smithing.tiers.map((tier) => [tier.level, tier.ore_quantity, tier.bars_per_weapon, tier.duration_ms, tier.xp, tier.base_success, tier.scrap_g]),
		[
			[1, 2, 5, 30000, 13222, 0.076098, 639],
			[20, 2, 5, 36000, 26660, 0.049492, 1013],
			[40, 2, 5, 42000, 36296, 0.036459, 1766],
			[60, 2, 5, 48000, 121574, 0.032022, 2687],
			[80, 2, 5, 54000, 127162, 0.02574, 3772],
			[90, 2, 5, 60000, 139878, 0.015367, 5574],
		],
	);
	for (const [index, tier] of smithing.tiers.entries()) {
		const miningTier = mining.tiers[index];
		assert.deepEqual([tier.id, tier.ore, tier.level], [miningTier.id, miningTier.ore, miningTier.level]);
		assert.equal(tier.xp, miningTier.xp * tier.ore_quantity, tier.id);
	}
	assert.equal(smithingChance(smithing, smithing.tiers[0], 1), 0.076098);
	assert.equal(smithingChance(smithing, smithing.tiers[0], 20), 0.0951225);
	assert.doesNotThrow(() => validateSmithingData(smithing, { items, craft: publishedCraft(), item_requirements }));
});

test("[AC-1] self-mined ore keeps Mining and Smithing level pacing aligned", () => {
	const expectedBands = [37.7, 138.3, 352.0, 619.1, 1147.1, 2085.7];
	const selfMinedHours = [];
	const unlimitedOreHours = [];
	for (const [index, miningTier] of mining.tiers.entries()) {
		const smithingTier = smithing.tiers[index];
		const nextLevel = mining.tiers[index + 1]?.level || 99;
		const xpNeeded = cumulativeXp(nextLevel, "mining") - cumulativeXp(miningTier.level, "mining");
		const miningHours = xpNeeded / (90 * miningTier.xp);
		const smithingHoursFromSelfMinedOre = xpNeeded / ((90 / smithingTier.ore_quantity) * smithingTier.xp);
		const smithingHoursWithUnlimitedOre = xpNeeded / ((3600000 / smithingTier.duration_ms) * smithingTier.xp);
		assert.ok(Math.abs(miningHours - expectedBands[index]) <= 0.1, `mining/${miningTier.id}`);
		assert.ok(Math.abs(smithingHoursFromSelfMinedOre - miningHours) <= 0.000001, miningTier.id);
		assert.ok(smithingHoursWithUnlimitedOre < smithingHoursFromSelfMinedOre, miningTier.id);
		selfMinedHours.push(smithingHoursFromSelfMinedOre);
		unlimitedOreHours.push(smithingHoursWithUnlimitedOre);
	}
	assert.equal(Number(selfMinedHours.reduce((sum, value) => sum + value, 0).toFixed(1)), 4380.0);
	assert.equal(Number(unlimitedOreHours.reduce((sum, value) => sum + value, 0).toFixed(1)), 2971.3);
});

test("[AC-1] every Smithing weapon recipe always uses its class's unupgraded starter", () => {
	const craft = publishedCraft();
	for (const tier of smithing.tiers) {
		for (const [classId, starter] of smithingWeaponClasses) {
			const output = tier.id + classId;
			const weapon = smithing.weapons.find((candidate) => candidate.output === output);
			assert.equal(weapon.predecessor, starter, output);
			assert.deepEqual(JSON.parse(JSON.stringify(craft[output].items)), [[tier.bars_per_weapon, tier.bar], [1, starter]], output);
		}
	}
	const chained = structuredClone(smithing);
	chained.weapons.find((weapon) => weapon.output === "ironblade").predecessor = "copperblade";
	assert.throws(() => validateSmithingData(chained), { code: "invalid_smithing_weapon" });
});

test("[AC-5] README documents the published parity table and U.S. combat policy", () => {
	const readme = fs.readFileSync(path.resolve(__dirname, "../../README.md"), "utf8");
	for (const [index, tier] of smithing.tiers.entries()) {
		const miningTier = mining.tiers[index];
		assert.ok(
			readme.includes(`| ${tier.name} Bar | ${tier.level} | ${tier.ore_quantity} ${miningTier.name} Ore | ${tier.duration_ms / 1000}s | ${tier.xp.toLocaleString("en-US")} |`),
			tier.id,
		);
	}
	assert.match(readme, /Each tier awards the Mining XP\s+of one matching ore multiplied by its two-ore refine input/);
	assert.match(readme, /refining every\s+ore a character mines gives Mining and Smithing the same total XP/);
	assert.match(readme, /U\.S\. servers apply \*\*2× combat XP\*\* through\s+the normal monster reward path, including U\.S\. Hardcore\/PvP servers/);
	assert.match(readme, /does not alter Mining or Smithing XP or Monster Hunt\s+token quantities/);
	assert.match(readme, /Every weapon recipe is\s+independent: five bars of its target material plus the matching base `\+0` weapon/);
	assert.match(readme, /a failed forge retains that base `\+0` weapon and yields five\s+same-material bar scraps/);
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

test("[AC-5, AC-6] Smithing art has a complete, isolated six-by-nine sprite publication", () => {
	const expectedImageSet = {
		size: 20,
		rows: 9,
		columns: 6,
		file: "/images/tiles/items/smithing_tiers.png",
		load: true,
	};
	assert.deepEqual(imagesets.smithing_tiers, expectedImageSet);
	const seenCells = new Set();
	for (const [classRow, [classId]] of smithingWeaponClasses.entries()) {
		for (const [materialColumn, tier] of smithing.tiers.entries()) {
			const skin = `smithing_${tier.id}_${classId}`;
			assert.equal(items[tier.id + classId].skin, skin, tier.id + classId);
			assert.deepEqual(positions[skin], ["smithing_tiers", materialColumn, classRow], skin);
			seenCells.add(positions[skin].slice(1).join(","));
		}
	}
	for (const [materialColumn, tier] of smithing.tiers.entries()) {
		for (const [kind, row] of [["ore", 6], ["bar", 7], ["scrap", 8]]) {
			const skin = `smithing_${tier.id}_${kind}`;
			assert.equal(items[tier[kind]].skin, skin, tier[kind]);
			assert.deepEqual(positions[skin], ["smithing_tiers", materialColumn, row], skin);
			seenCells.add(positions[skin].slice(1).join(","));
		}
	}
	assert.equal(seenCells.size, 54);
	const asset = fs.readFileSync(path.resolve(__dirname, "../../images/tiles/items/smithing_tiers.png"));
	assert.deepEqual(asset.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
	assert.equal(asset.toString("ascii", 12, 16), "IHDR");
	assert.equal(asset.readUInt32BE(16), 120);
	assert.equal(asset.readUInt32BE(20), 180);
	assert.deepEqual(JSON.parse(JSON.stringify(publishedImages()["/images/tiles/items/smithing_tiers.png"])), { height: 180, width: 120, type: "png" });
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
