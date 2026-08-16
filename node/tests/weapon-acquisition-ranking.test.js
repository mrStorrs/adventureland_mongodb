"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { RANKING_FIXTURE_PATH, buildAcquisitionRanking, loadRankingFixture, validateRankingFixture } = require("../tools/weapon-acquisition-ranking");

test("direct acquisition fixture deterministically covers every visible combat weapon", () => {
	const fixture = loadRankingFixture(RANKING_FIXTURE_PATH);
	assert.doesNotThrow(() => validateRankingFixture(fixture));
	assert.deepEqual(fixture, buildAcquisitionRanking());
	assert.equal(fixture.counts.weapons, 90);
	assert.equal(fixture.counts.ranks, 7);
	assert.deepEqual([...new Set(fixture.weapons.map((weapon) => weapon.shared_rank))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7]);
});

test("Hunter placeholders are rank-five sidegrades with no existing weapon moved", () => {
	const fixture = loadRankingFixture();
	for (const id of ["mhspear", "mhhammer", "mhwand", "mhbook", "mhcrossbow", "mhdagger"]) {
		const weapon = fixture.weapons.find((row) => row.weapon_id === id);
		assert.ok(weapon, id);
		assert.equal(weapon.shared_rank, 5, id);
		assert.equal(weapon.role, "hunter_sidegrade", id);
		assert.equal(weapon.requirement, 80, id);
	}
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
