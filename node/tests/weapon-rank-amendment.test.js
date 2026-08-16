"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { progression } = require("../../design/progression");
const { items } = require("../../design/items");
const { loadRankingFixture } = require("../tools/weapon-acquisition-ranking");
const { buildWeaponLoadoutBalanceFixture } = require("../tools/direct-equipment-authority");

test("every combat skill publishes all seven direct rank bands", () => {
	const ranking = loadRankingFixture();
	for (const skill of ranking.policy.combat_skills) {
		assert.deepEqual([...new Set(ranking.weapons.filter((weapon) => weapon.skill === skill).map((weapon) => weapon.shared_rank))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7], skill);
	}
});

test("the Mage rank-four anchor is a normal placeholder, while seasonal and health-sacrificing staffs remain sidegrades", () => {
	assert.equal(items.arcstaff.progression.anchor, true);
	assert.equal(items.arcstaff.progression.role, "progression");
	assert.equal(items.arcstaff.progression.shared_rank, 4);
	assert.equal(items.arcstaff.placeholder_art, true);
	assert.equal(items.ornamentstaff.progression.anchor, false);
	assert.equal(items.ornamentstaff.progression.role, "sidegrade");
	assert.equal(items.oozingterror.progression.anchor, false);
	assert.equal(items.oozingterror.progression.role, "sidegrade");
	assert.equal(items.oozingterror.progression.next_tier_hunt_eligible, false);
});

test("published anchors and rank requirements are the seven-rank progression contract", () => {
	assert.deepEqual(progression.WEAPON_RANK_REQUIREMENTS, [1, 20, 40, 60, 80, 90, 99]);
	assert.deepEqual(progression.WEAPON_PROGRESSION_ANCHORS, {
		1: { warrior: "blade", paladin: "mace", mage: "staff", priest: "wbook0", ranger: "bow", rogue: "claw" },
		2: { warrior: "fsword", paladin: "ololipop", mage: "firestaff", priest: "wbook3", ranger: "hbow", rogue: "stinger" },
		3: { warrior: "swifty", paladin: "glolipop", mage: "froststaff", priest: "wbook5", ranger: "merry", rogue: "fclaw" },
		4: { warrior: "sword", paladin: "pmaceofthedead", mage: "arcstaff", priest: "wbook6", ranger: "crossbow", rogue: "firestars" },
		5: { warrior: "bataxe", paladin: "xmace", mage: "vstaff", priest: "wbook8", ranger: "t3bow", rogue: "rapier" },
		6: { warrior: "scythe", paladin: "vhammer", mage: "wblade", priest: "wbook9", ranger: "weaver", rogue: "vdagger" },
		7: { warrior: "vsword", paladin: "lmace", mage: "pinkie", priest: "wbookhs", ranger: "gbow", rogue: "dragondagger" },
	});
});

test("Priest books publish positive direct Damage, Heal, and Attacks/Sec", () => {
	const fixture = buildWeaponLoadoutBalanceFixture();
	for (const state of fixture.weapon_states.filter((state) => state.weapon_id.startsWith("wbook"))) {
		assert.ok(state.damage > 0 && state.attacks_per_second > 0, state.weapon_id);
		assert.ok(state.heal >= 0, state.weapon_id);
	}
});
