"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { fixtureSha256, sha256 } = require("../tools/acquisition-ranking");
const { CONTRIBUTION_GROUP_ORDER, expandContributionEvidence, validateContributionCatalog } = require("../tools/contribution-evidence");

const root = path.resolve(__dirname, "../..");
const ranking = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/weapon-acquisition-ranking.json"), "utf8"));
const armor = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/armor-set-balance.json"), "utf8"));
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/vanilla-equipment-baseline.json"), "utf8"));
const skills = ["warrior", "paladin", "mage", "priest", "ranger", "rogue"];
const multipliers = { warrior: 1, paladin: .9, priest: .9, ranger: 1.1, rogue: 1.1, mage: 1.1 };
const referenceLevels = [1, 8, 15, 22, 29, 36, 42, 49, 56, 63, 70];
const upgradeWeights = [0, 1, 1, 1, 1, 1, 1, 1.25, 1.5, 2, 3, 1.25, 1.25];
const compoundWeights = [0, 1, 1, 1, 1, 1.25, 1.5, 2, 3, 3, 3];
const offensiveFields = ["str", "dex", "int"];
const armorTypes = new Set(["helmet", "chest", "pants", "gloves", "shoes"]);
const priestBookIds = ["wbook0", "wbook2", "wbook3", "wbook4", "wbook5", "wbook1", "wbook6", "wbook7", "wbook8", "wbook9", "wbookhs"];
let diagnosticRanking;

function generatedDiagnosticRanking() {
	if (!diagnosticRanking) {
		const { buildAcquisitionRanking } = require("../tools/weapon-acquisition-ranking");
		diagnosticRanking = buildAcquisitionRanking({ evidence: ranking, baseline, allowFixtureMigration: true, allowInfeasibleEvidence: true });
	}
	return diagnosticRanking;
}

function loadCatalog() {
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
	return { ...context, properties: (item) => context.calculate_item_properties(item) };
}

test("locked +0 targets use eleven exact class-split geometric ranks", () => {
	assert.equal(ranking.schema_version, 5);
	assert.deepEqual(ranking.policy.reference_levels, referenceLevels);
	assert.equal(ranking.policy.shared_rank_count, 11);
	assert.equal(ranking.hashes.protected_weapon_identity_sha256, "0ff4bf81a682a65cea95be330aab698d6fef9ecda48913368daac9faf3317675");
	assert.equal(ranking.policy.warrior_rank_start, 50);
	assert.equal(ranking.policy.warrior_rank_end, 450);
	assert.ok(Math.abs(ranking.policy.growth_factor - Math.pow(9, 1 / 10)) < 1e-12);
	assert.deepEqual(ranking.policy.class_multipliers, multipliers);
	for (const skill of skills) {
		const targets = ranking.policy.rank_targets_by_skill[skill];
		assert.equal(targets.length, 11, skill);
		for (let index = 0; index < targets.length; index += 1) {
			const exact = 50 * Math.pow(9, index / 10) * multipliers[skill];
			assert.ok(Math.abs(targets[index] / exact - 1) < 1e-10, `${skill}:rank-${index + 1}`);
		}
		for (const row of ranking.weapons.filter((candidate) => candidate.skill === skill))
			assert.equal(row.assigned_dps_target, targets[row.shared_rank - 1], row.weapon_id);
	}
	assert.equal(ranking.policy.rank_targets_by_skill.warrior[0], 50);
	assert.equal(ranking.policy.rank_targets_by_skill.warrior[10], 450);
	assert.equal(ranking.policy.rank_targets_by_skill.paladin[0], 45);
	assert.equal(ranking.policy.rank_targets_by_skill.priest[10], 405);
	assert.equal(ranking.policy.rank_targets_by_skill.ranger[0], 55);
	assert.equal(ranking.policy.rank_targets_by_skill.mage[10], 495);
});

