"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { RETIRED_ARMOR_ITEM_IDS } = require("../game/equipment_schema");
const { expectedEnhancedCopies, loadSourceData } = require("./acquisition-ranking");
const { buildMonsterCombatTiers } = require("./monster-combat-tiers");
const { serializeFixture } = require("./fixture-serialization");
const { progression } = require("../../design/progression");

const FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-economy.json");
const PROTECTED_BASELINE_PATH = path.resolve(__dirname, "../tests/fixtures/protected-monster-loot-baseline.json");
const COMPLETION_TARGET = 0.8;
const SIMULATION_SAMPLES = 2000;
const SIMULATION_TOLERANCE = 0.035;
const SIMULATION_SEED = 315406;
const RATE_MARGIN = 1.05;
const REFERENCE_WEAPON_IDS = new Set(["fsword", "swifty", "sword", "bataxe", "scythe"]);
const MUTABLE_ORDINARY_MONSTER_IDS = Object.freeze(["arcticbee", "armadillo", "bat", "bbpompom", "cgoo", "croc", "crabx", "ghost", "gscorpion", "osnake", "poisio", "rat", "scorpion", "snake", "spider", "squigtoad", "stoneworm", "tortoise"]);
const TARGET_TIERS = Object.freeze([2, 3, 4, 5, 6]);
const TARGET_ANCHOR_WEAPON_IDS = new Set(TARGET_TIERS.flatMap((tier) => Object.values(progression.WEAPON_PROGRESSION_ANCHORS[tier])));

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function hash(value) {
	return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

function mulberry32(seed) {
	let state = seed >>> 0;
	return () => {
		state += 0x6D2B79F5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function round(value) {
	return Number(Number(value).toPrecision(12));
}

function anchorsForTier(tier) {
	return Object.entries(progression.WEAPON_PROGRESSION_ANCHORS[tier] || {})
		.map(([skill, weapon_id]) => ({ tier, skill, weapon_id }))
		.sort((left, right) => left.skill.localeCompare(right.skill));
}

function activePopulation(data, monsterId) {
	let total = 0;
	for (const map of Object.values(data.maps)) {
		if (map.ignore || map.instance || map.event) continue;
		for (const pack of map.monsters || []) if (!pack.special && pack.stype !== "randomrespawn" && pack.type === monsterId) total += Number(pack.count || 0);
	}
	if (!(total > 0)) throw new Error(`Missing permanent population for ${monsterId}`);
	return total;
}

function killsPerHour({ kill_time_ms, population, respawn }) {
	const killSeconds = Number(kill_time_ms) / 1000;
	const respawnSeconds = Number(respawn);
	if (!(killSeconds > 0 && population > 0 && respawnSeconds >= 0)) throw new Error("Invalid source-backed throughput inputs");
	return Math.min(3600 / killSeconds, population * 3600 / (killSeconds + respawnSeconds));
}

function upgradeSuccess(definition, data) {
	const enhancement = expectedEnhancedCopies(definition, 4, data);
	const probability = 1 / enhancement.base_copies;
	if (!(probability > 0 && probability <= 1)) throw new Error("Invalid +0 to +4 success probability");
	return { enhancement, probability };
}

function directProbability(data, monsterId, itemId) {
	return (data.drops.monsters[monsterId] || [])
		.filter((entry) => entry[1] === itemId)
		.reduce((total, entry) => total + Number(entry[0]), 0);
}

function isCombatWeapon(data, itemId) {
	return Boolean(data.items[itemId]?.progression);
}

function directCombatWeapons(data, monsterId, { exclude_target_anchors = false } = {}) {
	return [...new Set((data.drops.monsters[monsterId] || [])
		.map((entry) => entry[1])
		.filter((itemId) => isCombatWeapon(data, itemId) && !(exclude_target_anchors && TARGET_ANCHOR_WEAPON_IDS.has(itemId))))].sort();
}

function mutableMonsterIds() {
	return new Set(MUTABLE_ORDINARY_MONSTER_IDS);
}

function protectedPayload(data) {
	const mutable = mutableMonsterIds();
	const monster_tables = Object.fromEntries(Object.entries(data.drops.monsters).filter(([monsterId]) => !mutable.has(monsterId)).map(([monsterId, entries]) => [monsterId, entries]));
	const non_monster_tables = Object.fromEntries(Object.entries(data.drops).filter(([key]) => key !== "monsters").map(([key, entries]) => [key, entries]));
	return { monster_tables, non_monster_tables };
}

function buildProtectedBaseline(data = loadSourceData()) {
	const payload = protectedPayload(data);
	return {
		schema_version: 1,
		mutable_ordinary_monsters: [...mutableMonsterIds()].sort(),
		protected_payload: payload,
		protected_payload_sha256: hash(payload),
	};
}

function loadProtectedBaseline(filename = PROTECTED_BASELINE_PATH) {
	const baseline = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!baseline || baseline.schema_version !== 1 || !baseline.protected_payload || !baseline.protected_payload_sha256) throw new Error("Protected loot baseline is invalid");
	return baseline;
}

function validateProtectedBaseline(data = loadSourceData(), baseline = loadProtectedBaseline()) {
	const payload = protectedPayload(data);
	const retired = new Set(RETIRED_ARMOR_ITEM_IDS);
	const removed = Symbol("removed-retired-loot");
	const stripRetiredLoot = (value) => {
		if (Array.isArray(value)) {
			if (value.length > 1 && typeof value[1] === "string" && retired.has(value[1])) return { value: removed, removals: 1 };
			const entries = value.map(stripRetiredLoot);
			return { value: entries.filter((entry) => entry.value !== removed).map((entry) => entry.value), removals: entries.reduce((total, entry) => total + entry.removals, 0) };
		}
		if (value && typeof value === "object") {
			const entries = Object.entries(value).map(([key, entry]) => [key, stripRetiredLoot(entry)]);
			return { value: Object.fromEntries(entries.map(([key, entry]) => [key, entry.value])), removals: entries.reduce((total, [, entry]) => total + entry.removals, 0) };
		}
		return { value, removals: 0 };
	};
	if (hash(baseline.protected_payload) !== baseline.protected_payload_sha256) throw new Error("Protected loot baseline hash is invalid");
	if (stripRetiredLoot(data.drops).removals) throw new Error("Retired armor loot remains in the current drop tables");
	const expected = stripRetiredLoot(baseline.protected_payload).value;
	if (JSON.stringify(payload) !== JSON.stringify(expected) || hash(payload) !== hash(expected))
		throw new Error("Protected loot baseline drifted");
	return true;
}

function combatMonster(combat, monsterId) {
	const monster = combat.monsters.find((row) => row.monster_id === monsterId);
	if (!monster) throw new Error(`Missing combat evidence for ${monsterId}`);
	return monster;
}

function isEligibleCandidate(data, combat, tier, monsterId) {
	if (Number(progression.MONSTER_TIER_ASSIGNMENTS[monsterId]) !== tier || !data.monsters[monsterId]) return false;
	const monster = combatMonster(combat, monsterId);
	if (!(monster.progression_eligible || (tier === 5 && progression.MONSTER_GROUP_RECOMMENDED[monsterId]))) return false;
	try {
		return activePopulation(data, monsterId) > 0;
	} catch {
		return false;
	}
}

function isEligibleFinalDropSource(data, combat, tier, monsterId) {
	if (Number(progression.MONSTER_TIER_ASSIGNMENTS[monsterId]) !== tier || !data.monsters[monsterId]) return false;
	try {
		combatMonster(combat, monsterId);
		return activePopulation(data, monsterId) > 0;
	} catch {
		return false;
	}
}

function combatMargin(data, combat, tier, monsterId, skill, { requireProgressionEligibility = true } = {}) {
	if (!(requireProgressionEligibility ? isEligibleCandidate(data, combat, tier, monsterId) : isEligibleFinalDropSource(data, combat, tier, monsterId))) throw new Error(`Tier-${tier} allocation requires an authored ordinary monster: ${monsterId}`);
	const margin = combatMonster(combat, monsterId).evidence.class_margins.find((row) => row.skill === skill);
	if (!margin) throw new Error(`Missing ${skill} combat margin for ${monsterId}`);
	return margin;
}

function candidateRows(data, combat, tier, candidateOverride) {
	const eligibleIds = (candidateOverride || Object.keys(progression.MONSTER_TIER_ASSIGNMENTS))
		.filter((monsterId) => isEligibleCandidate(data, combat, tier, monsterId))
		.sort();
	const mutable = mutableMonsterIds();
	return {
		candidates: eligibleIds.filter((monster_id) => mutable.has(monster_id)).map((monster_id) => ({
			monster_id,
			capacity: Math.max(0, 2 - directCombatWeapons(data, monster_id, { exclude_target_anchors: true }).length),
			group_recommended: Boolean(progression.MONSTER_GROUP_RECOMMENDED[monster_id]),
		})),
		protection_conflicts: eligibleIds.filter((monster_id) => !mutable.has(monster_id)),
	};
}

function allocationConflict(tier, anchor, candidates, protection_conflicts, reason) {
	return {
		tier,
		anchor: { skill: anchor.skill, weapon_id: anchor.weapon_id },
		reason,
		candidates: candidates.map(({ monster_id, capacity }) => ({ monster_id, capacity })),
		capacity_by_monster: Object.fromEntries(candidates.map(({ monster_id, capacity }) => [monster_id, capacity])),
		protection_conflicts,
	};
}

function allocateTier(tier, anchors, candidates, protection_conflicts) {
	const remaining = candidates.map((candidate) => ({ ...candidate, assignments: 0 }));
	const rows = [];
	const conflicts = [];
	if (remaining.length < 3) return { rows, conflicts: anchors.map((anchor) => allocationConflict(tier, anchor, remaining, protection_conflicts, "fewer_than_three_eligible_species")) };
	for (const anchor of anchors) {
		const candidate = remaining
			.filter((entry) => entry.capacity > 0)
			.sort((left, right) => left.assignments - right.assignments || right.capacity - left.capacity || left.monster_id.localeCompare(right.monster_id))[0];
		if (!candidate) {
			conflicts.push(allocationConflict(tier, anchor, remaining, protection_conflicts, "insufficient_direct_weapon_capacity"));
			continue;
		}
		candidate.capacity -= 1;
		candidate.assignments += 1;
		rows.push({ ...anchor, monster_id: candidate.monster_id, group_recommended: candidate.group_recommended });
	}
	if (new Set(rows.map((row) => row.monster_id)).size < 3) {
		for (const anchor of anchors) conflicts.push(allocationConflict(tier, anchor, remaining, protection_conflicts, "fewer_than_three_allocated_species"));
	}
	return { rows, conflicts };
}

function plannedRow(data, combat, allocation) {
	const margin = combatMargin(data, combat, allocation.tier, allocation.monster_id, allocation.skill);
	const monster = data.monsters[allocation.monster_id];
	const population = activePopulation(data, allocation.monster_id);
	const kills_per_hour = killsPerHour({ kill_time_ms: margin.kill_time_ms, population, respawn: monster.respawn });
	const { enhancement, probability: copy_success_probability } = upgradeSuccess(data.items[allocation.weapon_id], data);
	const stage_hours = progression.WEAPON_PROGRESSION_SCHEDULE[allocation.tier].stage_active_hours;
	const minimum_drop_probability = -Math.log(1 - COMPLETION_TARGET) / (stage_hours * kills_per_hour * copy_success_probability);
	return {
		...allocation,
		kill_time_ms: margin.kill_time_ms,
		population,
		respawn_seconds: Number(monster.respawn),
		kills_per_hour: round(kills_per_hour),
		stage_hours,
		item_grade: enhancement.transitions[0].probability_grade,
		copy_success_probability: round(copy_success_probability),
		expected_copies: enhancement.base_copies,
		minimum_drop_probability: round(minimum_drop_probability),
		planned_drop_probability: round(minimum_drop_probability * RATE_MARGIN),
		upgrade_transitions: enhancement.transitions,
	};
}

function buildRecommendation(data = loadSourceData(), { candidate_overrides = {} } = {}) {
	const combat = buildMonsterCombatTiers(data);
	const rows = [];
	const conflicts = [];
	for (const tier of TARGET_TIERS) {
		const candidates = candidateRows(data, combat, tier, candidate_overrides[tier]);
		const allocation = allocateTier(tier, anchorsForTier(tier), candidates.candidates, candidates.protection_conflicts);
		conflicts.push(...allocation.conflicts);
		rows.push(...allocation.rows.map((row) => plannedRow(data, combat, row)));
	}
	return {
		schema_version: 2,
		completion_target: COMPLETION_TARGET,
		rows: rows.sort((left, right) => left.tier - right.tier || left.skill.localeCompare(right.skill)),
		conflicts: conflicts.sort((left, right) => left.tier - right.tier || left.anchor.weapon_id.localeCompare(right.anchor.weapon_id) || left.reason.localeCompare(right.reason)),
	};
}

function simulatedCompletion({ probability, transitions, kills_per_hour, stage_hours, seed }) {
	const random = mulberry32(seed);
	const maximumKills = Math.floor(kills_per_hour * stage_hours);
	let completed = 0;
	for (let sample = 0; sample < SIMULATION_SAMPLES; sample += 1) {
		let kills = 0;
		while (kills < maximumKills) {
			kills += Math.floor(Math.log1p(-random()) / Math.log1p(-probability)) + 1;
			if (kills > maximumKills) break;
			if (transitions.every((transition) => random() < transition.success_probability)) {
				completed += 1;
				break;
			}
		}
	}
	return { seed, samples: SIMULATION_SAMPLES, tolerance: SIMULATION_TOLERANCE, completion_probability: round(completed / SIMULATION_SAMPLES) };
}

function finalDirectRoutes(data, combat, tier, weaponId) {
	return Object.keys(data.drops.monsters)
		.filter((monsterId) => directProbability(data, monsterId, weaponId) > 0 && isEligibleFinalDropSource(data, combat, tier, monsterId))
		.sort();
}

function sourceRow(data, combat, anchor, index, violations) {
	const routeIds = finalDirectRoutes(data, combat, anchor.tier, anchor.weapon_id);
	if (routeIds.length !== 1) violations.push({ tier: anchor.tier, weapon_id: anchor.weapon_id, reason: routeIds.length ? "ambiguous_final_direct_drop" : "missing_final_direct_drop", monster_ids: routeIds });
	const monster_id = routeIds[0] || null;
	if (!monster_id) return { ...anchor, monster_id, pacing_reference: REFERENCE_WEAPON_IDS.has(anchor.weapon_id), final_drop_probability: 0, completion_probability: null, mean_hours: null, median_hours: null, p90_hours: null, simulation: null };
	const margin = combatMargin(data, combat, anchor.tier, monster_id, anchor.skill, { requireProgressionEligibility: false });
	const monster = data.monsters[monster_id];
	const population = activePopulation(data, monster_id);
	const kills_per_hour = killsPerHour({ kill_time_ms: margin.kill_time_ms, population, respawn: monster.respawn });
	const { enhancement, probability: copy_success_probability } = upgradeSuccess(data.items[anchor.weapon_id], data);
	const stage_hours = progression.WEAPON_PROGRESSION_SCHEDULE[anchor.tier].stage_active_hours;
	const final_drop_probability = directProbability(data, monster_id, anchor.weapon_id);
	const success_rate_per_hour = kills_per_hour * final_drop_probability * copy_success_probability;
	const completion_probability = 1 - Math.exp(-success_rate_per_hour * stage_hours);
	const simulation = simulatedCompletion({ probability: final_drop_probability, transitions: enhancement.transitions, kills_per_hour, stage_hours, seed: SIMULATION_SEED + index * 9973 });
	const row = {
		...anchor,
		monster_id,
		group_recommended: Boolean(progression.MONSTER_GROUP_RECOMMENDED[monster_id]),
		kill_time_ms: margin.kill_time_ms,
		population,
		respawn_seconds: Number(monster.respawn),
		kills_per_hour: round(kills_per_hour),
		stage_hours,
		item_grade: enhancement.transitions[0].probability_grade,
		copy_success_probability: round(copy_success_probability),
		expected_copies: enhancement.base_copies,
		minimum_drop_probability: round(-Math.log(1 - COMPLETION_TARGET) / (stage_hours * kills_per_hour * copy_success_probability)),
		final_drop_probability: round(final_drop_probability),
		pacing_reference: REFERENCE_WEAPON_IDS.has(anchor.weapon_id),
		completion_probability: round(completion_probability),
		mean_hours: round(1 / success_rate_per_hour),
		median_hours: round(Math.log(2) / success_rate_per_hour),
		p90_hours: round(Math.log(10) / success_rate_per_hour),
		simulation,
		upgrade_transitions: enhancement.transitions,
	};
	if (row.pacing_reference && final_drop_probability < row.minimum_drop_probability) violations.push({ tier: row.tier, weapon_id: row.weapon_id, reason: "completion_probability_below_target", actual: row.completion_probability, required: COMPLETION_TARGET });
	if (Math.abs(simulation.completion_probability - completion_probability) > simulation.tolerance) violations.push({ tier: row.tier, weapon_id: row.weapon_id, reason: "simulation_disagrees_with_analytic", actual: simulation.completion_probability, expected: round(completion_probability) });
	if (row.pacing_reference && simulation.completion_probability < COMPLETION_TARGET - simulation.tolerance) violations.push({ tier: row.tier, weapon_id: row.weapon_id, reason: "simulation_completion_below_tolerance", actual: simulation.completion_probability, required: COMPLETION_TARGET - simulation.tolerance });
	return row;
}

function buildSourceVerification(data) {
	const combat = buildMonsterCombatTiers(data);
	const violations = [];
	const rows = TARGET_TIERS.flatMap((tier) => anchorsForTier(tier)).map((anchor, index) => sourceRow(data, combat, anchor, index, violations));
	for (const tier of TARGET_TIERS) {
		const tierRows = rows.filter((row) => row.tier === tier && row.monster_id);
		if (new Set(tierRows.map((row) => row.monster_id)).size < 3) violations.push({ tier, reason: "fewer_than_three_allocated_species" });
		for (const monster_id of new Set(tierRows.map((row) => row.monster_id))) {
			const directWeaponIds = directCombatWeapons(data, monster_id);
			if (directWeaponIds.length > 2) violations.push({ tier, monster_id, reason: "direct_weapon_cap_exceeded", weapon_ids: directWeaponIds });
		}
	}
	return { rows, violations };
}

function buildEconomyEvidence(data = loadSourceData()) {
	const verification = buildSourceVerification(data);
	return {
		schema_version: 2,
		policy: { completion_target: COMPLETION_TARGET, rate_margin: RATE_MARGIN, reference_weapon_ids: [...REFERENCE_WEAPON_IDS], simulation_seed: SIMULATION_SEED, simulation_samples: SIMULATION_SAMPLES, simulation_tolerance: SIMULATION_TOLERANCE, schedule: progression.WEAPON_PROGRESSION_SCHEDULE },
		rows: verification.rows,
		violations: verification.violations.sort((left, right) => left.tier - right.tier || String(left.weapon_id || left.monster_id).localeCompare(String(right.weapon_id || right.monster_id)) || left.reason.localeCompare(right.reason)),
	};
}

function validateRecommendation(recommendation) {
	if (!recommendation || recommendation.schema_version !== 2 || !Array.isArray(recommendation.rows) || !Array.isArray(recommendation.conflicts)) throw new Error("Weapon progression allocation recommendation is invalid");
	if (recommendation.conflicts.length) throw new Error(`Weapon progression allocation has no legal distribution: ${serializeFixture(recommendation.conflicts).trim()}`);
	return true;
}

function validateEconomyEvidence(evidence) {
	if (!evidence || evidence.schema_version !== 2 || evidence.rows?.length !== 30 || !Array.isArray(evidence.violations)) throw new Error("Weapon progression economy fixture is invalid");
	if (evidence.violations.length) throw new Error(`Weapon progression economy is infeasible: ${serializeFixture(evidence.violations).trim()}`);
	for (const row of evidence.rows) {
		if (!(Number.isFinite(row.completion_probability) && Number.isFinite(row.mean_hours) && row.mean_hours > 0 && Number.isFinite(row.median_hours) && row.median_hours > 0 && Number.isFinite(row.p90_hours) && row.p90_hours > 0 && Number.isFinite(row.simulation?.completion_probability))) throw new Error(`Weapon progression economy fixture lacks diagnostics for ${row.weapon_id}`);
	}
	return true;
}

function verifyEconomyFixture() {
	const actual = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
	const expected = buildEconomyEvidence();
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("weapon-progression-economy.json drifted from final source data");
	validateEconomyEvidence(actual);
	validateProtectedBaseline();
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--capture-protected-baseline")) {
		if (fs.existsSync(PROTECTED_BASELINE_PATH)) throw new Error("Protected loot baseline already exists and cannot be overwritten");
		fs.writeFileSync(PROTECTED_BASELINE_PATH, serializeFixture(buildProtectedBaseline()));
		return;
	}
	if (argv.includes("--write-protected-baseline")) throw new Error("Protected loot baseline is immutable; use --capture-protected-baseline only before source edits");
	if (argv.includes("--write")) {
		validateRecommendation(buildRecommendation());
		const evidence = buildEconomyEvidence();
		validateEconomyEvidence(evidence);
		fs.writeFileSync(FIXTURE_PATH, serializeFixture(evidence));
		return;
	}
	if (argv.includes("--verify")) return verifyEconomyFixture();
	throw new Error("Use --capture-protected-baseline, --write, or --verify");
}

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { FIXTURE_PATH, PROTECTED_BASELINE_PATH, buildEconomyEvidence, buildProtectedBaseline, buildRecommendation, directCombatWeapons, loadProtectedBaseline, main, validateEconomyEvidence, validateProtectedBaseline };
