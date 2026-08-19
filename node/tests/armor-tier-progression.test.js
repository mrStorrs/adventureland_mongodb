"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
	ARMOR_PROGRESSION_SET_TIERS,
	ARMOR_SLOTS,
	ARMOR_TIER_COUNT,
	REDUCED_ARMOR_SET_COMPLETION_COUNTS,
	RETIRED_ARMOR_ITEM_IDS,
	publishCumulativeSetThresholds,
	validateEquipmentSchema,
} = require("../game/equipment_schema");
const { calculateStats } = require("../game/stats");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { hash, loadPropertyCalculators } = require("../tools/direct-equipment-authority");

const CORE_FIELDS = Object.freeze(["hp", "mp", "armor", "resistance"]);
const DENOMINATORS = Object.freeze({ hp: 4959.5, mp: 1637.5, armor: 202.5, resistance: 138.66666666666666 });
const ROUNDING_QUANTUM = 1 / DENOMINATORS.resistance;
const EXPECTED_TIERS = Object.freeze({
	basic: { shared_tier: 1, role: "progression", anchor: true },
	wanderers: { shared_tier: 2, role: "progression", anchor: true },
	rugged: { shared_tier: 3, role: "progression", anchor: true },
	wt3: { shared_tier: 4, role: "progression", anchor: true },
	mwarrior: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	mmage: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	mpriest: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	mranger: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	mrogue: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	mmerchant: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	mpaladin: { shared_tier: 5, role: "hunter_sidegrade", anchor: false },
	wt4: { shared_tier: 5, role: "progression", anchor: true },
	vampires: { shared_tier: 6, role: "progression", anchor: true },
});
const NON_TIERED_SET_IDS = Object.freeze(["tiger", "mpx", "fury", "swift", "legends", "holidays", "bunny"]);
const BASE_HP_CURVE = Object.freeze({
	basic: 700,
	wanderers: 1960,
	rugged: 3220,
	wt3: 4480,
	mwarrior: 5740,
	mmage: 5740,
	mpriest: 5740,
	mranger: 5740,
	mrogue: 5740,
	mmerchant: 5740,
	mpaladin: 5740,
	wt4: 5740,
	vampires: 7000,
});
const BASE_CORE_VECTORS = Object.freeze({
	basic: Object.freeze({ hp: 700, mp: 55, armor: 4, resistance: 4 }),
	wanderers: Object.freeze({ hp: 1960, mp: 252, armor: 18, resistance: 12 }),
	rugged: Object.freeze({ hp: 3220, mp: 155, armor: 78, resistance: 63 }),
	wt3: Object.freeze({ hp: 4480, mp: 291, armor: 161, resistance: 95 }),
	wt4: Object.freeze({ hp: 5740, mp: 426, armor: 189, resistance: 111 }),
	mwarrior: Object.freeze({ hp: 5740, mp: 142, armor: 214, resistance: 118 }),
	mpaladin: Object.freeze({ hp: 5740, mp: 142, armor: 214, resistance: 118 }),
	mmage: Object.freeze({ hp: 5740, mp: 822, armor: 122, resistance: 123 }),
	mpriest: Object.freeze({ hp: 5740, mp: 822, armor: 122, resistance: 123 }),
	mranger: Object.freeze({ hp: 5740, mp: 522, armor: 162, resistance: 121 }),
	mrogue: Object.freeze({ hp: 5740, mp: 522, armor: 162, resistance: 121 }),
	mmerchant: Object.freeze({ hp: 5740, mp: 522, armor: 162, resistance: 121 }),
	vampires: Object.freeze({ hp: 7000, mp: 929, armor: 192, resistance: 63 }),
});
const REDUCED_BONUS_ITEMS = Object.freeze({
	tiger: { helmet: ["tigerhelmet"] },
	mpx: { gloves: ["mpxgloves"] },
	fury: { helmet: ["fury"], pants: ["fallen"] },
	swift: { gloves: ["fierygloves"], shoes: ["wingedboots"] },
	legends: { chest: ["warpvest"], pants: ["starkillers"], gloves: ["powerglove", "goldenpowerglove"] },
	bunny: { helmet: ["eears"], chest: ["epyjamas"], shoes: ["eslippers"] },
});
const REDUCED_COMPLETION_PAYLOADS = Object.freeze({
	tiger: { hp: 1091, mp: 189, armor: 40, resistance: 31, speed: 1, evasion: 1 },
	mpx: { hp: 259, mp: 160, armor: 24, resistance: 24, mp_reduction: 1, manasteal: 1 },
	fury: { hp: 1091, mp: 189, armor: 40, resistance: 31, attacks_per_second: 0.01, apiercing: 1 },
	swift: { hp: 226, mp: 49, armor: 18, resistance: 16, attacks_per_second: 0.01, evasion: 1 },
	legends: { hp: 427, mp: 85, armor: 38, resistance: 22, dreturn: 1, reflection: 1 },
	bunny: { hp: 246, mp: 148, armor: 22, resistance: 22, speed: 1, reflection: 1 },
});
const TIER_SIGNATURES = Object.freeze({
	basic: {},
	wanderers: { 2: { speed: 1 }, 5: { range: 1 } },
	rugged: { 2: { pnresistance: 1 }, 5: { phresistance: 1 } },
	wt3: { 2: { pnresistance: 1 }, 5: { stresistance: 1 } },
	mwarrior: { 2: { crit: 1 }, 5: { apiercing: 1 } },
	mmage: { 2: { rpiercing: 1 }, 5: { crit: 1 } },
	mpriest: { 2: { mp_reduction: 1 }, 5: { stresistance: 1 } },
	mranger: { 2: { range: 1 }, 5: { apiercing: 1 } },
	mrogue: { 2: { evasion: 1 }, 5: { crit: 1 } },
	mmerchant: { 2: { dreturn: 1 }, 5: { speed: 1 } },
	mpaladin: { 2: { lifesteal: 1 }, 5: { stresistance: 1 } },
	wt4: { 2: { reflection: 1 }, 5: { firesistance: 1 } },
	vampires: { 2: { lifesteal: 1 }, 5: { manasteal: 1 } },
});
const EXPECTED_RETAINED_PLACEHOLDERS = Object.freeze([
	"arcstaff", "mhbook", "mhcrossbow", "mhdagger", "mhhammer", "mhspear", "mhwand",
	"mpalarmor", "mpalboots", "mpalgloves", "mpalhelmet", "mpalpants", "vhelmet", "vpants",
	"wbook2", "wbook3", "wbook4", "wbook5", "wbook6", "wbook7", "wbook8", "wbook9",
]);
const SURVIVING_AFFECTED_ITEM_IDS = Object.freeze([
	"tigerhelmet", "tigershield", "tigercape", "tigerstone",
	"mpxbelt", "mpxgloves", "mpxamulet",
	"suckerpunch", "fury", "fallen",
	"wingedboots", "fierygloves",
	"warpvest", "starkillers", "powerglove", "goldenpowerglove",
	"eears", "ecape", "epyjamas", "eslippers", "pinkie", "carrotsword",
	"xmashat", "xmassweater", "xmasshoes", "xmaspants", "mittens", "supermittens", "santasbelt", "ornamentstaff",
	"candycanesword", "merry", "orbofsc", "mearring", "xmace", "ringhs", "sweaterhs", "wbookhs", "orboftemporal",
].sort());
// This pinned pre-tier-tuning shape is the combat-validated source for Basic.
const WANDERER_PRE_TUNE_SHAPE_SOURCE = Object.freeze({
	direct: Object.freeze({ hp: 357, mp: 201, armor: 26, resistance: 17 }),
	raw: Object.freeze({
		2: Object.freeze({ hp: 13, mp: 7, armor: 0, resistance: 0 }),
		3: Object.freeze({ hp: 17, mp: 11, armor: 2, resistance: 0 }),
		4: Object.freeze({ hp: 22, mp: 13, armor: 2, resistance: 2 }),
		5: Object.freeze({ hp: 37, mp: 20, armor: 2, resistance: 2 }),
	}),
});
const BASIC_RAW_CHANNEL_TOTALS = Object.freeze({ hp: 4, mp: 4, armor: 4, resistance: 4 });
const BASIC_DIRECT_CORE_VECTOR = Object.freeze({ hp: 696, mp: 51, armor: 0, resistance: 0 });
const BASIC_UPGRADE_CORE_BY_SLOT = Object.freeze({
	helmet: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	chest: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	pants: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	gloves: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	shoes: Object.freeze({ armor: 0.25, resistance: 0 }),
});
const HUNTER_SOURCE_SHAPES = Object.freeze([
	Object.freeze({
		sets: Object.freeze(["mwarrior", "mpaladin"]),
		items: Object.freeze({
			helm: Object.freeze({ hp: 35, mp: 5, armor: 8, resistance: 4 }),
			chest: Object.freeze({ hp: 118, mp: 11, armor: 17, resistance: 9 }),
			pants: Object.freeze({ hp: 58, mp: 9, armor: 14, resistance: 8 }),
			gloves: Object.freeze({ hp: 23, mp: 4, armor: 5, resistance: 3 }),
			shoes: Object.freeze({ hp: 23, mp: 4, armor: 6, resistance: 3 }),
		}),
		raw: Object.freeze({
			2: Object.freeze({ hp: 8, mp: 1, armor: 2, resistance: 1 }),
			3: Object.freeze({ hp: 10, mp: 2, armor: 2, resistance: 1 }),
			4: Object.freeze({ hp: 13, mp: 2, armor: 3, resistance: 2 }),
			5: Object.freeze({ hp: 21, mp: 3, armor: 5, resistance: 3 }),
		}),
	}),
	Object.freeze({
		sets: Object.freeze(["mmage", "mpriest"]),
		items: Object.freeze({
			helm: Object.freeze({ hp: 205, mp: 107, armor: 16, resistance: 16 }),
			chest: Object.freeze({ hp: 361, mp: 214, armor: 32, resistance: 32 }),
			pants: Object.freeze({ hp: 277, mp: 178, armor: 26, resistance: 26 }),
			gloves: Object.freeze({ hp: 120, mp: 71, armor: 11, resistance: 11 }),
			shoes: Object.freeze({ hp: 120, mp: 71, armor: 10, resistance: 11 }),
		}),
		raw: Object.freeze({
			2: Object.freeze({ hp: 24, mp: 24, armor: 4, resistance: 4 }),
			3: Object.freeze({ hp: 33, mp: 32, armor: 5, resistance: 5 }),
			4: Object.freeze({ hp: 89, mp: 40, armor: 6, resistance: 6 }),
			5: Object.freeze({ hp: 113, mp: 64, armor: 9, resistance: 9 }),
		}),
	}),
	Object.freeze({
		sets: Object.freeze(["mranger", "mrogue", "mmerchant"]),
		items: Object.freeze({
			helm: Object.freeze({ hp: 515, mp: 60, armor: 19, resistance: 14 }),
			chest: Object.freeze({ hp: 1079, mp: 119, armor: 37, resistance: 28 }),
			pants: Object.freeze({ hp: 875, mp: 99, armor: 31, resistance: 23 }),
			gloves: Object.freeze({ hp: 360, mp: 40, armor: 12, resistance: 9 }),
			shoes: Object.freeze({ hp: 360, mp: 40, armor: 12, resistance: 9 }),
		}),
		raw: Object.freeze({
			2: Object.freeze({ hp: 121, mp: 14, armor: 4, resistance: 3 }),
			3: Object.freeze({ hp: 145, mp: 18, armor: 6, resistance: 4 }),
			4: Object.freeze({ hp: 217, mp: 22, armor: 7, resistance: 5 }),
			5: Object.freeze({ hp: 290, mp: 36, armor: 11, resistance: 9 }),
		}),
	}),
]);

