"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { calculateStats } = require("../game/stats");
const { isCompatibleOffhand } = require("../game/equipment");
const { normalizeItems } = require("../game/skill_domain");
const {
	compactContributionEvidence,
	contributionGroupHashes,
	createContributionCatalog,
	expandContributionEvidence,
	validateContributionCatalog,
} = require("./contribution-evidence");
const { loadPropertyCalculators } = require("./weapon-progression-parity");
const {
	COMPOUND_STEP_WEIGHTS,
	UPGRADE_STEP_WEIGHTS,
	cumulativeEnhancementWeight,
} = require("./enhancement-steps");
const { serializeFixture } = require("./fixture-serialization");
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
	sha256: canonicalSha256,
	stableJson,
	sourceGraph,
	validateAvailabilityOverrides,
} = acquisition;

const RANKING_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-acquisition-ranking.json");
const VANILLA_BASELINE_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/vanilla-equipment-baseline.json");
const ARMOR_BALANCE_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/armor-set-balance.json");
const REPOSITORY_ROOT = path.resolve(__dirname, "../..");
const COMBAT_SKILLS = Object.freeze(["warrior", "paladin", "mage", "priest", "ranger", "rogue"]);
const EXCLUDED_WEAPON_IDS = Object.freeze(["axe3", "bow4", "staff2", "staff3", "staff4"]);
const SHARED_RANK_REQUIREMENTS = Object.freeze([1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99]);
const REFERENCE_LEVELS = Object.freeze(SHARED_RANK_REQUIREMENTS.map((_, index) => Math.round(1 + 69 * index / (SHARED_RANK_REQUIREMENTS.length - 1))));
const CLASS_MULTIPLIERS = Object.freeze({ warrior: 1, paladin: .9, priest: .9, ranger: 1.1, rogue: 1.1, mage: 1.1 });
const UPGRADE_LEVELS = Object.freeze(Array.from({ length: 13 }, (_, level) => level));
const COMPOUND_LEVELS = Object.freeze(Array.from({ length: 11 }, (_, level) => level));
const CONTRIBUTION_FIELDS = Object.freeze([
	"str", "dex", "int", "vit", "hp", "mp", "armor", "resistance",
	"attack", "frequency", "output", "crit", "range", "apiercing", "rpiercing",
	"lifesteal", "manasteal", "evasion", "reflection", "dreturn", "mp_reduction",
	"pnresistance", "firesistance", "fzresistance", "phresistance", "stresistance",
]);
const PLACEHOLDER_BOOK_RANKS = Object.freeze({ wbook2: 2, wbook3: 3, wbook4: 4, wbook5: 5, wbook6: 7, wbook7: 8, wbook8: 9, wbook9: 10 });
const PLACEHOLDER_WEAPON_IDS = Object.freeze(Object.keys(PLACEHOLDER_BOOK_RANKS));
const PRIEST_BOOK_IDS = Object.freeze(["wbook0", "wbook2", "wbook3", "wbook4", "wbook5", "wbook1", "wbook6", "wbook7", "wbook8", "wbook9", "wbookhs"]);
const PROTECTED_WEAPON_IDENTITY_SHA256 = "0ff4bf81a682a65cea95be330aab698d6fef9ecda48913368daac9faf3317675";
const WEAPON_OWNED_BASE_FIELDS = Object.freeze(["attack", "str", "int", "dex", "progression"]);
const ARMOR_PUBLICATION_BASE_FIELDS = Object.freeze([
	"str", "dex", "int", "vit", "hp", "mp", "armor", "resistance", "crit", "frequency", "speed", "range",
	"apiercing", "rpiercing", "lifesteal", "manasteal", "evasion", "reflection", "dreturn", "mp_reduction",
	"pnresistance", "firesistance", "fzresistance", "phresistance", "stresistance", "for", "stat", "extra_stat",
]);
const PROTECTED_NONWEAPON_IDENTITY_SHA256 = "2d7fcbfcaaf2e4cc476d827d472d7bc5ca1023a97224f61237415fda2da81bc4";
const OFFENSIVE_ARMOR_FIELDS = Object.freeze(["str", "dex", "int"]);
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
		![2, 3, 4, 5].includes(fixture.schema_version) ||
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
	if (!baseline || ![1, 2].includes(baseline.schema_version) || !Array.isArray(baseline.role_rows) || !baseline.weapon_rank_endpoint_oracle?.start?.base_dps || !baseline.weapon_rank_endpoint_oracle?.end?.base_dps)
		throw new Error("Vanilla full-sheet rank endpoint fixture is invalid");
	return baseline;
}

function compactContributionProperties(properties) {
	return Object.fromEntries(CONTRIBUTION_FIELDS
		.map((field) => [field, roundEvidence(Number(properties?.[field] || 0))])
		.filter(([, value]) => value !== 0));
}

function contributionGroup(rows) {
	const items = rows.map(({ slot, instance, properties }) => ({
		slot,
		item_id: instance.name,
		level: Number(instance.level || 0),
		stat_type: instance.stat_type || null,
		properties: compactContributionProperties(properties),
	}));
	const totals = {};
	for (const item of items)
		for (const [field, value] of Object.entries(item.properties)) totals[field] = roundEvidence(Number(totals[field] || 0) + value);
	return { items, totals: compactContributionProperties(totals) };
}

