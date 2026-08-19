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

test("[AC-15] final data meets leveling, unlock superiority, and self-funding targets", () => {
	const rotation = { geometry: tunnelGeometry(), spawn: maps.tunnel.spawns[0], movementSpeed: mining.balance.rotation_speed };
	const report = miningBalanceReport(mining, skill_xp.merchant, rotation);
	assert.ok(report.copper_only_hours >= 1920 && report.copper_only_hours <= 2160, report.copper_only_hours);
	assert.ok(report.best_route_hours >= 624 && report.best_route_hours <= 744, report.best_route_hours);
	assert.ok(report.double_speed_hours >= 336, report.double_speed_hours);
	assert.ok(report.double_speed_hours > report.best_route_hours / 2, "ten-second rock respawns still constrain the 2x route");
	for (const band of report.unlock_bands.slice(1)) {
		for (const previous of band.previous_options) {
			assert.ok(band.expected_xp_per_hour > previous.expected_xp_per_hour, `${band.id} XP vs ${previous.id} with the newly unlocked tool`);
			assert.ok(band.expected_gold_per_hour > previous.expected_gold_per_hour, `${band.id} gold vs ${previous.id} with the newly unlocked tool`);
		}
		assert.ok(band.rotation_ores_per_hour > 0 && band.rotation_ores_per_hour <= band.expected_xp_per_hour / mining.tiers.find((tier) => tier.id === band.id).xp, `${band.id} executable rotation`);
		assert.ok(band.sale_fraction_for_next_pickaxe <= 0.75, `${band.id} funding`);
	}
	assert.ok(report.unlock_bands[0].rotation_ores_per_hour > 0);
	assert.equal(mining.balance.action_overhead_ms, undefined);
	assert.equal(mining.balance.sell_multiplier, 0.6);
	assert.equal(mining.balance.rocks_per_tier, 3);
	const rockCadence = mining.balance.rocks_per_tier * (3600000 / mining.respawn_ms);
	for (const tier of mining.tiers) {
		assert.ok(successfulOresPerHour(mining, tier.index, tier.index, tier.level) <= rockCadence);
		assert.ok(rotationOresPerHour(mining, tier.index, tier.index, tier.level, rotation) <= successfulOresPerHour(mining, tier.index, tier.index, tier.level));
	}
});

test("[AC-16] every pickaxe preserves the old continuous bonus rate within five percent", () => {
	const rates = legacyBonusRates(mining);
	for (const row of rates) {
		assert.ok(Math.abs(row.relative_to_old - 1) <= 0.05, `${row.id}: ${row.relative_to_old}`);
		assert.deepEqual(row.relative_weights, { gemfragment: 200, bronzenugget: 1, goldnugget: 0.5, platinumnugget: 0.1 });
	}
});
