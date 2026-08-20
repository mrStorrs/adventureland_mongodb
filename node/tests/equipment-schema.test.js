"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const {
	ARMOR_PROGRESSION_SET_TIERS,
	ARMOR_SLOTS,
	RETIRED_ARMOR_ITEM_IDS,
	publishCumulativeSetThresholds,
	validateEquipmentSchema,
} = require("../game/equipment_schema");
const { calculateStats } = require("../game/stats");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { hash } = require("../tools/direct-equipment-authority");
const { extractFunctionBody } = require("./source-extract");

const designRoot = path.resolve(__dirname, "../../design");
const expectedPlaceholders = {
	arcstaff: ["weapon", "Arcane Staff", undefined, undefined, "staff"],
	vhelmet: ["helmet", "Vampiric Hood", "vampires", "medium", "vgloves"],
	vpants: ["pants", "Vampiric Pants", "vampires", "medium", "vattire"],
	mpalhelmet: ["helmet", "Helmet of the Hunter Paladin", "mpaladin", "heavy", "mwhelmet"],
	mpalarmor: ["chest", "Armor of the Hunter Paladin", "mpaladin", "heavy", "mwarmor"],
	mpalpants: ["pants", "Underarmor of the Hunter Paladin", "mpaladin", "heavy", "mwpants"],
	mpalgloves: ["gloves", "Gloves of the Hunter Paladin", "mpaladin", "heavy", "mwgloves"],
	mpalboots: ["shoes", "Boots of the Hunter Paladin", "mpaladin", "heavy", "mwboots"],
	mhbook: ["weapon", "Hunter's Codex", undefined, undefined, "wbook0"],
	mhcrossbow: ["weapon", "Hunter's Crossbow", undefined, undefined, "crossbow"],
	mhdagger: ["weapon", "Hunter's Dagger", undefined, undefined, "dagger"],
	mhhammer: ["weapon", "Hunter's Hammer", undefined, undefined, "hammer"],
	mhspear: ["weapon", "Hunter's Spear", undefined, undefined, "spear"],
	mhwand: ["weapon", "Hunter's Wand", undefined, undefined, "wand"],
	wbook2: ["source", "Primer of Insight", undefined, undefined, "wbook0"],
	wbook3: ["source", "Manual of Insight", undefined, undefined, "wbook0"],
	wbook4: ["source", "Tome of Insight", undefined, undefined, "wbook1"],
	wbook5: ["source", "Codex of Insight", undefined, undefined, "wbook1"],
	wbook6: ["source", "Grimoire of Insight", undefined, undefined, "wbookhs"],
	wbook7: ["source", "Lexicon of Insight", undefined, undefined, "wbookhs"],
	wbook8: ["source", "Archive of Insight", undefined, undefined, "wbookhs"],
	wbook9: ["source", "Scripture of Insight", undefined, undefined, "wbookhs"],
};

function loadItems() {
	const context = { multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(designRoot, "smithing.js"), "utf8"), context, { filename: "smithing.js" });
	vm.runInContext(fs.readFileSync(path.join(designRoot, "items.js"), "utf8"), context, { filename: "items.js" });
	return JSON.parse(JSON.stringify({ items: context.items, sets: context.sets }));
}

function thresholdKeys(set) {
	return Object.keys(set).filter((key) => /^\d+$/.test(key)).map(Number).sort((left, right) => left - right);
}

test("equipment schema publishes 20 variable-size armor themes and only retained placeholders", () => {
	const { items, sets } = loadItems();
	assert.doesNotThrow(() => validateEquipmentSchema(items, sets));
	assert.equal(Object.keys(sets).length, 20);
	assert.ok(sets.basic);
	for (const [setId, set] of Object.entries(sets)) {
		const populatedSlots = Object.keys(set.bonus_items);
		assert.ok(populatedSlots.length >= 1 && populatedSlots.every((slot) => ARMOR_SLOTS.includes(slot)), setId);
		assert.equal(new Set(set.items).size, set.items.length, setId);
		for (const [slot, members] of Object.entries(set.bonus_items)) {
			assert.ok(members.length, `${setId}.${slot}`);
			for (const itemId of members) assert.equal(items[itemId].type, slot, `${setId}.${slot}.${itemId}`);
		}
		const thresholds = thresholdKeys(set);
		assert.ok(thresholds.length, setId);
		assert.equal(thresholds.at(-1), populatedSlots.length, setId);
		assert.ok(thresholds.every((count) => count >= 1 && count <= populatedSlots.length), setId);
	}
	assert.deepEqual(
		Object.fromEntries(Object.entries(sets).filter(([, set]) => set.armor_progression).map(([setId, set]) => [setId, set.armor_progression])),
		ARMOR_PROGRESSION_SET_TIERS,
	);
	assert.deepEqual(Object.keys(expectedPlaceholders).sort(), Object.entries(items).filter(([, item]) => item.placeholder_art).map(([id]) => id).sort());
	for (const [itemId, [type, name, set, weight, source]] of Object.entries(expectedPlaceholders)) {
		const item = items[itemId];
		assert.deepEqual([item.type, item.name, item.set, item.armor_weight, item.placeholder_asset], [type, name, set, weight, source], itemId);
		assert.equal(item.placeholder_art, true, itemId);
		assert.match(item.explanation, /Placeholder artwork/, itemId);
		assert.equal(item.skin, items[source].skin, itemId);
	}
	for (const retiredId of RETIRED_ARMOR_ITEM_IDS) assert.equal(items[retiredId], undefined, retiredId);
});