function rebalancedContributionEvidence({ slots, items, sets, getItemProperties, mainhandDefinition, equipmentSlots, frozenSlots, skill, referenceLevel }) {
	const rows = Object.entries(slots).map(([slot, instance]) => ({
		slot,
		instance,
		properties: getItemProperties(instance, items[instance.name]),
	}));
	const select = (predicate) => contributionGroup(rows.filter(predicate));
	const groups = {
		class: select((row) => row.slot === "class_core"),
		weapon: select((row) => row.slot === "mainhand"),
		armor: select((row) => ["helmet", "chest", "pants", "gloves", "shoes"].includes(row.slot)),
		cape: select((row) => row.slot === "cape"),
		offhand: select((row) => row.slot === "offhand"),
		accessories_orb: select((row) => frozenSlots.has(row.slot)),
		profile: {
			items: [{ slot: "profile", item_id: mainhandDefinition.wtype, level: 0, stat_type: null, properties: compactContributionProperties(WEAPON_PROFILES[mainhandDefinition.wtype]) }],
			totals: compactContributionProperties(WEAPON_PROFILES[mainhandDefinition.wtype]),
		},
	};
	const setCounts = {};
	for (const slot of ["helmet", "chest", "pants", "gloves", "shoes"]) {
		const instance = slots[slot];
		const definition = instance && items[instance.name];
		if (!definition?.set || !sets?.[definition.set]) continue;
		const members = sets[definition.set].bonus_items?.[slot];
		if (!Array.isArray(members) || !members.includes(instance.name)) continue;
		setCounts[definition.set] = (setCounts[definition.set] || 0) + 1;
	}
	const setRows = Object.entries(setCounts).map(([setId, count]) => ({
		slot: "set",
		instance: { name: setId, level: count },
		properties: sets[setId]?.[count] || {},
	}));
	groups.set = contributionGroup(setRows);
	const groupHashes = Object.fromEntries(Object.entries(groups).map(([group, value]) => [group, canonicalSha256(value)]));
	const loadout = Object.entries(slots)
		.filter(([slot]) => slot !== "class_core")
		.map(([slot, instance]) => ({ slot, item_id: instance.name, level: Number(instance.level || 0), stat_type: instance.stat_type || null }))
		.sort((left, right) => left.slot.localeCompare(right.slot));
	const ungroupedSlots = rows
		.filter((row) => row.slot !== "class_core" && row.slot !== "mainhand" && !equipmentSlots.has(row.slot) && !frozenSlots.has(row.slot))
		.map((row) => row.slot);
	if (ungroupedSlots.length) throw new Error(`Unclassified contribution slots for ${skill}:${referenceLevel}: ${ungroupedSlots.join(", ")}`);
	return {
		fields: [...CONTRIBUTION_FIELDS],
		groups,
		group_hashes: groupHashes,
		set_counts: setCounts,
		set_sha256: canonicalSha256({ counts: setCounts, contribution: groups.set }),
		loadout,
		loadout_sha256: canonicalSha256(loadout),
		contributions_sha256: canonicalSha256(groups),
	};
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
	const equipmentSlots = new Set(equipmentEntries.map(([slot]) => slot));
	const frozenSlots = new Set(frozenEntries.map(([slot]) => slot));
	const definition = data.items[weapon.weapon_id];
	const enhancementKind = definition.compound ? "compound" : definition.upgrade ? "upgrade" : null;
	const cache = new Map();
	const evaluateConfiguredState = (level, attack, attackGrowth, allocation, { offhand = undefined, upgradeLevel = null, compoundLevel = null } = {}) => {
		const offhandKey = offhand === undefined ? "canonical" : offhand === null ? "none" : `${offhand.name}:${offhand.level || 0}:${offhand.stat_type || ""}`;
		const key = `${level}:${upgradeLevel}:${compoundLevel}:${attack}:${attackGrowth}:${allocation.str}:${allocation.int}:${allocation.dex}:${offhandKey}`;
		if (cache.has(key)) return cache.get(key);
		const getItemProperties = (instance, definition) => {
			if (instance.name === "__class_core") return definition;
			const properties = calculators.current.calculate_item_properties(instance);
			if (instance.name !== weapon.weapon_id) return properties;
			const multiplier = cumulativeEnhancementWeight(enhancementKind, Number(instance.level || 0));
			return {
				...properties,
				attack: Math.round(attack + attackGrowth * multiplier),
				...Object.fromEntries(["str", "int", "dex"].map((field) => [field, Number(properties[field] || 0) - Number(definition[field] || 0) + allocation[field]])),
			};
		};
		const enhancedFixedSlots = Object.fromEntries(Object.entries(fixedSlots).map(([slot, instance]) => {
			if (instance.name === "__class_core") return [slot, instance];
			const fixedDefinition = data.items[instance.name];
			if (upgradeLevel !== null && fixedDefinition?.upgrade) return [slot, { ...instance, level: upgradeLevel }];
			if (compoundLevel !== null && fixedDefinition?.compound) return [slot, { ...instance, level: compoundLevel }];
			return [slot, instance];
		}));
		const slots = { mainhand: { ...mainhand, level }, ...enhancedFixedSlots };
		if (offhand === null) delete slots.offhand;
		else if (offhand !== undefined) slots.offhand = offhand;
		const sheet = calculateStats({ slots, items, sets: data.sets, getItemProperties });
		const contributions = rebalancedContributionEvidence({
			slots,
			items,
			sets: data.sets,
			getItemProperties,
			mainhandDefinition: definition,
			equipmentSlots,
			frozenSlots,
			skill: weapon.skill,
			referenceLevel,
		});
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
			contributions,
		};
		Object.defineProperty(candidate, "sheet", { value: sheet, enumerable: false });
		cache.set(key, candidate);
		return candidate;
	};
	const sourceGrowth = Number(definition[enhancementKind]?.attack || 0);
	const evaluateState = (level, attack, attackGrowth, allocation, options = {}) => evaluateConfiguredState(level, attack, attackGrowth, allocation, options);
	const evaluateEnhancementState = (upgradeLevel, compoundLevel, attack, attackGrowth, allocation, options = {}) => evaluateConfiguredState(
		enhancementKind === "compound" ? compoundLevel : upgradeLevel,
		attack,
		attackGrowth,
		allocation,
		{ ...options, upgradeLevel, compoundLevel },
	);
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
		evaluateEnhancementState,
		enhancement_kind: enhancementKind,
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
	const minimum = 50;
	const maximum = 450;
	const growth = Math.pow(maximum / minimum, 1 / (SHARED_RANK_REQUIREMENTS.length - 1));
	const values = SHARED_RANK_REQUIREMENTS.map((_, index) =>
		index === 0 ? minimum : index === SHARED_RANK_REQUIREMENTS.length - 1 ? maximum : roundEvidence(minimum * Math.pow(growth, index)),
	);
	const boundaries = values.slice(0, -1).map((value, index) => roundEvidence(Math.sqrt(value * values[index + 1])));
	const rankTargetsBySkill = Object.fromEntries(COMBAT_SKILLS.map((skill) => [skill, values.map((value) => roundEvidence(value * CLASS_MULTIPLIERS[skill]))]));
	const rankBoundariesBySkill = Object.fromEntries(COMBAT_SKILLS.map((skill) => [skill, boundaries.map((value) => roundEvidence(value * CLASS_MULTIPLIERS[skill]))]));
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
		warrior_rank_start: minimum,
		warrior_rank_end: maximum,
		growth_factor: growth,
		values,
		boundaries,
		rank_targets_by_skill: rankTargetsBySkill,
		rank_boundaries_by_skill: rankBoundariesBySkill,
		class_multipliers: clone(CLASS_MULTIPLIERS),
		enhancement: {
			upgrade_levels: [...UPGRADE_LEVELS],
			compound_levels: [...COMPOUND_LEVELS],
			hard_publication_states: [
				{ upgrade_level: 0, compound_level: 0, role: "base" },
				{ upgrade_level: 12, compound_level: 10, role: "fully_enhanced" },
			],
			diagnostic_state_count_per_rank: UPGRADE_LEVELS.length * COMPOUND_LEVELS.length - 2,
			intermediate_target_distance_gate: false,
			upgrade_step_weights: [...UPGRADE_STEP_WEIGHTS],
			compound_step_weights: [...COMPOUND_STEP_WEIGHTS],
			cumulative_upgrade_weight: cumulativeEnhancementWeight("upgrade", 12),
			cumulative_compound_weight: cumulativeEnhancementWeight("compound", 10),
			fully_enhanced_targets: {
				paladin: { rank_1: 292.107184015, rank_11: 4618.2147526 },
				priest: { rank_1: 292.107184015, rank_11: 4618.2147526 },
				warrior: { rank_1: 324.563537794, rank_11: 5131.34972512 },
				ranger: { rank_1: 357.019891573, rank_11: 5644.48469763 },
				rogue: { rank_1: 357.019891573, rank_11: 5644.48469763 },
				mage: { rank_1: 357.019891573, rank_11: 5644.48469763 },
			},
		},
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

