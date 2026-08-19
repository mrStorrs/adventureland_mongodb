"use strict";

const fs = require("node:fs");
const path = require("node:path");
const authority = require("./direct-equipment-authority");
const { serializeFixture } = require("./fixture-serialization");

const FIXTURE_DIRECTORY = path.resolve(__dirname, "../tests/fixtures");

function buildDirectWeaponLoadoutBalanceFixture() {
	return authority.buildWeaponLoadoutBalanceFixture();
}

function buildDirectArmorSetBalanceFixture(data) {
	return authority.buildArmorSetBalanceFixture(data);
}

function validateDirectWeaponLoadoutBalanceFixture(fixture, generated = buildDirectWeaponLoadoutBalanceFixture()) {
	if (!fixture || fixture.schema_version !== 4 || fixture.counts?.weapons !== 90 || fixture.counts?.rank_bands !== 7 || JSON.stringify(fixture) !== JSON.stringify(generated))
		throw new Error("Direct weapon loadout fixture drifted from the catalog");
	return true;
}

function validateDirectArmorSetBalanceFixture(fixture, generated = buildDirectArmorSetBalanceFixture()) {
	if (fixture?.violations?.length) throw new Error("Direct armor-set fixture contains violations");
	if (!fixture || fixture.schema_version !== 4 || fixture.counts?.sets !== 20 || fixture.counts?.tiered_sets !== 13 || fixture.counts?.tiers !== 6 || JSON.stringify(fixture) !== JSON.stringify(generated))
		throw new Error("Direct armor-set fixture drifted from the catalog");
	return true;
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--write-armor")) {
		const fixture = buildDirectArmorSetBalanceFixture();
		validateDirectArmorSetBalanceFixture(fixture, fixture);
		authority.writeFixture("armor-set-balance.json", fixture);
		return;
	}
	if (argv.includes("--write")) {
		fs.writeFileSync(path.join(FIXTURE_DIRECTORY, "weapon-loadout-balance.json"), serializeFixture(buildDirectWeaponLoadoutBalanceFixture()));
		return;
	}
	if (!argv.includes("--verify")) throw new Error("Usage: node tools/equipment-balance.js --verify | --write");
	validateDirectWeaponLoadoutBalanceFixture(JSON.parse(fs.readFileSync(path.join(FIXTURE_DIRECTORY, "weapon-loadout-balance.json"), "utf8")));
	validateDirectArmorSetBalanceFixture(JSON.parse(fs.readFileSync(path.join(FIXTURE_DIRECTORY, "armor-set-balance.json"), "utf8")));
}

if (require.main === module) {
	try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = {
	...authority,
	buildDirectArmorSetBalanceFixture,
	buildDirectWeaponLoadoutBalanceFixture,
	main,
	validateDirectArmorSetBalanceFixture,
	validateDirectWeaponLoadoutBalanceFixture,
};
