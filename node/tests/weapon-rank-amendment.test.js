"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadBenchmarkData } = require("../tools/progression-benchmark");
const { buildAcquisitionRanking, compactRankingFixture, fullSheetContext } = require("../tools/weapon-acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");

const fixturePath = path.resolve(__dirname, "fixtures/weapon-acquisition-ranking.json");
const baselinePath = path.resolve(__dirname, "fixtures/vanilla-equipment-baseline.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const skills = ["warrior", "paladin", "mage", "priest", "ranger", "rogue"];
const requirements = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
const referenceLevels = [1, 8, 15, 22, 29, 36, 42, 49, 56, 63, 70];
const placeholderBooks = ["wbook2", "wbook3", "wbook4", "wbook5", "wbook6", "wbook7", "wbook8", "wbook9"];

test("corrected weapon fixture regenerates exactly with 75 retained weapons and eight Priest placeholders", () => {
	const generated = buildAcquisitionRanking({ evidence: fixture });
	assert.deepEqual(compactRankingFixture(generated), fixture);
	assert.equal(fixture.schema_version, 4);
	assert.equal(fixture.counts.retained_weapons, 75);
	assert.equal(fixture.counts.placeholder_weapons, 8);
	assert.equal(fixture.counts.weapons, 83);
	assert.equal(fixture.exclusions.length, 5);
	assert.equal(fixture.policy.shared_rank_count, 11);
	assert.deepEqual(fixture.policy.shared_rank_requirements, requirements);
	assert.deepEqual(fixture.policy.reference_levels, referenceLevels);
	assert.equal("same_rank_maximum_ratio" in fixture.policy, false);
	assert.equal("weapon_crossover_minimum" in fixture.policy, false);
	assert.equal("weapon_crossover_maximum" in fixture.policy, false);
});

test("every combat skill publishes exactly eleven acquisition-monotone shared ranks", () => {
	const expectedCounts = {
		warrior: { retained: 15, progression: 11, sidegrade: 4, placeholder: 0 },
		paladin: { retained: 12, progression: 11, sidegrade: 1, placeholder: 0 },
		mage: { retained: 16, progression: 11, sidegrade: 5, placeholder: 0 },
		priest: { retained: 3, progression: 11, sidegrade: 0, placeholder: 8 },
		ranger: { retained: 15, progression: 11, sidegrade: 4, placeholder: 0 },
		rogue: { retained: 14, progression: 11, sidegrade: 3, placeholder: 0 },
	};
	for (const skill of skills) {
		const rows = fixture.weapons
			.filter((row) => row.skill === skill)
			.sort((left, right) => left.selected_effort - right.selected_effort || left.weapon_id.localeCompare(right.weapon_id));
		assert.deepEqual([...new Set(rows.map((row) => row.shared_rank))], requirements.map((_, index) => index + 1), skill);
		assert.ok(rows.every((row) => row.assigned_requirement === requirements[row.shared_rank - 1]), skill);
		assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].shared_rank <= row.shared_rank), skill);
		assert.ok(rows.every((row) => ["progression", "sidegrade"].includes(row.role)), skill);
		assert.deepEqual({
			retained: rows.filter((row) => row.origin === "retained").length,
			progression: rows.filter((row) => row.role === "progression").length,
			sidegrade: rows.filter((row) => row.role === "sidegrade").length,
			placeholder: rows.filter((row) => row.origin === "placeholder").length,
		}, expectedCounts[skill], skill);
		for (const rank of requirements.keys())
			assert.equal(rows.filter((row) => row.shared_rank === rank + 1 && row.role === "progression").length, 1, `${skill}:rank-${rank + 1}`);
	}
});

