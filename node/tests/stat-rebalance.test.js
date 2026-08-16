"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { calculateStats, dexCrit } = require("../game/stats");
const { WEAPON_PROFILES } = require("../game/active_skill");
const {
	DEX_CRIT_CALIBRATION,
	DEX_CRIT_CALIBRATION_LOADOUT,
	calculateDexCritCalibration,
} = require("../game/stat_calibration");

const root = path.resolve(__dirname, "../..");
const armorSetBalance = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/armor-set-balance.json"), "utf8"));
const weaponRanking = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/weapon-acquisition-ranking.json"), "utf8"));

function item(type, wtype, properties = {}) {
	return { type, ...(wtype ? { wtype } : {}), ...properties };
}

function loadItems() {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(root, "design/items.js"), "utf8"), context, { filename: "items.js" });
	return JSON.parse(JSON.stringify(context.items));
}

function loadItemProperties() {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(root, "design/items.js"), "utf8"), context, { filename: "items.js" });
	const common = fs.readFileSync(path.join(root, "js/old_common_functions.js"), "utf8");
	const start = common.indexOf("function calculate_item_properties");
	const end = common.indexOf("\nfunction random_one", start);
	Object.assign(context, {
		G: { items: context.items, titles: {} },
		prop_cache: {},
		doublehand_types: [],
		round: Math.round,
		clone: (value) => JSON.parse(JSON.stringify(value)),
		in_arr: (value, values) => values.includes(value),
	});
	vm.runInContext(common.slice(start, end), context, { filename: "old_common_functions.js" });
	return { items: context.items, properties: (item) => context.calculate_item_properties(item) };
}

function statsFor(items, slots, options = {}) {
	return calculateStats({
		items,
		slots,
		...options,
	});
}

function cumulativeSet(set) {
	const core = {};
	const effects = {};
	const published = { bonus_items: set.bonus_items };
	for (const threshold of [2, 3, 4, 5]) {
		for (const [field, value] of Object.entries(armorSetBalance.sets[set.id].increments[threshold])) {
			if (armorSetBalance.derivation.core_fields.includes(field)) core[field] = (core[field] || 0) + value;
			else effects[field] = (effects[field] || 0) + value;
		}
		published[threshold] = { ...core, ...effects };
	}
	return published;
}

test("STR owns physical damage while VIT, FOR, and gear own defense", () => {
	const items = {
		bow: item("weapon", "bow", { attack: 10, str: 40, dex: 100, int: 100 }),
		armor: item("chest", null, { vit: 3, for: 12, armor: 9, resistance: 7 }),
	};
	const withoutArmor = statsFor(items, { mainhand: { name: "bow" } });
	const withArmor = statsFor(items, { mainhand: { name: "bow" }, chest: { name: "armor" } });

	assert.equal(withoutArmor.attack, 20);
	assert.equal(withoutArmor.max_hp, 100);
	assert.equal(withoutArmor.armor, 0);
	assert.equal(withoutArmor.resistance, 0);
	assert.equal(withoutArmor.for, 0);
	assert.equal(withArmor.max_hp, 244);
	assert.equal(withArmor.armor, 9);
	assert.equal(withArmor.resistance, 7);
	assert.equal(withArmor.for, 12);
});

test("physical DEX cadence and magical INT cadence remain type-specific", () => {
	const items = {
		bow: item("weapon", "bow", { attack: 10, str: 40, dex: 100, int: 100 }),
		staff: item("weapon", "staff", { attack: 10, int: 100, dex: 100 }),
	};
	const physical = statsFor(items, { mainhand: { name: "bow" } });
	const magical = statsFor(items, { mainhand: { name: "staff" } });
	const slowerPhysical = statsFor(
		{ bow: item("weapon", "bow", { attack: 10, str: 40, dex: 0, int: 100 }) },
		{ mainhand: { name: "bow" } },
	);

	assert.equal(physical.frequency, 0.55625);
	assert.equal(magical.frequency, 0.3675);
	assert.equal(physical.speed, slowerPhysical.speed);
	assert.equal(magical.speed, 46);
	assert.equal(statsFor({ bow: item("weapon", "bow", { str: 1, dex: 160 }) }, { mainhand: { name: "bow" } }).frequency, 0.65);
	assert.equal(statsFor({ bow: item("weapon", "bow", { str: 1, dex: 260 }) }, { mainhand: { name: "bow" } }).frequency, 0.65 + 100 / 925);
	assert.equal(statsFor({ staff: item("weapon", "staff", { int: 400 }) }, { mainhand: { name: "staff" } }).frequency, 0.42);
	assert.equal(statsFor({ staff: item("weapon", "staff", { int: 4000 }) }, { mainhand: { name: "staff" } }).frequency, 0.42);
	assert.equal(statsFor({ staff: item("weapon", "staff", { int: -100 }) }, { mainhand: { name: "staff" } }).frequency, 0.35);
});

