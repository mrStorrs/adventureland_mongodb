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

test("[AC-visual] starting Smithing broadcasts the Mining-style visual effect", () => {
	const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
	const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const successStart = server.indexOf('log_smithing_event(player, { action_id: smithing_channel.action_id');
	const responseStart = server.indexOf('player.socket.emit("game_response", {', successStart);
	assert.ok(successStart >= 0 && responseStart > successStart);
	assert.match(server.slice(successStart, responseStart), /xy_emit\(player, "ui", \{ type: "smithing_start", name: player\.name \}\);/);

	const visualStart = game.indexOf('data.type == "smithing_start"');
	const visualEnd = game.indexOf('data.type == "poisoned_resist"', visualStart);
	assert.ok(visualStart >= 0 && visualEnd > visualStart);
	const visualEffect = game.slice(visualStart, visualEnd);
	assert.match(visualEffect, /var sender = get_player\(data\.name\);/);
	assert.match(visualEffect, /if \(sender\) v_shake_minor\(sender\);/);
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
