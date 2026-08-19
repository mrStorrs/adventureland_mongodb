"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { progression } = require("../../design/progression");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { isCompatibleOffhand } = require("../game/equipment");
const { publishCumulativeSetThresholds } = require("../game/equipment_schema");
const { calculateStats } = require("../game/stats");
const { buildProductionAcquisitionResolver, loadSourceData } = require("./acquisition-ranking");
const { serializeFixture } = require("./fixture-serialization");

const COMBAT_SKILLS = Object.freeze(["warrior", "paladin", "mage", "priest", "ranger", "rogue"]);
const ARMOR_TYPES = Object.freeze(["helmet", "chest", "pants", "gloves", "shoes"]);
const ARMOR_SET_BY_WEAPON_RANK = Object.freeze({ 1: "basic", 2: "wanderers", 3: "rugged", 4: "wt3", 5: "wt4" });
const OFFHAND_TYPES = new Set(["shield", "source", "quiver", "misc_offhand"]);
const EXCLUDED_SET_IDS = new Set(["bunny", "fury", "holidays", "legends", "mpx", "tiger", "vampires"]);
const FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/monster-combat-tiers.json");
const COMBAT_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/equipment-combat-matrix.json");
const canonicalRouteCache = new WeakMap();

function damageMultiplier(defense) {
	const positive = Math.max(0, defense);
	const negative = Math.max(0, -defense);
	const resistance =
		Math.min(100, positive) * .001 +
		Math.min(100, Math.max(0, positive - 100)) * .001 +
		Math.min(100, Math.max(0, positive - 200)) * .00095 +
		Math.min(100, Math.max(0, positive - 300)) * .0009 +
		Math.min(100, Math.max(0, positive - 400)) * .00082 +
		Math.min(100, Math.max(0, positive - 500)) * .0007 +
		Math.min(100, Math.max(0, positive - 600)) * .0006 +
		Math.min(100, Math.max(0, positive - 700)) * .0005 +
		Math.max(0, positive - 800) * .0004 +
		Math.min(50, negative) * .001 +
		Math.min(50, Math.max(0, negative - 50)) * .00075 +
		Math.min(50, Math.max(0, negative - 100)) * .0005 +
		Math.max(0, negative - 150) * .00025;
	return Math.min(1.32, Math.max(.05, 1 - resistance));
}

function activePopulationByMonster(data) {
	const populations = new Map();
	for (const map of Object.values(data.maps)) {
		if (map.ignore || map.instance || map.event) continue;
		for (const pack of map.monsters || []) {
			if (pack.special || pack.stype === "randomrespawn" || !(Number(pack.count) > 0) || !data.monsters[pack.type]) continue;
			populations.set(pack.type, (populations.get(pack.type) || 0) + Number(pack.count));
		}
	}
	return populations;
}

function isAttackable(monster) {
	return Boolean(monster && Number(monster.hp) > 0 && Number(monster.attack) > 0);
}

function isPermanentOrdinary(monster, population) {
	return Boolean(
		isAttackable(monster) &&
		population > 0 &&
		Number(monster.xp) > 0 &&
		Number(monster.respawn) >= 0 &&
		!monster.special &&
		!monster.operator &&
		!monster.rbuff &&
		!monster.event &&
		!monster.raid &&
		!monster.boss &&
		!monster.cooperative &&
		!monster.hide &&
		!monster.respawn_as &&
		Number(monster.respawn) <= 300 &&
		!monster.immune
	);
}

function monsterAvailability(monster, population) {
	const flags = [];
	if (population > 0) flags.push("permanent");
	if (isPermanentOrdinary(monster, population)) flags.push("ordinary");
	if (monster.event) flags.push("event");
	if (monster.boss || monster.raid || monster.cooperative) flags.push("cooperative");
	if (monster.special || monster.respawn_as || Number(monster.respawn) > 300) flags.push("rare_or_scheduled");
	if (monster.hide || monster.operator) flags.push("scripted");
	return flags.length ? flags : ["special"];
}

function monsterMechanics(monster) {
	const mechanics = [];
	for (const field of ["1hp", "abilities", "dreturn", "reflection", "immune", "lifesteal", "manasteal", "spawns", "splash", "explode"]) {
		if (monster[field] && (!Array.isArray(monster[field]) || monster[field].length)) mechanics.push(field);
	}
	if (!["physical", "magical", "pure", undefined].includes(monster.damage_type)) mechanics.push("unknown_damage_type");
	return mechanics.sort();
}

