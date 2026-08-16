"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
	assignPercentiles,
	assertAcyclicSourceGraph,
	buildProductionAcquisitionResolver,
	canonicalJson,
} = require("../tools/acquisition-ranking");
const { buildAcquisitionRanking, compactRankingFixture, loadRankingFixture, loadSourceData } = require("../tools/weapon-acquisition-ranking");

test("shared acquisition ranking preserves tied bands", () => {
	const rows = assignPercentiles([
		{ item_id: "a", effort: 8 },
		{ item_id: "b", effort: 8 },
		{ item_id: "c", effort: 12 },
	]);
	assert.equal(rows[0].percentile, rows[1].percentile);
	assert.ok(rows[2].percentile > rows[1].percentile);
	assert.deepEqual(rows.map((row) => row.item_id), ["a", "b", "c"]);
});

test("the production source graph fails closed for cycles", () => {
	assert.throws(() => assertAcyclicSourceGraph({ a: ["b"], b: ["a"] }), /cycle/i);
	assert.equal(canonicalJson({ b: 1, a: [2] }), '{"a":[2],"b":1}');
});

test("semantic five-percent bands keep lexical ordering out of power and use the combined fallback", () => {
	const rows = assignPercentiles([
		{ item_id: "lexically-last", effort: 100 },
		{ item_id: "lexically-first", effort: 105 },
		{ item_id: "next-band", effort: 105.0001 },
	]);
	assert.deepEqual(rows.map((row) => row.item_id), ["lexically-last", "lexically-first", "next-band"]);
	assert.equal(rows[0].percentile, rows[1].percentile);
	assert.ok(rows[2].percentile > rows[1].percentile);
	assert.equal(assignPercentiles([{ item_id: "only", effort: 1 }], { combinedPercentile: 0.625 })[0].percentile, 0.625);
});

test("the generic production boundary owns the retained routes and approved Priest placeholders", () => {
	const genericSource = fs.readFileSync(path.resolve(__dirname, "../tools/acquisition-ranking.js"), "utf8");
	const weaponSource = fs.readFileSync(path.resolve(__dirname, "../tools/weapon-acquisition-ranking.js"), "utf8");
	assert.doesNotMatch(genericSource, /require\(["']\.\/weapon-acquisition-ranking["']\)/);
	assert.doesNotMatch(genericSource, /productionOperations|acquisitionResolverOperations|buildSharedAcquisitionResolver/);
	assert.doesNotMatch(genericSource, /function (baselineWeaponDps|buildAcquisitionRanking|markdownReport|main)\(/);
	assert.doesNotMatch(genericSource, /calculateStats|loadPropertyCalculators/);
	assert.match(weaponSource, /require\(["']\.\/acquisition-ranking["']\)/);
	assert.match(weaponSource, /function buildAcquisitionRanking\(/);
	const evidence = loadRankingFixture();
	const data = loadSourceData();
	const shared = buildProductionAcquisitionResolver({ data, evidence });
	assert.deepEqual(shared.resolver.easiestRoute("blade"), {
		route_id: "starter:blade",
		kind: "starter",
		source_path: "design/character.js:character.starter.weapons",
		effort: 0,
	});
	const projected = compactRankingFixture(buildAcquisitionRanking({ evidence, data }));
	assert.equal(projected.weapons.length, 83);
	assert.equal(projected.weapons.filter((weapon) => weapon.origin === "retained").length, 75);
	assert.equal(projected.weapons.filter((weapon) => weapon.origin === "placeholder").length, 8);
	const retained = (weapon) => ({ weapon_id: weapon.weapon_id, selected_route_id: weapon.selected_route_id, selected_effort: weapon.selected_effort, rank: weapon.rank, assigned_requirement: weapon.assigned_requirement, exclusion: weapon.exclusion || null, availability_override_id: weapon.availability_override_id || null, dependency_chain: weapon.selected_route.dependency_route_ids || [] });
	assert.deepEqual(projected.weapons.map(retained), evidence.weapons.map(retained));
	for (const weapon of projected.weapons) {
		const route = shared.resolver.allRoutes(weapon.weapon_id).find((row) => row.route_id === weapon.selected_route_id);
		assert.ok(route, weapon.weapon_id);
		assert.equal(route.effort, weapon.selected_effort, weapon.weapon_id);
		assert.deepEqual(route.dependency_route_ids || [], weapon.selected_route.dependency_route_ids || [], weapon.weapon_id);
	}
});
