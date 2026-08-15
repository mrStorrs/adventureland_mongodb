"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { calculateStats } = require("../game/stats");
const { loadBenchmarkData } = require("../tools/progression-benchmark");
const { RANKING_FIXTURE_PATH, loadRankingFixture } = require("../tools/weapon-acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");

function loadGuideHelpers(skills) {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const start = source.indexOf("function guide_weapon_owner(");
	const end = source.indexOf("\nvar last_selector", start);
	assert.ok(start >= 0 && end > start, "item-guide metrics helpers exist");
	const context = { G: { skills }, Math };
	vm.createContext(context);
	vm.runInContext(source.slice(start, end), context, { filename: "html.js" });
	return context;
}

function loadGuideMetrics(skills) {
	return loadGuideHelpers(skills).guide_weapon_metrics;
}

function renderGuideItems(items, skills) {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const helpersStart = source.indexOf("function guide_weapon_owner(");
	const helpersEnd = source.indexOf("\nvar last_selector", helpersStart);
	const renderStart = source.indexOf("function render_all_items()");
	const renderEnd = source.indexOf("\nfunction render_all_monsters()", renderStart);
	assert.ok(helpersStart >= 0 && helpersEnd > helpersStart, "item-guide helpers exist");
	assert.ok(renderStart >= 0 && renderEnd > renderStart, "all-items renderer exists");
	let modal;
	const context = {
		G: { items, skills },
		Math,
		calculate_item_properties: (item) => items[item.name],
		in_arr: (value, values) => values.includes(value),
		item_container: (options) => `<item skin="${options.skin}" onclick="${options.onclick}">`,
		object_sort: (object) => Object.keys(object).sort().map((id) => [id, object[id]]),
		show_modal: (html, options) => {
			modal = { html, options };
		},
	};
	vm.createContext(context);
	vm.runInContext(source.slice(helpersStart, helpersEnd), context, { filename: "html.js" });
	vm.runInContext(source.slice(renderStart, renderEnd), context, { filename: "html.js" });
	context.render_all_items();
	return modal;
}

function renderRankedWeaponInfo(level) {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const infoStart = source.indexOf("function render_item_info(");
	const infoEnd = source.indexOf("\nfunction render_monster_info(", infoStart);
	const helpersStart = source.indexOf("function guide_weapon_owner(");
	const helpersEnd = source.indexOf("\nvar last_selector", helpersStart);
	const renderStart = source.indexOf("var last_selector = \"\";");
	const renderEnd = source.indexOf("function render_item_by_name", renderStart);
	assert.ok(infoStart >= 0 && infoEnd > infoStart && helpersStart >= 0 && helpersEnd > helpersStart && renderStart >= 0 && renderEnd > renderStart, "item-info render path exists");
	const ranked = {
		type: "weapon",
		name: "Ranked Blade",
		skin: "ranked",
		tier: 1,
		wtype: "short_sword",
		damage_type: "physical",
		attack: 10,
		str: 20,
		upgrade: { attack: 2, str: 1 },
		progression: { shared_rank: 3, role: "progression", historical_rank: 4, reference_level: 15, full_sheet_hit_damage: 999, attacks_per_second: 999, base_dps: 999 },
	};
	const context = {
		G: { items: { ranked }, skills: { warrior: { kind: "combat", name: "Warrior", weapon_types: ["short_sword"] } }, titles: {}, maps: {}, craft: {}, sets: {}, abilities: {}, conditions: {} },
		Math,
		window: { character: null },
		character: { skills: {} },
		weapon_types: { short_sword: "Short Sword" },
		offhand_types: {},
		trade_slots: [],
		booster_items: [],
		colors: { attack: "attack" },
		calculate_item_grade: () => 0,
		calculate_item_value: () => 0,
		calculate_item_properties: (actual) => ({ level: actual.level, attack: 10 + actual.level * 2, str: 20 + actual.level }),
		bold_prop_line: (name, value) => `<metric name="${name}">${value}</metric>`,
		to_pretty_float: (value) => String(value),
		to_pretty_num: (value) => String(value),
		in_arr: (value, values) => Array.isArray(values) && values.includes(value),
		equipment_requirements_pass: () => true,
		render_item_help: () => "",
		show_modal: (html) => { context.modalHtml = html; },
	};
	vm.createContext(context);
	vm.runInContext(
		"String.prototype.toTitleCase = function () { return this.charAt(0).toUpperCase() + this.slice(1); };\n" +
			source.slice(infoStart, infoEnd) + source.slice(helpersStart, helpersEnd) + source.slice(renderStart, renderEnd) +
			"\nglobalThis.render_item_info_under_test=render_item_info;",
		context,
		{ filename: "html.js" },
	);
	context.render_item_info_under_test("ranked", level);
	return context.modalHtml;
}

