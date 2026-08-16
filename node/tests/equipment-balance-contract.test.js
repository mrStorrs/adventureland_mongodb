"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { loadSourceData } = require("../tools/acquisition-ranking");
const {
	buildVanillaBaseline,
	assertEqualWeightBudgets,
	assertNoStrictDomination,
	assertRatio,
	effectCap,
	loadEquipmentFixture,
	mapPercentileToLevel,
	buildEquipmentAcquisitionFixture,
	buildBalanceContract,
	buildApprovedSolveInput,
	constraintInventory,
	requiredSolveInventory,
	serializeFixture,
	solveBalanceContract,
	writeBalanceFixtures,
	writeEvidenceFixtures,
	validateBalanceContract,
	validateVanillaBaseline,
} = require("../tools/equipment-balance");

const armorSetBalance = JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures/armor-set-balance.json"), "utf8"));

const dominationFields = [...buildBalanceContract().core_fields, ...buildBalanceContract().effect_fields];
const PINNED_SET_THRESHOLDS = Object.freeze({
	rugged: { 1: {}, 2: { str: 1, dex: 1, int: 1 }, 3: { armor: 20, resistance: 20, range: 2 } },
	swift: { 1: {}, 2: { dex: 1 } },
	vampires: { 1: {}, 2: { vit: 10 }, 3: { lifesteal: 1 }, 4: {} },
	mmerchant: { 1: {}, 2: { vit: 6 } },
});

function addVector(left, right) {
	return Object.fromEntries(dominationFields.map((field) => [field, Number(left[field] || 0) + Number(right[field] || 0)]));
}

function cumulativeSetOracle(sets, set_id, count) {
	let total = Object.fromEntries(dominationFields.map((field) => [field, 0]));
	for (let threshold = 1; threshold <= count; threshold += 1) total = addVector(total, sets[set_id]?.[threshold] || {});
	return total;
}

function baseItemVector(item) {
	return Object.fromEntries(dominationFields.map((field) => [field, Math.round(Number(item[field] || 0))]));
}

function nonzero(vector) {
	return Object.fromEntries(Object.entries(vector).filter(([, value]) => value !== 0));
}

function completeSolveInput() {
	const baseline = buildVanillaBaseline();
	const inventory = requiredSolveInventory(baseline, loadEquipmentFixture("equipment-acquisition-ranking.json"));
	const denominators = baseline.normalization_denominators;
	const effectEnvelopes = new Map(baseline.effect_envelopes.map((row) => [`${row.effect}:${row.band}`, row]));
	const vectors = {
		heavy: { str: denominators.str, dex: 0, int: 0, vit: 0, hp: 0, mp: 0, armor: 0, resistance: 0 },
		medium: { str: 0, dex: denominators.dex, int: 0, vit: 0, hp: 0, mp: 0, armor: 0, resistance: 0 },
		light: { str: 0, dex: 0, int: denominators.int, vit: 0, hp: 0, mp: 0, armor: 0, resistance: 0 },
	};
	const budget_rows = inventory.budget.map((level) => ({ level: Number(level), vectors }));
	const combat_rows = inventory.combat.map((key) => ({ key, ids: [key], kind: "survival", ratio: 1 }));
	const set_bonus_rows = inventory.set_bonus.map((id) => ({ id, ratio: 0.2 }));
	const rank_rows = inventory.rank.map((key, index) => {
		const separator = key.lastIndexOf(":");
		return { id: key.slice(separator + 1), ladder_id: key.slice(0, separator), effort: index + 1, unlock: index + 1 };
	});
	const mob_rows = inventory.mob.map((id) => ({ id, classification: baseline.monsters[id].classification, reason: baseline.monsters[id].reason }));
	return {
		budget_vectors: vectors,
		budget_rows,
		denominators,
		effect_samples: inventory.effect.map((key) => {
			const separator = key.indexOf(":");
			const effect = key.slice(0, separator);
			const band = key.slice(separator + 1);
			const envelope = effectEnvelopes.get(key);
			return envelope.status === "capped"
				? { effect, band, values: envelope.local_sample_values, adjacent_values: envelope.adjacent_values, actual: envelope.cap, source: "pinned_envelope" }
				: { effect, band, values: envelope.local_sample_values, adjacent_values: envelope.adjacent_values, actual: 1, source: "reviewed_lower_value", reason: "Reviewed minimum preserves the required signature when pinned local and adjacent bands contain no positive sample." };
		}),
		domination_rows: inventory.domination.map((row) => ({ ...row, vector: { ...row.vector } })),
		combat_rows,
		set_bonus_rows,
		weapon_full_sheet_rows: inventory.weapon_full_sheet.map((row) => ({ ...row })),
		rank_rows,
		mob_rows,
	};
}

