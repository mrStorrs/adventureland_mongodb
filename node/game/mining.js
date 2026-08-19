"use strict";

const crypto = require("node:crypto");

const EXPECTED_TIERS = Object.freeze([
	[0, "copper", "Copper", 1, "copperore", "pickaxe", 800, 5000, 20, 2000],
	[1, "iron", "Iron", 15, "ironore", "ironpickaxe", 1200, 4400, 100, 100000],
	[2, "gold", "Gold", 30, "goldore", "goldpickaxe", 1800, 3800, 500, 1000000],
	[3, "mithril", "Mithril", 55, "mithrilore", "mithrilpickaxe", 2800, 3200, 2000, 8000000],
	[4, "adamantite", "Adamantite", 70, "adamantiteore", "adamantitepickaxe", 4000, 2600, 8000, 35000000],
	[5, "runite", "Runite", 85, "runiteore", "runitepickaxe", 6000, 2000, 32000, 150000000],
]);
const BONUS_IDS = Object.freeze(["gemfragment", "bronzenugget", "goldnugget", "platinumnugget"]);

function fail(code, message, details = {}) {
	const error = new Error(message);
	error.code = code;
	Object.assign(error, details);
	return error;
}

function clamp(minimum, maximum, value) {
	return Math.max(minimum, Math.min(maximum, value));
}

function rockIndex(data) {
	return new Map(data.rocks.map((rock) => [rock.id, rock]));
}

function tierForTool(data, itemName) {
	return data.tiers.find((tier) => tier.pickaxe === itemName) || null;
}

function tierForRock(data, rock) {
	return data.tiers[rock.tier];
}

