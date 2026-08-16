"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
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

function renderGuideMonsters(monsters, progression) {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const renderStart = source.indexOf("function render_all_monsters()");
	const renderEnd = source.indexOf("\nfunction render_all_events()", renderStart);
	assert.ok(renderStart >= 0 && renderEnd > renderStart, "all-monsters renderer exists");
	let modal;
	const context = {
		G: { drops: { monsters: { tier_two: [[1, "loot"]] } }, monsters, progression: { MONSTER_PROGRESSION: progression } },
		object_sort: (object) => Object.entries(object).sort((left, right) => left[1].hp - right[1].hp || left[0].localeCompare(right[0])),
		pcs: () => {},
		render_monster_info: () => {},
		show_modal: (html, options) => { modal = { html, options }; },
		sprite: (id) => `<sprite id="${id}">`,
	};
	vm.createContext(context);
	vm.runInContext(source.slice(renderStart, renderEnd), context, { filename: "html.js" });
	context.render_all_monsters();
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
		damage: 10,
		attacks_per_second: 0.5,
		upgrade: { damage: 2, attacks_per_second: 0.01 },
		progression: { shared_rank: 3, role: "progression", historical_rank: 4, reference_level: 15 },
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
		calculate_item_properties: (actual) => ({ level: actual.level, damage: 10 + actual.level * 2, attacks_per_second: 0.5 + actual.level * 0.01 }),
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

function renderMonsterCard() {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const renderStart = source.indexOf("var last_selector = \"\";");
	const renderEnd = source.indexOf("function render_item_by_name", renderStart);
	assert.ok(renderStart >= 0 && renderEnd > renderStart, "monster-card renderer exists");
	const context = {
		G: { abilities: {}, base_gold: null, conditions: {}, craft: {}, maps: {}, sets: {}, titles: {} },
		Math,
		window: { character: null },
		character: { skills: {} },
		booster_items: [],
		trade_slots: [],
		colors: { attack: "attack", hp: "hp", range: "range" },
		calculate_item_grade: () => 0,
		calculate_item_properties: () => ({}),
		bold_prop_line: (name, value) => `<metric name="${name}">${value}</metric>`,
		in_arr: (value, values) => Array.isArray(values) && values.includes(value),
		to_pretty_float: (value) => String(value),
		to_pretty_num: (value) => String(value),
	};
	vm.createContext(context);
	vm.runInContext(source.slice(renderStart, renderEnd), context, { filename: "html.js" });
	return context.render_item("html", {
		pure: true,
		item: { damage_type: "physical", name: "Guide Crab", skin: "crab" },
		monster: "crab",
		prop: { attack: 240, attacks_per_second: 0.3 },
	});
}

function renderLiveMonsterPanel(progression) {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	const renderStart = source.indexOf("function render_monster(monster)");
	const renderEnd = source.indexOf("\nvar cache_bid", renderStart);
	assert.ok(renderStart >= 0 && renderEnd > renderStart, "live-monster renderer exists");
	let html = "";
	const context = {
		G: { abilities: {}, monsters: { crab: { name: "Crab" } }, progression: { MONSTER_PROGRESSION: { crab: progression } } },
		$: () => ({ html: (value) => { html = value; } }),
		button_line: () => "",
		character: null,
		colors: { hp: "hp", inspect: "inspect", lifesteal: "lifesteal", poison: "poison" },
		info_line: ({ name, value, line }) => `<metric name="${name || "line"}">${value || line}</metric>`,
		render_conditions: () => {},
		smart_num: (value) => String(value),
		to_pretty_num: (value) => String(value),
	};
	vm.createContext(context);
	vm.runInContext(source.slice(renderStart, renderEnd), context, { filename: "html.js" });
	context.render_monster({ mtype: "crab", hp: 100, max_hp: 100, xp: 10, attack: 5, s: {} });
	return html;
}

test("item guide DPS matches the direct item properties through each full enhancement range", () => {
	const data = loadBenchmarkData();
	const calculators = loadPropertyCalculators(data);
	const guideWeaponMetrics = loadGuideHelpers(data.skills).guide_weapon_progression_metrics;
	for (const [weaponId, definition] of Object.entries(data.items)) {
		if (definition.type !== "weapon" || !definition.wtype) continue;
		const maximumLevel = definition.compound ? 10 : definition.upgrade ? 12 : 0;
		for (let level = 0; level <= maximumLevel; level += 1) {
			const properties = calculators.current.calculate_item_properties({ name: weaponId, level });
			const guide = guideWeaponMetrics(definition, properties);
			if (!guide) continue;
			assert.equal(guide.damage, properties.damage, `${weaponId}+${level} damage`);
			assert.ok(Math.abs(guide.attacks_per_second - properties.attacks_per_second) < 0.0000001, `${weaponId}+${level} attack speed`);
			assert.ok(Math.abs(guide.dps - properties.damage * properties.attacks_per_second) < 0.0000001, `${weaponId}+${level} DPS`);
		}
	}
});

test("item guide labels direct damage, attack speed, and DPS without primary stats", () => {
	const source = fs.readFileSync(path.resolve(__dirname, "../../js/html.js"), "utf8");
	assert.match(source, /"Damage"/);
	assert.match(source, /"Attacks\/Sec"/);
	assert.match(source, /"DPS"/);
	assert.match(source, /"Shared Rank"/);
	assert.match(source, /"Progression Role"/);
	assert.match(source, /"Historical Rank"/);
	assert.doesNotMatch(source.slice(source.indexOf("function guide_weapon_metrics"), source.indexOf("function guide_weapon_progression_metrics")), /prop\.(attack|str|dex|int|frequency)\b/);
});

test("monster guide cards render the monster's published attack as direct damage", () => {
	assert.match(renderMonsterCard(), /<metric name="Damage">240<\/metric>/);
});

test("all-monsters guide groups published monster tiers and keeps unassigned monsters visible", () => {
	const modal = renderGuideMonsters(
		{
			tier_one: { hp: 10 },
			tier_two: { hp: 20 },
			tier_seven: { hp: 70 },
			unassigned: { hp: 30 },
			hidden: { hp: 40, hide: true },
			cute: { hp: 50, cute: true },
		},
		{ tier_one: { tier: 1 }, tier_two: { tier: 2 }, tier_seven: { tier: 7 } },
	);
	assert.match(modal.html, />Tier 1</);
	assert.match(modal.html, />Tier 2</);
	assert.match(modal.html, />Tier 7</);
	assert.match(modal.html, />Unassigned</);
	assert.ok(modal.html.indexOf("Tier 1") < modal.html.indexOf("Tier 2"));
	assert.ok(modal.html.indexOf("Tier 2") < modal.html.indexOf("Tier 7"));
	assert.ok(modal.html.indexOf("Tier 7") < modal.html.indexOf("Unassigned"));
	assert.match(modal.html, /sprite id="tier_two"/);
	assert.match(modal.html, /#FD79B0/);
	assert.doesNotMatch(modal.html, /sprite id="hidden"|sprite id="cute"/);
	assert.equal(modal.options.url, "/docs/guide/all/monsters");
});

test("live monster panels show progression mechanics and ineligibility reason", () => {
	const html = renderLiveMonsterPanel({ tier: 4, progression_eligible: false, mechanics: ["reflection"], reason: "unsupported_mechanics:reflection" });
	assert.match(html, /<metric name="TIER">4<\/metric>/);
	assert.match(html, /<metric name="PROGRESSION">NOT ELIGIBLE<\/metric>/);
	assert.match(html, /<metric name="MECHANICS">reflection<\/metric>/);
	assert.match(html, /<metric name="REASON">unsupported_mechanics:reflection<\/metric>/);
	assert.match(renderLiveMonsterPanel({ tier: 2, progression_eligible: true, mechanics: [], reason: "matrix" }), /<metric name="MECHANICS">None<\/metric>/);
});

test("ranked item details calculate +0 through +12 metrics from the actual enhanced properties", () => {
	for (let level = 0; level <= 12; level += 1) {
		const html = renderRankedWeaponInfo(level);
		const damage = 10 + level * 2;
		const attacksPerSecond = 0.5 + level * 0.01;
		assert.match(html, new RegExp(`<metric name="Damage">${damage}<\\/metric>`), `+${level} damage`);
		assert.match(html, new RegExp(`<metric name="DPS">${damage * attacksPerSecond}<\\/metric>`), `+${level} DPS`);
		assert.match(html, /<metric name="Shared Rank">3\/7<\/metric>/);
		assert.doesNotMatch(html, /Hit Damage|Base DPS|Strength|Intelligence|Dexterity|Vitality|Fortitude/, `+${level} uses direct properties`);
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
			assert.equal(weapon.role, target.role, `${weapon.id} displayed role`);
		}
		for (const easier of ranked)
			for (const harder of ranked)
				if (easier.shared_rank < harder.shared_rank)
					assert.ok(positions.get(easier.weapon_id) < positions.get(harder.weapon_id), `${group.id} rank ${easier.shared_rank}->${harder.shared_rank}`);
	}
	assert.deepEqual(displayed.sort(), visibleWeapons);
});

test("Hunter sidegrades remain visible to the Guide as rank-five placeholders", () => {
	const data = loadBenchmarkData();
	const calculators = loadPropertyCalculators(data);
	const guideWeaponMetrics = loadGuideHelpers(data.skills).guide_weapon_progression_metrics;
	for (const itemId of ["mhspear", "mhhammer", "mhwand", "mhbook", "mhcrossbow", "mhdagger"]) {
		const metrics = guideWeaponMetrics(data.items[itemId], calculators.current.calculate_item_properties({ name: itemId, level: 0 }));
		assert.equal(metrics.progression.shared_rank, 5, itemId);
		assert.equal(metrics.progression.role, "hunter_sidegrade", itemId);
		assert.equal(data.items[itemId].placeholder_art, true, itemId);
	}
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
			blade: { type: "weapon", wtype: "short_sword", skin: "blade", damage: 10, attacks_per_second: 0.5 },
			helm: { type: "helmet", skin: "helm" },
			hidden_blade: { type: "weapon", wtype: "short_sword", skin: "hidden_blade", ignore: true, damage: 20, attacks_per_second: 0.5 },
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
