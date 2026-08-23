"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { WEAPON_PROFILES, deriveActiveSkill } = require("../game/active_skill");
const { calculateStats } = require("../game/stats");

const root = path.resolve(__dirname, "../..");
const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");

function regionalXpMultiplier(region) {
	const start = server.indexOf('if (region == "US") {');
	const end = server.indexOf("\n\n// B.u_boundary", start);
	assert.ok(start >= 0 && end > start, "U.S. XP bootstrap policy is present");
	return vm.runInNewContext(`var xpm = 1;\n${server.slice(start, end)}\nxpm;`, { region });
}

function loadCalculateGearOnlyPlayerStats(context) {
	const start = server.indexOf("function calculate_gear_only_player_stats(");
	const end = server.indexOf("\nfunction calculate_player_stats", start);
	assert.ok(start >= 0 && end > start, "player stat rebuild is present");
	return vm.runInNewContext(`(${server.slice(start, end)})`, context);
}

function playerXpMultiplier(serverMultiplier) {
	const calculateGearOnlyPlayerStats = loadCalculateGearOnlyPlayerStats({
		G: { items: {}, sets: {}, conditions: {} },
		WEAPON_PROFILES,
		calculateStats,
		deriveActiveSkill,
		calculate_item_properties: () => ({}),
		merchantTax: () => 0.05,
		calculate_common_stats: () => {},
		xpm: serverMultiplier,
	});
	const player = { slots: {}, items: [], s: {}, hp: 10, mp: 10, info: {}, map: "main" };
	calculateGearOnlyPlayerStats(player);
	return player.xpm;
}

test("U.S. servers apply exactly 2x combat XP before later reward modifiers", () => {
	assert.equal(regionalXpMultiplier("US"), 2);
	assert.equal(regionalXpMultiplier("EU"), 1);

	const baseline = server.indexOf("var xpm = 1;");
	const regionalPolicy = server.indexOf('if (region == "US") {');
	const pvpModifier = server.indexOf('if (server_name.startsWith("PVP") || server_name.startsWith("HARDCORE")) {');
	const combatReward = server.indexOf("round(monster.xp * player.xpm * monster.mult)");
	assert.ok(baseline >= 0 && baseline < regionalPolicy);
	assert.ok(regionalPolicy < pvpModifier && pvpModifier < combatReward);
	assert.match(server.slice(regionalPolicy, pvpModifier), /xpm \*= 2;/);

	const standardXpm = playerXpMultiplier(1);
	const usXpm = playerXpMultiplier(regionalXpMultiplier("US"));
	assert.equal(standardXpm, 1);
	assert.equal(usXpm, 2);
	assert.equal(Math.round(1000 * usXpm), 2 * Math.round(1000 * standardXpm));
	for (const rewardExpression of [
		"round(monster.xp * share * current.xpm)",
		"round(monster.xp * player.xpm * monster.mult)",
		"round(xp * current.xpm * current.share)",
	])
		assert.ok(server.includes(rewardExpression), rewardExpression);
});

test("the regional combat policy does not modify Mining or Smithing data", () => {
	for (const design of ["design/mining.js", "design/smithing.js"])
		assert.doesNotMatch(fs.readFileSync(path.join(root, design), "utf8"), /\bxpm\b/);
});
