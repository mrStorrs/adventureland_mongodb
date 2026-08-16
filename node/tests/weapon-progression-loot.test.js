"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { loadSourceData } = require("../tools/acquisition-ranking");
const { buildEconomyEvidence, buildRecommendation, loadProtectedBaseline, validateEconomyEvidence } = require("../tools/weapon-progression-economy");

test("ordinary progression drops cover every rank-two through rank-six anchor without overloading a monster", () => {
	const data = loadSourceData();
	const recommendation = buildRecommendation(data);
	assert.equal(recommendation.rows.length, 30);
	assert.deepEqual(recommendation.conflicts, []);
	const mutableMonsterIds = new Set(loadProtectedBaseline().mutable_ordinary_monsters);
	assert.ok(recommendation.rows.every((row) => mutableMonsterIds.has(row.monster_id)));
	for (const tier of [2, 3, 4, 5, 6]) {
		const rows = recommendation.rows.filter((row) => row.tier === tier);
		assert.equal(rows.length, 6, `tier ${tier}`);
		assert.ok(new Set(rows.map((row) => row.monster_id)).size >= 3, `tier ${tier}`);
		for (const [monsterId, assignments] of Object.entries(Object.groupBy(rows, (row) => row.monster_id))) assert.ok(assignments.length <= 2, `${tier}:${monsterId}`);
	}
	assert.doesNotThrow(() => validateEconomyEvidence(buildEconomyEvidence(data)));
});

test("the allocator reports a structured conflict without changing final-source verification", () => {
	const data = loadSourceData();
	const before = buildEconomyEvidence(data);
	const infeasible = buildRecommendation(data, { candidate_overrides: { 2: ["osnake"] } });
	assert.ok(infeasible.conflicts.length > 0);
	assert.deepEqual(infeasible.conflicts[0], {
		tier: 2,
		anchor: { skill: "mage", weapon_id: "firestaff" },
		reason: "fewer_than_three_eligible_species",
		candidates: [{ monster_id: "osnake", capacity: 2 }],
		capacity_by_monster: { osnake: 2 },
		protection_conflicts: [],
	});
	assert.deepEqual(buildEconomyEvidence(data), before);
});

test("the allocator reports protected candidates instead of recommending a baseline-protected table", () => {
	const recommendation = buildRecommendation(loadSourceData(), { candidate_overrides: { 3: ["minimush"] } });
	assert.ok(recommendation.conflicts.length > 0);
	assert.deepEqual(recommendation.conflicts[0].protection_conflicts, ["minimush"]);
	assert.equal(recommendation.rows.some((row) => row.monster_id === "minimush"), false);
});

test("the final-source verifier rejects a missing direct anchor drop", () => {
	const data = loadSourceData();
	const altered = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	altered.drops.monsters.osnake = altered.drops.monsters.osnake.filter((entry) => entry[1] !== "fsword");
	const evidence = buildEconomyEvidence(altered);
	assert.ok(evidence.violations.some((violation) => violation.weapon_id === "fsword" && violation.reason === "missing_final_direct_drop"));
	assert.throws(() => validateEconomyEvidence(evidence), /infeasible/);
});
