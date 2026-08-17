"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { WEAPON_PROFILES, deriveActiveSkill } = require("../game/active_skill");
const { calculateStats } = require("../game/stats");

const root = path.resolve(__dirname, "../..");
const serverSource = fs.readFileSync(path.join(root, "node/server.js"), "utf8");

function loadIssuePlayerAward(context) {
	const start = serverSource.indexOf("function issue_player_award(");
	const end = serverSource.indexOf("\nfunction commence_attack", start);
	assert.notEqual(start, -1);
	assert.ok(end > start);
	return vm.runInNewContext(`(${serverSource.slice(start, end)})`, context);
}

function loadCalculateGearOnlyPlayerStats(context) {
	const start = serverSource.indexOf("function calculate_gear_only_player_stats(");
	const end = serverSource.indexOf("\nfunction calculate_player_stats", start);
	assert.notEqual(start, -1);
	assert.ok(end > start);
	return vm.runInNewContext(`(${serverSource.slice(start, end)})`, context);
}

function player(name, overrides = {}) {
	const emitted = [];
	return {
		name,
		map: "arena",
		gold: 1000,
		kills: 0,
		party: null,
		socket: { emit: (...args) => emitted.push(args) },
		resends: [],
		emitted,
		...overrides,
	};
}

function awardContext(players = {}, parties = {}, nameToId = {}) {
	return {
		G: { maps: { arena: { safe_pvp: false } } },
		gameplay: "test",
		mode: { log_pvp: false },
		max: Math.max,
		min: Math.min,
		round: Math.round,
		floor: Math.floor,
		maxCombatLevel: () => 1,
		is_pvp: () => true,
		is_same: () => false,
		is_in_pvp: () => false,
		refreshDeathSickness: () => {},
		sicknessDelta: () => ({ death_sickness_until: null }),
		drop_something_hardcore: () => {},
		drop_something_pvp: () => {},
		appengine_log: () => {},
		to_pretty_num: String,
		pwns: [],
		pend: 0,
		players,
		parties,
		name_to_id: nameToId,
		resend: (current, events) => current.resends.push({ events, gold: current.gold }),
	};
}

test("PvP gold awards publish the updated solo character balance", () => {
	const attacker = player("attacker");
	const target = player("target");
	const issuePlayerAward = loadIssuePlayerAward(awardContext());

	issuePlayerAward(attacker, target);

	assert.equal(attacker.gold, 1090);
	assert.deepEqual(attacker.resends, [{ events: "reopen", gold: 1090 }]);
});

test("PvP gold awards publish the updated balance for every party member", () => {
	const attacker = player("attacker", { party: "party" });
	const member = player("member", { party: "party" });
	const target = player("target");
	const issuePlayerAward = loadIssuePlayerAward(
		awardContext(
			{ attackerId: attacker, memberId: member },
			{ party: ["attacker", "member"] },
			{ attacker: "attackerId", member: "memberId" },
		),
	);

	issuePlayerAward(attacker, target);

	assert.equal(attacker.gold, 1045);
	assert.equal(member.gold, 1045);
	assert.deepEqual(attacker.resends, [{ events: "reopen", gold: 1045 }]);
	assert.deepEqual(member.resends, [{ events: "reopen", gold: 1045 }]);
});

