"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const {
	buildProgressionData,
	buildWeaponOwners,
	normalizeItems,
	loadProgressionPublication,
	validateCharacterDefinition,
	validateItemRequirements,
	validateProgressionData,
	validateRequirements,
} = require("../game/skill_domain");
const { RANKING_FIXTURE_PATH, loadRankingFixture } = require("../tools/weapon-acquisition-ranking");
const { extractFunctionBody } = require("./source-extract");

const designRoot = path.resolve(__dirname, "../../design");
const EQUIPMENT_ACQUISITION_FIXTURE_PATH = path.join(__dirname, "fixtures/equipment-acquisition-ranking.json");
const EQUIPMENT_BALANCE_CONTRACT_PATH = path.join(__dirname, "fixtures/equipment-balance-contract.json");
const ARMOR_SET_BALANCE_FIXTURE_PATH = path.join(__dirname, "fixtures/armor-set-balance.json");

function loadDesign(files) {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	for (const file of files)
		vm.runInContext(fs.readFileSync(path.join(designRoot, file), "utf8"), context, { filename: file });
	return context;
}

function plain(value) {
	return JSON.parse(JSON.stringify(value));
}

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function canonicalHash(value) {
	return crypto.createHash("sha256").update(JSON.stringify(canonical(plain(value)))).digest("hex");
}

function extractBuilderStatement(source, declaration, fromIndex = 0) {
	const start = source.indexOf(declaration, fromIndex);
	assert.notEqual(start, -1, declaration);
	const end = source.indexOf(");", start) + 2;
	assert.ok(end > start, declaration);
	return source.slice(start, end);
}

function loadRaw() {
	return loadDesign([
		"conditions.js",
		"item_requirements.js",
		"items.js",
		"skills.js",
		"skill_xp.js",
		"abilities.js",
		"character.js",
	]);
}

function loadPinnedItemsAndRequirements(commit) {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	for (const file of ["item_requirements.js", "items.js"]) {
		const source = childProcess.execFileSync("git", ["show", `${commit}:design/${file}`], { cwd: path.resolve(designRoot, ".."), encoding: "utf8" });
		vm.runInContext(source, context, { filename: `pinned-${file}` });
	}
	return context;
}

function loadEquipmentAcquisitionFixture() {
	return JSON.parse(fs.readFileSync(EQUIPMENT_ACQUISITION_FIXTURE_PATH, "utf8"));
}

function loadEquipmentBalanceContract() {
	return JSON.parse(fs.readFileSync(EQUIPMENT_BALANCE_CONTRACT_PATH, "utf8"));
}

function loadArmorSetBalanceFixture() {
	return JSON.parse(fs.readFileSync(ARMOR_SET_BALANCE_FIXTURE_PATH, "utf8"));
}

function loadAll() {
	return buildProgressionData(loadRaw());
}

const equippableTypes = new Set([
	"helmet",
	"pants",
	"chest",
	"weapon",
	"amulet",
	"earring",
	"shoes",
	"gloves",
	"ring",
	"shield",
	"belt",
	"source",
	"orb",
	"quiver",
	"cape",
	"misc_offhand",
	"tool",
]);

test("real design catalogs load with the canonical registry and curve", () => {
	const data = loadAll();
	assert.doesNotThrow(() => validateProgressionData(data));
	assert.deepEqual(Object.keys(data.skills), ["warrior", "paladin", "mage", "priest", "ranger", "rogue", "merchant"]);
	assert.deepEqual(
		Object.values(data.skills).map((skill) => skill.name),
		["Warrior", "Paladin", "Mage", "Priest", "Ranger", "Rogue", "Merchant"],
	);
	assert.deepEqual(
		Object.values(data.skills).map((skill) => [skill.kind, skill.max_level]),
		[
			["combat", 99],
			["combat", 99],
			["combat", 99],
			["combat", 99],
			["combat", 99],
			["combat", 99],
			["noncombat", 99],
		],
	);
	assert.equal(Object.keys(data.abilities).length, 105);
	assert.equal(Object.keys(data.items).length, 562);
	assert.equal(Object.keys(data.item_requirements).length, 320);
	for (const skill of ["warrior", "paladin", "mage", "priest", "ranger", "rogue", "merchant"])
		assert.equal(data.items.tigerhelmet[skill], undefined, `normalized item retained ${skill} modifier`);
	assert.equal(data.character.appearances.length, 28);
	assert.deepEqual(plain(data.character.starter.weapons), ["blade", "mace", "staff", "wbook0", "bow", "claw"]);
	for (let level = 1; level <= 99; level += 1) {
		assert.equal(
			data.skill_xp[level],
			Math.round(900000000 * Math.pow((level - 1) / 98, 2)),
			`skill XP level ${level}`,
		);
	}
	assert.equal(data.skill_xp[1], 0);
	assert.equal(data.skill_xp[99], 900000000);
	assert.equal(data.skill_xp[20], 33829654);
	assert.equal(data.skill_xp[40], 142534361);
	assert.equal(data.skill_xp[60], 326207830);
	assert.equal(data.skill_xp[80], 584850062);
	assert.equal(data.skill_xp[90], 742284465);
});

