"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { items } = require("../../design/items");
const { smelting } = require("../../design/smelting");
const { createCharacterState } = require("../game/character_state");
const { initializePlayerProgression, awardPlayerSkillXp } = require("../game/progression_runtime");
const { prepareSmeltingCraft } = require("../game/smelting");

const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");

function craftHandler(context) {
	const start = server.indexOf('socket.on("craft", function (data) {');
	const functionStart = server.indexOf("function (data) {", start);
	const end = server.indexOf('\n\t\t});\n\t\tsocket.on("exchange"', functionStart);
	assert.ok(start >= 0 && functionStart > start && end > functionStart, "craft handler is present");
	return vm.runInNewContext(`(${server.slice(functionStart, end + 4).trim()})`, context);
}

function snapshot(player) {
	return structuredClone({
		items: player.items,
		citems: player.citems,
		esize: player.esize,
		gold: player.gold,
		info: player.info,
		skills: player.skills,
		total_level: player.total_level,
		p: player.p,
		t: player.t,
		progression_events: player.progression_events,
	});
}

function restore(player, before) {
	Object.assign(player, structuredClone(before));
	player.skills = player.info.skills;
}

function plain(value) {
	return JSON.parse(JSON.stringify(value));
}

function createHarness({
	ore = "copperore",
	quantity = 10,
	capacity = true,
	award = awardPlayerSkillXp,
	consume: consumeOverride,
	addItem: addItemOverride,
} = {}) {
	const state = createCharacterState();
	const player = {
		id: "smelter",
		computer: true,
		gold: 777,
		items: [{ name: ore, q: quantity }],
		citems: [{ name: ore, q: quantity }],
		esize: 0,
		info: { skills: state.skills },
		total_level: state.total_level,
		p: {},
		t: {},
	};
	initializePlayerProgression(player);
	const responses = [];
	const resends = [];
	const socket = { id: "socket-smelter" };
	const context = {
		Array,
		Boolean,
		Date,
		Object,
		G: {
			items,
			titles: {},
			smelting,
			craft: {
				copperbar: { items: [[10, "copperore"]], cost: 0 },
				ironbar: { items: [[10, "ironore"]], cost: 0 },
			},
		},
		D: { craftmap: { copperore: "copperbar", ironore: "ironbar" } },
		B: { sell_dist: 0 },
		players: { [socket.id]: player },
		socket,
		server_id: "server-a",
		prepareSmeltingCraft,
		snapshot_progression_rewards: snapshot,
		restore_progression_rewards: restore,
		can_add_item: () => capacity,
		create_new_item: (name) => ({ name }),
		consume:
			consumeOverride ||
			((recipient, slot, amount) => {
				const item = recipient.items[slot];
				if (!item || (item.q || 1) < amount) throw Object.assign(new Error("missing ore"), { code: "craft_cant_quantity" });
				if ((item.q || 1) === amount) {
					recipient.items[slot] = null;
					recipient.citems[slot] = null;
					recipient.esize += 1;
				} else {
					item.q -= amount;
					recipient.citems[slot] = { ...item };
				}
			}),
		add_item:
			addItemOverride ||
			((recipient, name) => {
				const slot = recipient.items.findIndex((item) => !item);
				if (slot < 0) throw Object.assign(new Error("inventory full"), { code: "inventory_full" });
				recipient.items[slot] = { name, q: 1 };
				recipient.citems[slot] = { name, q: 1 };
				recipient.esize -= 1;
				return slot;
			}),
		awardPlayerSkillXp: award,
		randomStr: () => "fallbackAction",
		random_one: (values) => values[0],
		resend: (recipient, events) => resends.push({ recipient, events }),
		success_response: (response, data) => {
			responses.push({ response, data });
			return { response, data };
		},
		fail_response: (response, data) => {
			responses.push({ response, data });
			return { response, data };
		},
	};
	return { player, responses, resends, handle: craftHandler(context) };
}

