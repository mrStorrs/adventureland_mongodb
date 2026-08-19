"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { buildDirectArmorSetBalanceFixture, validateDirectArmorSetBalanceFixture, writeFixture } = require("../tools/equipment-balance");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { serializeFixture } = require("../tools/fixture-serialization");

const fixturePath = path.join(__dirname, "fixtures", "armor-set-balance.json");
const forbidden = new Set(["str", "dex", "int", "vit", "for", "stat", "stat_type", "attack", "frequency"]);

test("armor authority publishes cumulative six-tier evidence with no violations", () => {
	const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
	assert.equal(fixture.schema_version, 4);
	assert.deepEqual(fixture.counts, { sets: 20, tiered_sets: 13, non_tiered_sets: 7, tiers: 6 });
	assert.deepEqual(fixture.policy.core_fields, ["hp", "mp", "armor", "resistance"]);
	assert.deepEqual(fixture.policy.normalization_denominators, { hp: 4959.5, mp: 1637.5, armor: 202.5, resistance: 138.66666666666666 });
	assert.equal(fixture.policy.rounding_quantum, 1 / 138.66666666666666);
	assert.deepEqual(fixture.policy.enhancement_levels, Array.from({ length: 13 }, (_, level) => level));
	assert.equal(fixture.policy.basic_shape_source, "wanderers");
	assert.equal(Object.keys(fixture.sets).length, 20);
	for (const [setId, set] of Object.entries(fixture.sets)) {
		assert.ok(set.weight, setId);
		assert.ok(Object.keys(set.raw_thresholds).length, setId);
		assert.deepEqual(Object.keys(set.raw_thresholds), Object.keys(set.published_thresholds), setId);
		for (const effects of [...Object.values(set.raw_thresholds), ...Object.values(set.published_thresholds)]) {
			for (const [key, value] of Object.entries(effects)) {
				assert.ok(!forbidden.has(key), `${setId}:${key}`);
				assert.ok(Number.isFinite(value), `${setId}:${key}`);
			}
		}
		if (set.armor_progression) {
			assert.ok(set.complete_states.length >= 13, setId);
			assert.deepEqual([...new Set(set.complete_states.map((row) => row.level))], Array.from({ length: 13 }, (_, level) => level), setId);
			assert.ok(set.complete_states.every((row) => Number.isFinite(row.normalized_core_score) && row.normalized_core_score > 0), setId);
		} else assert.deepEqual(set.complete_states, [], setId);
	}
	assert.equal(fixture.comparisons.adjacent_tiers.length, 65);
	assert.equal(fixture.comparisons.tier_five_spreads.length, 13);
	assert.equal(fixture.comparisons.base_anchors.length, 14);
	assert.equal(fixture.comparisons.hunter_shape_retention.length, 7);
	assert.deepEqual([...new Set(fixture.comparisons.base_anchors.map((row) => row.target))], [700, 1960, 3220, 4480, 5740, 7000]);
	assert.ok(fixture.comparisons.base_anchors.every((row) => row.passed && row.actual === row.target && row.limit === 0));
	assert.ok(fixture.comparisons.vampire_base.every((row) => row.passed && row.actual.hp === 7000));
	assert.ok(fixture.comparisons.adjacent_tiers.every((row) => row.passed));
	assert.ok(fixture.comparisons.tier_five_spreads.every((row) => row.passed));
	assert.equal(fixture.comparisons.basic_shape.passed, true);
	assert.ok(fixture.comparisons.hunter_shape_retention.every((row) => row.passed));
	assert.deepEqual(fixture.violations, []);
	assert.doesNotThrow(() => validateDirectArmorSetBalanceFixture(fixture));
	assert.equal(serializeFixture(buildDirectArmorSetBalanceFixture()), fs.readFileSync(fixturePath, "utf8"));
});

test("armor authority rejects a recorded tier violation even if the catalog projection matches", () => {
	const fixture = buildDirectArmorSetBalanceFixture();
	fixture.violations.push({ code: "test_tier_crossing" });
	assert.throws(() => validateDirectArmorSetBalanceFixture(fixture, fixture), /violations/i);
});

test("armor authority produces every balance violation class from mutated source and blocks writes", (t) => {
	const mutate = (change) => {
		const data = JSON.parse(JSON.stringify(loadSourceData()));
		change(data);
		return buildDirectArmorSetBalanceFixture(data);
	};
	assert.ok(mutate((data) => { data.items.helmet.hp += 100000; }).violations.some((row) => row.code === "adjacent_tier_crossing"));
	assert.ok(mutate((data) => { data.items.mwhelmet.hp += 5000; }).violations.some((row) => row.code === "tier_five_spread"));
	assert.ok(mutate((data) => { data.items.wcap.hp += 100; }).violations.some((row) => row.code === "base_anchor_drift"));
	assert.ok(mutate((data) => { data.items.vattire.hp += 1; }).violations.some((row) => row.code === "vampire_base_drift"));
	assert.ok(mutate((data) => { data.items.mcape.upgrade.resistance = 7; }).violations.some((row) => row.code === "adjacent_tier_crossing"));
	assert.ok(mutate((data) => { data.items.mwhelmet.hp = data.items.xhelmet.hp; }).violations.some((row) => row.code === "hunter_shape_drift"));
	const invalid = buildDirectArmorSetBalanceFixture();
	invalid.violations.push({ code: "test_prewrite_rejection" });
	const writeFileSync = t.mock.method(fs, "writeFileSync", () => { throw new Error("unexpected fixture write"); });
	assert.throws(() => writeFixture("armor-set-balance.json", invalid), /balance violations/i);
	assert.equal(writeFileSync.mock.callCount(), 0);
});
