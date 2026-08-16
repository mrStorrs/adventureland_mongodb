"use strict";

const fs = require("node:fs");
const path = require("node:path");
const authority = require("./direct-equipment-authority");

const PARITY_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-parity.json");
const LEGACY_BASELINE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-progression-legacy-baseline.json");

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

module.exports = { LEGACY_BASELINE_PATH, PARITY_FIXTURE_PATH, buildParityReport, loadLegacyBaseline, loadParityFixture, loadPropertyCalculators: authority.loadPropertyCalculators, main, validateParityFixture };
