"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { applyEquipmentTransaction } = require("../game/equipment_runtime");
const { planEquipmentTransaction } = require("../game/equipment");

function markStyleEffect(target, value) {
	Object.defineProperty(target, "progression_style_effect", {
		configurable: true,
		enumerable: false,
		value,
		writable: true,
	});
}

function transaction(active_skill) {
	return {
		slots: { mainhand: { name: active_skill === "mage" ? "staff" : "blade" } },
		items: [null],
		inventory: [null],
		active_skill,
		slot: "mainhand",
	};
}

function apply({ player, targets, failRemoteStats = false } = {}) {
	const resent = [];
	const reduced = [];
	let remoteStatsCalls = 0;
	const result = applyEquipmentTransaction({
		player,
		transaction: transaction("mage"),
		previousSkill: "warrior",
		targets,
		cacheItem: (item) => (item ? { cached: item.name } : null),
		calculatePlayerStats: (candidate) => {
			candidate.attack = candidate.slots?.mainhand?.name === "staff" ? 20 : 10;
		},
		calculateMonsterStats: (candidate) => {
			remoteStatsCalls += 1;
			if (failRemoteStats) throw new Error("remote stat calculation failed");
			candidate.attack = 7;
		},
		getPlayerByName: (name) => targets.find((target) => target.name === name),
		reduceTargets: (target, monster) => {
			reduced.push([target, monster]);
			target.targets -= 1;
		},
		resend: (target, events) => resent.push([target, events]),
	});
	return { result, resent, reduced, remoteStatsCalls };
}

test("production equipment projection atomically updates self and remote style effects", () => {
	const player = {
		id: "source",
		name: "source",
		in: "main",
		slots: { mainhand: { name: "blade" } },
		items: [{ name: "staff" }],
		s: {
			rs: { style_bound: true, source_character_id: "source", source_skill: "warrior" },
			persistent: { style_bound: false, source_character_id: "source", source_skill: "warrior" },
		},
		cooldown: { ms: 400 },
		p: { opaque: true },
	};
	markStyleEffect(player, { source_character_id: "source", source_skill: "warrior", ability_id: "mshield" });
	const ally = {
		name: "ally",
		s: {
			ally_style: { style_bound: true, source_character_id: "source", source_skill: "warrior" },
			ally_persistent: { style_bound: false, source_character_id: "source", source_skill: "warrior" },
		},
		cooldown: { ms: 500 },
	};
	const monster = {
		is_monster: true,
		name: "goo-1",
		s: {
			debuff: { style_bound: true, source_character_id: "source", source_skill: "warrior" },
			poison: { style_bound: false, source_character_id: "source", source_skill: "warrior" },
		},
		target: "ally",
		damage_type: "physical",
		cid: 3,
		u: false,
	};
	markStyleEffect(monster, { source_character_id: "source", source_skill: "warrior", ability_id: "absorb" });
	const beforePlayerCooldown = player.cooldown;
	const beforePlayerOpaque = player.p;

	const { result, resent, reduced, remoteStatsCalls } = apply({ player, targets: [ally, monster] });

	assert.deepEqual(result.active_skill, "mage");
	assert.deepEqual(player.slots, { mainhand: { name: "staff" } });
	assert.deepEqual(player.s, {
		persistent: { style_bound: false, source_character_id: "source", source_skill: "warrior" },
	});
	assert.equal(player.progression_style_effect, undefined);
	assert.equal(player.cooldown, beforePlayerCooldown);
	assert.equal(player.p, beforePlayerOpaque);
	assert.deepEqual(ally.s, {
		ally_persistent: { style_bound: false, source_character_id: "source", source_skill: "warrior" },
	});
	assert.deepEqual(monster.s, {
		poison: { style_bound: false, source_character_id: "source", source_skill: "warrior" },
	});
	assert.equal(monster.target, null);
	assert.equal(monster.cid, 4);
	assert.equal(monster.u, true);
	assert.equal(monster.progression_style_effect, undefined);
	assert.deepEqual(reduced, [[ally, monster]]);
	assert.equal(remoteStatsCalls, 1);
	assert.deepEqual(resent, []);
	assert.equal(ally.to_resend, "u+cid");
	assert.equal(monster.to_resend, "u+cid");
});