function enhancementWarriorTargets(baseline, targetPolicy) {
	if (!Array.isArray(baseline.weapon_rank_enhancement_oracle) || baseline.weapon_rank_enhancement_oracle.length !== 11)
		throw new Error("Pinned Warrior enhancement oracle is incomplete");
	return baseline.weapon_rank_enhancement_oracle.map((oracle, index) => ({
		shared_rank: index + 1,
		reference_level: REFERENCE_LEVELS[index],
		mainhand_id: oracle.mainhand_id,
		pinned_base_dps: oracle.base_dps,
		states: oracle.states.map((state) => {
			let target = roundEvidence(targetPolicy.values[index] * state.amplification);
			if (state.upgrade_level === 12 && state.compound_level === 10 && index === 0) target = 324.563537794;
			if (state.upgrade_level === 12 && state.compound_level === 10 && index === 10) target = 5131.34972512;
			return {
				upgrade_level: state.upgrade_level,
				compound_level: state.compound_level,
				pinned_dps: state.pinned_dps,
				amplification: state.amplification,
				target_dps: target,
				pinned_contribution_hashes: contributionGroupHashes(state.contributions, baseline.enhancement_contribution_catalog),
				pinned_contributions_sha256: state.contributions.contributions_sha256,
				pinned_set_sha256: state.contributions.set_sha256,
				pinned_loadout_sha256: state.contributions.loadout_sha256,
			};
		}),
	}));
}

function unrepresentableTargetError(id, target, lower = null, upper = null) {
	const error = new Error(`Unrepresentable weapon target ${id}: target=${target}; lower=${lower?.dps ?? "none"}; upper=${upper?.dps ?? "none"}`);
	error.code = "weapon_target_unrepresentable";
	error.class_rank_state = id;
	error.target = target;
	error.lower = lower;
	error.upper = upper;
	error.signed_error = lower && upper
		? (Math.abs(lower.dps - target) <= Math.abs(upper.dps - target) ? lower.dps : upper.dps) - target
		: null;
	return error;
}

function solveNearestSheetTarget({ id, target, evaluate, minimum = 0 }) {
	if (!(Number.isFinite(target) && target > 0) || typeof evaluate !== "function") throw unrepresentableTargetError(id, target);
	const checked = (candidate) => {
		const state = evaluate(candidate);
		if (!state || !(Number.isFinite(state.dps) && state.dps > 0)) throw unrepresentableTargetError(id, target);
		return { candidate, ...state };
	};
	let lower = checked(Math.max(0, Math.ceil(minimum)));
	if (lower.dps >= target) return { lower, upper: lower, chosen: lower };
	let upperCandidate = Math.max(lower.candidate + 1, lower.candidate * 2 || 1);
	let upper = checked(upperCandidate);
	for (let attempt = 0; attempt < 64 && upper.dps < target; attempt += 1) {
		if (upper.candidate > Number.MAX_SAFE_INTEGER / 2) throw unrepresentableTargetError(id, target, lower, upper);
		lower = upper;
		upperCandidate *= 2;
		upper = checked(upperCandidate);
	}
	if (upper.dps < target) throw unrepresentableTargetError(id, target, lower, upper);
	while (lower.candidate + 1 < upper.candidate) {
		const middle = checked(lower.candidate + Math.floor((upper.candidate - lower.candidate) / 2));
		if (middle.dps >= target) upper = middle;
		else lower = middle;
	}
	const distance = (state) => Math.abs(Math.log(state.dps / target));
	const chosen = distance(lower) <= distance(upper) ? lower : upper;
	return { lower, upper, chosen };
}

function enhancementCandidate(context, row, cumulativeWeight, enhancedAttack, upgradeLevel, compoundLevel) {
	const growth = roundEvidence((enhancedAttack - row.solved_attack) / cumulativeWeight);
	const allocation = { str: row.solved_str, int: row.solved_int, dex: row.solved_dex };
	const state = context.evaluateEnhancementState(upgradeLevel, compoundLevel, row.solved_attack, growth, allocation);
	return { enhanced_attack: enhancedAttack, attack_growth: growth, dps: state.dps, hit_damage: state.sheet_attack, attacks_per_second: state.sheet_frequency };
}

function attachEnhancementGrowth(rows, data, pinnedWeapons, calculators, baseline, warriorTargets) {
	for (const row of rows) {
		const pinned = pinnedWeapons.get(row.weapon_id) || {};
		const definition = data.items[row.weapon_id];
		const enhancementKind = row.skill === "priest" ? "upgrade" : pinned.enhancement_kind || (definition.compound ? "compound" : definition.upgrade ? "upgrade" : null);
		if (!enhancementKind) throw new Error(`Weapon ${row.weapon_id} has no enhancement kind`);
		row.enhancement_kind = enhancementKind;
		row.pre_regeneration_attack = row.origin === "retained" ? Number(pinned.pre_regeneration_attack ?? pinned.solved_attack ?? definition.attack) : null;
		row.pre_regeneration_attack_growth = row.origin === "retained" ? Number(pinned.pre_regeneration_attack_growth ?? definition[enhancementKind]?.attack ?? 0) : null;
		row.attack_scale = row.origin === "retained" ? roundEvidence(row.solved_attack / row.pre_regeneration_attack) : null;
		const context = fullSheetContext(data, calculators, baseline, row);
		const cumulativeWeight = cumulativeEnhancementWeight(enhancementKind, enhancementKind === "compound" ? 10 : 12);
		const warriorMaximum = warriorTargets[row.shared_rank - 1].states.at(-1).target_dps;
		const target = roundEvidence(warriorMaximum * CLASS_MULTIPLIERS[row.skill]);
		const id = `${row.skill}:rank-${row.shared_rank}:${row.weapon_id}:+12/+10`;
		const solved = solveNearestSheetTarget({
			id,
			target,
			minimum: row.solved_attack,
			evaluate: (enhancedAttack) => enhancementCandidate(context, row, cumulativeWeight, enhancedAttack, 12, 10),
		});
		row.pre_monotonic_attack_growth = row.pre_regeneration_attack_growth;
		row.solved_attack_growth = solved.chosen.attack_growth;
		row.attack_growth_adjusted_for_monotonicity = row.pre_regeneration_attack_growth !== row.solved_attack_growth;
		row.enhancement_quantization = {
			target,
			state: { upgrade_level: 12, compound_level: 10 },
			lower: clone(solved.lower),
			upper: clone(solved.upper),
			chosen: clone(solved.chosen),
			signed_error: solved.chosen.dps - target,
		};
		const levels = enhancementKind === "compound" ? COMPOUND_LEVELS : UPGRADE_LEVELS;
		const states = levels.map((level) => context.evaluateState(level, row.solved_attack, row.solved_attack_growth, { str: row.solved_str, int: row.solved_int, dex: row.solved_dex }));
		if (!states.every((state, index) => Number.isFinite(state.dps) && state.dps > 0 && (!index || state.dps + 1e-12 >= states[index - 1].dps)))
			throw unrepresentableTargetError(`${row.skill}:rank-${row.shared_rank}:${row.weapon_id}:enhancement-monotonicity`, target);
		row.enhancement_states = states.map((state, index) => ({
			level: levels[index],
			hit_damage: state.sheet_attack,
			attacks_per_second: state.sheet_frequency,
			base_dps: state.dps,
		}));
	}
}

