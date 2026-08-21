"use strict";

const { smithingChance, tierForId, tierForOutput, validateSmithingData, weaponForOutput } = require("./smithing");

function fail(code, message, details = {}) {
	const error = new Error(message);
	error.code = code;
	Object.assign(error, details);
	return error;
}

function cancelled(reason) {
	throw fail("smithing_cancelled", `Smithing cancelled: ${reason}`, { reason });
}

function exactRecipeItems(recipe, expected) {
	return (
		recipe &&
		Array.isArray(recipe.items) &&
		recipe.items.length === expected.length &&
		recipe.items.every((entry, index) => Array.isArray(entry) && entry.length === 2 && entry[0] === expected[index][0] && entry[1] === expected[index][1])
	);
}

function recipeTier(data, recipe, output) {
	const barTier = tierForOutput(data, output);
	if (barTier) {
		if (!exactRecipeItems(recipe, [[barTier.ore_quantity, barTier.ore]]) || recipe.cost !== 0 || recipe.smithing) {
			throw fail("smithing_recipe", `Smithing bar recipe ${output} is invalid`);
		}
		return { tier: barTier, forge: false, weapon: null };
	}
	const weapon = weaponForOutput(data, output);
	if (!weapon) return null;
	const tier = tierForId(data, weapon.tier_id);
	if (!tier || !recipe || recipe.smithing !== true || recipe.cost !== 0 || !exactRecipeItems(recipe, [[tier.bars_per_weapon, tier.bar], [1, weapon.predecessor]])) {
		throw fail("smithing_recipe", `Smithing weapon recipe ${output} is invalid`);
	}
	return { tier, forge: true, weapon };
}

function expectedInputs(details) {
	if (details.forge) return [{ name: details.tier.bar, quantity: details.tier.bars_per_weapon }, { name: details.weapon.predecessor, quantity: 1 }];
	return [{ name: details.tier.ore, quantity: details.tier.ore_quantity }];
}

function normalizeInputs(inputs, recipeInputs) {
	if (!Array.isArray(inputs) || inputs.length !== recipeInputs.length) throw fail("smithing_items", "Smithing inputs are invalid");
	const seenSlots = new Set();
	const normalized = inputs.map((input) => {
		if (!input || !Number.isInteger(input.slot) || input.slot < 0 || typeof input.name !== "string" || !Number.isInteger(input.quantity) || input.quantity < 1 || seenSlots.has(input.slot)) {
			throw fail("smithing_items", "Smithing inputs are invalid");
		}
		seenSlots.add(input.slot);
		return { slot: input.slot, name: input.name, quantity: input.quantity };
	});
	for (const expected of recipeInputs) {
		const actual = normalized.find((input) => input.name === expected.name);
		if (!actual || actual.quantity !== expected.quantity) throw fail("smithing_items", `Smithing requires exactly ${expected.quantity} ${expected.name}`);
	}
	return normalized;
}

function smithingOutputs(attempt, outcome) {
	if (outcome === "success") return [{ name: attempt.output, quantity: 1 }];
	if (outcome === "failure") return [{ name: attempt.tier.scrap, quantity: attempt.forge ? attempt.tier.bars_per_weapon : 1 }];
	throw fail("smithing_outcome", "Smithing outcome is invalid");
}

