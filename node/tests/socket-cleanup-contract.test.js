"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("terminal character-auth failures close the unauthenticated socket", () => {
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	assert.match(
		server,
		/socket\.emit\("game_error", "Failed: " \+ R\.reason\);\s*socket\.disconnect\(\);\s*return;/,
	);
	assert.match(
		server,
		/socket\.emit\("game_error", error\.code \|\| "invalid_character_skill_state"\);\s*socket\.disconnect\(\);\s*return;/,
	);
});

test("player sync preserves the persisted skill-curve marker", () => {
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	assert.match(
		server,
		/loadCharacterState\(\{\s*info: \{\s*skills: data\.info && data\.info\.skills,\s*skill_curve_version: data\.info && data\.info\.skill_curve_version,\s*\},\s*\}\)/,
	);
	assert.match(server, /entity\.info\.skill_curve_version = syncedSkillState\.skill_curve_version;/);
});