test("full-sheet endpoints include pinned class and equipment stats", () => {
	assert.deepEqual(fixture.policy.full_sheet_endpoints, baseline.weapon_rank_endpoint_oracle);
	const { start, end } = fixture.policy.full_sheet_endpoints;
	assert.equal(start.selection, "lowest-valid-level-1-starter");
	assert.equal(start.skill, "priest");
	assert.equal(start.mainhand_id, "wbook0");
	assert.equal(start.offhand_id, "wshield");
	assert.equal(start.reference_level, 1);
	assert.equal(start.sheet.attack, 24);
	assert.equal(start.sheet.frequency, 0.434862441928);
	assert.equal(start.base_dps, 10.4366986063);
	assert.equal(end.selection, "highest-valid-level-70-warrior-mainhand");
	assert.equal(end.skill, "warrior");
	assert.equal(end.mainhand_id, "scythe");
	assert.equal(end.offhand_id, null);
	assert.equal(end.reference_level, 70);
	assert.equal(end.sheet.attack, 478);
	assert.equal(end.sheet.frequency, 0.94535109369);
	assert.equal(end.base_dps, 451.877822784);
	assert.deepEqual(end.legacy_formula.attack, {
		class_base: 60,
		item_attack: 48,
		primary_multiplier: 7.7,
		item_scaled: 369.6,
		raw_item_and_profile: 48,
		priest_multiplier: 1,
		pre_output: 477.6,
		output_percent: 100,
		rounded: 478,
	});
	assert.deepEqual(end.legacy_formula.frequency, {
		class_base: 0.5,
		item_and_profile: -0.11,
		level: 0.426829268293,
		dex: 0.103125,
		int: 0.0253968253968,
		total: 0.94535109369,
	});
	for (const row of [start, end]) {
		assert.ok(row.class_core.str > 0, `${row.id} class STR`);
		assert.ok(row.equipment_core.str >= 0, `${row.id} equipment STR`);
		assert.equal(row.base_dps, Number((row.sheet.attack * row.sheet.frequency).toPrecision(12)), `${row.id} Base DPS`);
		assert.ok(row.source_items.mainhand && Array.isArray(row.source_items.armor), `${row.id} source loadout`);
		assert.match(row.source_hashes["design/items.js"], /^[0-9a-f]{40}$/, `${row.id} pinned items hash`);
	}
	assert.ok(end.equipment_core.str > 0, "the level-70 Warrior endpoint includes armor-supplied STR");
	assert.ok(end.base_dps > start.base_dps);
});

test("rank targets interpolate geometrically between exact full-sheet endpoints", () => {
	const { start, end } = fixture.policy.full_sheet_endpoints;
	const targets = fixture.policy.rank_targets;
	const boundaries = fixture.policy.rank_boundaries;
	const growth = Math.pow(end.base_dps / start.base_dps, 1 / 10);
	assert.equal(targets.length, 11);
	assert.equal(boundaries.length, 10);
	assert.equal(targets[0], start.base_dps);
	assert.equal(targets[10], end.base_dps);
	assert.equal(fixture.policy.growth_factor, Number(growth.toPrecision(12)));
	for (let index = 0; index < targets.length; index += 1) {
		const expected = start.base_dps * Math.pow(growth, index);
		assert.ok(Math.abs(targets[index] / expected - 1) < 1e-10, `rank-${index + 1}`);
		if (index) assert.ok(Math.abs(targets[index] / targets[index - 1] / growth - 1) < 1e-10, `growth-${index}`);
	}
	for (let index = 0; index < boundaries.length; index += 1)
		assert.ok(Math.abs(boundaries[index] / Math.sqrt(targets[index] * targets[index + 1]) - 1) < 1e-10, `boundary-${index + 1}`);
	const envelope = fixture.policy.core_allocation_envelope;
	const offensiveCoreTotal = (endpoint) => ["str", "dex", "int"].reduce((sum, field) => sum + endpoint.sheet[field], 0);
	assert.deepEqual(envelope.endpoints, { start: offensiveCoreTotal(start), end: offensiveCoreTotal(end) });
	assert.deepEqual(envelope.endpoints, { start: 72, end: 260 });
	assert.equal(envelope.ceilings.length, 11);
	assert.equal(envelope.exact_values.length, 11);
	const coreGrowth = Math.pow(envelope.endpoints.end / envelope.endpoints.start, 1 / 10);
	assert.equal(envelope.growth_factor, Number(coreGrowth.toPrecision(12)));
	for (let index = 0; index < envelope.ceilings.length; index += 1) {
		const exact = index === 0 ? envelope.endpoints.start : index === 10 ? envelope.endpoints.end : envelope.endpoints.start * Math.pow(coreGrowth, index);
		assert.ok(Math.abs(envelope.exact_values[index] / exact - 1) < 1e-10, `core-envelope-${index + 1}`);
		assert.equal(envelope.ceilings[index], index === 0 || index === 10 ? exact : Math.floor(envelope.exact_values[index]), `core-ceiling-${index + 1}`);
	}
});