function hasUnsupportedMechanics(mechanics) {
	return mechanics.some((mechanic) => mechanic !== "dreturn");
}

function requirementPasses(requirements, skill, level) {
	if (Array.isArray(requirements) && requirements.length === 0) return true;
	return (requirements || []).some((requirement) =>
		(requirement.skill === skill || (Array.isArray(requirement.any_skill) && requirement.any_skill.includes(skill))) && Number(requirement.level) <= level,
	);
}

function highestEligibleRequirement(requirements, skill, level) {
	if (Array.isArray(requirements) && requirements.length === 0) return 0;
	return Math.max(
		...(requirements || [])
			.filter((requirement) => (requirement.skill === skill || (Array.isArray(requirement.any_skill) && requirement.any_skill.includes(skill))) && Number(requirement.level) <= level)
			.map((requirement) => Number(requirement.level)),
	);
}

function canonicalAcquisitionEvidence(data) {
	const annualSeconds = 365 * 24 * 60 * 60;
	const conditions = {
		"event-monster:halloween:greenjr": "season:halloween",
		"event-monster:halloween:jr": "season:halloween",
		"monster:crabxx": "event:crabxx",
		"monster:cutebee": "spawn-counter:cutebee",
		"monster:dragold": "season:lunarnewyear",
		"monster:franky": "event:franky",
		"monster:goldenbat": "spawn-counter:goldenbat",
		"monster:goldenbot": "spawn-counter:goldenbot",
		"monster:grinch": "season:holidayseason",
		"monster:icegolem": "event:icegolem",
		"monster:mrgreen": "season:halloween",
		"monster:mrpumpkin": "season:halloween",
		"monster:mvampire": "spawn-location:mvampire",
		"monster:phoenix": "spawn-location:phoenix",
		"monster:pinkgoo": "season:valentines",
		"monster:rgoo": "event:goobrawl",
		"monster:slenderman": "season:halloween",
		"monster:snowman": "season:holidayseason",
		"monster:tinyp": "persistent-special:tinyp",
		"monster:wabbit": "season:egghunt",
		"runtime-monster:snowman-offseason": "outside-season:holidayseason",
	};
	return {
		policy: { forbidden_drop_table_weapon_exceptions: {} },
		availability_overrides: Object.entries(conditions).map(([route_id, availability_condition]) => ({
			route_id,
			availability_condition,
			...(route_id.startsWith("event-monster:halloween") ? { multiplier: annualSeconds / Number(data.events.halloween.duration) } : {}),
		})),
	};
}

function canonicalResolver(data) {
	let cached = canonicalRouteCache.get(data);
	if (!cached) {
		cached = buildProductionAcquisitionResolver({ data, evidence: canonicalAcquisitionEvidence(data) }).resolver;
		canonicalRouteCache.set(data, cached);
	}
	return cached;
}

function isAvailableLoadoutDependency(data, populations, routeId, rank) {
	if (routeId.startsWith("shop:") || routeId.startsWith("starter:") || routeId === "runtime:monstertoken") return true;
	const sourceMonster = routeId.match(/(?:^monster:|:monster:)([^:]+)$/)?.[1];
	if (!sourceMonster) return false;
	const monster = data.monsters[sourceMonster];
	const sourceTier = Number(progression.MONSTER_TIER_ASSIGNMENTS?.[sourceMonster]);
	return isPermanentOrdinary(monster, populations.get(sourceMonster) || 0) && Number.isInteger(sourceTier) && sourceTier <= rank;
}

function isPermanentLoadoutRoute(data, populations, item, route, rank) {
	if (route.kind === "shop" || route.kind === "starter") return true;
	if (route.kind === "token") return route.token_id === "monstertoken" && ARMOR_TYPES.includes(item.type);
	if (route.event_id || route.kind === "event_drop" || (route.availability_condition_ids || []).length) return false;
	if (["craft", "quest_recipe"].includes(route.kind)) return (route.dependency_route_ids || []).every((routeId) => isAvailableLoadoutDependency(data, populations, routeId, rank));
	if (route.access_item_id) return true;
	const monster = data.monsters[route.monster_id];
	const sourceTier = Number(progression.MONSTER_TIER_ASSIGNMENTS?.[route.monster_id]);
	return isPermanentOrdinary(monster, populations.get(route.monster_id) || 0) && Number.isInteger(sourceTier) && sourceTier <= rank;
}