function prepareSmithingAttempt(data, { recipe, output, level, actionId, sourceId = actionId, inputs, inventoryCanAccept, property = false }) {
	validateSmithingData(data);
	if (typeof output !== "string" || !output) throw fail("smithing_recipe", "Smithing output is invalid");
	if (typeof actionId !== "string" || !actionId || actionId.length > 128) throw fail("smithing_action", "Smithing action ID is invalid");
	if (typeof sourceId !== "string" || !sourceId || sourceId.length > 256) throw fail("smithing_source", "Smithing source ID is invalid");
	const details = recipeTier(data, recipe, output);
	if (!details) throw fail("smithing_recipe", `Recipe ${output} is not a Smithing recipe`);
	if (!Number.isInteger(level) || level < details.tier.level || level > 99) throw fail("smithing_level", `Smithing level ${details.tier.level} is required`, { required_level: details.tier.level });
	const recipeInputs = expectedInputs(details);
	const normalizedInputs = normalizeInputs(inputs, recipeInputs);
	const attempt = {
		actionId,
		sourceId,
		output,
		tier: details.tier,
		tierId: details.tier.id,
		forge: details.forge,
		level,
		duration: details.tier.duration_ms,
		recipeInputs,
		inputs: normalizedInputs,
		property: typeof property === "string" ? property : false,
	};
	if (typeof inventoryCanAccept !== "function") throw fail("smithing_inventory", "Smithing inventory validation is unavailable");
	for (const outcome of ["success", "failure"]) {
		if (!inventoryCanAccept(attempt, outcome, smithingOutputs(attempt, outcome))) {
			throw fail("smithing_inventory", "Inventory cannot accept every Smithing outcome", { outcome });
		}
	}
	return attempt;
}

function serializeSmithingAttempt(attempt, now) {
	if (!Number.isSafeInteger(now) || now < 0) throw fail("smithing_action", "Smithing start time is invalid");
	return {
		ms: attempt.duration,
		len: attempt.duration,
		action_id: attempt.actionId,
		source_id: attempt.sourceId,
		kind: attempt.forge ? "forge" : "refine",
		tier_id: attempt.tierId,
		output: attempt.output,
		inputs: attempt.inputs.map((input) => ({ ...input })),
		property: attempt.property || false,
		started_at: now,
		completes_at: now + attempt.duration,
	};
}

function rehydrateSmithingAttempt(data, { channel, recipe, level, inventoryCanAccept }) {
	validateSmithingData(data);
	if (!channel || typeof channel !== "object" || Array.isArray(channel)) throw fail("smithing_action", "Smithing channel is invalid");
	if (!Number.isSafeInteger(channel.started_at) || !Number.isSafeInteger(channel.completes_at) || channel.completes_at <= channel.started_at || !Number.isSafeInteger(channel.ms) || !Number.isSafeInteger(channel.len)) {
		throw fail("smithing_action", "Smithing channel timestamps are invalid");
	}
	const attempt = prepareSmithingAttempt(data, {
		recipe,
		output: channel.output,
		level,
		actionId: channel.action_id,
		sourceId: channel.source_id,
		inputs: channel.inputs,
		inventoryCanAccept,
		property: channel.property,
	});
	if (channel.tier_id !== attempt.tierId || channel.kind !== (attempt.forge ? "forge" : "refine") || channel.len !== attempt.duration || channel.completes_at - channel.started_at !== attempt.duration) {
		throw fail("smithing_action", "Smithing channel does not match the canonical recipe");
	}
	return attempt;
}

function validateSmithingCompletion(data, attempt, { character, getItem, inventoryCanAccept }) {
	validateSmithingData(data);
	if (!attempt || !attempt.tier || !attempt.actionId) cancelled("state_unavailable");
	if (!character || character.rip) cancelled("dead");
	if (character.connected === false) cancelled("disconnected");
	const level = character.skills?.smithing?.level;
	if (!Number.isInteger(level) || level < attempt.tier.level || level > 99) cancelled("skill_changed");
	if (typeof getItem !== "function") cancelled("state_unavailable");
	for (const expected of attempt.recipeInputs) {
		const input = attempt.inputs.find((entry) => entry.name === expected.name);
		const current = input && getItem(input.slot);
		if (!current || current.name !== expected.name || (current.q || 1) < expected.quantity) cancelled("items_changed");
	}
	if (typeof inventoryCanAccept !== "function") cancelled("state_unavailable");
	for (const outcome of ["success", "failure"]) {
		if (!inventoryCanAccept(attempt, outcome, smithingOutputs(attempt, outcome))) cancelled("inventory_full");
	}
	return level;
}

