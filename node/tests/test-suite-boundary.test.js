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

test("the deterministic compact combat matrix stays outside Prettier discovery", () => {
	const ignorePath = path.join(__dirname, "../.prettierignore");
	const ignoredPaths = fs.readFileSync(ignorePath, "utf8").split(/\r?\n/).filter(Boolean);
	assert.ok(ignoredPaths.includes("tests/fixtures/equipment-combat-matrix.json"));
});