test("enhancement evidence covers every class, rank, upgrade, and compound state", () => {
	const generated = generatedDiagnosticRanking();
	assert.equal(generated.enhancement_feasibility.status, "passed");
	assert.deepEqual(generated.policy.enhancement.hard_publication_states, [
		{ upgrade_level: 0, compound_level: 0, role: "base" },
		{ upgrade_level: 12, compound_level: 10, role: "fully_enhanced" },
	]);
	assert.equal(generated.policy.enhancement.diagnostic_state_count_per_rank, 141);
	assert.equal(generated.policy.enhancement.intermediate_target_distance_gate, false);
	assert.deepEqual(generated.policy.enhancement.upgrade_levels, upgradeWeights.map((_, level) => level));
	assert.deepEqual(generated.policy.enhancement.compound_levels, compoundWeights.map((_, level) => level));
	assert.deepEqual(generated.policy.enhancement.upgrade_step_weights, upgradeWeights);
	assert.deepEqual(generated.policy.enhancement.compound_step_weights, compoundWeights);
	assert.equal(generated.policy.enhancement.cumulative_upgrade_weight, 16.25);
	assert.equal(generated.policy.enhancement.cumulative_compound_weight, 17.75);
	assert.equal(generated.enhancement_full_sheet_rows.length, skills.length * 11);
	let hardStates = 0;
	let diagnosticStates = 0;
	for (const row of generated.enhancement_full_sheet_rows) {
		assert.equal(row.reference_level, referenceLevels[row.shared_rank - 1], row.id);
		assert.equal(row.states.length, upgradeWeights.length * compoundWeights.length, row.id);
		for (const state of row.states) {
			const isBase = state.upgrade_level === 0 && state.compound_level === 0;
			const isMaximum = state.upgrade_level === 12 && state.compound_level === 10;
			assert.ok(state.upgrade_level >= 0 && state.upgrade_level <= 12, row.id);
			assert.ok(state.compound_level >= 0 && state.compound_level <= 10, row.id);
			assert.ok(Number.isFinite(state.target_dps) && state.target_dps > 0, row.id);
			assert.ok(Number.isFinite(state.actual_dps) && state.actual_dps > 0, row.id);
			assert.equal(state.signed_error, state.actual_dps - state.target_dps, row.id);
			assert.equal(state.absolute_relative_error, Math.abs(state.signed_relative_error), row.id);
			const warriorTarget = generated.enhancement_warrior_targets[row.shared_rank - 1].states.find((candidate) => candidate.upgrade_level === state.upgrade_level && candidate.compound_level === state.compound_level).target_dps;
			assert.ok(Math.abs(state.target_dps / (warriorTarget * multipliers[row.skill]) - 1) < 1e-10, row.id);
			assert.ok(Number.isFinite(state.actual_sheet_attack), row.id);
			assert.ok(Number.isFinite(state.actual_sheet_frequency), row.id);
			if (isBase || isMaximum) {
				hardStates += 1;
				assert.equal(state.release_gate, "hard", row.id);
				assert.equal(state.publication_state, isBase ? "base" : "fully_enhanced", row.id);
				assert.ok(state.quantization?.lower && state.quantization?.upper && state.quantization?.chosen, row.id);
			} else {
				diagnosticStates += 1;
				assert.equal(state.release_gate, "diagnostic", row.id);
				assert.equal(state.publication_state, "intermediate", row.id);
				assert.equal(state.quantization, null, row.id);
				assert.equal(state.diagnostic_reason, "unchanged_vanilla_enhancement_surface", row.id);
			}
		}
	}
	assert.equal(hardStates, skills.length * 11 * 2);
	assert.equal(diagnosticStates, skills.length * 11 * 141);
	assert.equal(generated.enhancement_feasibility.hard_states, hardStates);
	assert.equal(generated.enhancement_feasibility.diagnostic_states, diagnosticStates);
	assert.equal(generated.enhancement_feasibility.hard_endpoint_violations, 0);
	assert.equal(generated.enhancement_feasibility.target_multiplier_violations, 0);
	assert.equal(generated.enhancement_feasibility.invalid_output_violations, 0);
	assert.equal(generated.enhancement_feasibility.monotonicity_violations, 0);
});

