"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { build, historicalMerchantTable, main } = require("../tools/combat-xp-pacing");
const { COMBAT_SKILL_IDS, cumulativeXp, maxXpForSkill, tableForSkill } = require("../game/skill_domain");
const { createCharacterState, loadCharacterState } = require("../game/character_state");
const { progression } = require("../../design/progression");

test("Warrior pacing table has the approved timing endpoints and a safe endgame cap", () => {
	const { fixture, tables } = build();
	assert.deepEqual(fixture.stages.map((stage) => [stage.target_level, stage.cumulative_active_hours]), [[20, 72], [40, 336], [60, 1008], [80, 2190], [90, 4380], [99, 8760]]);
	assert.equal(fixture.policy.target_xp_multiplier, .9);
	assert.ok(fixture.stages.every((stage) => stage.pacing_xp_per_hour === stage.base_xp_per_hour * .9));
	assert.equal(tables.combat[1], 0);
	assert.ok(tables.combat[99] >= 900000000);
	for (let level = 2; level <= 99; level += 1) assert.ok(tables.combat[level] > tables.combat[level - 1]);
});

test("all combat skills share combat thresholds while Merchant keeps the historical table", () => {
	for (const skill of COMBAT_SKILL_IDS) assert.equal(tableForSkill(skill), tableForSkill("warrior"));
	assert.notEqual(tableForSkill("merchant"), tableForSkill("warrior"));
	assert.equal(maxXpForSkill("merchant"), 900000000);
	assert.equal(cumulativeXp(99, "merchant"), 900000000);
	assert.equal(cumulativeXp(90, "warrior"), tableForSkill("warrior")[90]);
	assert.deepEqual(tableForSkill("merchant"), historicalMerchantTable());
});

test("checked-in pacing artifacts are current", () => {
	const { fixture, tables } = build();
	const root = path.resolve(__dirname, "../..");
	const expectedFixture = JSON.stringify(fixture) + "\n";
	const expectedTable = `var skill_xp = ${JSON.stringify(tables, null, "\t")};\nif (typeof module !== "undefined") module.exports = { skill_xp: skill_xp };\n`;
	assert.equal(fs.readFileSync(path.join(root, "node/tests/fixtures/combat-xp-pacing.json"), "utf8"), expectedFixture);
	assert.equal(fs.readFileSync(path.join(root, "design/skill_xp.js"), "utf8"), expectedTable);
	assert.doesNotThrow(() => main(["--verify"]));
	assert.doesNotThrow(() => main(["--verify"]));
});

test("calibration rejects invalid Warrior routes and Tier-6 safety evidence before any artifact write", () => {
	const policy = structuredClone(progression.COMBAT_XP_PACING);
	policy.stages[0].route_monster_id = "missing";
	assert.throws(() => build({ policy }), /Warrior reference route mismatch for level 20/);

	const combatEvidence = JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures/equipment-combat-matrix.json"), "utf8"));
	const warriorTierSix = combatEvidence.sidegrade_unlocks.find((row) => row.skill === "warrior" && row.weapon_id === "bataxe" && row.target_tier === 6);
	for (const result of warriorTierSix.results) result.passed = false;
	assert.throws(() => build({ combatEvidence }), /No safe permanent ordinary Tier-6 Warrior route/);
});

test("legacy combat XP is reclassified without changing its raw value while Merchant remains unchanged", () => {
	const initial = createCharacterState();
	initial.skills.warrior = { level: 90, xp: cumulativeXp(90, "merchant") };
	initial.skills.merchant = { level: 20, xp: cumulativeXp(20, "merchant") };
	initial.total_level = 90 + 20 + 5;
	const loaded = loadCharacterState({ info: { skills: initial.skills }, total_level: initial.total_level });
	assert.equal(loaded.skills.warrior.xp, cumulativeXp(90, "merchant"));
	assert.notEqual(loaded.skills.warrior.level, 90);
	assert.deepEqual(loaded.skills.merchant, initial.skills.merchant);
	assert.equal(loaded.skill_curve_version, 2);
});