function score(vector) {
	return CORE_FIELDS.reduce((total, field) => total + Number(vector[field] || 0) / DENOMINATORS[field], 0);
}

function vectorFromLoadout(set, itemIds, level, calculateItemProperties) {
	const vector = Object.fromEntries(CORE_FIELDS.map((field) => [field, 0]));
	for (const itemId of itemIds) {
		const properties = calculateItemProperties({ name: itemId, level });
		for (const field of CORE_FIELDS) vector[field] += Number(properties[field] || 0);
	}
	const bonus = set[itemIds.length] || {};
	for (const field of CORE_FIELDS) vector[field] += Number(bonus[field] || 0);
	return vector;
}

function legalCompleteLoadouts(set) {
	let rows = [[]];
	for (const slot of ARMOR_SLOTS) {
		const choices = set.bonus_items[slot];
		if (!choices) continue;
		rows = rows.flatMap((row) => choices.map((itemId) => [...row, itemId]));
	}
	return rows;
}

function numericThresholds(set) {
	return Object.keys(set).filter((key) => /^\d+$/.test(key)).map(Number).sort((left, right) => left - right);
}

function thresholdSignatures(set) {
	const signatures = {};
	for (const threshold of numericThresholds(set)) {
		const signature = Object.fromEntries(Object.entries(set[threshold]).filter(([key]) => !CORE_FIELDS.includes(key)));
		if (Object.keys(signature).length) signatures[threshold] = signature;
	}
	return signatures;
}

