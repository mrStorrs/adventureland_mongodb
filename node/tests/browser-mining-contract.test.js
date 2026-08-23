"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { mining } = require("../../design/mining");
const { sprites } = require("../../design/sprites");

const root = path.resolve(__dirname, "../..");
const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
const functions = fs.readFileSync(path.join(root, "js/functions.js"), "utf8");
const init = fs.readFileSync(path.join(root, "common/init.js"), "utf8");

function functionSource(source, name, nextName) {
	const start = source.indexOf(`function ${name}(`);
	const end = source.indexOf(`function ${nextName}(`, start);
	assert.notEqual(start, -1, `missing ${name}`);
	assert.notEqual(end, -1, `missing ${nextName}`);
	return source.slice(start, end);
}

test("[AC-6] browser ability wire carries explicit Mining IDs and preserves omitted fallback", () => {
	const emitted = [];
	const context = {
		G: { abilities: { mining: { target: true } } },
		is_array: Array.isArray,
		is_string: (value) => typeof value === "string",
		character: {},
		socket: { emit: (name, payload) => emitted.push([name, payload]) },
		push_deferred: (name) => name,
		add_log() {},
		rejecting_promise: (value) => value,
	};
	vm.createContext(context);
	const useAbility = vm.runInContext(`(${functionSource(functions, "use_ability", "on_ability")})`, context);
	useAbility("mining", "runite-2");
	useAbility("mining");
	assert.deepEqual(JSON.parse(JSON.stringify(emitted)), [
		["ability", { name: "mining", id: "runite-2" }],
		["ability", { name: "mining" }],
	]);
});

test("[AC-11] Tunnel rock helpers render all rocks, enforce private depletion, click IDs, and clean up", () => {
	assert.equal(sprites.mining_ores.type, "emblem");
	assert.equal(sprites.mining_ores.columns, 4);
	assert.deepEqual(sprites.mining_ores.matrix, [
		[null, "mining_rock_copper", "mining_rock_iron", "mining_rock_gold"],
		[null, "mining_rock_copper_depleted", "mining_rock_iron_depleted", "mining_rock_gold_depleted"],
		["mining_rock_mithril", "mining_rock_adamantite", "mining_rock_runite", null],
		["mining_rock_mithril_depleted", "mining_rock_adamantite_depleted", "mining_rock_runite_depleted", null],
	]);
	const source = functionSource(game, "reset_mining_state", "report_progression_protocol_issue");
	const events = [];
	const destroyed = [];
	const children = [];
	function sprite(art) {
		return {
			art,
			handlers: {},
			children: [],
			height: 32,
			anchor: { set() {} },
			addChild(child) {
				this.children.push(child);
			},
			on(name, handler) {
				this.handlers[name] = handler;
				if (name === "pointertap") this.click = handler;
				return this;
			},
			emit(name, event) {
				if (!this.interactive || !this.handlers[name]) return false;
				this.handlers[name](event);
				return true;
			},
			destroy() {
				destroyed.push(this.rock_id);
			},
		};
	}
	const context = {
		G: { mining, skills: { warrior: {}, paladin: {}, mage: {}, priest: {}, ranger: {}, rogue: {}, merchant: {}, mining: {} } },
		current_map: "tunnel",
		map: { addChild: (child) => children.push(child) },
		map_entities: [],
		mining_rock_sprites: {},
		mining_state: { rocks: {} },
		mining_state_ready: false,
		new_sprite: (art, type) => {
			assert.equal(type, "emblem", "Mining rocks use their sprite-sheet renderer, not tile positions");
			return sprite(art);
		},
		PIXI: {
			Text: function (text) {
				this.text = text;
				this.anchor = { set() {} };
				this.scale = { set() {} };
				this.visible = true;
			},
		},
		now_date: new Date(1000),
		use_ability: (name, id) => events.push([name, id]),
		mouseover() {
			context.hovered = this.rock_id;
		},
		mouseout() {
			context.hovered = null;
		},
	};
	vm.createContext(context);
	vm.runInContext(source, context);
	context.create_mining_rocks();
	assert.equal(Object.keys(context.mining_rock_sprites).length, 18);
	assert.equal(children.length, 18);
	assert.equal(context.mining_rock_sprites["copper-1"].interactive, true);
	assert.equal(context.mining_rock_sprites["copper-1"].buttonMode, false);
	assert.equal(context.mining_rock_sprites["copper-1"].mining_label, "Copper Ore — loading account state");
	assert.equal(context.mining_rock_sprites["copper-1"].accessibleTitle, "Copper Ore — loading account state");
	assert.equal(context.mining_rock_sprites["copper-1"].accessible, true);
	assert.match(context.mining_rock_sprites["copper-1"].accessibleHint, /unavailable while account state loads/);
	assert.equal(typeof context.mining_rock_sprites["copper-1"].handlers.mouseover, "function");
	context.mining_rock_sprites["copper-1"].emit("mouseover");
	assert.equal(context.hovered, "copper-1");
	assert.equal(context.mining_rock_sprites["copper-1"].mining_hover_label.visible, true);
	assert.equal(context.mining_rock_sprites["copper-1"].mining_hover_label.text, "Copper Ore — loading account state");
	context.mining_rock_sprites["copper-1"].emit("mouseout");
	assert.equal(context.hovered, null);
	context.set_mining_state({ rocks: {} }, 1000);
	assert.match(context.mining_rock_sprites["copper-1"].mining_label, /^Copper Ore — available$/);
	context.mining_rock_sprites["copper-1"].click();
	assert.deepEqual(events, [["mining", "copper-1"]]);

	context.set_mining_state({ rocks: { "copper-1": 9000 } }, 1000);
	assert.equal(context.mining_rock_sprites["copper-1"].interactive, true);
	assert.equal(context.mining_rock_sprites["copper-1"].buttonMode, false);
	context.mining_rock_sprites["copper-1"].click();
	assert.equal(events.length, 1);
	assert.equal(context.mining_rock_sprites["copper-1"].mining_label, "Copper Ore — available in 8s");
	assert.equal(context.mining_rock_sprites["copper-1"].accessibleTitle, "Copper Ore — available in 8s");
	context.mining_rock_sprites["copper-1"].emit("mouseover");
	assert.equal(context.mining_rock_sprites["copper-1"].mining_hover_label.text, "Copper Ore — available in 8s");

	context.reset_mining_state(1000);
	assert.equal(context.mining_state_ready, false);
	assert.deepEqual(JSON.parse(JSON.stringify(context.mining_state)), { rocks: {} });
	assert.equal(context.mining_rock_sprites["copper-1"].mining_label, "Copper Ore — loading account state");
	context.mining_rock_sprites["copper-1"].click();
	assert.equal(events.length, 1);
	assert.equal(context.set_mining_state({ rocks: { madeup: 9000 } }, 1000), false);
	assert.equal(context.mining_state_ready, false);
	context.set_mining_state({ rocks: { "copper-1": 9000 } }, 1000);

	context.update_mining_rocks(9001);
	assert.equal(context.mining_rock_sprites["copper-1"].buttonMode, true);
	context.destroy_mining_rocks();
	assert.equal(destroyed.length, 18);
	assert.equal(Object.keys(context.mining_rock_sprites).length, 0);
	context.create_mining_rocks();
	assert.equal(Object.keys(context.mining_rock_sprites).length, 18);
});