test("balance contract pins vanilla source authority and all monster classifications", () => {
	const baseline = loadEquipmentFixture("vanilla-equipment-baseline.json");
	assert.doesNotThrow(() => validateVanillaBaseline(baseline, buildVanillaBaseline()));
	assert.equal(Object.keys(baseline.monsters).length, 129);
	assert.equal(Object.keys(baseline.source_hashes).length, 6);
	assert.equal(baseline.role_rows.length, 420);
	const warriorOne = baseline.role_rows.find((row) => row.skill === "warrior" && row.level === 1);
	const warriorSeventy = baseline.role_rows.find((row) => row.skill === "warrior" && row.level === 70);
	assert.deepEqual(warriorOne.full_core, { str: 19, dex: 36, int: 10, vit: 9, hp: 1034, mp: 175, armor: 103, resistance: 43 });
	assert.deepEqual(warriorOne.target_core, { str: 8, dex: 0, int: 0, vit: 0, hp: 168, mp: 0, armor: 72, resistance: 31 });
	assert.equal(warriorSeventy.loadout.target_set_id, "wt4");
	assert.deepEqual(warriorSeventy.loadout.target_items.helmet, { item_id: "xhelmet", level: 0, stat_type: "str" });
	assert.notDeepEqual(warriorOne.core, warriorOne.class_core);
	assert.notDeepEqual(warriorSeventy.core, warriorSeventy.class_core);
	assert.ok(Object.values(warriorOne.loadout.target_items).every((item) => item.item_id || item.unavailable));
	for (const role of baseline.role_rows) for (const item of Object.values(role.loadout.target_items)) if (item.item_id) assert.ok(item.mapped_level === undefined || item.mapped_level <= role.level, `${role.skill}:${role.level}:${item.item_id}`);
	const mageSeventy = baseline.role_rows.find((row) => row.skill === "mage" && row.level === 70);
	assert.equal(mageSeventy.loadout.target_set_id, "mmage");
	assert.equal(mageSeventy.loadout.equipped_set_bonus.crit, 2);
	assert.equal(mageSeventy.loadout.equipped_set_bonus.phresistance, 25);
	assert.ok(Object.values(warriorSeventy.target_core).some((value) => value > 0));
	assert.equal(baseline.monsters.mrgreen.classification, "diagnostic");
	assert.equal(baseline.monsters.mrgreen.reason, "cooperative");
	assert.deepEqual(Object.fromEntries(["chestm", "rudolph", "goldenbot", "kitty1"].map((id) => [id, baseline.monsters[id].reason])), { chestm: "special", rudolph: "event", goldenbot: "scripted_mechanic", kitty1: "special" });
	assert.ok(Object.values(baseline.monsters).every((row) => row.context && Array.isArray(row.context.maps) && (row.classification === "hard" && row.reason === null || row.classification === "diagnostic" && ["cooperative", "special", "event", "boss_or_raid", "scripted_mechanic"].includes(row.reason))));
	assert.equal(baseline.weapon_ranges.length, 75);
	assert.ok(baseline.weapon_ranges.every((row) => row.states[0].level === 0 && row.states[0].range === row.base_range));
	assert.ok(Object.keys(baseline.slot_contribution_tables.base_armor).length > 0);
	assert.equal(baseline.allocation_vectors.length, 70);
	assert.ok(baseline.core_credit_exclusions.includes("for") && baseline.core_credit_exclusions.includes("gold") && baseline.core_credit_exclusions.includes("luck"));
	assert.ok(baseline.effect_envelopes.every((row) => row.sample_count === row.local_sample_values.length && row.sample_values.length >= row.sample_count && (row.status === "capped" ? row.cap > 0 : row.cap === null)));
	assert.deepEqual([...new Set(baseline.effect_envelopes.map((row) => row.effect))].sort(), buildBalanceContract().effect_fields.slice().sort());
	assert.ok(baseline.effect_envelopes.some((row) => row.status === "capped" && row.adjacent_band));
	assert.ok(baseline.effect_envelopes.some((row) => row.status === "capless"));
	assert.ok(baseline.completed_loadouts.every((row) => row.item_ids.length === 5 && row.filler_slots.every((filler) => filler.reason && filler.item_id) && row.equipped_set_counts));
	const furySeven = baseline.role_rows.find((row) => row.skill === "warrior" && row.level === 7);
	assert.deepEqual(furySeven.loadout.equipped_set_counts, { mwarrior: 5 });
	assert.deepEqual(nonzero(furySeven.loadout.equipped_set_bonus), { str: 5, crit: 5, speed: 1, apiercing: 40, phresistance: 25, stresistance: 20 });
	const swift = baseline.completed_loadouts.find((row) => row.set_id === "swift");
	assert.deepEqual(swift.equipped_set_counts, { rugged: 3, swift: 2 });
	assert.deepEqual(swift.set_bonus, addVector(cumulativeSetOracle(PINNED_SET_THRESHOLDS, "rugged", 3), cumulativeSetOracle(PINNED_SET_THRESHOLDS, "swift", 2)));
	assert.deepEqual(nonzero(swift.set_bonus), { str: 1, dex: 2, int: 1, armor: 20, resistance: 20, range: 2 });
	const vampires = baseline.completed_loadouts.find((row) => row.set_id === "vampires");
	assert.deepEqual(vampires.equipped_set_counts, { mmerchant: 2, vampires: 4 });
	assert.deepEqual(vampires.set_bonus, addVector(cumulativeSetOracle(PINNED_SET_THRESHOLDS, "mmerchant", 2), cumulativeSetOracle(PINNED_SET_THRESHOLDS, "vampires", 4)));
	assert.deepEqual(nonzero(vampires.set_bonus), { vit: 16, lifesteal: 1 });
	assert.deepEqual(baseline.completed_loadouts.find((row) => row.set_id === "mpx").item_ids, ["mmarmor", "mmgloves", "mmhat", "mmpants", "mmshoes"]);
	assert.ok(Object.keys(baseline.slot_contribution_tables.generic_stat_variants).length > 0);
	assert.equal(baseline.slot_contribution_tables.generic_stat_variants.stealthcape.str.str, 3);
	assert.equal(baseline.whole_monster_hash, baseline.current_whole_monster_hash);
	for (const row of baseline.role_rows) for (const field of Object.keys(row.core)) assert.equal(row.full_core[field] - row.frozen_core[field] - row.weapon_core[field], row.core[field], `${row.skill}:${row.level}:${field}`);
	for (const [index, vectors] of baseline.allocation_vectors.entries()) {
		const totals = Object.values(vectors).map((row) => row.normalized_total);
		assert.ok(totals.every((total) => Math.abs(total - totals[0]) < 1e-9));
		assert.deepEqual(vectors.heavy.paired_roles, ["warrior", "paladin"]);
		assert.deepEqual(vectors.medium.paired_roles, ["ranger", "rogue"]);
		assert.deepEqual(vectors.light.paired_roles, ["mage", "priest"]);
		assert.deepEqual(vectors.light.variants.dex.paired_roles, ["ranger", "rogue"]);
		assert.ok(Math.abs(vectors.light.variants.dex.normalized_total - vectors.light.normalized_total) < 1e-9);
		assert.deepEqual(vectors.light.variants.dex.survivability_reference, ["mage", "priest"]);
		if (index > 0) assert.notEqual(vectors.light.variants.dex.core.dex, vectors.light.variants.int.core.dex);
	}
});

