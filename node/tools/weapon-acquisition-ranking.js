"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { calculateStats } = require("../game/stats");
const { isCompatibleOffhand } = require("../game/equipment");
const { loadPropertyCalculators } = require("./weapon-progression-parity");
const acquisition = require("./acquisition-ranking");
const {
	FORBIDDEN_DROP_TABLES,
	FORMULAS,
	assertAcyclicSourceGraph,
	buildProductionAcquisitionResolver,
	clone,
	compactRoute,
	dropOutcomeProbability,
	expectedEnhancedCopies,
	loadSourceData,
	roundEvidence,
	routeOverrideMap,
	fixtureSha256: sha256,
	stableJson,
	sourceGraph,
	validateAvailabilityOverrides,
} = acquisition;

const RANKING_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-acquisition-ranking.json");
const VANILLA_BASELINE_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/vanilla-equipment-baseline.json");
const COMBAT_SKILLS = Object.freeze(["warrior", "paladin", "mage", "priest", "ranger", "rogue"]);
const EXCLUDED_WEAPON_IDS = Object.freeze(["axe3", "bow4", "staff2", "staff3", "staff4"]);
const SHARED_RANK_REQUIREMENTS = Object.freeze([1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99]);
const REFERENCE_LEVELS = Object.freeze(SHARED_RANK_REQUIREMENTS.map((_, index) => Math.round(1 + 69 * index / (SHARED_RANK_REQUIREMENTS.length - 1))));
const PLACEHOLDER_BOOK_RANKS = Object.freeze({ wbook2: 2, wbook3: 3, wbook4: 4, wbook5: 5, wbook6: 7, wbook7: 8, wbook8: 9, wbook9: 10 });
const PLACEHOLDER_WEAPON_IDS = Object.freeze(Object.keys(PLACEHOLDER_BOOK_RANKS));
const RETAINED_WEAPON_COUNT = 75;
const VISIBLE_WEAPON_COUNT = RETAINED_WEAPON_COUNT + PLACEHOLDER_WEAPON_IDS.length;
const CATALOG_WEAPON_COUNT = VISIBLE_WEAPON_COUNT + EXCLUDED_WEAPON_IDS.length;
const FORBIDDEN_DROP_TABLE_WEAPON_EXCEPTIONS = Object.freeze({
	vsword: Object.freeze(["glitch", "lglitch"]),
});

function loadRankingFixture(filename = RANKING_FIXTURE_PATH) {
	const fixture = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (
		!fixture ||
		![2, 3, 4].includes(fixture.schema_version) ||
		!fixture.policy ||
		!Array.isArray(fixture.availability_overrides) ||
		!fixture.counts ||
		!Array.isArray(fixture.selected_dependency_routes)
	)
		throw new Error("Weapon acquisition ranking fixture is invalid");
	return fixture;
}

function combatWeaponOwners(data) {
	const owners = new Map();
	for (const skill of COMBAT_SKILLS) {
		const definition = data.skills[skill];
		if (!definition || definition.kind !== "combat") throw new Error(`Combat skill ${skill} is missing`);
		for (const weaponType of definition.weapon_types || []) {
			if (owners.has(weaponType)) throw new Error(`Weapon type ${weaponType} has multiple combat owners`);
			owners.set(weaponType, skill);
		}
	}
	return owners;
}

function catalogRows(data) {
	const owners = combatWeaponOwners(data);
	return Object.entries(data.items)
		.filter(([, definition]) => definition.type === "weapon" && owners.has(definition.wtype))
		.map(([weaponId, definition]) => {
			const requirements = data.itemRequirements[weaponId] || [];
			const skill = owners.get(definition.wtype);
			if (requirements.length !== 1 || requirements[0].skill !== skill || !Number.isSafeInteger(requirements[0].level))
				throw new Error(`Weapon ${weaponId} does not have one owning-skill requirement`);
			return {
				weapon_id: weaponId,
				skill,
				weapon_type: definition.wtype,
				damage_type: definition.damage_type || null,
				requirement_level: requirements[0].level,
				ignored: definition.ignore === true,
			};
		})
		.sort((left, right) => left.weapon_id.localeCompare(right.weapon_id));
}

function assignSemanticRanks(rows, threshold = 0.05) {
	if (!(threshold >= 0 && threshold < 1)) throw new Error(`Invalid semantic rank threshold ${threshold}`);
	const sorted = rows.map(clone).sort((left, right) => left.selected_effort - right.selected_effort || left.weapon_id.localeCompare(right.weapon_id));
	let anchor;
	let rank = 0;
	for (const row of sorted) {
		if (anchor === undefined || row.selected_effort > anchor * (1 + threshold)) {
			rank += 1;
			anchor = row.selected_effort;
		}
		row.rank = rank;
		row.rank_anchor = anchor;
	}
	return sorted;
}

function baselineWeaponDps(data, calculators, weaponId) {
	const stats = calculateStats({
		slots: { mainhand: { name: weaponId, level: 0 } },
		items: data.items,
		getItemProperties: calculators.current.calculate_item_properties,
	});
	return { dps: stats.attack * stats.frequency };
}

function loadVanillaBaseline(filename = VANILLA_BASELINE_FIXTURE_PATH) {
	const baseline = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!baseline || baseline.schema_version !== 1 || !Array.isArray(baseline.role_rows) || !baseline.weapon_rank_endpoint_oracle?.start?.base_dps || !baseline.weapon_rank_endpoint_oracle?.end?.base_dps)
		throw new Error("Vanilla full-sheet rank endpoint fixture is invalid");
	return baseline;
}

function classCoreItem(core, skill) {
	return {
		type: "class_core",
		name: `Pinned ${skill} class core`,
		str: core.str,
		dex: core.dex,
		int: core.int,
		vit: core.vit,
		hp: core.hp - 100 - core.vit * 48,
		mp: core.mp - 100 - core.int * 15,
		armor: core.armor,
		resistance: core.resistance,
	};
}

function enhancementStepMultiplier(kind, level) {
	if (kind === "upgrade") {
		if (level === 7 || level === 11 || level === 12) return 1.25;
		if (level === 8) return 1.5;
		if (level === 9) return 2;
		if (level === 10) return 3;
		return 1;
	}
	if (kind === "compound") {
		if (level === 5) return 1.25;
		if (level === 6) return 1.5;
		if (level === 7) return 2;
		if (level >= 8) return 3;
		return 1;
	}
	return 0;
}

function cumulativeEnhancementMultiplier(kind, level) {
	let total = 0;
	for (let current = 1; current <= level; current += 1) total += enhancementStepMultiplier(kind, current);
	return total;
}

function fullSheetContext(data, calculators, baseline, weapon) {
	const referenceLevel = REFERENCE_LEVELS[weapon.shared_rank - 1];
	const role = baseline.role_rows.find((row) => row.skill === weapon.skill && row.level === referenceLevel);
	if (!role) throw new Error(`Missing full-sheet role row ${weapon.skill}:${referenceLevel}`);
	const statType = role.loadout.weapon_slot.stat_type;
	const mainhand = { name: weapon.weapon_id, level: 0, stat_type: statType };
	const targetEntries = Object.entries(role.loadout.target_items)
		.filter(([, item]) => item.item_id && data.items[item.item_id])
		.map(([slot, item]) => [slot, { name: item.item_id, level: item.level || 0, stat_type: item.stat_type || statType }]);
	const targetOffhand = targetEntries.find(([slot]) => slot === "offhand");
	const compatibleOffhand = targetOffhand && isCompatibleOffhand(mainhand, targetOffhand[1], data.items) ? targetOffhand : null;
	const equipmentEntries = targetEntries.filter(([slot]) => slot !== "offhand");
	if (compatibleOffhand) equipmentEntries.push(compatibleOffhand);
	const frozenEntries = Object.entries(role.loadout.frozen_slots)
		.filter(([, item]) => data.items[item.item_id])
		.map(([slot, item]) => [slot, { name: item.item_id, level: item.level || 0, stat_type: item.stat_type || statType }]);
	const classItem = classCoreItem(role.class_core, role.skill);
	const items = { ...data.items, __class_core: classItem };
	const fixedSlots = {
		...Object.fromEntries(equipmentEntries),
		...Object.fromEntries(frozenEntries),
		class_core: { name: "__class_core", level: 0 },
	};
	const definition = data.items[weapon.weapon_id];
	const enhancementKind = definition.compound ? "compound" : definition.upgrade ? "upgrade" : null;
	const cache = new Map();
	const evaluateState = (level, attack, attackGrowth, allocation, { offhand = undefined } = {}) => {
		const offhandKey = offhand === undefined ? "canonical" : offhand === null ? "none" : `${offhand.name}:${offhand.level || 0}:${offhand.stat_type || ""}`;
		const key = `${level}:${attack}:${attackGrowth}:${allocation.str}:${allocation.int}:${allocation.dex}:${offhandKey}`;
		if (cache.has(key)) return cache.get(key);
		const getItemProperties = (instance, definition) => {
			if (instance.name === "__class_core") return definition;
			const properties = calculators.current.calculate_item_properties(instance);
			if (instance.name !== weapon.weapon_id) return properties;
			const multiplier = cumulativeEnhancementMultiplier(enhancementKind, Number(instance.level || 0));
			return {
				...properties,
				attack: Math.round(attack + attackGrowth * multiplier),
				...Object.fromEntries(["str", "int", "dex"].map((field) => [field, Number(properties[field] || 0) - Number(definition[field] || 0) + allocation[field]])),
			};
		};
		const slots = { mainhand: { ...mainhand, level }, ...fixedSlots };
		if (offhand === null) delete slots.offhand;
		else if (offhand !== undefined) slots.offhand = offhand;
		const sheet = calculateStats({ slots, items, sets: data.sets, getItemProperties });
		const candidate = {
			attack,
			str: allocation.str,
			int: allocation.int,
			dex: allocation.dex,
			dps: roundEvidence(sheet.attack * sheet.frequency),
			quantum: roundEvidence(sheet.frequency),
			sheet_attack: sheet.attack,
			sheet_frequency: roundEvidence(sheet.frequency),
			sheet_str: sheet.str,
			sheet_int: sheet.int,
			sheet_dex: sheet.dex,
		};
		Object.defineProperty(candidate, "sheet", { value: sheet, enumerable: false });
		cache.set(key, candidate);
		return candidate;
	};
	const sourceGrowth = Number(definition[enhancementKind]?.attack || 0);
	const evaluate = (attack, allocation) => evaluateState(0, attack, sourceGrowth, allocation);
	return {
		reference_level: referenceLevel,
		offhand_id: compatibleOffhand?.[1].name || null,
		armor_ids: equipmentEntries.filter(([slot]) => ["helmet", "chest", "pants", "gloves", "shoes"].includes(slot)).map(([, item]) => item.name),
		cape_id: equipmentEntries.find(([slot]) => slot === "cape")?.[1].name || null,
		frozen_accessory_ids: frozenEntries.map(([, item]) => item.name),
		class_core: clone(role.class_core),
		hand_attack_factor: definition.wtype === "stars" && compatibleOffhand && data.items[compatibleOffhand[1].name]?.wtype !== "stars" ? 1 / 3 : 1,
		evaluate,
		evaluateState,
	};
}

