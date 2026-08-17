"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { calculateStats } = require("../game/stats");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "weapon-loadout-balance.json"), "utf8"));
const combatFixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "equipment-combat-matrix.json"), "utf8"));

test("every intermediate direct weapon state is finite, positive, and monotone", () => {
	const data = loadSourceData();
	const calculators = loadPropertyCalculators(data);
	for (const [weaponId, states] of Object.entries(Object.groupBy(fixture.weapon_states, (row) => row.weapon_id))) {
		let previousDps = 0;
		for (const row of states) {
			const properties = calculators.current.calculate_item_properties({ name: weaponId, level: row.level });
			const stats = calculateStats({
				slots: { mainhand: { name: weaponId, level: row.level } },
				items: data.items,
				getItemProperties: calculators.current.calculate_item_properties,
			});
			assert.ok(Number.isFinite(properties.damage) && properties.damage > 0, `${weaponId}+${row.level}:definition damage`);
			assert.ok(Number.isFinite(stats.frequency) && stats.frequency > 0, `${weaponId}+${row.level}:cadence`);
			assert.ok(Number.isFinite(stats.attack * stats.frequency) && stats.attack * stats.frequency > 0, `${weaponId}+${row.level}:dps`);
			assert.ok(stats.attack * stats.frequency >= previousDps, `${weaponId}+${row.level}:monotone dps`);
			previousDps = stats.attack * stats.frequency;
		}
	}
});

test("canonical combat evidence contains the six-class safety envelope and Hunter unlock checks", () => {
	assert.equal(combatFixture.schema_version, 4);
	assert.deepEqual(combatFixture.violations, []);
	for (const [tier, required] of Object.entries(combatFixture.policy.minimum_solo_candidates)) assert.ok(combatFixture.universal_candidates[tier].length >= required, `tier ${tier}`);
	assert.deepEqual(combatFixture.universal_candidates[5], ["poisio", "stoneworm"]);
	for (const id of ["mhspear", "mhhammer", "mhwand", "mhbook", "mhcrossbow", "mhdagger"]) {
		const unlock = combatFixture.sidegrade_unlocks.find((row) => row.weapon_id === id);
		assert.ok(unlock, id);
		assert.equal(unlock.target_tier, 6, id);
		assert.ok(unlock.safe_candidate_ids.length, id);
	}
	const oozingTerror = combatFixture.sidegrade_unlocks.find((row) => row.weapon_id === "oozingterror");
	assert.deepEqual(oozingTerror, {
		weapon_id: "oozingterror",
		skill: "mage",
		shared_rank: 4,
		role: "sidegrade",
		target_tier: 5,
		safe_candidate_ids: [],
		declared_ineligible: true,
		ineligibility_reason: "health_penalty_sidegrade",
		results: [],
	});
});
