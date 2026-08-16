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

test("all 90 visible weapons publish flat direct Damage and Attacks/Sec at every supported level", () => {
	const current = fixture();
	assert.equal(current.schema_version, 4);
	assert.deepEqual(current.policy.shared_rank_requirements, [1, 20, 40, 60, 80, 90, 99]);
	assert.equal(current.counts.weapons, 90);
	assert.equal(current.counts.rank_bands, 7);
	assert.equal(current.counts.class_rank_rows, 42);
	for (const row of current.weapon_states) {
		assert.ok(Number.isFinite(row.damage) && row.damage > 0, `${row.weapon_id}+${row.level}:damage`);
		assert.ok(Number.isFinite(row.attacks_per_second) && row.attacks_per_second > 0, `${row.weapon_id}+${row.level}:attacks_per_second`);
		assert.equal(row.dps, row.damage * row.attacks_per_second, `${row.weapon_id}+${row.level}:dps`);
	}
});

test("each higher rank is strictly stronger at the same enhancement level", () => {
	const current = fixture();
	for (const skill of current.policy.combat_skills) {
		for (let level = 0; level <= 12; level += 1) {
			for (let rank = 1; rank < 7; rank += 1) {
				const lower = current.weapon_states.filter((row) => row.skill === skill && row.shared_rank === rank && row.level === level).map((row) => row.dps);
				const higher = current.weapon_states.filter((row) => row.skill === skill && row.shared_rank === rank + 1 && row.level === level).map((row) => row.dps);
				if (!lower.length || !higher.length) continue;
				assert.ok(Math.min(...higher) > Math.max(...lower), `${skill} rank ${rank}->${rank + 1} +${level}`);
			}
		}
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
	assert.equal(current.counts.legal_layouts, current.legal_layouts.length);
	assert.deepEqual(current.legal_layouts, [...current.legal_layouts].sort((left, right) => left.mainhand_id.localeCompare(right.mainhand_id) || String(left.offhand_id).localeCompare(String(right.offhand_id))));
	assert.doesNotThrow(() => validateDirectWeaponLoadoutBalanceFixture(current));
	assert.equal(serializeFixture(buildDirectWeaponLoadoutBalanceFixture()), fs.readFileSync(fixturePath, "utf8"));
});
