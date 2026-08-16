"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { DIRECT_EFFECT_KEY_SET } = require("../game/direct_effects");
const { loadSourceData } = require("../tools/acquisition-ranking");

const root = path.resolve(__dirname, "../..");
const forbidden = new Set(["str", "dex", "int", "vit", "for", "stat", "stat_type", "attack", "frequency"]);

function loadDesign(name) {
	const context = { multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(root, "design", `${name}.js`), "utf8"), context, { filename: `${name}.js` });
	return context[name];
}

function findForbiddenKeys(value, location = "root", matches = []) {
	if (!value || typeof value !== "object") return matches;
	for (const [key, child] of Object.entries(value)) {
		const next = `${location}.${key}`;
		if (forbidden.has(key)) matches.push(next);
		findForbiddenKeys(child, next, matches);
	}
	return matches;
}

test("authoritative catalog, conditions, titles, ability requirements, and baseline are primary-free", () => {
	const data = loadSourceData();
	const conditions = loadDesign("conditions");
	const titles = loadDesign("titles");
	const abilities = loadDesign("abilities");
	const character = loadDesign("character");
	for (const [name, value] of Object.entries({ items: data.items, sets: data.sets, conditions, titles, abilities: Object.values(abilities), character })) {
		assert.deepEqual(findForbiddenKeys(value), [], name);
	}
	assert.deepEqual(JSON.parse(JSON.stringify(abilities.mentalburst.requirements)), { max_mp: 1060 });
	for (const [itemId, item] of Object.entries(data.items)) {
		if (item.type !== "weapon") continue;
		assert.ok(Number.isFinite(item.damage) && item.damage > 0, itemId);
		assert.ok(Number.isFinite(item.attacks_per_second) && item.attacks_per_second > 0, itemId);
	}
});

test("published direct-effect vectors use only the explicit contract keys", () => {
	const data = loadSourceData();
	for (const [itemId, item] of Object.entries(data.items)) {
		for (const container of [item, item.upgrade, item.compound, item.legacy, item.scroll_effects]) {
			if (!container || typeof container !== "object") continue;
			for (const [key, value] of Object.entries(container)) {
				if (!DIRECT_EFFECT_KEY_SET.has(key)) continue;
				assert.ok(Number.isFinite(value), `${itemId}:${key}`);
			}
		}
	}
});

test("Priest starters are replaceable without adding an ordinary starter loot route", () => {
	const data = loadSourceData();
	assert.ok(data.npcs.basics.items.includes("wbook0"));
	assert.equal((data.drops.monsters.bat || []).some((entry) => entry[1] === "wbook0"), false);
});