function canonicalLoadoutRoutes(data, rank = 6) {
	const populations = activePopulationByMonster(data);
	const resolver = canonicalResolver(data);
	const routes = new Map();
	for (const [itemId, item] of Object.entries(data.items)) {
		let candidates;
		try {
			candidates = resolver.allRoutes(itemId);
		} catch {
			continue;
		}
		const route = candidates
			.filter((candidate) => isPermanentLoadoutRoute(data, populations, item, candidate, rank))
			.sort((left, right) => Number(left.effort) - Number(right.effort) || left.route_id.localeCompare(right.route_id))[0];
		if (route) routes.set(itemId, route);
	}
	return routes;
}

function isOrdinaryLoadoutItem(item, route) {
	return Boolean(item && route && !item.ignore && !item.hunter_only && !item.compound && !EXCLUDED_SET_IDS.has(item.set));
}

function compactLoadoutRoute(route) {
	return Object.fromEntries(
		["route_id", "kind", "effort", "monster_id", "map_id", "access_item_id", "token_id", "token_quantity"]
			.filter((field) => route[field] !== undefined)
			.map((field) => [field, route[field]]),
	);
}

function selectCanonicalLoadoutFromRoutes(data, routes, { skill, weapon_id, rank, level }) {
	const slots = { mainhand: { name: weapon_id, level: progression.MONSTER_COMBAT_POLICY.unlock_enhancement } };
	const armorSet = data.sets[ARMOR_SET_BY_WEAPON_RANK[Math.min(rank, 5)]];
	for (const type of ARMOR_TYPES) {
		const progressionItemId = armorSet?.bonus_items?.[type]?.[0];
		if (progressionItemId && routes.has(progressionItemId) && requirementPasses(data.itemRequirements[progressionItemId], skill, level)) {
			slots[type] = { name: progressionItemId, level: 0 };
			continue;
		}
		const candidate = Object.entries(data.items)
			.filter(([id, item]) => item.type === type && isOrdinaryLoadoutItem(item, routes.get(id)) && Number(item.hp || 0) + Number(item.mp || 0) + Number(item.armor || 0) + Number(item.resistance || 0) > 0 && requirementPasses(data.itemRequirements[id], skill, level))
			.sort(([leftId], [rightId]) => {
				const leftRoute = routes.get(leftId);
				const rightRoute = routes.get(rightId);
				return highestEligibleRequirement(data.itemRequirements[rightId], skill, level) - highestEligibleRequirement(data.itemRequirements[leftId], skill, level) || leftRoute.effort - rightRoute.effort || leftRoute.route_id.localeCompare(rightRoute.route_id) || leftId.localeCompare(rightId);
			})[0];
		if (candidate) slots[type] = { name: candidate[0], level: 0 };
	}
	const offhand = Object.entries(data.items)
		.filter(([id, item]) => OFFHAND_TYPES.has(item.type) && isOrdinaryLoadoutItem(item, routes.get(id)) && requirementPasses(data.itemRequirements[id], skill, level) && isCompatibleOffhand(slots.mainhand, { name: id }, data.items))
		.sort(([leftId], [rightId]) => {
			const leftRoute = routes.get(leftId);
			const rightRoute = routes.get(rightId);
			return highestEligibleRequirement(data.itemRequirements[rightId], skill, level) - highestEligibleRequirement(data.itemRequirements[leftId], skill, level) || leftRoute.effort - rightRoute.effort || leftRoute.route_id.localeCompare(rightRoute.route_id) || leftId.localeCompare(rightId);
		})[0];
	if (offhand) slots.offhand = { name: offhand[0], level: 0 };
	return slots;
}

function selectCanonicalLoadout(data, selection) {
	return selectCanonicalLoadoutFromRoutes(data, canonicalLoadoutRoutes(data, selection.rank), selection);
}

function hitChance({ damage_type, evasion = 0, avoidance = 0 }) {
	const avoid = Math.max(.01, 1 - Number(avoidance || 0) / 100);
	return damage_type === "physical" ? avoid * Math.max(.01, 1 - Number(evasion || 0) / 100) : avoid;
}