function stripCore(value) {
	if (Array.isArray(value)) return value.map(stripCore);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.entries(value).filter(([key]) => !CORE_FIELDS.includes(key)).map(([key, entry]) => [key, stripCore(entry)]));
}

function summedCore(values) {
	return Object.fromEntries(CORE_FIELDS.map((field) => [field, values.reduce((total, value) => total + Number(value[field] || 0), 0)]));
}

function allocateByLargestRemainder(total, weightedEntries) {
	const weightTotal = weightedEntries.reduce((sum, entry) => sum + entry.weight, 0);
	const rows = weightedEntries.map((entry) => {
		const exact = total * entry.weight / weightTotal;
		return { ...entry, value: Math.floor(exact), remainder: exact - Math.floor(exact) };
	});
	let remaining = total - rows.reduce((sum, row) => sum + row.value, 0);
	for (const row of [...rows].sort((left, right) => {
		const remainderDifference = right.remainder - left.remainder;
		return Math.abs(remainderDifference) > 1e-12 ? remainderDifference : left.id.localeCompare(right.id);
	})) {
		if (!remaining) break;
		row.value += 1;
		remaining -= 1;
	}
	return Object.fromEntries(rows.map((row) => [row.id, row.value]));
}

function allocateWithPositiveFloor(total, weightedEntries) {
	const floor = Object.fromEntries(weightedEntries.map((entry) => [entry.id, 1]));
	const remainder = allocateByLargestRemainder(total - weightedEntries.length, weightedEntries);
	return Object.fromEntries(weightedEntries.map((entry) => [entry.id, floor[entry.id] + remainder[entry.id]]));
}