test("equipment schema fails closed for malformed slots, thresholds, tiers, retirements, and placeholders", () => {
	const cases = [
		({ items }) => { items.tigerhelmet.armor_weight = "mythic"; },
		({ sets }) => { sets.tiger.bonus_items.helmet = []; },
		({ sets }) => { sets.tiger.bonus_items.helmet = ["mpxgloves"]; },
		({ sets }) => { sets.tiger.items.push("tigerhelmet"); },
		({ sets }) => { sets.tiger.items = sets.tiger.items.filter((itemId) => itemId !== "tigercape"); },
		({ sets }) => { sets.tiger.items[0] = "missing"; },
		({ items }) => { items.ecape.armor_weight = "heavy"; },
		({ items, sets }) => { items[sets.tiger.items.find((itemId) => !Object.values(sets.tiger.bonus_items).flat().includes(itemId))].set = "other"; },
		({ sets }) => { sets.tiger[2] = {}; },
		({ sets }) => { delete sets.tiger[1]; },
		({ sets }) => { sets.basic.armor_progression.shared_tier = 2; },
		({ sets }) => { sets.tiger.armor_progression = { shared_tier: 1, role: "progression", anchor: true }; },
		({ items }) => { items.vhelmet.placeholder_asset = "missing"; },
		({ items }) => { items.tigerarmor = { ...items.tigerhelmet, name: "retired" }; },
	];
	for (const mutate of cases) {
		const candidate = loadItems();
		mutate(candidate);
		assert.throws(() => validateEquipmentSchema(candidate.items, candidate.sets), { code: "invalid_equipment_schema" });
	}
	const reordered = loadItems();
	reordered.sets.basic.bonus_items = Object.fromEntries(Object.entries(reordered.sets.basic.bonus_items).reverse());
	assert.doesNotThrow(() => validateEquipmentSchema(reordered.items, reordered.sets));
});

test("retired acquisition entries disappear without changing surviving box routes or weights", () => {
	const data = loadSourceData();
	const selected = (entries, itemIds) => entries.filter((entry) => itemIds.includes(entry[1])).map(([probability, itemId]) => [probability, itemId]);
	const opened = (entries, tableId) => entries.find((entry) => entry[1] === "open" && entry[2] === tableId);
	assert.deepEqual(opened(data.drops.monsters.tiger, "tigerarmorbox"), [0.1, "open", "tigerarmorbox"]);
	assert.deepEqual(data.drops.tigerarmorbox, [[1, "tigerhelmet"]]);
	assert.deepEqual(opened(data.drops.monsters.a1, "vampirea1armorbox"), [0.1, "open", "vampirea1armorbox"]);
	assert.deepEqual(selected(data.drops.vampirea1armorbox, ["vattire", "vpants"]), [[1, "vattire"], [1, "vpants"]]);
	assert.deepEqual(opened(data.drops.monsters.a3, "vampirea3armorbox"), [0.1, "open", "vampirea3armorbox"]);
	assert.deepEqual(selected(data.drops.vampirea3armorbox, ["vgloves", "vhelmet"]), [[1, "vgloves"], [1, "vhelmet"]]);
	assert.deepEqual(opened(data.drops.monsters.franky, "mpxarmorbox"), [1 / 2000, "open", "mpxarmorbox"]);
	assert.deepEqual(data.drops.mpxarmorbox, [[1, "mpxgloves"]]);
	assert.deepEqual(selected(data.drops.armorbox, ["fury", "fallen"]), [[0.001, "fury"], [0.001, "fallen"]]);
	assert.deepEqual(selected(data.drops.basketofeggs, ["eears", "epyjamas", "eslippers"]), [[1, "eears"], [1 / 3, "epyjamas"], [1, "eslippers"]]);
	assert.deepEqual(selected(data.drops.mysterybox, ["warpvest"]), [[1 / 3, "warpvest"]]);
	for (const retiredId of RETIRED_ARMOR_ITEM_IDS) {
		assert.equal(data.craft[retiredId], undefined, retiredId);
		assert.equal(JSON.stringify(data.drops).includes(`"${retiredId}"`), false, retiredId);
	}
	assert.equal(Object.keys(data.craft).length, 123);
	assert.equal(hash(data.craft), "6ebaeacc1afa9a8d9024056ddb29a70c73ce02b351cac7f7c93db6ebf9b29253");
});

