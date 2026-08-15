"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const vm = require("node:vm");
const { calculateStats } = require("../game/stats");

const {
	EXCLUDED_WEAPON_IDS,
	FORBIDDEN_DROP_TABLES,
	RANKING_FIXTURE_PATH,
	assertAcyclicSourceGraph,
	assignSemanticRanks,
	buildAcquisitionRanking,
	compactRankingFixture,
	dropOutcomeProbability,
	expectedEnhancedCopies,
	fullSheetContext,
	keyedInstanceAccessEvidence,
	loadRankingFixture,
	loadSourceData,
	markdownReport,
	monsterRouteFactors,
	requiredDynamicMonsterOverrideIds,
	solveRankedDpsCandidates,
	stableJson,
	validateAllocatedRows,
	validateAvailabilityOverrides,
	validateRankingFixture,
	validateRequiredDynamicMonsterOverrides,
} = require("../tools/weapon-acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");
const { serializeFixture } = require("../tools/fixture-serialization");

const REPOSITORY_ROOT = path.resolve(__dirname, "../..");
const ROUTE_IDENTITY_SHA256 = "268bfd057243656fa3e20c4620d830c3a3c7686f8c4de198237bafe3f807077d";
let cachedBuild;

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function roundEvidence(value) {
	return Number(value.toPrecision(12));
}

function builtFixture() {
	if (!cachedBuild) {
		const evidence = loadRankingFixture(RANKING_FIXTURE_PATH);
		cachedBuild = { evidence, generated: buildAcquisitionRanking({ evidence }) };
	}
	return cachedBuild;
}

function routeRows(fixture) {
	return fixture.weapons.flatMap((weapon) => weapon.routes.map((route) => ({ weapon_id: weapon.weapon_id, ...route })));
}

function itemRouteResults(fixture) {
	return [
		...fixture.weapons.flatMap((weapon) => weapon.routes.map((route) => ({ item_id: weapon.weapon_id, ...route }))),
		...(fixture.dependency_route_results || []),
	];
}

function expandedRoute(fixture, route) {
	return { ...(fixture.route_sources[route.route_id] || {}), ...route };
}

function findRoute(fixture, weaponId, routeId) {
	const weapon = fixture.weapons.find((row) => row.weapon_id === weaponId);
	assert.ok(weapon, `missing weapon ${weaponId}`);
	const route = weapon.routes.find((row) => row.route_id === routeId);
	assert.ok(route, `missing ${weaponId} route ${routeId}`);
	return expandedRoute(fixture, route);
}

function findItemRouteResult(fixture, itemId, routeId) {
	const route = itemRouteResults(fixture).find((row) => row.item_id === itemId && row.route_id === routeId);
	assert.ok(route, `missing ${itemId} route result ${routeId}`);
	return expandedRoute(fixture, route);
}

function sha256File(filename) {
	return crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}

function loadPublishedItems() {
	const filename = path.join(REPOSITORY_ROOT, "design/items.js");
	const source = fs.readFileSync(filename, "utf8");
	const context = { Math, console: { log() {}, error() {} }, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(source, context, { filename });
	return clone(context.items);
}

function sourcePopulation(data, { mapId, normalOnly = true } = {}) {
	const populations = new Map();
	for (const [candidateMapId, map] of Object.entries(data.maps)) {
		if (mapId && candidateMapId !== mapId || map.ignore || normalOnly && (map.instance || map.event)) continue;
		for (const pack of map.monsters || []) {
			if (normalOnly && (pack.special || pack.stype === "randomrespawn")) continue;
			const count = Number(pack.count || 0);
			if (!(count > 0) || !data.monsters[pack.type]) continue;
			populations.set(pack.type, (populations.get(pack.type) || 0) + count);
		}
	}
	return populations;
}

function intendedMonster(monsterId, monster) {
	return Boolean(monster && !monster.unlist && !monster.hide && !monsterId.startsWith("target_"));
}

function extractRuntimeEventEntries(eventId) {
	const source = fs.readFileSync(path.join(REPOSITORY_ROOT, "node/server_functions.js"), "utf8");
	const marker = `if (events.${eventId})`;
	const opening = source.indexOf("{", source.indexOf(marker));
	assert.ok(opening >= 0, `missing runtime event block ${eventId}`);
	let depth = 0;
	let closing = opening;
	for (; closing < source.length; closing += 1) {
		if (source[closing] === "{") depth += 1;
		else if (source[closing] === "}" && --depth === 0) break;
	}
	const entries = [];
	const expression = /D\.drops\.maps\.global\.push\(\[([^,]+),\s*"([^"]+)"(?:,\s*"([^"]+)")?\]\);/g;
	let match;
	while ((match = expression.exec(source.slice(opening + 1, closing)))) {
		const probability = Number(match[1].trim());
		assert.ok(Number.isFinite(probability) && probability > 0, `${eventId} runtime probability`);
		entries.push(match[2] === "open" ? [probability, "open", match[3]] : [probability, match[2]]);
	}
	return entries;
}

function independentDropContains(entries, targetItemId, data, seen = new Set()) {
	const forbidden = targetItemId === "vsword" ? new Set() : new Set(FORBIDDEN_DROP_TABLES);
	const tableContains = (tableId, path) => {
		if (forbidden.has(tableId) || path.has(tableId)) return false;
		const table = data.drops[tableId];
		if (!Array.isArray(table)) return false;
		const next = new Set(path);
		next.add(tableId);
		return table.some((entry) => Number(entry[0]) > 0 && entryContains(entry, next));
	};
	const entryContains = (entry, path) => {
		if (entry[1] === "open") return tableContains(entry[2], path);
		if (entry[1] === targetItemId) return true;
		const item = data.items[entry[1]];
		if (!item || !item.e || item.cash !== undefined || item.p2w) return false;
		const exchangeTables = item.upgrade || item.compound
			? Object.keys(data.drops).filter((tableId) => tableId.startsWith(entry[1]) && /^\d+$/.test(tableId.slice(entry[1].length)))
			: [entry[1]];
		return exchangeTables.some((tableId) => tableContains(tableId, path));
	};
	return (entries || []).some((entry) => Number(entry[0]) > 0 && entryContains(entry, seen));
}

