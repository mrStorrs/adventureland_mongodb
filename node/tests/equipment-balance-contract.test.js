"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { WEAPON_PROFILES } = require("../game/active_skill");
const { buildDirectWeaponLoadoutBalanceFixture } = require("../tools/equipment-balance");
const { serializeFixture } = require("../tools/fixture-serialization");

const fixturePath = path.join(__dirname, "fixtures", "weapon-loadout-balance.json");

test("the direct balance contract keeps the approved ranks, class multipliers, and weapon-owned cadence", () => {
	const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
	assert.equal(fixture.schema_version, 4);
	assert.deepEqual(fixture.policy.class_multipliers, {
		warrior: 1,
		paladin: 0.9,
		mage: 1.1,
		priest: 0.9,
		ranger: 1.1,
		rogue: 1.1,
	});
	assert.equal(fixture.policy.cadence_owner, "weapon_definition");
	assert.deepEqual(fixture.policy.shared_rank_requirements, [1, 20, 40, 60, 80, 90, 99]);
	for (const profile of Object.values(WEAPON_PROFILES)) {
		assert.ok(!Object.hasOwn(profile, "frequency"));
		assert.ok(!Object.hasOwn(profile, "frequency_modifier"));
	}
	assert.equal(serializeFixture(buildDirectWeaponLoadoutBalanceFixture()), fs.readFileSync(fixturePath, "utf8"));
});