function simulateFight({ monster, stats }) {
	const policy = progression.MONSTER_COMBAT_POLICY;
	const outgoingDefense = stats.damage_type === "physical" ? Number(monster.armor || 0) - Number(stats.apiercing || 0) : Number(monster.resistance || 0) - Number(stats.rpiercing || 0);
	const playerHitDamage = Math.max(.0001, Number(stats.attack) * damageMultiplier(outgoingDefense) * hitChance({ damage_type: stats.damage_type, evasion: monster.evasion, avoidance: monster.avoidance }));
	const attacksToKill = Math.ceil(Number(monster.hp) / playerHitDamage);
	const outgoingDps = playerHitDamage * Number(stats.frequency);
	const kill_time_ms = Math.ceil(attacksToKill / Number(stats.frequency) * 1000);
	const incomingType = monster.damage_type || "physical";
	const incomingDefense = incomingType === "physical" ? Number(stats.armor || 0) - Number(monster.apiercing || 0) : Number(stats.resistance || 0) - Number(monster.rpiercing || 0);
	const largest_expected_hit = Number(monster.attack) * (incomingType === "pure" ? 1 : damageMultiplier(incomingDefense));
	const returned_damage_per_hit = Number(monster.dreturn || 0) > 0 && stats.damage_type === "physical" && Number(stats.range) < 75 ? Math.ceil(Number(stats.attack) * Number(monster.dreturn) / 100) : 0;
	const incomingDps = largest_expected_hit * Number(monster.frequency || 0) * hitChance({ damage_type: incomingType, evasion: stats.evasion, avoidance: stats.avoidance }) + returned_damage_per_hit * Number(stats.frequency);
	let hp = Number(stats.max_hp);
	let mp = Number(stats.max_mp);
	let minimum_hp = hp;
	let minimum_mp = mp;
	let hp_potions = 0;
	let mp_potions = 0;
	const trace = [];
	const simulated_time_ms = Math.min(kill_time_ms, policy.maximum_fight_ms);
	let elapsed = 0;
	let next_player_attack_ms = 1000 / Number(stats.frequency);
	let next_monster_attack_ms = 1000 / Number(monster.frequency || .01);
	let next_hp_potion_ms = 0;
	let next_mp_potion_ms = 0;
	let one_shot = false;
	function takeHit(damage, elapsed) {
		if (hp - damage < Number(stats.max_hp) * .5 && elapsed >= next_hp_potion_ms) {
			hp = Math.min(Number(stats.max_hp), hp + 400);
			hp_potions += 1;
			next_hp_potion_ms = elapsed + 2000;
		}
		if (!(damage < hp)) one_shot = true;
		hp -= damage;
		minimum_hp = Math.min(minimum_hp, hp);
	}
	while (elapsed < simulated_time_ms) {
		const next_event_ms = Math.min(next_player_attack_ms, next_monster_attack_ms, simulated_time_ms);
		elapsed = next_event_ms;
		if (next_event_ms === next_player_attack_ms) {
			if (mp < Number(stats.mp_cost) && elapsed >= next_mp_potion_ms) {
				mp = Math.min(Number(stats.max_mp), mp + 500);
				mp_potions += 1;
				next_mp_potion_ms = elapsed + 2000;
			}
			mp -= Number(stats.mp_cost);
			minimum_mp = Math.min(minimum_mp, mp);
			if (returned_damage_per_hit) takeHit(returned_damage_per_hit, elapsed);
			next_player_attack_ms += 1000 / Number(stats.frequency);
		}
		if (next_event_ms === next_monster_attack_ms) {
			takeHit(largest_expected_hit, elapsed);
			next_monster_attack_ms += 1000 / Number(monster.frequency || .01);
		}
		if ((trace.length === 0 || elapsed - trace.at(-1).elapsed_ms >= 20000) || elapsed === simulated_time_ms) trace.push({ elapsed_ms: Math.round(elapsed), hp: Number(hp.toFixed(3)), mp: Number(mp.toFixed(3)) });
		if (hp <= 0 || mp <= 0) break;
	}
	const ending_hp_ratio = hp / Number(stats.max_hp);
	const reasons = [];
	if (kill_time_ms > policy.maximum_fight_ms) reasons.push("fight_time");
	if (!(minimum_hp > 0)) reasons.push("hp_sustain");
	if (!(minimum_mp > 0)) reasons.push("mp_sustain");
	if (one_shot) reasons.push("one_shot");
	if (!(ending_hp_ratio >= policy.minimum_remaining_hp_ratio)) reasons.push("ending_hp");
	return {
		passed: reasons.length === 0,
		failure_reasons: reasons,
		kill_time_ms,
		outgoing_dps: Number(outgoingDps.toFixed(6)),
		incoming_dps: Number(incomingDps.toFixed(6)),
		largest_expected_hit: Number(largest_expected_hit.toFixed(6)),
		returned_damage_per_hit,
		minimum_hp: Number(minimum_hp.toFixed(6)),
		minimum_mp: Number(minimum_mp.toFixed(6)),
		ending_hp_ratio: Number(ending_hp_ratio.toFixed(6)),
		hp_potions,
		mp_potions,
		trace,
	};
}

