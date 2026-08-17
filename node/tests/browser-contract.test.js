"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const browserFiles = [
	"js/functions.js",
	"js/game.js",
	"js/html.js",
	"js/keyboard.js",
	"js/runner_functions.js",
	"js/runner_compat.js",
	"js/old_common_functions.js",
	"htmls/contents/selection.html",
	"htmls/contents/selection_characters.html",
	"htmls/contents/character.html",
];

function source() {
	return browserFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
}

function functionSource(code, name, nextName) {
	const start = code.indexOf(`function ${name}(`);
	const end = code.indexOf(`function ${nextName}(`, start);
	assert.notEqual(start, -1, `browser source is missing ${name}`);
	assert.notEqual(end, -1, `browser source is missing ${nextName}`);
	return code.slice(start, end).trim();
}

function combatHarness() {
	const code = source();
	const context = {
		G: { abilities: { attack: { target: true }, heal: { target: true } } },
		is_array: Array.isArray,
		character: { range: 100, team: null },
		ctarget: null,
		xtarget: null,
		keymap: { attack: "attack", heal: "heal" },
		deferred: [],
		distance: () => 0,
		direction_logic: () => {},
		draw_trigger: (callback) => callback(),
		d_text: () => {},
		rejecting_promise: (value) => value,
		add_log: () => {},
		push_deferred: null,
		socket: {
			events: [],
			emit(name, payload) {
				this.events.push([name, payload]);
			},
		},
	};
	context.push_deferred = (name) => {
		context.deferred.push(name);
		return name;
	};
	vm.createContext(context);
	context.use_ability = vm.runInContext(`(${functionSource(code, "use_ability", "on_ability")})`, context);
	return {
		context,
		onAbility: vm.runInContext(`(${functionSource(code, "on_ability", "on_ability_up")})`, context),
		playerAttack: vm.runInContext(`(${functionSource(code, "player_attack", "player_heal")})`, context),
		playerHeal: vm.runInContext(`(${functionSource(code, "player_heal", "monster_attack")})`, context),
		monsterAttack: vm.runInContext(`(${functionSource(code, "monster_attack", "player_right_click")})`, context),
	};
}

