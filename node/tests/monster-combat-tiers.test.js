"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { loadSourceData } = require("../tools/acquisition-ranking");
const { analyze, buildMonsterCombatTiers, canonicalLoadoutRoutes, simulateFight, validateMonsterCombatTiers } = require("../tools/monster-combat-tiers");

const EXPECTED_ORDINARY_ROSTER = Object.freeze({
	1: ["goo", "bee", "crab", "hen", "rooster", "squig"],
	2: ["arcticbee", "rat", "jrat", "snake", "osnake"],
	3: ["armadillo", "croc", "minimush", "tortoise"],
	4: ["crabx", "bat", "squigtoad", "iceroamer"],
	5: ["cgoo", "stoneworm", "poisio", "bbpompom", "booboo", "boar"],
	6: ["ghost", "spider", "scorpion", "gscorpion", "wolfie", "mole", "mummy", "prat"],
	7: ["bigbird", "bluefairy", "bscorpion", "dryad", "ent", "fireroamer", "greenfairy", "harpy", "odino", "oneeye", "pinkgoblin", "plantoid", "porcupine", "pppompom", "redfairy", "sparkbot", "targetron", "wolf", "xscorpion"],
});

test("damage return applies only to short-range physical attackers", () => {
	const analysis = analyze();
	const armadillo = analysis.matrix_rows.find((row) => row.monster_id === "armadillo");
	const tierThree = Object.fromEntries(armadillo.results.filter((row) => row.tier === 3).map((row) => [row.skill, row]));
	assert.ok(tierThree.warrior.returned_damage_per_hit > 0);
	assert.ok(tierThree.paladin.returned_damage_per_hit > 0);
	assert.ok(tierThree.rogue.returned_damage_per_hit > 0);
	assert.equal(tierThree.mage.returned_damage_per_hit, 0);
	assert.equal(tierThree.priest.returned_damage_per_hit, 0);
	assert.equal(tierThree.ranger.returned_damage_per_hit, 0);
	assert.ok(Object.values(tierThree).every((row) => Array.isArray(row.failure_reasons)));
});

test("canonical loadouts use source-backed permanent gear and expose its acquisition route", () => {
	const data = loadSourceData();
	for (const rank of [1, 2, 3, 4, 5]) {
		for (const [itemId, route] of canonicalLoadoutRoutes(data, rank)) {
			assert.notEqual(route.kind, "event_drop", itemId);
			assert.equal(route.event_id, undefined, itemId);
			assert.deepEqual(route.availability_condition_ids || [], [], itemId);
			if (route.kind === "token") {
				assert.equal(route.token_id, "monstertoken", itemId);
				assert.ok(["helmet", "chest", "pants", "gloves", "shoes"].includes(data.items[itemId].type), itemId);
			}
		}
	}
	const analysis = analyze(data);
	const tierThreeMage = analysis.loadouts.find((row) => row.tier === 3 && row.skill === "mage");
	assert.deepEqual(tierThreeMage.acquisition_routes.chest, {
		route_id: "monster:spiderbl", kind: "nested_drop", effort: 522451.288511, monster_id: "spiderbl", map_id: "spider_instance", access_item_id: "spiderkey",
	});
	assert.ok(analysis.loadouts.some((row) => Object.values(row.acquisition_routes).some((route) => route.token_id === "monstertoken")));
	const keyedSource = analysis.monsters.find((row) => row.monster_id === "spiderbl");
	assert.equal(keyedSource.progression_eligible, false);
	assert.equal(keyedSource.hunter_eligible, false);
});