test("mixed enhancement mismatch remains diagnostic without changing the class line", () => {
	const generated = generatedDiagnosticRanking();
	const row = generated.enhancement_full_sheet_rows.find((candidate) => candidate.skill === "mage" && candidate.shared_rank === 1);
	const state = row.states.find((candidate) => candidate.upgrade_level === 0 && candidate.compound_level === 10);
	const warriorState = generated.enhancement_warrior_targets[0].states.find((candidate) => candidate.upgrade_level === 0 && candidate.compound_level === 10);
	assert.ok(Math.abs(state.target_dps / (warriorState.target_dps * 1.1) - 1) < 1e-10);
	assert.equal(state.release_gate, "diagnostic");
	assert.equal(state.publication_state, "intermediate");
	assert.equal(state.quantization, null);
	assert.ok(state.actual_dps > state.target_dps);
	assert.equal(state.signed_error, state.actual_dps - state.target_dps);
	assert.equal(generated.enhancement_feasibility.status, "passed");
});

test("all enhancement surfaces are finite, positive, and monotonic on both axes", () => {
	const generated = generatedDiagnosticRanking();
	for (const row of generated.enhancement_full_sheet_rows) {
		const states = new Map(row.states.map((state) => [`${state.upgrade_level}:${state.compound_level}`, state]));
		for (let upgrade = 0; upgrade <= 12; upgrade += 1) {
			for (let compound = 0; compound <= 10; compound += 1) {
				const state = states.get(`${upgrade}:${compound}`);
				assert.ok(Number.isFinite(state.actual_dps) && state.actual_dps > 0, `${row.id}:+${upgrade}/+${compound}`);
				if (upgrade) assert.ok(state.actual_dps + 1e-12 >= states.get(`${upgrade - 1}:${compound}`).actual_dps, `${row.id}:upgrade:+${upgrade}/+${compound}`);
				if (compound) assert.ok(state.actual_dps + 1e-12 >= states.get(`${upgrade}:${compound - 1}`).actual_dps, `${row.id}:compound:+${upgrade}/+${compound}`);
			}
		}
	}
});

test("every retained and placeholder Priest book uses upgrade enchantments", () => {
	const catalog = loadCatalog();
	const generated = generatedDiagnosticRanking();
	const expectedNonattack = {
		wbook0: { int: 5 },
		wbook1: { int: 5, reflection: 1, vit: 2 },
		wbook2: { int: 5 },
		wbook3: { int: 5 },
		wbook4: { int: 5 },
		wbook5: { int: 5 },
		wbook6: { int: 5 },
		wbook7: { int: 5 },
		wbook8: { int: 5 },
		wbook9: { int: 5 },
		wbookhs: { dex: 6, resistance: 30, vit: 6 },
	};
	const rows = generated.weapons.filter((row) => row.skill === "priest").sort((left, right) => left.shared_rank - right.shared_rank);
	assert.deepEqual(rows.map((row) => row.weapon_id), priestBookIds);
	assert.equal(rows.filter((row) => row.origin === "placeholder").length, 8);
	for (const row of rows) {
		const definition = catalog.items[row.weapon_id];
		assert.equal(row.enhancement_kind, "upgrade", row.weapon_id);
		assert.ok(definition.upgrade, `${row.weapon_id}:upgrade`);
		assert.equal(definition.compound, undefined, `${row.weapon_id}:compound`);
		assert.deepEqual(Object.fromEntries(Object.entries(definition.upgrade).filter(([field]) => field !== "attack")), expectedNonattack[row.weapon_id], row.weapon_id);
	}
	const priestRankEleven = generated.enhancement_full_sheet_rows.find((row) => row.skill === "priest" && row.shared_rank === 11);
	const low = priestRankEleven.states.find((state) => state.upgrade_level === 0 && state.compound_level === 10);
	const high = priestRankEleven.states.find((state) => state.upgrade_level === 12 && state.compound_level === 10);
	const lowEvidence = expandContributionEvidence(low.rebalanced_contributions, generated.enhancement_contribution_catalog, { validateCatalog: false });
	const highEvidence = expandContributionEvidence(high.rebalanced_contributions, generated.enhancement_contribution_catalog, { validateCatalog: false });
	assert.notEqual(lowEvidence.groups.weapon.totals.attack, highEvidence.groups.weapon.totals.attack);
});

