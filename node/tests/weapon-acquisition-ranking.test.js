"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { RANKING_FIXTURE_PATH, buildAcquisitionRanking, loadRankingFixture, validateRankingFixture } = require("../tools/weapon-acquisition-ranking");

test("direct acquisition fixture deterministically covers every visible combat weapon", () => {
	const fixture = loadRankingFixture(RANKING_FIXTURE_PATH);
	assert.doesNotThrow(() => validateRankingFixture(fixture));
	assert.deepEqual(fixture, buildAcquisitionRanking());
	assert.equal(fixture.counts.weapons, 83);
	assert.equal(fixture.counts.ranks, 11);
	assert.deepEqual([...new Set(fixture.weapons.map((weapon) => weapon.shared_rank))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test("direct acquisition evidence owns Damage and Attacks/Sec through weapon definitions", () => {
	const fixture = loadRankingFixture();
	for (const weapon of fixture.weapons) {
		assert.ok(weapon.target_dps > 0, weapon.weapon_id);
		assert.equal(Object.hasOwn(weapon, "solved_attack"), false);
		assert.equal(Object.hasOwn(weapon, "solved_str"), false);
		assert.equal(Object.hasOwn(weapon, "stat_type"), false);
	}
	assert.match(fixture.policy.identity, /direct-effects/);
});