function validateMiningData(data, catalogs = {}) {
	if (!data || typeof data !== "object") throw fail("invalid_mining_data", "Mining data must be an object");
	if (data.version !== 1 || data.respawn_ms !== 10000 || data.refresh_ms !== 1000 || data.map !== "tunnel") {
		throw fail("invalid_mining_data", "Mining version, timing, or map is invalid");
	}
	if (JSON.stringify(data.success) !== JSON.stringify({ base: 0.45, level_step: 0.005, tool_step: 0.06, min: 0.05, max: 0.95 })) {
		throw fail("invalid_mining_data", "Mining success constants differ from the canonical contract");
	}
	if (JSON.stringify(data.cape) !== JSON.stringify({ item: "miningcape", level: 99, bonus: 0.05, price: 99000000 })) {
		throw fail("invalid_mining_data", "Mining Cape differs from the canonical contract");
	}
	if (
		!data.balance ||
		data.balance.double_speed_multiplier !== 2 ||
		data.balance.rotation_speed !== 50 ||
		data.balance.sell_multiplier !== 0.6 ||
		data.balance.rocks_per_tier !== 3
	) {
		throw fail("invalid_mining_data", "Mining balance constants differ from the canonical contract");
	}
	if (!Array.isArray(data.tiers) || data.tiers.length !== EXPECTED_TIERS.length) {
		throw fail("invalid_mining_tier", "Mining must contain exactly six tiers");
	}
	for (let index = 0; index < EXPECTED_TIERS.length; index += 1) {
		const tier = data.tiers[index];
		const expected = EXPECTED_TIERS[index];
		const actual = tier && [tier.index, tier.id, tier.name, tier.level, tier.ore, tier.pickaxe, tier.xp, tier.duration_ms, tier.ore_g, tier.pickaxe_g];
		if (JSON.stringify(actual) !== JSON.stringify(expected) || tier.art_column !== index) {
			throw fail("invalid_mining_tier", `Invalid Mining tier ${tier?.id || index}`, { tier: tier?.id || String(index) });
		}
	}
	if (!Array.isArray(data.rocks) || data.rocks.length !== 18) {
		throw fail("invalid_mining_rock", "Mining must contain exactly eighteen rocks");
	}
	const seen = new Set();
	const tierCounts = Array(6).fill(0);
	for (const rock of data.rocks) {
		if (!rock || typeof rock.id !== "string" || seen.has(rock.id)) {
			throw fail("invalid_mining_rock", `Duplicate or malformed Mining rock ${rock?.id || "unknown"}`, { rock: rock?.id });
		}
		seen.add(rock.id);
		if (
			rock.map !== "tunnel" ||
			!Number.isInteger(rock.tier) ||
			rock.tier < 0 ||
			rock.tier >= data.tiers.length ||
			rock.id !== `${data.tiers[rock.tier].id}-${tierCounts[rock.tier] + 1}` ||
			!Number.isFinite(rock.x) ||
			!Number.isFinite(rock.y) ||
			rock.range !== 28 ||
			typeof rock.available_art !== "string" ||
			typeof rock.depleted_art !== "string"
		) {
			throw fail("invalid_mining_rock", `Invalid Mining rock ${rock.id}`, { rock: rock.id });
		}
		tierCounts[rock.tier] += 1;
	}
	if (tierCounts.some((count) => count !== 3)) throw fail("invalid_mining_rock", "Each Mining tier must have three rocks");
	const bonus = data.legacy_bonus;
	if (!bonus || bonus.old_attempt_ms !== 7440000 || bonus.old_success !== 0.2 || !Array.isArray(bonus.rewards)) {
		throw fail("invalid_mining_bonus", "Legacy Mining bonus policy is malformed");
	}
	if (
		JSON.stringify(bonus.rewards) !==
		JSON.stringify([
			[200, "gemfragment"],
			[1, "bronzenugget"],
			[0.5, "goldnugget"],
			[0.1, "platinumnugget"],
		])
	) {
		const offending = bonus.rewards.find((entry) => !Array.isArray(entry) || !BONUS_IDS.includes(entry[1]));
		throw fail("invalid_mining_bonus", "Legacy Mining bonus rewards differ from the approved whitelist", {
			reward: offending && offending[1],
		});
	}
	if (catalogs.items) {
		for (const tier of data.tiers) {
			const ore = catalogs.items[tier.ore];
			const pickaxe = catalogs.items[tier.pickaxe];
			if (!ore || !pickaxe) {
				throw fail("invalid_mining_tier", `Mining tier ${tier.id} references a missing item`, { tier: tier.id });
			}
			if (ore.s !== 9999 || ore.g !== tier.ore_g || ore.exclusive !== true || pickaxe.g !== tier.pickaxe_g || pickaxe.wtype !== "pickaxe" || (tier.index > 0 && pickaxe.exclusive !== true) || pickaxe.breaks !== undefined || pickaxe.upgrade !== undefined || JSON.stringify(pickaxe.purchase_requirement) !== JSON.stringify({ skill: "mining", level: tier.level })) {
				throw fail("invalid_mining_tier", `Mining item contract differs for ${tier.id}`, { tier: tier.id });
			}
		}
		const cape = catalogs.items[data.cape.item];
		if (!cape || cape.g !== data.cape.price || cape.mining_bonus !== data.cape.bonus || cape.exclusive !== true || JSON.stringify(cape.purchase_requirement) !== JSON.stringify({ skill: "mining", level: data.cape.level })) throw fail("invalid_mining_data", "Mining Cape item is invalid");
	}
	if (catalogs.maps) {
		const tunnel = catalogs.maps[data.map];
		if (!tunnel || JSON.stringify(tunnel.mining_rocks) !== JSON.stringify(data.rocks.map((rock) => rock.id)) || (tunnel.zones || []).some((zone) => zone.type === "mining") || (catalogs.maps.woffice?.zones || []).some((zone) => zone.type === "mining")) {
			throw fail("invalid_mining_data", "Mining map catalog is invalid");
		}
	}
	if (catalogs.npcs) {
		const heathcliff = catalogs.npcs.gemmerchant;
		const stock = data.tiers.map((tier) => tier.pickaxe).concat(data.cape.item);
		if (!heathcliff || heathcliff.quest !== "gemfragment" || JSON.stringify(heathcliff.items) !== JSON.stringify(stock)) throw fail("invalid_mining_data", "Mine Heathcliff Mining stock or quest is invalid");
	}
	if (catalogs.sprites) {
		const publishedArt = new Set(
			Object.values(catalogs.sprites).flatMap((sheet) =>
				Array.isArray(sheet?.matrix) ? sheet.matrix.flat().filter((entry) => typeof entry === "string" && entry) : [],
			),
		);
		for (const rock of data.rocks) {
			if (!publishedArt.has(rock.available_art) || !publishedArt.has(rock.depleted_art)) {
				throw fail("invalid_mining_rock", `Mining rock ${rock.id} references unpublished art`, { rock: rock.id });
			}
		}
	}
	if (catalogs.geometry) {
		const geometry = catalogs.geometry[data.map];
		const spawn = catalogs.maps?.[data.map]?.spawns?.[0];
		if (!geometry || !Array.isArray(spawn)) throw fail("invalid_mining_data", "Mining map geometry or spawn is missing");
		for (const rock of data.rocks) {
			if (!validateRockReachability(geometry, spawn, rock)) {
				throw fail("invalid_mining_rock", `Mining rock ${rock.id} is unreachable`, { rock: rock.id });
			}
		}
	}
	return data;
}

