"use strict";

const EXPECTED_TIERS = Object.freeze([
	[0, "copper", "Copper", 1, "copperore", "copperbar", "copperscrap", 2, 5, 30000, 4958, 0.076098, 639],
	[1, "iron", "Iron", 20, "ironore", "ironbar", "ironscrap", 2, 5, 36000, 11997, 0.049492, 1013],
	[2, "gold", "Gold", 40, "goldore", "goldbar", "goldscrap", 2, 5, 42000, 19055, 0.036459, 1766],
	[3, "mithril", "Mithril", 60, "mithrilore", "mithrilbar", "mithrilscrap", 2, 5, 48000, 72944, 0.032022, 2687],
	[4, "adamantite", "Adamantite", 80, "adamantiteore", "adamantitebar", "adamantitescrap", 2, 5, 54000, 85834, 0.02574, 3772],
	[5, "runite", "Runite", 90, "runiteore", "runitebar", "runitescrap", 2, 5, 60000, 104909, 0.015367, 5574],
]);
const EXPECTED_CLASSES = Object.freeze([
	["blade", "Blade", "warrior", "blade"],
	["mace", "Mace", "paladin", "mace"],
	["staff", "Staff", "mage", "staff"],
	["book", "Book", "priest", "wbook0"],
	["bow", "Bow", "ranger", "bow"],
	["claw", "Claw", "rogue", "claw"],
]);
const EXPECTED_ANCHORS = Object.freeze([
	["fsword", "ololipop", "firestaff", "wbook3", "hbow", "stinger"],
	["swifty", "glolipop", "froststaff", "wbook5", "merry", "fclaw"],
	["sword", "pmaceofthedead", "arcstaff", "wbook6", "crossbow", "firestars"],
	["bataxe", "xmace", "vstaff", "wbook8", "t3bow", "rapier"],
	["scythe", "vhammer", "wblade", "wbook9", "weaver", "vdagger"],
	["vsword", "lmace", "pinkie", "wbookhs", "gbow", "dragondagger"],
]);
const EXPECTED_WEAPON_REQUIREMENTS = Object.freeze([20, 40, 60, 80, 90, 99]);

function fail(code, message, details = {}) {
	const error = new Error(message);
	error.code = code;
	Object.assign(error, details);
	return error;
}

function tierForId(data, tierId) {
	return data.tiers.find((tier) => tier.id === tierId) || null;
}

function weaponForOutput(data, output) {
	return data.weapons.find((weapon) => weapon.output === output) || null;
}

function exactItems(recipe, expected) {
	return (
		recipe &&
		Array.isArray(recipe.items) &&
		recipe.items.length === expected.length &&
		recipe.items.every((entry, index) => Array.isArray(entry) && entry.length === 2 && entry[0] === expected[index][0] && entry[1] === expected[index][1])
	);
}

function validateWeaponChain(data) {
	if (!Array.isArray(data.weapons) || data.weapons.length !== EXPECTED_TIERS.length * EXPECTED_CLASSES.length) {
		throw fail("invalid_smithing_weapons", "Smithing data must define the complete six-by-six weapon chain");
	}
	for (let tierIndex = 0; tierIndex < data.tiers.length; tierIndex += 1) {
		const tier = data.tiers[tierIndex];
		for (let classIndex = 0; classIndex < EXPECTED_CLASSES.length; classIndex += 1) {
			const [classId, className, skill, starter] = EXPECTED_CLASSES[classIndex];
			const weapon = data.weapons[tierIndex * EXPECTED_CLASSES.length + classIndex];
			const expected = {
				output: tier.id + classId,
				tier_id: tier.id,
				class_id: classId,
				name: `${tier.name} ${className}`,
				skill,
				requirement: EXPECTED_WEAPON_REQUIREMENTS[tierIndex],
				anchor: EXPECTED_ANCHORS[tierIndex][classIndex],
				predecessor: tierIndex === 0 ? starter : data.tiers[tierIndex - 1].id + classId,
			};
			if (!weapon || Object.keys(expected).some((key) => weapon[key] !== expected[key])) {
				throw fail("invalid_smithing_weapon", `Invalid Smithing weapon ${expected.output}`, { output: expected.output });
			}
		}
	}
}

