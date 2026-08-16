"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateStats } = require("../game/stats");

function weapon(properties) {
	return { type: "weapon", wtype: "short_sword", ...properties };
}

test("calculated combat values merge direct weapon and equipment effects without primary attributes", () => {
	const stats = calculateStats({
		items: {
			blade: weapon({ damage: 90, attacks_per_second: 0.5, base_crit: 18 }),
			belt: { type: "belt", damage: 6, hp: 144, throw_range: 9, crit: 12 },
		},
		slots: { mainhand: { name: "blade" }, belt: { name: "belt" } },
	});
	assert.equal(stats.attack, 96);
	assert.equal(stats.frequency, 0.5);
	assert.equal(stats.max_hp, 244);
	assert.equal(stats.throw_range, 9);
	assert.equal(stats.crit, 30);
	for (const key of ["str", "dex", "int", "vit", "for"]) assert.ok(!Object.hasOwn(stats, key), key);
});

test("direct critical and player mitigation lanes retain their separate caps", () => {
	const stats = calculateStats({
		items: { blade: weapon({ damage: 10, attacks_per_second: 0.5, base_crit: 120, crit: 30, pvp_damage_reduction: 130 }) },
		slots: { mainhand: { name: "blade" } },
		conditions: { focus: { crit: 25 } },
	});
	assert.equal(stats.crit, 100);
	assert.equal(stats.pvp_damage_reduction, 100);
});

test("direct cadence effects, resource effects, and death sickness apply once", () => {
	const regular = calculateStats({
		items: { blade: weapon({ damage: 80, attacks_per_second: 0.4, heal: 24, hp: 48, mp: 15 }) },
		slots: { mainhand: { name: "blade" } },
		conditions: { haste: { attacks_per_second: 0.1 } },
	});
	const sick = calculateStats({
		items: { blade: weapon({ damage: 80, attacks_per_second: 0.4, heal: 24, hp: 48, mp: 15 }) },
		slots: { mainhand: { name: "blade" } },
		conditions: { haste: { attacks_per_second: 0.1 } },
		deathSickness: true,
	});
	assert.equal(regular.frequency, 0.5);
	assert.equal(regular.max_hp, 148);
	assert.equal(regular.max_mp, 115);
	assert.ok(sick.attack < regular.attack);
	assert.ok(sick.frequency < regular.frequency);
});