function buildEnhancementFullSheetRows(rows, data, calculators, baseline, warriorTargets) {
	const contributionCatalogBuilder = createContributionCatalog(CONTRIBUTION_FIELDS);
	const fullSheetRows = rows
		.filter((row) => row.role === "progression")
		.map((row) => {
			const context = fullSheetContext(data, calculators, baseline, row);
			const allocation = { str: row.solved_str, int: row.solved_int, dex: row.solved_dex };
			const warriorStates = warriorTargets[row.shared_rank - 1].states;
			return {
				id: `${row.skill}:rank-${row.shared_rank}`,
				skill: row.skill,
				class_multiplier: CLASS_MULTIPLIERS[row.skill],
				shared_rank: row.shared_rank,
				reference_level: row.reference_level,
				weapon_id: row.weapon_id,
				enhancement_kind: row.enhancement_kind,
				pinned_warrior_reference: {
					mainhand_id: warriorTargets[row.shared_rank - 1].mainhand_id,
					base_dps: warriorTargets[row.shared_rank - 1].pinned_base_dps,
				},
				rebalanced_contributions: {
					class_core: clone(row.full_sheet_context.class_core),
					nonweapon_plus_class_at_zero_weapon_allocation: clone(row.full_sheet_context.zero_allocation_current_sheet),
					armor_ids: clone(row.full_sheet_context.armor_ids),
					cape_id: row.full_sheet_context.cape_id,
					frozen_accessory_ids: clone(row.full_sheet_context.frozen_accessory_ids),
					weapon_owned_base: { attack: row.solved_attack, str: row.solved_str, int: row.solved_int, dex: row.solved_dex },
					weapon_owned_enhancement: { kind: row.enhancement_kind, attack: row.solved_attack_growth },
					armor_offensive_fields: { str: 0, dex: 0, int: 0 },
				},
				states: warriorStates.map((targetState) => {
					const actual = context.evaluateEnhancementState(targetState.upgrade_level, targetState.compound_level, row.solved_attack, row.solved_attack_growth, allocation);
					const targetDps = roundEvidence(targetState.target_dps * CLASS_MULTIPLIERS[row.skill]);
					const signedRelativeError = roundEvidence(actual.dps / targetDps - 1);
					const isBase = targetState.upgrade_level === 0 && targetState.compound_level === 0;
					const isMaximum = targetState.upgrade_level === 12 && targetState.compound_level === 10;
					let quantization = null;
					if (isBase) {
						quantization = {
							field: "base_attack_core",
							target: targetDps,
							domain: clone(row.quantization.domain),
							rank_band: clone(row.rank_band),
							lower: clone(row.quantization.lower),
							upper: clone(row.quantization.upper),
							chosen: clone(row.quantization.chosen),
						};
					} else if (isMaximum) {
						quantization = {
							field: `${row.enhancement_kind}.attack`,
							target: targetDps,
							lower: clone(row.enhancement_quantization.lower),
							upper: clone(row.enhancement_quantization.upper),
							chosen: clone(row.enhancement_quantization.chosen),
						};
					}
					return {
						upgrade_level: targetState.upgrade_level,
						compound_level: targetState.compound_level,
						pinned_warrior_dps: targetState.pinned_dps,
						warrior_amplification: targetState.amplification,
						warrior_target_dps: targetState.target_dps,
						target_dps: targetDps,
						actual_sheet_attack: actual.sheet_attack,
						actual_sheet_frequency: actual.sheet_frequency,
						actual_dps: actual.dps,
						signed_error: actual.dps - targetDps,
						signed_relative_error: signedRelativeError,
						absolute_relative_error: Math.abs(signedRelativeError),
						publication_state: isBase ? "base" : isMaximum ? "fully_enhanced" : "intermediate",
						release_gate: isBase || isMaximum ? "hard" : "diagnostic",
						...(isBase || isMaximum ? {} : { diagnostic_reason: "unchanged_vanilla_enhancement_surface" }),
						pinned_contribution_hashes: clone(targetState.pinned_contribution_hashes),
						pinned_contributions_sha256: targetState.pinned_contributions_sha256,
						pinned_set_sha256: targetState.pinned_set_sha256,
						pinned_loadout_sha256: targetState.pinned_loadout_sha256,
						rebalanced_contributions: compactContributionEvidence(actual.contributions, contributionCatalogBuilder),
						quantization,
					};
				}),
			};
		})
		.sort((left, right) => left.skill.localeCompare(right.skill) || left.shared_rank - right.shared_rank);
	return { full_sheet_rows: fullSheetRows, contribution_catalog: contributionCatalogBuilder.finalize() };
}