test("[AC-2] fresh-character onboarding derives the canonical nine-skill state", () => {
	const context = {
		G: { skills: { warrior: {}, paladin: {}, mage: {}, priest: {}, ranger: {}, rogue: {}, merchant: {}, mining: {}, smithing: {} } },
	};
	vm.createContext(context);
	const isFresh = vm.runInContext(`(${functionSource(game, "is_fresh_progression_character", "set_mining_state")})`, context);
	const skills = Object.fromEntries(Object.keys(context.G.skills).map((id) => [id, { level: 1, xp: 0 }]));
	assert.equal(isFresh({ skills, total_level: 9 }), true);
	assert.equal(isFresh({ skills, total_level: 8 }), false);
	assert.equal(isFresh({ skills: { ...skills, smithing: { level: 2, xp: 1 } }, total_level: 10 }), false);
	assert.doesNotMatch(game, /character\.total_level == 8/);
});

test("[AC-11] Mining state is private wire data rather than a public map timestamp", () => {
	assert.match(game, /socket\.on\("mining_state"/);
	assert.doesNotMatch(fs.readFileSync(path.join(root, "design/maps.js"), "utf8"), /available_at|claim_id/);
	assert.doesNotMatch(game, /mining_none/);
	const miningStart = game.slice(game.indexOf('data.type == "mining_start"'), game.indexOf('data.type == "poisoned_resist"'));
	assert.doesNotMatch(miningStart, /direction/);
	assert.match(game, /create_mining_rocks\(\)/);
	assert.match(game, /destroy_mining_rocks\(\)/);
	assert.ok((game.match(/reset_mining_state\(\)/g) || []).length >= 3, "start, map, and off-map events reset private state");
});

test("[AC-11] local clients do not cache stale Mining renderer assets", () => {
	assert.match(init, /const staticAssetCacheAge = Local \? 0 : "30d";/);
	assert.match(init, /express\.static\("\.\/js", \{ maxAge: staticAssetCacheAge \}\)/);
	assert.match(init, /express\.static\("\.\/images", \{ maxAge: staticAssetCacheAge \}\)/);
});
