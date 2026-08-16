"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { calculateStats } = require("../game/stats");
const { loadSourceData } = require("../tools/acquisition-ranking");
const {
	buildDirectWeaponLoadoutBalanceFixture,
	validateDirectWeaponLoadoutBalanceFixture,
} = require("../tools/equipment-balance");
const { serializeFixture } = require("../tools/fixture-serialization");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");

const fixturePath = path.join(__dirname, "fixtures", "weapon-loadout-balance.json");

function fixture() {
	return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

test("all 83 visible weapons publish flat direct Damage and Attacks/Sec at every supported level", () => {
	const current = fixture();
	assert.equal(current.schema_version, 3);
	assert.deepEqual(current.policy.shared_rank_requirements, [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99]);
	assert.equal(current.counts.weapons, 83);
	assert.equal(current.counts.rank_bands, 11);
	assert.equal(current.weapon_states.length, 1079);
	for (const row of current.weapon_states) {
		assert.ok(Number.isFinite(row.damage) && row.damage > 0, `${row.weapon_id}+${row.level}:damage`);
		assert.ok(Number.isFinite(row.attacks_per_second) && row.attacks_per_second > 0, `${row.weapon_id}+${row.level}:attacks_per_second`);
		assert.equal(row.dps, row.damage * row.attacks_per_second, `${row.weapon_id}+${row.level}:dps`);
	}
});

test("direct runtime matches the approved base and fully enhanced weapon endpoints", () => {
	const data = loadSourceData();
	const calculators = loadPropertyCalculators(data);
	for (const rows of Object.values(Object.groupBy(fixture().weapon_states, (row) => row.weapon_id))) {
		for (const row of [rows[0], rows.at(-1)]) {
			const stats = calculateStats({
				slots: { mainhand: { name: row.weapon_id, level: row.level } },
				items: data.items,
				getItemProperties: calculators.current.calculate_item_properties,
			});
			assert.equal(stats.attack, row.damage, `${row.weapon_id}+${row.level}:damage`);
			assert.equal(stats.frequency, row.attacks_per_second, `${row.weapon_id}+${row.level}:attacks_per_second`);
			assert.equal(stats.attack * stats.frequency, row.dps, `${row.weapon_id}+${row.level}:dps`);
		}
	}
});

test("legal layouts remain complete and deterministic under direct weapon ownership", () => {
	const current = fixture();
	assert.equal(current.counts.legal_layouts, 744);
	assert.equal(current.legal_layouts.length, 744);
	assert.deepEqual(current.legal_layouts, [...current.legal_layouts].sort((left, right) => left.mainhand_id.localeCompare(right.mainhand_id) || String(left.offhand_id).localeCompare(String(right.offhand_id))));
	assert.doesNotThrow(() => validateDirectWeaponLoadoutBalanceFixture(current));
	assert.equal(serializeFixture(buildDirectWeaponLoadoutBalanceFixture()), fs.readFileSync(fixturePath, "utf8"));
});