function enhancementFeasibilityReport(rows, contributionCatalog) {
	const hardEndpointViolations = [];
	const targetMultiplierViolations = [];
	const invalidOutputViolations = [];
	const monotonicityViolations = [];
	const evidenceViolations = [];
	let hardStates = 0;
	let diagnosticStates = 0;
	const evidenceTolerance = 1e-8;
	const logDistance = (dps, target) => Math.abs(Math.log(dps / target));
	validateContributionCatalog(contributionCatalog);
	for (const row of rows) {
		const states = new Map();
		for (const state of row.states) {
			const id = `${row.id}:+${state.upgrade_level}/+${state.compound_level}`;
			states.set(`${state.upgrade_level}:${state.compound_level}`, state);
			const expectedTarget = roundEvidence(state.warrior_target_dps * row.class_multiplier);
			if (state.target_dps !== expectedTarget) targetMultiplierViolations.push({ id, expected: expectedTarget, actual: state.target_dps });
			const expectedSignedError = state.actual_dps - state.target_dps;
			const expectedSignedRelativeError = roundEvidence(state.actual_dps / state.target_dps - 1);
			if (
				![state.target_dps, state.actual_dps, state.actual_sheet_attack, state.actual_sheet_frequency, state.signed_error, state.signed_relative_error, state.absolute_relative_error].every(Number.isFinite) ||
				state.target_dps <= 0 || state.actual_dps <= 0 || state.actual_sheet_frequency <= 0 ||
				state.signed_error !== expectedSignedError || state.signed_relative_error !== expectedSignedRelativeError || state.absolute_relative_error !== Math.abs(expectedSignedRelativeError)
			) invalidOutputViolations.push({ id, target: state.target_dps, actual_dps: state.actual_dps });
			try {
				expandContributionEvidence(state.rebalanced_contributions, contributionCatalog, { validateCatalog: false });
			} catch (error) {
				evidenceViolations.push({ id, message: error.message });
			}
			const isBase = state.upgrade_level === 0 && state.compound_level === 0;
			const isMaximum = state.upgrade_level === 12 && state.compound_level === 10;
			if (isBase || isMaximum) {
				hardStates += 1;
				const quantization = state.quantization;
				const candidates = [quantization?.lower, quantization?.upper].filter((candidate) => Number.isFinite(candidate?.dps) && candidate.dps > 0);
				const lower = candidates.filter((candidate) => candidate.dps <= state.target_dps).sort((left, right) => right.dps - left.dps)[0] || null;
				const upper = candidates.filter((candidate) => candidate.dps >= state.target_dps).sort((left, right) => left.dps - right.dps)[0] || null;
				const rankBand = isBase ? quantization?.rank_band : null;
				const legalCandidates = candidates.filter((candidate) => !rankBand || (
					(rankBand.lower_inclusive ? candidate.dps >= rankBand.lower - 1e-12 : candidate.dps > rankBand.lower + 1e-12) &&
					(rankBand.upper_inclusive ? candidate.dps <= rankBand.upper + 1e-12 : candidate.dps < rankBand.upper - 1e-12)
				));
				const nearest = legalCandidates.slice().sort((left, right) => logDistance(left.dps, state.target_dps) - logDistance(right.dps, state.target_dps))[0] || null;
				if (
					state.release_gate !== "hard" || state.publication_state !== (isBase ? "base" : "fully_enhanced") ||
					quantization?.target !== state.target_dps || !quantization?.chosen ||
					Math.abs(Number(quantization.chosen.dps) - state.actual_dps) > evidenceTolerance ||
					!nearest || Math.abs(Number(nearest.dps) - state.actual_dps) > evidenceTolerance
				) hardEndpointViolations.push({ id, target: state.target_dps, lower, upper, actual_dps: state.actual_dps, signed_error: state.signed_error });
			} else {
				diagnosticStates += 1;
				if (state.release_gate !== "diagnostic" || state.publication_state !== "intermediate" || state.quantization !== null || state.diagnostic_reason !== "unchanged_vanilla_enhancement_surface")
					evidenceViolations.push({ id, message: "Intermediate enhancement state is not classified as diagnostic" });
			}
		}
		for (let upgradeLevel = 0; upgradeLevel <= 12; upgradeLevel += 1) {
			for (let compoundLevel = 0; compoundLevel <= 10; compoundLevel += 1) {
				const state = states.get(`${upgradeLevel}:${compoundLevel}`);
				if (!state) {
					evidenceViolations.push({ id: `${row.id}:+${upgradeLevel}/+${compoundLevel}`, message: "Enhancement state is missing" });
					continue;
				}
				const previousUpgrade = states.get(`${upgradeLevel - 1}:${compoundLevel}`);
				const previousCompound = states.get(`${upgradeLevel}:${compoundLevel - 1}`);
				if (previousUpgrade && state.actual_dps + 1e-12 < previousUpgrade.actual_dps)
					monotonicityViolations.push({ id: `${row.id}:+${upgradeLevel}/+${compoundLevel}`, axis: "upgrade", previous_dps: previousUpgrade.actual_dps, actual_dps: state.actual_dps });
				if (previousCompound && state.actual_dps + 1e-12 < previousCompound.actual_dps)
					monotonicityViolations.push({ id: `${row.id}:+${upgradeLevel}/+${compoundLevel}`, axis: "compound", previous_dps: previousCompound.actual_dps, actual_dps: state.actual_dps });
			}
		}
	}
	const failures = hardEndpointViolations.length + targetMultiplierViolations.length + invalidOutputViolations.length + monotonicityViolations.length + evidenceViolations.length;
	return {
		states: rows.reduce((sum, row) => sum + row.states.length, 0),
		hard_states: hardStates,
		diagnostic_states: diagnosticStates,
		hard_endpoint_violations: hardEndpointViolations,
		target_multiplier_violations: targetMultiplierViolations,
		invalid_output_violations: invalidOutputViolations,
		monotonicity_violations: monotonicityViolations,
		evidence_violations: evidenceViolations,
		status: failures ? "failed" : "passed",
	};
}

function compactEnhancementFeasibility(report) {
	return {
		status: report.status,
		states: report.states,
		hard_states: report.hard_states,
		diagnostic_states: report.diagnostic_states,
		hard_endpoint_violations: report.hard_endpoint_violations.length,
		target_multiplier_violations: report.target_multiplier_violations.length,
		invalid_output_violations: report.invalid_output_violations.length,
		monotonicity_violations: report.monotonicity_violations.length,
		evidence_violations: report.evidence_violations.length,
	};
}

function assertEnhancementFeasibility(report) {
	if (report?.status === "passed") return true;
	const hardEndpoint = report?.hard_endpoint_violations?.[0];
	if (hardEndpoint) {
		const error = unrepresentableTargetError(hardEndpoint.id, hardEndpoint.target, hardEndpoint.lower, hardEndpoint.upper);
		error.signed_error = hardEndpoint.signed_error;
		error.feasibility_summary = compactEnhancementFeasibility(report);
		throw error;
	}
	const monotonicity = report?.monotonicity_violations?.[0];
	const invalidOutput = report?.invalid_output_violations?.[0];
	const targetMultiplier = report?.target_multiplier_violations?.[0];
	const evidence = report?.evidence_violations?.[0];
	const violation = monotonicity || invalidOutput || targetMultiplier || evidence || { id: "unknown-enhancement-state" };
	const error = new Error(`Weapon enhancement feasibility failed for ${violation.id}`);
	error.code = monotonicity ? "weapon_enhancement_nonmonotonic"
		: invalidOutput ? "weapon_enhancement_invalid_output"
			: targetMultiplier ? "weapon_target_multiplier_drift"
				: "weapon_enhancement_evidence_invalid";
	error.class_rank_state = violation.id;
	error.violation = violation;
	error.feasibility_summary = compactEnhancementFeasibility(report);
	throw error;
}