test("every weapon is the nearest legal full-sheet candidate inside a strictly separated rank band", () => {
	const { rank_targets: targets, rank_boundaries: boundaries } = fixture.policy;
	for (const row of fixture.weapons) {
		const lower = row.shared_rank === 1 ? targets[0] : boundaries[row.shared_rank - 2];
		const upper = row.shared_rank === 11 ? targets[10] : boundaries[row.shared_rank - 1];
		assert.equal(row.assigned_dps_target, targets[row.shared_rank - 1], row.weapon_id);
		assert.equal(row.reference_level, referenceLevels[row.shared_rank - 1], row.weapon_id);
		assert.ok(row.solved_dps >= lower - 1e-12, `${row.weapon_id} lower boundary`);
		assert.ok(row.solved_dps <= upper + 1e-12, `${row.weapon_id} upper boundary`);
		assert.equal(row.quantization.target, row.assigned_dps_target, row.weapon_id);
		assert.equal(row.quantization.domain.rule, "endpoint-offensive-core-envelope", row.weapon_id);
		assert.equal(row.quantization.domain.rank_upper_boundary, upper, row.weapon_id);
		const ceiling = fixture.policy.core_allocation_envelope.ceilings[row.shared_rank - 1];
		assert.equal(row.quantization.domain.core_envelope.ceiling, ceiling, row.weapon_id);
		assert.equal(row.quantization.domain.core_envelope.exact_value, fixture.policy.core_allocation_envelope.exact_values[row.shared_rank - 1], row.weapon_id);
		assert.deepEqual(row.quantization.domain.core_envelope.endpoints, { start: 72, end: 260 }, row.weapon_id);
		assert.ok(row.solved_str + row.solved_int + row.solved_dex <= ceiling, `${row.weapon_id} core ceiling`);
		assert.match(row.quantization.domain.allocation_proof, /every nonnegative.*endpoint-derived total-core ceiling/i, row.weapon_id);
		assert.match(row.quantization.domain.attack_proof, /every legal allocation.*exact target bracket/i, row.weapon_id);
		assert.ok(Number.isSafeInteger(row.quantization.domain.allocation_count) && row.quantization.domain.allocation_count > 0, row.weapon_id);
		assert.ok(Number.isSafeInteger(row.quantization.domain.candidate_count) && row.quantization.domain.candidate_count > 0, row.weapon_id);
		assert.ok(row.full_sheet_context.zero_allocation_current_sheet, `${row.weapon_id} zero-allocation context`);
		assert.equal("source_core" in row.full_sheet_context, false, `${row.weapon_id} has no circular source core`);
		assert.equal("source_core_budget" in row.full_sheet_context, false, `${row.weapon_id} has no circular source budget`);
		assert.ok(row.quantization.lower.dps <= row.assigned_dps_target || row.quantization.lower.dps === row.quantization.upper.dps, `${row.weapon_id} lower candidate`);
		assert.ok(row.quantization.upper.dps >= row.assigned_dps_target || row.quantization.lower.dps === row.quantization.upper.dps, `${row.weapon_id} upper candidate`);
		const chosenDistance = Math.abs(Math.log(row.solved_dps / row.assigned_dps_target));
		for (const candidate of [row.quantization.lower, row.quantization.upper]) {
			const lowerPass = row.rank_band.lower_inclusive ? candidate.dps >= row.rank_band.lower - 1e-12 : candidate.dps > row.rank_band.lower + 1e-12;
			const upperPass = row.rank_band.upper_inclusive ? candidate.dps <= row.rank_band.upper + 1e-12 : candidate.dps < row.rank_band.upper - 1e-12;
			if (lowerPass && upperPass)
				assert.ok(chosenDistance <= Math.abs(Math.log(candidate.dps / row.assigned_dps_target)) + 1e-9, `${row.weapon_id} nearest legal candidate`);
		}
	}
	const wbook3 = fixture.weapons.find((row) => row.weapon_id === "wbook3");
	const data = loadBenchmarkData();
	const context = fullSheetContext(data, loadPropertyCalculators(data), baseline, wbook3);
	const candidate65 = context.evaluate(1, { str: 0, int: 65, dex: 0 });
	assert.ok(wbook3.quantization.domain.enumerated_maximum.int >= 65, "the complete derived domain includes the formerly omitted int=65 candidate");
	assert.ok(Number.isFinite(candidate65.dps) && candidate65.dps > 0, "int=65 remains an evaluated candidate after the endpoint shift");
	const legalCandidates = [];
	for (let int = 0; int <= wbook3.quantization.domain.core_envelope.ceiling; int += 1) {
		let attack = 1;
		while (context.evaluate(attack, { str: 0, int, dex: 0 }).dps < wbook3.assigned_dps_target) attack += 1;
		for (const bracketAttack of new Set([Math.max(1, attack - 1), attack])) {
			const candidate = context.evaluate(bracketAttack, { str: 0, int, dex: 0 });
			const lowerPass = wbook3.rank_band.lower_inclusive ? candidate.dps >= wbook3.rank_band.lower - 1e-12 : candidate.dps > wbook3.rank_band.lower + 1e-12;
			const upperPass = wbook3.rank_band.upper_inclusive ? candidate.dps <= wbook3.rank_band.upper + 1e-12 : candidate.dps < wbook3.rank_band.upper - 1e-12;
			if (lowerPass && upperPass) legalCandidates.push(candidate);
		}
	}
	legalCandidates.sort((left, right) => Math.abs(Math.log(left.dps / wbook3.assigned_dps_target)) - Math.abs(Math.log(right.dps / wbook3.assigned_dps_target)) || left.dps - right.dps || left.str + left.int + left.dex - right.str - right.int - right.dex || left.str - right.str || left.int - right.int || left.dex - right.dex || left.attack - right.attack);
	assert.deepEqual({ attack: wbook3.solved_attack, str: wbook3.solved_str, int: wbook3.solved_int, dex: wbook3.solved_dex }, { attack: legalCandidates[0].attack, str: legalCandidates[0].str, int: legalCandidates[0].int, dex: legalCandidates[0].dex }, "wbook3 uses the independently exhausted global optimum");
	for (let rank = 1; rank < 11; rank += 1) {
		const current = fixture.weapons.filter((row) => row.shared_rank === rank).map((row) => row.solved_dps);
		const next = fixture.weapons.filter((row) => row.shared_rank === rank + 1).map((row) => row.solved_dps);
		assert.ok(Math.max(...current) < Math.min(...next), `rank ${rank} strictly below rank ${rank + 1}`);
	}
});