test("locked fully-enhanced endpoint targets are preserved exactly", () => {
	const generated = generatedDiagnosticRanking();
	assert.deepEqual(generated.policy.enhancement_source_hashes, baseline.source_hashes);
	assert.deepEqual(generated.policy.enhancement_evidence_hashes, baseline.evidence_hashes);
	assert.deepEqual(Object.keys(generated.policy.enhancement_source_hashes).sort(), ["design/classes.js", "design/items.js", "design/monsters.js", "design/upgrades.js", "js/old_common_functions.js", "node/server.js"]);
	assert.deepEqual(generated.policy.enhancement.fully_enhanced_targets, {
		paladin: { rank_1: 292.107184015, rank_11: 4618.2147526 },
		priest: { rank_1: 292.107184015, rank_11: 4618.2147526 },
		warrior: { rank_1: 324.563537794, rank_11: 5131.34972512 },
		ranger: { rank_1: 357.019891573, rank_11: 5644.48469763 },
		rogue: { rank_1: 357.019891573, rank_11: 5644.48469763 },
		mage: { rank_1: 357.019891573, rank_11: 5644.48469763 },
	});
	const first = generated.enhancement_warrior_targets[0].states.at(-1);
	const last = generated.enhancement_warrior_targets[10].states.at(-1);
	assert.deepEqual([first.upgrade_level, first.compound_level, first.target_dps], [12, 10, 324.563537794]);
	assert.deepEqual([last.upgrade_level, last.compound_level, last.target_dps], [12, 10, 5131.34972512]);
});

test("every pinned and rebalanced enhancement state carries verifiable contribution evidence", () => {
	const generated = generatedDiagnosticRanking();
	assert.doesNotThrow(() => validateContributionCatalog(baseline.enhancement_contribution_catalog));
	assert.doesNotThrow(() => validateContributionCatalog(generated.enhancement_contribution_catalog));
	const mutatedCatalog = JSON.parse(JSON.stringify(generated.enhancement_contribution_catalog));
	mutatedCatalog.items[0].properties.attack = Number(mutatedCatalog.items[0].properties.attack || 0) + 1;
	assert.throws(() => validateContributionCatalog(mutatedCatalog), /catalog hash drifted|catalog item .* drifted/);
	const mutatedState = JSON.parse(JSON.stringify(generated.enhancement_full_sheet_rows[0].states[0].rebalanced_contributions));
	mutatedState.group_refs[1] = mutatedState.group_refs[0];
	assert.throws(
		() => expandContributionEvidence(mutatedState, generated.enhancement_contribution_catalog, { validateCatalog: false }),
		/Contribution (?:loadout|aggregate) hash drifted/,
	);
	assert.equal(baseline.evidence_hashes.enhancement_contribution_catalog_sha256, baseline.enhancement_contribution_catalog.catalog_sha256);
	assert.equal(generated.hashes.enhancement_contribution_catalog_sha256, generated.enhancement_contribution_catalog.catalog_sha256);
	assert.equal(
		baseline.evidence_hashes.weapon_rank_enhancement_contributions_sha256,
		sha256(baseline.weapon_rank_enhancement_oracle.map((row) => row.states.map((state) => state.contributions.contributions_sha256))),
	);
	assert.equal(
		generated.hashes.enhancement_full_sheet_contributions_sha256,
		fixtureSha256(generated.enhancement_full_sheet_rows.map((row) => row.states.map((state) => state.rebalanced_contributions.contributions_sha256))),
	);
	for (const row of baseline.weapon_rank_enhancement_oracle) {
		assert.equal(row.states.length, 143, `pinned:rank-${row.shared_rank}`);
		for (const state of row.states) {
			const evidence = expandContributionEvidence(state.contributions, baseline.enhancement_contribution_catalog, { validateCatalog: false });
			assert.deepEqual(Object.keys(evidence.groups), CONTRIBUTION_GROUP_ORDER, `pinned:rank-${row.shared_rank}:${state.upgrade_level}/${state.compound_level}`);
			assert.ok(evidence.groups.class.items.length && evidence.groups.weapon.items.length, `pinned:rank-${row.shared_rank}`);
		}
	}
	for (const row of generated.enhancement_full_sheet_rows) {
		assert.equal(row.states.length, 143, row.id);
		for (const state of row.states) {
			const evidence = expandContributionEvidence(state.rebalanced_contributions, generated.enhancement_contribution_catalog, { validateCatalog: false });
			assert.deepEqual(Object.keys(evidence.groups), CONTRIBUTION_GROUP_ORDER, `${row.id}:${state.upgrade_level}/${state.compound_level}`);
			assert.ok(evidence.groups.class.items.length && evidence.groups.weapon.items.length, row.id);
			for (const field of offensiveFields) assert.equal(Number(evidence.groups.armor.totals[field] || 0), 0, `${row.id}:${state.upgrade_level}/${state.compound_level}:${field}`);
		}
	}
});