function buildAcquisitionRanking({ evidence = loadRankingFixture(RANKING_FIXTURE_PATH), data = loadSourceData(), baseline = loadVanillaBaseline(), allowFixtureMigration = false, allowInfeasibleEvidence = false } = {}) {
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
		const skillTargetPolicy = {
			...targetPolicy,
			values: targetPolicy.rank_targets_by_skill[skill],
			boundaries: targetPolicy.rank_boundaries_by_skill[skill],
		};
		allocated.push(...allocateSkillBudgets(data, calculators, baseline, ranked, {
			requirements: SHARED_RANK_REQUIREMENTS,
			targetPolicy: skillTargetPolicy,
		}));
	}
	allocated.sort((left, right) => left.skill.localeCompare(right.skill) || left.rank - right.rank || left.selected_effort - right.selected_effort || left.weapon_id.localeCompare(right.weapon_id));
	const warriorEnhancementTargets = enhancementWarriorTargets(baseline, targetPolicy);
	attachEnhancementGrowth(allocated, data, pinnedWeapons, calculators, baseline, warriorEnhancementTargets);
	const enhancementEvidence = buildEnhancementFullSheetRows(allocated, data, calculators, baseline, warriorEnhancementTargets);
	const enhancementFullSheetRows = enhancementEvidence.full_sheet_rows;
	const enhancementFeasibility = enhancementFeasibilityReport(enhancementFullSheetRows, enhancementEvidence.contribution_catalog);
	if (!allowInfeasibleEvidence) assertEnhancementFeasibility(enhancementFeasibility);

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
		schema_version: 5,
		policy: {
			combat_skills: [...COMBAT_SKILLS],
			forbidden_drop_tables: [...FORBIDDEN_DROP_TABLES],
			forbidden_drop_table_weapon_exceptions: clone(FORBIDDEN_DROP_TABLE_WEAPON_EXCEPTIONS),
			rank_threshold: Number(evidence.policy.rank_threshold),
			shared_rank_count: SHARED_RANK_REQUIREMENTS.length,
			shared_rank_requirements: [...SHARED_RANK_REQUIREMENTS],
			reference_levels: [...REFERENCE_LEVELS],
			full_sheet_endpoints: targetPolicy.endpoints,
			warrior_rank_start: targetPolicy.warrior_rank_start,
			warrior_rank_end: targetPolicy.warrior_rank_end,
			growth_factor: targetPolicy.growth_factor,
			rank_targets: targetPolicy.values,
			rank_boundaries: targetPolicy.boundaries,
			rank_targets_by_skill: clone(targetPolicy.rank_targets_by_skill),
			rank_boundaries_by_skill: clone(targetPolicy.rank_boundaries_by_skill),
			class_multipliers: clone(targetPolicy.class_multipliers),
			enhancement: clone(targetPolicy.enhancement),
			core_allocation_envelope: clone(targetPolicy.core_allocation_envelope),
			enhancement_source_hashes: clone(baseline.source_hashes),
			enhancement_evidence_hashes: clone(baseline.evidence_hashes),
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
			protected_weapon_identity_sha256: PROTECTED_WEAPON_IDENTITY_SHA256,
			enhancement_contribution_catalog_sha256: enhancementEvidence.contribution_catalog.catalog_sha256,
			enhancement_full_sheet_contributions_sha256: sha256(enhancementFullSheetRows.map((row) => row.states.map((state) => state.rebalanced_contributions.contributions_sha256))),
		},
		catalog_manifest: clone(catalog),
		exclusions,
		retained_selected_dependency_routes: retainedSelectedDependencyRoutes,
		dependency_route_results: dependencyRouteResults,
		route_sources: routeSources,
		weapons: compactWeapons,
		enhancement_warrior_targets: warriorEnhancementTargets,
		enhancement_full_sheet_rows: enhancementFullSheetRows,
		enhancement_contribution_catalog: enhancementEvidence.contribution_catalog,
		enhancement_feasibility: compactEnhancementFeasibility(enhancementFeasibility),
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
		if (!allowFixtureMigration && [4, 5].includes(evidence.schema_version))
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
		schema_version: 5,
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
		enhancement_warrior_targets: clone(generated.enhancement_warrior_targets),
		enhancement_full_sheet_rows: clone(generated.enhancement_full_sheet_rows),
		enhancement_contribution_catalog: clone(generated.enhancement_contribution_catalog),
		enhancement_feasibility: clone(generated.enhancement_feasibility),
	};
}

function validateRankingFixture(fixture, generated = buildAcquisitionRanking({ evidence: fixture })) {
	const { application } = generated;
	if (!application) throw new Error("Generated ranking is missing application status");
	if (fixture.enhancement_feasibility?.status !== "passed" || generated.enhancement_feasibility?.status !== "passed")
		assertEnhancementFeasibility(enhancementFeasibilityReport(generated.enhancement_full_sheet_rows, generated.enhancement_contribution_catalog));
	validateContributionCatalog(fixture.enhancement_contribution_catalog);
	if (
		fixture.hashes?.enhancement_contribution_catalog_sha256 !== fixture.enhancement_contribution_catalog.catalog_sha256 ||
		fixture.hashes?.enhancement_full_sheet_contributions_sha256 !== sha256(fixture.enhancement_full_sheet_rows.map((row) => row.states.map((state) => state.rebalanced_contributions?.contributions_sha256)))
	) throw new Error("Weapon enhancement contribution hashes drifted");
	for (const row of fixture.enhancement_full_sheet_rows)
		for (const state of row.states) expandContributionEvidence(state.rebalanced_contributions, fixture.enhancement_contribution_catalog, { validateCatalog: false });
	if (fixture.schema_version !== 5 || stableJson(fixture) !== stableJson(compactRankingFixture(generated)))
		throw new Error("Weapon acquisition ranking fixture drifted from deterministic generation");
	return true;
}

function publicationCatalogFromSource(source, filename = "design/items.js") {
	const context = {
		console: { log() {}, error() {} },
		Math,
		min: Math.min,
		max: Math.max,
		ceil: Math.ceil,
		round: Math.round,
		multipliers: { shells_to_gold: 1 },
	};
	vm.createContext(context);
	vm.runInContext(String(source), context, { filename, timeout: 1000 });
	if (!context.items || !context.sets || !context.base_nonweapon_progression || !context.armor_set_incremental_bonuses) {
		const error = new Error("Equipment publication source did not define items, sets, and reviewed nonweapon publication maps");
		error.code = "equipment_publication_source_invalid";
		throw error;
	}
	return {
		items: clone(context.items),
		sets: clone(context.sets),
		nonweapon_publication: clone(context.base_nonweapon_progression),
		set_publication: clone(context.armor_set_incremental_bonuses),
	};
}

function protectedWeaponIdentityProjection(items, weaponIds) {
	return [...weaponIds].sort().map((weaponId) => {
		const definition = items[weaponId] ? clone(items[weaponId]) : null;
		if (!definition) return { weapon_id: weaponId, definition: null };
		for (const field of WEAPON_OWNED_BASE_FIELDS) delete definition[field];
		for (const kind of ["upgrade", "compound"])
			if (definition[kind]) delete definition[kind].attack;
		return { weapon_id: weaponId, definition };
	});
}

