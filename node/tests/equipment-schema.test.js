"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { validateEquipmentSchema } = require("../game/equipment_schema");
const { calculateStats } = require("../game/stats");
const { extractFunctionBody, extractSourceBlock } = require("./source-extract");

const designRoot = path.resolve(__dirname, "../../design");
const acquisitionFixturePath = path.join(__dirname, "fixtures/equipment-acquisition-ranking.json");
const slots = ["helmet", "chest", "pants", "gloves", "shoes"];
const expectedPlaceholders = {
	arcstaff: ["weapon", "Arcane Staff", undefined, undefined, "staff"],
	tigerarmor: ["chest", "Armor of the Tiger", "tiger", "heavy", "tigerhelmet"],
	tigerpants: ["pants", "Pants of the Tiger", "tiger", "heavy", "tigerhelmet"],
	tigergloves: ["gloves", "Gloves of the Tiger", "tiger", "heavy", "tigerhelmet"],
	tigerboots: ["shoes", "Boots of the Tiger", "tiger", "heavy", "tigerhelmet"],
	vhelmet: ["helmet", "Vampiric Hood", "vampires", "medium", "vgloves"],
	vpants: ["pants", "Vampiric Pants", "vampires", "medium", "vattire"],
	mpxhelmet: ["helmet", "Mana Hood", "mpx", "light", "mpxgloves"],
	mpxarmor: ["chest", "Mana Robe", "mpx", "light", "mpxgloves"],
	mpxpants: ["pants", "Mana Pants", "mpx", "light", "mpxgloves"],
	mpxboots: ["shoes", "Mana Boots", "mpx", "light", "mpxgloves"],
	furyarmor: ["chest", "Armor of Fury", "fury", "heavy", "fury"],
	furygloves: ["gloves", "Gloves of Fury", "fury", "heavy", "fury"],
	furyboots: ["shoes", "Boots of Fury", "fury", "heavy", "fury"],
	legendhelmet: ["helmet", "Legendary Visor", "legends", "heavy", "warpvest"],
	legendboots: ["shoes", "Legendary Boots", "legends", "heavy", "warpvest"],
	swifthelmet: ["helmet", "Helm of Swift Judgement", "swift", "medium", "wingedboots"],
	swiftarmor: ["chest", "Armor of Swift Judgement", "swift", "medium", "wingedboots"],
	swiftpants: ["pants", "Pants of Swift Judgement", "swift", "medium", "wingedboots"],
	epants: ["pants", "Fluffy Pants", "bunny", "light", "epyjamas"],
	egloves: ["gloves", "Fluffy Gloves", "bunny", "light", "epyjamas"],
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
	vm.runInContext(fs.readFileSync(path.join(designRoot, "items.js"), "utf8"), context, { filename: "items.js" });
	return JSON.parse(JSON.stringify({ items: context.items, sets: context.sets }));
}

function loadDrops() {
	const { items } = loadItems();
	const context = { items, console: { log() {} } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(designRoot, "drops.js"), "utf8"), context, { filename: "drops.js" });
	return JSON.parse(JSON.stringify(context.drops));
}

function loadAcquisitionFixture() {
	return JSON.parse(fs.readFileSync(acquisitionFixturePath, "utf8"));
}

