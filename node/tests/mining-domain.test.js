"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { mining } = require("../../design/mining");
const { maps } = require("../../design/maps");
const { sprites } = require("../../design/sprites");
const {
	legacyBonusOpportunity,
	miningChance,
	miningDuration,
	normalizeRockState,
	publicRockState,
	rockTravelDistanceFromSpawn,
	selectRock,
	validateMiningData,
	validateRockReachability,
} = require("../game/mining");

const expectedTiers = [
	[0, "copper", "Copper", 1, "copperore", "pickaxe", 800, 5000, 20, 2000],
	[1, "iron", "Iron", 15, "ironore", "ironpickaxe", 1200, 4400, 100, 100000],
	[2, "gold", "Gold", 30, "goldore", "goldpickaxe", 1800, 3800, 500, 1000000],
	[3, "mithril", "Mithril", 55, "mithrilore", "mithrilpickaxe", 2800, 3200, 2000, 8000000],
	[4, "adamantite", "Adamantite", 70, "adamantiteore", "adamantitepickaxe", 4000, 2600, 8000, 35000000],
	[5, "runite", "Runite", 85, "runiteore", "runitepickaxe", 6000, 2000, 32000, 150000000],
];

function clone(value) {
	return structuredClone(value);
}

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

test("[AC-1] canonical Mining publication is exact, bounded, and fail-closed", () => {
	assert.equal(validateMiningData(mining), mining);
	assert.equal(validateMiningData(mining, { maps, sprites, geometry: { tunnel: tunnelGeometry() } }), mining);
	assert.equal(mining.version, 1);
	assert.equal(mining.respawn_ms, 10000);
	assert.deepEqual(
		mining.tiers.map((tier) => [
			tier.index,
			tier.id,
			tier.name,
			tier.level,
			tier.ore,
			tier.pickaxe,
			tier.xp,
			tier.duration_ms,
			tier.ore_g,
			tier.pickaxe_g,
		]),
		expectedTiers,
	);
	assert.deepEqual(mining.success, { base: 0.45, level_step: 0.005, tool_step: 0.06, min: 0.05, max: 0.95 });
	assert.deepEqual(mining.cape, { item: "miningcape", level: 99, bonus: 0.05, price: 99000000 });
	assert.deepEqual(mining.balance, { double_speed_multiplier: 2, rotation_speed: 50, sell_multiplier: 0.6, rocks_per_tier: 3 });
	assert.equal(mining.rocks.length, 18);
	assert.equal(new Set(mining.rocks.map((rock) => rock.id)).size, 18);
	assert.ok(mining.rocks.every((rock) => rock.map === "tunnel" && rock.range === 28));
	assert.deepEqual(mining.legacy_bonus.rewards, [
		[200, "gemfragment"],
		[1, "bronzenugget"],
		[0.5, "goldnugget"],
		[0.1, "platinumnugget"],
	]);

	const badTier = clone(mining);
	badTier.tiers[2].level = 31;
	assert.throws(() => validateMiningData(badTier), { code: "invalid_mining_tier", tier: "gold" });
	const duplicateRock = clone(mining);
	duplicateRock.rocks[1].id = duplicateRock.rocks[0].id;
	assert.throws(() => validateMiningData(duplicateRock), { code: "invalid_mining_rock", rock: "copper-1" });
	const badReward = clone(mining);
	badReward.legacy_bonus.rewards.push([1, "wbook1"]);
	assert.throws(() => validateMiningData(badReward), { code: "invalid_mining_bonus", reward: "wbook1" });
	const missingArt = clone(sprites);
	missingArt.mining_ores.matrix[0][0] = null;
	assert.throws(() => validateMiningData(mining, { sprites: missingArt }), { code: "invalid_mining_rock", rock: "copper-1" });
	const unreachable = clone(mining);
	unreachable.rocks[0].x = tunnelGeometry().max_x + 100;
	assert.throws(() => validateMiningData(unreachable, { maps, geometry: { tunnel: tunnelGeometry() } }), {
		code: "invalid_mining_rock",
		rock: "copper-1",
	});
});

test("[AC-4] chance, unlocks, lower-tool legality, and duration use the exact formula", () => {
	assert.equal(miningChance(mining, { level: 1, oreTier: 0, pickaxeTier: 0, hasCape: false }), 0.45);
	assert.equal(miningChance(mining, { level: 99, oreTier: 5, pickaxeTier: 0, hasCape: false }), 0.22);
	assert.equal(miningChance(mining, { level: 99, oreTier: 0, pickaxeTier: 5, hasCape: true }), 0.95);
	assert.equal(miningChance(mining, { level: 99, oreTier: 5, pickaxeTier: 5, hasCape: true }), 0.57);
	assert.equal(miningDuration(mining, 0), 5000);
	assert.equal(miningDuration(mining, 5), 2000);
	for (let tool = 0; tool < 6; tool += 1) {
		for (let ore = 0; ore < 6; ore += 1) {
			const chance = miningChance(mining, { level: 99, oreTier: ore, pickaxeTier: tool, hasCape: false });
			assert.ok(chance >= 0.05 && chance <= 0.95);
		}
	}
	assert.throws(() => miningChance(mining, { level: 29, oreTier: 2, pickaxeTier: 5, hasCape: false }), {
		code: "mining_level",
		rock: "gold",
	});
});