test("balance contract maps boundaries and rejects a relaxed constraint", () => {
	assert.equal(mapPercentileToLevel(0), 1);
	assert.equal(mapPercentileToLevel(1), 70);
	assert.equal(mapPercentileToLevel(1, 99), 99);
	const contract = loadEquipmentFixture("equipment-balance-contract.json");
	assert.doesNotThrow(() => validateBalanceContract(contract));
	assert.throws(() => validateBalanceContract({ ...contract, weapon_same_rank_spread: 0.2 }), /spread/i);
	assert.deepEqual(contract.effect_fields, ["crit", "frequency", "speed", "range", "apiercing", "rpiercing", "lifesteal", "manasteal", "evasion", "reflection", "dreturn", "mp_reduction", "pnresistance", "firesistance", "fzresistance", "phresistance", "stresistance"]);
	assert.deepEqual(contract.set_signatures, {
		tiger: ["speed", "evasion"], fury: ["frequency", "apiercing"], legends: ["dreturn", "reflection"], wt3: ["pnresistance", "stresistance"], wt4: ["reflection", "firesistance"], mwarrior: ["crit", "apiercing"], mpaladin: ["lifesteal", "stresistance"], vampires: ["lifesteal", "manasteal"], swift: ["frequency", "evasion"], holidays: ["fzresistance", "stresistance"], wanderers: ["speed", "range"], rugged: ["pnresistance", "phresistance"], mranger: ["range", "apiercing"], mrogue: ["evasion", "crit"], mmerchant: ["dreturn", "speed"], mpx: ["mp_reduction", "manasteal"], mmage: ["rpiercing", "crit"], mpriest: ["mp_reduction", "stresistance"], bunny: ["speed", "reflection"],
	});
	assert.equal(contract.weight_budget_tolerance, 1e-9);
	assert.equal(contract.strict_domination.scope, "same_ladder_equal_or_easier");
	assert.equal(contract.weapon_shared_rank_count, 11);
	assert.deepEqual(contract.weapon_shared_rank_requirements, [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99]);
	assert.equal("weapon_crossover_minimum" in contract, false);
	assert.equal("weapon_crossover_maximum" in contract, false);
	assert.equal(contract.solver_status, "passed");
	assert.equal(contract.release_gates.weapon_full_sheet_rank.classification, "hard");
	assert.deepEqual(contract.release_gates.weapon_intermediate_enhancement, { classification: "diagnostic", evidence_fixture: "weapon-acquisition-ranking.json", constraints: ["target", "actual", "signed_error", "contributions"] });
	assert.equal(contract.release_gates.outgoing_ttk.classification, "diagnostic");
	assert.deepEqual(contract.release_gates.incoming_survival, { classification: "hard", evidence_fixture: "equipment-combat-matrix.json", ratio: [0.8, 1.2] });
	assert.deepEqual(contract.violations, []);
	assert.equal(contract.constraint_inventory.budget_levels.length, 70);
	assert.equal(contract.constraint_inventory.required_effects.length, 38);
	assert.deepEqual(contract.constraint_inventory.reviewed_lower_value_effects, [
		{ set_id: "legends", effect: "reflection", band: "power-41" },
		{ set_id: "wt3", effect: "pnresistance", band: "power-24" },
		{ set_id: "wt4", effect: "reflection", band: "power-41" },
		{ set_id: "wt4", effect: "firesistance", band: "power-41" },
		{ set_id: "mpaladin", effect: "lifesteal", band: "power-7" },
		{ set_id: "vampires", effect: "manasteal", band: "power-70" },
		{ set_id: "holidays", effect: "fzresistance", band: "power-6" },
		{ set_id: "rugged", effect: "pnresistance", band: "power-21" },
		{ set_id: "mpx", effect: "mp_reduction", band: "power-36" },
		{ set_id: "mpx", effect: "manasteal", band: "power-36" },
		{ set_id: "mpriest", effect: "mp_reduction", band: "power-36" },
		{ set_id: "bunny", effect: "reflection", band: "power-36" },
	]);
	assert.ok(contract.constraint_inventory.effect_envelopes.some((row) => row.status === "capless"));
	assert.deepEqual(contract.constraint_inventory, constraintInventory());
	assert.ok(contract.planned_items.every((item) => item.type && item.name && item.set && item.weight && item.asset));
});

