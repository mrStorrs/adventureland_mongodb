"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("the obsolete progression-time benchmark stays outside the default test suite", () => {
	const activePath = path.join(__dirname, "progression-benchmark.test.js");
	const obsoleteDirectory = path.join(__dirname, "obsolete");
	const obsoletePath = path.join(obsoleteDirectory, "progression-benchmark.obsolete.js");
	const noticePath = path.join(obsoleteDirectory, "README.md");
	const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));

	assert.equal(fs.existsSync(activePath), false, "the legacy benchmark must not be test-discoverable");
	assert.equal(fs.existsSync(obsoletePath), true, "the historical benchmark must remain visibly archived");
	assert.equal(fs.existsSync(noticePath), true, "the archive must explain why the benchmark is obsolete");
	assert.equal(packageJson.scripts.test, "node --test tests/*.test.js");
	assert.equal(fs.readdirSync(__dirname).filter((name) => name.endsWith(".test.js")).includes("progression-benchmark.test.js"), false);

	const notice = fs.readFileSync(noticePath, "utf8");
	assert.match(notice, /obsolete/i);
	assert.match(notice, /not an equipment-balance or release authority/i);
});

test("deterministic compact equipment fixtures stay outside Prettier and GitHub review noise", () => {
	const ignorePath = path.join(__dirname, "../.prettierignore");
	const ignoredPaths = fs.readFileSync(ignorePath, "utf8").split(/\r?\n/).filter(Boolean);
	const attributes = fs.readFileSync(path.join(__dirname, "../../.gitattributes"), "utf8").split(/\r?\n/).filter(Boolean);
	const fixtures = [
		"armor-set-balance.json",
		"equipment-balance-contract.json",
		"equipment-combat-matrix.json",
		"hunter-weapon-economy.json",
		"vanilla-equipment-baseline.json",
		"weapon-acquisition-ranking.json",
		"weapon-loadout-balance.json",
		"monster-combat-tiers.json",
		"protected-monster-loot-baseline.json",
		"weapon-progression-parity.json",
		"weapon-progression-economy.json",
		"combat-xp-pacing.json",
	];
	for (const fixture of fixtures) {
		assert.ok(ignoredPaths.includes(`tests/fixtures/${fixture}`), `${fixture} Prettier ignore`);
		assert.ok(attributes.includes(`node/tests/fixtures/${fixture} linguist-generated=true`), `${fixture} generated attribute`);
	}
	const obsoleteFixture = "equipment-acquisition-ranking.json";
	assert.equal(fs.existsSync(path.join(__dirname, "fixtures", obsoleteFixture)), false, `${obsoleteFixture} removed`);
	assert.equal(ignoredPaths.includes(`tests/fixtures/${obsoleteFixture}`), false, `${obsoleteFixture} Prettier entry removed`);
	assert.equal(attributes.includes(`node/tests/fixtures/${obsoleteFixture} linguist-generated=true`), false, `${obsoleteFixture} generated attribute removed`);
});
