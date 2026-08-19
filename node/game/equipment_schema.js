"use strict";

const { DIRECT_EFFECT_KEY_SET } = require("./direct_effects");

const ARMOR_WEIGHTS = Object.freeze(["heavy", "medium", "light"]);
const ARMOR_SLOTS = Object.freeze(["helmet", "chest", "pants", "gloves", "shoes"]);
const ARMOR_TIER_COUNT = 6;
const ARMOR_PROGRESSION_SET_TIERS = Object.freeze({
	basic: Object.freeze({ shared_tier: 1, role: "progression", anchor: true }),
	wanderers: Object.freeze({ shared_tier: 2, role: "progression", anchor: true }),
	rugged: Object.freeze({ shared_tier: 3, role: "progression", anchor: true }),
	wt3: Object.freeze({ shared_tier: 4, role: "progression", anchor: true }),
	mwarrior: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	mmage: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	mpriest: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	mranger: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	mrogue: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	mmerchant: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	mpaladin: Object.freeze({ shared_tier: 5, role: "hunter_sidegrade", anchor: false }),
	wt4: Object.freeze({ shared_tier: 5, role: "progression", anchor: true }),
	vampires: Object.freeze({ shared_tier: 6, role: "progression", anchor: true }),
});
const ARMOR_SET_SIGNATURES = Object.freeze({
	basic: Object.freeze({}),
	wanderers: Object.freeze({ 2: Object.freeze({ speed: 1 }), 5: Object.freeze({ range: 1 }) }),
	rugged: Object.freeze({ 2: Object.freeze({ pnresistance: 1 }), 5: Object.freeze({ phresistance: 1 }) }),
	wt3: Object.freeze({ 2: Object.freeze({ pnresistance: 1 }), 5: Object.freeze({ stresistance: 1 }) }),
	mwarrior: Object.freeze({ 2: Object.freeze({ crit: 1 }), 5: Object.freeze({ apiercing: 1 }) }),
	mmage: Object.freeze({ 2: Object.freeze({ rpiercing: 1 }), 5: Object.freeze({ crit: 1 }) }),
	mpriest: Object.freeze({ 2: Object.freeze({ mp_reduction: 1 }), 5: Object.freeze({ stresistance: 1 }) }),
	mranger: Object.freeze({ 2: Object.freeze({ range: 1 }), 5: Object.freeze({ apiercing: 1 }) }),
	mrogue: Object.freeze({ 2: Object.freeze({ evasion: 1 }), 5: Object.freeze({ crit: 1 }) }),
	mmerchant: Object.freeze({ 2: Object.freeze({ dreturn: 1 }), 5: Object.freeze({ speed: 1 }) }),
	mpaladin: Object.freeze({ 2: Object.freeze({ lifesteal: 1 }), 5: Object.freeze({ stresistance: 1 }) }),
	wt4: Object.freeze({ 2: Object.freeze({ reflection: 1 }), 5: Object.freeze({ firesistance: 1 }) }),
	vampires: Object.freeze({ 2: Object.freeze({ lifesteal: 1 }), 5: Object.freeze({ manasteal: 1 }) }),
});
const REDUCED_ARMOR_SET_COMPLETION_COUNTS = Object.freeze({ tiger: 1, mpx: 1, fury: 2, swift: 2, legends: 3, bunny: 3 });
const REDUCED_ARMOR_SET_COMPLETION_PAYLOADS = Object.freeze({
	tiger: Object.freeze({ hp: 1091, mp: 189, armor: 40, resistance: 31, speed: 1, evasion: 1 }),
	mpx: Object.freeze({ hp: 259, mp: 160, armor: 24, resistance: 24, mp_reduction: 1, manasteal: 1 }),
	fury: Object.freeze({ hp: 1091, mp: 189, armor: 40, resistance: 31, attacks_per_second: 0.01, apiercing: 1 }),
	swift: Object.freeze({ hp: 226, mp: 49, armor: 18, resistance: 16, attacks_per_second: 0.01, evasion: 1 }),
	legends: Object.freeze({ hp: 427, mp: 85, armor: 38, resistance: 22, dreturn: 1, reflection: 1 }),
	bunny: Object.freeze({ hp: 246, mp: 148, armor: 22, resistance: 22, speed: 1, reflection: 1 }),
});
const RETIRED_ARMOR_ITEM_IDS = Object.freeze([
	"tigerarmor", "tigerpants", "tigergloves", "tigerboots",
	"mpxhelmet", "mpxarmor", "mpxpants", "mpxboots",
	"furyarmor", "furygloves", "furyboots",
	"legendhelmet", "legendboots",
	"swifthelmet", "swiftarmor", "swiftpants",
	"epants", "egloves",
]);
const NON_TIERED_SET_IDS = Object.freeze(["tiger", "mpx", "fury", "legends", "swift", "holidays", "bunny"]);
const EXPECTED_SET_IDS = new Set([...Object.keys(ARMOR_PROGRESSION_SET_TIERS), ...NON_TIERED_SET_IDS]);
const CORE_ARMOR_TYPES = new Set([...ARMOR_SLOTS, "cape"]);
const RETIRED_ARMOR_ITEM_ID_SET = new Set(RETIRED_ARMOR_ITEM_IDS);
const LEGACY_CATALOG_KEYS = new Set(["str", "dex", "int", "vit", "for", "stat", "stat_type", "attack", "frequency"]);
const CORE_ARMOR_PROPERTIES = new Set(["hp", "mp", "armor", "resistance"]);
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

