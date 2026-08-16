"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { buildParityReport, loadLegacyBaseline, loadLegacyIdentityBaseline, loadParityFixture, validateLegacyWeaponIdentity, validateParityFixture } = require("../tools/weapon-progression-parity");

test("direct-runtime parity fixture is deterministic and marks historical data test-only", () => {
	const fixture = loadParityFixture();
	const report = buildParityReport();
	assert.doesNotThrow(() => validateParityFixture(fixture, report.data));
	assert.equal(fixture.diagnostic_only, true);
	assert.equal(fixture.weapons.length, 90);
	assert.equal(fixture.states.length, 450);
	assert.deepEqual(report.contracts, { current_direct_runtime: { status: "diagnostic" }, historical_baseline: { status: "test-only" } });
	assert.ok(loadLegacyBaseline().rows.length > 0);
});

test("legacy weapons retain their immutable identity fields", () => {
	const report = buildParityReport();
	const baseline = loadLegacyIdentityBaseline();
	assert.equal(baseline.weapons.length, 83);
	assert.deepEqual(validateLegacyWeaponIdentity(report.data, baseline), { missing: [], changed: [] });
});

test("direct parity rows retain finite weapon-owned combat outputs", () => {
	for (const state of loadParityFixture().states) {
		assert.ok(state.damage > 0 && state.attacks_per_second > 0 && state.dps > 0, `${state.weapon_id}+${state.level}`);
		assert.equal(state.damage * state.attacks_per_second, state.dps);
	}
});
