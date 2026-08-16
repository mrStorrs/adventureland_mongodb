"use strict";

const fs = require("node:fs");
const path = require("node:path");
const acquisition = require("./acquisition-ranking");
const authority = require("./direct-equipment-authority");
const { serializeFixture } = require("./fixture-serialization");

const RANKING_FIXTURE_PATH = path.resolve(__dirname, "../tests/fixtures/weapon-acquisition-ranking.json");
const SHARED_RANK_REQUIREMENTS = authority.REQUIREMENTS;
const COMBAT_SKILLS = authority.COMBAT_SKILLS;

function loadRankingFixture(filename = RANKING_FIXTURE_PATH) {
	const fixture = JSON.parse(fs.readFileSync(filename, "utf8"));
	if (!fixture || fixture.schema_version !== 6 || !fixture.policy || !Array.isArray(fixture.weapons) || fixture.counts?.weapons !== 83) throw new Error("Direct weapon acquisition fixture is invalid");
	return fixture;
}

function buildAcquisitionRanking({ data } = {}) {
	return authority.buildAcquisitionRanking(data || acquisition.loadSourceData());
}

function compactRankingFixture(fixture) {
	return fixture;
}

function validateRankingFixture(fixture, data) {
	const expected = buildAcquisitionRanking({ data });
	if (JSON.stringify(fixture) !== JSON.stringify(expected)) throw new Error("Direct weapon acquisition fixture drifted from catalog identity");
	return true;
}

function fullSheetContext({ weapon_id, level = 0, data = acquisition.loadSourceData() }) {
	const states = authority.weaponStates(data).filter((state) => state.weapon_id === weapon_id && state.level === level);
	if (states.length !== 1) throw new Error(`No direct weapon state for ${weapon_id}+${level}`);
	return states[0];
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--write-fixture")) {
		fs.writeFileSync(RANKING_FIXTURE_PATH, serializeFixture(buildAcquisitionRanking()));
		return;
	}
	if (!argv.includes("--verify")) throw new Error("Usage: node tools/weapon-acquisition-ranking.js --verify | --write-fixture");
	validateRankingFixture(loadRankingFixture());
}

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = {
	...acquisition,
	COMBAT_SKILLS,
	RANKING_FIXTURE_PATH,
	SHARED_RANK_REQUIREMENTS,
	buildAcquisitionRanking,
	compactRankingFixture,
	fullSheetContext,
	loadRankingFixture,
	main,
	validateRankingFixture,
};
