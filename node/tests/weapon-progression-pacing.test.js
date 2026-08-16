"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { loadSourceData } = require("../tools/acquisition-ranking");
const { buildEconomyEvidence, validateEconomyEvidence } = require("../tools/weapon-progression-economy");

test("the independent economy verifier proves the six-month source-backed progression schedule", () => {
	const evidence = buildEconomyEvidence(loadSourceData());
	assert.doesNotThrow(() => validateEconomyEvidence(evidence));
	assert.deepEqual(evidence.policy.reference_weapon_ids, ["fsword", "swifty", "sword", "bataxe", "scythe"]);
	for (const row of evidence.rows) {
		assert.ok(Number.isFinite(row.completion_probability), row.weapon_id);
		assert.ok(Number.isFinite(row.mean_hours) && row.mean_hours > 0, row.weapon_id);
		assert.ok(Number.isFinite(row.median_hours) && row.median_hours > 0, row.weapon_id);
		assert.ok(Number.isFinite(row.p90_hours) && row.p90_hours > 0, row.weapon_id);
		assert.ok(Number.isFinite(row.simulation.completion_probability), row.weapon_id);
	}
	for (const row of evidence.rows.filter((row) => row.pacing_reference)) {
		assert.ok(row.completion_probability >= 0.8, row.weapon_id);
		assert.ok(Math.abs(row.simulation.completion_probability - row.completion_probability) <= row.simulation.tolerance, row.weapon_id);
		assert.ok(Number.isFinite(row.p90_hours) && row.p90_hours > 0, row.weapon_id);
	}
});