function fileSha256(relativePath) {
	return crypto.createHash("sha256").update(fs.readFileSync(path.resolve(__dirname, "../..", relativePath))).digest("hex");
}

function allStrings(value, output = []) {
	if (typeof value === "string") output.push(value);
	else if (Array.isArray(value)) for (const entry of value) allStrings(entry, output);
	else if (value && typeof value === "object") {
		for (const [key, entry] of Object.entries(value)) {
			output.push(key);
			allStrings(entry, output);
		}
	}
	return output;
}

function plain(value) {
	return JSON.parse(JSON.stringify(value));
}

test("the raw catalog publishes the exact six-tier armor metadata contract", () => {
	const data = loadSourceData();
	assert.doesNotThrow(() => validateEquipmentSchema(data.items, data.sets));
	assert.equal(Object.keys(data.sets).length, 20);
	assert.equal(ARMOR_TIER_COUNT, 6);
	assert.deepEqual(ARMOR_PROGRESSION_SET_TIERS, EXPECTED_TIERS);
	assert.deepEqual(
		plain(
		Object.fromEntries(Object.entries(data.sets).filter(([, set]) => set.armor_progression).map(([setId, set]) => [setId, set.armor_progression])),
		),
		EXPECTED_TIERS,
	);
	for (const setId of NON_TIERED_SET_IDS) assert.equal(data.sets[setId].armor_progression, undefined, setId);
	assert.deepEqual(plain(data.sets.basic.bonus_items), {
		helmet: ["helmet"], chest: ["coat"], pants: ["pants"], gloves: ["gloves"], shoes: ["shoes"],
	});
});