test("published rebalanced armor has no offensive attributes at any supported level", () => {
	const catalog = loadCatalog();
	assert.equal(armor.schema_version, 2);
	for (const [itemId, row] of Object.entries(armor.items)) {
		if (!armorTypes.has(row.type)) continue;
		for (const field of offensiveFields) assert.equal(Number(catalog.items[itemId][field] || 0), 0, `${itemId}:base:${field}`);
		for (const kind of ["upgrade", "compound"])
			for (const field of ["stat", ...offensiveFields]) assert.equal(Number(catalog.items[itemId][kind]?.[field] || 0), 0, `${itemId}:${kind}:${field}`);
		const maximum = catalog.items[itemId].compound ? 10 : catalog.items[itemId].upgrade ? 12 : 0;
		for (let level = 0; level <= maximum; level += 1) {
			const properties = catalog.properties({ name: itemId, level, stat_type: "str" });
			for (const field of offensiveFields) assert.equal(Number(properties[field] || 0), 0, `${itemId}:+${level}:${field}`);
		}
		assert.ok(row.offense_removal, `${itemId}:offense-removal evidence`);
	}
	for (const [setId, row] of Object.entries(armor.sets))
		for (const threshold of [2, 3, 4, 5])
			for (const field of offensiveFields) assert.equal(Number(row.increments[threshold][field] || 0), 0, `${setId}:${threshold}:${field}`);
});

test("locked generation fails closed when a target cannot be bracketed", () => {
	const { solveNearestSheetTarget } = require("../tools/weapon-acquisition-ranking");
	assert.throws(
		() => solveNearestSheetTarget({ id: "warrior:rank-1:+12/+10", target: 324.563537794, evaluate: () => ({ dps: Number.NaN }) }),
		(error) => error.code === "weapon_target_unrepresentable" && error.class_rank_state === "warrior:rank-1:+12/+10" && error.target === 324.563537794,
	);
	assert.throws(
		() => solveNearestSheetTarget({ id: "priest:rank-11:+12/+10", target: 4618.2147526, evaluate: () => ({ dps: 100 }) }),
		(error) => error.code === "weapon_target_unrepresentable" && error.lower.dps === 100 && error.upper.dps === 100 && error.signed_error === 100 - 4618.2147526,
	);
});