function rankBand(policy, rank) {
	return {
		lower: rank === 1 ? policy.values[0] : policy.boundaries[rank - 2],
		upper: rank === policy.values.length ? policy.values.at(-1) : policy.boundaries[rank - 1],
		lower_inclusive: rank !== policy.values.length,
		upper_inclusive: rank === policy.values.length,
	};
}

function candidateInsideBand(candidate, band) {
	const lowerPass = band.lower_inclusive ? candidate.dps >= band.lower - 1e-12 : candidate.dps > band.lower + 1e-12;
	const upperPass = band.upper_inclusive ? candidate.dps <= band.upper + 1e-12 : candidate.dps < band.upper - 1e-12;
	return candidate.dps > 0 && lowerPass && upperPass;
}

function weaponDpsCandidates(data, calculators, baseline, weapon, targetPolicy) {
	const context = fullSheetContext(data, calculators, baseline, weapon);
	const target = targetPolicy.values[weapon.shared_rank - 1];
	const band = rankBand(targetPolicy, weapon.shared_rank);
	const zero = { str: 0, int: 0, dex: 0 };
	const base = context.evaluate(0, zero);
	if (base.sheet_attack !== 0) throw new Error(`Canonical non-weapon sheet contributes attack for ${weapon.weapon_id}`);
	const definition = data.items[weapon.weapon_id];
	const dexFrequency = (dex) => Math.min(dex, 160) / 640 + Math.max(dex - 160, 0) / 925;
	const magicFrequency = (intelligence) => 1 + Math.min(0.2, Math.max(intelligence, 0) / 2000);
	const physicalFrequencyConstant = base.sheet_frequency - dexFrequency(base.sheet_dex);
	const magicalFrequencyConstant = base.sheet_frequency / magicFrequency(base.sheet_int);
	const modeledFrequency = (allocation) => roundEvidence(
		WEAPON_PROFILES[definition.wtype]?.damage_type === "magical"
			? magicalFrequencyConstant * magicFrequency(base.sheet_int + allocation.int)
			: physicalFrequencyConstant + dexFrequency(base.sheet_dex + allocation.dex),
	);
	const attackMultiplier = (allocation) => {
		const str = base.sheet_str + allocation.str;
		const intelligence = base.sheet_int + allocation.int;
		if (["warrior", "ranger", "rogue"].includes(weapon.skill)) return str / 20 * context.hand_attack_factor;
		if (weapon.skill === "paladin") return (str / 20 + intelligence / 40) * context.hand_attack_factor;
		if (weapon.skill === "mage") return intelligence / 20 * context.hand_attack_factor;
		if (weapon.skill === "priest") return intelligence / 20 * 1.6 * context.hand_attack_factor;
		throw new Error(`Unsupported full-sheet skill ${weapon.skill}`);
	};
	const candidateState = (allocation, attack) => {
		const frequency = modeledFrequency(allocation);
		const multiplier = attackMultiplier(allocation);
		if (!(frequency > 0) || !(multiplier > 0)) return null;
		const sheetAttack = Math.round(attack * multiplier);
		return {
			attack,
			...allocation,
			dps: roundEvidence(sheetAttack * frequency),
			quantum: frequency,
			sheet_attack: sheetAttack,
			sheet_frequency: frequency,
			sheet_str: base.sheet_str + allocation.str,
			sheet_int: base.sheet_int + allocation.int,
			sheet_dex: base.sheet_dex + allocation.dex,
		};
	};
	const firstIntegerSatisfying = (predicate, label) => {
		if (predicate(0)) return 0;
		let lower = 0;
		let upper = 1;
		while (!predicate(upper)) {
			lower = upper;
			if (upper > Number.MAX_SAFE_INTEGER / 2) throw new Error(`Unbounded full-sheet search for ${weapon.weapon_id} ${label}`);
			upper *= 2;
		}
		while (lower + 1 < upper) {
			const middle = lower + Math.floor((upper - lower) / 2);
			if (predicate(middle)) upper = middle;
			else lower = middle;
		}
		return upper;
	};
	const signatureOrder = (left, right) => left.str + left.int + left.dex - right.str - right.int - right.dex || left.str - right.str || left.int - right.int || left.dex - right.dex || left.attack - right.attack;
	const selectionOrder = (left, right) => Math.abs(Math.log(left.dps / target)) - Math.abs(Math.log(right.dps / target)) || left.dps - right.dps || signatureOrder(left, right);
	const coreEnvelope = targetPolicy.core_allocation_envelope;
	const coreCeiling = Number(coreEnvelope?.ceilings?.[weapon.shared_rank - 1]);
	if (!Number.isSafeInteger(coreCeiling) || coreCeiling < 0) throw new Error(`Missing endpoint-derived core envelope for ${weapon.weapon_id}`);
	let allocationCount = 0;
	let candidateCount = 0;
	let lower = null;
	let upper = null;
	let minimum = null;
	let maximum = null;
	let chosen = null;
	const consider = (candidate) => {
		if (!candidate || !(candidate.sheet_attack > 0) || !(candidate.dps > 0)) return;
		candidateCount += 1;
		if (!minimum || candidate.dps < minimum.dps || candidate.dps === minimum.dps && signatureOrder(candidate, minimum) < 0) minimum = candidate;
		if (!maximum || candidate.dps > maximum.dps || candidate.dps === maximum.dps && signatureOrder(candidate, maximum) < 0) maximum = candidate;
		if (candidate.dps <= target && (!lower || candidate.dps > lower.dps || candidate.dps === lower.dps && signatureOrder(candidate, lower) < 0)) lower = candidate;
		if (candidate.dps >= target && (!upper || candidate.dps < upper.dps || candidate.dps === upper.dps && signatureOrder(candidate, upper) < 0)) upper = candidate;
		if (candidateInsideBand(candidate, band) && (!chosen || selectionOrder(candidate, chosen) < 0)) chosen = candidate;
	};
	const addAttackBracket = (allocation) => {
		allocationCount += 1;
		const upperAttack = firstIntegerSatisfying((attack) => {
			const candidate = candidateState(allocation, attack);
			return candidate && candidate.dps >= target;
		}, "attack target bracket");
		for (const attack of new Set([Math.max(1, upperAttack - 1), Math.max(1, upperAttack)])) consider(candidateState(allocation, attack));
	};
	let domain;
	if (["warrior", "ranger", "rogue", "paladin"].includes(weapon.skill)) {
		const paladin = weapon.skill === "paladin";
		if (paladin) {
			for (let primary = 0; primary <= coreCeiling * 2; primary += 1) {
				const str = Math.floor(primary / 2);
				const int = primary % 2;
				for (let dex = 0; str + int + dex <= coreCeiling; dex += 1) addAttackBracket({ str, int, dex });
			}
		} else {
			for (let str = 0; str <= coreCeiling; str += 1)
				for (let dex = 0; str + dex <= coreCeiling; dex += 1) addAttackBracket({ str, int: 0, dex });
		}
		domain = {
			representation: paladin
				? "paladin:primary=2*str+int,int<2,dex,total_core<=ceiling; two int is DPS-equivalent to one str and loses the minimum-core tie-break"
				: "physical:str,dex,total_core<=ceiling;int=0",
			enumerated_maximum: paladin ? { total_core: coreCeiling, primary: coreCeiling * 2, dex: coreCeiling } : { total_core: coreCeiling, str: coreCeiling, dex: coreCeiling },
			equivalent_allocation_reduction: paladin ? "Every omitted int>=2 allocation has an equal-DPS lower-core str/int representation and cannot win the approved stable tie-break." : null,
		};
	} else {
		for (let intelligence = 0; intelligence <= coreCeiling; intelligence += 1) addAttackBracket({ str: 0, int: intelligence, dex: 0 });
		domain = {
			representation: "magical:int,total_core<=ceiling;str=0,dex=0",
			enumerated_maximum: { total_core: coreCeiling, int: coreCeiling },
		};
	}
	if (!candidateCount) throw new Error(`No finite full-sheet attack candidates for ${weapon.weapon_id}`);
	lower ||= minimum;
	upper ||= maximum;
	if (!chosen)
		throw new Error(`No full-sheet candidate inside rank ${weapon.shared_rank} band for ${weapon.weapon_id}: target ${target}, lower ${band.lower}, upper ${band.upper}, bracket ${lower.dps}/${upper.dps}`);
	const verified = context.evaluate(chosen.attack, { str: chosen.str, int: chosen.int, dex: chosen.dex });
	if (verified.attack !== chosen.attack || verified.str !== chosen.str || verified.int !== chosen.int || verified.dex !== chosen.dex || verified.sheet_attack !== chosen.sheet_attack || Math.abs(verified.dps - chosen.dps) > 1e-8)
		throw new Error(`Full-sheet candidate model drifted for ${weapon.weapon_id}`);
	return {
		context,
		zero_allocation_current_sheet: {
			str: base.sheet_str,
			int: base.sheet_int,
			dex: base.sheet_dex,
			frequency: base.sheet_frequency,
		},
		lower,
		upper,
		chosen: verified,
		band,
		domain: {
			rule: "endpoint-offensive-core-envelope",
			core_constraints: "nonnegative integer DPS-affecting allocations whose total does not exceed the endpoint-derived rank ceiling; irrelevant fields are fixed to zero",
			rank_upper_boundary: band.upper,
			core_envelope: {
				fields: clone(coreEnvelope.fields),
				endpoints: clone(coreEnvelope.endpoints),
				growth_factor: coreEnvelope.growth_factor,
				rank: weapon.shared_rank,
				exact_value: coreEnvelope.exact_values[weapon.shared_rank - 1],
				ceiling: coreCeiling,
				integerization: coreEnvelope.integerization,
			},
			allocation_count: allocationCount,
			candidate_count: candidateCount,
			allocation_proof: "Every nonnegative DPS-affecting integer allocation inside the endpoint-derived total-core ceiling is enumerated directly or by a lower-core DPS-equivalent Paladin representation.",
			attack_proof: "For every legal allocation, monotone positive attack is searched to the exact target bracket; those two neighbors contain every possible log-nearest candidate.",
			...domain,
		},
	};
}