function miningChance(data, { level, oreTier, pickaxeTier, hasCape = false }) {
	const ore = data.tiers[oreTier];
	const tool = data.tiers[pickaxeTier];
	if (!ore) throw fail("mining_rock", "Unknown ore tier", { rock: String(oreTier) });
	if (!tool) throw fail("mining_tool", "Unknown pickaxe tier", { tool: String(pickaxeTier) });
	if (!Number.isInteger(level) || level < ore.level || level > 99) {
		throw fail("mining_level", `Mining level ${ore.level} is required for ${ore.name}`, { rock: ore.id, required: ore.level });
	}
	const raw = data.success.base + data.success.level_step * (level - ore.level) + data.success.tool_step * (pickaxeTier - oreTier) + (hasCape && level >= data.cape.level ? data.cape.bonus : 0);
	return Number(clamp(data.success.min, data.success.max, raw).toFixed(12));
}

function miningDuration(data, pickaxeTier) {
	const tier = data.tiers[pickaxeTier];
	if (!tier) throw fail("mining_tool", "Unknown pickaxe tier", { tool: String(pickaxeTier) });
	return tier.duration_ms;
}

function normalizeTimestamp(value) {
	if (value instanceof Date) return value.getTime();
	if (typeof value === "number" && Number.isSafeInteger(value)) return value;
	return NaN;
}

function normalizeRockState(data, stored, now = Date.now()) {
	if (stored === undefined || stored === null) return {};
	if (!stored || typeof stored !== "object" || Array.isArray(stored)) throw fail("invalid_mining_state", "Mining rock state must be an object");
	const known = rockIndex(data);
	const rocks = {};
	for (const [id, record] of Object.entries(stored)) {
		if (!known.has(id)) throw fail("invalid_mining_state", `Unknown Mining rock ${id}`, { rock: id });
		if (!record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).some((key) => !["available_at", "claim_id"].includes(key))) {
			throw fail("invalid_mining_state", `Malformed Mining state for ${id}`, { rock: id });
		}
		const availableAt = normalizeTimestamp(record.available_at);
		if (!Number.isSafeInteger(availableAt) || availableAt < 0 || typeof record.claim_id !== "string" || !record.claim_id || record.claim_id.length > 128) {
			throw fail("invalid_mining_state", `Malformed Mining state for ${id}`, { rock: id });
		}
		if (availableAt > now) rocks[id] = { available_at: availableAt, claim_id: record.claim_id };
	}
	return rocks;
}