function buildLoadouts(data) {
	const { loadPropertyCalculators } = require("./direct-equipment-authority");
	const calculators = loadPropertyCalculators(data);
	const publishedSets = publishCumulativeSetThresholds(data.sets);
	const rows = [];
	for (let tier = 1; tier <= 6; tier += 1) {
		const weapon_rank = tier === 1 ? 1 : tier - 1;
		const enhancement = tier === 1 ? 0 : progression.MONSTER_COMBAT_POLICY.unlock_enhancement;
		const routes = canonicalLoadoutRoutes(data, weapon_rank);
		for (const skill of COMBAT_SKILLS) {
			const weapon_id = progression.WEAPON_PROGRESSION_ANCHORS[weapon_rank][skill];
			const slots = selectCanonicalLoadoutFromRoutes(data, routes, { skill, weapon_id, rank: weapon_rank, level: progression.WEAPON_RANK_REQUIREMENTS[weapon_rank - 1] });
			slots.mainhand.level = enhancement;
			const stats = calculateStats({ slots, items: data.items, sets: publishedSets, getItemProperties: calculators.current.calculate_item_properties });
			const acquisition_routes = Object.fromEntries(Object.entries(slots).filter(([slot]) => slot !== "mainhand").map(([slot, item]) => [slot, compactLoadoutRoute(routes.get(item.name))]));
			rows.push({ tier, weapon_rank, skill, weapon_id, enhancement, slots, acquisition_routes, stats });
		}
	}
	return rows;
}

