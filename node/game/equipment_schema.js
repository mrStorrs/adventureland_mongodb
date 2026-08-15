"use strict";

const ARMOR_WEIGHTS = Object.freeze(["heavy", "medium", "light"]);
const ARMOR_SLOTS = Object.freeze(["helmet", "chest", "pants", "gloves", "shoes"]);
const CORE_ARMOR_TYPES = new Set([...ARMOR_SLOTS, "cape"]);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function fail(message, details = {}) {
	const error = new Error(message);
	error.code = "invalid_equipment_schema";
	Object.assign(error, details);
	throw error;
}

function validWeight(weight) {
	return ARMOR_WEIGHTS.includes(weight);
}

function validatePlaceholder(itemId, item, items) {
	const hasPlaceholderFields = own(item, "placeholder_art") || own(item, "placeholder_asset");
	if (!hasPlaceholderFields) return;
	if (item.placeholder_art !== true || typeof item.placeholder_asset !== "string" || !items[item.placeholder_asset]) {
		fail(`Placeholder metadata is invalid for ${itemId}`, { item: itemId });
	}
	if (typeof item.explanation !== "string" || !item.explanation.includes("Placeholder artwork")) {
		fail(`Placeholder explanation is missing for ${itemId}`, { item: itemId });
	}
}

function validateEquipmentSchema(items, sets) {
	if (!items || typeof items !== "object") fail("Item catalog must be an object");
	if (!sets || typeof sets !== "object") fail("Set catalog must be an object");

	for (const [itemId, item] of Object.entries(items)) {
		if (!item || typeof item !== "object") fail(`Item ${itemId} is invalid`, { item: itemId });
		if (CORE_ARMOR_TYPES.has(item.type) && !validWeight(item.armor_weight)) {
			fail(`Core armor item ${itemId} has an invalid weight`, { item: itemId, weight: item.armor_weight });
		}
		if (own(item, "armor_weight") && !validWeight(item.armor_weight)) {
			fail(`Item ${itemId} has an invalid weight`, { item: itemId, weight: item.armor_weight });
		}
		validatePlaceholder(itemId, item, items);
	}

	const setIds = Object.keys(sets);
	if (setIds.length !== 19) fail("Equipment catalog must publish exactly 19 armor sets", { sets: setIds });
	for (const [setId, set] of Object.entries(sets)) {
		if (!set || typeof set !== "object" || !validWeight(set.weight)) {
			fail(`Set ${setId} has an invalid weight`, { set: setId, weight: set && set.weight });
		}
		if (!Array.isArray(set.items) || !set.items.length || new Set(set.items).size !== set.items.length) {
			fail(`Set ${setId} has duplicate or missing theme members`, { set: setId });
		}
		for (const itemId of set.items) {
			const item = items[itemId];
			if (!item || item.set !== setId) {
				fail(`Set ${setId} theme member ${itemId} is invalid`, { set: setId, item: itemId });
			}
			if (CORE_ARMOR_TYPES.has(item.type) && item.armor_weight !== set.weight) {
				fail(`Set ${setId} theme member ${itemId} has the wrong weight`, { set: setId, item: itemId, weight: item.armor_weight });
			}
		}
		for (const [itemId, item] of Object.entries(items)) {
			if (item.set === setId && !set.items.includes(itemId)) fail(`Set ${setId} omits tagged theme member ${itemId}`, { set: setId, item: itemId });
		}
		const thresholdKeys = Object.keys(set).filter((key) => /^\d+$/.test(key)).sort();
		if (thresholdKeys.join("\0") !== "2\0" + "3\0" + "4\0" + "5") {
			fail(`Set ${setId} must define only thresholds 2 through 5`, { set: setId, thresholds: thresholdKeys });
		}
		for (const threshold of [2, 3, 4, 5]) {
			if (!set[threshold] || typeof set[threshold] !== "object" || Array.isArray(set[threshold])) {
				fail(`Set ${setId} threshold ${threshold} is invalid`, { set: setId, threshold });
			}
		}
		if (!set.bonus_items || typeof set.bonus_items !== "object" || Array.isArray(set.bonus_items)) {
			fail(`Set ${setId} is missing bonus slot membership`, { set: setId });
		}
		if (Object.keys(set.bonus_items).sort().join("\0") !== [...ARMOR_SLOTS].sort().join("\0")) {
			fail(`Set ${setId} has invalid bonus slot keys`, { set: setId, slots: Object.keys(set.bonus_items) });
		}
		for (const slot of ARMOR_SLOTS) {
			const members = set.bonus_items[slot];
			if (!Array.isArray(members) || !members.length || new Set(members).size !== members.length) {
				fail(`Set ${setId} has invalid ${slot} bonus membership`, { set: setId, slot });
			}
			for (const itemId of members) {
				const item = items[itemId];
				if (!item || item.type !== slot || item.set !== setId || item.armor_weight !== set.weight || !set.items.includes(itemId)) {
					fail(`Set ${setId} bonus member ${itemId} is invalid for ${slot}`, { set: setId, item: itemId, slot });
				}
			}
		}
	}
	return sets;
}

module.exports = { ARMOR_SLOTS, ARMOR_WEIGHTS, validateEquipmentSchema };