test("complete armor tiers follow the exact HP curve and strict equal-enhancement bands", () => {
	const data = loadSourceData();
	const publishedSets = publishCumulativeSetThresholds(data.sets);
	const calculateItemProperties = loadPropertyCalculators(data).current.calculate_item_properties;
	const states = {};
	for (const setId of Object.keys(EXPECTED_TIERS)) {
		states[setId] = {};
		for (let level = 0; level <= 12; level += 1) {
			states[setId][level] = legalCompleteLoadouts(publishedSets[setId]).map((itemIds) => {
				const vector = vectorFromLoadout(publishedSets[setId], itemIds, level, calculateItemProperties);
				return { itemIds, vector, score: score(vector) };
			});
			assert.ok(states[setId][level].length, `${setId}+${level}`);
			assert.ok(states[setId][level].every((row) => Number.isFinite(row.score) && row.score > 0), `${setId}+${level}`);
		}
	}
	for (const [setId, targetHp] of Object.entries(BASE_HP_CURVE)) {
		for (const row of states[setId][0]) {
			assert.equal(row.vector.hp, targetHp, `${setId}+0 HP`);
			assert.deepEqual(row.vector, BASE_CORE_VECTORS[setId], `${setId}+0 core vector`);
		}
	}
	for (let level = 0; level <= 12; level += 1) {
		const byTier = Object.groupBy(
			Object.entries(states).flatMap(([setId, levels]) => levels[level].map((row) => ({ ...row, setId, tier: EXPECTED_TIERS[setId].shared_tier }))),
			(row) => row.tier,
		);
		for (let tier = 1; tier < ARMOR_TIER_COUNT; tier += 1) {
			const lowerMax = Math.max(...byTier[tier].map((row) => row.score));
			const upperMin = Math.min(...byTier[tier + 1].map((row) => row.score));
			assert.ok(lowerMax < upperMin, `tier ${tier}->${tier + 1} at +${level}: ${lowerMax} !< ${upperMin}`);
		}
		const tierFiveScores = byTier[5].map((row) => row.score);
		assert.ok(Math.max(...tierFiveScores) - Math.min(...tierFiveScores) <= ROUNDING_QUANTUM + 1e-12, `tier 5 spread at +${level}`);
	}
});

test("base HP follows exact 1260-point tier steps and pinned slot shares", () => {
	const data = loadSourceData();
	const publishedSets = publishCumulativeSetThresholds(data.sets);
	const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "vanilla-equipment-baseline.json"), "utf8"));
	const progressionSetIds = ["basic", "wanderers", "rugged", "wt3", "wt4", "vampires"];
	const expected = {
		basic: { helmet: [116], chest: [232], pants: [193], gloves: [78], shoes: [77], complete: [700] },
		wanderers: { helmet: [312], chest: [623], pants: [520], gloves: [208], shoes: [208], complete: [1960] },
		rugged: { helmet: [516], chest: [1032], pants: [860], gloves: [344], shoes: [344], complete: [3220] },
		wt3: { helmet: [700], chest: [1399], pants: [1166], gloves: [466], shoes: [466], complete: [4480] },
		wt4: { helmet: [886], chest: [1771], pants: [1476], gloves: [590], shoes: [590], complete: [5740] },
		vampires: { helmet: [934], chest: [1868, 1868], pants: [1556], gloves: [622], shoes: [623], complete: [7000, 7000] },
	};
	const actual = {};
	for (const setId of progressionSetIds) {
		const set = data.sets[setId];
		actual[setId] = Object.fromEntries(ARMOR_SLOTS.map((slot) => [slot, Array.from(set.bonus_items[slot], (itemId) => Number(data.items[itemId].hp || 0))]));
		actual[setId].complete = legalCompleteLoadouts(set).map((itemIds) => vectorFromLoadout(publishedSets[setId], itemIds, 0, ({ name }) => data.items[name]).hp);
		assert.deepEqual(actual[setId], expected[setId], setId);
	}
	for (let index = 1; index < progressionSetIds.length; index += 1) {
		const lowerId = progressionSetIds[index - 1];
		const upperId = progressionSetIds[index];
		for (const field of [...ARMOR_SLOTS, "complete"])
			assert.ok(Math.max(...actual[lowerId][field]) < Math.min(...actual[upperId][field]), `${lowerId}->${upperId}:${field}`);
	}
	for (let index = 1; index < progressionSetIds.length; index += 1)
		assert.equal(BASE_HP_CURVE[progressionSetIds[index]] - BASE_HP_CURVE[progressionSetIds[index - 1]], 1260, progressionSetIds[index]);
	for (const setId of progressionSetIds) {
		const rawHp = numericThresholds(data.sets[setId]).reduce((total, threshold) => total + Number(data.sets[setId][threshold].hp || 0), 0);
		const targetDirectHp = BASE_HP_CURVE[setId] - rawHp;
		const actualDirectHp = ARMOR_SLOTS.reduce((total, slot) => total + actual[setId][slot][0], 0);
		assert.equal(actualDirectHp, targetDirectHp, `${setId} direct HP`);
		const expectedByItem = allocateByLargestRemainder(targetDirectHp, ARMOR_SLOTS.map((slot) => ({ id: data.sets[setId].bonus_items[slot][0], weight: baseline.slot_shares[slot] })));
		assert.deepEqual(Object.fromEntries(ARMOR_SLOTS.map((slot) => {
			const itemId = data.sets[setId].bonus_items[slot][0];
			return [itemId, actual[setId][slot][0]];
		})), expectedByItem, `${setId} vanilla slot allocation`);
		for (const slot of ARMOR_SLOTS)
			for (const hp of actual[setId][slot]) assert.equal(hp, expectedByItem[data.sets[setId].bonus_items[slot][0]], `${setId}.${slot} alternative HP`);
	}
});

