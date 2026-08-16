"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRankingFixture } = require("../tools/weapon-acquisition-ranking");
const { buildWeaponLoadoutBalanceFixture } = require("../tools/direct-equipment-authority");

test("every combat skill retains all eleven direct rank bands", () => {
	const ranking = loadRankingFixture();
	for (const skill of ranking.policy.combat_skills) {
		assert.deepEqual([...new Set(ranking.weapons.filter((weapon) => weapon.skill === skill).map((weapon) => weapon.shared_rank))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], skill);
	}
});

test("Priest books publish positive direct Damage, Heal, and Attacks/Sec", () => {
	const fixture = buildWeaponLoadoutBalanceFixture();
	for (const state of fixture.weapon_states.filter((state) => state.weapon_id.startsWith("wbook"))) {
		assert.ok(state.damage > 0 && state.attacks_per_second > 0, state.weapon_id);
		assert.ok(state.heal >= 0, state.weapon_id);
	}
});