function publicRockState(data, stored, now = Date.now()) {
	const normalized = normalizeRockState(data, stored, now);
	return { rocks: Object.fromEntries(Object.entries(normalized).map(([id, record]) => [id, record.available_at])) };
}

function distance(left, right) {
	return Math.hypot(left.x - right.x, left.y - right.y);
}

function selectRock(data, { map, x, y, level, state, targetId, now = Date.now() }) {
	const normalized = normalizeRockState(data, state, now);
	const byId = rockIndex(data);
	function eligible(rock, explicit) {
		if (!rock) throw fail("mining_rock", "Unknown Mining rock", { rock: targetId });
		if (rock.map !== map) throw fail("mining_map", "Mining rock is on another map", { rock: rock.id });
		if (distance({ x, y }, rock) > rock.range) {
			if (explicit) throw fail("mining_range", "Mining rock is out of range", { rock: rock.id });
			return false;
		}
		const tier = tierForRock(data, rock);
		if (!Number.isInteger(level) || level < tier.level) {
			if (explicit) throw fail("mining_level", `Mining level ${tier.level} is required`, { rock: tier.id, required: tier.level });
			return false;
		}
		if (normalized[rock.id]) {
			if (explicit) throw fail("mining_depleted", "Mining rock is depleted", { rock: rock.id, available_at: normalized[rock.id].available_at });
			return false;
		}
		return true;
	}
	if (targetId !== undefined) {
		if (typeof targetId !== "string" || !targetId || targetId.length > 64) {
			throw fail("mining_rock", "Mining target ID is invalid", {
				rock: typeof targetId === "string" ? targetId.slice(0, 64) : "invalid",
			});
		}
		const rock = byId.get(targetId);
		eligible(rock, true);
		return rock;
	}
	const nearest = data.rocks
		.filter((rock) => eligible(rock, false))
		.sort((left, right) => distance({ x, y }, left) - distance({ x, y }, right) || left.id.localeCompare(right.id))[0];
	if (!nearest) throw fail("mining_rock", "No eligible available Mining rock is in range");
	return nearest;
}

function inventoryHasCapacity(character, itemName, inventoryCanAccept) {
	return typeof inventoryCanAccept === "function" ? Boolean(inventoryCanAccept(character, itemName)) : Boolean(character.esize);
}

function prepareMiningAttempt(data, { character, state, targetId, now = Date.now(), actionId, inventoryCanAccept }) {
	if (!character || character.rip) throw fail("mining_dead", "A dead character cannot mine");
	if (character.moving) throw fail("mining_moving", "Stop moving before Mining");
	const level = character.skills?.mining?.level;
	const toolName = character.slots?.mainhand?.name;
	const tool = tierForTool(data, toolName);
	if (!tool) throw fail("mining_tool", "Equip a Mining pickaxe in the main hand");
	const rock = selectRock(data, { map: character.map, x: character.x, y: character.y, level, state, targetId, now });
	const ore = tierForRock(data, rock);
	if (!inventoryHasCapacity(character, ore.ore, inventoryCanAccept)) throw fail("mining_inventory", "Inventory cannot accept the guaranteed ore");
	const hasCape = character.slots?.cape?.name === data.cape.item && level >= data.cape.level;
	return {
		actionId: actionId || crypto.randomUUID(),
		connectionGeneration: character.connectionGeneration,
		rockId: rock.id,
		map: character.map,
		x: character.x,
		y: character.y,
		toolName,
		toolMarker: character.slots.mainhand.marker,
		toolTier: tool.index,
		oreTier: ore.index,
		ore: ore.ore,
		xp: ore.xp,
		level,
		hasCape,
		chance: miningChance(data, { level, oreTier: ore.index, pickaxeTier: tool.index, hasCape }),
		duration: miningDuration(data, tool.index),
		startedAt: now,
	};
}

function cancelled(reason) {
	throw fail("mining_cancelled", `Mining cancelled: ${reason}`, { reason });
}