function compareAssignmentSignatures(left, right) {
	for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
		for (const field of ["dps", "attack", "str", "int", "dex"])
			if (Number(left[index][field] || 0) !== Number(right[index][field] || 0)) return Number(left[index][field] || 0) - Number(right[index][field] || 0);
		const weaponOrder = left[index].weapon_id.localeCompare(right[index].weapon_id);
		if (weaponOrder) return weaponOrder;
	}
	return left.length - right.length;
}

function rankGroupConfigurations(group, candidateSets) {
	const configurations = new Map();
	function visit(index, selected, cost, minimum, maximum) {
		if (index === group.length) {
			if (!(minimum > 0)) return;
			const key = `${minimum}|${maximum}`;
			const candidate = { min: minimum, max: maximum, cost, selected: clone(selected) };
			const existing = configurations.get(key);
			if (!existing || cost < existing.cost - 1e-12 || Math.abs(cost - existing.cost) < 1e-12 && compareAssignmentSignatures(selected, existing.selected) < 0)
				configurations.set(key, candidate);
			return;
		}
		const row = group[index];
		for (const option of candidateSets.get(row.weapon_id)) {
			visit(
				index + 1,
				[...selected, { weapon_id: row.weapon_id, ...option }],
				cost + Math.abs(Math.log(option.dps / row.assigned_dps_target)),
				minimum === undefined ? option.dps : Math.min(minimum, option.dps),
				maximum === undefined ? option.dps : Math.max(maximum, option.dps),
			);
		}
	}
	visit(0, [], 0, undefined, undefined);
	return [...configurations.values()].sort((left, right) => left.min - right.min || left.max - right.max || left.cost - right.cost);
}

function pruneSolverStates(states) {
	const byMaximum = new Map();
	for (const state of states) {
		const existing = byMaximum.get(state.max);
		if (!existing || state.cost < existing.cost - 1e-12 || Math.abs(state.cost - existing.cost) < 1e-12 && compareAssignmentSignatures(state.selected, existing.selected) < 0)
			byMaximum.set(state.max, state);
	}
	return [...byMaximum.values()].sort(
		(left, right) => left.max - right.max || left.cost - right.cost || compareAssignmentSignatures(left.selected, right.selected),
	);
}

function validateAllocatedRows(rows) {
	const orderedRanks = [...new Set(rows.map((row) => row.rank))].sort((left, right) => left - right);
	let previousRequirementMaximum = -Infinity;
	let previousTargetMaximum = -Infinity;
	let previousSolvedMaximum = -Infinity;
	for (const rank of orderedRanks) {
		const group = rows.filter((row) => row.rank === rank);
		const solvedMinimum = Math.min(...group.map((row) => row.solved_dps));
		const solvedMaximum = Math.max(...group.map((row) => row.solved_dps));
		if (!(solvedMinimum > 0)) throw new Error(`Nonpositive full-sheet DPS at rank ${rank}`);
		if (Math.min(...group.map((row) => row.assigned_requirement)) < previousRequirementMaximum)
			throw new Error(`Requirement inversion at rank ${rank}`);
		if (Math.min(...group.map((row) => row.assigned_dps_target)) + 1e-12 < previousTargetMaximum)
			throw new Error(`DPS target inversion at rank ${rank}`);
		if (Math.min(...group.map((row) => row.solved_dps)) <= previousSolvedMaximum + 1e-12)
			throw new Error(`Solved DPS inversion at rank ${rank}`);
		for (const row of group) {
			if (row.rank_band && !row.rank_band.quantization_probe) {
				const lowerPass = row.rank_band.lower_inclusive ? row.solved_dps >= row.rank_band.lower - 1e-12 : row.solved_dps > row.rank_band.lower + 1e-12;
				const upperPass = row.rank_band.upper_inclusive ? row.solved_dps <= row.rank_band.upper + 1e-12 : row.solved_dps < row.rank_band.upper - 1e-12;
				if (!lowerPass || !upperPass) throw new Error(`Full-sheet rank band failed for ${row.weapon_id}`);
			}
		}
		previousRequirementMaximum = Math.max(...group.map((row) => row.assigned_requirement));
		previousTargetMaximum = Math.max(...group.map((row) => row.assigned_dps_target));
		previousSolvedMaximum = Math.max(...group.map((row) => row.solved_dps));
	}
	const totalError = rows.reduce((sum, row) => sum + Math.abs(Math.log(row.solved_dps / row.assigned_dps_target)), 0);
	return { total_log_error: roundEvidence(totalError) };
}

function solveRankedDpsCandidates(rows, candidateInput) {
	const ordered = rows.map(clone).sort((left, right) => left.rank - right.rank || left.weapon_id.localeCompare(right.weapon_id));
	const candidateSets = candidateInput instanceof Map ? candidateInput : new Map(Object.entries(candidateInput || {}));
	for (const row of ordered) {
		const candidates = candidateSets.get(row.weapon_id);
		if (!Array.isArray(candidates) || !candidates.length) throw new Error(`Missing DPS candidates for ${row.weapon_id}`);
	}
	let states = [{ max: 0, cost: 0, selected: [] }];
	for (let index = 0; index < ordered.length; ) {
		const rank = ordered[index].rank;
		const group = [];
		while (index < ordered.length && ordered[index].rank === rank) group.push(ordered[index++]);
		const configurations = rankGroupConfigurations(group, candidateSets);
		const nextStates = [];
		for (const configuration of configurations) {
			const eligible = states.filter((state) => state.max < configuration.min - 1e-12);
			if (!eligible.length) continue;
			eligible.sort((left, right) => left.cost - right.cost || compareAssignmentSignatures(left.selected, right.selected));
			const previous = eligible[0];
			nextStates.push({
				max: configuration.max,
				cost: previous.cost + configuration.cost,
				selected: [...previous.selected, ...configuration.selected],
			});
		}
		states = pruneSolverStates(nextStates);
		if (!states.length) throw new Error(`No globally feasible DPS allocation for ${ordered[0]?.skill} rank ${rank}`);
	}
	states.sort((left, right) => left.cost - right.cost || compareAssignmentSignatures(left.selected, right.selected));
	return { total_error: roundEvidence(states[0].cost), selections: clone(states[0].selected) };
}