function numericThresholds(set) {
	return Object.keys(set).filter((key) => /^\d+$/.test(key)).map(Number).sort((left, right) => left - right);
}

function cloneSet(set) {
	return {
		...set,
		items: Array.isArray(set.items) ? [...set.items] : set.items,
		bonus_items: set.bonus_items && Object.fromEntries(Object.entries(set.bonus_items).map(([slot, itemIds]) => [slot, [...itemIds]])),
		armor_progression: set.armor_progression && { ...set.armor_progression },
	};
}

function publishCumulativeSetThresholds(sets) {
	return Object.fromEntries(Object.entries(sets || {}).map(([setId, source]) => {
		const set = cloneSet(source);
		const cumulative = {};
		for (const threshold of numericThresholds(source)) {
			for (const [property, value] of Object.entries(source[threshold])) cumulative[property] = (cumulative[property] || 0) + value;
			set[threshold] = { ...cumulative };
		}
		return [setId, set];
	}));
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

function validateDirectProperties(sourceId, properties) {
	if (!properties || typeof properties !== "object" || Array.isArray(properties)) return;
	for (const [key, value] of Object.entries(properties)) {
		if (LEGACY_CATALOG_KEYS.has(key)) fail(`Legacy equipment property ${key} remains on ${sourceId}`, { item: sourceId, key });
		if (DIRECT_EFFECT_KEY_SET.has(key) && (typeof value !== "number" || !Number.isFinite(value))) {
			fail(`Direct equipment property ${key} is invalid on ${sourceId}`, { item: sourceId, key, value });
		}
	}
}

function validateTierMetadata(setId, set) {
	const expected = ARMOR_PROGRESSION_SET_TIERS[setId];
	if (!expected) {
		if (own(set, "armor_progression")) fail(`Set ${setId} must not publish armor progression metadata`, { set: setId });
		return;
	}
	if (JSON.stringify(set.armor_progression) !== JSON.stringify(expected)) {
		fail(`Set ${setId} has invalid armor progression metadata`, { set: setId, armor_progression: set.armor_progression });
	}
}

function validateEquipmentSchema(items, sets) {
	if (!items || typeof items !== "object") fail("Item catalog must be an object");
	if (!sets || typeof sets !== "object") fail("Set catalog must be an object");

	for (const [itemId, item] of Object.entries(items)) {
		if (RETIRED_ARMOR_ITEM_ID_SET.has(itemId)) fail(`Retired armor item ${itemId} remains in the catalog`, { item: itemId });
		if (!item || typeof item !== "object") fail(`Item ${itemId} is invalid`, { item: itemId });
		if (CORE_ARMOR_TYPES.has(item.type) && !validWeight(item.armor_weight)) {
			fail(`Core armor item ${itemId} has an invalid weight`, { item: itemId, weight: item.armor_weight });
		}
		if (own(item, "armor_weight") && !validWeight(item.armor_weight)) {
			fail(`Item ${itemId} has an invalid weight`, { item: itemId, weight: item.armor_weight });
		}
		validatePlaceholder(itemId, item, items);
		validateDirectProperties(itemId, item);
		validateDirectProperties(`${itemId}.upgrade`, item.upgrade);
		validateDirectProperties(`${itemId}.compound`, item.compound);
		validateDirectProperties(`${itemId}.legacy`, item.legacy);
		if (item.type === "weapon") {
			if (!Number.isFinite(item.damage) || item.damage <= 0) fail(`Weapon ${itemId} must publish positive direct damage`, { item: itemId });
			if (!Number.isFinite(item.attacks_per_second) || item.attacks_per_second <= 0) fail(`Weapon ${itemId} must publish positive direct attacks per second`, { item: itemId });
		}
	}

	const setIds = Object.keys(sets);
	if (setIds.length !== EXPECTED_SET_IDS.size || setIds.some((setId) => !EXPECTED_SET_IDS.has(setId))) {
		fail("Equipment catalog must publish the exact 20 armor sets", { sets: setIds });
	}
	for (const [setId, set] of Object.entries(sets)) {
		if (!set || typeof set !== "object" || !validWeight(set.weight)) fail(`Set ${setId} has an invalid weight`, { set: setId, weight: set && set.weight });
		validateTierMetadata(setId, set);
		if (!Array.isArray(set.items) || !set.items.length || new Set(set.items).size !== set.items.length) {
			fail(`Set ${setId} has duplicate or missing theme members`, { set: setId });
		}
		for (const itemId of set.items) {
			const item = items[itemId];
			if (!item || item.set !== setId) fail(`Set ${setId} theme member ${itemId} is invalid`, { set: setId, item: itemId });
			if (CORE_ARMOR_TYPES.has(item.type) && item.armor_weight !== set.weight) {
				fail(`Set ${setId} theme member ${itemId} has the wrong weight`, { set: setId, item: itemId, weight: item.armor_weight });
			}
		}
		for (const [itemId, item] of Object.entries(items)) {
			if (item.set === setId && !set.items.includes(itemId)) fail(`Set ${setId} omits tagged theme member ${itemId}`, { set: setId, item: itemId });
		}
		if (!set.bonus_items || typeof set.bonus_items !== "object" || Array.isArray(set.bonus_items)) {
			fail(`Set ${setId} is missing bonus slot membership`, { set: setId });
		}
		const populatedSlots = Object.keys(set.bonus_items);
		if (!populatedSlots.length || populatedSlots.some((slot) => !ARMOR_SLOTS.includes(slot))) {
			fail(`Set ${setId} has invalid bonus slot keys`, { set: setId, slots: populatedSlots });
		}
		const seenBonusItems = new Set();
		for (const [slot, members] of Object.entries(set.bonus_items)) {
			if (!Array.isArray(members) || !members.length || new Set(members).size !== members.length) {
				fail(`Set ${setId} has invalid ${slot} bonus membership`, { set: setId, slot });
			}
			for (const itemId of members) {
				const item = items[itemId];
				if (seenBonusItems.has(itemId) || !item || item.type !== slot || item.set !== setId || item.armor_weight !== set.weight || !set.items.includes(itemId)) {
					fail(`Set ${setId} bonus member ${itemId} is invalid for ${slot}`, { set: setId, item: itemId, slot });
				}
				seenBonusItems.add(itemId);
			}
		}
		const thresholds = numericThresholds(set);
		const expectedThresholds = REDUCED_ARMOR_SET_COMPLETION_COUNTS[setId]
			? [REDUCED_ARMOR_SET_COMPLETION_COUNTS[setId]]
			: [2, 3, 4, 5];
		if (JSON.stringify(thresholds) !== JSON.stringify(expectedThresholds) || thresholds.at(-1) !== populatedSlots.length) {
			fail(`Set ${setId} has invalid completion thresholds`, { set: setId, thresholds, slots: populatedSlots });
		}
		if (REDUCED_ARMOR_SET_COMPLETION_PAYLOADS[setId] && JSON.stringify(set[thresholds[0]]) !== JSON.stringify(REDUCED_ARMOR_SET_COMPLETION_PAYLOADS[setId])) {
			fail(`Set ${setId} has an invalid reduced completion payload`, { set: setId, threshold: thresholds[0] });
		}
		for (const threshold of thresholds) {
			if (!set[threshold] || typeof set[threshold] !== "object" || Array.isArray(set[threshold]) || !Object.keys(set[threshold]).length) {
				fail(`Set ${setId} threshold ${threshold} is invalid`, { set: setId, threshold });
			}
			validateDirectProperties(`${setId}.${threshold}`, set[threshold]);
			if (ARMOR_SET_SIGNATURES[setId]) {
				const signature = Object.fromEntries(Object.entries(set[threshold]).filter(([key]) => !CORE_ARMOR_PROPERTIES.has(key)));
				const expectedSignature = ARMOR_SET_SIGNATURES[setId][threshold] || {};
				if (JSON.stringify(signature) !== JSON.stringify(expectedSignature)) fail(`Set ${setId} threshold ${threshold} has signature drift`, { set: setId, threshold });
			}
		}
	}
	return sets;
}

module.exports = {
	ARMOR_PROGRESSION_SET_TIERS,
	ARMOR_SET_SIGNATURES,
	ARMOR_SLOTS,
	ARMOR_TIER_COUNT,
	ARMOR_WEIGHTS,
	REDUCED_ARMOR_SET_COMPLETION_COUNTS,
	REDUCED_ARMOR_SET_COMPLETION_PAYLOADS,
	RETIRED_ARMOR_ITEM_IDS,
	publishCumulativeSetThresholds,
	validateEquipmentSchema,
};
