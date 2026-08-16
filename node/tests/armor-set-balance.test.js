"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { buildDirectArmorSetBalanceFixture } = require("../tools/equipment-balance");
const { serializeFixture } = require("../tools/fixture-serialization");

const fixturePath = path.join(__dirname, "fixtures", "armor-set-balance.json");
const forbidden = new Set(["str", "dex", "int", "vit", "for", "stat", "stat_type", "attack", "frequency"]);

test("all nineteen set thresholds publish direct effects and preserve their membership", () => {
	const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
	assert.equal(fixture.schema_version, 3);
	assert.equal(fixture.set_count, 19);
	for (const [setId, set] of Object.entries(fixture.sets)) {
		assert.ok(set.weight, setId);
		assert.deepEqual(Object.keys(set.thresholds), ["2", "3", "4", "5"], setId);
		for (const effects of Object.values(set.thresholds)) {
			for (const [key, value] of Object.entries(effects)) {
				assert.ok(!forbidden.has(key), `${setId}:${key}`);
				assert.ok(Number.isFinite(value), `${setId}:${key}`);
			}
		}
	}
	assert.equal(serializeFixture(buildDirectArmorSetBalanceFixture()), fs.readFileSync(fixturePath, "utf8"));
});
