"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { buildArmorSetBalanceFixture, buildAcquisitionRanking } = require("../tools/direct-equipment-authority");
const { buildEconomyEvidence } = require("../tools/weapon-progression-economy");

test("direct conversion preserves published item identities, requirements, and all armor themes", () => {
	const data = loadSourceData();
	const armor = buildArmorSetBalanceFixture(data);
	const ranking = buildAcquisitionRanking(data);
	assert.equal(armor.set_count, 19);
	assert.equal(ranking.counts.weapons, 90);
	for (const [id, item] of Object.entries(data.items)) {
		assert.ok(typeof item.name === "string" && item.name.length, `stable item ${id}`);
		if (item.type === "weapon" && item.progression) assert.ok(data.itemRequirements[id]?.length, `${id} requirement`);
	}
	for (const set of Object.values(armor.sets)) {
		assert.ok(set.weight);
		for (const threshold of Object.values(set.thresholds)) assert.equal(Object.hasOwn(threshold, "stat_type"), false);
	}
});

test("every rank-two through rank-six anchor has a permanent ordinary direct drop", () => {
	const data = loadSourceData();
	const evidence = buildEconomyEvidence(data);
	assert.equal(evidence.rows.length, 30);
	for (const row of evidence.rows) {
		assert.ok(row.final_drop_probability > 0, row.weapon_id);
		assert.equal(data.progression.MONSTER_TIER_ASSIGNMENTS[row.monster_id], row.tier, row.weapon_id);
		assert.ok(Object.values(data.maps).some((map) => !map.ignore && !map.instance && !map.event && (map.monsters || []).some((pack) => pack.type === row.monster_id && Number(pack.count) > 0 && !pack.special && pack.stype !== "randomrespawn")), row.monster_id);
	}
});
