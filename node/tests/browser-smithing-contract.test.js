"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");

test("[AC-4, AC-5, AC-9] the browser receives Smithing as a timed authoritative craft outcome", () => {
	const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
	assert.match(game, /data\.place == "smithing"/);
	assert.match(game, /data\.in_progress\) ui_log\("Smithing in progress"/);
	assert.match(game, /data\.outcome == "success"/);
	assert.match(game, /data\.outcome == "failure"/);
	assert.match(game, /data\.outcome == "cancelled"/);
	assert.match(game, /resolve_deferred\("craft", data\)/);
	assert.match(game, /reject_deferred\("craft", \{ reason: "smithing_failure"/);
	assert.match(game, /response == "smithing_level"/);
	assert.match(game, /response == "smithing_busy"/);
});

test("[AC-9] normal crafting keeps its existing immediate response path", () => {
	const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const smithingStart = server.indexOf("var smithing_details = recipeTier");
	const normalCraftStart = server.indexOf("player.gold -= G.craft[name].cost;", smithingStart);
	const craftEnd = server.indexOf('socket.on("exchange"', normalCraftStart);
	assert.ok(smithingStart >= 0 && normalCraftStart > smithingStart && craftEnd > normalCraftStart);
	const normalCraft = server.slice(normalCraftStart, craftEnd);
	assert.match(normalCraft, /consume\(player, place\[x\[1\]\], x\[0\]\)/);
	assert.match(normalCraft, /success_response\("craft", \{ num: i, name: name, cevent: true \}\)/);
});