function allocateSkillBudgets(data, calculators, baseline, rows, { requirements = null, targetPolicy = null } = {}) {
	const requirementSlots = requirements || rows.map((row) => row.baseline_requirement).sort((left, right) => left - right);
	const dpsTargets = targetPolicy?.values || rows.map((row) => row.baseline_dps).sort((left, right) => left - right);
	const ordered = rows.map(clone).sort((left, right) => left.rank - right.rank || left.weapon_id.localeCompare(right.weapon_id));
	for (let index = 0; index < ordered.length; index += 1) {
		const rankIndex = targetPolicy ? ordered[index].rank - 1 : index;
		ordered[index].assigned_requirement = requirementSlots[rankIndex];
		ordered[index].assigned_dps_target = dpsTargets[rankIndex];
		ordered[index].reference_level = REFERENCE_LEVELS[rankIndex];
		if (ordered[index].origin === "placeholder") ordered[index].baseline_dps = ordered[index].assigned_dps_target;
	}
	for (const row of ordered) {
		const result = weaponDpsCandidates(data, calculators, baseline, row, targetPolicy);
		const selection = result.chosen;
		row.solved_attack = selection.attack;
		row.solved_str = selection.str;
		row.solved_int = selection.int;
		row.solved_dex = selection.dex;
		row.solved_dps = selection.dps;
		row.solved_dps_error = roundEvidence(selection.dps - row.assigned_dps_target);
		row.dps_quantum = selection.quantum;
		row.rank_band = clone(result.band);
		row.full_sheet_context = {
			reference_level: result.context.reference_level,
			offhand_id: result.context.offhand_id,
			armor_ids: result.context.armor_ids,
			cape_id: result.context.cape_id,
			frozen_accessory_ids: result.context.frozen_accessory_ids,
			class_core: result.context.class_core,
			zero_allocation_current_sheet: result.zero_allocation_current_sheet,
		};
		row.quantization = {
			target: row.assigned_dps_target,
			domain: clone(result.domain),
			lower: clone(result.lower),
			upper: clone(result.upper),
			chosen: clone(selection),
			signed_relative_error: roundEvidence(selection.dps / row.assigned_dps_target - 1),
			absolute_relative_error: roundEvidence(Math.abs(selection.dps / row.assigned_dps_target - 1)),
			absolute_log_error: roundEvidence(Math.abs(Math.log(selection.dps / row.assigned_dps_target))),
		};
	}
	const validation = validateAllocatedRows(ordered);
	if (!(validation.total_log_error >= 0)) throw new Error(`Invalid solver result for ${ordered[0]?.skill}`);
	return ordered;
}

function exclusionRows(data, catalog, calculators) {
	return EXCLUDED_WEAPON_IDS.map((weaponId) => {
		const row = catalog.find((candidate) => candidate.weapon_id === weaponId);
		if (!row || !row.ignored) throw new Error(`Named exclusion ${weaponId} is not an ignored combat weapon`);
		return {
			weapon_id: weaponId,
			reason: "Published combat weapon is hidden with ignore: true",
			source_field: `design/items.js:items.${weaponId}.ignore`,
			unchanged_requirement: row.requirement_level,
			unchanged_dps: roundEvidence(baselineWeaponDps(data, calculators, weaponId).dps),
		};
	});
}

function applicationStatus(evidence, data) {
	const requirementMismatches = [];
	const attackMismatches = [];
	const attackGrowthMismatches = [];
	const coreMismatches = [];
	const progressionMetadataMismatches = [];
	for (const target of evidence.weapons || []) {
		const requirements = data.itemRequirements[target.weapon_id] || [];
		const currentRequirement = requirements.length === 1 && requirements[0].skill === target.skill ? requirements[0].level : null;
		if (currentRequirement !== target.assigned_requirement)
			requirementMismatches.push({ weapon_id: target.weapon_id, expected: target.assigned_requirement, current: currentRequirement });
		const currentAttack = Number(data.items[target.weapon_id]?.attack);
		if (currentAttack !== target.solved_attack)
			attackMismatches.push({ weapon_id: target.weapon_id, expected: target.solved_attack, current: currentAttack });
		const currentCore = Object.fromEntries(["str", "int", "dex"].map((field) => [field, Number(data.items[target.weapon_id]?.[field] || 0)]));
		const expectedCore = { str: target.solved_str, int: target.solved_int, dex: target.solved_dex };
		if (stableJson(currentCore) !== stableJson(expectedCore)) coreMismatches.push({ weapon_id: target.weapon_id, expected: expectedCore, current: currentCore });
		const expectedProgression = {
			historical_rank: target.historical_rank,
			shared_rank: target.shared_rank,
			role: target.role,
			requirement: target.assigned_requirement,
			reference_level: target.reference_level,
			target_dps: target.assigned_dps_target,
			full_sheet_hit_damage: target.quantization.chosen.sheet_attack,
			attacks_per_second: target.quantization.chosen.sheet_frequency,
			base_dps: target.solved_dps,
			selected_effort: target.selected_effort,
		};
		const currentProgression = data.items[target.weapon_id]?.progression || null;
		if (stableJson(currentProgression) !== stableJson(expectedProgression)) progressionMetadataMismatches.push({ weapon_id: target.weapon_id, expected: expectedProgression, current: currentProgression });
		if (target.enhancement_kind) {
			const currentGrowth = Number(data.items[target.weapon_id]?.[target.enhancement_kind]?.attack || 0);
			if (Math.abs(currentGrowth - target.solved_attack_growth) > 1e-9)
				attackGrowthMismatches.push({ weapon_id: target.weapon_id, expected: target.solved_attack_growth, current: currentGrowth });
		}
	}
	const mismatchedIds = new Set([...requirementMismatches, ...attackMismatches, ...attackGrowthMismatches, ...coreMismatches, ...progressionMetadataMismatches].map((row) => row.weapon_id));
	return {
		status: mismatchedIds.size ? "pending" : "applied",
		applied_weapon_count: (evidence.weapons || []).length - mismatchedIds.size,
		requirement_mismatches: requirementMismatches,
		attack_mismatches: attackMismatches,
		attack_growth_mismatches: attackGrowthMismatches,
		core_mismatches: coreMismatches,
		progression_metadata_mismatches: progressionMetadataMismatches,
	};
}

function retainedAcquisitionProjection(weapons) {
	return weapons
		.filter((weapon) => weapon.origin === "retained")
		.map((weapon) => ({
			weapon_id: weapon.weapon_id,
			skill: weapon.skill,
			weapon_type: weapon.weapon_type,
			damage_type: weapon.damage_type,
			selected_route_id: weapon.selected_route_id,
			selected_effort: weapon.selected_effort,
			baseline_requirement: weapon.baseline_requirement,
			baseline_dps: weapon.baseline_dps,
			historical_rank: weapon.historical_rank,
			historical_rank_anchor: weapon.historical_rank_anchor,
		}))
		.sort((left, right) => left.weapon_id.localeCompare(right.weapon_id));
}

function rankTargetValues(baseline) {
	const endpoints = clone(baseline.weapon_rank_endpoint_oracle);
	const minimum = Number(endpoints.start.base_dps);
	const maximum = Number(endpoints.end.base_dps);
	if (!(minimum > 0) || !(maximum > minimum)) throw new Error("Full-sheet rank endpoints are invalid");
	const growth = Math.pow(maximum / minimum, 1 / (SHARED_RANK_REQUIREMENTS.length - 1));
	const values = SHARED_RANK_REQUIREMENTS.map((_, index) =>
		index === 0 ? minimum : index === SHARED_RANK_REQUIREMENTS.length - 1 ? maximum : roundEvidence(minimum * Math.pow(growth, index)),
	);
	const boundaries = values.slice(0, -1).map((value, index) => roundEvidence(Math.sqrt(value * values[index + 1])));
	const offensiveCoreTotal = (endpoint) => ["str", "dex", "int"].reduce((sum, field) => sum + Number(endpoint.sheet?.[field] || 0), 0);
	const coreMinimum = offensiveCoreTotal(endpoints.start);
	const coreMaximum = offensiveCoreTotal(endpoints.end);
	if (!Number.isSafeInteger(coreMinimum) || !Number.isSafeInteger(coreMaximum) || !(coreMinimum > 0) || !(coreMaximum > coreMinimum))
		throw new Error("Full-sheet endpoint offensive-core totals are invalid");
	const coreGrowth = Math.pow(coreMaximum / coreMinimum, 1 / (SHARED_RANK_REQUIREMENTS.length - 1));
	const coreExactValues = SHARED_RANK_REQUIREMENTS.map((_, index) =>
		index === 0 ? coreMinimum : index === SHARED_RANK_REQUIREMENTS.length - 1 ? coreMaximum : roundEvidence(coreMinimum * Math.pow(coreGrowth, index)),
	);
	const coreCeilings = coreExactValues.map((value, index) =>
		index === 0 ? coreMinimum : index === coreExactValues.length - 1 ? coreMaximum : Math.floor(value),
	);
	return {
		endpoints,
		growth_factor: roundEvidence(growth),
		values,
		boundaries,
		core_allocation_envelope: {
			formula: "floor(start_offensive_core * (end_offensive_core / start_offensive_core) ^ ((rank - 1) / 10))",
			fields: ["str", "dex", "int"],
			endpoints: { start: coreMinimum, end: coreMaximum },
			growth_factor: roundEvidence(coreGrowth),
			exact_values: coreExactValues,
			ceilings: coreCeilings,
			integerization: "exact endpoints; floor interior ranks",
		},
	};
}

