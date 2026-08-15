"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { buildEquipmentCombatMatrixFixture, validateEquipmentCombatMatrixFixture } = require("../tools/equipment-balance");
const { loadRankingFixture } = require("../tools/weapon-acquisition-ranking");

let checked;
let generated;

const GITHUB_BLOB_LIMIT_BYTES = 100 * 1024 * 1024;

function matrixFixture() {
	if (!checked) checked = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/equipment-combat-matrix.json"), "utf8"));
	return checked;
}

function generatedFixture() {
	if (!generated) generated = buildEquipmentCombatMatrixFixture();
	return generated;
}

test("the checked-in combat matrix stays compact enough to ship", () => {
	const fixturePath = path.join(__dirname, "fixtures/equipment-combat-matrix.json");
	const raw = fs.readFileSync(fixturePath, "utf8");
	assert.ok(Buffer.byteLength(raw) < GITHUB_BLOB_LIMIT_BYTES, "the fixture must remain below GitHub's 100 MiB blob limit");
	assert.equal(raw, `${JSON.stringify(matrixFixture())}\n`, "the exhaustive matrix must use deterministic compact JSON");
});

test("combat matrix freezes every read-only authority before evaluating rows", () => {
	const fixture = matrixFixture();
	assert.equal(fixture.frozen_authorities.length, 7);
	for (const row of fixture.frozen_authorities) {
		assert.equal(row.matches, true, row.authority_id);
		assert.equal(row.current_sha256, row.expected_sha256, row.authority_id);
		assert.match(row.current_sha256, /^[0-9a-f]{64}$/, row.authority_id);
	}
	assert.equal(fixture.hashes.whole_monster_sha256, fixture.hashes.current_whole_monster_sha256);
});

test("combat matrix covers all mobs, diagnostic reasons, canonical loadouts, and weapons", () => {
	const fixture = matrixFixture();
	const ranking = loadRankingFixture();
	assert.deepEqual(fixture.summary, {
		monsters: 129,
		hard_monsters: 47,
		diagnostic_monsters: 82,
		diagnostic_reasons: {
			cooperative: 18,
			event: 3,
			scripted_mechanic: 39,
			special: 22,
		},
		loadouts: fixture.loadouts.length,
		rows: fixture.loadouts.length * 129,
		hard_violations: fixture.violations.length,
		status: fixture.violations.length ? "failed" : "passed",
	});
	assert.ok(fixture.loadouts.length > 0);
	assert.equal(fixture.rows.length, fixture.loadouts.length * 129);
	assert.deepEqual([...new Set(fixture.loadouts.map((row) => row.skill))].sort(), ["mage", "paladin", "priest", "ranger", "rogue", "warrior"]);
	assert.deepEqual([...new Set(fixture.loadouts.map((row) => row.weight))].sort(), ["heavy", "light", "medium"]);
	assert.deepEqual([...new Set(fixture.loadouts.map((row) => row.slots.mainhand.name))].sort(), ranking.weapons.map((row) => row.weapon_id).sort());
	assert.equal(Object.keys(fixture.monsters).length, 129);
	assert.ok(Object.values(fixture.monsters).every((row) => row.classification === "hard" ? row.reason === null : typeof row.reason === "string" && row.reason.length > 0));
});

test("ordinary-solo outgoing TTK is diagnostic while incoming survival remains a hard gate", () => {
	const fixture = matrixFixture();
	const hardRows = fixture.rows.filter((row) => row.classification === "hard");
	assert.equal(hardRows.length, fixture.loadouts.length * 47);
	for (const row of hardRows) {
		assert.equal(row.outgoing_status, "diagnostic", `${row.monster_id}/${row.loadout_id} outgoing status`);
		assert.ok(Number.isFinite(row.ttk_ratio), `${row.monster_id}/${row.loadout_id} TTK ${row.ttk_ratio}`);
		assert.ok(row.survival_ratio >= 0.8 && row.survival_ratio <= 1.2, `${row.monster_id}/${row.loadout_id} survival ${row.survival_ratio}`);
		assert.equal(row.incoming_status, "hard", `${row.monster_id}/${row.loadout_id} incoming status`);
		assert.equal(row.incoming_pass, true, `${row.monster_id}/${row.loadout_id}`);
	}
	assert.deepEqual(fixture.violations, []);
	assert.equal(fixture.summary.hard_violations, 0);
	assert.equal(fixture.summary.status, "passed");
});

test("incoming survival mirrors basic monster piercing and critical expectation", () => {
	const fixture = matrixFixture();
	const expected = {
		iceroamer: { piercing: 320, critical_expectation: 1 },
		mole: { piercing: 320, critical_expectation: 1 },
		odino: { piercing: 25, critical_expectation: 1.05 },
		stoneworm: { piercing: 800, critical_expectation: 1 },
	};
	for (const [monsterId, values] of Object.entries(expected)) {
		const row = fixture.rows.find((candidate) => candidate.monster_id === monsterId);
		assert.equal(row.classification, "hard", monsterId);
		for (const side of ["current", "pinned"]) {
			const incoming = row[side].incoming;
			assert.equal(incoming.piercing, values.piercing, `${monsterId}/${side} piercing`);
			assert.equal(incoming.effective_defense, incoming.defense - incoming.piercing, `${monsterId}/${side} effective defense`);
			assert.equal(incoming.critical_expectation, values.critical_expectation, `${monsterId}/${side} critical expectation`);
			assert.ok(incoming.damage_per_second > 0 && incoming.time_to_defeat > 0, `${monsterId}/${side} finite expectation`);
		}
	}
});

test("diagnostic rows remain complete and non-gating without losing calculations", () => {
	const fixture = matrixFixture();
	const diagnosticRows = fixture.rows.filter((row) => row.classification === "diagnostic");
	assert.equal(diagnosticRows.length, fixture.loadouts.length * 82);
	assert.ok(diagnosticRows.every((row) => row.reason && row.outgoing_status === "diagnostic" && row.incoming_status === "diagnostic" && Number.isFinite(row.ttk_ratio) && Number.isFinite(row.survival_ratio)));
	for (const monsterId of Object.keys(fixture.monsters))
		assert.equal(fixture.rows.filter((row) => row.monster_id === monsterId).length, fixture.loadouts.length, monsterId);
});

test("combat matrix regeneration is deterministic", () => {
	assert.doesNotThrow(() => validateEquipmentCombatMatrixFixture(matrixFixture(), generatedFixture()));
	assert.deepEqual(buildEquipmentCombatMatrixFixture(), generatedFixture());
});