test("feasibility rejects a nonmonotonic diagnostic surface", () => {
	const { assertEnhancementFeasibility, enhancementFeasibilityReport } = require("../tools/weapon-acquisition-ranking");
	const generated = generatedDiagnosticRanking();
	const rows = JSON.parse(JSON.stringify(generated.enhancement_full_sheet_rows));
	const row = rows.find((candidate) => candidate.skill === "mage" && candidate.shared_rank === 1);
	const base = row.states.find((candidate) => candidate.upgrade_level === 0 && candidate.compound_level === 0);
	const next = row.states.find((candidate) => candidate.upgrade_level === 1 && candidate.compound_level === 0);
	next.actual_dps = base.actual_dps - 1;
	const report = enhancementFeasibilityReport(rows, generated.enhancement_contribution_catalog);
	assert.equal(report.status, "failed");
	assert.ok(report.monotonicity_violations.length > 0);
	assert.throws(
		() => assertEnhancementFeasibility(report),
		(error) => error.code === "weapon_enhancement_nonmonotonic" && error.class_rank_state.startsWith("mage:rank-1"),
	);
});

test("publication writers reject every locked-contract mutation before I/O", { timeout: 240000 }, () => {
	const { writeArmorPublication } = require("../tools/equipment-balance");
	const { writeRankingPublication } = require("../tools/weapon-acquisition-ranking");
	const generated = generatedDiagnosticRanking();
	const itemsFilename = path.join(root, "design/items.js");
	const requirementsFilename = path.join(root, "design/item_requirements.js");
	const itemsSource = fs.readFileSync(itemsFilename, "utf8");
	const warriorRankOne = generated.enhancement_full_sheet_rows.find((row) => row.skill === "warrior" && row.shared_rank === 1);
	const priestRankEleven = generated.enhancement_full_sheet_rows.find((row) => row.skill === "priest" && row.shared_rank === 11);
	const maximum = warriorRankOne.states.find((state) => state.upgrade_level === 12 && state.compound_level === 10);
	const diagnostic = warriorRankOne.states.find((state) => state.upgrade_level === 1 && state.compound_level === 0);
	const priestBook = generated.weapons.find((weapon) => weapon.weapon_id === "wbookhs");

	function replace(target, field, value) {
		const hadField = Object.hasOwn(target, field);
		const previous = target[field];
		target[field] = value;
		return () => {
			if (hadField) target[field] = previous;
			else delete target[field];
		};
	}

	const rankingMutations = [
		{
			name: "hard endpoint",
			mutate: () => replace(maximum, "target_dps", 1000000000),
			expected: (error) => error.code === "weapon_target_unrepresentable" && error.target === 1000000000,
		},
		{
			name: "state class multiplier",
			mutate: () => replace(warriorRankOne, "class_multiplier", 0.9),
			expected: (error) => error.code === "weapon_target_multiplier_drift" && error.class_rank_state === "warrior:rank-1:+0/+0",
		},
		{
			name: "policy class multiplier",
			mutate: () => replace(generated.policy.class_multipliers, "priest", 1),
			expected: (error) => error.code === "weapon_publication_bundle_invalid" && error.message === "Weapon ranking publication bundle drifted: class multipliers changed",
		},
		{
			name: "invalid output",
			mutate: () => replace(diagnostic, "actual_dps", Number.NaN),
			expected: (error) => error.code === "weapon_enhancement_invalid_output" && error.class_rank_state === "warrior:rank-1:+1/+0",
		},
		{
			name: "contribution hash",
			mutate: () => replace(generated.hashes, "enhancement_full_sheet_contributions_sha256", "0".repeat(64)),
			expected: (error) => error.code === "weapon_publication_hash_drift" && error.message === "Weapon ranking publication contribution hashes drifted",
		},
		{
			name: "current acquisition source hash",
			mutate: () => replace(generated.source_artifact_hashes, "design/events.js", "0".repeat(64)),
			expected: (error) => error.code === "weapon_publication_bundle_invalid" && error.message === "Weapon ranking publication bundle drifted: design/events.js source hash changed",
		},
		{
			name: "pinned enhancement source hash",
			mutate: () => replace(generated.policy.enhancement_source_hashes, "design/classes.js", "0".repeat(40)),
			expected: (error) => error.code === "weapon_publication_bundle_invalid" && error.message === "Weapon ranking publication bundle drifted: pinned enhancement hashes changed",
		},
		{
			name: "Priest book identity",
			mutate: () => replace(priestBook, "weapon_type", "wand"),
			expected: (error) => error.code === "weapon_publication_bundle_invalid" && error.message.startsWith("Weapon ranking publication bundle drifted:"),
		},
	];
	const writers = [
		{
			name: "ranking",
			run(write, read) {
				return writeRankingPublication(generated, { itemsFilename, requirementsFilename, write, read });
			},
		},
		{
			name: "armor",
			run(write, read) {
				return writeArmorPublication({ fixture: armor, ranking: generated, itemsFilename, write, read });
			},
		},
	];

	for (const writer of writers) {
		for (const mutation of rankingMutations) {
			const restore = mutation.mutate();
			let writes = 0;
			try {
				assert.throws(() => writer.run(() => { writes += 1; }), mutation.expected, `${writer.name}:${mutation.name}`);
				assert.equal(writes, 0, `${writer.name}:${mutation.name}`);
			} finally {
				restore();
			}
		}
	}

	const sourceMutations = [
		{
			name: "projectile identity",
			statement: "items.bow.projectile='publication-drift';",
			expected: (error) => error.code === "weapon_publication_identity_drift" && error.message === "Weapon publication protected identity drifted from pinned authority",
		},
		{
			name: "raw Priest enhancement kind",
			statement: "items.wbook0.compound=items.wbook0.upgrade;delete items.wbook0.upgrade;",
			expected: (error) => error.code === "priest_book_publication_identity_drift" && error.message === "Priest book wbook0 raw publication must use upgrade without compound",
		},
		...[...offensiveFields, "stat"].map((field) => ({
			name: `armor ${field}`,
			statement: `items.tigerhelmet.${field}=1;`,
			expected: (error) => error.code === "armor_publication_source_drift" && error.message === "Armor publication source drifted from deterministic offense-free authority",
		})),
		{
			name: "cape authority field",
			statement: "items.angelwings.armor=123;",
			expected: (error) => error.code === "armor_publication_source_drift" && error.message === "Armor publication source drifted from deterministic offense-free authority",
		},
		{
			name: "unexpected armor combat field",
			statement: "items.tigerhelmet.attack=123;",
			expected: (error) => error.code === "armor_publication_source_drift" && error.message === "Armor publication source drifted from deterministic offense-free authority",
		},
		{
			name: "extra set threshold",
			statement: "sets.tiger[1]={hp:123};",
			expected: (error) => error.code === "armor_publication_source_drift" && error.message === "Armor publication source drifted from deterministic offense-free authority",
		},
	];
	for (const writer of writers) {
		for (const mutation of sourceMutations) {
			let writes = 0;
			const read = (filename, encoding) => path.resolve(filename) === itemsFilename
				? `${itemsSource}\n${mutation.statement}\n`
				: fs.readFileSync(filename, encoding);
			assert.throws(() => writer.run(() => { writes += 1; }, read), mutation.expected, `${writer.name}:${mutation.name}`);
			assert.equal(writes, 0, `${writer.name}:${mutation.name}`);
		}
	}

	const armorItem = Object.values(armor.items).find((row) => armorTypes.has(row.type));
	const restoreArmor = replace(armorItem.base_core, "str", 1);
	let armorWrites = 0;
	try {
		assert.throws(
			() => writeArmorPublication({ fixture: armor, ranking: generated, itemsFilename, write: () => { armorWrites += 1; } }),
			(error) => error.code === "armor_publication_fixture_invalid" && error.message === "Armor publication fixture drifted from deterministic generation",
		);
		assert.equal(armorWrites, 0, "armor:offensive attribute");
	} finally {
		restoreArmor();
	}
});