test("slot gold rewards publish the updated character balance", () => {
	const start = serverSource.indexOf('if (name == "slots") {');
	const end = serverSource.indexOf("\n\t\t\t\t\t} else {", start);
	assert.notEqual(start, -1);
	assert.ok(end > start);
	const slotReward = serverSource.slice(start, end);

	assert.match(slotReward, /player\.gold \+= gold/);
	assert.match(slotReward, /player\.socket\.emit\("game_log", \{ message: "Received/);
	assert.match(slotReward, /\n\s+resend\(player, "reopen"\);/);
});

test("stat recalculation preserves the persistent character gold balance", () => {
	const calculateGearOnlyPlayerStats = loadCalculateGearOnlyPlayerStats({
		G: { items: {}, sets: {}, conditions: {} },
		WEAPON_PROFILES,
		calculateStats,
		deriveActiveSkill,
		calculate_item_properties: () => ({}),
		merchantTax: () => 0.05,
		calculate_common_stats: () => {},
	});
	const current = {
		gold: 1234,
		slots: {},
		items: [],
		s: {},
		hp: 10,
		mp: 10,
		info: {},
		map: "main",
	};

	calculateGearOnlyPlayerStats(current);

	assert.equal(current.gold, 1234);
});

test("monster chest gold refreshes the character balance after loot", () => {
	const start = serverSource.indexOf('socket.on("open_chest", function (data) {');
	const end = serverSource.indexOf('\n\t\tsocket.on("auth", async function (data) {', start);
	assert.notEqual(start, -1);
	assert.ok(end > start);
	const chestLoot = serverSource.slice(start, end);

	assert.match(chestLoot, /goldm: player\.goldm \|\| 1/);
	assert.match(chestLoot, /player\.gold \+= r\.gold/);
	assert.match(chestLoot, /resend\(player, \(reopen && "reopen\+nc\+inv"\) \|\| "reopen"\);/);
	assert.match(chestLoot, /resend\(current, \(reopen\[current\.id\] && "reopen\+nc\+inv"\) \|\| "reopen"\);/);
});

test("the main server doubles normal monster item and gold rewards", () => {
	const dropStart = serverSource.indexOf("function drop_something(player, monster, share) {");
	const dropEnd = serverSource.indexOf("\nfunction drop_something_hardcore", dropStart);
	assert.notEqual(dropStart, -1);
	assert.ok(dropEnd > dropStart);
	const monsterDrops = serverSource.slice(dropStart, dropEnd);

	assert.match(serverSource, /main_server_reward_multiplier = server_key == options\.default_server_key \? 2 : 1/);
	assert.match(serverSource, /drop_rate_multiplier: main_server_reward_multiplier/);
	assert.match(serverSource, /gold_multiplier: main_server_reward_multiplier/);
	const multiplierExpression = serverSource.match(/var main_server_reward_multiplier = (.+);/)[1];
	const multiplierFor = new Function("server_key", "options", `return ${multiplierExpression};`);
	assert.equal(multiplierFor("local", { default_server_key: "local" }), 2);
	assert.equal(multiplierFor("harness", { default_server_key: "local" }), 1);
	assert.match(monsterDrops, /share \/ player\.luckm \/ monster\.luckx \/ global_mult \/ B\.drop_rate_multiplier/);
	assert.match(monsterDrops, /share \/ player\.luckm \/ hp_mult \/ monster\.luckx \/ global_mult \/ B\.drop_rate_multiplier/);
	assert.match(monsterDrops, /share \/ player\.luckm \/ hp_mult \/ monster\.luckx \/ B\.drop_rate_multiplier/);
	assert.match(monsterDrops, /monster_mult \* B\.drop_rate_multiplier/);
	assert.match(monsterDrops, /drop\.gold = round\(drop\.gold \* B\.gold_multiplier\)/);
	assert.match(monsterDrops, /drop\.egold \*= B\.gold_multiplier/);

	const hardcoreStart = serverSource.indexOf("function drop_something_hardcore(player, target) {");
	const hardcoreEnd = serverSource.indexOf("\nfunction drop_something_pvp", hardcoreStart);
	const pvpStart = hardcoreEnd;
	const pvpEnd = serverSource.indexOf("\nfunction monster_hunt_logic", pvpStart);
	const cooperativeRewardsStart = serverSource.indexOf("function issue_monster_awards(monster) {");
	const cooperativeRewardsEnd = serverSource.indexOf("\nfunction issue_monster_award", cooperativeRewardsStart);
	const soloPartyRewardsStart = cooperativeRewardsEnd;
	const soloPartyRewardsEnd = serverSource.indexOf("\nfunction kill_monster", soloPartyRewardsStart);
	for (const boundary of [hardcoreStart, hardcoreEnd, pvpStart, pvpEnd, cooperativeRewardsStart, cooperativeRewardsEnd, soloPartyRewardsStart, soloPartyRewardsEnd])
		assert.notEqual(boundary, -1);
	assert.doesNotMatch(serverSource.slice(hardcoreStart, hardcoreEnd), /drop_rate_multiplier|gold_multiplier/);
	assert.doesNotMatch(serverSource.slice(pvpStart, pvpEnd), /drop_rate_multiplier|gold_multiplier/);
	assert.doesNotMatch(serverSource.slice(cooperativeRewardsStart, cooperativeRewardsEnd), /drop_rate_multiplier|gold_multiplier/);
	const soloPartyRewards = serverSource.slice(soloPartyRewardsStart, soloPartyRewardsEnd);
	assert.match(soloPartyRewards, /round\(monster\.xp \* player\.xpm \* monster\.mult\)/);
	assert.match(soloPartyRewards, /var cxp = round\(xp \* current\.xpm \* current\.share\)/);
	assert.doesNotMatch(soloPartyRewards, /drop_rate_multiplier|gold_multiplier/);
});
