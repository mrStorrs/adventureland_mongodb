"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { DIRECT_EFFECT_KEYS, directDps } = require("../game/direct_effects");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { isCompatibleOffhand } = require("../game/equipment");
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
const { loadSourceData } = require("./acquisition-ranking");
const { serializeFixture } = require("./fixture-serialization");
const { progression } = require("../../design/progression");

const FIXTURE_DIRECTORY = path.resolve(__dirname, "../tests/fixtures");
const COMBAT_SKILLS = Object.freeze(["warrior", "paladin", "mage", "priest", "ranger", "rogue"]);
const REQUIREMENTS = progression.WEAPON_RANK_REQUIREMENTS;
const ARMOR_CORE_FIELDS = Object.freeze(["hp", "mp", "armor", "resistance"]);
const ARMOR_NORMALIZATION_DENOMINATORS = Object.freeze({ hp: 4959.5, mp: 1637.5, armor: 202.5, resistance: 138.66666666666666 });
const ARMOR_ROUNDING_QUANTUM = 1 / ARMOR_NORMALIZATION_DENOMINATORS.resistance;
const ARMOR_BASE_HP_CURVE = Object.freeze({
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
const VAMPIRE_BASE_VECTOR = Object.freeze({ hp: 7000, mp: 929, armor: 192, resistance: 63 });
const BASIC_DIRECT_CORE_VECTOR = Object.freeze({ hp: 696, mp: 51, armor: 0, resistance: 0 });
const BASIC_UPGRADE_CORE_BY_SLOT = Object.freeze({
	helmet: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	chest: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	pants: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	gloves: Object.freeze({ armor: 0.25, resistance: 0.25 }),
	shoes: Object.freeze({ armor: 0.25, resistance: 0 }),
});
// Basic keeps the combat-validated non-HP values and upgrade coefficients captured before the HP-curve correction.
const WANDERER_PRE_TUNE_SHAPE_AGGREGATES = Object.freeze({
	items: Object.freeze({ hp: 357, mp: 201, armor: 26, resistance: 17 }),
	thresholds: Object.freeze({ hp: 89, mp: 51, armor: 6, resistance: 4 }),
});
const BASIC_RAW_CHANNEL_TOTALS = Object.freeze({ hp: 4, mp: 4, armor: 4, resistance: 4 });
const HUNTER_SOURCE_AGGREGATES = Object.freeze({
	mwarrior: Object.freeze({ items: Object.freeze({ hp: 257, mp: 33, armor: 50, resistance: 27 }), thresholds: Object.freeze({ hp: 52, mp: 8, armor: 12, resistance: 7 }) }),
	mpaladin: Object.freeze({ items: Object.freeze({ hp: 257, mp: 33, armor: 50, resistance: 27 }), thresholds: Object.freeze({ hp: 52, mp: 8, armor: 12, resistance: 7 }) }),
	mmage: Object.freeze({ items: Object.freeze({ hp: 1083, mp: 641, armor: 95, resistance: 96 }), thresholds: Object.freeze({ hp: 259, mp: 160, armor: 24, resistance: 24 }) }),
	mpriest: Object.freeze({ items: Object.freeze({ hp: 1083, mp: 641, armor: 95, resistance: 96 }), thresholds: Object.freeze({ hp: 259, mp: 160, armor: 24, resistance: 24 }) }),
	mranger: Object.freeze({ items: Object.freeze({ hp: 3189, mp: 358, armor: 111, resistance: 83 }), thresholds: Object.freeze({ hp: 773, mp: 90, armor: 28, resistance: 21 }) }),
	mrogue: Object.freeze({ items: Object.freeze({ hp: 3189, mp: 358, armor: 111, resistance: 83 }), thresholds: Object.freeze({ hp: 773, mp: 90, armor: 28, resistance: 21 }) }),
	mmerchant: Object.freeze({ items: Object.freeze({ hp: 3189, mp: 358, armor: 111, resistance: 83 }), thresholds: Object.freeze({ hp: 773, mp: 90, armor: 28, resistance: 21 }) }),
});

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function hash(value) {
	return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function loadPropertyCalculators(data = loadSourceData()) {
	const sandbox = { console: { log() {}, error() {} }, Math, min: Math.min, max: Math.max, ceil: Math.ceil, round: Math.round, multipliers: { shells_to_gold: 1 }, G: {} };
	vm.createContext(sandbox);
	for (const file of ["multipliers.js", "smithing.js", "items.js"])
		vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../design", file), "utf8"), sandbox, { filename: file });
	sandbox.G.items = data.items;
	vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../js/old_common_functions.js"), "utf8"), sandbox, { filename: "old_common_functions.js" });
	return { current: { calculate_item_properties: sandbox.calculate_item_properties } };
}

function combatWeapons(data = loadSourceData()) {
	return Object.entries(data.items)
		.filter(([, item]) => item.type === "weapon" && item.progression && item.progression.role !== "smithing" && WEAPON_PROFILES[item.wtype])
		.map(([weapon_id, definition]) => ({
			weapon_id,
			definition,
			skill: WEAPON_PROFILES[definition.wtype].skill,
			shared_rank: definition.progression.shared_rank,
			requirement: definition.progression.requirement,
			role: definition.progression.role,
			target_dps: definition.progression.target_dps,
		}))
		.sort((left, right) => left.weapon_id.localeCompare(right.weapon_id));
}

function weaponStates(data = loadSourceData(), calculators = loadPropertyCalculators(data)) {
	return combatWeapons(data).flatMap(({ weapon_id, definition, skill, shared_rank, role }) => {
		const maximum = definition.upgrade ? 12 : definition.compound ? 10 : 0;
		return Array.from({ length: maximum + 1 }, (_, level) => {
			const properties = calculators.current.calculate_item_properties({ name: weapon_id, level });
			const stats = calculateStats({ slots: { mainhand: { name: weapon_id, level } }, items: data.items, getItemProperties: calculators.current.calculate_item_properties });
			return {
				weapon_id,
				skill,
				shared_rank,
				role,
				level,
				damage: stats.attack,
				heal: Number(properties.heal || 0),
				attacks_per_second: stats.frequency,
				dps: directDps(stats.attack, stats.frequency),
				range: stats.range,
			};
		});
	});
}

function legalLayouts(data = loadSourceData()) {
	const weapons = combatWeapons(data);
	const offhands = Object.entries(data.items)
		.filter(([, item]) => ["weapon", "shield", "source", "quiver", "misc_offhand"].includes(item.type))
		.sort(([left], [right]) => left.localeCompare(right));
	const rows = [];
	for (const { weapon_id: mainhand_id, definition, skill } of weapons) {
		rows.push({ mainhand_id, offhand_id: null, skill, layout_kind: "one_hand" });
		for (const [offhand_id] of offhands)
			if (isCompatibleOffhand({ name: mainhand_id }, { name: offhand_id }, data.items)) rows.push({ mainhand_id, offhand_id, skill, layout_kind: "offhand" });
	}
	return rows.sort((left, right) => left.mainhand_id.localeCompare(right.mainhand_id) || String(left.offhand_id).localeCompare(String(right.offhand_id)));
}

function buildWeaponLoadoutBalanceFixture(data = loadSourceData()) {
	const weapons = combatWeapons(data).map(({ definition, ...row }) => row);
	const states = weaponStates(data);
	const rank_bands = Object.values(Object.groupBy(weapons, (weapon) => weapon.shared_rank))
		.map((group) => ({ shared_rank: group[0].shared_rank, requirement: group[0].requirement, targets_by_skill: Object.fromEntries(group.map((weapon) => [weapon.skill, weapon.target_dps])), weapon_ids: group.map((weapon) => weapon.weapon_id) }))
		.sort((left, right) => left.shared_rank - right.shared_rank);
	const layouts = legalLayouts(data);
	const class_rank_rows = COMBAT_SKILLS.flatMap((skill) => REQUIREMENTS.map((requirement, index) => ({ skill, shared_rank: index + 1, requirement, weapon_ids: weapons.filter((weapon) => weapon.skill === skill && weapon.shared_rank === index + 1).map((weapon) => weapon.weapon_id) })));
	const violations = [];
	for (const skill of COMBAT_SKILLS) {
		for (let level = 0; level <= 12; level += 1) {
			for (let rank = 1; rank < REQUIREMENTS.length; rank += 1) {
				const lower = states.filter((state) => state.skill === skill && state.shared_rank === rank && state.level === level).map((state) => state.dps);
				const higher = states.filter((state) => state.skill === skill && state.shared_rank === rank + 1 && state.level === level).map((state) => state.dps);
				if (lower.length && higher.length && !(Math.min(...higher) > Math.max(...lower))) violations.push({ skill, lower_rank: rank, higher_rank: rank + 1, level, lower_max_dps: Math.max(...lower), higher_min_dps: Math.min(...higher) });
			}
		}
	}
	return {
		schema_version: 4,
		policy: { combat_skills: COMBAT_SKILLS, shared_rank_requirements: REQUIREMENTS, class_multipliers: { warrior: 1, paladin: .9, priest: .9, mage: 1.1, ranger: 1.1, rogue: 1.1 }, cadence_owner: "weapon_definition" },
		counts: { weapons: weapons.length, rank_bands: rank_bands.length, class_rank_rows: class_rank_rows.length, legal_layouts: layouts.length },
		hashes: { weapon_states_sha256: hash(states), legal_layouts_sha256: hash(layouts) },
		weapons,
		rank_bands,
		class_rank_rows,
		weapon_states: states,
		legal_layouts: layouts,
		violations,
	};
}

function buildArmorSetBalanceFixture(data = loadSourceData()) {
	validateEquipmentSchema(data.items, data.sets);
	const calculators = loadPropertyCalculators(data);
	const published = publishCumulativeSetThresholds(data.sets);
	const normalizedCoreScore = (vector) => ARMOR_CORE_FIELDS.reduce((total, field) => total + Number(vector[field] || 0) / ARMOR_NORMALIZATION_DENOMINATORS[field], 0);
	const sumCore = (values) => Object.fromEntries(ARMOR_CORE_FIELDS.map((field) => [field, values.reduce((total, value) => total + Number(value[field] || 0), 0)]));
	const thresholds = (set) => Object.keys(set).filter((key) => /^\d+$/.test(key)).map(Number).sort((left, right) => left - right);
	const legalCompleteLoadouts = (set) => {
		let rows = [[]];
		for (const slot of ARMOR_SLOTS) {
			const choices = set.bonus_items[slot];
			if (!choices) continue;
			rows = rows.flatMap((row) => choices.map((itemId) => [...row, itemId]));
		}
		return rows;
	};
	const sets = {};
	for (const [setId, rawSet] of Object.entries(data.sets).sort(([left], [right]) => left.localeCompare(right))) {
		const publishedSet = published[setId];
		const raw_thresholds = Object.fromEntries(thresholds(rawSet).map((count) => [count, { ...rawSet[count] }]));
		const published_thresholds = Object.fromEntries(thresholds(publishedSet).map((count) => [count, { ...publishedSet[count] }]));
		const complete_states = [];
		if (rawSet.armor_progression) {
			for (let level = 0; level <= 12; level += 1) {
				for (const item_ids of legalCompleteLoadouts(rawSet)) {
					const core = Object.fromEntries(ARMOR_CORE_FIELDS.map((field) => [field, 0]));
					for (const itemId of item_ids) {
						const properties = calculators.current.calculate_item_properties({ name: itemId, level });
						for (const field of ARMOR_CORE_FIELDS) core[field] += Number(properties[field] || 0);
					}
					const bonus = publishedSet[item_ids.length] || {};
					for (const field of ARMOR_CORE_FIELDS) core[field] += Number(bonus[field] || 0);
					complete_states.push({ level, item_ids, core, normalized_core_score: normalizedCoreScore(core) });
				}
			}
		}
		sets[setId] = {
			weight: rawSet.weight,
			raw_thresholds,
			published_thresholds,
			armor_progression: rawSet.armor_progression ? { ...rawSet.armor_progression } : null,
			complete_states,
		};
	}
	const tieredEntries = Object.entries(sets).filter(([, set]) => set.armor_progression);
	const adjacent_tiers = [];
	for (let level = 0; level <= 12; level += 1) {
		for (let lowerTier = 1; lowerTier < ARMOR_TIER_COUNT; lowerTier += 1) {
			const lower = tieredEntries.filter(([, set]) => set.armor_progression.shared_tier === lowerTier).flatMap(([, set]) => set.complete_states.filter((state) => state.level === level).map((state) => state.normalized_core_score));
			const upper = tieredEntries.filter(([, set]) => set.armor_progression.shared_tier === lowerTier + 1).flatMap(([, set]) => set.complete_states.filter((state) => state.level === level).map((state) => state.normalized_core_score));
			const lower_max = Math.max(...lower);
			const upper_min = Math.min(...upper);
			adjacent_tiers.push({ level, lower_tier: lowerTier, upper_tier: lowerTier + 1, lower_max, upper_min, margin: upper_min - lower_max, passed: lower_max < upper_min });
		}
	}
	const tier_five_spreads = Array.from({ length: 13 }, (_, level) => {
		const scores = tieredEntries.filter(([, set]) => set.armor_progression.shared_tier === 5).flatMap(([, set]) => set.complete_states.filter((state) => state.level === level).map((state) => state.normalized_core_score));
		const minimum = Math.min(...scores);
		const maximum = Math.max(...scores);
		return { level, minimum, maximum, spread: maximum - minimum, limit: ARMOR_ROUNDING_QUANTUM, passed: maximum - minimum <= ARMOR_ROUNDING_QUANTUM + 1e-12 };
	});
	const base_anchors = Object.entries(ARMOR_BASE_HP_CURVE).flatMap(([set_id, target]) => sets[set_id].complete_states.filter((state) => state.level === 0).map((state) => ({ set_id, item_ids: state.item_ids, target, actual: state.core.hp, delta: state.core.hp - target, limit: 0, passed: state.core.hp === target })));
	const vampire_base = sets.vampires.complete_states.filter((state) => state.level === 0).map((state) => ({ item_ids: state.item_ids, expected: { ...VAMPIRE_BASE_VECTOR }, actual: state.core, passed: JSON.stringify(state.core) === JSON.stringify(VAMPIRE_BASE_VECTOR) }));
	const basicSet = data.sets.basic;
	const basic_shape = {
		source_set_id: "wanderers",
		scale: null,
		source: WANDERER_PRE_TUNE_SHAPE_AGGREGATES,
		expected_thresholds: BASIC_RAW_CHANNEL_TOTALS,
		actual: {
			items: sumCore(Object.values(basicSet.bonus_items).flat().map((itemId) => data.items[itemId])),
			thresholds: sumCore(thresholds(basicSet).map((count) => basicSet[count])),
		},
	};
	basic_shape.component_score_deltas = Object.fromEntries(["items", "thresholds"].map((component) => {
		const expectedVector = component === "items" ? BASIC_DIRECT_CORE_VECTOR : BASIC_RAW_CHANNEL_TOTALS;
		const expected = normalizedCoreScore(expectedVector);
		const actual = normalizedCoreScore(basic_shape.actual[component]);
		const normalized_delta = Math.abs(actual - expected);
		return [component, { expected, actual, normalized_delta, passed: JSON.stringify(basic_shape.actual[component]) === JSON.stringify(expectedVector) }];
	}));
	basic_shape.upgrade_deltas = Object.fromEntries(ARMOR_SLOTS.map((slot) => {
		const basicItem = data.items[basicSet.bonus_items[slot][0]];
		return [slot, Object.fromEntries(["armor", "resistance"].map((field) => {
			const expected = BASIC_UPGRADE_CORE_BY_SLOT[slot][field];
			const actual = Number(basicItem.upgrade[field] || 0);
			return [field, { expected, actual, delta: Math.abs(actual - expected), passed: actual === expected }];
		}))];
	}));
	basic_shape.passed = Object.values(basic_shape.component_score_deltas).every((row) => row.passed)
		&& JSON.stringify(basic_shape.actual.thresholds) === JSON.stringify(basic_shape.expected_thresholds)
		&& Object.values(basic_shape.upgrade_deltas).every((slot) => Object.values(slot).every((row) => row.passed));
	const darkforgeCore = sets.wt4.complete_states.find((state) => state.level === 0).core;
	const darkforgeResidualScore = normalizedCoreScore({ ...darkforgeCore, hp: 0 });
	const hunter_shape_retention = Object.entries(HUNTER_SOURCE_AGGREGATES).map(([set_id, source]) => {
		const rawSet = data.sets[set_id];
		const actual = {
			items: sumCore(Object.values(rawSet.bonus_items).flat().map((itemId) => data.items[itemId])),
			thresholds: sumCore(thresholds(rawSet).map((count) => rawSet[count])),
		};
		const sourceComplete = sumCore([source.items, source.thresholds]);
		const scale = darkforgeResidualScore / normalizedCoreScore({ ...sourceComplete, hp: 0 });
		const hpScale = ARMOR_BASE_HP_CURVE[set_id] / sourceComplete.hp;
		const deltas = Object.fromEntries(["items", "thresholds"].map((component) => [component, Object.fromEntries(ARMOR_CORE_FIELDS.map((field) => {
			const expected = source[component][field] * (field === "hp" ? hpScale : scale);
			const normalized_delta = Math.abs(actual[component][field] - expected) / ARMOR_NORMALIZATION_DENOMINATORS[field];
			return [field, { expected, actual: actual[component][field], normalized_delta, passed: normalized_delta <= ARMOR_ROUNDING_QUANTUM + 1e-12 }];
		}))]));
		return { set_id, source, scale, actual, deltas, passed: Object.values(deltas).every((component) => Object.values(component).every((row) => row.passed)) };
	});
	const violations = [
		...adjacent_tiers.filter((row) => !row.passed).map((row) => ({ code: "adjacent_tier_crossing", ...row })),
		...tier_five_spreads.filter((row) => !row.passed).map((row) => ({ code: "tier_five_spread", ...row })),
		...base_anchors.filter((row) => !row.passed).map((row) => ({ code: "base_anchor_drift", ...row })),
		...vampire_base.filter((row) => !row.passed).map((row) => ({ code: "vampire_base_drift", ...row })),
		...(!basic_shape.passed ? [{ code: "basic_shape_drift", details: basic_shape }] : []),
		...hunter_shape_retention.filter((row) => !row.passed).map((row) => ({ code: "hunter_shape_drift", set_id: row.set_id, deltas: row.deltas })),
	];
	const rawThresholdEvidence = Object.fromEntries(Object.entries(sets).map(([setId, set]) => [setId, set.raw_thresholds]));
	const completeStateEvidence = Object.fromEntries(tieredEntries.map(([setId, set]) => [setId, set.complete_states]));
	return {
		schema_version: 4,
		policy: {
			core_fields: [...ARMOR_CORE_FIELDS],
			normalization_denominators: { ...ARMOR_NORMALIZATION_DENOMINATORS },
			rounding_quantum: ARMOR_ROUNDING_QUANTUM,
			enhancement_levels: Array.from({ length: 13 }, (_, level) => level),
			basic_shape_source: "wanderers",
			ordering: "strict_equal_enhancement",
			set_threshold_publication: "production_cumulative",
		},
		counts: { sets: Object.keys(sets).length, tiered_sets: tieredEntries.length, non_tiered_sets: Object.keys(sets).length - tieredEntries.length, tiers: ARMOR_TIER_COUNT },
		sets,
		comparisons: { base_anchors, vampire_base, adjacent_tiers, tier_five_spreads, basic_shape, hunter_shape_retention },
		contracts: {
			retired_item_ids: [...RETIRED_ARMOR_ITEM_IDS],
			reduced_set_completion_counts: { ...REDUCED_ARMOR_SET_COMPLETION_COUNTS },
		},
		hashes: {
			tier_metadata_sha256: hash(ARMOR_PROGRESSION_SET_TIERS),
			raw_thresholds_sha256: hash(rawThresholdEvidence),
			complete_states_sha256: hash(completeStateEvidence),
			retirement_contract_sha256: hash(RETIRED_ARMOR_ITEM_IDS),
		},
		violations,
	};
}

function buildBalanceContract(data = loadSourceData()) {
	const weapons = buildWeaponLoadoutBalanceFixture(data);
	return {
		schema_version: 5,
		failure_policy: "fail-closed",
		direct_effect_keys: [...DIRECT_EFFECT_KEYS],
		weapon_authority: { fixture: "weapon-loadout-balance.json", weapon_count: weapons.counts.weapons, rank_count: weapons.counts.rank_bands, cadence_owner: weapons.policy.cadence_owner, endpoint_tolerance: 1e-9 },
		armor_authority: { fixture: "armor-set-balance.json", set_count: Object.keys(data.sets).length, tiered_set_count: Object.keys(ARMOR_PROGRESSION_SET_TIERS).length, tier_count: ARMOR_TIER_COUNT, enhancement_levels: 13, core_fields: [...ARMOR_CORE_FIELDS], ordering: "strict_equal_enhancement" },
		acquisition_identity: "stable-item-ids-and-requirements",
		violations: [],
	};
}

function buildAcquisitionRanking(data = loadSourceData()) {
	const weapons = combatWeapons(data).map(({ definition, ...row }) => ({ ...row, wtype: definition.wtype, requirement: (data.itemRequirements[row.weapon_id] || [])[0]?.level ?? row.requirement }));
	return {
		schema_version: 7,
		policy: { combat_skills: COMBAT_SKILLS, shared_rank_requirements: REQUIREMENTS, identity: "direct-effects" },
		counts: { weapons: weapons.length, ranks: REQUIREMENTS.length },
		weapons,
		hashes: { weapon_identity_sha256: hash(weapons.map(({ weapon_id, skill, wtype, requirement }) => ({ weapon_id, skill, wtype, requirement }))), direct_weapon_values_sha256: hash(weaponStates(data)) },
	};
}

function buildParityFixture(data = loadSourceData()) {
	const states = weaponStates(data).filter((row) => row.level <= 4);
	return {
		schema_version: 2,
		diagnostic_only: true,
		historical_baseline: "weapon-progression-legacy-baseline.json",
		weapons: combatWeapons(data).map(({ definition, ...row }) => ({ ...row, wtype: definition.wtype })),
		states,
		hashes: { states_sha256: hash(states) },
	};
}

function buildCombatMatrixFixture(data = loadSourceData()) {
	return require("./monster-combat-tiers").buildEquipmentCombatMatrix(data);
}

function fixturePath(name) {
	return path.join(FIXTURE_DIRECTORY, name);
}

function writeFixture(name, value) {
	if (Array.isArray(value?.violations) && value.violations.length) throw new Error(`${name} has balance violations`);
	fs.writeFileSync(fixturePath(name), serializeFixture(value));
}

function verifyFixture(name, build) {
	const actual = JSON.parse(fs.readFileSync(fixturePath(name), "utf8"));
	const expected = build();
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${name} drifted from the direct equipment authority`);
	return expected;
}

function main(argv = process.argv.slice(2)) {
	const definitions = {
		"weapon-loadout-balance.json": buildWeaponLoadoutBalanceFixture,
		"armor-set-balance.json": buildArmorSetBalanceFixture,
		"equipment-balance-contract.json": buildBalanceContract,
		"weapon-acquisition-ranking.json": buildAcquisitionRanking,
		"weapon-progression-parity.json": buildParityFixture,
		"equipment-combat-matrix.json": buildCombatMatrixFixture,
	};
	const name = argv.find((value) => value.startsWith("--fixture="))?.slice("--fixture=".length);
	if (!name || !definitions[name]) throw new Error("Use --fixture=<direct equipment fixture>");
	if (argv.includes("--write")) {
		writeFixture(name, definitions[name]());
		return;
	}
	if (!argv.includes("--verify")) throw new Error("Use --verify or --write");
	verifyFixture(name, definitions[name]);
}

module.exports = { COMBAT_SKILLS, REQUIREMENTS, buildAcquisitionRanking, buildArmorSetBalanceFixture, buildBalanceContract, buildCombatMatrixFixture, buildParityFixture, buildWeaponLoadoutBalanceFixture, combatWeapons, fixturePath, hash, legalLayouts, loadPropertyCalculators, main, verifyFixture, weaponStates, writeFixture };

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