function analyze(data = loadSourceData()) {
	const populations = activePopulationByMonster(data);
	const loadouts = buildLoadouts(data);
	const monsters = [];
	const matrix_rows = [];
	for (const [monster_id, monster] of Object.entries(data.monsters).filter(([, definition]) => isAttackable(definition)).sort(([left], [right]) => left.localeCompare(right))) {
		const population = populations.get(monster_id) || 0;
		const availability = monsterAvailability(monster, population);
		const mechanics = monsterMechanics(monster);
		const supported = isPermanentOrdinary(monster, population) && !hasUnsupportedMechanics(mechanics);
		const results = loadouts.map((loadout) => ({
			tier: loadout.tier,
			skill: loadout.skill,
			weapon_id: loadout.weapon_id,
			enhancement: loadout.enhancement,
			...simulateFight({ monster, stats: loadout.stats }),
		}));
		const tierPasses = Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
			const tier = index + 1;
			return [tier, results.filter((row) => row.tier === tier).every((row) => row.passed)];
		}));
		const earliest = supported ? Number(Object.keys(tierPasses).find((tier) => tierPasses[tier])) : null;
		const tier = Number(progression.MONSTER_TIER_ASSIGNMENTS?.[monster_id] || progression.MONSTER_PROGRESSION[monster_id]?.tier);
		if (!Number.isInteger(tier) || tier < 1 || tier > 7) throw new Error(`Missing authored monster tier: ${monster_id}`);
		const assigned_passes = tier <= 6 && tierPasses[tier];
		const published = progression.MONSTER_PROGRESSION[monster_id];
		const progression_eligible = Boolean(supported && assigned_passes && published?.progression_eligible);
		const reason = progression_eligible ? "matrix" : published?.reason || (supported ? progression.MONSTER_GROUP_RECOMMENDED?.[monster_id] ? `group_recommended:assigned_tier_${tier}_not_solo_safe` : `assigned_tier_${tier}_not_safe` : hasUnsupportedMechanics(mechanics) ? `unsupported_mechanics:${mechanics.filter((mechanic) => mechanic !== "dreturn").join(",")}` : `ineligible_availability:${availability.join(",")}`);
		monsters.push({ monster_id, tier, availability, mechanics, progression_eligible, hunter_eligible: progression_eligible, reason, evidence: { earliest_passing_tier: earliest, assigned_tier_passes: assigned_passes, tier_passes: tierPasses, class_margins: results.filter((row) => row.tier === Math.min(tier, 6)).map((row) => ({ skill: row.skill, kill_time_ms: row.kill_time_ms, ending_hp_ratio: row.ending_hp_ratio, minimum_hp: row.minimum_hp, minimum_mp: row.minimum_mp, largest_expected_hit: row.largest_expected_hit, returned_damage_per_hit: row.returned_damage_per_hit, failure_reasons: row.failure_reasons, passed: row.passed })) } });
		matrix_rows.push({ monster_id, tier, progression_eligible, hunter_eligible: progression_eligible, results });
	}
	const universal_candidates = Object.fromEntries([2, 3, 4, 5, 6].map((tier) => [tier, monsters.filter((monster) => monster.tier === tier && monster.progression_eligible).map((monster) => monster.monster_id).sort()]));
	const violations = [];
	for (const tier of [2, 3, 4, 5, 6]) if (universal_candidates[tier].length < progression.MONSTER_COMBAT_POLICY.minimum_solo_candidates[tier]) {
		const candidate_class_evidence = monsters
			.filter((monster) => monster.tier === tier && monster.availability.includes("ordinary"))
			.flatMap((monster) => monster.evidence.class_margins.map((margin) => ({
				tier,
				monster_id: monster.monster_id,
				skill: margin.skill,
				metric: monster.progression_eligible ? "passed" : monster.reason.startsWith("unsupported_mechanics:") ? monster.reason : margin.failure_reasons[0] || monster.reason,
			})))
			.sort((left, right) => left.monster_id.localeCompare(right.monster_id) || left.skill.localeCompare(right.skill));
		violations.push({ tier, reason: "fewer_than_required_universal_permanent_ordinary_monsters", required_candidates: progression.MONSTER_COMBAT_POLICY.minimum_solo_candidates[tier], candidates: universal_candidates[tier], candidate_class_evidence });
	}
	return { loadouts, monsters, matrix_rows, universal_candidates, violations };
}

function buildMonsterCombatTiers(data = loadSourceData()) {
	const analysis = analyze(data);
	return {
		schema_version: 1,
		policy: { ...progression.MONSTER_COMBAT_POLICY, set_threshold_publication: "production_cumulative", rank_requirements: progression.WEAPON_RANK_REQUIREMENTS, progression_anchors: progression.WEAPON_PROGRESSION_ANCHORS, supported_mechanics: ["physical", "magical", "pure", "armor", "resistance", "piercing", "avoidance", "evasion", "dreturn"] },
		counts: { attackable_monsters: analysis.monsters.length, progression_eligible: analysis.monsters.filter((monster) => monster.progression_eligible).length },
		universal_candidates: analysis.universal_candidates,
		monsters: analysis.monsters,
		violations: analysis.violations,
	};
}

