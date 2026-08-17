"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { assignPercentiles, assertAcyclicSourceGraph, canonicalJson } = require("../tools/acquisition-ranking");
const { buildAcquisitionRanking, loadRankingFixture, validateRankingFixture } = require("../tools/weapon-acquisition-ranking");

test("shared acquisition utilities preserve tied bands and reject source cycles", () => {
	const rows = assignPercentiles([{ item_id: "a", effort: 8 }, { item_id: "b", effort: 8 }, { item_id: "c", effort: 12 }]);
	assert.equal(rows[0].percentile, rows[1].percentile);
	assert.ok(rows[2].percentile > rows[1].percentile);
	assert.throws(() => assertAcyclicSourceGraph({ a: ["b"], b: ["a"] }), /cycle/i);
	assert.equal(canonicalJson({ b: 1, a: [2] }), '{"a":[2],"b":1}');
});

test("direct weapon acquisition authority preserves stable identities and rank coverage", () => {
	const fixture = loadRankingFixture();
	assert.doesNotThrow(() => validateRankingFixture(fixture));
	assert.deepEqual(fixture, buildAcquisitionRanking());
	assert.equal(fixture.counts.weapons, 90);
	assert.equal(fixture.counts.ranks, 7);
	for (const weapon of fixture.weapons) {
		assert.ok(weapon.weapon_id && weapon.skill && weapon.wtype);
		assert.ok(Number.isInteger(weapon.requirement) && weapon.requirement >= 1);
		assert.ok(Number.isFinite(weapon.target_dps) && weapon.target_dps > 0);
		assert.equal(Object.hasOwn(weapon, "stat_type"), false);
	}
});