function validateMiningCompletion(data, attempt, { character, state, now = Date.now(), inventoryCanAccept }) {
	if (!character || character.rip) cancelled("dead");
	if (character.connected === false || (attempt.connectionGeneration !== undefined && character.connectionGeneration !== attempt.connectionGeneration)) cancelled("disconnected");
	if (character.map !== attempt.map) cancelled("map_changed");
	if (character.x !== attempt.x || character.y !== attempt.y || character.moving) cancelled("moved");
	const currentTool = character.slots?.mainhand;
	if (!currentTool || currentTool.name !== attempt.toolName || currentTool.marker !== attempt.toolMarker) cancelled("tool_changed");
	if (character.skills?.mining?.level !== attempt.level) cancelled("skill_changed");
	if (!inventoryHasCapacity(character, attempt.ore, inventoryCanAccept)) cancelled("inventory_full");
	const normalized = normalizeRockState(data, state, now);
	if (normalized[attempt.rockId]) cancelled("account_race");
	return true;
}

function claimRock(data, stored, { rockId, now = Date.now(), claimId }) {
	if (!rockIndex(data).has(rockId)) throw fail("invalid_mining_rock", `Unknown Mining rock ${rockId}`, { rock: rockId });
	if (typeof claimId !== "string" || !claimId || claimId.length > 128) throw fail("invalid_mining_claim", "Mining claim ID is invalid");
	const state = normalizeRockState(data, stored, now);
	if (state[rockId]) return { won: false, state, availableAt: state[rockId].available_at };
	const availableAt = now + data.respawn_ms;
	state[rockId] = { available_at: availableAt, claim_id: claimId };
	return { won: true, state, availableAt };
}

function compensateRockClaim(data, stored, { rockId, claimId, now = Date.now() }) {
	const state = normalizeRockState(data, stored, now - data.respawn_ms - 1);
	if (state[rockId]?.claim_id === claimId) delete state[rockId];
	return state;
}

function legacyBonusOpportunity(data, { durationMs, successChance }) {
	if (!(durationMs > 0) || !(successChance > 0 && successChance <= 1)) throw fail("invalid_mining_bonus", "Bonus cadence inputs are invalid");
	return clamp(0, 1, (data.legacy_bonus.old_success * durationMs) / (data.legacy_bonus.old_attempt_ms * successChance));
}

function rollLegacyBonus(data, { durationMs, successChance, opportunityRoll, rewardRoll }) {
	if (opportunityRoll >= legacyBonusOpportunity(data, { durationMs, successChance })) return null;
	const total = data.legacy_bonus.rewards.reduce((sum, entry) => sum + entry[0], 0);
	let cursor = clamp(0, 1 - Number.EPSILON, rewardRoll) * total;
	for (const [weight, item] of data.legacy_bonus.rewards) {
		cursor -= weight;
		if (cursor < 0) return item;
	}
	return data.legacy_bonus.rewards.at(-1)[1];
}

function terminalCancelled(attempt, reason) {
	return { response: "data", place: "mining", cevent: true, outcome: "cancelled", rock_id: attempt.rockId, reason };
}

async function compensateClaim(attempt, options, accountId, cause) {
	const request = {
		accountId,
		rockId: attempt.rockId,
		claimId: attempt.actionId,
		now: options.now,
	};
	let lastError;
	const attempts = Number.isInteger(options.compensationAttempts) && options.compensationAttempts > 0 ? options.compensationAttempts : 3;
	for (let index = 0; index < attempts; index += 1) {
		try {
			const result = await options.claimAdapter.compensate(request);
			if (!result || result.success !== true) throw fail("mining_compensation_failed", "Mining compensation did not commit");
			return true;
		} catch (error) {
			lastError = error;
		}
	}
	if (typeof options.onCompensationFailure === "function") {
		try {
			options.onCompensationFailure({ request, cause, error: lastError });
		} catch (_) {}
	}
	return false;
}