test("tier tuning preserves every existing non-core identity and milestone", () => {
	const data = loadSourceData();
	for (const [setId, expected] of Object.entries(TIER_SIGNATURES)) assert.deepEqual(thresholdSignatures(data.sets[setId]), expected, setId);
	const existingTieredSetIds = Object.keys(EXPECTED_TIERS).filter((setId) => setId !== "basic");
	const itemIds = [...new Set(existingTieredSetIds.flatMap((setId) => data.sets[setId].items))].sort();
	assert.equal(
		hash(Object.fromEntries(itemIds.map((itemId) => [itemId, stripCore(data.items[itemId])]))),
		"4d312d6bd90417bf46c003d0e148705e682163530c6c8b22d2b5141972a7f395",
	);
	const darkforgeSet = data.sets.wt4;
	const darkforgeCore = summedCore([
		...Object.values(darkforgeSet.bonus_items).flat().map((itemId) => data.items[itemId]),
		...numericThresholds(darkforgeSet).map((threshold) => darkforgeSet[threshold]),
	]);
	const darkforgeResidualScore = score({ ...darkforgeCore, hp: 0 });
	for (const sourceShape of HUNTER_SOURCE_SHAPES) {
		const sourceValues = [...Object.values(sourceShape.items), ...Object.values(sourceShape.raw)];
		const sourceCore = summedCore(sourceValues);
		const scale = darkforgeResidualScore / score({ ...sourceCore, hp: 0 });
		const hpScale = BASE_HP_CURVE.wt4 / sourceCore.hp;
		for (const setId of sourceShape.sets) {
			const set = data.sets[setId];
			for (const slot of ARMOR_SLOTS) {
				const item = data.items[set.bonus_items[slot][0]];
				const source = sourceShape.items[slot === "helmet" ? "helm" : slot];
				for (const field of CORE_FIELDS) {
					const fieldScale = field === "hp" ? hpScale : scale;
					assert.ok(Math.abs(item[field] - source[field] * fieldScale) / DENOMINATORS[field] <= ROUNDING_QUANTUM + 1e-12, `${setId}.${slot}.${field}`);
				}
				assert.equal(item.upgrade.armor, 7.5, `${setId}.${slot}.upgrade.armor`);
				assert.equal(item.upgrade.resistance || 0, slot === "shoes" ? 3.75 : 7.5, `${setId}.${slot}.upgrade.resistance`);
			}
			for (const threshold of [2, 3, 4, 5]) {
				for (const field of CORE_FIELDS) {
					const fieldScale = field === "hp" ? hpScale : scale;
					assert.ok(Math.abs(set[threshold][field] - sourceShape.raw[threshold][field] * fieldScale) / DENOMINATORS[field] <= ROUNDING_QUANTUM + 1e-12, `${setId}.${threshold}.${field}`);
				}
			}
		}
	}
	assert.equal(data.items.mcape.upgrade.resistance, 8, "minimum Vampire +12 ordering correction");
});