function assignSharedRanks(rows) {
	const ranked = rows.map(clone);
	for (const skill of COMBAT_SKILLS) {
		const skillRows = ranked.filter((row) => row.skill === skill);
		const retained = skillRows.filter((row) => row.origin === "retained");
		const historicalMaximum = Math.max(...retained.map((row) => row.historical_rank));
		for (const row of skillRows) {
			row.shared_rank = row.origin === "placeholder"
				? PLACEHOLDER_BOOK_RANKS[row.weapon_id]
				: 1 + Math.round((row.historical_rank - 1) * (SHARED_RANK_REQUIREMENTS.length - 1) / (historicalMaximum - 1));
			row.rank = row.shared_rank;
		}
		const acquisitionOrder = skillRows.slice().sort((left, right) => left.selected_effort - right.selected_effort || left.weapon_id.localeCompare(right.weapon_id));
		for (let index = 1; index < acquisitionOrder.length; index += 1)
			if (acquisitionOrder[index].shared_rank < acquisitionOrder[index - 1].shared_rank)
				throw new Error(`Shared-rank acquisition inversion for ${skill}: ${acquisitionOrder[index - 1].weapon_id} -> ${acquisitionOrder[index].weapon_id}`);
		const present = [...new Set(skillRows.map((row) => row.shared_rank))].sort((left, right) => left - right);
		if (stableJson(present) !== stableJson(SHARED_RANK_REQUIREMENTS.map((_, index) => index + 1)))
			throw new Error(`Shared-rank coverage is incomplete for ${skill}`);
		for (let rank = 1; rank <= SHARED_RANK_REQUIREMENTS.length; rank += 1) {
			const group = skillRows
				.filter((row) => row.shared_rank === rank)
				.sort((left, right) => left.selected_effort - right.selected_effort || left.weapon_id.localeCompare(right.weapon_id));
			group.forEach((row, index) => { row.role = index === 0 ? "progression" : "sidegrade"; });
		}
	}
	return ranked;
}

function enhancementStates(context, row, attackGrowth) {
	const allocation = { str: row.solved_str, int: row.solved_int, dex: row.solved_dex };
	return Array.from({ length: 6 }, (_, level) => context.evaluateState(level, row.solved_attack, attackGrowth, allocation));
}

function enhancementStatesPass(states) {
	return states.every((state) => Number.isFinite(state.dps) && state.dps > 0) &&
		states.every((state, index) => index === 0 || state.dps + 1e-12 >= states[index - 1].dps);
}

function minimumPassingAttackGrowth(context, row, proposedGrowth) {
	const proposedStates = enhancementStates(context, row, proposedGrowth);
	if (enhancementStatesPass(proposedStates)) return { growth: roundEvidence(proposedGrowth), adjusted: false, states: proposedStates };
	let lower = proposedGrowth;
	let upper = Math.max(1, proposedGrowth * 2);
	for (let attempts = 0; attempts < 64 && !enhancementStatesPass(enhancementStates(context, row, upper)); attempts += 1) upper *= 2;
	if (!enhancementStatesPass(enhancementStates(context, row, upper))) throw new Error(`No finite nondecreasing +0 through +5 attack growth for ${row.weapon_id}`);
	for (let attempt = 0; attempt < 80; attempt += 1) {
		const midpoint = (lower + upper) / 2;
		if (enhancementStatesPass(enhancementStates(context, row, midpoint))) upper = midpoint;
		else lower = midpoint;
	}
	let growth = roundEvidence(upper + Math.max(1e-10, Math.abs(upper) * 1e-10));
	let states = enhancementStates(context, row, growth);
	for (let attempt = 0; attempt < 16 && !enhancementStatesPass(states); attempt += 1) {
		growth = roundEvidence(growth + Math.max(1e-9, Math.abs(growth) * 1e-9));
		states = enhancementStates(context, row, growth);
	}
	if (!enhancementStatesPass(states)) throw new Error(`Rounded +0 through +5 attack growth failed for ${row.weapon_id}`);
	return { growth, adjusted: true, states };
}

function attachEnhancementGrowth(rows, data, pinnedWeapons, calculators, baseline) {
	const retainedPriestRatios = rows
		.filter((row) => row.origin === "retained" && row.skill === "priest")
		.map((row) => {
			const pinned = pinnedWeapons.get(row.weapon_id);
			const definition = data.items[row.weapon_id];
			const kind = pinned.enhancement_kind || (definition.compound ? "compound" : definition.upgrade ? "upgrade" : null);
			const baseAttack = Number(pinned.pre_regeneration_attack ?? pinned.solved_attack ?? definition.attack);
			const growth = Number(pinned.pre_regeneration_attack_growth ?? definition[kind]?.attack ?? 0);
			return baseAttack > 0 ? growth / baseAttack : 0;
		})
		.sort((left, right) => left - right);
	const medianPriestRatio = retainedPriestRatios[Math.floor(retainedPriestRatios.length / 2)];
	for (const row of rows) {
		const pinned = pinnedWeapons.get(row.weapon_id) || {};
		const definition = data.items[row.weapon_id];
		const enhancementKind = pinned.enhancement_kind || (definition.compound ? "compound" : definition.upgrade ? "upgrade" : null);
		if (!enhancementKind) throw new Error(`Weapon ${row.weapon_id} has no enhancement kind`);
		row.enhancement_kind = enhancementKind;
		if (row.origin === "retained") {
			row.pre_regeneration_attack = Number(pinned.pre_regeneration_attack ?? pinned.solved_attack ?? definition.attack);
			row.pre_regeneration_attack_growth = Number(pinned.pre_regeneration_attack_growth ?? definition[enhancementKind]?.attack ?? 0);
			row.attack_scale = roundEvidence(row.solved_attack / row.pre_regeneration_attack);
			row.solved_attack_growth = roundEvidence(row.pre_regeneration_attack_growth * row.solved_attack / row.pre_regeneration_attack);
		} else {
			row.attack_scale = null;
			row.solved_attack_growth = roundEvidence(row.solved_attack * medianPriestRatio);
		}
		if (!(row.solved_attack_growth >= 0) || !Number.isFinite(row.solved_attack_growth))
			throw new Error(`Weapon ${row.weapon_id} has invalid enhancement attack growth`);
		const context = fullSheetContext(data, calculators, baseline, row);
		const solved = minimumPassingAttackGrowth(context, row, row.solved_attack_growth);
		row.pre_monotonic_attack_growth = row.solved_attack_growth;
		row.solved_attack_growth = solved.growth;
		row.attack_growth_adjusted_for_monotonicity = solved.adjusted;
		row.enhancement_states = solved.states.map((state, level) => ({
			level,
			hit_damage: state.sheet_attack,
			attacks_per_second: state.sheet_frequency,
			base_dps: state.dps,
		}));
	}
	return roundEvidence(medianPriestRatio);
}

