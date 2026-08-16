"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DIRECT_EFFECT_KEYS } = require("../game/direct_effects");
const { buildWeaponLoadoutBalanceFixture } = require("../tools/direct-equipment-authority");

const forbidden = new Set(["str", "dex", "int", "vit", "for", "stat", "stat_type", "attack", "frequency"]);

test("all direct weapon rows cover approved ranks and preserve hard endpoints", () => {
	const fixture = buildWeaponLoadoutBalanceFixture();
	assert.equal(fixture.counts.weapons, 83);
	assert.equal(fixture.counts.rank_bands, 11);
	for (const band of fixture.rank_bands) {
		assert.ok(band.requirement >= 1);
		for (const target of Object.values(band.targets_by_skill)) assert.ok(target > 0);
	}
	for (const weapon of fixture.weapons) {
		const states = fixture.weapon_states.filter((state) => state.weapon_id === weapon.weapon_id);
		assert.ok(states.length > 0, weapon.weapon_id);
		const base = states[0];
		const full = states.at(-1);
		assert.equal(base.dps, base.damage * base.attacks_per_second, `${weapon.weapon_id} base`);
		assert.equal(full.dps, full.damage * full.attacks_per_second, `${weapon.weapon_id} full`);
	}
});

test("all intermediate direct weapon states are finite, positive, and monotonic", () => {
	const fixture = buildWeaponLoadoutBalanceFixture();
	for (const states of Object.values(Object.groupBy(fixture.weapon_states, (state) => state.weapon_id))) {
		let previous = 0;
		for (const state of states) {
			assert.ok(Number.isFinite(state.damage) && state.damage > 0, state.weapon_id);
			assert.ok(Number.isFinite(state.attacks_per_second) && state.attacks_per_second > 0, state.weapon_id);
			assert.ok(state.dps >= previous, `${state.weapon_id}+${state.level}`);
			previous = state.dps;
		}
	}
});

test("direct catalog fields never reintroduce primary or generic effect identity", () => {
	const fixture = buildWeaponLoadoutBalanceFixture();
	for (const weapon of fixture.weapons)
		for (const key of Object.keys(weapon)) {
			assert.equal(forbidden.has(key), false, `${weapon.weapon_id}:${key}`);
			if (key === "target_dps") assert.ok(Number.isFinite(weapon[key]));
		}
	assert.ok(DIRECT_EFFECT_KEYS.includes("damage"));
	assert.ok(DIRECT_EFFECT_KEYS.includes("attacks_per_second"));
});
