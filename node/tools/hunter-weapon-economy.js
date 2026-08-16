"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { activeSkillFromItem } = require("../game/active_skill");
const { calculateHuntCount, huntPopulation } = require("../game/monster_progression");
const { serializeFixture } = require("./fixture-serialization");
const { dropOutcomeProbability, loadSourceData, runtimeEventDropRoots, runtimeEventExchangeRewardRoots } = require("./acquisition-ranking");
const { progression } = require("../../design/progression");

const FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/hunter-weapon-economy.json");
const ORDINARY_ECONOMY_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-economy.json");
const COMBAT_TIER_PATH = path.resolve(__dirname, "../tests/fixtures/monster-combat-tiers.json");
const HUNTER_WEAPON_IDS = Object.freeze(["mhbook", "mhcrossbow", "mhdagger", "mhhammer", "mhspear", "mhwand"]);

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function hash(value) {
	return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function median(values) {
	const sorted = [...values].sort((left, right) => left - right);
	if (!sorted.length || sorted.some((value) => !Number.isFinite(value))) throw new Error("Cannot calculate a finite median");
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function round(value) {
	return Number(Number(value).toPrecision(12));
}

function loadJson(filename) {
	return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function sourceFixtures() {
	return { ordinary: loadJson(ORDINARY_ECONOMY_PATH), combat: loadJson(COMBAT_TIER_PATH) };
}

function hunterWeapons(data) {
	return HUNTER_WEAPON_IDS.map((weapon_id) => {
		const item = data.items[weapon_id];
		return { weapon_id, skill: activeSkillFromItem(item), item };
	});
}

function ordinaryCopyRows(ordinary) {
	return ordinary.rows
		.filter((row) => row.tier === 5)
		.map((row) => ({ skill: row.skill, weapon_id: row.weapon_id, monster_id: row.monster_id, copy_hours: round(1 / (Number(row.kills_per_hour) * Number(row.final_drop_probability))) }))
		.sort((left, right) => left.skill.localeCompare(right.skill));
}

function tierFiveHuntRows(data, combat) {
	const targets = combat.monsters.filter((monster) => monster.tier === 5 && monster.hunter_eligible).sort((left, right) => left.monster_id.localeCompare(right.monster_id));
	const rows = [];
	for (const monster of targets) {
		const definition = data.monsters[monster.monster_id];
		const count = calculateHuntCount({ population: huntPopulation(data.maps, monster.monster_id), max_hp: definition?.hp, respawn: definition?.respawn, hardcore: false });
		for (const margin of monster.evidence.class_margins || []) {
			const hunt_hours = count && Number(margin.kill_time_ms) * count / (60 * 60 * 1000);
			if (Number.isFinite(hunt_hours) && hunt_hours > 0) rows.push({ skill: margin.skill, monster_id: monster.monster_id, population: huntPopulation(data.maps, monster.monster_id), hunt_count: count, kill_time_ms: margin.kill_time_ms, hunt_hours: round(hunt_hours) });
		}
	}
	return rows.sort((left, right) => left.skill.localeCompare(right.skill) || left.monster_id.localeCompare(right.monster_id));
}

function collectDropTableRoots(value, route_id = "drops", roots = []) {
	if (Array.isArray(value)) {
		if (value.every((entry) => Array.isArray(entry))) roots.push({ route_id, entries: value });
		return roots;
	}
	if (value && typeof value === "object")
		for (const [key, child] of Object.entries(value)) collectDropTableRoots(child, `${route_id}.${key}`, roots);
	return roots;
}

function runtimeSources() {
	return {
		"node/server.js": fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8"),
		"node/server_functions.js": fs.readFileSync(path.resolve(__dirname, "../server_functions.js"), "utf8"),
	};
}

function resolvedDropSources(data, weapon_id) {
	const sources = runtimeSources();
	const roots = collectDropTableRoots(data.drops);
	for (const root of runtimeEventDropRoots(data, sources["node/server_functions.js"])) roots.push({ route_id: root.route_id, entries: root.entries });
	for (const root of runtimeEventExchangeRewardRoots(data, sources))
		for (const component of root.outcome_components)
			roots.push({ route_id: component.route_id, entries: data.drops[component.drop_table_id] });
	return roots
		.filter((root) => Array.isArray(root.entries))
		.map((root) => ({
			route_id: root.route_id,
			probability: dropOutcomeProbability(root.entries, weapon_id, data.drops, { items: data.items, forbiddenTables: [], chanceData: data }),
		}))
		.filter((route) => route.probability > 0)
		.sort((left, right) => left.route_id.localeCompare(right.route_id));
}

function buildHunterWeaponEconomy(data = loadSourceData()) {
	const { ordinary, combat } = sourceFixtures();
	const violations = [];
	const weapons = hunterWeapons(data);
	const ordinary_copy_rows = ordinaryCopyRows(ordinary);
	const tier5_hunt_rows = tierFiveHuntRows(data, combat);
	const ordinary_copy_hours = median(ordinary_copy_rows.map((row) => row.copy_hours));
	const tier5_hunt_hours = median(tier5_hunt_rows.map((row) => row.hunt_hours));
	const whole_hunts = Math.ceil(ordinary_copy_hours / tier5_hunt_hours);
	const shared_price = whole_hunts * Number(progression.HUNTER_TOKEN_REWARDS[5]);
	if (!(Number.isSafeInteger(whole_hunts) && whole_hunts > 0 && Number.isSafeInteger(shared_price) && shared_price > 0)) violations.push({ reason: "invalid_shared_price", ordinary_copy_hours, tier5_hunt_hours, whole_hunts, shared_price });
	if (ordinary_copy_rows.length !== 6 || new Set(ordinary_copy_rows.map((row) => row.skill)).size !== 6) violations.push({ reason: "ordinary_rank5_copy_rows_incomplete" });
	if (!tier5_hunt_rows.length || tier5_hunt_rows.some((row) => !(row.hunt_count > 0 && row.hunt_hours > 0))) violations.push({ reason: "tier5_hunt_rows_incomplete" });
	const declaredHunterIds = Object.entries(data.items).filter(([, item]) => item.type === "weapon" && item.hunter_only).map(([itemId]) => itemId).sort();
	if (JSON.stringify(declaredHunterIds) !== JSON.stringify([...HUNTER_WEAPON_IDS].sort()) || weapons.length !== 6 || new Set(weapons.map((weapon) => weapon.skill)).size !== 6 || weapons.some((weapon) => !weapon.item?.hunter_only || weapon.item?.progression?.shared_rank !== 5)) violations.push({ reason: "hunter_weapon_catalog_incomplete", declaredHunterIds });
	const token_prices = Object.fromEntries(HUNTER_WEAPON_IDS.map((weapon_id) => [weapon_id, data.tokens.monstertoken?.[weapon_id]]));
	for (const weapon of weapons) {
		if (token_prices[weapon.weapon_id] !== shared_price) violations.push({ reason: "hunter_weapon_price_mismatch", weapon_id: weapon.weapon_id, actual: token_prices[weapon.weapon_id], expected: shared_price });
		const drop_routes = resolvedDropSources(data, weapon.weapon_id);
		const shops = Object.entries(data.npcs).filter(([, npc]) => (npc.items || []).includes(weapon.weapon_id)).map(([npc_id]) => npc_id);
		const recipe_outputs = Object.hasOwn(data.craft, weapon.weapon_id) ? [weapon.weapon_id] : [];
		if (drop_routes.length || shops.length || recipe_outputs.length) violations.push({ reason: "hunter_weapon_has_non_token_source", weapon_id: weapon.weapon_id, drop_routes, shops, recipe_outputs });
	}
	return {
		schema_version: 1,
		source_hashes: { ordinary_economy: hash(ordinary), combat_tiers: hash(combat) },
		hunter_weapon_ids: HUNTER_WEAPON_IDS,
		ordinary_copy_rows,
		tier5_hunt_rows,
		ordinary_copy_hours: round(ordinary_copy_hours),
		tier5_hunt_hours: round(tier5_hunt_hours),
		whole_hunts,
		tier5_token_reward: progression.HUNTER_TOKEN_REWARDS[5],
		shared_price,
		token_prices,
		violations,
	};
}

function validateHunterWeaponEconomy(evidence) {
	if (!evidence || evidence.schema_version !== 1 || evidence.hunter_weapon_ids?.length !== 6 || !Array.isArray(evidence.violations)) throw new Error("Hunter weapon economy fixture is invalid");
	if (evidence.violations.length) throw new Error(`Hunter weapon economy is infeasible: ${serializeFixture(evidence.violations).trim()}`);
	return true;
}

function verifyHunterWeaponEconomy() {
	const actual = loadJson(FIXTURE_PATH);
	const expected = buildHunterWeaponEconomy();
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("hunter-weapon-economy.json drifted from final source data");
	validateHunterWeaponEconomy(actual);
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--write")) {
		const evidence = buildHunterWeaponEconomy();
		validateHunterWeaponEconomy(evidence);
		fs.writeFileSync(FIXTURE_PATH, serializeFixture(evidence));
		return;
	}
	if (argv.includes("--verify")) return verifyHunterWeaponEconomy();
	throw new Error("Use --write or --verify");
}

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { FIXTURE_PATH, buildHunterWeaponEconomy, resolvedDropSources, validateHunterWeaponEconomy };