test("budget, effect, domination, full-sheet rank, and combat solvers fail with stable violations", () => {
	const denominators = { str: 1, dex: 1, int: 1, vit: 1, hp: 1, mp: 1, armor: 1, resistance: 1 };
	assert.doesNotThrow(() => assertEqualWeightBudgets({ heavy: { str: 8 }, medium: { dex: 8 }, light: { int: 8 } }, denominators));
	assert.throws(() => assertEqualWeightBudgets({ heavy: { str: 8 }, medium: { dex: 7 }, light: { int: 8 } }, denominators), (error) => error.rule === "equal_weight_budget");
	assert.equal(effectCap([1, 2, 3, 100]), 3);
	assert.equal(effectCap([1], { allowAdjacent: [2, 100, 101] }), 101);
	assert.throws(() => effectCap([]), (error) => error.rule === "capless_effect");
	assert.throws(() => assertNoStrictDomination([{ id: "easy", effort: 1, ladder_id: "core", tie_band: 1, vector: { hp: 2 } }, { id: "hard", effort: 2, ladder_id: "core", tie_band: 1, vector: { hp: 1 } }]), (error) => error.rule === "strict_domination");
	assert.throws(() => assertNoStrictDomination([{ id: "easy-band", effort: 1, ladder_id: "core", tie_band: 1, vector: { hp: 2 } }, { id: "hard-band", effort: 2, ladder_id: "core", tie_band: 2, vector: { hp: 1 } }], null, { equalOrEasier: true }), (error) => error.rule === "strict_domination");
	assert.doesNotThrow(() => assertNoStrictDomination([{ id: "easy", effort: 1, ladder_id: "a", tie_band: 1, vector: { hp: 2 } }, { id: "other-ladder", effort: 2, ladder_id: "b", tie_band: 1, vector: { hp: 1 } }]));
	assert.throws(() => assertRatio("combat_ratio", 1.21, 0.8, 1.2, ["goo", "loadout"]), (error) => error.rule === "combat_ratio");
	const baseline = buildVanillaBaseline();
	const lastVectors = baseline.allocation_vectors.at(-1);
	assert.doesNotThrow(() => assertEqualWeightBudgets(Object.fromEntries(Object.entries(lastVectors).map(([weight, row]) => [weight, row.core])), baseline.normalization_denominators));
});