test("browser code has a single ability action vocabulary", () => {
	const code = source();
	assert.doesNotMatch(code, /use_skill|next_skill|skill_timeout|socket\.emit\("skill"|socket\.on\("skill"/);
	assert.match(code, /function use_ability\(/);
	assert.match(code, /function ability_timeout\(/);
	assert.match(code, /socket\.emit\("ability"/);
	assert.doesNotMatch(code, /socket\.emit\("(?:attack|heal)"/);
	assert.match(code, /socket\.on\("ability_timeout"/);
});

test("browser combat producers normalize targets through the ability wire", () => {
	const { context, onAbility, playerAttack, playerHeal, monsterAttack } = combatHarness();
	for (const [producer, name, target, selected] of [
		[() => onAbility("attack"), "attack", { id: "target-on-ability-attack" }, true],
		[() => onAbility("heal"), "heal", { id: "target-on-ability-heal" }, true],
		[
			() => playerAttack.call({ id: "target-player-attack" }, null, true),
			"attack",
			{ id: "target-player-attack" },
			false,
		],
		[() => playerHeal.call({ id: "target-player-heal" }, null, true), "heal", { id: "target-player-heal" }, false],
		[
			() => monsterAttack.call({ id: "target-monster-attack" }, null, true),
			"attack",
			{ id: "target-monster-attack" },
			false,
		],
	]) {
		context.socket.events = [];
		context.deferred.length = 0;
		context.xtarget = null;
		context.ctarget = null;
		if (selected) context.xtarget = target;
		producer();
		assert.deepEqual(JSON.parse(JSON.stringify(context.socket.events)), [["ability", { name, id: target.id }]]);
		assert.deepEqual([...context.deferred], [name]);
	}
});

test("browser character and appearance surfaces use skill progression", () => {
	const code = source();
	assert.doesNotMatch(code, /G\.classes|G\.levels|\.ctype/);
	assert.match(code, /character\.skills/);
	assert.match(code, /character\.total_level/);
	assert.match(code, /G\.character\.appearances/);
	assert.match(
		fs.readFileSync(path.join(root, "htmls/contents/selection.html"), "utf8"),
		/domain\.character\.appearances/,
	);
	assert.doesNotMatch(fs.readFileSync(path.join(root, "htmls/contents/selection.html"), "utf8"), /char:/);
	assert.doesNotMatch(code, /calculate_item_properties\([^\n]+class:/);
	assert.match(fs.readFileSync(path.join(root, "main.js"), "utf8"), /character_view\(character\)/);
});

test("active class XP HUD displays exact persisted progress", () => {
	const code = source();
	const rendered = new Map();
	const styles = new Map();
	const cache = new Map();
	const context = {
		character: {
			active_skill: "mage",
			attack: 10,
			esize: 0,
			isize: 42,
			hp: 100,
			max_hp: 100,
			mp: 100,
			max_mp: 100,
			total_level: 7,
			skills: { mage: { level: 1, xp: 1600, max_xp: 93711 } },
		},
		X: { tutorial: { step: 0, task: 0 } },
		S: {},
		cached: (key, ...values) => {
			const nextValue = JSON.stringify(values);
			if (cache.get(key) === nextValue) return true;
			cache.set(key, nextValue);
			return false;
		},
		ctarget: null,
		floor: Math.floor,
		inventory: false,
		light_logic: () => {},
		map: { real_x: 0, real_y: 0 },
		mode: { dom_tests: false },
		no_html: false,
		options: {},
		round: Math.round,
		send_target_logic: () => {},
		showhide_quirks_logic: () => {},
		stage: {},
		topleft_npc: true,
		topright_npc: null,
		to_pretty_num: (value) => String(value),
		update_tutorial_ui: () => {},
		window: {},
		$: (selector) => ({
			html(value) {
				rendered.set(selector, value);
				return this;
			},
			css(property, value) {
				styles.set(selector + ":" + property, value);
				return this;
			},
		}),
	};
	vm.createContext(context);
	const updateOverlays = vm.runInContext(`(${functionSource(code, "update_overlays", "showhide_quirks_logic")})`, context);
	updateOverlays();
	assert.equal(rendered.get("#xpui"), "TL7 MAGE 1600/93711 XP 1%");
	assert.equal(styles.get("#xpslider:width"), "1%");

	context.character.skills.mage.xp = 1700;
	updateOverlays();
	assert.equal(rendered.get("#xpui"), "TL7 MAGE 1700/93711 XP 1%");

	context.character.skills.mage = { level: 99, xp: 900000000, max_xp: null };
	context.character.total_level = 105;
	updateOverlays();
	assert.equal(rendered.get("#xpui"), "TL105 MAGE 900000000/MAX XP 100%");
	assert.equal(styles.get("#xpslider:width"), "100%");
});

test("browser consumes direct-bonus scroll responses and discards primary player aliases", () => {
	const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
	const html = fs.readFileSync(path.join(root, "js/html.js"), "utf8");
	assert.match(game, /upgrade_success_direct_bonus/);
	assert.doesNotMatch(game, /upgrade_success_stat/);
	assert.match(game, /delete element\.stats/);
	assert.doesNotMatch(game, /element\.stats\[p\]\s*=\s*data\[p\]/);
	assert.match(html, /"Applied Scroll"/);
	assert.doesNotMatch(html.slice(html.indexOf("function render_character_sheet"), html.indexOf("function render_conditions")), /Strength|Intelligence|Dexterity|Vitality|Fortitude/);
	assert.doesNotMatch(html.slice(html.indexOf("function render_character_sheet"), html.indexOf("function render_conditions")), /Affected stats/);
	assert.doesNotMatch(game, /De-statted/);
});

test("skills tab filters combat skills to the equipped weapon", () => {
	const code = source();
	assert.match(functionSource(code, "render_skills", "show_condition"), /if \(!ability_matches_equipped_weapon\(skill\)\) return;/);
	const context = {
		G: {
			skills: {
				warrior: { kind: "combat" },
				mage: { kind: "combat" },
				merchant: { kind: "noncombat" },
			},
		},
		character: { active_skill: "warrior" },
	};
	vm.createContext(context);
	const abilityMatchesEquippedWeapon = vm.runInContext(
		`(${functionSource(code, "ability_matches_equipped_weapon", "render_skills")})`,
		context,
	);

	assert.equal(abilityMatchesEquippedWeapon({ applicability: "skill", skill: "warrior" }), true);
	assert.equal(abilityMatchesEquippedWeapon({ applicability: "skill", skill: "mage" }), false);
	assert.equal(abilityMatchesEquippedWeapon({ applicability: "active_combat" }), true);
	assert.equal(abilityMatchesEquippedWeapon({ applicability: "item" }), true);
	assert.equal(abilityMatchesEquippedWeapon({ applicability: "skill", skill: "merchant" }), true);

	context.character.active_skill = null;
	assert.equal(abilityMatchesEquippedWeapon({ applicability: "skill", skill: "warrior" }), false);
	assert.equal(abilityMatchesEquippedWeapon({ applicability: "active_combat" }), false);
});