test("equipment schema publishes 19 complete armor themes and the exact placeholder inventory", () => {
	const { items, sets } = loadItems();
	const fixture = loadAcquisitionFixture();
	assert.doesNotThrow(() => validateEquipmentSchema(items, sets));
	assert.equal(Object.keys(sets).length, 19);
	assert.ok(sets.mpaladin);
	for (const [setId, set] of Object.entries(sets)) {
		assert.deepEqual(Object.keys(set.bonus_items), slots, setId);
		assert.deepEqual(Object.keys(set).filter((key) => /^\d+$/.test(key)).sort(), ["2", "3", "4", "5"], setId);
		assert.equal(new Set(set.items).size, set.items.length, setId);
		for (const slot of slots) assert.ok(set.bonus_items[slot].length, `${setId}.${slot}`);
		assert.deepEqual(
			set.bonus_items,
			Object.fromEntries(Object.entries(fixture.ladders.armor_set_details[setId].slots).map(([slot, rows]) => [slot, [...new Set(rows.map((row) => row.item_id))]])),
			setId,
		);
	}
	assert.equal(sets.fury.items.filter((itemId) => itemId === "suckerpunch").length, 1);
	assert.deepEqual(sets.legends.bonus_items.gloves, ["powerglove", "goldenpowerglove"]);
	assert.deepEqual(sets.vampires.bonus_items.chest, ["mcape", "vattire"]);
	assert.deepEqual(sets.holidays.bonus_items.gloves, ["mittens", "supermittens"]);
	assert.deepEqual(sets.mpaladin.bonus_items, {
		helmet: ["mpalhelmet"], chest: ["mpalarmor"], pants: ["mpalpants"], gloves: ["mpalgloves"], shoes: ["mpalboots"],
	});
	assert.deepEqual(Object.keys(expectedPlaceholders).sort(), Object.entries(items).filter(([, item]) => item.placeholder_art).map(([id]) => id).sort());
	for (const [itemId, [type, name, set, weight, source]] of Object.entries(expectedPlaceholders)) {
		const item = items[itemId];
		assert.deepEqual([item.type, item.name, item.set, item.armor_weight, item.placeholder_asset], [type, name, set, weight, source], itemId);
		assert.equal(item.placeholder_art, true, itemId);
		assert.match(item.explanation, /Placeholder artwork/, itemId);
		assert.equal(item.skin, items[source].skin, itemId);
	}
});

test("equipment schema fails closed for malformed weights, slots, thresholds, and placeholder metadata", () => {
	const cases = [
		({ items }) => { items.tigerhelmet.armor_weight = "mythic"; },
		({ sets }) => { sets.tiger.bonus_items.helmet = []; },
		({ sets }) => { sets.tiger.bonus_items.helmet = ["tigerarmor"]; },
		({ sets }) => { sets.tiger.items.push("tigerhelmet"); },
		({ sets }) => { sets.tiger.items = sets.tiger.items.filter((itemId) => itemId !== "tigercape"); },
		({ sets }) => { sets.tiger.items[0] = "missing"; },
		({ items }) => { items.ecape.armor_weight = "heavy"; },
		({ items, sets }) => { items[sets.tiger.items.find((itemId) => !Object.values(sets.tiger.bonus_items).flat().includes(itemId))].set = "other"; },
		({ sets }) => { sets.tiger[6] = {}; },
		({ items }) => { items.tigerarmor.placeholder_asset = "missing"; },
	];
	for (const mutate of cases) {
		const candidate = loadItems();
		mutate(candidate);
		assert.throws(() => validateEquipmentSchema(candidate.items, candidate.sets), { code: "invalid_equipment_schema" });
	}
	const reordered = loadItems();
	reordered.sets.tiger.bonus_items = Object.fromEntries(Object.entries(reordered.sets.tiger.bonus_items).reverse());
	assert.doesNotThrow(() => validateEquipmentSchema(reordered.items, reordered.sets));
});

test("incomplete armor themes publish their reviewed source-table allocations", () => {
	const drops = loadDrops();
	const selected = (entries, itemIds) => entries.filter((entry) => itemIds.includes(entry[1])).map(([probability, itemId]) => [probability, itemId]);
	const opened = (entries, tableId) => entries.find((entry) => entry[1] === "open" && entry[2] === tableId);
	assert.deepEqual(opened(drops.monsters.tiger, "tigerarmorbox"), [0.1, "open", "tigerarmorbox"]);
	assert.deepEqual(selected(drops.tigerarmorbox, ["tigerhelmet", "tigerarmor", "tigerpants", "tigergloves", "tigerboots"]), [[1, "tigerhelmet"], [1, "tigerarmor"], [1, "tigerpants"], [1, "tigergloves"], [1, "tigerboots"]]);
	assert.deepEqual(opened(drops.monsters.a1, "vampirea1armorbox"), [0.1, "open", "vampirea1armorbox"]);
	assert.deepEqual(selected(drops.vampirea1armorbox, ["vattire", "vpants"]), [[1, "vattire"], [1, "vpants"]]);
	assert.deepEqual(opened(drops.monsters.a3, "vampirea3armorbox"), [0.1, "open", "vampirea3armorbox"]);
	assert.deepEqual(selected(drops.vampirea3armorbox, ["vgloves", "vhelmet"]), [[1, "vgloves"], [1, "vhelmet"]]);
	assert.deepEqual(opened(drops.monsters.franky, "mpxarmorbox"), [1 / 2000, "open", "mpxarmorbox"]);
	assert.deepEqual(selected(drops.mpxarmorbox, ["mpxgloves", "mpxhelmet", "mpxarmor", "mpxpants", "mpxboots"]), [[1, "mpxgloves"], [1, "mpxhelmet"], [1, "mpxarmor"], [1, "mpxpants"], [1, "mpxboots"]]);
	assert.deepEqual(selected(drops.armorbox, ["fury", "furyarmor", "fallen", "furygloves", "furyboots"]), [[0.001, "fury"], [0.001, "furyarmor"], [0.001, "fallen"], [0.001, "furygloves"], [0.001, "furyboots"]]);
	assert.deepEqual(selected(drops.basketofeggs, ["epyjamas", "epants", "egloves"]), [[1 / 3, "epyjamas"], [1 / 3, "epants"], [1 / 3, "egloves"]]);
	assert.deepEqual(selected(drops.mysterybox, ["warpvest", "legendhelmet", "legendboots"]), [[1 / 3, "warpvest"], [1 / 3, "legendhelmet"], [1 / 3, "legendboots"]]);
});