function sourceDerivedEncounterRoots(data) {
	const roots = new Map();
	const add = (routeId, monsterId, availabilityCondition, accessItemId) => {
		const monster = data.monsters[monsterId];
		if (intendedMonster(monsterId, monster) && Number(monster.xp) > 0)
			roots.set(routeId, { routeId, monsterId, availabilityCondition, accessItemId });
	};
	const instanceKey = (mapId) => Object.entries(data.items).find(([, item]) => item.type === "dungeon_key" && item.opens === mapId)?.[0];
	const needsEvidence = (monster) => Boolean(
		Number(monster.respawn) < 0 || monster.special || monster.operator || monster.event || monster.raid || monster.boss || monster.respawn_as
	);
	for (const [mapId, map] of Object.entries(data.maps)) {
		const accessItemId = map.instance ? instanceKey(mapId) : undefined;
		if (map.ignore || map.event || map.instance && !accessItemId) continue;
		for (const pack of map.monsters || []) {
			const monster = data.monsters[pack.type];
			if (!(Number(pack.count || 0) > 0) || !intendedMonster(pack.type, monster) || !(Number(monster.xp) > 0)) continue;
			if (map.instance) add(`monster:${pack.type}`, pack.type, undefined, accessItemId);
			else if (pack.special || pack.stype === "randomrespawn" || needsEvidence(monster))
				add(`monster:${pack.type}`, pack.type, pack.special || pack.stype === "randomrespawn" ? `spawn-location:${pack.type}` : `persistent-special:${pack.type}`);
			else add(`monster:${pack.type}`, pack.type);
		}
	}

	const source = fs.readFileSync(path.join(REPOSITORY_ROOT, "node/server_functions.js"), "utf8").replace(/\/\/.*$/gm, "");
	const eventMap = source.slice(source.indexOf("var eventmap = ["), source.indexOf("];", source.indexOf("var eventmap = [")) + 2);
	for (const match of eventMap.matchAll(/\["([^"]+)",\s*"([^"]+)"/g)) add(`monster:${match[2]}`, match[2], `season:${match[1]}`);
	const scheduled = source.match(/\["crabxx",\s*"franky",\s*"icegolem"\]/);
	assert.ok(scheduled, "scheduled runtime monster list");
	for (const monsterId of ["crabxx", "franky", "icegolem"]) add(`monster:${monsterId}`, monsterId, `event:${monsterId}`);
	for (const match of source.matchAll(/if \(events\.([a-z0-9_]+) && stats\.kills[\s\S]{0,220}?spawn_special_monster\("([a-z0-9_]+)"\)/g))
		if (match[1] === match[2]) add(`monster:${match[2]}`, match[2], `spawn-counter:${match[2]}`);
	assert.match(source, /if \(events\.goobrawl\)[\s\S]*?data\.type = "rgoo"/);
	add("monster:rgoo", "rgoo", "event:goobrawl");
	assert.match(source, /if \(!events\.holidayseason && events\.snowman[\s\S]*?spawn_special_monster\("snowman"\)/);
	add("runtime-monster:snowman-offseason", "snowman", "outside-season:holidayseason");
	for (const match of source.matchAll(/G\.monsters\.([a-z0-9_]+)\.respawn = 480;/g))
		if (["jr", "greenjr"].includes(match[1])) add(`event-monster:halloween:${match[1]}`, match[1], "season:halloween");
	return roots;
}

function compatibleAvailability(left, right) {
	if (!left || !right || left === right) return true;
	if (left.startsWith("season:") && right.startsWith("season:")) return false;
	if (left === `outside-${right}` || right === `outside-${left}`) return false;
	return true;
}

function sourceDerivedEventExchangeRoutes(data) {
	const source = fs.readFileSync(path.join(REPOSITORY_ROOT, "node/server_functions.js"), "utf8");
	const server = fs.readFileSync(path.join(REPOSITORY_ROOT, "node/server.js"), "utf8");
	const routes = new Map();
	for (const eventId of Object.keys(data.events)) {
		const markerIndex = source.indexOf(`if (events.${eventId})`);
		if (markerIndex < 0) continue;
		const opening = source.indexOf("{", markerIndex);
		let depth = 0;
		let closing = opening;
		for (; closing < source.length; closing += 1) {
			if (source[closing] === "{") depth += 1;
			else if (source[closing] === "}" && --depth === 0) break;
		}
		const block = source.slice(opening + 1, closing);
		if (!block.includes("exchange(player, table)")) continue;
		const eventType = data.events[eventId].type;
		const plural = eventType === "daily" ? "dailies" : "nightlies";
		const pool = [...server.match(new RegExp(`var ${plural} = \\[([^\\]]+)\\]`))[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
		const slots = server.match(new RegExp(`${plural}: \\[([^\\]]+)\\]`))[1].split(",").map((value) => Number(value.trim()));
		const eventFrequency = slots.length / pool.length;
		const availabilityMultiplier = (24 * 60 * 60) / (Number(data.events[eventId].duration) * eventFrequency);
		const tableIds = [...new Set([...block.matchAll(/(?:var\s+)?table\s*=\s*"([^"]+)"/g)].map((match) => match[1]))].sort();
		const outcomes = [];
		const tokenIds = new Set();
		for (const tableId of tableIds) {
			const table = data.drops[tableId];
			assert.ok(Array.isArray(table) && table.length, tableId);
			const total = table.reduce((sum, entry) => sum + Math.max(0, Number(entry[0] || 0)), 0);
			const outcomeId = tableId === eventId ? "winner" : tableId.slice(eventId.length + 1);
			const quantities = new Map();
			for (const tokenId of Object.keys(data.tokens)) {
				const expectedQuantity = table.reduce((sum, entry) => {
					if (entry[1] !== tokenId) return sum;
					return sum + (Number(entry[0]) / total) * Math.max(1, Number(entry[2] || 1));
				}, 0);
				if (expectedQuantity > 0) tokenIds.add(tokenId);
				quantities.set(tokenId, expectedQuantity);
			}
			outcomes.push({ outcomeId, tableId, quantities });
		}
		for (const tokenId of tokenIds) {
			const components = outcomes.map((outcome) => ({
				outcomeId: outcome.outcomeId,
				tableId: outcome.tableId,
				expectedQuantity: outcome.quantities.get(tokenId) || 0,
			}));
			routes.set(`runtime:${eventId}:${tokenId}`, {
				eventId,
				tokenId,
				components,
				eventFrequency,
				availabilityMultiplier,
			});
		}
	}
	return routes;
}

function sourceDerivedItemRouteInventory(data, itemIds) {
	const expected = new Set();
	const targets = new Set(itemIds);
	const add = (itemId, routeId) => expected.add(`${itemId}|${routeId}`);
	const addDropRoot = (entries, routeId, accessItemId) => {
		for (const itemId of targets)
			if (itemId !== accessItemId && independentDropContains(entries, itemId, data)) add(itemId, routeId);
	};

	for (const itemId of data.character.starter.weapons || []) if (targets.has(itemId)) add(itemId, `starter:${itemId}`);
	const activeNpcIds = new Set(Object.values(data.maps).filter((map) => !map.ignore).flatMap((map) => (map.npcs || []).map((npc) => npc.id).filter(Boolean)));
	for (const npcId of activeNpcIds) {
		const npc = data.npcs[npcId];
		if (!npc || npc.role !== "merchant" || npc.ignore) continue;
		for (const itemId of npc.items || []) {
			const item = data.items[itemId];
			if (targets.has(itemId) && item && item.cash === undefined && !item.p2w) add(itemId, `shop:${npcId}`);
		}
	}
	for (const [itemId, recipe] of Object.entries(data.craft || {}))
		if (targets.has(itemId)) add(itemId, `${recipe.quest ? "quest" : "craft"}:${itemId}`);
	for (const [tokenId, rewards] of Object.entries(data.tokens || {}))
		for (const itemId of Object.keys(rewards)) if (targets.has(itemId)) add(itemId, `token:${tokenId}:${itemId}`);

	const candidates = sourceDerivedEncounterRoots(data);
	for (const candidate of candidates.values()) {
		addDropRoot(data.drops.monsters[candidate.monsterId] || [], candidate.routeId, candidate.accessItemId);
		if (data.drops.monsters_home_server?.[candidate.monsterId])
			addDropRoot(data.drops.monsters_home_server[candidate.monsterId], `home-server:${candidate.routeId}`, candidate.accessItemId);
	}
	for (const [mapId, entries] of Object.entries(data.drops.maps || {})) {
		if (mapId === "global" || mapId === "global_static" || !data.maps[mapId] || data.maps[mapId].ignore) continue;
		if (data.maps[mapId].instance && !Object.values(data.items).some((item) => item.type === "dungeon_key" && item.opens === mapId)) continue;
		for (const [monsterId] of sourcePopulation(data, { mapId, normalOnly: false })) {
			if (!intendedMonster(monsterId, data.monsters[monsterId])) continue;
			const accessItemId = data.maps[mapId].instance
				? Object.entries(data.items).find(([, item]) => item.type === "dungeon_key" && item.opens === mapId)?.[0]
				: undefined;
			addDropRoot(entries, `map:${mapId}:monster:${monsterId}`, accessItemId);
		}
	}
	for (const [candidateId, candidate] of candidates)
		addDropRoot(data.drops.maps.global || [], `global:${candidateId}`, candidate.accessItemId);
	for (const eventId of Object.keys(data.events)) {
		const entries = extractRuntimeEventEntries(eventId);
		if (!entries.length) continue;
		for (const [candidateId, candidate] of candidates) {
			if (!compatibleAvailability(candidate.availabilityCondition, `season:${eventId}`)) continue;
				addDropRoot(entries, `event:${eventId}:${candidateId}`, candidate.accessItemId);
		}
	}
	if (targets.has("essenceofgreed")) add("essenceofgreed", "runtime:essenceofgreed");
	if (targets.has("monstertoken")) add("monstertoken", "runtime:monstertoken");
	if (targets.has("pvptoken")) {
		for (const candidateId of candidates.keys()) add("pvptoken", `runtime:pvptoken:${candidateId}`);
		for (const routeId of sourceDerivedEventExchangeRoutes(data).keys()) add("pvptoken", routeId);
	}
	return expected;
}

test("complete combat catalog classifies 75 retained weapons, eight Priest placeholders, and five named exclusions", () => {
	const { evidence, generated } = builtFixture();

	assert.deepEqual(EXCLUDED_WEAPON_IDS, ["axe3", "bow4", "staff2", "staff3", "staff4"]);
	assert.equal(generated.catalog_manifest.length, 88);
	assert.equal(generated.weapons.length, 83);
	assert.equal(generated.weapons.filter((row) => row.origin === "retained").length, 75);
	assert.equal(generated.weapons.filter((row) => row.origin === "placeholder").length, 8);
	assert.deepEqual(generated.exclusions.map((row) => row.weapon_id).sort(), EXCLUDED_WEAPON_IDS);
	assert.equal(new Set(generated.catalog_manifest.map((row) => row.weapon_id)).size, 88);
	assert.doesNotThrow(() => validateRankingFixture(evidence, generated));
});

test("the checked-in fixture embeds enhancement evidence while the exhaustive route graph is regenerated", () => {
	const { evidence, generated } = builtFixture();
	const fixtureText = fs.readFileSync(RANKING_FIXTURE_PATH, "utf8");

	assert.equal(evidence.schema_version, 5);
	assert.ok(Buffer.byteLength(fixtureText) < 30 * 1024 * 1024, "fixture must remain below 30 MiB");
	assert.equal(fixtureText, serializeFixture(evidence), "fixture must use deterministic compact JSON");
	assert.equal(evidence.enhancement_full_sheet_rows.length, 66);
	assert.equal(evidence.counts.weapon_routes, 5317);
	assert.equal(evidence.counts.dependency_routes, 1042);
	assert.equal(evidence.counts.route_sources, 620);
	assert.equal(evidence.selected_dependency_routes.length, 38);
	assert.equal(evidence.retained_selected_dependency_routes.length, 37);
	assert.equal(typeof evidence.hashes.route_graph_sha256, "string");
	assert.equal(Object.hasOwn(evidence, "route_sources"), false);
	assert.equal(Object.hasOwn(evidence, "dependency_route_results"), false);
	assert.ok(evidence.weapons.every((weapon) => !Object.hasOwn(weapon, "routes") && weapon.selected_route?.route_id === weapon.selected_route_id));
	assert.equal(stableJson(evidence), stableJson(compactRankingFixture(generated)));
	assert.equal(generated.weapons.reduce((sum, weapon) => sum + weapon.routes.length, 0), evidence.counts.weapon_routes);
	assert.equal(generated.dependency_route_results.length, evidence.counts.dependency_routes);
	assert.equal(Object.keys(generated.route_sources).length, evidence.counts.route_sources);

	const tampered = clone(evidence);
	tampered.hashes.route_graph_sha256 = "0".repeat(64);
	assert.throws(() => buildAcquisitionRanking({ evidence: tampered }), /pinned route_graph_sha256 drifted/);
});

test("route inventory snapshot selects the easiest allowed route", () => {
	const { evidence, generated } = builtFixture();
	const rows = routeRows(generated);
	const representedKinds = new Set(rows.map((route) => route.kind));

	assert.equal(rows.length, 5317);
	assert.equal(generated.dependency_route_results.length, 1042);
	assert.equal(Object.keys(generated.route_sources).length, 620);
	assert.equal(generated.hashes.route_identity_manifest_sha256, ROUTE_IDENTITY_SHA256);
	const sourceData = loadSourceData();
	const expectedInventory = sourceDerivedItemRouteInventory(sourceData, generated.weapons.map((weapon) => weapon.weapon_id));
	const actualInventory = new Set(rows.map((route) => `${route.weapon_id}|${route.route_id}`));
	assert.deepEqual([...actualInventory].sort(), [...expectedInventory].sort(), "source-derived acquisition root inventory");
	const expectedEncounters = sourceDerivedEncounterRoots(sourceData);
	for (const candidate of expectedEncounters.values())
		assert.ok(generated.route_sources[`runtime:pvptoken:${candidate.routeId}`], `missing source-derived PvP encounter ${candidate.routeId}`);
	for (const monsterId of ["fvampire", "a1", "a4", "a5", "a6", "vbat", "spiderbr", "spiderr"])
		assert.ok(generated.route_sources[`runtime:pvptoken:monster:${monsterId}`], `missing reviewed encounter ${monsterId}`);
	const recursiveRuntimeRoutes = sourceDerivedEventExchangeRoutes(sourceData);
	assert.deepEqual([...recursiveRuntimeRoutes.keys()].sort(), ["runtime:abtesting:pvptoken"]);
	for (const [routeId, expected] of recursiveRuntimeRoutes) {
		const result = findItemRouteResult(generated, expected.tokenId, routeId);
		assert.deepEqual(result.drop_tables, expected.components.map((component) => component.tableId).sort());
		assert.deepEqual(result.outcome_components.map((component) => component.outcome_id).sort(), expected.components.map((component) => component.outcomeId).sort());
		for (const component of expected.components) {
			const actual = result.outcome_components.find((row) => row.outcome_id === component.outcomeId);
			assert.ok(actual, `${routeId} ${component.outcomeId}`);
			assert.equal(actual.drop_table_id, component.tableId);
			assert.ok(Math.abs(actual.expected_quantity_per_exchange - component.expectedQuantity) < 1e-11, `${routeId} ${component.outcomeId}`);
		}
		assert.ok(Math.abs(result.event_frequency_per_day - expected.eventFrequency) < 1e-11, routeId);
		assert.ok(Math.abs(result.availability_multiplier - expected.availabilityMultiplier) < 1e-11, routeId);
	}
	for (const weaponId of Object.keys(sourceData.tokens.pvptoken).filter((itemId) => generated.weapons.some((weapon) => weapon.weapon_id === itemId))) {
		const tokenRoute = findRoute(generated, weaponId, `token:pvptoken:${weaponId}`);
		assert.equal(tokenRoute.recursive_inputs[0].selected_route_id, "runtime:abtesting:pvptoken", weaponId);
	}
	const dependencyItemIds = new Set(rows.flatMap((route) => route.recursive_inputs || []).map((input) => input.item_id));
	for (const route of generated.dependency_route_results || []) {
		dependencyItemIds.add(route.item_id);
		for (const input of route.recursive_inputs || []) dependencyItemIds.add(input.item_id);
	}
	const expectedDependencyInventory = sourceDerivedItemRouteInventory(sourceData, dependencyItemIds);
	const allResults = new Map(itemRouteResults(generated).map((route) => [`${route.item_id}|${route.route_id}`, route]));
	for (const entry of expectedDependencyInventory) {
		const [itemId, routeId] = entry.split("|");
		const result = allResults.get(entry);
		assert.ok(result, `missing recursive result ${itemId} via ${routeId}`);
		assert.equal(typeof result.kind, "string", `${entry} kind`);
		assert.ok(Number.isFinite(result.effort) && result.effort >= 0, `${entry} effort`);
		assert.ok(generated.route_sources[routeId], `missing recursive source ${itemId} via ${routeId}`);
	}
	const aggregateEventResult = findItemRouteResult(generated, "pvptoken", "runtime:abtesting:pvptoken");
	assert.deepEqual(aggregateEventResult.outcome_components.map((component) => component.outcome_id), ["loser", "winner"]);
	assert.ok(aggregateEventResult.outcome_components.every((component) => component.probability_components.length > 0));
	const globalInstanceResult = findItemRouteResult(generated, "pvptoken", "runtime:pvptoken:monster:a2");
	assert.ok(globalInstanceResult.effective_probability > 0 && globalInstanceResult.expected_instance_attempts > 0);
	assert.ok(globalInstanceResult.recursive_inputs.some((input) => input.item_id === "cryptkey" && input.purpose === "instance_access"));
	const scrollResult = findItemRouteResult(generated, "scroll0", "shop:scrolls");
	assert.ok(scrollResult.gold_cost > 0 && scrollResult.gold_units > 0);
	const nestedExchangeResult = findItemRouteResult(generated, "cscroll1", "map:cave:monster:bat");
	assert.ok(nestedExchangeResult.drop_tables.includes("gem0"));
	assert.ok(nestedExchangeResult.probability_components.some((component) => component.path.includes("exchange:gem0")));
	for (const weapon of generated.weapons) {
		assert.ok(weapon.routes.length > 0, weapon.weapon_id);
		const selected = weapon.routes.find((route) => route.route_id === weapon.selected_route_id);
		assert.ok(selected, `${weapon.weapon_id} selected route exists`);
		assert.equal(selected.effort, Math.min(...weapon.routes.map((route) => route.effort)), weapon.weapon_id);
		assert.equal(selected.effort, weapon.selected_effort, weapon.weapon_id);
		for (const route of weapon.routes) {
			assert.ok(generated.route_sources[route.route_id], `unregistered route ${route.route_id}`);
			for (const dependencyId of route.dependency_route_ids || [])
				assert.ok(generated.route_sources[dependencyId], `unregistered dependency ${dependencyId}`);
			for (const table of route.drop_tables || []) {
				if (!FORBIDDEN_DROP_TABLES.includes(table)) continue;
				assert.equal(weapon.weapon_id, "vsword", `${route.route_id} may not use ${table}`);
				assert.ok(generated.policy.forbidden_drop_table_weapon_exceptions.vsword.includes(table), route.route_id);
			}
		}
	}

	const vswordRoutes = generated.weapons.find((weapon) => weapon.weapon_id === "vsword").routes.map((route) => route.route_id);
	for (const routeId of ["monster:xscorpion", "monster:cutebee", "monster:rgoo"])
		assert.ok(vswordRoutes.includes(routeId), `missing approved vsword route ${routeId}`);
	for (const routeId of [
		"map:mansion:monster:rat",
		"event-monster:halloween:jr",
		"event-monster:halloween:greenjr",
		"home-server:monster:mrgreen",
		"home-server:monster:mrpumpkin",
		"monster:a2",
	]) assert.ok(rows.some((route) => route.route_id === routeId), `missing known route ${routeId}`);
	for (const kind of ["starter", "shop", "craft", "quest_recipe", "token", "monster_drop", "nested_drop", "event_drop"])
		assert.ok(representedKinds.has(kind), `missing ${kind} evidence`);
});

test("drop model distinguishes independent drops, exclusive nested branches, and encounter classes", () => {
	const tables = { box: [[2, "target"], [2, "target"], [6, "other"]] };
	assert.equal(dropOutcomeProbability([[0.25, "target"]], "target", tables), 0.25);
	assert.equal(dropOutcomeProbability([[0.25, "target"], [0.25, "target"]], "target", tables), 0.4375);
	assert.equal(dropOutcomeProbability([[0.5, "open", "box"]], "target", tables), 0.2);
	assert.equal(dropOutcomeProbability([[2, "target"]], "target", tables), 1);
	assert.equal(dropOutcomeProbability([[0.2, "target"]], "target", tables, { directMultiplier: 2 }), 0.4);
	assert.throws(() => dropOutcomeProbability([[-0.1, "target"]], "target", tables), /invalid direct probability/i);
	assert.throws(() => dropOutcomeProbability([[0.1, "target"]], "target", tables, { directMultiplier: 0 }), /invalid direct drop multiplier/i);

	const common = {
		damageMultiplier: () => 0.5,
		medians: { durability: 400, offense: 20, wait: 2000 },
		activePopulation: 2,
		availabilityMultiplier: 3,
	};
	const monster = { hp: 100, armor: 0, resistance: 0, evasion: 0, avoidance: 0, attack: 10, frequency: 2, respawn: 2 };
	const normal = monsterRouteFactors(monster, 0.25, common);
	assert.equal(normal.effective_durability, 200);
	assert.equal(normal.offensive_pressure, 20);
	assert.equal(normal.mean_respawn_ms, 2450);
	assert.equal(normal.wait_units, 0.6125);
	assert.ok(Math.abs(normal.encounter_units - Math.sqrt(0.5)) < 1e-12);
	assert.equal(normal.progression_access_multiplier, 1);
	assert.ok(Math.abs(normal.effort - ((Math.sqrt(0.5) + 0.6125) / 0.25) * 3) < 1e-10);
	const gated = monsterRouteFactors({ ...monster, hp: 1600 }, 0.25, common);
	assert.ok(Math.abs(gated.progression_access_multiplier - Math.sqrt(8)) < 1e-11);
	assert.ok(Math.abs(gated.effort - ((Math.sqrt(8) + 0.6125) / 0.25) * 3 * Math.sqrt(8)) < 2e-10);
	assert.equal(monsterRouteFactors({ ...monster, respawn: 300 }, 1, common).mean_respawn_ms, 288000);
	assert.throws(() => monsterRouteFactors(monster, 0, common), /invalid effective probability/i);
	assert.throws(() => monsterRouteFactors(monster, 1, { ...common, activePopulation: 0 }), /active population/i);
	assert.throws(() => monsterRouteFactors(monster, 1, { ...common, medians: { ...common.medians, wait: 0 } }), /wait normalization/i);
	assert.deepEqual(keyedInstanceAccessEvidence(0.25, 2), {
		instance_population: 2,
		instance_success_probability: 0.4375,
		expected_instance_attempts: 2.28571428571,
	});
	assert.deepEqual(keyedInstanceAccessEvidence(1, 7), {
		instance_population: 7,
		instance_success_probability: 1,
		expected_instance_attempts: 1,
	});
	assert.throws(() => keyedInstanceAccessEvidence(0, 2), /keyed-instance probability/i);
	assert.throws(() => keyedInstanceAccessEvidence(0.5, 1.5), /keyed-instance population/i);

	const { generated } = builtFixture();
	const rowsById = new Map(routeRows(generated).map((route) => [route.route_id, route]));
	for (const routeId of [
		"monster:goo",
		"monster:mrpumpkin",
		"monster:phoenix",
		"monster:a2",
		"event:halloween:monster:ent",
		"map:mansion:monster:rat",
	]) {
		const route = expandedRoute(generated, rowsById.get(routeId));
		assert.ok(route.monster_id, `${routeId} monster identity`);
		for (const field of ["effective_probability", "effective_durability", "offensive_pressure", "active_population", "encounter_units", "wait_units", "effort"])
			assert.ok(Number.isFinite(route[field]) && route[field] > 0, `${routeId} ${field}`);
	}
	for (const routeId of ["event-monster:halloween:jr", "event-monster:halloween:greenjr"])
		assert.equal(generated.route_sources[routeId].mean_respawn_ms, 460800);
	const halloweenPumpkin = generated.route_sources["event:halloween:monster:mrpumpkin"];
	assert.equal(halloweenPumpkin.availability_multiplier, 12.1666666667);
	assert.deepEqual(halloweenPumpkin.availability_condition_ids, ["season:halloween"]);
	for (const monsterId of ["mrgreen", "mrpumpkin"]) {
		const homeRoute = findRoute(generated, "staffofthedead", `home-server:monster:${monsterId}`);
		assert.equal(homeRoute.kind, "event_drop");
		assert.equal(homeRoute.monster_id, monsterId);
		assert.ok(homeRoute.drop_tables.includes("candy0") && homeRoute.drop_tables.includes("candy1"));
		assert.ok(homeRoute.probability_components.some((component) => component.path.includes("exchange:candy")));
		assert.deepEqual(homeRoute.availability_condition_ids, ["home-server:player", "season:halloween"]);
		assert.deepEqual(homeRoute.availability_override_ids, [`monster:${monsterId}`]);
		assert.match(homeRoute.source_path, new RegExp(`drops\\.monsters_home_server\\.${monsterId}$`));
		assert.match(homeRoute.availability_source_path, /node\/server\.js:D\.drops\.monsters_home_server\[monster\.type\]/);
		assert.ok(homeRoute.effort > 0);
	}
	assert.equal("event:halloween:monster:grinch" in generated.route_sources, false, "cross-season encounter");
	assert.equal("event:holidayseason:runtime-monster:snowman-offseason" in generated.route_sources, false, "active/outside-season conflict");
	const instance = expandedRoute(generated, rowsById.get("monster:a2"));
	assert.equal(instance.map_id, "crypt");
	assert.equal(instance.access_item_id, "cryptkey");
	assert.ok(instance.recursive_inputs.some((input) => input.item_id === "cryptkey"));
	const pvpToken = findRoute(generated, "harbringer", "token:pvptoken:harbringer").recursive_inputs[0];
	assert.equal(pvpToken.selected_route_id, "runtime:abtesting:pvptoken");
	const pvpSource = findItemRouteResult(generated, "pvptoken", pvpToken.selected_route_id);
	assert.deepEqual({
		tables: pvpSource.drop_tables,
		outcome: pvpSource.total_outcome_probability,
		frequency: pvpSource.event_frequency_per_day,
		duration: pvpSource.event_duration_seconds,
		multiplier: pvpSource.availability_multiplier,
	}, { tables: ["abtesting", "abtesting_loser"], outcome: 1, frequency: 0.666666666667, duration: 480, multiplier: 270 });
	assert.deepEqual(pvpSource.outcome_components.map((component) => component.outcome_id), ["loser", "winner"]);
	assert.equal(pvpSource.outcome_components.reduce((sum, component) => sum + component.outcome_probability, 0), 1);
	const independentExpectedQuantity = 0.5 * 2.87705956907 + 0.5 * (2 / 3);
	assert.ok(Math.abs(pvpSource.expected_quantity_per_event - independentExpectedQuantity) < 1e-11);
	assert.ok(Math.abs(pvpToken.selected_expected_attempts - 1 / independentExpectedQuantity) < 1e-11);
	assert.ok(Math.abs(pvpToken.unit_effort - pvpToken.selected_expected_attempts * pvpSource.availability_multiplier) < 1e-6);
	assert.ok(Math.abs(pvpToken.unit_effort - 270 / independentExpectedQuantity) < 1e-9);
	const huntSource = generated.route_sources["runtime:monstertoken"];
	assert.deepEqual({
		profile: huntSource.encounter_profile,
		durability: huntSource.effective_durability,
		offense: huntSource.offensive_pressure,
		population: huntSource.active_population,
		respawn: huntSource.mean_respawn_ms,
		encounter: huntSource.encounter_units,
		access: huntSource.progression_access_multiplier,
		wait: huntSource.wait_units,
	}, {
		profile: "permanent_normal_monster_medians",
		durability: generated.policy.normalization_medians.durability,
		offense: generated.policy.normalization_medians.offense,
		population: 1,
		respawn: generated.policy.normalization_medians.wait,
		encounter: 1,
		access: 1,
		wait: 1,
	});
	const huntOverride = generated.availability_overrides.find((override) => override.route_id === "runtime:monstertoken");
	assert.deepEqual({ probability: huntOverride.effective_probability, attempts: huntOverride.expected_attempts, multiplier: huntOverride.multiplier }, { probability: 0.002, attempts: 500, multiplier: 1 });
});

test("source progression access prevents starter-farm rarity from outranking a hard monster recipe", () => {
	const { generated } = builtFixture();
	const goo = generated.route_sources["monster:goo"];
	const fireroamer = generated.route_sources["monster:fireroamer"];
	assert.equal(goo.progression_access_multiplier, 1);
	assert.ok(fireroamer.progression_access_multiplier > 1);

	const slimeStaff = generated.weapons.find((weapon) => weapon.weapon_id === "slimestaff");
	const fieryStaff = generated.weapons.find((weapon) => weapon.weapon_id === "firestaff");
	assert.equal(slimeStaff.selected_route_id, "monster:goo");
	assert.equal(fieryStaff.selected_route_id, "craft:firestaff");
	assert.ok(fieryStaff.selected_effort > slimeStaff.selected_effort);
	assert.ok(fieryStaff.historical_rank > slimeStaff.historical_rank);
});

test("route analysis includes recursive economics, graded enhancement consumables, and definition failures", () => {
	const upgraded = expectedEnhancedCopies({ upgrade: true }, 3, { upgrades: { 0: { 1: 1, 2: 0.5, 3: 0.25 } } });
	assert.equal(upgraded.base_copies, 8);
	assert.deepEqual(upgraded.transitions.map((row) => row.probability_grade), [0, 0, 0]);
	assert.deepEqual(upgraded.transitions.map((row) => row.scroll_item_id), ["scroll0", "scroll0", "scroll0"]);
	assert.deepEqual(upgraded.transitions.map((row) => row.expected_scroll_copies), [8, 8, 4]);
	assert.ok(upgraded.transitions.every((row) => row.offering_item_id === null && row.expected_offering_copies === 0));
	const compounded = expectedEnhancedCopies({ compound: true }, 2, { compounds: { 0: { 1: 0.5, 2: 0.25 } } });
	assert.equal(compounded.base_copies, 72);
	assert.deepEqual(compounded.transitions.map((row) => row.expected_scroll_copies), [24, 4]);
	assert.throws(() => expectedEnhancedCopies({}, 1, {}), /requires upgrade or compound/i);
	assert.throws(() => expectedEnhancedCopies({ upgrade: true }, -1, { upgrades: {} }), /invalid requested item level/i);
	assert.throws(() => expectedEnhancedCopies({ upgrade: true }, 1, { upgrades: { 0: {} } }), /missing upgrades success probability/i);

	const { evidence, generated } = builtFixture();
	const shop = findRoute(generated, "blade", "shop:basics");
	assert.deepEqual({ npc_id: shop.npc_id, gold_cost: shop.gold_cost, gold_units: shop.gold_units, effort: shop.effort }, { npc_id: "basics", gold_cost: 8400, gold_units: 70, effort: 70 });
	const craft = findRoute(generated, "firestaff", "craft:firestaff");
	assert.ok(Math.abs(craft.effort - (craft.gold_units + craft.recursive_inputs.reduce((sum, input) => sum + input.total_effort, 0))) < 1e-8);
	const quest = findRoute(generated, "hbow", "quest:hbow");
	assert.equal(quest.quest_id, "mcollector");
	assert.deepEqual(quest.recursive_inputs.map((input) => input.item_id), ["dstones", "pleather", "feather0"]);
	const token = findRoute(generated, "harbringer", "token:pvptoken:harbringer");
	assert.equal(token.token_quantity, 25);
	assert.equal(token.recursive_inputs[0].total_effort, token.effort);
	const enhanced = findRoute(generated, "gstaff", "craft:gstaff");
	assert.ok(enhanced.enhancement_transitions.some((row) => row.scroll_item_id === "scroll1"));
	assert.ok(enhanced.enhancement_transitions.every((row) => row.scroll_total_effort >= 0 && row.offering_item_id === null));
	const instanceDrop = findRoute(generated, "vstaff", "monster:a8");
	const keyInput = instanceDrop.recursive_inputs.find((input) => input.purpose === "instance_access");
	assert.deepEqual({ item: keyInput.item_id, quantity: keyInput.quantity, attempts: instanceDrop.expected_attempts }, { item: "cryptkey", quantity: 100, attempts: 100 });
	assert.ok(Math.abs(keyInput.total_effort - keyInput.unit_effort * keyInput.quantity) < 1e-6);
	assert.equal(instanceDrop.effort, 6659755.80498);
	const multiMonsterInstance = findRoute(generated, "ornamentstaff", "event:holidayseason:monster:vbat");
	const multiMonsterKey = multiMonsterInstance.recursive_inputs.find((input) => input.purpose === "instance_access");
	const expectedInstanceProbability = 1 - (1 - multiMonsterInstance.effective_probability) ** 7;
	assert.equal(generated.route_sources[multiMonsterInstance.route_id].instance_population, undefined);
	assert.ok(Math.abs(multiMonsterInstance.instance_success_probability - expectedInstanceProbability) < 1e-11);
	assert.ok(Math.abs(multiMonsterInstance.expected_instance_attempts - 1 / expectedInstanceProbability) < 1e-11);
	assert.equal(multiMonsterKey.quantity, multiMonsterInstance.expected_instance_attempts);
	assert.ok(multiMonsterKey.quantity > multiMonsterInstance.expected_attempts / 7, "union probability costs more keys than linear division");
	const nestedExchange = findRoute(generated, "wbook1", "map:mansion:monster:rat");
	const nestedScroll = nestedExchange.recursive_inputs.find((input) => input.purpose === "nested_exchange_scroll");
	assert.deepEqual({ item: nestedScroll.item_id, quantity: nestedScroll.quantity, total: nestedScroll.total_effort }, { item: "cscroll1", quantity: 7.73809523814, total: 15476.1904763 });
	const nestedSource = generated.route_sources[nestedExchange.route_id];
	const nestedEncounterEffort = ((nestedSource.encounter_units + nestedSource.wait_units) / nestedExchange.effective_probability) * nestedSource.availability_multiplier * nestedSource.progression_access_multiplier;
	assert.ok(Math.abs(nestedExchange.effort - (nestedEncounterEffort + nestedScroll.total_effort)) < 1e-6);
	assert.equal(nestedExchange.effort, 54896.7249634);
	assert.throws(() => assertAcyclicSourceGraph({ blade: ["staff"], staff: ["wand"], wand: ["blade"] }), /blade -> staff -> wand -> blade/i);

	const missingInput = loadSourceData();
	missingInput.craft.firestaff.items[0][1] = "missing-test-item";
	assert.throws(() => buildAcquisitionRanking({ evidence, data: missingInput }), /recipe firestaff references missing input missing-test-item/i);
	const invalidCost = loadSourceData();
	invalidCost.craft.firestaff.cost = -1;
	assert.throws(() => buildAcquisitionRanking({ evidence, data: invalidCost }), /recipe firestaff has invalid gold cost/i);
	const invalidQuantity = loadSourceData();
	invalidQuantity.craft.firestaff.items[0][0] = 0;
	assert.throws(() => buildAcquisitionRanking({ evidence, data: invalidQuantity }), /recipe firestaff input staff has invalid quantity/i);
	const missingNestedScroll = loadSourceData();
	missingNestedScroll.items = clone(missingNestedScroll.items);
	delete missingNestedScroll.items.cscroll1;
	assert.throws(() => buildAcquisitionRanking({ evidence, data: missingNestedScroll }), /unresolved acquisition source for cscroll1/i);
	const accessCycle = loadSourceData();
	accessCycle.craft = clone(accessCycle.craft);
	accessCycle.craft.cryptkey = { cost: 0, items: [[1, "vstaff"]] };
	assert.throws(
		() => buildAcquisitionRanking({ evidence, data: accessCycle }),
		/acquisition source cycle.*monster:a8.*vstaff.*cryptkey.*vstaff.*cryptkey/i,
		"instance-access cycle",
	);
	const attemptInputCycle = loadSourceData();
	attemptInputCycle.tokens = clone(attemptInputCycle.tokens);
	attemptInputCycle.tokens.essenceofgreed = { sword: 1 };
	assert.throws(
		() => buildAcquisitionRanking({ evidence, data: attemptInputCycle }),
		/acquisition source cycle.*runtime:essenceofgreed.*essenceofgreed.*sword.*essenceofgreed/i,
		"runtime attempt-input cycle",
	);
});

test("numeric overrides, source hashes, and override-only availability remain explicit", () => {
	const { evidence, generated } = builtFixture();
	const routeIds = new Set(Object.keys(generated.route_sources));
	assert.doesNotThrow(() => validateAvailabilityOverrides(evidence.availability_overrides, routeIds, evidence.source_artifact_hashes));
	for (const override of evidence.availability_overrides) {
		assert.ok(override.multiplier > 0);
		assert.ok(override.availability_condition && override.reason && override.source_artifact && override.source_field);
		assert.equal("rank" in override || "assigned_requirement" in override || "assigned_dps_target" in override, false);
		assert.equal(generated.route_sources[override.route_id].availability_override_id, override.route_id);
	}
	for (const [routeId, multiplier] of Object.entries({
		"monster:crabxx": 54,
		"monster:franky": 72,
		"monster:icegolem": 72,
		"monster:rgoo": 240,
	})) assert.equal(evidence.availability_overrides.find((override) => override.route_id === routeId).multiplier, multiplier, routeId);

	const duplicate = clone(evidence.availability_overrides);
	duplicate.push(clone(duplicate[0]));
	assert.throws(() => validateAvailabilityOverrides(duplicate, routeIds, evidence.source_artifact_hashes), /duplicate availability override/i);
	for (const [field, value] of [["multiplier", 0], ["active_population", 0], ["mean_respawn_ms", Infinity], ["effective_probability", -1], ["expected_attempts", 0], ["outcome_probability", 0]]) {
		const invalid = clone(evidence.availability_overrides);
		invalid[0][field] = value;
		assert.throws(() => validateAvailabilityOverrides(invalid, routeIds, evidence.source_artifact_hashes), new RegExp(`positive finite ${field}`));
	}
	const excessiveOutcomeProbability = clone(evidence.availability_overrides);
	excessiveOutcomeProbability[0].outcome_probability = 1.1;
	assert.throws(() => validateAvailabilityOverrides(excessiveOutcomeProbability, routeIds, evidence.source_artifact_hashes), /outcome_probability at most one/i);
	const excessiveEffectiveProbability = clone(evidence.availability_overrides);
	excessiveEffectiveProbability.find((override) => override.route_id === "runtime:monstertoken").effective_probability = 1.1;
	assert.throws(() => validateAvailabilityOverrides(excessiveEffectiveProbability, routeIds, evidence.source_artifact_hashes), /effective_probability at most one/i);
	const inconsistentAttempts = clone(evidence.availability_overrides);
	inconsistentAttempts.find((override) => override.route_id === "runtime:monstertoken").expected_attempts = 499;
	assert.throws(() => validateAvailabilityOverrides(inconsistentAttempts, routeIds, evidence.source_artifact_hashes), /inconsistent effective_probability and expected_attempts/i);
	const missingCitation = clone(evidence.availability_overrides);
	delete missingCitation[0].source_field;
	assert.throws(() => validateAvailabilityOverrides(missingCitation, routeIds, evidence.source_artifact_hashes), /missing source_field/i);
	const missingCondition = clone(evidence.availability_overrides);
	delete missingCondition[0].availability_condition;
	assert.throws(() => validateAvailabilityOverrides(missingCondition, routeIds, evidence.source_artifact_hashes), /missing availability_condition/i);
	const rankAssignment = clone(evidence.availability_overrides);
	rankAssignment[0].rank = 99;
	assert.throws(() => validateAvailabilityOverrides(rankAssignment, routeIds, evidence.source_artifact_hashes), /cannot assign rank/i);
	const orphaned = clone(evidence.availability_overrides);
	orphaned[0].route_id = "monster:missing";
	assert.throws(() => validateAvailabilityOverrides(orphaned, routeIds, evidence.source_artifact_hashes), /orphaned/i);
	const driftedHashes = { ...evidence.source_artifact_hashes, [evidence.availability_overrides[0].source_artifact]: "0".repeat(64) };
	assert.throws(() => validateAvailabilityOverrides(evidence.availability_overrides, routeIds, driftedHashes), /source evidence drifted/i);

	const missing = clone(evidence);
	missing.availability_overrides.shift();
	assert.throws(() => buildAcquisitionRanking({ evidence: missing }), /missing availability override/i);
	const missingRuntimeReward = clone(evidence);
	missingRuntimeReward.availability_overrides = missingRuntimeReward.availability_overrides.filter(
		(override) => override.route_id !== "runtime:abtesting:winner:pvptoken",
	);
	assert.throws(() => buildAcquisitionRanking({ evidence: missingRuntimeReward }), /missing availability override.*runtime:abtesting:winner:pvptoken/i);
	const overlappingOutcomes = clone(evidence);
	for (const override of overlappingOutcomes.availability_overrides.filter((row) => row.route_id.startsWith("runtime:abtesting:")))
		override.outcome_probability = 0.75;
	assert.throws(() => buildAcquisitionRanking({ evidence: overlappingOutcomes }), /outcome probabilities must form an exhaustive distribution/i);
	const incompleteOutcomes = clone(evidence);
	incompleteOutcomes.availability_overrides.find((override) => override.route_id === "runtime:abtesting:loser:pvptoken").outcome_probability = 0.4;
	assert.throws(() => buildAcquisitionRanking({ evidence: incompleteOutcomes }), /outcome probabilities must form an exhaustive distribution/i);
	const sourceData = loadSourceData();
	for (const routeId of requiredDynamicMonsterOverrideIds(sourceData)) {
		const removed = clone(evidence);
		removed.availability_overrides = removed.availability_overrides.filter((override) => override.route_id !== routeId);
		assert.throws(
			() => validateRequiredDynamicMonsterOverrides(removed, sourceData),
			new RegExp(`missing availability override.*${routeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
			routeId,
		);
	}
});

test("five-percent ranks remain stable independent of the injected requirement table", () => {
	const ranked = assignSemanticRanks([
		{ weapon_id: "b", selected_effort: 105 },
		{ weapon_id: "a", selected_effort: 100 },
		{ weapon_id: "c", selected_effort: 105.01 },
		{ weapon_id: "d", selected_effort: 110.25 },
	], 0.05);
	assert.deepEqual(ranked.map((row) => [row.weapon_id, row.rank]), [["a", 1], ["b", 1], ["c", 2], ["d", 2]]);
	assert.throws(() => assignSemanticRanks([], 1), /invalid semantic rank threshold/i);

	const { evidence, generated } = builtFixture();
	const changedData = loadSourceData();
	changedData.itemRequirements = clone(changedData.itemRequirements);
	for (const weapon of evidence.weapons)
		for (const requirement of changedData.itemRequirements[weapon.weapon_id]) requirement.level += 1000;
	const reranked = buildAcquisitionRanking({ evidence, data: changedData, allowFixtureMigration: true });
	assert.deepEqual(
		reranked.weapons.map((weapon) => [weapon.weapon_id, weapon.selected_effort, weapon.rank]),
		generated.weapons.map((weapon) => [weapon.weapon_id, weapon.selected_effort, weapon.rank]),
	);
	assert.deepEqual(
		reranked.weapons.filter((weapon) => weapon.origin === "retained").map((weapon) => weapon.baseline_requirement),
		generated.weapons.filter((weapon) => weapon.origin === "retained").map((weapon) => weapon.baseline_requirement),
	);
	assert.deepEqual(reranked.weapons.map((weapon) => weapon.assigned_requirement), generated.weapons.map((weapon) => weapon.assigned_requirement));
	assert.equal(stableJson(generated), stableJson(buildAcquisitionRanking({ evidence })));
});

test("shared-rank allocation preserves coverage, compression, and bounded quantization error", () => {
	const { generated } = builtFixture();
	const expectedRanks = Array.from({ length: 11 }, (_, index) => index + 1);
	for (const skill of generated.policy.combat_skills) {
		const targets = generated.policy.rank_targets_by_skill[skill];
		const boundaries = generated.policy.rank_boundaries_by_skill[skill];
		const rows = generated.weapons.filter((weapon) => weapon.skill === skill).sort((left, right) => left.rank - right.rank || left.weapon_id.localeCompare(right.weapon_id));
		assert.deepEqual([...new Set(rows.map((row) => row.shared_rank))], expectedRanks, `${skill} shared-rank coverage`);
		assert.deepEqual(rows.filter((row) => row.role === "progression").map((row) => row.shared_rank), expectedRanks, `${skill} progression anchors`);
		assert.ok(rows.every((row) => ["progression", "sidegrade"].includes(row.role)), `${skill} roles`);
		let previous = { requirement: -Infinity, target: -Infinity, solved: -Infinity };
		for (const rank of [...new Set(rows.map((row) => row.rank))].sort((a, b) => a - b)) {
			const group = rows.filter((row) => row.rank === rank);
			assert.ok(group.every((row) => row.assigned_requirement === generated.policy.shared_rank_requirements[rank - 1]), `${skill} requirement rank ${rank}`);
			assert.ok(group.every((row) => row.assigned_dps_target === targets[rank - 1]), `${skill} target rank ${rank}`);
			const lower = rank === 1 ? targets[0] : boundaries[rank - 2];
			const upper = rank === generated.policy.shared_rank_count ? targets.at(-1) : boundaries[rank - 1];
			assert.ok(Math.min(...group.map((row) => row.solved_dps)) >= lower - 1e-12, `${skill} lower boundary rank ${rank}`);
			assert.ok(Math.max(...group.map((row) => row.solved_dps)) <= upper + 1e-12, `${skill} upper boundary rank ${rank}`);
			assert.ok(Math.min(...group.map((row) => row.assigned_requirement)) >= previous.requirement, `${skill} requirement rank ${rank}`);
			assert.ok(Math.min(...group.map((row) => row.assigned_dps_target)) >= previous.target, `${skill} target rank ${rank}`);
			assert.ok(Math.min(...group.map((row) => row.solved_dps)) > previous.solved, `${skill} solved rank ${rank}`);
			previous = {
				requirement: Math.max(...group.map((row) => row.assigned_requirement)),
				target: Math.max(...group.map((row) => row.assigned_dps_target)),
				solved: Math.max(...group.map((row) => row.solved_dps)),
			};
		}
		const retained = rows.filter((row) => row.origin === "retained").sort((left, right) => left.historical_rank - right.historical_rank || left.weapon_id.localeCompare(right.weapon_id));
		for (let index = 1; index < retained.length; index += 1)
			assert.ok(retained[index].shared_rank >= retained[index - 1].shared_rank, `${skill} historical compression inversion`);
		assert.doesNotThrow(() => validateAllocatedRows(rows));
	}
	assert.equal(generated.policy.rank_targets[0], 50);
	assert.equal(generated.policy.rank_targets.at(-1), 450);
	for (let index = 1; index < generated.policy.rank_targets.length; index += 1)
		assert.ok(Math.abs(generated.policy.rank_targets[index] / generated.policy.rank_targets[index - 1] - generated.policy.growth_factor) < 1e-9);

	const valid = [
		{ skill: "test", rank: 1, assigned_requirement: 1, assigned_dps_target: 10, solved_dps: 10, solved_dps_error: 0, dps_quantum: 2 },
		{ skill: "test", rank: 2, assigned_requirement: 2, assigned_dps_target: 20, solved_dps: 20, solved_dps_error: 0, dps_quantum: 2 },
	];
	assert.doesNotThrow(() => validateAllocatedRows(valid));
	const requirementInversion = clone(valid);
	requirementInversion[1].assigned_requirement = 0;
	assert.throws(() => validateAllocatedRows(requirementInversion), /requirement inversion/i);
	const targetInversion = clone(valid);
	targetInversion[1].assigned_dps_target = 5;
	assert.throws(() => validateAllocatedRows(targetInversion), /DPS target inversion/i);
	const solvedInversion = clone(valid);
	solvedInversion[1].solved_dps = 5;
	assert.throws(() => validateAllocatedRows(solvedInversion), /solved DPS inversion/i);
	const outsideBand = clone(valid);
	outsideBand[0].rank_band = { lower: 11, upper: 19, lower_inclusive: true, upper_inclusive: false };
	assert.throws(() => validateAllocatedRows(outsideBand), /full-sheet rank band/i);

	const syntheticRows = [
		{ weapon_id: "easy", rank: 1, assigned_dps_target: 10 },
		{ weapon_id: "hard", rank: 2, assigned_dps_target: 11 },
	];
	const syntheticCandidates = {
		easy: [{ attack: 9, dps: 9, quantum: 1 }, { attack: 10, dps: 10, quantum: 1 }],
		hard: [{ attack: 9, dps: 9, quantum: 1 }, { attack: 20, dps: 20, quantum: 1 }],
	};
	const combinations = syntheticCandidates.easy.flatMap((easy) => syntheticCandidates.hard.map((hard) => ({
		cost: Math.abs(Math.log(easy.dps / 10)) + Math.abs(Math.log(hard.dps / 11)),
		feasible: easy.dps < hard.dps,
		attacks: [easy.attack, hard.attack],
		dps: [easy.dps, hard.dps],
	}))).filter((row) => row.feasible).sort((left, right) => left.cost - right.cost || left.dps[0] - right.dps[0] || left.dps[1] - right.dps[1] || left.attacks[0] - right.attacks[0] || left.attacks[1] - right.attacks[1]);
	const solved = solveRankedDpsCandidates(syntheticRows, syntheticCandidates);
	assert.ok(Math.abs(solved.total_error - combinations[0].cost) < 1e-10);
	assert.deepEqual(solved.selections.map((row) => row.attack), combinations[0].attacks);
	assert.deepEqual(solved.selections.map((row) => row.dps), combinations[0].dps);
	const tiedRows = [
		{ weapon_id: "easy", rank: 1, assigned_dps_target: 1.5 },
		{ weapon_id: "hard", rank: 2, assigned_dps_target: 3 },
	];
	const tiedCandidates = {
		easy: [{ attack: 10, dps: 1, quantum: 1 }, { attack: 1, dps: 2, quantum: 1 }],
		hard: [{ attack: 3, dps: 3, quantum: 1 }],
	};
	const tiedExhaustive = tiedCandidates.easy.flatMap((easy) => tiedCandidates.hard.map((hard) => ({
		cost: Math.abs(Math.log(easy.dps / tiedRows[0].assigned_dps_target)) + Math.abs(Math.log(hard.dps / tiedRows[1].assigned_dps_target)),
		feasible: easy.dps < hard.dps,
		attacks: [easy.attack, hard.attack],
		dps: [easy.dps, hard.dps],
	}))).filter((row) => row.feasible).sort((left, right) => left.cost - right.cost || left.dps[0] - right.dps[0] || left.dps[1] - right.dps[1] || left.attacks[0] - right.attacks[0] || left.attacks[1] - right.attacks[1]);
	const tied = solveRankedDpsCandidates(tiedRows, tiedCandidates);
	assert.ok(Math.abs(tied.total_error - tiedExhaustive[0].cost) < 1e-10);
	assert.deepEqual(tied.selections.map((row) => row.attack), tiedExhaustive[0].attacks, "tied optimum uses the globally preferred signature");
	assert.throws(() => solveRankedDpsCandidates(syntheticRows, { easy: syntheticCandidates.easy }), /missing DPS candidates for hard/i);
});

test("pinned requirements and attacks apply without protected-field drift", () => {
	const fixture = loadRankingFixture(RANKING_FIXTURE_PATH);
	const generated = buildAcquisitionRanking({ evidence: fixture });
	assert.deepEqual(generated.application, {
		status: "applied",
		applied_weapon_count: 83,
		requirement_mismatches: [],
		attack_mismatches: [],
		attack_growth_mismatches: [],
		core_mismatches: [],
		progression_metadata_mismatches: [],
	});
	const data = loadSourceData();
	const calculators = loadPropertyCalculators(data);
	const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/vanilla-equipment-baseline.json"), "utf8"));
	const assigned = new Map(fixture.weapons.map((weapon) => [weapon.weapon_id, weapon]));
	const publishedItems = loadPublishedItems();
	const source = fs.readFileSync(path.join(REPOSITORY_ROOT, "design/items.js"), "utf8");
	const mapMatch = source.match(/var weapon_progression = (\{[\s\S]*?\});\nvar weapon_progression_base_fields/);
	assert.ok(mapMatch, "single reviewed weapon publication map");
	const progressionMap = JSON.parse(mapMatch[1]);
	assert.deepEqual(Object.keys(progressionMap).sort(), [...assigned.keys(), ...fixture.exclusions.map((row) => row.weapon_id)].sort());
	assert.equal((source.match(/var weapon_progression = /g) || []).length, 1);
	assert.doesNotMatch(source, /weapon_stat_budget|weapon_handoff_attack_adjustments|acquisition_ranked_weapon_attacks/);

	for (const [weaponId, target] of assigned) {
		const context = fullSheetContext(data, calculators, baseline, target);
		assert.deepEqual(data.itemRequirements[weaponId], [{ skill: target.skill, level: target.assigned_requirement }], `${weaponId} requirement`);
		assert.equal(publishedItems[weaponId].attack, target.solved_attack, `${weaponId} top-level attack`);
		assert.equal(progressionMap[weaponId].attack, target.solved_attack, `${weaponId} publication map attack`);
		assert.deepEqual(Object.keys(progressionMap[weaponId]).filter((field) => !["attack", "frequency", "str", "int", "dex", "upgrade", "compound", "progression"].includes(field)), [], `${weaponId} protected publication fields`);
		assert.deepEqual(progressionMap[weaponId].progression, {
			historical_rank: target.historical_rank,
			shared_rank: target.shared_rank,
			role: target.role,
			requirement: target.assigned_requirement,
			reference_level: target.reference_level,
			target_dps: target.assigned_dps_target,
			full_sheet_hit_damage: target.quantization.chosen.sheet_attack,
			attacks_per_second: target.quantization.chosen.sheet_frequency,
			base_dps: target.solved_dps,
			selected_effort: target.selected_effort,
		}, `${weaponId} Guide progression metadata`);
		assert.deepEqual(data.items[weaponId].progression, progressionMap[weaponId].progression, `${weaponId} published Guide progression metadata`);
		const enhancement = progressionMap[weaponId][target.enhancement_kind];
		assert.ok(enhancement, `${weaponId} ${target.enhancement_kind} publication`);
		assert.equal(progressionMap[weaponId][target.enhancement_kind === "upgrade" ? "compound" : "upgrade"], undefined, `${weaponId} alternate enhancement kind`);
		assert.deepEqual(Object.keys(enhancement), ["attack"], `${weaponId} publication owns only enhancement attack growth`);
		assert.equal(enhancement.attack, target.solved_attack_growth, `${weaponId} attack growth`);
		const maximumLevel = target.enhancement_kind === "compound" ? 10 : 12;
		let previousAttack = -Infinity;
		for (let level = 0; level <= maximumLevel; level += 1) {
			const properties = calculators.current.calculate_item_properties({ name: weaponId, level });
			for (const [field, value] of Object.entries(properties))
				if (typeof value === "number") assert.ok(Number.isFinite(value), `${weaponId}+${level} ${field}`);
			const state = context.evaluateState(level, target.solved_attack, target.solved_attack_growth, { str: target.solved_str, int: target.solved_int, dex: target.solved_dex });
			const dps = state.dps;
			assert.ok(Number.isFinite(dps) && dps > 0, `${weaponId}+${level} DPS`);
			assert.ok(properties.attack + 1e-12 >= previousAttack, `${weaponId}+${level} attack regression`);
			previousAttack = properties.attack;
		}
	}

	for (const excluded of fixture.exclusions) {
		assert.equal(data.itemRequirements[excluded.weapon_id][0].level, excluded.unchanged_requirement, `${excluded.weapon_id} requirement`);
		const stats = calculateStats({
			slots: { mainhand: { name: excluded.weapon_id, level: 0 } },
			items: data.items,
			getItemProperties: calculators.current.calculate_item_properties,
		});
		assert.equal(roundEvidence(stats.attack * stats.frequency), excluded.unchanged_dps, `${excluded.weapon_id} DPS`);
		assert.ok(progressionMap[excluded.weapon_id], `${excluded.weapon_id} pinned publication`);
	}

	for (const skill of fixture.policy.combat_skills) {
		const rows = fixture.weapons.filter((weapon) => weapon.skill === skill);
		let previousRequirement = -Infinity;
		let previousDps = -Infinity;
		for (const rank of [...new Set(rows.map((weapon) => weapon.rank))].sort((left, right) => left - right)) {
			const group = rows.filter((weapon) => weapon.rank === rank);
			const requirements = group.map((weapon) => data.itemRequirements[weapon.weapon_id][0].level);
			const dpsValues = group.map((weapon) => fullSheetContext(data, calculators, baseline, weapon).evaluateState(
				0,
				weapon.solved_attack,
				weapon.solved_attack_growth,
				{ str: weapon.solved_str, int: weapon.solved_int, dex: weapon.solved_dex },
			).dps);
			assert.ok(Math.min(...requirements) >= previousRequirement, `${skill} rank ${rank} requirement inversion`);
			assert.ok(Math.min(...dpsValues) > previousDps, `${skill} rank ${rank} DPS inversion`);
			previousRequirement = Math.max(...requirements);
			previousDps = Math.max(...dpsValues);
		}
	}
});

test("normal execution is read-only across production inputs and fixture writes are guarded", () => {
	const observedFiles = [
		path.join(REPOSITORY_ROOT, "design/items.js"),
		path.join(REPOSITORY_ROOT, "design/item_requirements.js"),
		path.join(REPOSITORY_ROOT, "node/server.js"),
		path.join(REPOSITORY_ROOT, "node/server_functions.js"),
		RANKING_FIXTURE_PATH,
	];
	const before = Object.fromEntries(observedFiles.map((filename) => [filename, { hash: sha256File(filename), mtime: fs.statSync(filename).mtimeMs }]));
	const tool = path.resolve(__dirname, "../tools/weapon-acquisition-ranking.js");
	const source = fs.readFileSync(path.resolve(__dirname, "../tools/weapon-acquisition-ranking.js"), "utf8");
	assert.equal((source.match(/fs\.writeFileSync\(/g) || []).length, 1);
	assert.match(source, /fs\.writeFileSync\(RANKING_FIXTURE_PATH, serializeFixture\(pinned\)\)/);
	assert.doesNotMatch(source, /(?:unlinkSync|renameSync|rmSync|deleteMany|dropDatabase|mongoose|mongodb)/);

	const result = spawnSync(process.execPath, [tool, "--json"], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
	assert.equal(result.status, 0, result.stderr);
	assert.equal(JSON.parse(result.stdout).weapons.length, 83);
	const markdown = spawnSync(process.execPath, [tool], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
	assert.equal(markdown.status, 0, markdown.stderr);
	const repeatedMarkdown = spawnSync(process.execPath, [tool], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
	assert.equal(repeatedMarkdown.status, 0, repeatedMarkdown.stderr);
	assert.equal(repeatedMarkdown.stdout, markdown.stdout, "default Markdown bytes");
	assert.equal(markdown.stdout, markdownReport(builtFixture().generated), "default CLI report contract");
	const evidenceStart = markdown.stdout.indexOf("```json\n");
	const evidenceEnd = markdown.stdout.lastIndexOf("\n```\n");
	assert.ok(evidenceStart >= 0 && evidenceEnd > evidenceStart, "complete Markdown evidence block");
	const reportEvidence = JSON.parse(markdown.stdout.slice(evidenceStart + "```json\n".length, evidenceEnd));
	const generated = builtFixture().generated;
	assert.deepEqual(reportEvidence.policy, generated.policy);
	assert.deepEqual(reportEvidence.hashes, generated.hashes);
	assert.deepEqual(reportEvidence.availability_overrides, generated.availability_overrides);
	assert.deepEqual(
		reportEvidence.weapons.flatMap((weapon) => weapon.routes.map((route) => `${weapon.weapon_id}|${route.route_id}`)),
		generated.weapons.flatMap((weapon) => weapon.routes.map((route) => `${weapon.weapon_id}|${route.route_id}`)),
	);
	assert.deepEqual(
		reportEvidence.dependency_route_results.map((route) => `${route.item_id}|${route.route_id}`),
		generated.dependency_route_results.map((route) => `${route.item_id}|${route.route_id}`),
	);
	const reportedMonster = reportEvidence.weapons.flatMap((weapon) => weapon.routes).find((route) => route.route_id === "monster:goo");
	for (const field of ["effective_probability", "active_population", "mean_respawn_ms", "encounter_units", "progression_access_multiplier", "wait_units", "effort"])
		assert.ok(Number.isFinite(reportedMonster[field]), `Markdown monster ${field}`);
	const reportedCraft = reportEvidence.weapons.flatMap((weapon) => weapon.routes).find((route) => route.route_id === "craft:firestaff");
	assert.ok(reportedCraft.recursive_inputs.length > 0 && Number.isFinite(reportedCraft.gold_cost));
	assert.ok(reportEvidence.weapons.every((weapon) => Number.isFinite(weapon.assigned_requirement) && Number.isFinite(weapon.assigned_dps_target)));
	for (const filename of observedFiles) {
		assert.equal(sha256File(filename), before[filename].hash, `${filename} contents`);
		assert.equal(fs.statSync(filename).mtimeMs, before[filename].mtime, `${filename} mtime`);
	}

	const rejected = spawnSync(process.execPath, [tool, "--write-fixture=elsewhere.json"], { encoding: "utf8" });
	assert.notEqual(rejected.status, 0);
	assert.match(rejected.stderr, /only the checked-in ranking fixture/i);
	const rejectedRebaseline = spawnSync(process.execPath, [tool, "--write-fixture"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
	assert.notEqual(rejectedRebaseline.status, 0);
	assert.match(rejectedRebaseline.stderr, /approved shared-rank migration flag/i);
});
