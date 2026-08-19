"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const game = fs.readFileSync(path.resolve(__dirname, "../../js/game.js"), "utf8");
const functions = fs.readFileSync(path.resolve(__dirname, "../../js/functions.js"), "utf8");

function socketHandler(startMarker, nextMarker, context) {
	const start = game.indexOf(startMarker);
	const functionStart = game.indexOf("function (data) {", start);
	const end = game.indexOf(`\n\t});\n\t${nextMarker}`, functionStart);
	assert.ok(start >= 0 && functionStart > start && end > functionStart, `${startMarker} handler exists`);
	return require("node:vm").runInNewContext(`(${game.slice(functionStart, end + 3).trim()})`, context);
}

test("[AC-7] the browser executes the specific level message, suppresses replay output, and accepts a Smelting snapshot", () => {
	const logs = [];
	const gameResponse = socketHandler('socket.on("game_response", function (data) {', 'socket.on("gm"', {
		Dev: false,
		G: { craft: { copperbar: { cost: 0 } }, items: { copperbar: { name: "Copper Bar" } } },
		ui_log: (message, color) => logs.push({ message, color }),
		draw_trigger: (callback) => callback(),
		in_arr: () => false,
	});
	gameResponse({ response: "smelting_level", required_level: 15 });
	gameResponse({ response: "craft", name: "copperbar", replayed: true });
	gameResponse({ response: "craft", name: "copperbar", replayed: false });
	assert.deepEqual(logs, [
		{ message: "Requires Smelting level 15", color: "gray" },
		{ message: "Received Copper Bar", color: "white" },
	]);

	const character = { skills: {}, total_level: 0 };
	const skillXp = socketHandler('socket.on("skill_xp", function (data) {', 'socket.on("skill_level_up"', {
		character,
		valid_skill_xp_payload: () => true,
	});
	const snapshot = { warrior: { level: 1, xp: 0 }, smelting: { level: 1, xp: 8000 } };
	skillXp({ skills: snapshot, total_level: 9 });
	assert.equal(character.skills, snapshot);
	assert.equal(character.skills.smelting.xp, 8000);
	assert.equal(character.total_level, 9);
});

test("[AC-6] each Craftsman request carries one replay-safe action ID", () => {
	assert.equal(
		(functions.match(/socket\.emit\("craft", \{ items: items, craft_id: randomStr\(16\) \}\);/g) || []).length,
		2,
	);
});
