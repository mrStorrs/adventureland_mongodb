"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	calculateHuntCount,
	chooseHuntCandidate,
	maximumAssignableTier,
	normalizeHunt,
	resolveHuntWeapon,
	rewardQuantity,
} = require("../game/monster_progression");

const progression = {
	HUNTER_MAX_ASSIGNABLE_TIER: 6,
	HUNTER_TOKEN_REWARDS: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 },
	MONSTER_PROGRESSION: {
		goo: { tier: 1, hunter_eligible: true },
		rat: { tier: 2, hunter_eligible: true },
		croc: { tier: 3, hunter_eligible: true },
		bat: { tier: 4, hunter_eligible: true },
		stoneworm: { tier: 5, hunter_eligible: true },
		ghost: { tier: 6, hunter_eligible: true },
		phoenix: { tier: 5, hunter_eligible: false },
		bigbird: { tier: 7, hunter_eligible: true },
	},
};

const items = {
	blade: { type: "weapon", wtype: "short_sword", progression: { shared_rank: 1 } },
	bataxe: { type: "weapon", wtype: "axe", progression: { shared_rank: 5 } },
	plain: { type: "weapon", wtype: "short_sword" },
};

function instanceMonsters(...monsters) {
	return { main: { name: "main", monsters: Object.fromEntries(monsters.map((monster, index) => [`m${index}`, monster])) } };
}

test("ranked equipped combat weapons unlock only their current tier until +4", () => {
	assert.equal(maximumAssignableTier({ rank: 1, enhancement: 3 }, progression), 1);
	assert.equal(maximumAssignableTier({ rank: 1, enhancement: 4 }, progression), 2);
	assert.equal(maximumAssignableTier({ rank: 5, enhancement: 4 }, progression), 6);
	assert.equal(maximumAssignableTier({ rank: 6, enhancement: 12 }, progression), 6);
	assert.equal(maximumAssignableTier({ rank: 7, enhancement: 12 }, progression), 6);
	assert.equal(maximumAssignableTier(null, progression), null);
	assert.deepEqual(resolveHuntWeapon({ mainhand: { name: "bataxe", level: 4 } }, items, progression), { weapon_id: "bataxe", skill: "warrior", rank: 5, enhancement: 4, maximum_tier: 6 });
	assert.equal(resolveHuntWeapon({ mainhand: { name: "plain", level: 12 } }, items, progression), null);
	assert.equal(resolveHuntWeapon({}, items, progression), null);
});

test("candidate choice uses the highest unlocked eligible tier and only falls back when necessary", () => {
	const candidates = instanceMonsters(
		{ type: "goo", level: 9, max_hp: 100 },
		{ type: "rat", level: 1, max_hp: 100 },
		{ type: "croc", level: 99, max_hp: 100 },
		{ type: "phoenix", level: 1000, max_hp: 100 },
		{ type: "bigbird", level: 1000, max_hp: 100 },
	);
	assert.deepEqual(chooseHuntCandidate({ instances: candidates, progression, maximum_tier: 3, hunted_ids: new Set() }), { monster_id: "croc", tier: 3, max_hp: 100 });
	assert.deepEqual(chooseHuntCandidate({ instances: candidates, progression, maximum_tier: 3, hunted_ids: new Set(["croc"]) }), { monster_id: "rat", tier: 2, max_hp: 100 });
	assert.equal(chooseHuntCandidate({ instances: instanceMonsters({ type: "phoenix", level: 99, max_hp: 100 }, { type: "bigbird", level: 99, max_hp: 100 }), progression, maximum_tier: 6, hunted_ids: new Set() }), null);
	assert.equal(chooseHuntCandidate({ instances: instanceMonsters({ type: "ghost", level: 9, max_hp: 100, target: "player" }), progression, maximum_tier: 6, hunted_ids: new Set() }), null);
});

test("hunt count keeps the existing bounded normal and hardcore formula", () => {
	assert.equal(calculateHuntCount({ population: 2, max_hp: 1000, respawn: 1, hardcore: false }), 500);
	assert.equal(calculateHuntCount({ population: 1, max_hp: 1000000000, respawn: 1000, hardcore: false }), 1);
	assert.equal(calculateHuntCount({ population: 2, max_hp: 1000, respawn: 1, hardcore: true }), 50);
	assert.equal(calculateHuntCount({ population: 0, max_hp: 1000, respawn: 1, hardcore: false }), null);
});

test("stored hunts resolve server-owned tiers and rewards fail closed", () => {
	assert.deepEqual(normalizeHunt({ sn: "US I", id: "stoneworm", c: 4, ms: 1, dl: true }, progression), { v: 2, sn: "US I", id: "stoneworm", tier: 5, c: 4, ms: 1, dl: true });
	assert.deepEqual(normalizeHunt({ v: 2, sn: "US I", id: "ghost", tier: 1, c: 1, ms: 1, dl: true }, progression), { v: 2, sn: "US I", id: "ghost", tier: 6, c: 1, ms: 1, dl: true });
	assert.equal(normalizeHunt({ id: "unknown", c: 0 }, progression), null);
	assert.equal(rewardQuantity(1, false, progression), 1);
	assert.equal(rewardQuantity(4, false, progression), 3);
	assert.equal(rewardQuantity(6, true, progression), 500);
	assert.equal(rewardQuantity(7, false, progression), null);
});