test("Basic applies 700 complete HP while preserving its approved non-HP values and milestones", () => {
	const data = loadSourceData();
	const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "vanilla-equipment-baseline.json"), "utf8"));
	const set = data.sets.basic;
	assert.deepEqual(numericThresholds(set), [2, 3, 4, 5]);
	for (const threshold of [2, 3, 4, 5]) {
		assert.deepEqual(Object.keys(set[threshold]).sort(), [...CORE_FIELDS].sort(), `basic:${threshold}`);
		assert.ok(CORE_FIELDS.every((field) => Number.isFinite(set[threshold][field]) && set[threshold][field] > 0), `basic:${threshold}`);
	}
	const itemIds = ARMOR_SLOTS.map((slot) => set.bonus_items[slot][0]);
	for (const itemId of itemIds) {
		assert.deepEqual(data.items[itemId].requirements, [], itemId);
		assert.deepEqual(data.itemRequirements[itemId], [], itemId);
	}
	assert.deepEqual(Object.fromEntries([2, 3, 4, 5].map((threshold) => [threshold, Object.fromEntries(CORE_FIELDS.map((field) => [field, data.sets.wanderers[threshold][field] || 0]))])), WANDERER_PRE_TUNE_SHAPE_SOURCE.raw);
	const basicDirect = summedCore(itemIds.map((itemId) => data.items[itemId]));
	const basicRawTotals = summedCore([2, 3, 4, 5].map((threshold) => set[threshold]));
	assert.deepEqual(basicDirect, BASIC_DIRECT_CORE_VECTOR);
	assert.deepEqual(basicRawTotals, BASIC_RAW_CHANNEL_TOTALS);
	assert.equal(basicDirect.hp + basicRawTotals.hp, BASE_HP_CURVE.basic);
	for (const field of CORE_FIELDS) {
		const expected = allocateWithPositiveFloor(BASIC_RAW_CHANNEL_TOTALS[field], [2, 3, 4, 5].map((threshold) => ({ id: String(threshold), weight: WANDERER_PRE_TUNE_SHAPE_SOURCE.raw[threshold][field] })));
		assert.deepEqual(Object.fromEntries([2, 3, 4, 5].map((threshold) => [String(threshold), set[threshold][field]])), expected, `basic raw ${field}`);
	}
	for (const slot of ARMOR_SLOTS) {
		const basicItem = data.items[set.bonus_items[slot][0]];
		for (const field of ["armor", "resistance"]) {
			const expected = BASIC_UPGRADE_CORE_BY_SLOT[slot][field];
			const actual = Number(basicItem.upgrade[field] || 0);
			assert.equal(actual, expected, `basic ${slot} upgrade ${field}`);
		}
	}
	const expectedByItem = allocateByLargestRemainder(basicDirect.hp, ARMOR_SLOTS.map((slot) => ({ id: set.bonus_items[slot][0], weight: baseline.slot_shares[slot] })));
	assert.deepEqual(Object.fromEntries(itemIds.map((itemId) => [itemId, Number(data.items[itemId].hp || 0)])), expectedByItem, "basic slot allocation hp");
});

test("reduced genuine sets apply one unchanged production completion payload", () => {
	const data = loadSourceData();
	const publishedSets = publishCumulativeSetThresholds(data.sets);
	assert.deepEqual(REDUCED_ARMOR_SET_COMPLETION_COUNTS, { tiger: 1, mpx: 1, fury: 2, swift: 2, legends: 3, bunny: 3 });
	for (const [setId, completionCount] of Object.entries(REDUCED_ARMOR_SET_COMPLETION_COUNTS)) {
		assert.deepEqual(plain(data.sets[setId].bonus_items), REDUCED_BONUS_ITEMS[setId], setId);
		assert.deepEqual(numericThresholds(data.sets[setId]), [completionCount], setId);
		assert.deepEqual(plain(data.sets[setId][completionCount]), REDUCED_COMPLETION_PAYLOADS[setId], setId);
		assert.deepEqual(publishedSets[setId][completionCount], REDUCED_COMPLETION_PAYLOADS[setId], setId);
		const slots = Object.fromEntries(Object.entries(REDUCED_BONUS_ITEMS[setId]).map(([slot, ids]) => [slot, { name: ids[0] }]));
		const withoutSet = calculateStats({ slots, items: data.items, sets: {} });
		const withSet = calculateStats({ slots, items: data.items, sets: publishedSets });
		assert.deepEqual(withSet.sets, { [setId]: completionCount }, setId);
		assert.equal(withSet.max_hp - withoutSet.max_hp, REDUCED_COMPLETION_PAYLOADS[setId].hp, `${setId}:hp`);
		assert.equal(withSet.max_mp - withoutSet.max_mp, REDUCED_COMPLETION_PAYLOADS[setId].mp, `${setId}:mp`);
		assert.equal(withSet.armor - withoutSet.armor, REDUCED_COMPLETION_PAYLOADS[setId].armor, `${setId}:armor`);
		assert.equal(withSet.resistance - withoutSet.resistance, REDUCED_COMPLETION_PAYLOADS[setId].resistance, `${setId}:resistance`);
	}
	const alternateLegends = calculateStats({
		slots: { chest: { name: "warpvest" }, pants: { name: "starkillers" }, gloves: { name: "goldenpowerglove" } },
		items: data.items,
		sets: publishedSets,
	});
	assert.deepEqual(alternateLegends.sets, { legends: 3 });
	assert.equal(hash(Object.fromEntries(SURVIVING_AFFECTED_ITEM_IDS.map((itemId) => [itemId, data.items[itemId]]))), "eb56d9d1a4dec33494b4a8a6587b4bc753f344a3ae140ead8392d0b49cd4d6de");
	assert.equal(hash(data.sets.holidays), "d5f7a4bf70aea04aef90be25953a9493e1118da55af2c3795aa477e078e987ad");
});