test("Priest placeholders fill every gap between retained ranks one, six, and eleven", () => {
	const expected = new Map([
		["wbook0", 1],
		["wbook2", 2],
		["wbook3", 3],
		["wbook4", 4],
		["wbook5", 5],
		["wbook1", 6],
		["wbook6", 7],
		["wbook7", 8],
		["wbook8", 9],
		["wbook9", 10],
		["wbookhs", 11],
	]);
	for (const [weaponId, rank] of expected) {
		const row = fixture.weapons.find((candidate) => candidate.weapon_id === weaponId);
		assert.ok(row, weaponId);
		assert.equal(row.skill, "priest", weaponId);
		assert.equal(row.shared_rank, rank, weaponId);
	}
	assert.deepEqual(
		fixture.weapons.filter((row) => row.origin === "placeholder").map((row) => row.weapon_id).sort(),
		placeholderBooks,
	);

	const data = loadBenchmarkData();
	for (const weaponId of expected.keys()) {
		const definition = data.items[weaponId];
		assert.equal(definition.type, "weapon", weaponId);
		assert.equal(definition.wtype, "book", weaponId);
		assert.equal(definition.damage_type, "magical", weaponId);
		assert.equal(definition.projectile, "pmagic", weaponId);
		assert.deepEqual(data.itemRequirements[weaponId], [{ skill: "priest", level: requirements[expected.get(weaponId) - 1] }], weaponId);
	}
});