function buildAcquisitionRanking({ evidence = loadRankingFixture(RANKING_FIXTURE_PATH), data = loadSourceData(), baseline = loadVanillaBaseline(), allowFixtureMigration = false } = {}) {
	if (stableJson(evidence.policy.combat_skills) !== stableJson(COMBAT_SKILLS)) throw new Error("Ranking policy combat skills drifted");
	if (stableJson(evidence.policy.forbidden_drop_tables) !== stableJson(FORBIDDEN_DROP_TABLES))
		throw new Error("Ranking policy forbidden drop tables drifted");
	if (stableJson(evidence.policy.forbidden_drop_table_weapon_exceptions) !== stableJson(FORBIDDEN_DROP_TABLE_WEAPON_EXCEPTIONS))
		throw new Error("Ranking policy forbidden drop-table weapon exceptions drifted");
	if (evidence.policy.neutral_assumptions?.enhancement_offerings !== false)
		throw new Error("Ranking policy must explicitly disable optional enhancement offerings");
	if (!evidence.source_artifact_hashes || typeof evidence.source_artifact_hashes !== "object")
		throw new Error("Ranking fixture source artifact hashes are missing");
	assertAcyclicSourceGraph(sourceGraph(data));
	const catalog = catalogRows(data);
	if (catalog.length !== CATALOG_WEAPON_COUNT) throw new Error(`Expected ${CATALOG_WEAPON_COUNT} legal combat weapons, found ${catalog.length}`);
	const eligibleCatalog = catalog.filter((row) => !row.ignored);
	if (eligibleCatalog.length !== VISIBLE_WEAPON_COUNT) throw new Error(`Expected ${VISIBLE_WEAPON_COUNT} visible combat weapons, found ${eligibleCatalog.length}`);
	const ignoredIds = catalog.filter((row) => row.ignored).map((row) => row.weapon_id).sort();
	if (stableJson(ignoredIds) !== stableJson(EXCLUDED_WEAPON_IDS)) throw new Error("Ignored combat weapon exclusions drifted");
	const retainedEvidence = (evidence.weapons || []).filter((weapon) => weapon.origin !== "placeholder");
	const evidencePlaceholderIds = new Set((evidence.weapons || []).filter((weapon) => weapon.origin === "placeholder").map((weapon) => weapon.weapon_id));
	const expectedEvidenceCatalogCount = RETAINED_WEAPON_COUNT + EXCLUDED_WEAPON_IDS.length + evidencePlaceholderIds.size;
	if (!Array.isArray(evidence.weapons) || retainedEvidence.length !== RETAINED_WEAPON_COUNT || !Array.isArray(evidence.catalog_manifest) || evidence.catalog_manifest.length !== expectedEvidenceCatalogCount)
		throw new Error("Ranking fixture pinned baseline is incomplete");
	const pinnedWeapons = new Map(retainedEvidence.map((weapon) => [weapon.weapon_id, weapon]));
	for (const placeholder of (evidence.weapons || []).filter((weapon) => weapon.origin === "placeholder")) pinnedWeapons.set(placeholder.weapon_id, placeholder);
	const pinnedCatalog = new Map(evidence.catalog_manifest.map((row) => [row.weapon_id, row]));
	for (const current of catalog) {
		if (PLACEHOLDER_WEAPON_IDS.includes(current.weapon_id) && !evidencePlaceholderIds.has(current.weapon_id)) continue;
		const pinned = pinnedCatalog.get(current.weapon_id);
		if (!pinned) throw new Error(`Ranking fixture pinned catalog omits ${current.weapon_id}`);
		for (const field of ["skill", "weapon_type", "damage_type", "ignored"])
			if (stableJson(current[field]) !== stableJson(pinned[field])) throw new Error(`Ranking fixture pinned catalog ${current.weapon_id} changed ${field}`);
	}

	const { medians, resolver, runtimeSnapshot, directSources } = buildProductionAcquisitionResolver({ evidence, data });
	const calculators = loadPropertyCalculators(data);
	const unallocated = [];
	const unclassifiedWeaponIds = [];
	const allUsedRouteIds = new Set();
	for (const catalogRow of eligibleCatalog) {
		const routes = resolver.allRoutes(catalogRow.weapon_id);
		if (!routes.length) {
			unclassifiedWeaponIds.push(catalogRow.weapon_id);
			continue;
		}
		for (const route of routes) {
			for (const tableId of route.drop_tables || []) {
				if (
					FORBIDDEN_DROP_TABLES.includes(tableId) &&
					!FORBIDDEN_DROP_TABLE_WEAPON_EXCEPTIONS[catalogRow.weapon_id]?.includes(tableId)
				)
					throw new Error(`Forbidden drop table ${tableId} leaked into ${catalogRow.weapon_id}`);
			}
			allUsedRouteIds.add(route.route_id);
			for (const dependencyRouteId of route.dependency_route_ids || []) allUsedRouteIds.add(dependencyRouteId);
			if (route.availability_override_id) allUsedRouteIds.add(route.availability_override_id);
			for (const overrideId of route.availability_override_ids || []) allUsedRouteIds.add(overrideId);
		}
		const selected = routes[0];
		const pinned = pinnedWeapons.get(catalogRow.weapon_id);
		const origin = PLACEHOLDER_WEAPON_IDS.includes(catalogRow.weapon_id) ? "placeholder" : "retained";
		if (origin === "retained" && !pinned) throw new Error(`Ranking fixture pinned weapon baseline omits ${catalogRow.weapon_id}`);
		if (origin === "placeholder" && selected.route_id !== `craft:${catalogRow.weapon_id}`)
			throw new Error(`Priest placeholder ${catalogRow.weapon_id} does not select its permanent craft route`);
		if (origin === "retained" && pinned && (selected.route_id !== pinned.selected_route_id || Math.abs(selected.effort - pinned.selected_effort) > 1e-9))
			throw new Error(`Retained acquisition decision drifted for ${catalogRow.weapon_id}`);
		unallocated.push({
			weapon_id: catalogRow.weapon_id,
			skill: catalogRow.skill,
			weapon_type: catalogRow.weapon_type,
			damage_type: catalogRow.damage_type,
			routes,
			selected_route_id: selected.route_id,
			selected_effort: selected.effort,
			origin,
			baseline_requirement: origin === "retained" ? pinned.baseline_requirement : catalogRow.requirement_level,
			baseline_dps: origin === "retained" ? pinned.baseline_dps : null,
			historical_rank: origin === "retained" ? Number(pinned.historical_rank ?? pinned.rank) : null,
			historical_rank_anchor: origin === "retained" ? Number(pinned.historical_rank_anchor ?? pinned.rank_anchor) : null,
		});
	}
	if (unclassifiedWeaponIds.length)
		throw new Error(`Unclassified intended source for: ${unclassifiedWeaponIds.sort().join(", ")}`);
	const availableOverrides = routeOverrideMap(evidence);
	const missingOverrides = [...directSources.requiredOverrideIds]
		.filter((routeId) => !availableOverrides.has(routeId))
		.sort();
	if (missingOverrides.length) throw new Error(`Missing availability override for: ${missingOverrides.join(", ")}`);
	const availableRouteIds = new Set([...allUsedRouteIds, ...resolver.routeSources.keys(), ...directSources.requiredOverrideIds]);
	validateAvailabilityOverrides(evidence.availability_overrides, availableRouteIds, evidence.source_artifact_hashes);

	const targetPolicy = rankTargetValues(baseline);
	const sharedRows = assignSharedRanks(unallocated);
	const allocated = [];
	for (const skill of COMBAT_SKILLS) {
		const ranked = sharedRows.filter((weapon) => weapon.skill === skill);
		allocated.push(...allocateSkillBudgets(data, calculators, baseline, ranked, {
			requirements: SHARED_RANK_REQUIREMENTS,
			targetPolicy,
		}));
	}
	allocated.sort((left, right) => left.skill.localeCompare(right.skill) || left.rank - right.rank || left.selected_effort - right.selected_effort || left.weapon_id.localeCompare(right.weapon_id));
	const medianPriestAttackGrowthRatio = attachEnhancementGrowth(allocated, data, pinnedWeapons, calculators, baseline);

	const exclusions = clone(evidence.exclusions);
	for (const excluded of exclusions) {
		const current = catalog.find((row) => row.weapon_id === excluded.weapon_id);
		if (!current || current.requirement_level !== excluded.unchanged_requirement)
			throw new Error(`Excluded weapon ${excluded.weapon_id} requirement drifted`);
		const currentDps = roundEvidence(baselineWeaponDps(data, calculators, excluded.weapon_id).dps);
		if (currentDps !== excluded.unchanged_dps) throw new Error(`Excluded weapon ${excluded.weapon_id} DPS drifted`);
	}
	const requirementMultisets = Object.fromEntries(
		COMBAT_SKILLS.map((skill) => [skill, allocated.filter((row) => row.skill === skill && row.origin === "retained").map((row) => row.baseline_requirement).sort((left, right) => left - right)]),
	);
	const dpsMultisets = Object.fromEntries(
		COMBAT_SKILLS.map((skill) => [skill, allocated.filter((row) => row.skill === skill && row.origin === "retained").map((row) => row.baseline_dps).sort((left, right) => left - right)]),
	);
	const acquisitionInputs = {
		character_starter: data.character.starter.weapons,
		craft: data.craft,
		drops: data.drops,
		maps: data.maps,
		monster_gold: data.monsterGold,
		monsters: data.monsters,
		npcs: data.npcs,
		runtime_snapshot: runtimeSnapshot,
		tokens: data.tokens,
		upgrades: data.upgrades,
		compounds: data.compounds,
	};
	const compactWeapons = allocated.map((weapon) => ({ ...weapon, routes: weapon.routes.map(compactRoute) }));
	const rankedWeaponIds = new Set(compactWeapons.map((weapon) => weapon.weapon_id));
	const dependencyRouteResults = [...resolver.routeResults.entries()]
		.filter(([itemId]) => !rankedWeaponIds.has(itemId))
		.flatMap(([itemId, routes]) => routes.map((route) => ({ item_id: itemId, ...compactRoute(route) })))
		.sort((left, right) => left.item_id.localeCompare(right.item_id) || left.effort - right.effort || left.route_id.localeCompare(right.route_id));
	const routeSourceEntries = [...resolver.routeSources.entries()];
	for (const override of evidence.availability_overrides) {
		if (routeSourceEntries.some(([routeId]) => routeId === override.route_id)) continue;
		routeSourceEntries.push([
			override.route_id,
			{
				source_path: `${override.source_artifact}:${override.source_field}`,
				availability_override_id: override.route_id,
			},
		]);
	}
	const routeSources = Object.fromEntries(routeSourceEntries.sort(([left], [right]) => left.localeCompare(right)));
	const orderedAvailabilityOverrides = clone(evidence.availability_overrides).sort((left, right) => left.route_id.localeCompare(right.route_id));
	const routeResultMap = new Map();
	for (const weapon of compactWeapons)
		for (const route of weapon.routes) routeResultMap.set(`${weapon.weapon_id}|${route.route_id}`, { item_id: weapon.weapon_id, ...route });
	for (const route of dependencyRouteResults) routeResultMap.set(`${route.item_id}|${route.route_id}`, route);
	const retainedSelectedDependencies = new Map();
	function collectRetainedDependency(itemId, routeId) {
		const key = `${itemId}|${routeId}`;
		if (retainedSelectedDependencies.has(key)) return;
		const result = routeResultMap.get(key);
		if (!result) throw new Error(`Retained selected dependency route ${key} is missing`);
		const { item_id: resultItemId, ...route } = result;
		const expanded = { item_id: resultItemId, ...clone(routeSources[route.route_id] || {}), ...clone(route) };
		retainedSelectedDependencies.set(key, expanded);
		for (const input of expanded.recursive_inputs || []) collectRetainedDependency(input.item_id, input.selected_route_id);
	}
	for (const weapon of compactWeapons.filter((row) => row.origin === "retained")) {
		const selected = weapon.routes.find((route) => route.route_id === weapon.selected_route_id);
		const expanded = { ...clone(routeSources[selected.route_id] || {}), ...clone(selected) };
		const pinned = pinnedWeapons.get(weapon.weapon_id);
		if (stableJson(expanded) !== stableJson(pinned.selected_route)) throw new Error(`Retained selected-route evidence drifted for ${weapon.weapon_id}`);
		for (const input of expanded.recursive_inputs || []) collectRetainedDependency(input.item_id, input.selected_route_id);
	}
	const retainedSelectedDependencyRoutes = [...retainedSelectedDependencies.values()].sort(
		(left, right) => left.item_id.localeCompare(right.item_id) || left.route_id.localeCompare(right.route_id),
	);
	const expectedRetainedDependencies = evidence.retained_selected_dependency_routes || evidence.selected_dependency_routes;
	if (stableJson(retainedSelectedDependencyRoutes) !== stableJson(expectedRetainedDependencies))
		throw new Error("Retained selected dependency evidence drifted");
	const routeIdentityManifest = [
		...compactWeapons.flatMap((weapon) =>
			weapon.routes.map((route) => ({ item_id: weapon.weapon_id, route_id: route.route_id, kind: route.kind, role: "weapon" })),
		),
		...dependencyRouteResults.map((route) => ({ item_id: route.item_id, route_id: route.route_id, kind: route.kind, role: "dependency" })),
	].sort((left, right) =>
		left.role.localeCompare(right.role) ||
		left.item_id.localeCompare(right.item_id) ||
		left.route_id.localeCompare(right.route_id) ||
		left.kind.localeCompare(right.kind),
	);
	const routeGraphSha256 = sha256({
		weapons: compactWeapons.map((weapon) => ({ weapon_id: weapon.weapon_id, routes: weapon.routes })),
		dependency_route_results: dependencyRouteResults,
		route_sources: routeSources,
	});
	const retainedRouteIds = new Set(compactWeapons.filter((weapon) => weapon.origin === "retained").flatMap((weapon) => weapon.routes.map((route) => route.route_id)));
	const retainedRouteSources = Object.fromEntries(Object.entries(routeSources).filter(([routeId]) => retainedRouteIds.has(routeId) || !routeId.startsWith("craft:wbook")));
	const retainedRouteGraphSha256 = sha256({
		weapons: compactWeapons.filter((weapon) => weapon.origin === "retained").map((weapon) => ({ weapon_id: weapon.weapon_id, routes: weapon.routes })),
		dependency_route_results: dependencyRouteResults,
		route_sources: retainedRouteSources,
	});
	const retainedRouteIdentityManifest = routeIdentityManifest.filter((row) => row.role === "dependency" || !PLACEHOLDER_WEAPON_IDS.includes(row.item_id));
	const retainedProjection = retainedAcquisitionProjection(compactWeapons);
	const generated = {
		schema_version: 4,
		policy: {
			combat_skills: [...COMBAT_SKILLS],
			forbidden_drop_tables: [...FORBIDDEN_DROP_TABLES],
			forbidden_drop_table_weapon_exceptions: clone(FORBIDDEN_DROP_TABLE_WEAPON_EXCEPTIONS),
			rank_threshold: Number(evidence.policy.rank_threshold),
			shared_rank_count: SHARED_RANK_REQUIREMENTS.length,
			shared_rank_requirements: [...SHARED_RANK_REQUIREMENTS],
			reference_levels: [...REFERENCE_LEVELS],
			full_sheet_endpoints: targetPolicy.endpoints,
			growth_factor: targetPolicy.growth_factor,
			rank_targets: targetPolicy.values,
			rank_boundaries: targetPolicy.boundaries,
			core_allocation_envelope: clone(targetPolicy.core_allocation_envelope),
			priest_placeholder_attack_growth_ratio: medianPriestAttackGrowthRatio,
			neutral_assumptions: clone(evidence.policy.neutral_assumptions),
			formulas: FORMULAS,
			normalization_medians: medians,
		},
		pre_amendment_hashes: clone(evidence.pre_amendment_hashes || evidence.hashes),
		source_artifact_hashes: clone(evidence.source_artifact_hashes),
		availability_overrides: orderedAvailabilityOverrides,
		hashes: {
			catalog_manifest_sha256: sha256(catalog),
			retained_catalog_identity_sha256: sha256(catalog.filter((row) => !PLACEHOLDER_WEAPON_IDS.includes(row.weapon_id)).map(({ requirement_level, ...identity }) => identity)),
			retained_acquisition_projection_sha256: sha256(retainedProjection),
			retained_selected_dependency_routes_sha256: sha256(retainedSelectedDependencyRoutes),
			eligible_requirement_multisets_sha256: sha256(requirementMultisets),
			eligible_base_dps_multisets_sha256: sha256(dpsMultisets),
			acquisition_inputs_sha256: sha256(acquisitionInputs),
			availability_overrides_sha256: sha256(orderedAvailabilityOverrides),
			route_identity_manifest_sha256: sha256(routeIdentityManifest),
			route_graph_sha256: routeGraphSha256,
			retained_route_identity_manifest_sha256: sha256(retainedRouteIdentityManifest),
			retained_route_graph_sha256: retainedRouteGraphSha256,
		},
		catalog_manifest: clone(catalog),
		exclusions,
		retained_selected_dependency_routes: retainedSelectedDependencyRoutes,
		dependency_route_results: dependencyRouteResults,
		route_sources: routeSources,
		weapons: compactWeapons,
	};
	const preAmendmentChecks = {
		eligible_requirement_multisets_sha256: evidence.pre_amendment_hashes?.eligible_requirement_multisets_sha256 || evidence.hashes.eligible_requirement_multisets_sha256,
		eligible_base_dps_multisets_sha256: evidence.pre_amendment_hashes?.eligible_base_dps_multisets_sha256 || evidence.hashes.eligible_base_dps_multisets_sha256,
		availability_overrides_sha256: evidence.pre_amendment_hashes?.availability_overrides_sha256 || evidence.hashes.availability_overrides_sha256,
	};
	for (const [field, expected] of Object.entries(preAmendmentChecks))
		if (generated.hashes[field] !== expected) throw new Error(`Ranking fixture retained ${field} drifted`);
	if (evidence.schema_version === 2) {
		if (sha256(retainedSelectedDependencyRoutes) !== sha256(evidence.selected_dependency_routes))
			throw new Error("Ranking fixture retained selected dependency evidence drifted during amendment migration");
	} else {
		for (const field of ["retained_catalog_identity_sha256", "retained_acquisition_projection_sha256", "retained_selected_dependency_routes_sha256", "retained_route_identity_manifest_sha256", "retained_route_graph_sha256"])
			if (generated.hashes[field] !== evidence.hashes[field]) throw new Error(`Ranking fixture retained ${field} drifted`);
		if (!allowFixtureMigration && evidence.schema_version === 4)
			for (const field of ["catalog_manifest_sha256", "acquisition_inputs_sha256", "route_identity_manifest_sha256", "route_graph_sha256"])
				if (generated.hashes[field] !== evidence.hashes[field]) throw new Error(`Ranking fixture pinned ${field} drifted`);
	}
	return { ...generated, application: applicationStatus(generated, data) };
}