test("only the approved placeholders and their direct acquisition references are retired", () => {
	const data = loadSourceData();
	const retired = [...RETIRED_ARMOR_ITEM_IDS].sort();
	assert.deepEqual(retired, [
		"egloves", "epants", "furyarmor", "furyboots", "furygloves", "legendboots", "legendhelmet", "mpxarmor", "mpxboots",
		"mpxhelmet", "mpxpants", "swiftarmor", "swifthelmet", "swiftpants", "tigerarmor", "tigerboots", "tigergloves", "tigerpants",
	]);
	for (const itemId of retired) assert.equal(data.items[itemId], undefined, itemId);
	const activeReferences = allStrings({ drops: data.drops, craft: data.craft, sets: data.sets }).filter((value) => RETIRED_ARMOR_ITEM_IDS.includes(value));
	assert.deepEqual(activeReferences, []);
	const retained = Object.keys(data.items).filter((itemId) => data.items[itemId].placeholder_art).sort();
	assert.deepEqual(retained, EXPECTED_RETAINED_PLACEHOLDERS);
	assert.equal(hash(Object.fromEntries(retained.map((itemId) => [itemId, stripCore(data.items[itemId])]))), "a83ece274e3e984ab1d9fd9c80b59dff84d7d5df08de16948931eee1eb4e1c87");
	assert.deepEqual(data.drops.monsters.tiger.find((entry) => entry[1] === "open" && entry[2] === "tigerarmorbox"), [0.1, "open", "tigerarmorbox"]);
	assert.deepEqual(data.drops.tigerarmorbox, [[1, "tigerhelmet"]]);
	assert.deepEqual(data.drops.monsters.franky.find((entry) => entry[1] === "open" && entry[2] === "mpxarmorbox"), [1 / 2000, "open", "mpxarmorbox"]);
	assert.deepEqual(data.drops.mpxarmorbox, [[1, "mpxgloves"]]);
	assert.deepEqual(data.drops.armorbox.filter((entry) => ["fury", "fallen"].includes(entry[1])), [[0.001, "fury"], [0.001, "fallen"]]);
	assert.deepEqual(data.drops.basketofeggs.filter((entry) => ["eears", "epyjamas", "eslippers"].includes(entry[1])), [[1, "eears"], [1 / 3, "epyjamas"], [1, "eslippers"]]);
	assert.deepEqual(data.drops.mysterybox.filter((entry) => ["warpvest", "starkillers"].includes(entry[1])), [[1 / 3, "warpvest"]]);
	assert.equal(hash(data.tokens), "c65e7672d59d331e298a023b41713551dd72cda93940ce1bb839abe86a37be00");
	assert.equal(hash(data.npcs), "7ced56518bf86c8a44ea95a456f0e110d2d5926fa8dc927a0f8fc7e1e43a3419");
});

test("frozen conversion, source, loot, weapon-economy, and XP authorities stay byte-identical", () => {
	assert.equal(fileSha256("node/tests/fixtures/vanilla-equipment-baseline.json"), "604acd5da135a7219f83e6afd5261eed5ae9784144b4b2b52858a2101a787a75");
	assert.equal(fileSha256("node/tests/fixtures/direct-effect-conversion.json"), "4a5dd17cff2f2ce6541eb695fb06fa05126f41ecc204dbf225a9f35978041939");
	assert.equal(fileSha256("node/tests/fixtures/protected-monster-loot-baseline.json"), "8889e32c74680af7e180b2836ab0c53dfa31f712f2a24a15ad00d414aa3c6d42");
	assert.equal(fileSha256("node/tests/fixtures/weapon-progression-economy.json"), "d34265df61ec6933a9ce0e6130de71660c342c6e3db5ded2ee4af248341c31c8");
	assert.equal(fileSha256("design/skill_xp.js"), "f71cce91669173e7c5d47c40c94150a1c9848f801cbf03d58ba5d031d5a097dc");
});