async function completeMiningAttempt(data, attempt, options) {
	const currentCharacter = () => (typeof options.characterView === "function" ? options.characterView() : options.character);
	try {
		validateMiningCompletion(data, attempt, { ...options, character: currentCharacter() });
	} catch (error) {
		if (error.code === "mining_cancelled") return terminalCancelled(attempt, error.reason);
		throw error;
	}
	let freshState;
	try {
		freshState = await options.claimAdapter.load({
			accountId: currentCharacter().owner,
			now: options.now,
		});
		validateMiningCompletion(data, attempt, { ...options, character: currentCharacter(), state: freshState });
	} catch (error) {
		if (error.code === "mining_cancelled") return terminalCancelled(attempt, error.reason);
		return terminalCancelled(attempt, "state_unavailable");
	}
	const random = options.random || Math.random;
	if (random() >= attempt.chance) return { response: "data", place: "mining", cevent: true, outcome: "failure", rock_id: attempt.rockId };
	let claim;
	try {
		claim = await options.claimAdapter.claim({
			accountId: currentCharacter().owner,
			rockId: attempt.rockId,
			now: options.now,
			claimId: attempt.actionId,
		});
	} catch (error) {
		return terminalCancelled(attempt, "state_unavailable");
	}
	if (!claim?.won) return terminalCancelled(attempt, "account_race");
	try {
		validateMiningCompletion(data, attempt, { ...options, character: currentCharacter(), state: {} });
	} catch (error) {
		const compensated = await compensateClaim(attempt, options, currentCharacter()?.owner, error.reason || "state_unavailable");
		if (!compensated) return terminalCancelled(attempt, "compensation_failed");
		if (error.code === "mining_cancelled") return terminalCancelled(attempt, error.reason);
		return terminalCancelled(attempt, "state_unavailable");
	}
	const bonusRandom = options.bonusRandom || Math.random;
	const proposedBonus = rollLegacyBonus(data, {
		durationMs: attempt.duration,
		successChance: attempt.chance,
		opportunityRoll: bonusRandom(),
		rewardRoll: bonusRandom(),
	});
	let committed;
	try {
		committed = await options.commitRewards({
			ore: attempt.ore,
			bonus: proposedBonus,
			skill: "mining",
			xp: attempt.xp,
			sourceId: `mining:${attempt.actionId}`,
		});
	} catch (error) {
		const compensated = await compensateClaim(attempt, options, currentCharacter()?.owner, "reward_failed");
		if (!compensated) return terminalCancelled(attempt, "compensation_failed");
		return terminalCancelled(attempt, "reward_failed");
	}
	const bonus = committed?.bonus || null;
	const bonusOmitted = Boolean(committed?.bonus_omitted);
	return {
		response: "data",
		place: "mining",
		cevent: true,
		outcome: "success",
		rock_id: attempt.rockId,
		ore: attempt.ore,
		xp: attempt.xp,
		...(bonus ? { bonus } : {}),
		...(bonusOmitted ? { bonus_omitted: true } : {}),
		available_at: claim.availableAt,
	};
}

function canTraverse(geometry, from, to) {
	const minX = Math.min(from.x, to.x);
	const maxX = Math.max(from.x, to.x);
	const minY = Math.min(from.y, to.y);
	const maxY = Math.max(from.y, to.y);
	for (const line of geometry.x_lines || []) {
		if (line[0] < minX || line[0] > maxX || line[2] < minY || line[1] > maxY) continue;
		const y = from.y + ((to.y - from.y) * (line[0] - from.x)) / (to.x - from.x || 1e-12);
		if (y >= line[1] && y <= line[2]) return false;
	}
	for (const line of geometry.y_lines || []) {
		if (line[0] < minY || line[0] > maxY || line[2] < minX || line[1] > maxX) continue;
		const x = from.x + ((to.x - from.x) * (line[0] - from.y)) / (to.y - from.y || 1e-12);
		if (x >= line[1] && x <= line[2]) return false;
	}
	return true;
}

