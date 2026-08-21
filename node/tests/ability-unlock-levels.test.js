"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { abilities } = require("../../design/abilities");

const expectedUnlocks = {
	warrior: {
		taunt: 1,
		dash: 10,
		charge: 20,
		agitate: 30,
		cleave: 50,
		stomp: 60,
		hardshell: 75,
		warcry: 90,
	},
	paladin: {
		selfheal: 1,
		smash: 10,
		mshield: 50,
		purify: 90,
	},
	mage: {
		burst: 1,
		blink: 10,
		energize: 20,
		light: 30,
		alchemy: 40,
		magiport: 50,
		entangle: 65,
		reflection: 80,
		cburst: 90,
	},
	priest: {
		heal: 1,
		curse: 15,
		partyheal: 25,
		revive: 40,
		absorb: 55,
		phaseout: 70,
		darkblessing: 90,
	},
	ranger: {
		supershot: 1,
		poisonarrow: 10,
		huntersmark: 20,
		track: 30,
		"3shot": 50,
		"4fingers": 65,
		piercingshot: 75,
		"5shot": 90,
	},
	rogue: {
		quickpunch: 1,
		quickstab: 1,
		stack: 10,
		pcoat: 20,
		invis: 30,
		mentalburst: 45,
		pickpocket: 60,
		rspeed: 75,
		shadowstrike: 90,
	},
	merchant: {
		fishing: 1,
		massproduction: 10,
		massexchange: 25,
		mluck: 40,
		throw: 55,
		massproductionpp: 65,
		mcourage: 75,
		massexchangepp: 85,
		mfrenzy: 90,
	},
};

test("class abilities use the balanced level-one-to-ninety unlock map", () => {
	const actualUnlocks = {};
	for (const [id, ability] of Object.entries(abilities)) {
		if (ability.applicability !== "skill" || !ability.skill || !expectedUnlocks[ability.skill]) continue;
		actualUnlocks[ability.skill] ??= {};
		actualUnlocks[ability.skill][id] = ability.level ?? 1;
	}

	assert.deepEqual(actualUnlocks, expectedUnlocks);
});
