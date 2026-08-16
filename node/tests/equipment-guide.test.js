"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadHelpers() {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const start = source.indexOf("function equipment_requirement_state");
	const end = source.indexOf("function render_equip_info", start);
	assert.ok(start >= 0 && end > start, "equipment Guide helpers are present");
	const context = { G: { skills: { warrior: { name: "Warrior" }, paladin: { name: "Paladin" }, ranger: { name: "Ranger" }, rogue: { name: "Rogue" } } } };
	vm.createContext(context);
	vm.runInContext("String.prototype.toTitleCase = function () { return this.charAt(0).toUpperCase() + this.slice(1); };\n" + source.slice(start, end) + "\nglobalThis.helpers={equipment_requirement_state,equipment_requirement_label,equipment_requirements_pass,equipment_set_bonus_groups};", context, { filename: "html.js" });
	return { source, helpers: context.helpers };
}

function loadRenderers() {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const helpersStart = source.indexOf("function equipment_requirement_state");
	const equipInfoEnd = source.indexOf("function render_item_help", helpersStart);
	const renderItemStart = source.indexOf("var last_selector = \"\";");
	const renderItemEnd = source.indexOf("function render_item_by_name", renderItemStart);
	const directBonusStart = source.indexOf("function direct_effect_label(");
	const directBonusEnd = source.indexOf("function guide_weapon_progression_metrics", directBonusStart);
	const setStart = source.indexOf("function render_set");
	const setEnd = source.indexOf("function render_condition", setStart);
	assert.ok(helpersStart >= 0 && equipInfoEnd > helpersStart && renderItemStart >= 0 && renderItemEnd > renderItemStart && directBonusStart >= 0 && directBonusEnd > directBonusStart && setStart >= 0 && setEnd > setStart, "equipment renderers are present");
	const skills = { warrior: { level: 42 }, paladin: { level: 0 } };
	const items = {
		placeholder: { type: "chest", skin: "placeholder", armor_weight: "heavy", placeholder_art: true, requirements: [{ any_skill: ["warrior", "paladin"], level: 42 }] },
		groupedweapon: { type: "weapon", name: "Grouped Weapon", skin: "groupedweapon", tier: 1, wtype: "short_sword", requirements: [{ any_skill: ["warrior", "paladin"], level: 42 }] },
		helm: { name: "Helm", skin: "helm" }, chestA: { name: "Chest A", skin: "chestA" }, chestB: { name: "Chest B", skin: "chestB" }, pants: { name: "Pants", skin: "pants" }, gloves: { name: "Gloves", skin: "gloves" }, shoes: { name: "Shoes", skin: "shoes" }, cape: { name: "Cape", skin: "cape" },
	};
	const context = {
		G: { skills: { warrior: { name: "Warrior" }, paladin: { name: "Paladin" } }, items, maps: {}, craft: {}, sets: { example: { name: "Example", items: ["helm", "chestA", "chestB", "pants", "gloves", "shoes", "cape"], bonus_items: { helmet: ["helm"], chest: ["chestA", "chestB"], pants: ["pants"], gloves: ["gloves"], shoes: ["shoes"] }, 2: { armor: 2 }, 3: { armor: 3 }, 4: { armor: 4 }, 5: { armor: 5 } } } },
		window: { character: { skills } }, character: { skills }, weapon_types: { short_sword: "Short Sword" }, offhand_types: {}, modal_count: 0, last_selector: "#set",
		bold_prop_line: (name, value, color) => `${color || ""}|${name}|${value}`, calculate_item_grade: () => 0, calculate_item_properties: () => ({}), to_pretty_float: (value) => String(value), colors: {}, in_arr: (value, values) => Array.isArray(values) && values.includes(value), trade_slots: [], booster_items: [],
		item_container: ({ skin }) => `[${skin}]`, render_item: () => "<properties>", show_modal: (html) => { context.modalHtml = html; }, $: () => ({ html: (html) => { context.setHtml = html; } }),
	};
	vm.createContext(context);
	vm.runInContext("String.prototype.toTitleCase = function () { return this.charAt(0).toUpperCase() + this.slice(1); };\n" + source.slice(helpersStart, equipInfoEnd) + source.slice(directBonusStart, directBonusEnd) + source.slice(renderItemStart, renderItemEnd) + source.slice(setStart, setEnd) + "\nglobalThis.renderers={render_equip_info,render_item,render_set};", context, { filename: "html.js" });
	return context;
}

function plain(value) {
	return JSON.parse(JSON.stringify(value));
}