function completeSmithingAttempt(data, attempt, { character, getItem, inventoryCanAccept, random = Math.random, commit }) {
	const level = validateSmithingCompletion(data, attempt, { character, getItem, inventoryCanAccept });
	if (typeof random !== "function" || typeof commit !== "function") throw fail("smithing_runtime", "Smithing completion dependencies are invalid");
	const outcome = random() < smithingChance(data, attempt.tier, level) ? "success" : "failure";
	const reward = {
		outcome,
		outputs: smithingOutputs(attempt, outcome),
		skill: "smithing",
		xp: attempt.tier.xp,
		sourceId: attempt.sourceId,
	};
	const result = commit(attempt, reward);
	if (result && typeof result.then === "function") throw fail("smithing_runtime", "Smithing reward commits must be synchronous");
	return {
		response: "data",
		place: "smithing",
		cevent: true,
		outcome,
		output: attempt.output,
		xp: attempt.tier.xp,
	};
}

function createSmithingRuntime(data, adapters) {
	validateSmithingData(data);
	if (!adapters || typeof adapters !== "object") throw fail("smithing_runtime", "Smithing adapters are required");
	for (const name of ["recipeForOutput", "inventoryCanAccept", "reserve", "release", "characterView", "getItem", "commit"]) {
		if (typeof adapters[name] !== "function") throw fail("smithing_runtime", `Smithing adapter ${name} is required`);
	}

	function currentChannel(player) {
		return player && player.c && player.c.smithing ? player.c.smithing : null;
	}

	return {
		start(player, request) {
			if (!player || !player.c) throw fail("smithing_runtime", "Smithing character state is unavailable");
			if (currentChannel(player)) throw fail("smithing_busy", "Smithing is already in progress");
			const character = adapters.characterView(player);
			if (!character || character.rip) cancelled("dead");
			if (character.connected === false) cancelled("disconnected");
			const now = Number.isSafeInteger(request.now) ? request.now : Date.now();
			const attempt = prepareSmithingAttempt(data, {
				...request,
				recipe: adapters.recipeForOutput(request.output),
				inventoryCanAccept: (currentAttempt, outcome, outputs) => adapters.inventoryCanAccept(player, currentAttempt, outcome, outputs),
			});
			const channel = serializeSmithingAttempt(attempt, now);
			adapters.reserve(player, channel);
			player.c.smithing = channel;
			return channel;
		},
		cancel(player) {
			const channel = currentChannel(player);
			if (!channel) return null;
			delete player.c.smithing;
			adapters.release(player, channel);
			return channel;
		},
		settle(player, channel = currentChannel(player), now = Date.now()) {
			if (!channel) return null;
			if (!Number.isSafeInteger(now) || now < 0) throw fail("smithing_action", "Smithing completion time is invalid");
			if (channel.ms > 0 && now < channel.completes_at) return { pending: true };
			const level = adapters.characterView(player)?.skills?.smithing?.level;
			let attempt;
			try {
				attempt = rehydrateSmithingAttempt(data, {
					channel,
					recipe: adapters.recipeForOutput(channel.output),
					level,
					inventoryCanAccept: (currentAttempt, outcome, outputs) => adapters.inventoryCanAccept(player, currentAttempt, outcome, outputs),
				});
				if (player && player.c && player.c.smithing === channel) delete player.c.smithing;
				return completeSmithingAttempt(data, attempt, {
					character: adapters.characterView(player),
					getItem: (slot) => adapters.getItem(player, slot),
					inventoryCanAccept: (currentAttempt, outcome, outputs) => adapters.inventoryCanAccept(player, currentAttempt, outcome, outputs),
					random: adapters.random || Math.random,
					commit: (currentAttempt, reward) => adapters.commit(player, currentAttempt, reward),
				});
			} finally {
				if (player && player.c && player.c.smithing === channel) delete player.c.smithing;
				adapters.release(player, channel);
			}
		},
	};
}

module.exports = {
	completeSmithingAttempt,
	createSmithingRuntime,
	prepareSmithingAttempt,
	recipeTier,
	rehydrateSmithingAttempt,
	serializeSmithingAttempt,
	smithingOutputs,
	validateSmithingCompletion,
};
