"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { loadSourceData } = require("../tools/acquisition-ranking");
const { loadProtectedBaseline, main, validateProtectedBaseline } = require("../tools/weapon-progression-economy");

test("protected loot tables stay byte-equivalent to their pre-progression baseline", () => {
	const data = loadSourceData();
	assert.doesNotThrow(() => validateProtectedBaseline(data, loadProtectedBaseline()));
	const altered = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	altered.drops.monsters.phoenix[0][0] = 0.69;
	assert.throws(() => validateProtectedBaseline(altered, loadProtectedBaseline()), /Protected loot baseline drifted/);
	assert.doesNotThrow(() => main(["--verify"]));
	assert.throws(() => main(["--write-protected-baseline"]), /immutable/);
});
