"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { progression } = require("../../design/progression");

const ROOT = path.resolve(__dirname, "../..");
const SKILL_XP_PATH = path.join(ROOT, "design/skill_xp.js");
const MONSTERS_PATH = path.join(ROOT, "design/monsters.js");
const MAPS_PATH = path.join(ROOT, "design/maps.js");
const ECONOMY_PATH = path.join(ROOT, "node/tests/fixtures/weapon-progression-economy.json");
const COMBAT_EVIDENCE_PATH = path.join(ROOT, "node/tests/fixtures/equipment-combat-matrix.json");
const FIXTURE_PATH = path.join(ROOT, "node/tests/fixtures/combat-xp-pacing.json");

function sha256(value) {
	return crypto.createHash("sha256").update(value).digest("hex");
}

function loadMonsters() {
	const context = {};
	vm.createContext(context);
	const source = fs.readFileSync(MONSTERS_PATH, "utf8");
	vm.runInContext(source, context, { filename: MONSTERS_PATH });
	return { monsters: context.monsters, source };
}

function loadPopulation(monsters) {
	const context = {};
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(MAPS_PATH, "utf8"), context, { filename: MAPS_PATH });
	const population = new Map();
	for (const map of Object.values(context.maps || {})) {
		if (map.ignore || map.instance || map.event) continue;
		for (const pack of map.monsters || []) {
			if (pack.special || pack.stype === "randomrespawn" || !(Number(pack.count) > 0) || !monsters[pack.type]) continue;
			population.set(pack.type, (population.get(pack.type) || 0) + Number(pack.count));
		}
	}
	return population;
}

function historicalMerchantTable() {
	return Object.fromEntries(
		Array.from({ length: progression.MAX_LEVEL }, (_, index) => {
			const level = index + 1;
			return [level, Math.round(progression.MAX_XP * Math.pow((level - 1) / (progression.MAX_LEVEL - 1), 2))];
		}),
	);
}

function requireValid(condition, message) {
	if (!condition) throw new Error(message);
}

function expectedTier(targetLevel) {
	const tier = progression.WEAPON_RANK_REQUIREMENTS.indexOf(targetLevel) + 1;
	requireValid(tier >= 2 && tier <= 6, `Invalid Warrior pacing target level: ${targetLevel}`);
	return tier;
}

function killsPerHour({ kill_time_ms, population, respawn_seconds }) {
	const killSeconds = Number(kill_time_ms) / 1000;
	requireValid(killSeconds > 0 && population > 0 && Number(respawn_seconds) >= 0, "Invalid Tier-6 sustained-throughput inputs");
	return Math.min(3600 / killSeconds, (population * 3600) / (killSeconds + Number(respawn_seconds)));
}

function readInputs() {
	const monsterData = loadMonsters();
	return {
		policy: progression.COMBAT_XP_PACING,
		economy: JSON.parse(fs.readFileSync(ECONOMY_PATH, "utf8")),
		combatEvidence: JSON.parse(fs.readFileSync(COMBAT_EVIDENCE_PATH, "utf8")),
		population: loadPopulation(monsterData.monsters),
		...monsterData,
	};
}

function referenceRoute(stage, policy, economy, monsters) {
	const route = economy.rows?.find(
		(row) => row.skill === policy.reference_skill && row.pacing_reference === true && row.tier === expectedTier(stage.target_level),
	);
	requireValid(route, `Missing Warrior reference route for level ${stage.target_level}`);
	requireValid(route.monster_id === stage.route_monster_id, `Warrior reference route mismatch for level ${stage.target_level}`);
	requireValid(Number.isFinite(route.kills_per_hour) && route.kills_per_hour > 0, `Invalid Warrior route throughput: ${route.monster_id}`);
	const published = progression.MONSTER_PROGRESSION[route.monster_id];
	requireValid(monsters[route.monster_id] && published, `Missing Warrior route source: ${route.monster_id}`);
	requireValid(published.tier === route.tier, `Warrior route has the wrong tier: ${route.monster_id}`);
	if (stage.target_level === 90)
		requireValid(published.progression_eligible && policy.final_route.availability.every((value) => published.availability.includes(value)), `Warrior route is not safe for Tier-6: ${route.monster_id}`);
	return route;
}

function finalRoute(policy, combatEvidence, monsters, population) {
	const finalPolicy = policy.final_route;
	requireValid(finalPolicy && finalPolicy.tier === 6, "Combat XP policy must require Tier-6 final routes");
	requireValid(finalPolicy.selection === "highest_sustained_base_xp_per_hour_then_monster_id", "Combat XP policy has an unknown final-route ordering");
	requireValid(finalPolicy.availability?.join("\\0") === "permanent\\0ordinary", "Combat XP policy must require permanent ordinary final routes");
	const weaponId = progression.WEAPON_PROGRESSION_ANCHORS[5]?.[policy.reference_skill];
	const evidence = combatEvidence.sidegrade_unlocks?.find((row) => row.skill === policy.reference_skill && row.weapon_id === weaponId && row.target_tier === finalPolicy.tier);
	requireValid(evidence, "Missing Warrior Tier-6 safety evidence");
	const candidates = [];
	for (const result of evidence.results || []) {
		if (!result.passed) continue;
		const id = result.monster_id;
		const monster = monsters[id];
		const published = progression.MONSTER_PROGRESSION[id];
		requireValid(monster && published, `Missing Tier-6 final source: ${id}`);
		if (published.tier !== finalPolicy.tier || !finalPolicy.availability.every((value) => published.availability.includes(value)) || (finalPolicy.requires_progression_eligibility && !published.progression_eligible)) continue;
		const rate = killsPerHour({ kill_time_ms: result.kill_time_ms, population: population.get(id), respawn_seconds: monster.respawn });
		requireValid(Number.isSafeInteger(monster.xp) && monster.xp > 0, `Invalid Tier-6 monster XP: ${id}`);
		candidates.push({ monster_id: id, kills_per_hour: rate, base_xp_per_hour: monster.xp * rate, monster_xp: monster.xp });
	}
	requireValid(candidates.length, "No safe permanent ordinary Tier-6 Warrior route");
	return candidates.sort((left, right) => right.base_xp_per_hour - left.base_xp_per_hour || left.monster_id.localeCompare(right.monster_id))[0];
}