function validateSmithingCatalogs(data, catalogs = {}) {
	const { items, craft, item_requirements: itemRequirements } = catalogs;
	if (items) {
		for (const tier of data.tiers) {
			if (!items[tier.ore] || !items[tier.bar] || !items[tier.scrap] || items[tier.scrap].g !== tier.scrap_g) {
				throw fail("invalid_smithing_catalog", `Smithing material catalog is incomplete for ${tier.id}`, { tier: tier.id });
			}
		}
		for (const weapon of data.weapons) {
			const item = items[weapon.output];
			const anchor = items[weapon.anchor];
			if (!item || !anchor || item.type !== "weapon" || item.exclusive !== true || item.projectile !== undefined) {
				throw fail("invalid_smithing_catalog", `Smithing weapon catalog is invalid for ${weapon.output}`, { output: weapon.output });
			}
		}
	}
	if (craft) {
		for (const tier of data.tiers) {
			if (!exactItems(craft[tier.bar], [[tier.ore_quantity, tier.ore]]) || craft[tier.bar].cost !== 0 || craft[tier.bar].smithing) {
				throw fail("invalid_smithing_recipe", `Smithing bar recipe is invalid for ${tier.bar}`, { output: tier.bar });
			}
		}
		for (const weapon of data.weapons) {
			const tier = tierForId(data, weapon.tier_id);
			const recipe = craft[weapon.output];
			if (!recipe || recipe.smithing !== true || recipe.cost !== 0 || !exactItems(recipe, [[tier.bars_per_weapon, tier.bar], [1, weapon.predecessor]])) {
				throw fail("invalid_smithing_recipe", `Smithing weapon recipe is invalid for ${weapon.output}`, { output: weapon.output });
			}
		}
	}
	if (itemRequirements) {
		for (const weapon of data.weapons) {
			const requirements = itemRequirements[weapon.output];
			if (!Array.isArray(requirements) || requirements.length !== 1 || requirements[0].skill !== weapon.skill || requirements[0].level !== weapon.requirement) {
				throw fail("invalid_smithing_requirements", `Smithing requirement is invalid for ${weapon.output}`, { output: weapon.output });
			}
		}
	}
}

function validateSmithingData(data, catalogs = {}) {
	if (!data || data.version !== 2 || data.success_cap_multiplier !== 1.25 || !Array.isArray(data.tiers) || data.tiers.length !== 6) {
		throw fail("invalid_smithing_data", "Smithing data must have version 2 and six locked tiers");
	}
	for (let index = 0; index < EXPECTED_TIERS.length; index += 1) {
		const tier = data.tiers[index];
		const actual = tier && [tier.index, tier.id, tier.name, tier.level, tier.ore, tier.bar, tier.scrap, tier.ore_quantity, tier.bars_per_weapon, tier.duration_ms, tier.xp, tier.base_success, tier.scrap_g];
		if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_TIERS[index])) throw fail("invalid_smithing_tier", `Invalid Smithing tier ${tier?.id || index}`, { tier: tier?.id || String(index) });
	}
	validateWeaponChain(data);
	validateSmithingCatalogs(data, catalogs);
	return data;
}

function smithingChance(data, tier, level) {
	if (!tier || !data.tiers.includes(tier) || !Number.isInteger(level) || level < tier.level || level > 99) {
		throw fail("smithing_level", `Smithing level ${tier && tier.level ? tier.level : 1} is required`, { required_level: tier && tier.level });
	}
	const nextLevel = data.tiers[tier.index + 1]?.level || 99;
	const span = Math.max(1, nextLevel - tier.level);
	const progress = Math.min(1, (level - tier.level) / span);
	return Number((tier.base_success * (1 + (data.success_cap_multiplier - 1) * progress)).toFixed(12));
}

function tierForOutput(data, output) {
	return data.tiers.find((tier) => tier.bar === output) || null;
}

function publicSmithingData(data) {
	validateSmithingData(data);
	return {
		version: data.version,
		tiers: data.tiers.map(({ base_success: _baseSuccess, ...tier }) => ({ ...tier })),
		weapons: data.weapons.map((weapon) => ({ ...weapon })),
	};
}

module.exports = { publicSmithingData, smithingChance, tierForId, tierForOutput, validateSmithingData, weaponForOutput };
