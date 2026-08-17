"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { DIRECT_EFFECT_KEY_SET } = require("../game/direct_effects");
const { activeSkillFromItem } = require("../game/active_skill");
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

test("only weapons retain level-gated equipment requirements", () => {
	const data = loadSourceData();
	const equipmentTypes = new Set([
		"helmet",
		"pants",
		"chest",
		"weapon",
		"amulet",
		"earring",
		"shoes",
		"gloves",
		"ring",
		"shield",
		"belt",
		"source",
		"orb",
		"quiver",
		"cape",
		"misc_offhand",
		"tool",
	]);
	for (const [itemId, item] of Object.entries(data.items)) {
		if (!equipmentTypes.has(item.type) || item.type === "weapon") continue;
		assert.deepEqual(data.itemRequirements[itemId], [], `${itemId} is not level-gated`);
	}
	for (const [itemId, item] of Object.entries(data.items)) {
		if (item.type !== "weapon") continue;
		assert.ok(data.itemRequirements[itemId].length > 0, `${itemId} remains weapon-gated`);
	}
});

test("Hunter sidegrades are Monster Token-only without changing PvP weapon routes", () => {
	const data = loadSourceData();
	const hunterIds = ["mhbook", "mhcrossbow", "mhdagger", "mhhammer", "mhspear", "mhwand"];
	assert.deepEqual(Object.entries(data.items).filter(([, item]) => item.type === "weapon" && item.hunter_only).map(([itemId]) => itemId).sort(), [...hunterIds].sort());
	const tokenPrices = hunterIds.map((itemId) => data.tokens.monstertoken[itemId]);
	assert.equal(new Set(tokenPrices).size, 1);
	assert.ok(Number.isSafeInteger(tokenPrices[0]) && tokenPrices[0] > 0);
	assert.deepEqual(data.tokens.pvptoken, { hammer: 120, harbringer: 25, spear: 1, t2bow: 1, weaponbox: 1, armorbox: 1 });
	assert.equal(data.tokens.monstertoken.armorbox, 5);
	for (const itemId of hunterIds) {
		const item = data.items[itemId];
		assert.equal(item.hunter_only, true, itemId);
		assert.equal(item.placeholder_art, true, itemId);
		assert.equal(item.progression.shared_rank, 5, itemId);
		assert.ok(activeSkillFromItem(item), itemId);
		assert.deepEqual(Object.entries(data.tokens).filter(([, entries]) => Object.hasOwn(entries, itemId)).map(([token]) => token), ["monstertoken"], itemId);
		assert.equal(Object.values(data.drops.monsters).some((entries) => entries.some((entry) => entry[1] === itemId)), false, itemId);
		assert.equal(Object.values(data.npcs).some((npc) => (npc.items || []).includes(itemId)), false, itemId);
		assert.equal(Object.hasOwn(data.craft, itemId), false, itemId);
	}
	assert.deepEqual(data.drops.weaponbox.filter((entry) => ["hammer", "harbringer", "spear", "t2bow"].includes(entry[1])), [[0.05, "harbringer"], [1.4, "t2bow"], [1, "spear"], [0.02, "hammer"]]);
	assert.deepEqual(data.drops.monsters.harpy.filter((entry) => entry[1] === "harbringer"), [[1 / 2000, "harbringer"]]);
	assert.deepEqual(data.drops.monsters.dryad.filter((entry) => entry[1] === "pclaw"), [[1 / 5000, "pclaw"]]);
	assert.deepEqual(data.craft.wbook7, { items: [[1, "wbook0"]], cost: 33000000 });
});