function compactRankingFixture(generated) {
	const routeResults = new Map();
	for (const weapon of generated.weapons || [])
		for (const route of weapon.routes || []) routeResults.set(`${weapon.weapon_id}|${route.route_id}`, { item_id: weapon.weapon_id, ...clone(route) });
	for (const route of generated.dependency_route_results || []) routeResults.set(`${route.item_id}|${route.route_id}`, clone(route));

	function expandedRoute(route) {
		return { ...clone(generated.route_sources?.[route.route_id] || {}), ...clone(route) };
	}

	const selectedDependencies = new Map();
	function collectSelectedDependency(itemId, routeId) {
		const key = `${itemId}|${routeId}`;
		if (selectedDependencies.has(key)) return;
		const result = routeResults.get(key);
		if (!result) throw new Error(`Selected dependency route ${key} is missing from the generated graph`);
		const { item_id: resultItemId, ...route } = result;
		const selected = { item_id: resultItemId, ...expandedRoute(route) };
		selectedDependencies.set(key, selected);
		for (const input of selected.recursive_inputs || []) collectSelectedDependency(input.item_id, input.selected_route_id);
	}

	const weapons = (generated.weapons || []).map((sourceWeapon) => {
		const weapon = clone(sourceWeapon);
		const selected = weapon.routes.find((route) => route.route_id === weapon.selected_route_id);
		if (!selected) throw new Error(`Selected weapon route ${weapon.weapon_id}|${weapon.selected_route_id} is missing from the generated graph`);
		for (const input of selected.recursive_inputs || []) collectSelectedDependency(input.item_id, input.selected_route_id);
		delete weapon.routes;
		weapon.selected_route = expandedRoute(selected);
		return weapon;
	});

	return {
		schema_version: 4,
		policy: clone(generated.policy),
		pre_amendment_hashes: clone(generated.pre_amendment_hashes),
		source_artifact_hashes: clone(generated.source_artifact_hashes),
		availability_overrides: clone(generated.availability_overrides),
		hashes: clone(generated.hashes),
		counts: {
			catalog_entries: generated.catalog_manifest.length,
			retained_weapons: generated.weapons.filter((weapon) => weapon.origin === "retained").length,
			placeholder_weapons: generated.weapons.filter((weapon) => weapon.origin === "placeholder").length,
			weapons: generated.weapons.length,
			weapon_routes: generated.weapons.reduce((sum, weapon) => sum + weapon.routes.length, 0),
			dependency_routes: generated.dependency_route_results.length,
			route_sources: Object.keys(generated.route_sources).length,
		},
		catalog_manifest: clone(generated.catalog_manifest),
		exclusions: clone(generated.exclusions),
		retained_selected_dependency_routes: clone(generated.retained_selected_dependency_routes),
		selected_dependency_routes: [...selectedDependencies.values()].sort(
			(left, right) => left.item_id.localeCompare(right.item_id) || left.route_id.localeCompare(right.route_id),
		),
		weapons,
	};
}