test("the registry owns every combat weapon exactly once and keeps tools noncombat", () => {
	const data = loadAll();
	const expectedOwners = {
		short_sword: "warrior",
		sword: "warrior",
		great_sword: "warrior",
		axe: "warrior",
		spear: "warrior",
		scythe: "warrior",
		hammer: "paladin",
		mace: "paladin",
		pmace: "paladin",
		basher: "paladin",
		staff: "mage",
		great_staff: "mage",
		wand: "mage",
		wblade: "mage",
		book: "priest",
		bow: "ranger",
		crossbow: "ranger",
		dartgun: "ranger",
		fist: "rogue",
		dagger: "rogue",
		stars: "rogue",
		rapier: "rogue",
	};
	const seen = new Map();
	for (const [skill, definition] of Object.entries(data.skills)) {
		for (const weaponType of definition.weapon_types || []) {
			assert.equal(seen.has(weaponType), false, weaponType);
			seen.set(weaponType, skill);
		}
	}
	assert.deepEqual(Object.fromEntries(seen), expectedOwners);
	for (const id of ["rod", "pickaxe"])
		assert.deepEqual(plain(data.item_requirements[id]), [{ skill: "merchant", level: 16 }]);
	for (const id of ["pmace", "lmace", "pmaceofthedead"]) assert.equal(data.items[id].wtype, "pmace");
	assert.equal(data.items.pmace.name, "Paladin's Hammer");
	assert.equal(data.items.pmace.skin, "hammer");
	assert.equal(data.items.pmace.damage_type, "physical");
	assert.equal(data.items.pmace.speed, -2);
});

test("item normalization is independent, non-mutating, and precedence-safe", () => {
	const data = loadAll();
	const rawItems = {
		wbook0: { type: "source", name: "Book", compound: {} },
		wbook1: { type: "source", name: "Book 1", compound: {} },
		wbookhs: { type: "source", name: "Holiday Book", dex: 16, compound: { dex: 0 } },
		pmace: {
			type: "weapon",
			wtype: "pmace",
			name: "Paladin's Hammer",
			skin: "hammer",
			damage_type: "physical",
			speed: -2,
			class: ["priest"],
		},
		blade: { type: "weapon", wtype: "short_sword", class: ["warrior"] },
		fury: { type: "chest", tier: 3.5, upgrade: { str: 1 }, class: ["warrior"] },
		stealthcape: { type: "cape" },
		rod: { type: "tool", wtype: "rod" },
	};
	const requirements = {
		wbook0: [{ skill: "priest", level: 1 }],
		wbook1: [{ skill: "priest", level: 10 }],
		wbookhs: [{ skill: "priest", level: 40 }],
		pmace: [{ skill: "paladin", level: 40 }],
		blade: [{ skill: "warrior", level: 1 }],
		fury: [
			{ skill: "warrior", level: 20 },
			{ skill: "paladin", level: 20 },
			{ skill: "ranger", level: 20 },
			{ skill: "rogue", level: 20 },
		],
		stealthcape: [{ skill: "rogue", level: 1 }],
		rod: [{ skill: "merchant", level: 16 }],
	};
	for (const bookId of ["wbook2", "wbook3", "wbook4", "wbook5", "wbook6", "wbook7", "wbook8", "wbook9"]) {
		rawItems[bookId] = { type: "source", name: bookId, compound: {} };
		requirements[bookId] = [{ skill: "priest", level: 10 }];
	}
	const before = plain(rawItems);
	const normalized = normalizeItems(rawItems, requirements);
	assert.notStrictEqual(normalized, rawItems);
	assert.deepEqual(rawItems, before);
	assert.equal(normalized.wbook0.type, "weapon");
	assert.equal(normalized.wbook0.wtype, "book");
	assert.equal(normalized.wbookhs.int, 16);
	assert.equal(normalized.wbookhs.dex, undefined);
	assert.equal(normalized.wbookhs.compound.int, 0);
	assert.equal(normalized.wbookhs.compound.dex, undefined);
	assert.equal(normalized.blade.class, undefined);
	assert.deepEqual(plain(normalized.fury.requirements), requirements.fury);
	assert.doesNotThrow(() =>
		validateItemRequirements(normalized, requirements, data.skills, buildWeaponOwners(data.skills)),
	);
	assert.deepEqual(plain(normalized.stealthcape.requirements), requirements.stealthcape);
});

test("raw non-weapon sources and reviewed acquisition assignments independently produce final requirements", () => {
	const raw = loadRaw();
	const data = loadAll();
	const rankedRequirements = new Map(loadRankingFixture(RANKING_FIXTURE_PATH).weapons.map((weapon) => [weapon.weapon_id, [{ skill: weapon.skill, level: weapon.assigned_requirement }]]));
	const cases = {
		helmetsource: ["helmet", 1, [{ any_skill: ["ranger", "rogue"], level: 13 }]],
		tierboundary20: ["xmashat", 1.5, [{ any_skill: ["ranger", "rogue"], level: 8 }]],
		tierboundary40: ["mageshood", 2, [{ any_skill: ["mage", "priest"], level: 40 }]],
		tierboundary50: ["mrnhat", 2.25, [{ any_skill: ["ranger", "rogue"], level: 71 }]],
		tierboundary60: ["sweaterhs", 2.5, [{ any_skill: ["ranger", "rogue"], level: 8 }]],
		tierboundary70: ["mcboots", 2.75, [{ skill: "merchant", level: 71 }]],
		tierboundary80: ["hhelmet", 3, [{ any_skill: ["warrior", "paladin"], level: 34 }]],
		tierboundary90: ["handofmidas", 3.5, [{ any_skill: ["mage", "priest"], level: 31 }]],
		tierboundary95: ["xhelmet", 4, [{ any_skill: ["warrior", "paladin"], level: 58 }]],
		weaponowner: ["weaver", 1.75, rankedRequirements.get("weaver")],
		offhandowner: ["shield", 2, [{ any_skill: ["warrior", "paladin", "priest"], level: 26 }]],
		toolowner: ["rod", 1, [{ skill: "merchant", level: 16 }]],
		hybrid: ["fury", 1.5, [{ any_skill: ["warrior", "paladin"], level: 91 }]],
		curatedhybrid: ["starkillers", 3, [{ any_skill: ["warrior", "paladin"], level: 58 }]],
	};
	for (const [, [itemId, tier, expected]] of Object.entries(cases)) {
		assert.equal(raw.items[itemId].tier, tier, itemId);
		assert.deepEqual(plain(data.item_requirements[itemId]), expected, itemId);
		assert.deepEqual(plain(data.items[itemId].requirements), expected, itemId);
	}
	for (const [weaponId, expected] of rankedRequirements) {
		assert.deepEqual(plain(data.item_requirements[weaponId]), expected, weaponId);
		assert.deepEqual(plain(data.items[weaponId].requirements), expected, weaponId);
	}
	assert.equal(raw.items.mageshood.class[0], "mage");
	assert.equal(raw.items.fury.class.length, 4);
	assert.equal(raw.items.handofmidas.gold, 10);
});