test("all rebalance fixtures serialize byte-identically on repeated generation", () => {
	for (const [name, builder] of [
		["equipment-acquisition-ranking.json", buildEquipmentAcquisitionFixture],
		["vanilla-equipment-baseline.json", buildVanillaBaseline],
		["equipment-balance-contract.json", buildBalanceContract],
	]) {
		const first = serializeFixture(builder());
		const second = serializeFixture(builder());
		assert.equal(first, second, name);
		assert.equal(first, require("node:fs").readFileSync(require("node:path").resolve(__dirname, "fixtures", name), "utf8"), name);
	}
});

test("the integrated balance solver accepts the locked contract and accumulates stable failures", () => {
	assert.throws(() => buildApprovedSolveInput(), (error) => error.code === "equipment_balance_input_required");
	const approved = buildApprovedSolveInput(completeSolveInput());
	const approvedResult = solveBalanceContract(approved);
	assert.deepEqual(approvedResult, { status: "passed", violations: [] });
	const candidateFury = approved.domination_rows.find((row) => row.id === "set:armor_sets:heavy:fury");
	const acquisition = loadEquipmentFixture("equipment-acquisition-ranking.json");
	const plannedSources = new Map(acquisition.planned_items.map((row) => [row.item_id, row.source_item_id]));
	const furyPieces = Object.values(acquisition.ladders.armor_set_details.fury.slots).map((alternatives) => alternatives[0].item_id);
	const furyRaw = furyPieces.reduce((total, item_id) => addVector(total, baseItemVector(loadSourceData().items[item_id] || loadSourceData().items[plannedSources.get(item_id)])), Object.fromEntries(dominationFields.map((field) => [field, 0])));
	const furyBonus = cumulativeSetOracle(loadSourceData().sets, "fury", 5);
	assert.deepEqual(candidateFury.vector, addVector(furyRaw, furyBonus));
	assert.deepEqual(nonzero(furyBonus), { ...armorSetBalance.sets.fury.cumulative[5].core, ...armorSetBalance.sets.fury.cumulative[5].effects });
	assert.equal(approved.budget_rows.length, 70);
	assert.equal(approved.effect_samples.length, 38);
	assert.equal(approved.mob_rows.length, 129);
	assert.equal("matrix" in approved, false);
	assert.ok(approved.combat_rows.length > 1);
	const selfAttestedSubset = { ...approved, budget_rows: approved.budget_rows.slice(0, 1), matrix: { budget: ["1"] } };
	assert.ok(solveBalanceContract(selfAttestedSubset).violations.some((row) => row.rule === "budget_completeness"));
	const result = solveBalanceContract({ ...approved, budget_vectors: { ...approved.budget_vectors, medium: { ...approved.budget_vectors.medium, str: approved.budget_vectors.medium.str - 1 } }, combat_rows: approved.combat_rows.slice(1) });
	assert.equal(result.status, "failed");
	assert.ok(result.violations.some((row) => row.rule === "combat_completeness"));
	assert.deepEqual(solveBalanceContract({}).violations.map((row) => row.rule), ["missing_solve_section"]);
	const substitutedSample = completeSolveInput();
	const cappedSample = substitutedSample.effect_samples.find((sample) => sample.actual > 0);
	cappedSample.values = [1];
	assert.ok(solveBalanceContract(substitutedSample).violations.some((row) => row.rule === "effect_evidence"));
	const spoofed = completeSolveInput();
	spoofed.denominators = { ...spoofed.denominators, str: spoofed.denominators.str + 1 };
	spoofed.domination_rows[0] = {
		...spoofed.domination_rows[0],
		ladder_id: "spoofed_ladder",
		tie_band: spoofed.domination_rows[0].tie_band + 1,
		effort: spoofed.domination_rows[0].effort + 1,
	};
	spoofed.rank_rows[0] = { ...spoofed.rank_rows[0], effort: Infinity };
	const spoofedRules = new Set(solveBalanceContract(spoofed).violations.map((row) => row.rule));
	assert.ok(spoofedRules.has("normalization_denominators"));
	assert.ok(spoofedRules.has("domination_metadata"));
	assert.ok(spoofedRules.has("finite_rank_row"));
	const substitutedVector = completeSolveInput();
	substitutedVector.domination_rows[0].vector.str += 1;
	assert.ok(solveBalanceContract(substitutedVector).violations.some((row) => row.rule === "domination_vector"));
	const extraCoordinate = completeSolveInput();
	extraCoordinate.domination_rows[0].vector.invented = 1;
	assert.ok(solveBalanceContract(extraCoordinate).violations.some((row) => row.rule === "domination_vector"));
	const outsideRankBand = completeSolveInput();
	outsideRankBand.weapon_full_sheet_rows[0].actual = outsideRankBand.weapon_full_sheet_rows[0].upper;
	assert.ok(solveBalanceContract(outsideRankBand).violations.some((row) => row.rule === "weapon_full_sheet_evidence"));
	const outgoingAsHardGate = completeSolveInput();
	outgoingAsHardGate.combat_rows[0].kind = "ttk";
	assert.ok(solveBalanceContract(outgoingAsHardGate).violations.some((row) => row.rule === "combat_classification"));
});

