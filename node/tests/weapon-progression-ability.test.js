"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { validateAbilityCatalog } = require("../game/skill_domain");
const { skills } = require("../../design/skills");
const { abilities } = require("../../design/abilities");

test("Mental Burst uses the direct Max MP gate and rejects non-direct requirements", () => {
	assert.deepEqual(abilities.mentalburst.requirements, { max_mp: 1060 });
	assert.doesNotThrow(() => validateAbilityCatalog(abilities, skills));
	const invalid = JSON.parse(JSON.stringify(abilities));
	invalid.mentalburst.requirements = { intelligence: 64 };
	assert.throws(() => validateAbilityCatalog(invalid, skills), /direct requirement/i);
});