test("Guide helpers express grouped highest-skill requirements without treating them as AND", () => {
	const { helpers } = loadHelpers();
	const clause = { any_skill: ["warrior", "paladin"], level: 42 };
	assert.equal(helpers.equipment_requirement_label(clause), "Highest Warrior or Paladin Lv.42");
	assert.deepEqual(plain(helpers.equipment_requirement_state(clause, { warrior: { level: 41 }, paladin: { level: 42 } })), {
		passed: true, actual_by_skill: { warrior: 41, paladin: 42 },
	});
	assert.deepEqual(plain(helpers.equipment_requirement_state(clause, { warrior: { level: 41 } })), {
		passed: false, actual_by_skill: { warrior: 41, paladin: 0 },
	});
	assert.equal(helpers.equipment_requirements_pass([clause, { skill: "ranger", level: 9 }], { warrior: { level: 99 }, ranger: { level: 9 } }), true);
	assert.equal(helpers.equipment_requirements_pass([clause], { warrior: { level: 41 }, paladin: { level: 41 } }), false);
});

test("Guide helpers group bonus slots and source renders weights, alternatives, inert theme members, and placeholders", () => {
	const { source, helpers } = loadHelpers();
	assert.deepEqual(plain(helpers.equipment_set_bonus_groups({ bonus_items: { helmet: ["helm"], chest: ["chestA", "chestB"], pants: ["pants"], gloves: ["gloves"], shoes: ["shoes"] } })), [
		{ slot: "helmet", items: ["helm"] }, { slot: "chest", items: ["chestA", "chestB"] }, { slot: "pants", items: ["pants"] }, { slot: "gloves", items: ["gloves"] }, { slot: "shoes", items: ["shoes"] },
	]);
	assert.match(source, /Weight: /);
	assert.match(source, /Placeholder artwork/);
	assert.match(source, /Themed items \(do not count toward armor bonus\)/);
	assert.match(source, /\[2, 3, 4, 5\]\.forEach/);
	assert.doesNotMatch(source.slice(source.indexOf("function render_set"), source.indexOf("function render_condition")), /\[1, 2, 3, 4, 5, 6, 7, 8\]/);
});

test("Guide renderers display the approved grouped gates and armor-only set details", () => {
	const context = loadRenderers();
	context.renderers.render_equip_info("placeholder");
	assert.match(context.modalHtml, /PASS — Highest Warrior or Paladin Lv\.42/);
	assert.match(context.modalHtml, /Weight: Heavy/);
	assert.match(context.modalHtml, /Placeholder artwork/);
	const tooltip = context.renderers.render_item("html", { item: context.G.items.placeholder, name: "placeholder", pure: true, prop: { requirements: [{ any_skill: ["warrior", "paladin"], level: 42 }] } });
	assert.match(tooltip, /#C3C3C3\|Weight\|Heavy/);
	assert.match(tooltip, /#C3C3C3\|Art\|Placeholder artwork/);
	assert.match(tooltip, /#36813A\|PASS\|Highest Warrior or Paladin Lv\.42/);
	const eligibleWeapon = context.renderers.render_item("html", { item: context.G.items.groupedweapon, name: "groupedweapon", pure: true });
	assert.match(eligibleWeapon, /#56A244/);
	context.character.skills.warrior.level = 41;
	const ineligibleWeapon = context.renderers.render_item("html", { item: context.G.items.groupedweapon, name: "groupedweapon", pure: true });
	assert.match(ineligibleWeapon, /#CC3837/);
	context.renderers.render_set("example");
	assert.match(context.setHtml, /Bonus Chest: Chest A or Chest B/);
	assert.match(context.setHtml, /Themed items \(do not count toward armor bonus\)/);
	assert.match(context.setHtml, /\[2\+ Equipped\]/);
	assert.match(context.setHtml, /\[5\+ Equipped\]/);
	assert.doesNotMatch(context.setHtml, /\[1\+ Equipped\]|\[6\+ Equipped\]/);
});

test("item tooltips render readable direct values, negative effects, and the applied-scroll distinction", () => {
	const context = loadRenderers();
	const tooltip = context.renderers.render_item("html", {
		item: { name: "direct-gear", type: "chest" },
		actual: { name: "direct-gear", direct_bonus: { version: 1, source: "strscroll", effects: { damage: 1, throw_range: 3 } } },
		pure: true,
		prop: { damage: -2, attacks_per_second: 0.25, hp: -48, base_crit: 0.2, crit: 1, throw_range: 3, pvp_damage_reduction: 4.5 },
	});
	assert.match(tooltip, /\|Damage\|-2/);
	assert.match(tooltip, /\|Attacks\/Sec\|0\.25/);
	assert.match(tooltip, /\|Crit\|1\.2%/);
	assert.match(tooltip, /\|Applied Scroll\|\+1 Damage, \+3 Throw Range/);
	assert.doesNotMatch(tooltip, /Strength|Intelligence|Dexterity|Vitality|Fortitude|\|Stat\|/);
});
