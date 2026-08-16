"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { buildArmorSetBalanceFixture, buildAcquisitionRanking } = require("../tools/direct-equipment-authority");

test("direct conversion preserves published item identities, requirements, and all armor themes", () => {
	const data = loadSourceData();
	const armor = buildArmorSetBalanceFixture(data);
	const ranking = buildAcquisitionRanking(data);
	assert.equal(armor.set_count, 19);
	assert.equal(ranking.counts.weapons, 83);
	for (const [id, item] of Object.entries(data.items)) {
		assert.ok(typeof item.name === "string" && item.name.length, `stable item ${id}`);
		if (item.type === "weapon" && item.progression) assert.ok(data.itemRequirements[id]?.length, `${id} requirement`);
	}
	for (const set of Object.values(armor.sets)) {
		assert.ok(set.weight);
		for (const threshold of Object.values(set.thresholds)) assert.equal(Object.hasOwn(threshold, "stat_type"), false);
	}
});
