"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { loadSourceData } = require("../tools/acquisition-ranking");
const progressionModule = require("../game/monster_progression");
const { progression } = require("../../design/progression");

const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));

function handlerSource() {
	const start = server.indexOf('socket.on("monsterhunt", function (data) {');
	const end = server.indexOf('\n\t\tsocket.on("ccreport",', start);
	assert.ok(start >= 0 && end > start);
	return server.slice(start, end);
}

function harness({ weapon = { name: "blade", level: 4 }, gameplay = "normal", hunt = null, reservations = {}, monsters = null } = {}) {
	const data = loadSourceData();
	let handler;
	const responses = [];
	const awards = [];
	const resends = [];
	const player = { name: "Tester", slots: weapon ? { mainhand: weapon } : {}, s: hunt ? { monsterhunt: hunt } : {}, hitchhikers: [] };
	const liveMonsters = monsters || {
		goo: { type: "goo", level: 1, max_hp: data.monsters.goo.hp },
		rat: { type: "rat", level: 2, max_hp: data.monsters.rat.hp },
		poisio: { type: "poisio", level: 5, max_hp: data.monsters.poisio.hp },
		ghost: { type: "ghost", level: 6, max_hp: data.monsters.ghost.hp },
	};
	const socket = {
		id: "socket-id",
		on: (name, callback) => {
			if (name === "monsterhunt") handler = callback;
		},
	};
	vm.runInNewContext(handlerSource(), {
		B: { sell_dist: 400 },
		G: { items: data.items, maps: data.maps, monsters: data.monsters },
		Set,
		add_item: (_player, item, options) => awards.push({ item, options }),
		calculateHuntCount: progressionModule.calculateHuntCount,
		chooseHuntCandidate: progressionModule.chooseHuntCandidate,
		createHuntRecord: progressionModule.createHuntRecord,
		fail_response: (response) => responses.push({ failed: response }),
		gameplay,
		huntPopulation: progressionModule.huntPopulation,
		instances: { main: { name: "main", monsters: liveMonsters } },
		normalizeHunt: progressionModule.normalizeHunt,
		players: { "socket-id": player },
		progression,
		region: "US",
		resend: (_player, events) => resends.push(events),
		rewardQuantity: progressionModule.rewardQuantity,
		resolveHuntWeapon: progressionModule.resolveHuntWeapon,
		server: { s: { ...reservations } },
		server_name: "I",
		simple_distance: () => 0,
		socket,
		success_response: (response) => responses.push({ success: response }),
	});
	assert.equal(typeof handler, "function");
	return { awards, handler, player, responses, resends, socket };
}

test("monster-hunt socket orchestration uses authoritative progression helpers", () => {
	const handler = handlerSource();
	assert.match(server, /require\("\.\/game\/monster_progression"\)/);
	assert.match(handler, /resolveHuntWeapon/);
	assert.match(handler, /chooseHuntCandidate/);
	assert.match(handler, /normalizeHunt/);
	assert.match(handler, /rewardQuantity/);
	assert.doesNotMatch(handler, /monster\.level > mmax/);
	assert.doesNotMatch(handler, /q: \(gameplay == "hardcore" && 100\) \|\| 1/);
});

test("monster-hunt assignment stores v2 state, chooses unlocked tiers, and falls back around reservations", () => {
	const rankOne = harness({ weapon: { name: "blade", level: 3 } });
	rankOne.handler({ tier: 99, reward: 999 });
	assert.equal(rankOne.player.s.monsterhunt.id, "goo");
	assert.equal(rankOne.player.s.monsterhunt.tier, 1);
	assert.equal(rankOne.player.s.monsterhunt.v, 2);
	assert.ok(rankOne.player.s.monsterhunt.c > 0);
	assert.deepEqual(plain(rankOne.responses), [{ success: { started: true } }]);
	assert.deepEqual(rankOne.resends, ["u+cid"]);

	const rankOneEnhanced = harness({ weapon: { name: "blade", level: 4 } });
	rankOneEnhanced.handler({});
	assert.equal(rankOneEnhanced.player.s.monsterhunt.id, "rat");
	assert.equal(rankOneEnhanced.player.s.monsterhunt.tier, 2);

	const hunter = harness({ weapon: { name: "mhspear", level: 4 } });
	hunter.handler({});
	assert.equal(hunter.player.s.monsterhunt.id, "ghost");
	assert.equal(hunter.player.s.monsterhunt.tier, 6);

	const fallback = harness({ weapon: { name: "mhspear", level: 4 }, reservations: { monsterhunt_ghost: { type: "monsterhunt", id: "ghost" } } });
	fallback.handler({});
	assert.equal(fallback.player.s.monsterhunt.id, "poisio");
	assert.equal(fallback.player.s.monsterhunt.tier, 5);
});

test("monster-hunt completion awards authoritative tier quantities and preserves v1 compatibility", () => {
	const normal = harness({ hunt: { v: 2, sn: "US I", id: "croc", tier: 1, c: 0, ms: 1, dl: true } });
	normal.handler({ tier: 1, reward: 1 });
	assert.deepEqual(plain(normal.awards), [{ item: "monstertoken", options: { log: true, q: 2 } }]);
	assert.equal(normal.player.s.monsterhunt, undefined);
	assert.deepEqual(plain(normal.responses), [{ success: { completed: true } }]);

	const v1 = harness({ hunt: { sn: "US I", id: "stoneworm", c: 0, ms: 1, dl: true } });
	v1.handler({});
	assert.deepEqual(plain(v1.awards), [{ item: "monstertoken", options: { log: true, q: 4 } }]);

	const hardcore = harness({ gameplay: "hardcore", hunt: { v: 2, sn: "US I", id: "ghost", tier: 1, c: 0, ms: 1, dl: true } });
	hardcore.handler({});
	assert.deepEqual(plain(hardcore.awards), [{ item: "monstertoken", options: { log: true, q: 500 } }]);
});

test("monster-hunt failures leave state untouched and cannot double-award", () => {
	const unranked = harness({ weapon: null });
	unranked.handler({});
	assert.equal(unranked.player.s.monsterhunt, undefined);
	assert.deepEqual(plain(unranked.responses), [{ failed: "monsterhunt_weapon" }]);

	const incomplete = harness({ hunt: { v: 2, sn: "US I", id: "goo", tier: 1, c: 1, ms: 1, dl: true } });
	incomplete.handler({});
	assert.deepEqual(plain(incomplete.responses), [{ failed: "monsterhunt_already" }]);

	const invalid = harness({ hunt: { sn: "US I", id: "unknown", c: 0, ms: 1, dl: true } });
	invalid.handler({});
	assert.equal(invalid.player.s.monsterhunt.id, "unknown");
	assert.deepEqual(plain(invalid.awards), []);
	assert.deepEqual(plain(invalid.responses), [{ failed: "monsterhunt_invalid" }]);

	const completed = harness({ hunt: { sn: "US I", id: "goo", c: 0, ms: 1, dl: true } });
	completed.handler({});
	completed.handler({});
	assert.equal(completed.awards.length, 1);
});
