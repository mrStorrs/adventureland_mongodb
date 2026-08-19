"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { RETIRED_ARMOR_ITEM_IDS } = require("../game/equipment_schema");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { loadProtectedBaseline, main, validateProtectedBaseline } = require("../tools/weapon-progression-economy");

test("protected loot permits only the exact armor and retired Mining-table changes from its immutable baseline", () => {
	const data = loadSourceData();
	const baseline = loadProtectedBaseline();
	assert.doesNotThrow(() => validateProtectedBaseline(data, baseline));
	const tamperedBaseline = JSON.parse(JSON.stringify(baseline));
	tamperedBaseline.protected_payload.non_monster_tables.tigerarmorbox[0][0] = 2;
	assert.throws(() => validateProtectedBaseline(data, tamperedBaseline), /baseline hash is invalid/i);
	for (const itemId of RETIRED_ARMOR_ITEM_IDS) assert.equal(JSON.stringify(data.drops).includes(`"${itemId}"`), false, itemId);

	const restoredRetirement = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	restoredRetirement.drops.tigerarmorbox.push([1, "tigerarmor"]);
	assert.throws(() => validateProtectedBaseline(restoredRetirement, loadProtectedBaseline()), /retired armor loot remains/i);

	const altered = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	altered.drops.monsters.phoenix[0][0] = 0.69;
	assert.throws(() => validateProtectedBaseline(altered, loadProtectedBaseline()), /Protected loot baseline drifted/);
	const survivingWeight = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	survivingWeight.drops.tigerarmorbox[0][0] = 2;
	assert.throws(() => validateProtectedBaseline(survivingWeight, loadProtectedBaseline()), /Protected loot baseline drifted/);
	const outerRoute = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	outerRoute.drops.monsters.tiger.find((entry) => entry[1] === "open" && entry[2] === "tigerarmorbox")[0] = 0.2;
	assert.throws(() => validateProtectedBaseline(outerRoute, loadProtectedBaseline()), /Protected loot baseline drifted/);
	const miningItems = ["ironpickaxe", "goldpickaxe", "mithrilpickaxe", "adamantitepickaxe", "runitepickaxe", "miningcape", "copperore", "ironore", "goldore", "mithrilore", "adamantiteore", "runiteore"];
	for (const table of ["glitch", "lglitch"]) {
		for (const itemId of miningItems) assert.equal(data.drops[table].some((entry) => entry[1] === itemId), false, `${table}:${itemId}`);
	}
	const extraMiningGlitchRoute = { ...data, drops: JSON.parse(JSON.stringify(data.drops)) };
	extraMiningGlitchRoute.drops.glitch.push([2, "runiteore"]);
	assert.throws(() => validateProtectedBaseline(extraMiningGlitchRoute, loadProtectedBaseline()), /Protected loot baseline drifted/);
	assert.doesNotThrow(() => main(["--verify"]));
	assert.throws(() => main(["--write-protected-baseline"]), /immutable/);
});
