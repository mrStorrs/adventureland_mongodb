"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { assertProtocol4Publication } = require("../game/release_readiness");

test("release readiness rejects a legacy publication shape", () => {
	assert.throws(() => assertProtocol4Publication({ protocol: 3, classes: {}, skills: {}, abilities: {} }), {
		code: "WORLD_PUBLICATION",
	});
});

test("release readiness accepts protocol 4 only when item publication is primary-free", () => {
	const skills = Object.fromEntries(["warrior", "paladin", "mage", "priest", "ranger", "rogue", "merchant", "mining", "smithing"].map((id) => [id, {}]));
	assert.doesNotThrow(() => assertProtocol4Publication({ protocol: 4, skills, abilities: {}, mining: { version: 2 }, smithing: { version: 2 }, items: { blade: { damage: 1, attacks_per_second: 1 } } }));
	assert.throws(() => assertProtocol4Publication({ protocol: 4, skills, abilities: {}, mining: { version: 2 }, smithing: { version: 2 }, items: { blade: { attack: 1 } } }), {
		code: "WORLD_PUBLICATION",
	});
});

test("progression events stay queued until a successful persistence boundary", () => {
	const root = path.resolve(__dirname, "../..");
	const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const resendStart = server.indexOf("function resend(player, events)");
	const resendEnd = server.indexOf("\nfunction transport_monster_to", resendStart);
	assert.notEqual(resendStart, -1);
	assert.notEqual(resendEnd, -1);
	assert.doesNotMatch(server.slice(resendStart, resendEnd), /flushPlayerProgressionEvents/);
	const syncStart = server.indexOf("async function sync_call(player)");
	const syncEnd = server.indexOf("\n\t// stop_call:", syncStart);
	assert.notEqual(syncStart, -1);
	assert.ok(syncEnd > syncStart);
	const syncBlock = server.slice(syncStart, syncEnd);
	const saveIndex = syncBlock.indexOf("await tx_save(entity)");
	const flushIndex = syncBlock.indexOf("flushPlayerProgressionEvents(player)");
	assert.notEqual(saveIndex, -1);
	assert.notEqual(flushIndex, -1);
	assert.ok(saveIndex < flushIndex);
});

test("authoritative hydration and save boundaries reject unmigrated items at every persisted character and bank path", () => {
	const root = path.resolve(__dirname, "../..");
	const source = fs.readFileSync(path.join(root, "adventure_functions.js"), "utf8");
	assert.match(source, /function assert_direct_character_items\(info\)/);
	assert.match(source, /info\.p\.trade_history\[history_index\]\[2\]/);
	assert.match(source, /assert_direct_character_items\(character\.info\)/);
	assert.match(source, /assert_direct_character_items\(data\)/);
	assert.match(source, /assert_direct_user_items\(user\.info\)/);
	assert.match(source, /assert_direct_user_items\(data\)/);
});
