"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { directBonusFor, scrollSources } = require("../game/direct_bonus_migration");
const { sameItemIdentity } = require("../game/equipment");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/direct-equipment-authority");

function setup() {
	const data = loadSourceData();
	return { data, calculateItemProperties: loadPropertyCalculators(data).current.calculate_item_properties };
}

test("all 22 scroll sources produce explicit direct bonuses at the current item level", () => {
	const { data, calculateItemProperties } = setup();
	const sources = scrollSources(data.items);
	for (const source of sources.keys()) {
		const bonus = directBonusFor({ name: "mshield", level: 4 }, source, { items: data.items, calculateItemProperties, sources });
		assert.equal(bonus.version, 1);
		assert.equal(bonus.source, source);
		assert.ok(Object.keys(bonus.effects).length > 0, source);
		for (const value of Object.values(bonus.effects)) assert.ok(Number.isFinite(value), source);
	}
});

test("replacing and refreshing a direct bonus changes item identity without changing unrelated fields", () => {
	const { data, calculateItemProperties } = setup();
	const item = { name: "mshield", level: 1, q: 1, data: "kept" };
	const strength = { ...item, direct_bonus: directBonusFor(item, "strscroll", { items: data.items, calculateItemProperties }) };
	const vitality = { ...item, direct_bonus: directBonusFor(item, "vitscroll", { items: data.items, calculateItemProperties }) };
	assert.equal(sameItemIdentity(strength, strength), true);
	assert.equal(sameItemIdentity(strength, vitality), false);
	const enhanced = { ...strength, level: 8 };
	enhanced.direct_bonus = directBonusFor(enhanced, enhanced.direct_bonus.source, { items: data.items, calculateItemProperties });
	assert.notDeepEqual(enhanced.direct_bonus.effects, strength.direct_bonus.effects);
	assert.equal(enhanced.data, "kept");
});

test("shared property calculation applies direct bonus effects once and server paths use direct-bonus responses", () => {
	const { data, calculateItemProperties } = setup();
	const item = { name: "mshield", level: 1 };
	item.direct_bonus = directBonusFor(item, "strscroll", { items: data.items, calculateItemProperties });
	const plain = calculateItemProperties({ name: "mshield", level: 1 });
	const applied = calculateItemProperties(item);
	for (const [key, value] of Object.entries(item.direct_bonus.effects)) assert.equal(applied[key] - plain[key], value, key);
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	const serverFunctions = fs.readFileSync(path.resolve(__dirname, "../server_functions.js"), "utf8");
	assert.match(server, /upgrade_success_direct_bonus/);
	assert.match(server, /delete item\.direct_bonus/);
	assert.doesNotMatch(server, /item\.stat_type/);
	assert.match(serverFunctions, /validateItemBonus\(current, \{ items: G\.items, path: "cache_item" \}\)/);
});