test("progression validators reject every special-contract regression with diagnostics", () => {
	const data = loadAll();
	const ownerMap = buildWeaponOwners(data.skills);
	const badToolItems = plain(data.items);
	const badToolRequirements = plain(data.item_requirements);
	badToolItems.rod.requirements = [{ skill: "warrior", level: 1 }];
	badToolRequirements.rod = [{ skill: "warrior", level: 1 }];
	assert.throws(
		() => validateItemRequirements(badToolItems, badToolRequirements, data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "rod" && /Merchant level 16/.test(error.message),
	);
	const badWeaponItems = plain(data.items);
	const badWeaponRequirements = plain(data.item_requirements);
	badWeaponItems.blade.requirements.push({ skill: "paladin", level: 1 });
	badWeaponRequirements.blade.push({ skill: "paladin", level: 1 });
	assert.throws(
		() => validateItemRequirements(badWeaponItems, badWeaponRequirements, data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "blade" && /exactly/.test(error.message),
	);
	const badBookItems = plain(data.items);
	badBookItems.wbook0.type = "source";
	assert.throws(
		() => validateItemRequirements(badBookItems, plain(data.item_requirements), data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "wbook0" && /main-hand/.test(error.message),
	);
	const badPmaceItems = plain(data.items);
	badPmaceItems.pmace.name = "Priest's Mace";
	assert.throws(
		() => validateItemRequirements(badPmaceItems, plain(data.item_requirements), data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "pmace" && /pmace/.test(error.message),
	);
	const badPmaceTypeItems = plain(data.items);
	badPmaceTypeItems.pmace.type = "source";
	assert.throws(
		() => validateItemRequirements(badPmaceTypeItems, plain(data.item_requirements), data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "pmace",
	);
	const badCharacter = plain(data.character);
	badCharacter.baseline.max_hp = Infinity;
	assert.throws(
		() => validateCharacterDefinition(badCharacter, data.items),
		(error) => error.code === "invalid_game_data" && /baseline/.test(error.message),
	);
	const wrongBaseline = plain(data.character);
	wrongBaseline.baseline.max_hp = 101;
	assert.throws(
		() => validateCharacterDefinition(wrongBaseline, data.items),
		(error) => error.code === "invalid_game_data" && /baseline/.test(error.message),
	);
	const wrongAppearanceHash = plain(data.character);
	wrongAppearanceHash.appearances[0][0] = "different_skin";
	assert.throws(
		() => validateCharacterDefinition(wrongAppearanceHash, data.items),
		(error) => error.code === "invalid_game_data" && /appearances/.test(error.message),
	);
	const populatedSlots = plain(data.character);
	populatedSlots.starter.slots = { mainhand: { name: "blade" } };
	assert.throws(
		() => validateCharacterDefinition(populatedSlots, data.items),
		(error) => error.code === "invalid_game_data" && /starter/.test(error.message),
	);
	const missingStarter = plain(data.items);
	delete missingStarter.hpot0;
	assert.throws(
		() => validateCharacterDefinition(data.character, missingStarter),
		(error) => error.code === "invalid_game_data" && error.item === "hpot0",
	);
	assert.throws(
		() => normalizeItems({ wbook0: {} }, {}),
		(error) => error.code === "invalid_game_data" && error.item === "wbook2",
	);
	const duplicateStarter = plain(data.character);
	duplicateStarter.starter.weapons[0] = "mace";
	assert.throws(
		() => validateCharacterDefinition(duplicateStarter, data.items),
		(error) => error.code === "invalid_game_data" && /starter/.test(error.message),
	);
	const badConsumable = plain(data.character);
	badConsumable.starter.consumables[0].q = 201;
	assert.throws(
		() => validateCharacterDefinition(badConsumable, data.items),
		(error) => error.code === "invalid_game_data" && /starter/.test(error.message),
	);
	const badEquipment = plain(data.character);
	badEquipment.starter.equipment[0].name = "shoes";
	assert.throws(
		() => validateCharacterDefinition(badEquipment, data.items),
		(error) => error.code === "invalid_game_data" && /starter/.test(error.message),
	);
	const badAppearance = plain(data.character);
	badAppearance.appearances[0][1] = null;
	assert.throws(
		() => validateCharacterDefinition(badAppearance, data.items),
		(error) => error.code === "invalid_game_data" && /appearance/.test(error.message),
	);
	const badBookScaling = plain(data.items);
	badBookScaling.wbookhs.compound.int = -1;
	assert.throws(
		() => validateItemRequirements(badBookScaling, plain(data.item_requirements), data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "wbookhs",
	);
	assert.throws(
		() => validateRequirements("unknown_requirement", [{ skill: "missing", level: 1 }], data.skills),
		(error) =>
			error.code === "invalid_equipment_requirements" &&
			error.item === "unknown_requirement" &&
			error.skill === "missing",
	);
	const mismatchedRequirements = plain(data.items);
	mismatchedRequirements.helmet.requirements[0].level = 2;
	assert.throws(
		() => validateItemRequirements(mismatchedRequirements, plain(data.item_requirements), data.skills, ownerMap),
		(error) =>
			error.code === "invalid_game_data" && error.item === "helmet" && /normalized snapshot/.test(error.message),
	);
	const legacyClass = plain(data.items);
	legacyClass.helmet.class = ["warrior"];
	assert.throws(
		() => validateItemRequirements(legacyClass, plain(data.item_requirements), data.skills, ownerMap),
		(error) => error.code === "invalid_game_data" && error.item === "helmet" && /Legacy class/.test(error.message),
	);
	for (const [field, value] of [
		["int", -1],
		["dex", 16],
		["compound", { int: -1 }],
		["damage_type", "physical"],
		["projectile", "magic"],
	]) {
		const badBook = plain(data.items);
		if (field === "compound") badBook.wbookhs.compound = value;
		else badBook.wbookhs[field] = value;
		assert.throws(
			() => validateItemRequirements(badBook, plain(data.item_requirements), data.skills, ownerMap),
			(error) => error.code === "invalid_game_data" && error.item === "wbookhs",
		);
	}
});

test("every equippable item has an explicit requirement and armor publishes grouped highest-skill gates", () => {
	const data = loadAll();
	const fixture = loadEquipmentAcquisitionFixture();
	const balanceContract = loadEquipmentBalanceContract();
	const pinned = loadPinnedItemsAndRequirements("76a50408fac4a7b1df1e1906ed631ac013b1123c");
	const requirementSource = fs.readFileSync(path.join(designRoot, "item_requirements.js"), "utf8");
	const itemSource = fs.readFileSync(path.join(designRoot, "items.js"), "utf8");
	assert.doesNotMatch(requirementSource, /equipment_armor_requirement_weights|equipment_set_requirement_members/);
	assert.match(requirementSource, /function finalize_equipment_requirements\(/);
	assert.match(itemSource, /finalize_equipment_requirements\(items,sets,item_requirements,equipment_set_requirement_levels,equipment_standalone_unlocks\);/);
	const equippable = Object.entries(data.items).filter(([, item]) => equippableTypes.has(item.type));
	assert.equal(equippable.length, 320);
	for (const [id, item] of equippable) {
		assert.deepEqual(plain(item.requirements), plain(data.item_requirements[id]), id);
		validateRequirements(id, item.requirements, data.skills);
	}
	const armorTypes = new Set(["helmet", "chest", "pants", "gloves", "shoes", "cape"]);
	const setUnlocks = new Map(Object.values(fixture.ladders.armor_sets).flat().map((row) => [row.set_id, row.unlock]));
	const setWeights = new Map(Object.entries(fixture.ladders.armor_set_details).map(([setId, detail]) => [setId, detail.weight]));
	const itemUnlocks = new Map([
		...Object.values(fixture.ladders.standalone_armor).flat(),
		...Object.values(fixture.ladders.capes).flat(),
	].map((row) => [row.item_id, row.unlock]));
	const eventOnlyItems = new Set([
		...fixture.optional_event_rows.map((row) => row.item_id),
		...fixture.excluded.map((row) => row.target),
	]);
	const itemWeights = new Map();
	for (const [weight, itemIds] of Object.entries(balanceContract.weight_mapping)) {
		for (const itemId of itemIds) itemWeights.set(itemId, weight);
	}
	for (const item of balanceContract.planned_items) itemWeights.set(item.item_id, item.weight);
	const pairedSkills = {
		heavy: ["warrior", "paladin"],
		medium: ["ranger", "rogue"],
		light: ["mage", "priest"],
	};
	for (const [id, item] of Object.entries(data.items)) {
		if (!armorTypes.has(item.type)) continue;
		const expectedWeight = item.set ? setWeights.get(item.set) : itemWeights.get(id);
		assert.ok(expectedWeight, `missing reviewed weight for ${id}`);
		assert.equal(item.armor_weight, expectedWeight, id);
		const requirement = data.item_requirements[id][0];
		const expectedUnlock = item.set
			? setUnlocks.get(item.set)
			: itemUnlocks.get(id) || (() => {
				assert.ok(eventOnlyItems.has(id), `missing reviewed ladder row for ${id}`);
				return Math.max(...pinned.item_requirements[id].map((clause) => clause.level || 1));
			})();
		assert.ok(Number.isInteger(expectedUnlock), `missing reviewed unlock for ${id}`);
		const expectedRequirement = item.set === "mmerchant"
			? [{ skill: "merchant", level: expectedUnlock }]
			: [{ any_skill: pairedSkills[item.armor_weight], level: expectedUnlock }];
		assert.deepEqual(plain(data.item_requirements[id]), expectedRequirement, id);
	}
	const armorRequirementSnapshot = Object.fromEntries(
		Object.entries(data.items)
			.filter(([, item]) => armorTypes.has(item.type))
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([id, item]) => [id, { armor_weight: item.armor_weight, requirements: item.requirements }]),
	);
	assert.equal(canonicalHash(armorRequirementSnapshot), "8ddef196a5daa1555c5c6c955877abe22d794689edf7c07916a640ea7152d77a");
	for (const [id, item] of Object.entries(data.items)) {
		if (!["amulet", "earring", "ring", "belt", "orb"].includes(item.type)) continue;
		assert.ok(item.requirements.every((requirement) => typeof requirement.skill === "string"), id);
	}
	assert.equal(data.items.stealthcape.tier, undefined);
	assert.deepEqual(plain(data.item_requirements.stealthcape), [{ any_skill: ["ranger", "rogue"], level: 75 }]);
	assert.deepEqual(plain(data.item_requirements.fury), [{ any_skill: ["warrior", "paladin"], level: 91 }]);
	assert.deepEqual(plain(data.item_requirements.tigercape), [{ any_skill: ["warrior", "paladin"], level: 91 }]);
	assert.deepEqual(plain(data.item_requirements.ecape), [{ any_skill: ["mage", "priest"], level: 50 }]);
	assert.ok(data.items.vsword.upgrade);
	assert.equal(data.items.vsword.tier, 3.25);
	assert.deepEqual(plain(data.item_requirements.vsword), [{ skill: "warrior", level: 99 }]);
	assert.ok(data.items.wbookhs.compound);
	assert.equal(data.items.wbookhs.compound.int, 6);
	assert.deepEqual(plain(data.item_requirements.wbookhs), [{ skill: "priest", level: 99 }]);
	const independentRequirementMatrix = {
		helmet: [{ any_skill: ["ranger", "rogue"], level: 13 }],
		spear: [{ skill: "warrior", level: 10 }],
		xmashat: [{ any_skill: ["ranger", "rogue"], level: 8 }],
		weaver: [{ skill: "ranger", level: 90 }],
		mageshood: [{ any_skill: ["mage", "priest"], level: 40 }],
		mrnhat: [{ any_skill: ["ranger", "rogue"], level: 71 }],
		sweaterhs: [{ any_skill: ["ranger", "rogue"], level: 8 }],
		mcboots: [{ skill: "merchant", level: 71 }],
		hhelmet: [{ any_skill: ["warrior", "paladin"], level: 34 }],
		handofmidas: [{ any_skill: ["mage", "priest"], level: 31 }],
		xhelmet: [{ any_skill: ["warrior", "paladin"], level: 58 }],
		shield: [{ any_skill: ["warrior", "paladin", "priest"], level: 26 }],
		quiver: [{ any_skill: ["ranger"], level: 1 }],
		rod: [{ skill: "merchant", level: 16 }],
		pickaxe: [{ skill: "merchant", level: 16 }],
		fury: [{ any_skill: ["warrior", "paladin"], level: 91 }],
		starkillers: [{ any_skill: ["warrior", "paladin"], level: 58 }],
		mpalhelmet: [{ any_skill: ["warrior", "paladin"], level: 9 }],
	};
	for (const [itemId, expected] of Object.entries(independentRequirementMatrix)) {
		assert.deepEqual(plain(data.item_requirements[itemId]), expected, itemId);
	}
});

test("protected non-armor definitions retain their simple requirement semantics", () => {
	const raw = loadRaw();
	const pinned = loadPinnedItemsAndRequirements("76a50408fac4a7b1df1e1906ed631ac013b1123c");
	const accessoryTypes = new Set(["amulet", "earring", "ring", "belt", "orb"]);
	const protectedRequirements = {};
	for (const [itemId, item] of Object.entries(raw.items).filter(([, item]) => accessoryTypes.has(item.type))) {
		assert.deepEqual(plain(item), plain(pinned.items[itemId]), itemId);
		assert.deepEqual(plain(raw.item_requirements[itemId]), plain(pinned.item_requirements[itemId]), itemId);
		protectedRequirements[itemId] = raw.item_requirements[itemId];
	}
	assert.equal(canonicalHash(protectedRequirements), "f4de08572d4867a297d7455fc98b52b997303a24ee62fa8ec4936a3e4e5d0024");
	const rankedWeaponIds = new Set(loadRankingFixture().weapons.map((weapon) => weapon.weapon_id));
	for (const weapon of loadRankingFixture().weapons) {
		assert.deepEqual(plain(raw.item_requirements[weapon.weapon_id]), [{ skill: weapon.skill, level: weapon.assigned_requirement }], weapon.weapon_id);
	}
	for (const [itemId, item] of Object.entries(raw.items)) {
		if (item.type === "tool" || item.type === "weapon" && !rankedWeaponIds.has(itemId))
			assert.deepEqual(plain(raw.item_requirements[itemId]), plain(pinned.item_requirements[itemId]), itemId);
	}
});

test("new ability catalog preserves every legacy definition and only changes ownership vocabulary", () => {
	const data = loadAll();
	const legacy = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/legacy-abilities.json"), "utf8"));
	assert.deepEqual(Object.keys(data.abilities).sort(), Object.keys(legacy).sort());
	for (const id of Object.keys(legacy)) {
		const oldDefinition = { ...legacy[id] };
		const newDefinition = { ...data.abilities[id] };
		if (id === "throw") oldDefinition.code = newDefinition.code;
		assert.equal(Object.prototype.hasOwnProperty.call(newDefinition, "class"), false, id);
		const oldClass = oldDefinition.class;
		if (Array.isArray(oldClass) && oldClass.length === 1) {
			assert.equal(newDefinition.applicability, "skill", id);
			assert.equal(newDefinition.skill, oldClass[0], id);
			assert.equal(newDefinition.level, oldDefinition.level || 1, id);
		} else if (
			["snowball", "scare", "power", "xpower", "warp", "temporalsurge", "zapperzap", "charm", "tangle"].includes(id)
		) {
			assert.equal(newDefinition.applicability, "item", id);
			assert.equal(newDefinition.skill, undefined, id);
		} else {
			assert.equal(newDefinition.skill, undefined, id);
		}
		delete oldDefinition.class;
		delete newDefinition.applicability;
		delete newDefinition.skill;
		delete oldDefinition.level;
		delete newDefinition.level;
		delete newDefinition.style_bound;
		delete newDefinition.contribution;
		assert.deepEqual(plain(newDefinition), plain(oldDefinition), id);
	}
	assert.equal(data.abilities.throw.code, "range=character.skills.merchant.level+200");
	assert.equal(
		Object.values(legacy).filter((definition) => definition.class && definition.class.length === 1).length,
		55,
	);
});

test("ability applicability follows the independent precedence snapshot", () => {
	const data = loadAll();
	const expected = {
		active_combat: ["attack"],
		item: ["snowball", "scare", "power", "xpower", "warp", "temporalsurge", "zapperzap", "charm", "tangle"],
		monster: [
			"portal",
			"self_healing",
			"healing",
			"anger",
			"zap",
			"fireball",
			"frostball",
			"warpstomp",
			"deepfreeze",
			"multi_burn",
			"mlight",
			"dampening_aura",
			"weakness_aura",
			"curse_aura",
			"multi_freeze",
			"mtangle",
			"stone",
		],
		system: [
			"regen_hp",
			"regen_mp",
			"use_mp",
			"use_hp",
			"use_town",
			"travel",
			"stop",
			"snippet",
			"emotion",
			"pure_eval",
			"esc",
			"move_up",
			"move_down",
			"move_left",
			"move_right",
			"toggle_code",
			"toggle_run_code",
			"toggle_inventory",
			"toggle_stats",
			"toggle_character",
			"open_snippet",
			"interact",
			"gm",
		],
	};
	for (const [applicability, ids] of Object.entries(expected)) {
		for (const id of ids) assert.equal(data.abilities[id].applicability, applicability, id);
	}
	assert.equal(Object.values(expected).flat().length + 55, 105);
});

test("character creation data is a stable neutral baseline with all six starters", () => {
	const data = loadAll();
	assert.equal(data.character.appearances.length, 28);
	assert.equal(
		crypto
			.createHash("sha256")
			.update(JSON.stringify(plain(data.character.appearances)))
			.digest("hex"),
		"3baf1e07aaaaa0a601981c3dd211721b396a3bc33ac967eb65839a9a46bb8880",
	);
	assert.deepEqual(plain(data.character.baseline), {
		max_hp: 100,
		max_mp: 100,
		speed: 50,
		frequency: 0.3,
		inventory_size: 42,
		attack: 0,
		heal: 0,
		armor: 0,
		resistance: 0,
		str: 0,
		dex: 0,
		int: 0,
		vit: 0,
	});
	assert.deepEqual(plain(data.character.starter.consumables), [
		{ name: "hpot0", q: 200, gift: 1 },
		{ name: "mpot0", q: 200, gift: 1 },
	]);
	assert.deepEqual(plain(data.character.starter.equipment), [
		{ name: "helmet", level: 0, gift: 1 },
		{ name: "shoes", level: 0, gift: 1 },
	]);
	assert.deepEqual(plain(data.character.starter.slots), {});
});

test("production loaders validate progression data before publishing it", () => {
	const main = fs.readFileSync(path.join(designRoot, "../main.js"), "utf8");
	const server = fs.readFileSync(path.join(designRoot, "../node/server.js"), "utf8");
	assert.match(main, /buildProgressionData\(\{/);
	assert.match(main, /character_view\(character\)/);
	assert.doesNotMatch(fs.readFileSync(path.join(designRoot, "../js/html.js"), "utf8"), /calculate_item_properties\([^\n]+class:/);
	assert.equal((server.match(/const progression_data = buildProgressionData\(\{/g) || []).length, 2);
	assert.ok(server.indexOf("buildProgressionData") < server.indexOf("G = loadProgressionPublication"));
	const serverPaths = [
		{ name: "init_game", body: extractFunctionBody(server, "async function init_game()") },
		{ name: "reload_server", body: extractFunctionBody(server, "async function reload_server(to_broadcast, change)") },
	];
	const serverStatements = serverPaths.map(({ name, body }) => {
		const statement = extractBuilderStatement(body, "const progression_data = buildProgressionData({");
		assert.ok(body.indexOf(statement) < body.indexOf("G = loadProgressionPublication("), name);
		return { name, statement };
	});
	const executeBuilderStatement = (statement, raw) => {
		const context = {
			buildProgressionData,
			items: raw.items,
			item_requirements: raw.item_requirements,
			skills: raw.skills,
			skill_xp: raw.skill_xp,
			abilities: raw.abilities,
			character: raw.character,
		};
		vm.createContext(context);
		vm.runInContext(`${statement}; globalThis.progression_data = progression_data;`, context);
		return context.progression_data;
	};
	const raw = loadRaw();
	const rootBuilt = executeBuilderStatement(
		extractBuilderStatement(main, "var progression_data = buildProgressionData({"),
		raw,
	);
	const serverInitBuilt = executeBuilderStatement(serverStatements[0].statement, raw);
	const serverReloadBuilt = executeBuilderStatement(serverStatements[1].statement, raw);
	assert.deepEqual(plain(serverInitBuilt), plain(rootBuilt));
	assert.deepEqual(plain(serverReloadBuilt), plain(rootBuilt));
	const data = loadAll();
	assert.throws(
		() =>
			validateProgressionData({
				...data,
				item_requirements: { ...data.item_requirements, missing: [{ skill: "warrior", level: 1 }] },
			}),
		(error) => error.code === "invalid_game_data" && error.item === "missing",
	);
	assert.throws(
		() =>
			validateProgressionData({
				...data,
				abilities: { ...data.abilities, broken: { applicability: "skill", skill: "warrior", level: 100 } },
			}),
		(error) => error.code === "invalid_ability_catalog" && error.ability === "broken",
	);
	const missingRequirementMap = plain(data.item_requirements);
	delete missingRequirementMap.helmet;
	assert.throws(
		() => validateProgressionData({ ...data, items: plain(data.items), item_requirements: missingRequirementMap }),
		(error) => error.code === "invalid_game_data" && error.item === "helmet",
	);
	const brokenItems = plain(data.items);
	const brokenRequirements = plain(data.item_requirements);
	brokenItems.broken_weapon = { type: "weapon", wtype: "unknown", requirements: [{ skill: "warrior", level: 1 }] };
	brokenRequirements.broken_weapon = [{ skill: "warrior", level: 1 }];
	assert.throws(
		() =>
			validateProgressionData({
				...data,
				items: brokenItems,
				item_requirements: brokenRequirements,
			}),
		(error) => error.code === "invalid_game_data" && error.item === "broken_weapon" && error.weapon_type === "unknown",
	);
	const publicationContext = {
		loadProgressionPublication,
		progression_data: rootBuilt,
		Version: 1,
	};
	for (const name of [
		"achievements",
		"animations",
		"monsters",
		"sprites",
		"maps",
		"geometry",
		"npcs",
		"tilesets",
		"imagesets",
		"sets",
		"craft",
		"titles",
		"tokens",
		"dismantle",
		"conditions",
		"cosmetics",
		"emotions",
		"projectiles",
		"classes",
		"dimensions",
		"levels",
		"positions",
		"games",
		"events",
		"precomputed",
		"multipliers",
		"docs",
		"drops",
		"progression",
	])
		publicationContext[name] = {};
	vm.createContext(publicationContext);
	const extractPublicationStatement = (source, fromIndex = 0) => {
		const start = source.indexOf("loadProgressionPublication(", fromIndex);
		assert.notEqual(start, -1, "production publication call");
		const end = source.indexOf(");", start) + 2;
		assert.ok(end > start, "production publication statement");
		const assignmentStart = source.lastIndexOf("G =", start);
		return source.slice(assignmentStart === -1 ? start : assignmentStart, end);
	};
	const mainPublicationStatement = extractPublicationStatement(main);
	const serverPublicationStatements = serverPaths.map(({ body }) => extractPublicationStatement(body));
	assert.equal(serverPublicationStatements.length, 2);
	const executePublication = (statement, built) => {
		publicationContext.progression_data = built;
		vm.runInContext(`${statement}; globalThis.__publication = G;`, publicationContext);
		return publicationContext.__publication;
	};
	const executeTwice = (statement, built) => {
		const first = executePublication(statement, built);
		const second = executePublication(statement, built);
		assert.deepEqual(plain(second), plain(first));
		return second;
	};
	const rootPublication = executeTwice(mainPublicationStatement, rootBuilt);
	const backendInitPublication = executeTwice(serverPublicationStatements[0], serverInitBuilt);
	const backendReloadPublication = executeTwice(serverPublicationStatements[1], serverReloadBuilt);
	for (const built of [rootBuilt, serverInitBuilt, serverReloadBuilt]) {
		assert.equal(Object.isFrozen(built), true);
		assert.equal(Object.isFrozen(built.items), true);
		assert.equal(Object.isFrozen(built.skills), true);
	}
	const progressionProjection = (publication) =>
		plain({
			items: publication.items,
			skills: publication.skills,
			skill_xp: publication.skill_xp,
			abilities: publication.abilities,
			character: publication.character,
		});
	assert.deepEqual(progressionProjection(backendInitPublication), progressionProjection(rootPublication));
	assert.deepEqual(progressionProjection(backendReloadPublication), progressionProjection(rootPublication));
	assert.equal(Object.isFrozen(rootPublication.skills), true);
	assert.equal(Object.isFrozen(rootPublication.items), true);
	assert.equal(Object.isFrozen(rootPublication.abilities.attack), true);
	assert.throws(() => {
		rootPublication.abilities.attack.cooldown = 1;
	}, TypeError);
	const previousPublication = plain(backendReloadPublication);
	const previousPublishedSkills = backendReloadPublication.skills;
	const invalidSource = loadRaw();
	invalidSource.item_requirements.missing = [{ skill: "warrior", level: 1 }];
	assert.throws(
		() => buildProgressionData(invalidSource),
		(error) => error.code === "invalid_game_data" && error.item === "missing",
	);
	for (const { name, statement } of serverStatements) {
		const malformedRequirementSource = loadRaw();
		malformedRequirementSource.item_requirements.helmet = [{ any_skill: ["warrior", "warrior"], level: 1 }];
		let publicationContinued = false;
		assert.throws(
			() => {
				executeBuilderStatement(statement, malformedRequirementSource);
				publicationContinued = true;
			},
			(error) => error.code === "invalid_equipment_requirements" && error.item === "helmet",
		);
		assert.equal(publicationContinued, false, name);
	}
	assert.throws(
		() => loadProgressionPublication(backendReloadPublication, invalidSource),
		(error) => error.code === "invalid_game_data",
	);
	const frozenMalformed = Object.freeze({ skills: Object.freeze({}) });
	assert.throws(
		() => loadProgressionPublication({}, frozenMalformed),
		(error) => error.code === "invalid_game_data",
	);
	assert.deepEqual(plain(backendReloadPublication), previousPublication);
	assert.strictEqual(backendReloadPublication.skills, previousPublishedSkills);
});

test("the closed progression consumer inventory has no legacy skill lookups", () => {
	const inventory = [
		"main.js",
		"api.js",
		"adventure_functions.js",
		"filters.js",
		"models.js",
		"node/server.js",
		"node/server_functions.js",
		"htmls/index.html",
		"htmls/comm.html",
		"htmls/contents/selection.html",
		"htmls/contents/selection_characters.html",
		"htmls/contents/character.html",
		"htmls/contents/keymap_guide.html",
		"js/functions.js",
		"js/game.js",
		"js/html.js",
		"js/runner_functions.js",
		"js/runner_compat.js",
		"js/old_common_functions.js",
		"utility/htmls/imagesets/selector.html",
		"docs/articles/6-items101.html",
		"docs/articles/7-using-skills.html",
		"docs/articles/data-character.html",
		"docs/EXAMPLES.html",
		"docs/directory.js",
	];
	const expectedProgressionRefs = { "htmls/index.html": 1, "js/html.js": 16, "js/game.js": 1 };
	const expectedAbilityRefs = {
		"node/server.js": 43,
		"node/server_functions.js": 20,
		"js/functions.js": 20,
		"js/html.js": 29,
		"js/runner_compat.js": 4,
		"js/runner_functions.js": 14,
		"utility/htmls/imagesets/selector.html": 2,
		"htmls/contents/keymap_guide.html": 3,
		"docs/articles/7-using-skills.html": 3,
		"js/game.js": 2,
	};
	const allowlistedLegacyReads = {};
	let abilityReferences = 0;
	for (const relativePath of inventory) {
		const source = fs.readFileSync(path.join(designRoot, "..", relativePath), "utf8");
		assert.equal(
			(source.match(/\bG\.skills\b/g) || []).length,
			expectedProgressionRefs[relativePath] || 0,
			relativePath,
		);
		assert.doesNotMatch(source, /\bG\s*\[\s*["']skills["']\s*\]/, relativePath);
		assert.doesNotMatch(source, /\bG\s*\[\s*["']abilities["']\s*\]/, relativePath);
		assert.doesNotMatch(source, /\b(?:const|let|var)\s+\w+\s*=\s*G\s*\[\s*[^\]]+\s*\]/, relativePath);
		assert.doesNotMatch(source, /G\.abilities\[[^\]]+\](?:\.class|\["class"\]|\['class'\])/, relativePath);
		const legacyReads = source.match(/\b(?:skill|gSkill)\s*(?:\.\s*class|\[\s*["']class["']\s*\])/g) || [];
		assert.equal(legacyReads.length, allowlistedLegacyReads[relativePath] || 0, relativePath);
		const abilityCount = (source.match(/\bG\.abilities\b/g) || []).length;
		assert.equal(abilityCount, expectedAbilityRefs[relativePath] || 0, relativePath);
		abilityReferences += abilityCount;
	}
	assert.ok(abilityReferences > 0);
	const adventureFunctions = fs.readFileSync(path.join(designRoot, "..", "adventure_functions.js"), "utf8");
	assert.doesNotMatch(adventureFunctions, /items\[item\.name\]/);
	assert.match(adventureFunctions, /progression_data\.items/);
	const serverFunctions = fs.readFileSync(path.join(designRoot, "..", "node/server_functions.js"), "utf8");
	assert.match(serverFunctions, /name == "attack" \? player\.attack_ms/);
});

test("frozen progression items keep derived runtime metadata out of the catalog", () => {
	const serverFunctions = fs.readFileSync(path.join(designRoot, "..", "node/server_functions.js"), "utf8");
	const server = fs.readFileSync(path.join(designRoot, "..", "node/server.js"), "utf8");
	assert.match(serverFunctions, /item_runtime\s*=\s*\{\}/);
	assert.match(serverFunctions, /item_runtime\[name\]/);
	assert.doesNotMatch(serverFunctions, /def\.igrade\s*=/);
	assert.doesNotMatch(serverFunctions, /def\.igrace\s*=/);
	assert.doesNotMatch(serverFunctions, /def\.a\s*=/);
	assert.doesNotMatch(serverFunctions, /G\.items\.lostearring\.igrade\s*=/);
	assert.match(server, /item_runtime\[item\.name\]/);
	assert.doesNotMatch(server, /G\.items\[[^\]]+\]\.(?:a|igrade|igrace)\s*=/);
});

test("Priest books and starter appearance data use the new ownership boundary", () => {
	const data = loadAll();
	const ranking = loadRankingFixture(RANKING_FIXTURE_PATH);
	const bookIds = ["wbook0", "wbook2", "wbook3", "wbook4", "wbook5", "wbook1", "wbook6", "wbook7", "wbook8", "wbook9", "wbookhs"];
	for (const id of bookIds) {
		assert.equal(data.items[id].type, "weapon");
		assert.equal(data.items[id].wtype, "book");
		assert.equal(data.item_requirements[id][0].skill, "priest");
		assert.equal(data.item_requirements[id][0].level, ranking.weapons.find((row) => row.weapon_id === id).assigned_requirement);
	}
	assert.equal(data.items.wbookhs.int, ranking.weapons.find((row) => row.weapon_id === "wbookhs").solved_int);
	assert.equal(data.items.wbookhs.dex, undefined);
	assert.equal(data.items.wbookhs.compound.int, 6);
	assert.deepEqual(plain(data.character.starter.slots), {});
});

test("loading real design data twice is idempotent", () => {
	const first = loadAll();
	const second = loadAll();
	assert.deepEqual(plain(second.skills), plain(first.skills));
	assert.deepEqual(plain(second.abilities), plain(first.abilities));
	assert.deepEqual(plain(second.item_requirements), plain(first.item_requirements));
	assert.deepEqual(plain(second.items), plain(first.items));
	assert.deepEqual(plain(second.character), plain(first.character));
});

test("reviewed armor publication matches the static balance fixture and preserves enhancements", () => {
	const raw = loadRaw();
	const fixture = loadArmorSetBalanceFixture();
	const fields = [...fixture.derivation.core_fields, ...fixture.derivation.effect_fields];
	const compact = (definition) => Object.fromEntries(fields.filter((field) => Number(definition[field] || 0) !== 0).map((field) => [field, Number(definition[field])]))
	const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
	const enhancement = (definition) => canonicalize({ upgrade: definition.upgrade || null, compound: definition.compound || null });
	const hash = (definition) => crypto.createHash("sha256").update(JSON.stringify(enhancement(definition))).digest("hex");
	assert.deepEqual(Object.keys(raw.base_nonweapon_progression).sort(), Object.keys(fixture.items).sort());
	for (const [itemId, row] of Object.entries(fixture.items)) {
		assert.deepEqual(plain(raw.base_nonweapon_progression[itemId]), row.base_core, itemId);
		assert.deepEqual(compact(raw.items[itemId]), row.base_core, `${itemId} published core`);
		assert.equal(raw.items[itemId].for, undefined, `${itemId} Fortitude`);
		assert.deepEqual(enhancement(raw.items[itemId]), row.enhancement, `${itemId} enhancement object`);
		assert.equal(hash(raw.items[itemId]), row.enhancement_hash, `${itemId} enhancement hash`);
	}
	for (const [setId, row] of Object.entries(fixture.sets)) {
		assert.equal(raw.sets[setId][1], undefined, `${setId} one-piece bonus`);
		for (const threshold of [2, 3, 4, 5]) {
			assert.deepEqual(plain(raw.sets[setId][threshold]), row.increments[threshold], `${setId}:${threshold}`);
			assert.equal(raw.sets[setId][threshold].for, undefined, `${setId}:${threshold} Fortitude`);
		}
	}
});