test("DEX crit, raw gear crit, and temporary crit use their separate caps", () => {
	const items = {
		blade: item("weapon", "short_sword", { attack: 10, str: 40, dex: DEX_CRIT_CALIBRATION, crit: 90 }),
		armor: item("chest", null, { crit: 50 }),
	};
	const capped = statsFor(items, { mainhand: { name: "blade" }, chest: { name: "armor" } });
	const lowerDex = statsFor(
		{ blade: item("weapon", "short_sword", { attack: 10, str: 40, dex: DEX_CRIT_CALIBRATION / 4 }) },
		{ mainhand: { name: "blade" } },
	);
	const withEffect = statsFor(
		{ blade: item("weapon", "short_sword", { attack: 10, str: 40, dex: DEX_CRIT_CALIBRATION }) },
		{ mainhand: { name: "blade" } },
		{ conditions: { focus: { crit: 25 } } },
	);
	const setCrit = statsFor(
		{
			blade: item("weapon", "short_sword", { attack: 10, str: 40, dex: 0, set: "critical" }),
			helmet: item("helmet", null, { set: "critical" }),
			armor: item("chest", null, { set: "critical", crit: 50 }),
		},
		{ mainhand: { name: "blade" }, helmet: { name: "helmet" }, chest: { name: "armor" } },
		{ sets: { critical: { bonus_items: { helmet: ["helmet"], chest: ["armor"], pants: [], gloves: [], shoes: [] }, 2: { crit: 50 } } }, conditions: { curse: { crit: -5 } } },
	);

	assert.equal(capped.crit, 100);
	assert.equal(lowerDex.crit, 10);
	assert.equal(withEffect.crit, 100);
	assert.equal(setCrit.crit, 15);
	assert.equal(statsFor({ blade: item("weapon", "short_sword", { str: 1 }) }, { mainhand: { name: "blade" } }, { conditions: { curse: { crit: -5 } } }).crit, 0);
	assert.equal(dexCrit(0, DEX_CRIT_CALIBRATION), 0);
	assert.equal(dexCrit(DEX_CRIT_CALIBRATION / 4, DEX_CRIT_CALIBRATION), 10);
	assert.equal(dexCrit(DEX_CRIT_CALIBRATION * 2, DEX_CRIT_CALIBRATION), 80);
});

test("weapon profiles retain their damage type and cadence metadata", () => {
	assert.equal(WEAPON_PROFILES.bow.damage_type, "physical");
	assert.equal(WEAPON_PROFILES.staff.damage_type, "magical");
	assert.equal(WEAPON_PROFILES.book.damage_type, "magical");
	assert.equal(WEAPON_PROFILES.bow.frequency, 0.4);
	assert.equal(WEAPON_PROFILES.staff.frequency, 0.35);
});

test("catalog fixtures preserve starter identities and publish role profiles", () => {
	const items = loadItems();
	for (const name of ["blade", "bow", "mace", "staff", "wbook0", "claw"]) assert.ok(items[name], name);
	assert.equal(items.blade.vit, undefined);
	assert.equal(items.blade.for, undefined);
	assert.ok(items.axe3.attack > items.blade.attack);
	assert.equal(items.wbookhs.upgrade.dex, 6);
	assert.equal(items.wbookhs.upgrade.int, undefined);
	assert.equal(items.wbookhs.compound, undefined);
	assert.equal(items.oozingterror.vit, -30);
	assert.equal(items.daggerofthedead.vit, -6);
	assert.equal(items.vstaff.armor, 120);
	assert.ok(items.helmet.armor > (items.tshirt0.armor || 0));
	for (const itemId of ["tshirt0", "tshirt1", "tshirt2"])
		for (const field of ["str", "dex", "int"]) assert.equal(Number(items[itemId][field] || 0), 0, `${itemId}:${field}`);
	for (const target of weaponRanking.weapons) {
		const definition = items[target.weapon_id];
		assert.equal(definition.attack, target.solved_attack, `${target.weapon_id}:attack`);
		assert.equal(Number(definition.str || 0), target.solved_str, `${target.weapon_id}:str`);
		assert.equal(Number(definition.int || 0), target.solved_int, `${target.weapon_id}:int`);
		assert.equal(Number(definition.dex || 0), target.solved_dex, `${target.weapon_id}:dex`);
	}
});