function armorPublicationProjection(publication, authority) {
	const items = Object.fromEntries(Object.entries(authority.items)
		.map(([itemId]) => {
			const definition = publication.items[itemId] || {};
			return [itemId, {
				base_core: Object.fromEntries(ARMOR_PUBLICATION_BASE_FIELDS
					.filter((field) => Object.hasOwn(definition, field))
					.map((field) => [field, definition[field]])),
				enhancement: {
					compound: definition.compound || null,
					upgrade: definition.upgrade || null,
				},
			}];
		}));
	const sets = Object.fromEntries(Object.keys(authority.sets).sort().map((setId) => [setId, Object.fromEntries(
		Object.keys(publication.sets[setId] || {})
			.filter((threshold) => /^\d+$/.test(threshold))
			.sort((left, right) => Number(left) - Number(right))
			.map((threshold) => [threshold, publication.sets[setId][threshold]]),
	)]));
	return { items, sets };
}

function armorAuthorityProjection(authority) {
	return {
		items: Object.fromEntries(Object.entries(authority.items)
			.map(([itemId, row]) => [itemId, { base_core: row.base_core, enhancement: row.enhancement }])),
		sets: Object.fromEntries(Object.entries(authority.sets).map(([setId, row]) => [setId, row.increments])),
	};
}

function armorAuthorityPublicationMaps(authority) {
	return {
		items: Object.fromEntries(Object.entries(authority.items).map(([itemId, row]) => [itemId, {
			...row.base_core,
			...(row.enhancement.upgrade ? { upgrade: row.enhancement.upgrade } : {}),
			...(row.enhancement.compound ? { compound: row.enhancement.compound } : {}),
		}])),
		sets: Object.fromEntries(Object.entries(authority.sets).map(([setId, row]) => [setId, row.increments])),
	};
}

function protectedNonweaponIdentityProjection(items, itemIds) {
	return [...itemIds].sort().map((itemId) => {
		const definition = items[itemId] ? clone(items[itemId]) : null;
		if (!definition) return { item_id: itemId, definition: null };
		for (const field of ARMOR_PUBLICATION_BASE_FIELDS) delete definition[field];
		delete definition.upgrade;
		delete definition.compound;
		return { item_id: itemId, definition };
	});
}

function validatePublicationSourceSemantics(ranking, publication) {
	for (const bookId of PRIEST_BOOK_IDS) {
		const definition = publication.items[bookId];
		if (!definition?.upgrade || definition.compound !== undefined) {
			const error = new Error(`Priest book ${bookId} raw publication must use upgrade without compound`);
			error.code = "priest_book_publication_identity_drift";
			throw error;
		}
	}
	const weaponIds = (ranking.weapons || []).map((weapon) => weapon.weapon_id);
	if (
		ranking.hashes?.protected_weapon_identity_sha256 !== PROTECTED_WEAPON_IDENTITY_SHA256 ||
		canonicalSha256(protectedWeaponIdentityProjection(publication.items, weaponIds)) !== PROTECTED_WEAPON_IDENTITY_SHA256
	) {
		const error = new Error("Weapon publication protected identity drifted from pinned authority");
		error.code = "weapon_publication_identity_drift";
		throw error;
	}
	const armorAuthority = JSON.parse(fs.readFileSync(ARMOR_BALANCE_FIXTURE_PATH, "utf8"));
	const authorityMaps = armorAuthorityPublicationMaps(armorAuthority);
	if (
		canonicalSha256(publication.nonweapon_publication) !== canonicalSha256(authorityMaps.items) ||
		canonicalSha256(publication.set_publication) !== canonicalSha256(authorityMaps.sets) ||
		canonicalSha256(armorPublicationProjection(publication, armorAuthority)) !== canonicalSha256(armorAuthorityProjection(armorAuthority)) ||
		canonicalSha256(protectedNonweaponIdentityProjection(publication.items, Object.keys(armorAuthority.items))) !== PROTECTED_NONWEAPON_IDENTITY_SHA256
	) {
		const error = new Error("Armor publication source drifted from deterministic offense-free authority");
		error.code = "armor_publication_source_drift";
		throw error;
	}
}

function assertOffenseFreeArmorContributions(ranking) {
	for (const row of ranking.enhancement_full_sheet_rows) {
		for (const state of row.states) {
			const evidence = expandContributionEvidence(state.rebalanced_contributions, ranking.enhancement_contribution_catalog, { validateCatalog: false });
			for (const field of OFFENSIVE_ARMOR_FIELDS) {
				if (Number(evidence.groups.armor.totals[field] || 0) !== 0) {
					const error = new Error(`Weapon ranking publication armor contribution contains ${field}: ${row.id}:+${state.upgrade_level}/+${state.compound_level}`);
					error.code = "weapon_publication_armor_offense";
					error.class_rank_state = `${row.id}:+${state.upgrade_level}/+${state.compound_level}`;
					error.field = field;
					throw error;
				}
			}
		}
	}
}