test("all server data-processing callers bind and publish dynamic cumulative thresholds", () => {
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	const serverFunctions = fs.readFileSync(path.resolve(__dirname, "../server_functions.js"), "utf8");
	const precompute = fs.readFileSync(path.resolve(__dirname, "../precompute_bfs.js"), "utf8");
	const publicationPaths = [
		["init_game", "async function init_game()"],
		["reload_server", "async function reload_server(to_broadcast, change)"],
	];
	for (const [pathName, declaration] of publicationPaths) {
		const body = extractFunctionBody(server, declaration);
		const validationStatements = [...body.matchAll(/validateEquipmentSchema\(items, sets\);/g)].map((match) => match[0]);
		assert.equal(validationStatements.length, 1, pathName);
		assert.ok(body.indexOf(validationStatements[0]) < body.indexOf("const progression_data = buildProgressionData({"), pathName);
		assert.ok(body.indexOf("const progression_data = buildProgressionData({") < body.indexOf("G = loadProgressionPublication("), pathName);
	}
	assert.match(serverFunctions, /require\("\.\/game\/equipment_schema"\)\.publishCumulativeSetThresholds/);
	assert.match(serverFunctions, /G\.sets = publish_cumulative_set_thresholds\(G\.sets\);/);
	assert.match(precompute, /server_functions\.js/);
	assert.match(precompute, /sprocess_game_data\(\);/);
	const directEvalContext = {
		console: { log() {}, error() {} },
		require: createRequire(path.resolve(__dirname, "../server_functions.js")),
	};
	vm.runInNewContext(`${serverFunctions}\nthis.publication_contract = { processor: typeof sprocess_game_data, helper: typeof publish_cumulative_set_thresholds };`, directEvalContext, { filename: "server_functions.js" });
	assert.deepEqual({ ...directEvalContext.publication_contract }, { processor: "function", helper: "function" });
	assert.doesNotMatch(serverFunctions, /for \(var i = 2; i <= 5; i\+\+\)/);
	const raw = {
		example: {
			name: "Example", weight: "medium", items: ["helmet", "chest", "pants", "gloves", "shoes"],
			bonus_items: { helmet: ["helmet"], chest: ["chest"], pants: ["pants"], gloves: ["gloves"], shoes: ["shoes"] },
			1: { armor: 1 }, 3: { armor: 3, speed: 1 }, 5: { armor: 5 },
		},
	};
	const published = publishCumulativeSetThresholds(raw);
	assert.deepEqual(raw.example[3], { armor: 3, speed: 1 });
	assert.deepEqual(published.example[1], { armor: 1 });
	assert.deepEqual(published.example[3], { armor: 4, speed: 1 });
	assert.deepEqual(published.example[5], { armor: 9, speed: 1 });
	assert.equal(published.example[2], undefined);
	assert.equal(published.example[4], undefined);
});

test("set counts use only matching populated armor slots at exact published thresholds", () => {
	const items = {
		helmet: { type: "helmet", set: "example" }, chest: { type: "chest", set: "example" }, pants: { type: "pants", set: "example" },
		gloves: { type: "gloves", set: "example" }, shoes: { type: "shoes", set: "example" }, cape: { type: "cape", set: "example" },
		weapon: { type: "weapon", set: "example", wtype: "short_sword", damage: 1 }, alt: { type: "chest", set: "example" },
	};
	const sets = publishCumulativeSetThresholds({
		example: {
			bonus_items: { helmet: ["helmet"], chest: ["chest", "alt"], pants: ["pants"], gloves: ["gloves"], shoes: ["shoes"] },
			1: { armor: 1 }, 3: { armor: 3 }, 5: { armor: 5 },
		},
	});
	const expectedArmor = [0, 1, 0, 4, 0, 9];
	for (let count = 0; count <= 5; count += 1) {
		const slots = Object.fromEntries(ARMOR_SLOTS.slice(0, count).map((slot) => [slot, { name: slot }]));
		slots.cape = { name: "cape" };
		slots.mainhand = { name: "weapon" };
		const stats = calculateStats({ slots, items, sets });
		assert.deepEqual(stats.sets, count ? { example: count } : {});
		assert.equal(stats.armor, expectedArmor[count]);
	}
	assert.deepEqual(calculateStats({ slots: { chest: { name: "alt" }, cape: { name: "cape" } }, items, sets }).sets, { example: 1 });
	assert.equal(calculateStats({ slots: { chest: { name: "alt" } }, items, sets }).armor, 1);
});