function buildEquipmentCombatMatrix(data = loadSourceData()) {
	const analysis = analyze(data);
	const { loadPropertyCalculators } = require("./direct-equipment-authority");
	const calculators = loadPropertyCalculators(data);
	const publishedSets = publishCumulativeSetThresholds(data.sets);
	const sidegrade_unlocks = [];
	for (const [weapon_id, weapon] of Object.entries(data.items).filter(([, item]) => item.type === "weapon" && item.progression && WEAPON_PROFILES[item.wtype] && item.progression.shared_rank < 6).sort(([left], [right]) => left.localeCompare(right))) {
		const skill = WEAPON_PROFILES[weapon.wtype].skill;
		const target_tier = weapon.progression.shared_rank + 1;
		const declared_ineligible = weapon.progression.next_tier_hunt_eligible === false;
		const ineligibility_reason = declared_ineligible ? weapon.progression.next_tier_hunt_reason || "declared_ineligible" : null;
		if (declared_ineligible) {
			sidegrade_unlocks.push({ weapon_id, skill, shared_rank: weapon.progression.shared_rank, role: weapon.progression.role, target_tier, safe_candidate_ids: [], declared_ineligible, ineligibility_reason, results: [] });
			continue;
		}
		const slots = selectCanonicalLoadout(data, { skill, weapon_id, rank: weapon.progression.shared_rank, level: weapon.progression.requirement });
		slots.mainhand.level = progression.MONSTER_COMBAT_POLICY.unlock_enhancement;
		const stats = calculateStats({ slots, items: data.items, sets: publishedSets, getItemProperties: calculators.current.calculate_item_properties });
		const candidate_ids = analysis.universal_candidates[target_tier] || [];
		const results = candidate_ids.map((monster_id) => ({ monster_id, ...simulateFight({ monster: data.monsters[monster_id], stats }) }));
		sidegrade_unlocks.push({ weapon_id, skill, shared_rank: weapon.progression.shared_rank, role: weapon.progression.role, target_tier, safe_candidate_ids: results.filter((result) => result.passed).map((result) => result.monster_id), results });
	}
	const violations = [...analysis.violations];
	for (const unlock of sidegrade_unlocks)
		if (!unlock.declared_ineligible && !unlock.safe_candidate_ids.length) violations.push({ weapon_id: unlock.weapon_id, target_tier: unlock.target_tier, reason: "no_safe_next_tier_hunter_candidate" });
	return {
		schema_version: 4,
		policy: { direct_combat: "canonical-loadout-safety", failure_policy: "fail-closed", set_threshold_publication: "production_cumulative", ...progression.MONSTER_COMBAT_POLICY },
		canonical_loadouts: analysis.loadouts,
		monster_rows: analysis.matrix_rows,
		universal_candidates: analysis.universal_candidates,
		sidegrade_unlocks,
		violations,
	};
}

function validateMonsterCombatTiers(fixture, data = loadSourceData()) {
	if (!fixture || fixture.schema_version !== 1) throw new Error("Monster combat tier fixture has an invalid schema");
	const expectedIds = Object.entries(data.monsters).filter(([, monster]) => isAttackable(monster)).map(([id]) => id).sort();
	if (JSON.stringify(fixture.monsters.map((monster) => monster.monster_id).sort()) !== JSON.stringify(expectedIds)) throw new Error("Monster combat tier fixture does not cover every attackable monster");
	if (fixture.monsters.some((monster) => !Number.isInteger(monster.tier) || monster.tier < 1 || monster.tier > 7 || !Array.isArray(monster.availability) || !Array.isArray(monster.mechanics) || typeof monster.progression_eligible !== "boolean" || typeof monster.hunter_eligible !== "boolean" || !monster.reason)) throw new Error("Monster combat tier fixture has an invalid record");
	for (const monster of fixture.monsters) {
		const published = progression.MONSTER_PROGRESSION[monster.monster_id];
		if (!published || JSON.stringify(published) !== JSON.stringify({ tier: monster.tier, availability: monster.availability, mechanics: monster.mechanics, progression_eligible: monster.progression_eligible, hunter_eligible: monster.hunter_eligible, reason: monster.reason })) throw new Error(`Published monster progression drifted for ${monster.monster_id}`);
	}
	if (fixture.violations.length) throw new Error(`Monster combat tier fixture is infeasible: ${serializeFixture(fixture.violations).trim()}`);
	return true;
}

function verifyFixture() {
	const actual = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
	const expected = buildMonsterCombatTiers();
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("monster-combat-tiers.json drifted from the deterministic combat authority");
	validateMonsterCombatTiers(actual);
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--write")) {
		const fixture = buildMonsterCombatTiers();
		validateMonsterCombatTiers(fixture);
		fs.writeFileSync(FIXTURE_PATH, serializeFixture(fixture));
		return;
	}
	if (argv.includes("--write-combat")) {
		const fixture = buildEquipmentCombatMatrix();
		if (fixture.violations.length) throw new Error(`Equipment combat matrix is infeasible: ${serializeFixture(fixture.violations).trim()}`);
		fs.writeFileSync(COMBAT_FIXTURE_PATH, serializeFixture(fixture));
		return;
	}
	if (argv.includes("--verify")) return verifyFixture();
	throw new Error("Use --write, --write-combat, or --verify");
}

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { activePopulationByMonster, analyze, buildEquipmentCombatMatrix, buildMonsterCombatTiers, canonicalLoadoutRoutes, damageMultiplier, isAttackable, isPermanentOrdinary, main, monsterAvailability, monsterMechanics, selectCanonicalLoadout, simulateFight, validateMonsterCombatTiers };