test("combat solver fails closed for each fight and mechanic safety boundary", () => {
	const stats = { attack: 1000, frequency: 1, damage_type: "physical", range: 10, armor: 0, resistance: 0, apiercing: 0, rpiercing: 0, evasion: 0, avoidance: 0, max_hp: 1000, max_mp: 1000, mp_cost: 0 };
	const monster = { hp: 100, attack: 1, frequency: 1, damage_type: "physical", armor: 0, resistance: 0 };
	assert.deepEqual(simulateFight({ monster: { ...monster, hp: 1000000000 }, stats }).failure_reasons, ["fight_time"]);
	assert.deepEqual(simulateFight({ monster: { ...monster, attack: 2000 }, stats }).failure_reasons, ["hp_sustain", "one_shot", "ending_hp"]);
	assert.deepEqual(simulateFight({ monster, stats: { ...stats, max_mp: 100, mp_cost: 600 } }).failure_reasons, ["mp_sustain"]);
	assert.deepEqual(simulateFight({ monster: { ...monster, attack: 850 }, stats }).failure_reasons, ["ending_hp"]);
	const iceroamer = buildMonsterCombatTiers().monsters.find((row) => row.monster_id === "iceroamer");
	assert.equal(iceroamer.reason, "unsupported_mechanics:reflection");
	assert.equal(iceroamer.progression_eligible, false);
});

test("infeasible tiers retain stable candidate, class, and failed-metric evidence", () => {
	const source = loadSourceData();
	const data = { ...source, monsters: structuredClone(source.monsters) };
	for (const monsterId of ["bat", "crabx", "squigtoad"]) data.monsters[monsterId].hp = 1000000000;
	const violation = analyze(data).violations.find((row) => row.tier === 4);
	assert.deepEqual(violation, {
		tier: 4,
		reason: "fewer_than_required_universal_permanent_ordinary_monsters",
		required_candidates: 3,
		candidates: [],
		candidate_class_evidence: ["bat", "crabx", "iceroamer", "squigtoad"].flatMap((monster_id) => ["mage", "paladin", "priest", "ranger", "rogue", "warrior"].map((skill) => ({ tier: 4, monster_id, skill, metric: monster_id === "iceroamer" ? "unsupported_mechanics:reflection" : "fight_time" }))),
	});
});

test("monster combat tiers cover every attackable monster and fail closed for unsupported content", () => {
	const fixture = buildMonsterCombatTiers();
	assert.doesNotThrow(() => validateMonsterCombatTiers(fixture));
	assert.deepEqual(fixture.universal_candidates, Object.fromEntries([2, 3, 4, 5, 6].map((tier) => [tier, fixture.universal_candidates[tier]])));
	for (const [tier, required] of Object.entries(fixture.policy.minimum_solo_candidates)) assert.ok(fixture.universal_candidates[tier].length >= required, `tier ${tier}`);
	for (const row of fixture.monsters) {
		assert.ok(Number.isInteger(row.tier) && row.tier >= 1 && row.tier <= 7, row.monster_id);
		assert.ok(Array.isArray(row.availability) && Array.isArray(row.mechanics), row.monster_id);
		assert.equal(typeof row.progression_eligible, "boolean", row.monster_id);
		assert.equal(typeof row.hunter_eligible, "boolean", row.monster_id);
		assert.ok(row.reason, row.monster_id);
	}
});

test("the approved ordinary monster roster stays in its authored encounter bands", () => {
	const fixture = buildMonsterCombatTiers();
	for (const [tier, monsterIds] of Object.entries(EXPECTED_ORDINARY_ROSTER)) {
		assert.deepEqual(
			fixture.monsters.filter((row) => row.availability.includes("ordinary") && row.tier === Number(tier)).map((row) => row.monster_id).sort(),
			[...monsterIds].sort(),
			`tier ${tier}`,
		);
	}
	for (const id of ["phoenix", "bgoo", "icegolem", "mrgreen", "mrpumpkin"]) {
		const row = fixture.monsters.find((monster) => monster.monster_id === id);
		assert.equal(row.progression_eligible, false, id);
		assert.equal(row.hunter_eligible, false, id);
	}
	for (const id of ["bbpompom", "boar", "booboo", "cgoo"]) {
		const row = fixture.monsters.find((monster) => monster.monster_id === id);
		assert.equal(row.progression_eligible, false, id);
		assert.equal(row.hunter_eligible, false, id);
		assert.equal(row.reason, "group_recommended:assigned_tier_5_not_solo_safe", id);
	}
});
