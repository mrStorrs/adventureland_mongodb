"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { mining } = require("../../design/mining");
const { maps } = require("../../design/maps");
const { skill_xp } = require("../../design/skill_xp");
const { legacyBonusRates, miningBalanceReport, rotationOresPerHour, successfulOresPerHour } = require("../game/mining");

function tunnelGeometry() {
	const seed = fs.readFileSync(path.resolve(__dirname, "../../seeds/maps.ejson"), "utf8");
	const line = seed.split("\n").find((entry) => entry.includes('"_id":"MP_jayson_miningtunnel_new"'));
	assert.ok(line, "Tunnel geometry seed exists");
	function unwrap(value) {
		if (Array.isArray(value)) return value.map(unwrap);
		if (!value || typeof value !== "object") return value;
		if (Object.hasOwn(value, "$numberInt")) return Number(value.$numberInt);
		if (Object.hasOwn(value, "$numberLong")) return Number(value.$numberLong);
		if (Object.hasOwn(value, "$numberDouble")) return Number(value.$numberDouble);
		return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, unwrap(child)]));
	}
	return unwrap(JSON.parse(line)).info.data;
}

test("[AC-2, AC-3, AC-8] Mining keeps the locked flat action rate, Warrior gates, and raw-sale premium", () => {
	assert.deepEqual(mining.tiers.map((tier) => tier.level), [1, 20, 40, 60, 80, 90]);
	assert.ok(mining.tiers.every((tier) => tier.duration_ms === 5000));
	assert.equal(mining.success.chance, 0.125);
	assert.equal(3600000 / 5000 * mining.success.chance, 90);
	const expectedRawSalePerHour = [56250, 75000, 112500, 150000, 187500, 250000];
	for (const [index, tier] of mining.tiers.entries()) {
		assert.ok(Math.abs(90 * tier.ore_g * mining.balance.sell_multiplier - expectedRawSalePerHour[index]) <= 30, tier.id);
		assert.equal(tier.xp > 0, true);
	}
});

test("[AC-16] every pickaxe preserves the old continuous bonus rate within five percent", () => {
	const rates = legacyBonusRates(mining);
	for (const row of rates) {
		assert.ok(Math.abs(row.relative_to_old - 1) <= 0.05, `${row.id}: ${row.relative_to_old}`);
		assert.deepEqual(row.relative_weights, { gemfragment: 200, bronzenugget: 1, goldnugget: 0.5, platinumnugget: 0.1 });
	}
});