function rockTravelDistanceFromSpawn(geometry, spawn, rock) {
	if (!geometry || !Number.isFinite(geometry.min_x) || !Number.isFinite(geometry.max_x) || !Number.isFinite(geometry.min_y) || !Number.isFinite(geometry.max_y)) return Infinity;
	if (rock.x < geometry.min_x || rock.x > geometry.max_x || rock.y < geometry.min_y || rock.y > geometry.max_y) return Infinity;
	const start = { x: spawn[0], y: spawn[1] };
	const targets = [
		{ x: rock.x - 16, y: rock.y },
		{ x: rock.x + 16, y: rock.y },
		{ x: rock.x, y: rock.y - 16 },
		{ x: rock.x, y: rock.y + 16 },
	].filter((point) => Math.hypot(point.x - rock.x, point.y - rock.y) <= rock.range);
	const key = (point) => `${point.x},${point.y}`;
	const queue = [{ ...start, distance: 0 }];
	const visited = new Set([key(start)]);
	const targetKeys = new Set(targets.map(key));
	for (let cursor = 0; cursor < queue.length && visited.size < 30000; cursor += 1) {
		const current = queue[cursor];
		if (targetKeys.has(key(current))) return current.distance;
		const target = targets.find((entry) => canTraverse(geometry, current, entry) && Math.hypot(current.x - entry.x, current.y - entry.y) <= 24);
		if (target) return current.distance + Math.hypot(current.x - target.x, current.y - target.y);
		for (const [dx, dy] of [[16, 0], [-16, 0], [0, 16], [0, -16]]) {
			const next = { x: current.x + dx, y: current.y + dy };
			if (next.x < geometry.min_x || next.x > geometry.max_x || next.y < geometry.min_y || next.y > geometry.max_y || visited.has(key(next)) || !canTraverse(geometry, current, next)) continue;
			visited.add(key(next));
			queue.push({ ...next, distance: current.distance + Math.hypot(dx, dy) });
		}
	}
	return Infinity;
}

function validateRockReachability(geometry, spawn, rock) {
	return Number.isFinite(rockTravelDistanceFromSpawn(geometry, spawn, rock));
}

function progressionHours(data, xpTable, route, speedMultiplier = 1) {
	let seconds = 0;
	for (let level = 1; level < 99; level += 1) {
		const tierIndex = route === "copper" ? 0 : data.tiers.findLastIndex((tier) => tier.level <= level);
		const tier = data.tiers[tierIndex];
		const successesPerSecond = successfulOresPerHour(data, tierIndex, tierIndex, level, speedMultiplier) / 3600;
		const xpPerSecond = tier.xp * successesPerSecond;
		seconds += (xpTable[level + 1] - xpTable[level]) / xpPerSecond;
	}
	return seconds / 3600;
}

function successfulOresPerHour(data, oreTier, pickaxeTier, level, speedMultiplier = 1) {
	if (!(speedMultiplier > 0)) throw fail("invalid_mining_balance", "Mining speed multiplier must be positive");
	const chance = miningChance(data, { level, oreTier, pickaxeTier, hasCape: false });
	const attemptBound = chance * (3600000 / (data.tiers[pickaxeTier].duration_ms / speedMultiplier));
	const rockBound = data.balance.rocks_per_tier * (3600000 / data.respawn_ms);
	return Math.min(attemptBound, rockBound);
}