test("production equipment projection leaves every authority unchanged when remote recalculation fails", () => {
	const player = {
		id: "source",
		slots: { mainhand: { name: "blade" } },
		items: [{ name: "staff" }],
		s: { self: { style_bound: true, source_character_id: "source", source_skill: "warrior" } },
		attack: 11,
	};
	const remote = {
		is_monster: true,
		name: "ally",
		s: { remote: { style_bound: true, source_character_id: "source", source_skill: "warrior" } },
		attack: 12,
	};
	const beforePlayer = structuredClone(player);
	const beforeRemote = structuredClone(remote);

	assert.throws(() => apply({ player, targets: [remote], failRemoteStats: true }), /remote stat calculation failed/);
	assert.deepEqual(player, beforePlayer);
	assert.deepEqual(remote, beforeRemote);
});

test("style invalidation is a no-op when the active skill does not change", () => {
	const player = {
		id: "source",
		slots: { mainhand: { name: "blade" } },
		items: [],
		s: { active: { style_bound: true, source_character_id: "source", source_skill: "warrior" } },
	};
	const remote = { s: { active: { style_bound: true, source_character_id: "source", source_skill: "warrior" } } };
	const resent = [];
	applyEquipmentTransaction({
		player,
		transaction: { ...transaction("warrior"), slots: player.slots, items: [], inventory: [], active_skill: "warrior" },
		previousSkill: "warrior",
		targets: [remote],
		cacheItem: (item) => item,
		calculatePlayerStats: () => undefined,
		calculateMonsterStats: () => undefined,
		getPlayerByName: () => undefined,
		reduceTargets: () => assert.fail("unexpected target reduction"),
		resend: (target) => resent.push(target),
	});
	assert.deepEqual(player.s, { active: { style_bound: true, source_character_id: "source", source_skill: "warrior" } });
	assert.deepEqual(remote.s, { active: { style_bound: true, source_character_id: "source", source_skill: "warrior" } });
	assert.deepEqual(resent, []);
});

test("equipment runtime accepts a highest-skill armor gate and reports each failed candidate", () => {
	const items = { pairedhelm: { type: "helmet" } };
	const requirements = { pairedhelm: [{ any_skill: ["warrior", "paladin"], level: 2 }] };
	const passed = planEquipmentTransaction({
		player: { slots: {}, items: [{ name: "pairedhelm" }] },
		item: { name: "pairedhelm" },
		itemIndex: 0,
		items,
		itemRequirements: requirements,
		skills: { warrior: { level: 1 }, paladin: { level: 2 } },
	});
	assert.equal(passed.slots.helmet.name, "pairedhelm");
	assert.throws(
		() => planEquipmentTransaction({
			player: { slots: {}, items: [{ name: "pairedhelm" }] }, item: { name: "pairedhelm" }, itemIndex: 0, items, itemRequirements: requirements, skills: { warrior: { level: 1 } },
		}),
		(error) => error.code === "skill_level_required" && error.item === "pairedhelm" && error.skill === undefined && error.required === 2 && error.actual_by_skill.warrior === 1 && error.actual_by_skill.paladin === 0,
	);
});

test("ungated equipment equips at any skill level while weapons retain their rank gate", () => {
	const items = {
		leatherhelm: { type: "helmet" },
		leatherring: { type: "ring" },
		blade: { type: "weapon", wtype: "short_sword" },
	};
	const requirements = {
		leatherhelm: [],
		leatherring: [],
		blade: [{ skill: "warrior", level: 20 }],
	};
	const player = { slots: {}, items: [{ name: "leatherhelm" }, { name: "leatherring" }, { name: "blade" }] };
	const skills = { warrior: { level: 1 } };

	const helmet = planEquipmentTransaction({ player, item: player.items[0], itemIndex: 0, items, itemRequirements: requirements, skills });
	assert.equal(helmet.slots.helmet.name, "leatherhelm");
	const ring = planEquipmentTransaction({ player, item: player.items[1], itemIndex: 1, items, itemRequirements: requirements, skills });
	assert.equal(ring.slots.ring1.name, "leatherring");
	assert.throws(
		() => planEquipmentTransaction({ player, item: player.items[2], itemIndex: 2, items, itemRequirements: requirements, skills }),
		(error) => error.code === "skill_level_required" && error.item === "blade" && error.required === 20,
	);
});