test("[AC-4] the production craft handler rejects an underlevel bar without mutating gold, ore, XP, or sources", () => {
	const harness = createHarness({ ore: "ironore" });
	const before = snapshot(harness.player);
	harness.handle({ items: [[0, 0]], craft_id: "ironBelowLevel" });
	assert.deepEqual(plain(harness.responses), [{ response: "smelting_level", data: { required_level: 15 } }]);
	assert.deepEqual(snapshot(harness.player), before);
	assert.equal(harness.resends.length, 0);
});

test("[AC-5] the production craft handler consumes ten ore, adds one bar, and persists one Smelting XP snapshot", () => {
	const harness = createHarness();
	harness.handle({ items: [[0, 0]], craft_id: "copperSuccess" });
	assert.deepEqual(harness.player.items, [{ name: "copperbar", q: 1 }]);
	assert.equal(harness.player.gold, 777);
	assert.equal(harness.player.skills.smelting.xp, 8000);
	assert.equal(harness.player.total_level, 9);
	assert.equal(harness.player.p.skill_xp_sources.length, 1);
	assert.match(harness.player.p.skill_xp_sources[0].source_id, /server-a:smelting:smelter:copperSuccess/);
	assert.equal(harness.player.progression_events.length, 1);
	assert.equal(harness.player.progression_events[0].skills.smelting.xp, 8000);
	assert.deepEqual(plain(harness.responses), [{ response: "craft", data: { num: 0, name: "copperbar", cevent: true, replayed: false } }]);
	assert.equal(harness.resends.length, 1);
});

test("[AC-6] the production craft handler makes a replay and a full-inventory request mutation-free", () => {
	const harness = createHarness();
	const request = { items: [[0, 0]], craft_id: "repeatCopper" };
	harness.handle(request);
	const beforeReplay = snapshot(harness.player);
	harness.handle(request);
	assert.deepEqual(snapshot(harness.player), beforeReplay);
	assert.equal(harness.player.p.skill_xp_sources.length, 1);
	assert.deepEqual(plain(harness.responses.at(-1)), {
		response: "craft",
		data: { cevent: true, replayed: true },
	});

	const full = createHarness({ quantity: 11, capacity: false });
	const beforeFull = snapshot(full.player);
	full.handle({ items: [[0, 0]], craft_id: "fullCopper" });
	assert.equal(full.responses.length, 1);
	assert.equal(full.responses[0].response, "inventory_full");
	assert.deepEqual(snapshot(full.player), beforeFull);
});

test("[AC-6] a production award failure restores the complete crafted state", () => {
	const harness = createHarness({
		award: () => {
			throw Object.assign(new Error("award failure"), { code: "skill_xp_failure" });
		},
	});
	const before = snapshot(harness.player);
	assert.throws(() => harness.handle({ items: [[0, 0]], craft_id: "awardFailure" }), { code: "skill_xp_failure" });
	assert.deepEqual(snapshot(harness.player), before);
});

test("[AC-6] a production bar-insertion failure restores the complete crafted state", () => {
	const harness = createHarness({
		addItem: () => {
			throw Object.assign(new Error("bar insertion failure"), { code: "inventory_full" });
		},
	});
	const before = snapshot(harness.player);
	assert.throws(() => harness.handle({ items: [[0, 0]], craft_id: "barInsertionFailure" }), { code: "inventory_full" });
	assert.deepEqual(snapshot(harness.player), before);
	assert.equal(harness.responses.length, 0);
	assert.equal(harness.resends.length, 0);
});

test("[AC-6] malformed action IDs fall back safely and a consume failure rolls the production state back", () => {
	const malformed = createHarness();
	malformed.handle({ items: [[0, 0]], craft_id: "not-valid!" });
	assert.match(malformed.player.p.skill_xp_sources[0].source_id, /server-a:smelting:smelter:fallbackAction/);

	const failing = createHarness({
		consume: (player) => {
			player.items[0].q -= 1;
			throw Object.assign(new Error("consume failure"), { code: "craft_cant_quantity" });
		},
	});
	const before = snapshot(failing.player);
	assert.throws(() => failing.handle({ items: [[0, 0]], craft_id: "consumeFailure" }), { code: "craft_cant_quantity" });
	assert.deepEqual(snapshot(failing.player), before);
});