function rotationOresPerHour(data, oreTier, pickaxeTier, level, { geometry, spawn, movementSpeed = data.balance.rotation_speed, speedMultiplier = 1 }) {
	if (!geometry || !Array.isArray(spawn) || !(movementSpeed > 0) || !(speedMultiplier > 0)) {
		throw fail("invalid_mining_balance", "Mining rotation inputs are invalid");
	}
	const rocks = data.rocks.filter((rock) => rock.tier === oreTier);
	if (rocks.length !== data.balance.rocks_per_tier) throw fail("invalid_mining_balance", "Mining rotation rock count is invalid");
	const travelDistance = rocks.reduce((sum, rock) => {
		const distance = rockTravelDistanceFromSpawn(geometry, spawn, rock);
		if (!Number.isFinite(distance)) throw fail("invalid_mining_balance", `Mining rotation cannot reach ${rock.id}`, { rock: rock.id });
		return sum + distance * 2;
	}, 0);
	const attemptMs = data.tiers[pickaxeTier].duration_ms / speedMultiplier;
	const travelMs = (travelDistance / movementSpeed) * 1000;
	const cycleMs = Math.max(travelMs + rocks.length * attemptMs, data.respawn_ms + attemptMs);
	const attemptsPerHour = rocks.length * (3600000 / cycleMs);
	return miningChance(data, { level, oreTier, pickaxeTier, hasCape: false }) * attemptsPerHour;
}

function miningBalanceReport(data, xpTable, rotation) {
	const unlockBands = data.tiers.map((tier, index) => {
		const level = tier.level;
		const oresPerHour = successfulOresPerHour(data, index, index, level);
		const expectedXpPerHour = tier.xp * oresPerHour;
		const expectedGoldPerHour = tier.ore_g * data.balance.sell_multiplier * oresPerHour;
		const previousOptions = data.tiers.slice(0, index).map((previous) => {
			const previousOresPerHour = successfulOresPerHour(data, previous.index, index, level);
			return {
				id: previous.id,
				expected_xp_per_hour: previous.xp * previousOresPerHour,
				expected_gold_per_hour: previous.ore_g * data.balance.sell_multiplier * previousOresPerHour,
			};
		});
		let saleFractionForNextPickaxe = 0;
		if (index < data.tiers.length - 1) {
			const next = data.tiers[index + 1];
			const ores = (xpTable[next.level] - xpTable[tier.level]) / tier.xp;
			saleFractionForNextPickaxe = next.pickaxe_g / (ores * tier.ore_g * data.balance.sell_multiplier);
		}
		return {
			id: tier.id,
			expected_xp_per_hour: expectedXpPerHour,
			expected_gold_per_hour: expectedGoldPerHour,
			...(rotation ? { rotation_ores_per_hour: rotationOresPerHour(data, index, index, level, rotation) } : {}),
			previous_options: previousOptions,
			sale_fraction_for_next_pickaxe: saleFractionForNextPickaxe,
		};
	});
	const best = progressionHours(data, xpTable, "best");
	return {
		copper_only_hours: progressionHours(data, xpTable, "copper"),
		best_route_hours: best,
		double_speed_hours: progressionHours(data, xpTable, "best", data.balance.double_speed_multiplier),
		unlock_bands: unlockBands,
	};
}

function legacyBonusRates(data) {
	const oldRate = data.legacy_bonus.old_success / data.legacy_bonus.old_attempt_ms;
	const relativeWeights = Object.fromEntries(data.legacy_bonus.rewards.map(([weight, item]) => [item, weight]));
	return data.tiers.map((tier) => {
		const chance = miningChance(data, { level: tier.level, oreTier: tier.index, pickaxeTier: tier.index, hasCape: false });
		const opportunity = legacyBonusOpportunity(data, { durationMs: tier.duration_ms, successChance: chance });
		return { id: tier.id, relative_to_old: (opportunity * chance) / tier.duration_ms / oldRate, relative_weights: relativeWeights };
	});
}

module.exports = {
	BONUS_IDS,
	validateMiningData,
	miningChance,
	miningDuration,
	normalizeRockState,
	publicRockState,
	selectRock,
	prepareMiningAttempt,
	validateMiningCompletion,
	claimRock,
	compensateRockClaim,
	legacyBonusOpportunity,
	rollLegacyBonus,
	completeMiningAttempt,
	rockTravelDistanceFromSpawn,
	validateRockReachability,
	successfulOresPerHour,
	rotationOresPerHour,
	miningBalanceReport,
	legacyBonusRates,
};
