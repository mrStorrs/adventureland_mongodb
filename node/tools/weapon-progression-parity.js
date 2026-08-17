"use strict";

const fs = require("node:fs");
const path = require("node:path");
const authority = require("./direct-equipment-authority");

const PARITY_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-parity.json");
const LEGACY_BASELINE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-legacy-baseline.json");
const LEGACY_IDENTITY_BASELINE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-legacy-identity-baseline.json");

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
}

function weaponIdentity(item, weaponId) {
	const identity = JSON.parse(JSON.stringify(item));
	if (weaponId && weaponId.startsWith("wbook")) {
		identity.type = "source";
		delete identity.wtype;
		delete identity.damage_type;
		delete identity.projectile;
	}
	delete identity.class;
	delete identity.progression;
	delete identity.requirements;
	delete identity.damage;
	delete identity.attacks_per_second;
	if (identity.upgrade) delete identity.upgrade.damage;
	return canonical(identity);
}

function loadParityFixture(filename = PARITY_FIXTURE_PATH) {
	const fixture = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!fixture || fixture.schema_version !== 2 || fixture.diagnostic_only !== true || !Array.isArray(fixture.weapons) || !Array.isArray(fixture.states)) throw new Error("Direct weapon parity fixture is invalid");
	return fixture;
}

function loadLegacyBaseline(filename = LEGACY_BASELINE_PATH) {
	const fixture = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!fixture || fixture.schema_version !== 2 || !Array.isArray(fixture.rows)) throw new Error("Historical weapon baseline is invalid");
	return fixture;
}

function loadLegacyIdentityBaseline(filename = LEGACY_IDENTITY_BASELINE_PATH) {
	const fixture = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!fixture || fixture.schema_version !== 1 || !Array.isArray(fixture.weapons)) throw new Error("Historical weapon identity baseline is invalid");
	return fixture;
}

function validateLegacyWeaponIdentity(data, fixture = loadLegacyIdentityBaseline()) {
	const missing = [];
	const changed = [];
	for (const row of fixture.weapons) {
		const item = data.items[row.weapon_id];
		if (!item) {
			missing.push(row.weapon_id);
			continue;
		}
		if (JSON.stringify(weaponIdentity(item, row.weapon_id)) !== JSON.stringify(row.identity)) changed.push(row.weapon_id);
	}
	return { missing, changed };
}

function validateParityFixture(fixture, data) {
	const expected = authority.buildParityFixture(data);
	if (JSON.stringify(fixture) !== JSON.stringify(expected)) throw new Error("Direct weapon parity fixture drifted from current direct runtime diagnostics");
	return { missingWeapons: [], unclassifiedWeapons: [] };
}

function buildParityReport({ data } = {}) {
	const source = data || require("./progression-benchmark").loadBenchmarkData();
	const fixture = authority.buildParityFixture(source);
	return { data: source, rows: fixture.weapons, states: fixture.states, contracts: { current_direct_runtime: { status: "diagnostic" }, historical_baseline: { status: "test-only" } } };
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--write")) {
		fs.writeFileSync(PARITY_FIXTURE_PATH, require("./fixture-serialization").serializeFixture(authority.buildParityFixture()));
		return;
	}
	validateParityFixture(loadParityFixture(), require("./progression-benchmark").loadBenchmarkData());
}

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { LEGACY_BASELINE_PATH, LEGACY_IDENTITY_BASELINE_PATH, PARITY_FIXTURE_PATH, buildParityReport, loadLegacyBaseline, loadLegacyIdentityBaseline, loadParityFixture, loadPropertyCalculators: authority.loadPropertyCalculators, main, validateLegacyWeaponIdentity, validateParityFixture, weaponIdentity };
