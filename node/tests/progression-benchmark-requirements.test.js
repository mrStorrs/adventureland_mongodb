"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { benchmarkItemChoices, validateItemRoute } = require("../tools/progression-benchmark");

const items = {
	blade: { type: "weapon", wtype: "short_sword" },
	chainmail: { type: "chest" },
	shield: { type: "shield" },
};
const itemRequirements = {
	blade: [{ skill: "warrior", level: 20 }],
	chainmail: [],
	shield: [],
};
const data = { items, itemRequirements };

test("benchmark routes accept ungated gear but preserve weapon rank gates", () => {
	assert.deepEqual(benchmarkItemChoices("chest", { warrior: 1 }, data), ["chainmail"]);
	assert.deepEqual(benchmarkItemChoices("offhand", { warrior: 1 }, data), ["shield"]);
	assert.deepEqual(benchmarkItemChoices("mainhand", { warrior: 1 }, data), []);
	assert.deepEqual(benchmarkItemChoices("mainhand", { warrior: 20 }, data), ["blade"]);

	assert.throws(
		() => validateItemRoute("warrior", { mainhand: "blade", chest: "chainmail", offhand: "shield" }, { warrior: 1 }, data, "below-rank"),
		/illegal: blade requires warrior 20/,
	);
	assert.equal(
		validateItemRoute("warrior", { mainhand: "blade", chest: "chainmail", offhand: "shield" }, { warrior: 20 }, data, "at-rank").skill,
		"warrior",
	);
});
