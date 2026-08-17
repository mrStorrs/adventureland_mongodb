"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { DIRECT_EFFECT_KEYS, directDps } = require("../game/direct_effects");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { isCompatibleOffhand } = require("../game/equipment");
const { calculateStats } = require("../game/stats");
const { loadSourceData } = require("./acquisition-ranking");
const { serializeFixture } = require("./fixture-serialization");
const { progression } = require("../../design/progression");

const FIXTURE_DIRECTORY = path.resolve(__dirname, "../tests/fixtures");
const COMBAT_SKILLS = Object.freeze(["warrior", "paladin", "mage", "priest", "ranger", "rogue"]);
const REQUIREMENTS = progression.WEAPON_RANK_REQUIREMENTS;

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
	for (const file of ["multipliers.js", "items.js"])
		vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../design", file), "utf8"), sandbox, { filename: file });
	sandbox.G.items = data.items;
	vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../js/old_common_functions.js"), "utf8"), sandbox, { filename: "old_common_functions.js" });
	return { current: { calculate_item_properties: sandbox.calculate_item_properties } };
}

function combatWeapons(data = loadSourceData()) {
	return Object.entries(data.items)
		.filter(([, item]) => item.type === "weapon" && item.progression && WEAPON_PROFILES[item.wtype])
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
	const sets = Object.fromEntries(Object.entries(data.sets).sort(([left], [right]) => left.localeCompare(right)).map(([set_id, set]) => [set_id, { weight: set.weight, bonus_items: set.bonus_items, thresholds: Object.fromEntries([2, 3, 4, 5].map((count) => [count, set[count]])) }]));
	return { schema_version: 3, set_count: Object.keys(sets).length, sets, hash: hash(sets) };
}

function buildBalanceContract(data = loadSourceData()) {
	const weapons = buildWeaponLoadoutBalanceFixture(data);
	return {
		schema_version: 4,
		failure_policy: "fail-closed",
		direct_effect_keys: [...DIRECT_EFFECT_KEYS],
		weapon_authority: { fixture: "weapon-loadout-balance.json", weapon_count: weapons.counts.weapons, rank_count: weapons.counts.rank_bands, cadence_owner: weapons.policy.cadence_owner, endpoint_tolerance: 1e-9 },
		armor_authority: { fixture: "armor-set-balance.json", set_count: Object.keys(data.sets).length },
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
	return require("./monster-combat-tiers").buildEquipmentCombatMatrix(data, { weapon_states: weaponStates(data) });
}

function fixturePath(name) {
	return path.join(FIXTURE_DIRECTORY, name);
}

function writeFixture(name, value) {
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