test("unsatisfied balance constraints cannot replace a fixture", () => {
	const writes = [];
	assert.throws(
		() => writeBalanceFixtures({ solve_input: { combat_rows: [{ ids: ["goo", "loadout"], ratio: 1.2 }] }, write: (...args) => writes.push(args) }),
		(error) => error.code === "equipment_balance_unsatisfied" && error.violations[0].rule === "missing_solve_section",
	);
	assert.deepEqual(writes, []);
	writeBalanceFixtures({ solve_input: completeSolveInput(), write: (...args) => writes.push(args) });
	assert.deepEqual(writes.map(([target]) => path.basename(target)).sort(), ["equipment-acquisition-ranking.json", "equipment-balance-contract.json", "vanilla-equipment-baseline.json"]);
});

test("planning evidence fixtures regenerate with the completed downstream solve contract", () => {
	const writes = [];
	const fixtures = writeEvidenceFixtures({ write: (...args) => writes.push(args) });
	assert.equal(fixtures["equipment-balance-contract.json"].solver_status, "passed");
	assert.deepEqual(writes.map(([target]) => path.basename(target)).sort(), ["equipment-acquisition-ranking.json", "equipment-balance-contract.json", "vanilla-equipment-baseline.json"]);
});

test("the solver CLI exits nonzero with the failed expression and never writes fixtures", () => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "equipment-balance-contract-"));
	try {
		const input = path.join(directory, "invalid.json");
		fs.writeFileSync(input, "{}\n");
		const result = childProcess.spawnSync(process.execPath, [path.resolve(__dirname, "../tools/equipment-balance.js"), "--verify", `--solve-input=${input}`], { encoding: "utf8" });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /missing_solve_section: budget_vectors/);
		assert.equal(fs.readdirSync(directory).join(","), "invalid.json");
	} finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});