test("item guide base DPS matches the one-weapon combat calculation through +5", () => {
	const data = loadBenchmarkData();
	const calculators = loadPropertyCalculators(data);
	const guideWeaponMetrics = loadGuideMetrics(data.skills);
	for (const [weaponId, definition] of Object.entries(data.items)) {
		if (definition.type !== "weapon" || !definition.wtype) continue;
		for (let level = 0; level <= 5; level += 1) {
			const properties = calculators.current.calculate_item_properties({ name: weaponId, level });
			const expected = calculateStats({
				slots: { mainhand: { name: weaponId, level } },
				items: data.items,
				getItemProperties: calculators.current.calculate_item_properties,
			});
			const guide = guideWeaponMetrics(definition, properties);
			if (!guide) continue;
			assert.equal(guide.hit_damage, expected.attack, `${weaponId}+${level} hit damage`);
			assert.ok(Math.abs(guide.attacks_per_second - expected.frequency) < 0.0000001, `${weaponId}+${level} attack speed`);
			assert.ok(Math.abs(guide.dps - expected.attack * expected.frequency) < 0.0000001, `${weaponId}+${level} DPS`);
		}
	}
});

test("item guide labels its player-facing hit damage, attack speed, and base DPS", () => {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	assert.match(source, /"Hit Damage"/);
	assert.match(source, /"Attacks \/ Sec"/);
	assert.match(source, /"Base DPS"/);
	assert.match(source, /"Shared Rank"/);
	assert.match(source, /"Progression Role"/);
	assert.match(source, /"Historical Rank"/);
	assert.match(source, /"Full-Sheet Base DPS"/);
});

test("ranked item details calculate +0 through +5 metrics from the actual enhanced properties", () => {
	for (let level = 0; level <= 5; level += 1) {
		const html = renderRankedWeaponInfo(level);
		const hitDamage = Math.round((10 + level * 2) * (20 + level) / 20);
		assert.match(html, new RegExp(`<metric name="Hit Damage">${hitDamage}<\\/metric>`), `+${level} hit damage`);
		assert.match(html, new RegExp(`<metric name="Base DPS">${hitDamage * 0.5}<\\/metric>`), `+${level} base DPS`);
		assert.match(html, /<metric name="Shared Rank">3\/11<\/metric>/);
		assert.doesNotMatch(html, /999|Full-Sheet Hit Damage|Full-Sheet Base DPS/, `+${level} ignores stored +0 metrics`);
	}
});