test("reviewed armor, capes, and cumulative set bonuses flow through runtime stats", () => {
	const items = loadItems();
	for (const itemId of ["mpalarmor", "coat1", "tigerarmor", "angelwings", "vcape"]) {
		const row = armorSetBalance.items[itemId];
		for (const field of [...armorSetBalance.derivation.core_fields, ...armorSetBalance.derivation.effect_fields])
			assert.equal(Number(items[itemId][field] || 0), Number(row.base_core[field] || 0), `${itemId}:${field}`);
		assert.equal(items[itemId].for, undefined, `${itemId}:for`);
	}
	for (const setId of ["mpaladin", "rugged", "tiger"]) {
		const balance = armorSetBalance.sets[setId];
		const slots = Object.fromEntries(Object.entries(balance.canonical_slots).map(([slot, itemId]) => [slot, { name: itemId, level: 0 }]));
		const published = cumulativeSet({ id: setId, bonus_items: { helmet: [balance.canonical_slots.helmet], chest: [balance.canonical_slots.chest], pants: [balance.canonical_slots.pants], gloves: [balance.canonical_slots.gloves], shoes: [balance.canonical_slots.shoes] } });
		const stats = statsFor(items, slots, { sets: { [setId]: published } });
		assert.deepEqual(stats.sets, { [setId]: 5 }, setId);
		assert.equal(stats.for, 0, `${setId}:for`);
	}
});

test("the recorded catalog loadout calibrates the DEX crit ceiling", () => {
	assert.deepEqual(DEX_CRIT_CALIBRATION_LOADOUT, {
		mainhand: { name: "heartwood", level: 15, stat_type: "dex" },
		helmet: { name: "cyber", level: 15, stat_type: "dex" },
		chest: { name: "warpvest", level: 15, stat_type: "dex" },
		pants: { name: "fallen", level: 15, stat_type: "dex" },
		shoes: { name: "vboots", level: 15, stat_type: "dex" },
		gloves: { name: "goldenpowerglove", level: 15, stat_type: "dex" },
		cape: { name: "vcape", level: 15, stat_type: "dex" },
		amulet: { name: "t2dexamulet", level: 15, stat_type: "dex" },
		belt: { name: "dexbelt", level: 15, stat_type: "dex" },
		orb: { name: "orbofdex", level: 15, stat_type: "dex" },
		ring1: { name: "cring", level: 15, stat_type: "dex" },
		ring2: { name: "cring", level: 15, stat_type: "dex" },
		earring1: { name: "dexearringx", level: 15, stat_type: "dex" },
		earring2: { name: "dexearringx", level: 15, stat_type: "dex" },
	});
	const catalog = loadItemProperties();
	const rawCrit = Object.values(DEX_CRIT_CALIBRATION_LOADOUT).reduce(
		(total, item) => total + catalog.properties(item).crit,
		0,
	);
	assert.equal(calculateDexCritCalibration(catalog.items, catalog.properties), 740);
	assert.equal(rawCrit, 9.625);
	assert.equal(dexCrit(DEX_CRIT_CALIBRATION, DEX_CRIT_CALIBRATION), 80);
});

test("server applies the existing critical multiplier to both damage and healing without changing hit checks", () => {
	const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const completeAttack = server.slice(server.indexOf("function complete_attack("), server.indexOf("function target_player("));

	assert.match(server, /function apply_critical_multiplier\(attack, info, def\)/);
	assert.match(completeAttack, /if \(info\.heal\) \{[\s\S]*?attack = apply_critical_multiplier\(attack, info, def\);/);
	assert.match(completeAttack, /if \(attacker\.active_skill == "rogue"\)/);
	assert.match(completeAttack, /target\.evasion && defense == "armor"/);
	assert.match(completeAttack, /info\.miss && Math\.random\(\) \* 100 < info\.miss/);
	assert.match(completeAttack, /target\.avoidance && Math\.random\(\) \* 100 < target\.avoidance/);
	assert.doesNotMatch(completeAttack, /accuracy|accu/);
});