function validateRankingPublicationBundle(ranking, { publication = null } = {}) {
	if (!ranking || !Array.isArray(ranking.enhancement_full_sheet_rows) || !ranking.enhancement_contribution_catalog) {
		const error = new Error("Weapon ranking publication bundle is incomplete");
		error.code = "weapon_publication_bundle_invalid";
		throw error;
	}
	publication ||= publicationCatalogFromSource(
		fs.readFileSync(path.resolve(REPOSITORY_ROOT, "design/items.js"), "utf8"),
		path.resolve(REPOSITORY_ROOT, "design/items.js"),
	);
	validatePublicationSourceSemantics(ranking, publication);
	if (stableJson(ranking.policy?.class_multipliers) !== stableJson(CLASS_MULTIPLIERS)) {
		const error = new Error("Weapon ranking publication bundle drifted: class multipliers changed");
		error.code = "weapon_publication_bundle_invalid";
		throw error;
	}
	const sourceData = loadSourceData();
	let normalizedItems;
	try {
		normalizedItems = normalizeItems(publication.items, sourceData.itemRequirements);
	} catch (cause) {
		const error = new Error(`Weapon publication normalized identity is invalid: ${cause.message}`);
		error.code = "weapon_publication_identity_drift";
		error.cause = cause;
		throw error;
	}
	const currentCatalog = new Map(catalogRows({ ...sourceData, items: normalizedItems }).map((row) => [row.weapon_id, row]));
	const manifest = new Map((ranking.catalog_manifest || []).map((row) => [row.weapon_id, row]));
	for (const weapon of ranking.weapons || []) {
		const current = currentCatalog.get(weapon.weapon_id);
		const pinned = manifest.get(weapon.weapon_id);
		if (
			!current || !pinned ||
			["skill", "weapon_type", "damage_type"].some((field) => weapon[field] !== pinned[field] || pinned[field] !== current[field]) ||
			(weapon.skill === "priest" && (weapon.weapon_type !== "book" || weapon.enhancement_kind !== "upgrade"))
		) {
			const error = new Error(`Weapon ranking publication bundle drifted: ${weapon.weapon_id} identity changed`);
			error.code = "weapon_publication_bundle_invalid";
			throw error;
		}
	}
	const expectedSourceArtifacts = [...new Set((ranking.availability_overrides || []).map((override) => override.source_artifact))].sort();
	const suppliedSourceArtifacts = Object.keys(ranking.source_artifact_hashes || {}).sort();
	if (stableJson(suppliedSourceArtifacts) !== stableJson(expectedSourceArtifacts)) {
		const error = new Error("Weapon ranking publication bundle drifted: acquisition source artifact set changed");
		error.code = "weapon_publication_bundle_invalid";
		throw error;
	}
	for (const sourceArtifact of expectedSourceArtifacts) {
		const absoluteSource = path.resolve(REPOSITORY_ROOT, sourceArtifact);
		if (
			!absoluteSource.startsWith(`${REPOSITORY_ROOT}${path.sep}`) ||
			!fs.existsSync(absoluteSource) ||
			sha256(fs.readFileSync(absoluteSource, "utf8")) !== ranking.source_artifact_hashes[sourceArtifact]
		) {
			const error = new Error(`Weapon ranking publication bundle drifted: ${sourceArtifact} source hash changed`);
			error.code = "weapon_publication_bundle_invalid";
			throw error;
		}
	}
	const baseline = loadVanillaBaseline();
	if (
		stableJson(ranking.policy?.enhancement_source_hashes) !== stableJson(baseline.source_hashes) ||
		stableJson(ranking.policy?.enhancement_evidence_hashes) !== stableJson(baseline.evidence_hashes)
	) {
		const error = new Error("Weapon ranking publication bundle drifted: pinned enhancement hashes changed");
		error.code = "weapon_publication_bundle_invalid";
		throw error;
	}
	let report;
	try {
		report = enhancementFeasibilityReport(ranking.enhancement_full_sheet_rows, ranking.enhancement_contribution_catalog);
	} catch (cause) {
		const error = new Error(`Weapon ranking publication enhancement evidence is invalid: ${cause.message}`);
		error.code = "weapon_enhancement_evidence_invalid";
		error.cause = cause;
		throw error;
	}
	assertEnhancementFeasibility(report);
	assertOffenseFreeArmorContributions(ranking);
	if (stableJson(ranking.enhancement_feasibility) !== stableJson(compactEnhancementFeasibility(report))) {
		const error = new Error("Weapon ranking publication feasibility summary drifted");
		error.code = "weapon_publication_summary_drift";
		throw error;
	}
	const expectedContributionHash = sha256(
		ranking.enhancement_full_sheet_rows.map((row) => row.states.map((state) => state.rebalanced_contributions?.contributions_sha256)),
	);
	if (
		ranking.hashes?.enhancement_contribution_catalog_sha256 !== ranking.enhancement_contribution_catalog.catalog_sha256 ||
		ranking.hashes?.enhancement_full_sheet_contributions_sha256 !== expectedContributionHash
	) {
		const error = new Error("Weapon ranking publication contribution hashes drifted");
		error.code = "weapon_publication_hash_drift";
		throw error;
	}
	let fixture;
	try {
		fixture = ranking.application ? compactRankingFixture(ranking) : clone(ranking);
		validateRankingFixture(fixture);
	} catch (cause) {
		if (cause.code) throw cause;
		const error = new Error(`Weapon ranking publication bundle drifted: ${cause.message}`);
		error.code = "weapon_publication_bundle_invalid";
		error.cause = cause;
		throw error;
	}
	return true;
}

function markdownReport(fixture) {
	const lines = [
		"# Weapon acquisition ranking",
		"",
		`Weapons: ${fixture.weapons.length}`,
		`Exclusions: ${fixture.exclusions.length}`,
		"",
		"## Locked eleven-rank full-sheet targets",
		"",
		"| Rank | Reference level | Paladin / Priest | Warrior | Ranger / Rogue / Mage | Pinned Warrior weapon |",
		"|---:|---:|---:|---:|---:|---|",
	];
	for (let index = 0; index < fixture.policy.shared_rank_count; index += 1) {
		const source = fixture.enhancement_warrior_targets?.[index];
		lines.push(`| ${index + 1} | ${fixture.policy.reference_levels[index]} | ${fixture.policy.rank_targets_by_skill.paladin[index]} | ${fixture.policy.rank_targets_by_skill.warrior[index]} | ${fixture.policy.rank_targets_by_skill.ranger[index]} | ${source?.mainhand_id || "n/a"} |`);
	}
	lines.push(
		"",
		"Enhancement evidence covers upgrade +0 through +12 and compound +0 through +10.",
		"",
		"| Fully enhanced endpoint | Paladin / Priest | Warrior | Ranger / Rogue / Mage |",
		"|---|---:|---:|---:|",
		`| Rank 1 | ${fixture.policy.enhancement.fully_enhanced_targets.paladin.rank_1} | ${fixture.policy.enhancement.fully_enhanced_targets.warrior.rank_1} | ${fixture.policy.enhancement.fully_enhanced_targets.ranger.rank_1} |`,
		`| Rank 11 | ${fixture.policy.enhancement.fully_enhanced_targets.paladin.rank_11} | ${fixture.policy.enhancement.fully_enhanced_targets.warrior.rank_11} | ${fixture.policy.enhancement.fully_enhanced_targets.ranger.rank_11} |`,
		"",
	);
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
	read = fs.readFileSync,
	write = fs.writeFileSync,
} = {}) {
	let itemsSource = read(itemsFilename, "utf8");
	validateRankingPublicationBundle(generated, { publication: publicationCatalogFromSource(itemsSource, itemsFilename) });
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
		delete entry[row.enhancement_kind === "upgrade" ? "compound" : "upgrade"];
		entry[row.enhancement_kind] = { attack: row.solved_attack_growth };
	}
	itemsSource = itemsSource.replace(mapMatch[0], `var weapon_progression = ${JSON.stringify(publication, null, 2)};\nvar weapon_progression_base_fields`);

	let requirementsSource = read(requirementsFilename, "utf8");
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
		fs.writeFileSync(RANKING_FIXTURE_PATH, serializeFixture(pinned));
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
	CLASS_MULTIPLIERS,
	EXCLUDED_WEAPON_IDS,
	FORBIDDEN_DROP_TABLES,
	PLACEHOLDER_BOOK_RANKS,
	PLACEHOLDER_WEAPON_IDS,
	RANKING_FIXTURE_PATH,
	SHARED_RANK_REQUIREMENTS,
	REFERENCE_LEVELS,
	UPGRADE_LEVELS,
	COMPOUND_LEVELS,
	assertAcyclicSourceGraph,
	assignSemanticRanks,
	buildAcquisitionRanking,
	buildProductionAcquisitionResolver,
	compactRankingFixture,
	compactEnhancementFeasibility,
	fullSheetContext,
	enhancementFeasibilityReport,
	assertEnhancementFeasibility,
	loadRankingFixture,
	loadVanillaBaseline,
	loadSourceData,
	solveNearestSheetTarget,
	main,
	markdownReport,
	publicationCatalogFromSource,
	solveRankedDpsCandidates,
	stableJson,
	validateAllocatedRows,
	validateRankingFixture,
	validateRankingPublicationBundle,
	writeRankingPublication,
};