test("both server publication paths reject malformed sets before continuing data publication", () => {
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	const serverFunctions = fs.readFileSync(path.resolve(__dirname, "../server_functions.js"), "utf8");
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
		const candidate = loadItems();
		candidate.sets.tiger.items = candidate.sets.tiger.items.filter((itemId) => itemId !== "tigercape");
		const context = { items: candidate.items, sets: candidate.sets, validateEquipmentSchema, publicationContinued: false };
		vm.createContext(context);
		assert.throws(() => vm.runInContext(`${validationStatements[0]}\npublicationContinued = true;`, context), { code: "invalid_equipment_schema", set: "tiger", item: "tigercape" });
		assert.equal(context.publicationContinued, false, pathName);
	}
	assert.match(serverFunctions, /for \(var i = 2; i <= 5; i\+\+\)/);
});

test("set counts use only the matching armor slot membership", () => {
	const items = {
		helmet: { type: "helmet", set: "example" }, chest: { type: "chest", set: "example" }, pants: { type: "pants", set: "example" }, gloves: { type: "gloves", set: "example" }, shoes: { type: "shoes", set: "example" },
		cape: { type: "cape", set: "example" }, weapon: { type: "weapon", set: "example", wtype: "short_sword", attack: 1 },
	};
	const serverFunctions = fs.readFileSync(path.resolve(__dirname, "../server_functions.js"), "utf8");
	const cumulativeLoop = extractSourceBlock(serverFunctions, "for (var sname in G.sets) {");
	const context = {
		G: { sets: { example: { bonus_items: { helmet: ["helmet"], chest: ["chest"], pants: ["pants"], gloves: ["gloves"], shoes: ["shoes"] }, 2: { armor: 2 }, 3: { armor: 3 }, 4: { armor: 4 }, 5: { armor: 5 }, 6: { armor: 99 } } } },
	};
	vm.createContext(context);
	vm.runInContext(cumulativeLoop, context);
	const sets = context.G.sets;
	assert.deepEqual(sets.example[2], { armor: 2 });
	assert.deepEqual(sets.example[3], { armor: 5 });
	assert.deepEqual(sets.example[4], { armor: 9 });
	assert.deepEqual(sets.example[5], { armor: 14 });
	assert.deepEqual(sets.example[6], { armor: 99 });
	const cumulativeArmor = [0, 0, 2, 5, 9, 14];
	for (let count = 0; count <= 5; count += 1) {
		const selected = Object.fromEntries(slots.slice(0, count).map((slot) => [slot, { name: slot }]));
		selected.cape = { name: "cape" };
		selected.mainhand = { name: "weapon" };
		const stats = calculateStats({ slots: selected, items, sets });
		assert.deepEqual(stats.sets, count ? { example: count } : {});
		assert.equal(stats.armor, cumulativeArmor[count]);
	}
	const alternateItems = structuredClone(items);
	alternateItems.alt = { type: "chest", set: "example" };
	sets.example.bonus_items.chest.push("alt");
	assert.deepEqual(calculateStats({ slots: { chest: { name: "alt" }, cape: { name: "cape" } }, items: alternateItems, sets }).sets, { example: 1 });
});