test("[AC-5] three rocks per tier progress through reachable Tunnel geometry with no zone fallback", () => {
	assert.deepEqual(maps.tunnel.mining_rocks, mining.rocks.map((rock) => rock.id));
	assert.equal((maps.tunnel.zones || []).some((zone) => zone.type === "mining"), false);
	assert.equal((maps.woffice.zones || []).some((zone) => zone.type === "mining"), false);
	for (const tier of mining.tiers) {
		const rocks = mining.rocks.filter((rock) => rock.tier === tier.index);
		assert.equal(rocks.length, 3, tier.id);
		assert.ok(rocks.every((rock) => validateRockReachability(tunnelGeometry(), maps.tunnel.spawns[0], rock)), tier.id);
		assert.ok(rocks.every((rock) => Number.isFinite(rockTravelDistanceFromSpawn(tunnelGeometry(), maps.tunnel.spawns[0], rock))), `${tier.id} route distances`);
	}
	const depths = mining.tiers.map((tier) => Math.max(...mining.rocks.filter((rock) => rock.tier === tier.index).map((rock) => rock.y)));
	for (let index = 1; index < depths.length; index += 1) assert.ok(depths[index] < depths[index - 1]);
});

test("[AC-10] account rock state preserves only known unexpired absolute timestamps", () => {
	const now = 1_000_000;
	assert.deepEqual(normalizeRockState(mining, undefined, now), {});
	const stored = {
		"copper-1": { available_at: new Date(now + 5000), claim_id: "claim-a" },
		"iron-1": { available_at: new Date(now - 1), claim_id: "expired" },
	};
	assert.deepEqual(normalizeRockState(mining, stored, now), { "copper-1": { available_at: now + 5000, claim_id: "claim-a" } });
	assert.deepEqual(publicRockState(mining, stored, now), { rocks: { "copper-1": now + 5000 } });
	assert.throws(() => normalizeRockState(mining, { madeup: { available_at: now + 1, claim_id: "x" } }, now), {
		code: "invalid_mining_state",
		rock: "madeup",
	});
	assert.throws(() => normalizeRockState(mining, { "copper-1": "tomorrow" }, now), {
		code: "invalid_mining_state",
		rock: "copper-1",
	});
});

test("[AC-6] selection preserves an explicit target and uses nearest only when omitted", () => {
	const copper = mining.rocks.filter((rock) => rock.tier === 0);
	const position = { map: "tunnel", x: copper[0].x, y: copper[0].y, level: 99, state: {}, now: 10 };
	assert.equal(selectRock(mining, { ...position, targetId: copper[0].id }).id, copper[0].id);
	assert.equal(selectRock(mining, position).id, copper[0].id);
	for (const targetId of [null, "", {}, "x".repeat(65)]) {
		assert.throws(() => selectRock(mining, { ...position, targetId }), { code: "mining_rock" });
	}
	assert.throws(() => selectRock(mining, { ...position, targetId: "runite-1" }), { code: "mining_range", rock: "runite-1" });
	assert.throws(
		() => selectRock(mining, { ...position, targetId: copper[0].id, state: { [copper[0].id]: { available_at: 9999, claim_id: "busy" } } }),
		{ code: "mining_depleted", rock: copper[0].id },
	);
});

test("[AC-14] Mining Cape adds exactly five points before the cap", () => {
	const withoutCape = miningChance(mining, { level: 99, oreTier: 5, pickaxeTier: 5, hasCape: false });
	const withCape = miningChance(mining, { level: 99, oreTier: 5, pickaxeTier: 5, hasCape: true });
	assert.ok(Math.abs(withCape - withoutCape - 0.05) < 1e-12);
	assert.equal(miningChance(mining, { level: 99, oreTier: 0, pickaxeTier: 5, hasCape: true }), 0.95);
});

test("[AC-16] legacy bonus opportunity is time-normalized without changing reward ratios", () => {
	for (const tier of mining.tiers) {
		const chance = miningChance(mining, { level: tier.level, oreTier: tier.index, pickaxeTier: tier.index, hasCape: false });
		const opportunity = legacyBonusOpportunity(mining, { durationMs: tier.duration_ms, successChance: chance });
		const oldPerMs = mining.legacy_bonus.old_success / mining.legacy_bonus.old_attempt_ms;
		assert.ok(Math.abs((opportunity * chance) / tier.duration_ms / oldPerMs - 1) <= 0.05, tier.id);
	}
	const weights = mining.legacy_bonus.rewards.map(([weight]) => weight);
	assert.deepEqual(weights.map((weight) => weight / weights[1]), [200, 1, 0.5, 0.1]);
});