function build(overrides = {}) {
	const inputs = { ...readInputs(), ...overrides };
	const { policy, economy, combatEvidence, monsters, population, source } = inputs;
	requireValid(policy?.reference_skill === "warrior", "Combat XP policy must use Warrior as its reference skill");
	requireValid(policy.base_xpm === 1 && policy.party_share === 1, "Combat XP policy must use unboosted solo rewards");
	requireValid(Number.isFinite(policy.target_xp_multiplier) && policy.target_xp_multiplier > 0 && policy.target_xp_multiplier <= 1, "Combat XP policy must use a valid target XP multiplier");
	requireValid(Array.isArray(policy.stages) && policy.stages.length === 6, "Combat XP policy must define six pacing stages");
	const final = finalRoute(policy, combatEvidence, monsters, population);
	const combat = { 1: 0 };
	const stages = [];
	let previousLevel = 1;
	let previousHours = 0;
	let previousXp = 0;
	for (const stage of policy.stages) {
		requireValid(Number.isInteger(stage.target_level) && stage.target_level > previousLevel && Number.isFinite(stage.cumulative_active_hours) && stage.cumulative_active_hours > previousHours, `Invalid pacing stage at level ${stage.target_level}`);
		const route = stage.route_monster_id ? referenceRoute(stage, policy, economy, monsters) : final;
		const xp = Number(monsters?.[route.monster_id]?.xp);
		const kills = Number(route.kills_per_hour);
		requireValid(Number.isSafeInteger(xp) && xp > 0 && Number.isFinite(kills) && kills > 0, `Invalid Warrior pacing source: ${route.monster_id}`);
		const stageHours = stage.cumulative_active_hours - previousHours;
		const ratePerHour = xp * kills;
		const pacingXpPerHour = ratePerHour * policy.target_xp_multiplier;
		const targetXp = previousXp + Math.round(pacingXpPerHour * stageHours);
		for (let level = previousLevel + 1; level <= stage.target_level; level += 1)
			combat[level] = previousXp + Math.round(((targetXp - previousXp) * (level - previousLevel)) / (stage.target_level - previousLevel));
		stages.push({ target_level: stage.target_level, cumulative_active_hours: stage.cumulative_active_hours, monster_id: route.monster_id, stage_active_hours: stageHours, monster_xp: xp, kills_per_hour: kills, base_xp_per_hour: ratePerHour, pacing_xp_per_hour: pacingXpPerHour, cumulative_xp: targetXp });
		previousLevel = stage.target_level;
		previousHours = stage.cumulative_active_hours;
		previousXp = targetXp;
	}
	requireValid(combat[99] >= policy.legacy_cap_floor, "Combat XP cap is below the legacy cap");
	for (let level = 2; level <= 99; level += 1) requireValid(Number.isSafeInteger(combat[level]) && combat[level] > combat[level - 1], `Combat XP threshold is invalid at level ${level}`);
	const merchant = historicalMerchantTable();
	return {
		tables: { combat, merchant },
		fixture: {
			schema_version: 1,
			policy: { reference_skill: policy.reference_skill, bonus_xpm: policy.base_xpm, party_share: policy.party_share, target_xp_multiplier: policy.target_xp_multiplier, final_tier: policy.final_route.tier, final_target_hours: policy.stages.at(-1).cumulative_active_hours, final_route: policy.final_route.selection },
			source_hashes: { "design/monsters.js": sha256(source), "weapon-progression-economy.json": sha256(fs.readFileSync(ECONOMY_PATH)), "equipment-combat-matrix.json": sha256(fs.readFileSync(COMBAT_EVIDENCE_PATH)) },
			stages,
			combat_cap: combat[99],
			merchant_cap: merchant[99],
		},
	};
}

function renderSkillXp(tables) {
	return `var skill_xp = ${JSON.stringify(tables, null, "\t")};\nif (typeof module !== "undefined") module.exports = { skill_xp: skill_xp };\n`;
}

function main(argv = process.argv.slice(2)) {
	const output = build();
	const skillSource = renderSkillXp(output.tables);
	const fixtureSource = JSON.stringify(output.fixture) + "\n";
	if (argv.includes("--write")) {
		fs.writeFileSync(SKILL_XP_PATH, skillSource);
		fs.writeFileSync(FIXTURE_PATH, fixtureSource);
	}
	if (argv.includes("--verify") && (fs.readFileSync(SKILL_XP_PATH, "utf8") !== skillSource || fs.readFileSync(FIXTURE_PATH, "utf8") !== fixtureSource)) {
		process.stderr.write("Combat XP pacing artifacts are stale\\n");
		process.exitCode = 1;
	}
	if (!argv.includes("--write") && !argv.includes("--verify")) process.stdout.write(fixtureSource);
}

if (require.main === module) main();

module.exports = { build, historicalMerchantTable, main, renderSkillXp };