function validateRankingFixture(fixture, generated = buildAcquisitionRanking({ evidence: fixture })) {
	const { application } = generated;
	if (!application) throw new Error("Generated ranking is missing application status");
	if (fixture.schema_version !== 4 || stableJson(fixture) !== stableJson(compactRankingFixture(generated)))
		throw new Error("Weapon acquisition ranking fixture drifted from deterministic generation");
	return true;
}

function markdownReport(fixture) {
	const lines = ["# Weapon acquisition ranking", "", `Weapons: ${fixture.weapons.length}`, `Exclusions: ${fixture.exclusions.length}`, ""];
	for (const skill of fixture.policy.combat_skills) {
		lines.push(`## ${skill}`, "", "| Shared rank | Role | Weapon | Effort | Route | Requirement | Target DPS | Solved attack | Solved DPS |", "|---:|---|---|---:|---|---:|---:|---:|---:|");
		for (const weapon of fixture.weapons.filter((row) => row.skill === skill))
			lines.push(`| ${weapon.shared_rank} | ${weapon.role} | ${weapon.weapon_id} | ${weapon.selected_effort} | ${weapon.selected_route_id} | ${weapon.assigned_requirement} | ${weapon.assigned_dps_target} | ${weapon.solved_attack} | ${weapon.solved_dps} |`);
		lines.push("");
	}
	const completeEvidence = {
		...clone(fixture),
		weapons: fixture.weapons.map((weapon) => ({
			...clone(weapon),
			routes: weapon.routes.map((route) => ({ ...clone(fixture.route_sources[route.route_id] || {}), ...clone(route) })),
		})),
		dependency_route_results: (fixture.dependency_route_results || []).map((route) => ({
			...clone(fixture.route_sources[route.route_id] || {}),
			...clone(route),
		})),
	};
	lines.push(
		"## Complete deterministic evidence",
		"",
		"The default report embeds the full policy, hashes, overrides, source registry, allocations, and merged route results.",
		"",
		"```json",
		stableJson(completeEvidence).trimEnd(),
		"```",
		"",
	);
	return lines.join("\n") + "\n";
}

function writeRankingPublication(generated, {
	itemsFilename = path.resolve(__dirname, "../../design/items.js"),
	requirementsFilename = path.resolve(__dirname, "../../design/item_requirements.js"),
	write = fs.writeFileSync,
} = {}) {
	let itemsSource = fs.readFileSync(itemsFilename, "utf8");
	const mapMatch = itemsSource.match(/var weapon_progression = (\{[\s\S]*?\});\nvar weapon_progression_base_fields/);
	if (!mapMatch) throw new Error("Weapon publication map is missing");
	const publication = JSON.parse(mapMatch[1]);
	for (const row of generated.weapons) {
		const entry = publication[row.weapon_id];
		if (!entry) throw new Error(`Weapon publication map omits ${row.weapon_id}`);
		entry.attack = row.solved_attack;
		entry.str = row.solved_str;
		entry.int = row.solved_int;
		entry.dex = row.solved_dex;
		entry.progression = {
			historical_rank: row.historical_rank,
			shared_rank: row.shared_rank,
			role: row.role,
			requirement: row.assigned_requirement,
			reference_level: row.reference_level,
			target_dps: row.assigned_dps_target,
			full_sheet_hit_damage: row.quantization.chosen.sheet_attack,
			attacks_per_second: row.quantization.chosen.sheet_frequency,
			base_dps: row.solved_dps,
			selected_effort: row.selected_effort,
		};
		entry[row.enhancement_kind] = { attack: row.solved_attack_growth };
	}
	itemsSource = itemsSource.replace(mapMatch[0], `var weapon_progression = ${JSON.stringify(publication, null, 2)};\nvar weapon_progression_base_fields`);

	let requirementsSource = fs.readFileSync(requirementsFilename, "utf8");
	const requirements = Object.fromEntries(generated.weapons.slice().sort((left, right) => left.weapon_id.localeCompare(right.weapon_id)).map((row) => [row.weapon_id, row.assigned_requirement]));
	const requirementsPattern = /var acquisition_ranked_weapon_requirements=\{[^\n]*\};/;
	if (!requirementsPattern.test(requirementsSource)) throw new Error("Weapon requirement publication map is missing");
	requirementsSource = requirementsSource.replace(requirementsPattern, `var acquisition_ranked_weapon_requirements=${JSON.stringify(requirements)};`);
	write(itemsFilename, itemsSource);
	write(requirementsFilename, requirementsSource);
	return { items: itemsFilename, requirements: requirementsFilename };
}

function main(argv = process.argv.slice(2)) {
	const invalidWrite = argv.find((argument) => argument.startsWith("--write-fixture="));
	if (invalidWrite) throw new Error("Only the checked-in ranking fixture may be written");
	const evidence = loadRankingFixture(RANKING_FIXTURE_PATH);
	const approvedMigration = argv.includes("--approved-shared-rank-migration");
	const generated = buildAcquisitionRanking({ evidence, allowFixtureMigration: approvedMigration });
	if (argv.includes("--write-publication")) {
		if (!approvedMigration) throw new Error("Publication writes require the approved shared-rank migration flag");
		const written = writeRankingPublication(generated);
		process.stdout.write(`Wrote ${written.items}\nWrote ${written.requirements}\n`);
		return;
	}
	if (argv.includes("--write-fixture")) {
		if (!approvedMigration) throw new Error("Fixture writes require the approved shared-rank migration flag");
		const pinned = compactRankingFixture(generated);
		fs.writeFileSync(RANKING_FIXTURE_PATH, stableJson(pinned));
		process.stdout.write(`Wrote ${RANKING_FIXTURE_PATH}\n`);
		return;
	}
	if (argv.includes("--json")) process.stdout.write(stableJson(generated));
	else process.stdout.write(markdownReport(generated));
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	}
}

module.exports = {
	...acquisition,
	COMBAT_SKILLS,
	EXCLUDED_WEAPON_IDS,
	FORBIDDEN_DROP_TABLES,
	PLACEHOLDER_BOOK_RANKS,
	PLACEHOLDER_WEAPON_IDS,
	RANKING_FIXTURE_PATH,
	SHARED_RANK_REQUIREMENTS,
	REFERENCE_LEVELS,
	assertAcyclicSourceGraph,
	assignSemanticRanks,
	buildAcquisitionRanking,
	buildProductionAcquisitionResolver,
	compactRankingFixture,
	fullSheetContext,
	loadRankingFixture,
	loadVanillaBaseline,
	loadSourceData,
	main,
	markdownReport,
	solveRankedDpsCandidates,
	stableJson,
	validateAllocatedRows,
	validateRankingFixture,
	writeRankingPublication,
};