test("item guide groups visible weapons by combat profile and base DPS", () => {
	const data = loadBenchmarkData();
	const ranking = loadRankingFixture(RANKING_FIXTURE_PATH);
	const calculators = loadPropertyCalculators(data);
	const guide = loadGuideHelpers(data.skills);
	const groups = JSON.parse(
		JSON.stringify(
			guide.guide_weapon_groups(data.items, data.skills, (id) =>
				calculators.current.calculate_item_properties({ name: id, level: 0 }),
			),
		),
	);
	assert.deepEqual(
		groups.map((group) => [group.id, group.name]),
		[
			["warrior", "Warrior Weapons"],
			["paladin", "Paladin Weapons"],
			["mage", "Mage Weapons"],
			["priest", "Priest Weapons"],
			["ranger", "Ranger Weapons"],
			["rogue", "Rogue Weapons"],
		],
	);
	const visibleWeapons = Object.entries(data.items)
		.filter(([, item]) => item.type === "weapon" && !item.ignore)
		.map(([id]) => id)
		.sort();
	const displayed = [];
	for (const group of groups) {
		const ranked = ranking.weapons.filter((weapon) => weapon.skill === group.id);
		assert.equal(group.weapons.length, ranked.length, `${group.id} acquisition inventory`);
		const positions = new Map(group.weapons.map((weapon, index) => [weapon.id, index]));
		for (const weapon of group.weapons) {
			displayed.push(weapon.id);
			assert.equal(guide.guide_weapon_owner(data.items[weapon.id]), group.id, weapon.id);
			const target = ranked.find((row) => row.weapon_id === weapon.id);
			assert.ok(target, `${weapon.id} acquisition row`);
			const properties = calculators.current.calculate_item_properties({ name: weapon.id, level: 0 });
			const expectedMetrics = guide.guide_weapon_metrics(data.items[weapon.id], properties);
			assert.equal(Number(weapon.dps.toPrecision(12)), Number(((expectedMetrics && expectedMetrics.dps) || 0).toPrecision(12)), `${weapon.id} displayed actual +0 DPS`);
			assert.equal(weapon.shared_rank, target.shared_rank, `${weapon.id} displayed shared rank`);
			assert.equal(weapon.role, target.role, `${weapon.id} displayed role`);
			assert.equal(weapon.selected_effort, target.selected_effort, `${weapon.id} displayed acquisition effort`);
		}
		for (const easier of ranked)
			for (const harder of ranked)
				if (easier.rank < harder.rank)
					assert.ok(positions.get(easier.weapon_id) < positions.get(harder.weapon_id), `${group.id} rank ${easier.rank}->${harder.rank}`);
		const displayedDps = new Map(group.weapons.map((weapon) => [weapon.id, weapon.dps]));
		const expectedOrder = ranked.slice()
			.sort((left, right) => left.shared_rank - right.shared_rank || left.selected_effort - right.selected_effort || displayedDps.get(left.weapon_id) - displayedDps.get(right.weapon_id) || left.weapon_id.localeCompare(right.weapon_id))
			.map((weapon) => weapon.weapon_id);
		assert.deepEqual(
			group.weapons.map((weapon) => weapon.id),
			expectedOrder,
			`${group.id} is ordered by shared rank, acquisition effort, and stable item identity`,
		);
	}
	assert.deepEqual(displayed.sort(), visibleWeapons);
});

test("item guide preserves non-weapon categories, ignored entries, and item detail actions", () => {
	const skills = {
		warrior: { kind: "combat", name: "Warrior", weapon_types: ["short_sword"] },
		paladin: { kind: "combat", name: "Paladin", weapon_types: [] },
		mage: { kind: "combat", name: "Mage", weapon_types: [] },
		priest: { kind: "combat", name: "Priest", weapon_types: [] },
		ranger: { kind: "combat", name: "Ranger", weapon_types: [] },
		rogue: { kind: "combat", name: "Rogue", weapon_types: [] },
	};
	const modal = renderGuideItems(
		{
			blade: { type: "weapon", wtype: "short_sword", skin: "blade", attack: 10, str: 20 },
			helm: { type: "helmet", skin: "helm" },
			hidden_blade: { type: "weapon", wtype: "short_sword", skin: "hidden_blade", ignore: true, attack: 20, str: 20 },
			hidden_helm: { type: "helmet", skin: "hidden_helm", ignore: true },
		},
		skills,
	);
	assert.match(modal.html, /Warrior Weapons/);
	assert.match(modal.html, /Rogue Weapons/);
	assert.match(modal.html, /Helmets/);
	assert.match(modal.html, /render_item_info\('blade'\)/);
	assert.match(modal.html, /render_item_info\('helm'\)/);
	assert.doesNotMatch(modal.html, /hidden_blade|hidden_helm/);
	assert.equal(modal.options.url, "/docs/guide/all/items");
});
