"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { smithing } = require("../../design/smithing");
const {
	completeSmithingAttempt,
	createSmithingRuntime,
	prepareSmithingAttempt,
	recipeTier,
	validateSmithingCompletion,
} = require("../game/smithing_runtime");

const root = path.resolve(__dirname, "../..");

function publishedCraft() {
	const context = { smithing: structuredClone(smithing), smithing_weapon_chain: structuredClone(smithing.weapons) };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(root, "design/recipes.js"), "utf8"), context, { filename: "recipes.js" });
	return context.craft;
}

const craft = publishedCraft();

function character(overrides = {}) {
	return {
		connected: true,
		rip: false,
		skills: { smithing: { level: 99, xp: 0 } },
		...overrides,
	};
}

function prepare(recipe, output, inputs, overrides = {}) {
	return prepareSmithingAttempt(smithing, {
		recipe,
		output,
		level: overrides.level ?? 99,
		actionId: overrides.actionId || "action-a",
		sourceId: overrides.sourceId || "server:smithing:character-a:request-a",
		inputs,
		inventoryCanAccept: overrides.inventoryCanAccept || (() => true),
	});
}

function complete(attempt, inventory, overrides = {}) {
	const commits = [];
	const result = completeSmithingAttempt(smithing, attempt, {
		character: overrides.character || character(),
		getItem: (slot) => inventory[slot],
		inventoryCanAccept: overrides.inventoryCanAccept || (() => true),
		random: overrides.random || (() => 0),
		commit: (currentAttempt, reward) => commits.push({ currentAttempt, reward }),
	});
	return { commits, result };
}

function inputsFor(output) {
	return craft[output].items.map(([quantity, name], slot) => ({ slot, name, quantity }));
}

function runtimeHarness(output, options = {}) {
	const inputs = inputsFor(output);
	const player = {
		c: {},
		citems: inputs.map((input) => ({ name: input.name, q: input.quantity })),
		items: inputs.map((input) => ({ name: input.name, q: input.quantity })),
		...character({ skills: { smithing: { level: options.level ?? 99, xp: 0 } } }),
	};
	const commits = [];
	const runtime = createSmithingRuntime(smithing, {
		recipeForOutput: (name) => craft[name],
		inventoryCanAccept: (_player, _attempt, outcome) => options.inventoryCanAccept ? options.inventoryCanAccept(outcome) : true,
		reserve(current, channel) {
			for (const input of channel.inputs) {
				current.items[input.slot].b = true;
				current.citems[input.slot].b = true;
			}
		},
		release(current, channel) {
			for (const input of channel.inputs) {
				if (current.items[input.slot]) delete current.items[input.slot].b;
				if (current.citems[input.slot]) delete current.citems[input.slot].b;
			}
		},
		characterView: (current) => current,
		getItem: (current, slot) => current.items[slot],
		random: options.random || (() => 0),
		commit(current, attempt, reward) {
			const before = structuredClone({ items: current.items, citems: current.citems, skills: current.skills });
			try {
				const consumed = reward.outcome === "success" || !attempt.forge ? attempt.recipeInputs : attempt.recipeInputs.filter((input) => input.name === attempt.tier.bar);
				for (const input of consumed) {
					const selected = attempt.inputs.find((entry) => entry.name === input.name);
					const item = current.items[selected.slot];
					if ((item.q || 1) === input.quantity) current.items[selected.slot] = current.citems[selected.slot] = null;
					else item.q -= input.quantity;
				}
				if (options.failCommit) throw Object.assign(new Error("forced settlement failure"), { code: "forced_commit_failure" });
				current.items.push(...reward.outputs.map((entry) => ({ name: entry.name, q: entry.quantity })));
				current.citems = structuredClone(current.items);
				current.skills.smithing.xp += reward.xp;
				commits.push({ attempt, reward });
			} catch (error) {
				current.items = before.items;
				current.citems = before.citems;
				current.skills = before.skills;
				throw error;
			}
		},
	});
	return { runtime, player, commits, inputs };
}

function start(harness, output, now = 1000, requestId = "request-a") {
	return harness.runtime.start(harness.player, {
		output,
		level: harness.player.skills.smithing.level,
		actionId: "server-action-" + requestId,
		sourceId: "server:smithing:character-a:" + requestId,
		inputs: harness.inputs,
		now,
	});
}

test("[AC-4] refining reserves two ore, rejects an early tick, and settles one authoritative result", () => {
	const success = runtimeHarness("copperbar", { random: () => 0 });
	const channel = start(success, "copperbar");
	assert.deepEqual(Object.keys(channel).sort(), ["action_id", "completes_at", "inputs", "kind", "len", "ms", "output", "property", "source_id", "started_at", "tier_id"]);
	assert.equal(channel.tier_id, "copper");
	assert.equal(channel.kind, "refine");
	assert.equal(Object.hasOwn(channel, "tier"), false);
	assert.equal(success.player.items[0].b, true);
	assert.deepEqual(success.runtime.settle(success.player, channel, channel.started_at + 1), { pending: true });
	assert.equal(success.commits.length, 0);
	const result = success.runtime.settle(success.player, channel, channel.completes_at);
	assert.equal(result.outcome, "success");
	assert.deepEqual(success.commits[0].reward.outputs, [{ name: "copperbar", quantity: 1 }]);
	assert.equal(success.player.skills.smithing.xp, 4958);
	assert.equal(success.player.c.smithing, undefined);
	assert.equal(success.player.items[0]?.b, undefined);
	assert.equal(success.runtime.settle(success.player), null);

	const failure = runtimeHarness("copperbar", { random: () => 1 });
	const failedChannel = start(failure, "copperbar");
	assert.equal(failure.runtime.settle(failure.player, failedChannel, failedChannel.completes_at).outcome, "failure");
	assert.deepEqual(failure.commits[0].reward.outputs, [{ name: "copperscrap", quantity: 1 }]);
});

test("[AC-5] all published weapon recipes enforce their exact tier, predecessor, +0 state, and chance boundaries", () => {
	for (const weapon of smithing.weapons) {
		const tier = smithing.tiers.find((candidate) => candidate.id === weapon.tier_id);
		const recipe = craft[weapon.output];
		const inputs = inputsFor(weapon.output);
		const attempt = prepare(recipe, weapon.output, inputs, { level: tier.level });
		assert.equal(attempt.tierId, tier.id, weapon.output);
		assert.equal(attempt.forge, true, weapon.output);
		assert.deepEqual(attempt.recipeInputs, [{ name: tier.bar, quantity: 5 }, { name: weapon.predecessor, quantity: 1 }], weapon.output);
		assert.throws(() => prepare({ ...recipe, items: [[5, smithing.tiers[(tier.index + 1) % smithing.tiers.length].bar], [1, weapon.predecessor]] }, weapon.output, inputs, { level: tier.level }), { code: "smithing_recipe" });
		assert.throws(() => prepare({ ...recipe, items: [[5, tier.bar], [1, weapon.output]] }, weapon.output, inputs, { level: tier.level }), { code: "smithing_recipe" });
		assert.throws(() => prepare({ ...recipe, items: [[5, tier.bar], [1, weapon.predecessor, 1]] }, weapon.output, inputs, { level: tier.level }), { code: "smithing_recipe" });
	}
	for (const [index, tier] of smithing.tiers.entries()) {
		const nextLevel = smithing.tiers[index + 1]?.level || 99;
		const { smithingChance } = require("../game/smithing");
		assert.equal(smithingChance(smithing, tier, tier.level), tier.base_success, tier.id + " gate");
		assert.equal(smithingChance(smithing, tier, nextLevel), Number((tier.base_success * 1.25).toFixed(12)), tier.id + " cap");
	}
});

test("[AC-5] forge failure consumes only its five bars and returns five current-tier scraps", () => {
	const harness = runtimeHarness("copperblade", { random: () => 1 });
	const channel = start(harness, "copperblade");
	assert.equal(harness.runtime.settle(harness.player, channel, channel.completes_at).outcome, "failure");
	assert.deepEqual(harness.commits[0].reward.outputs, [{ name: "copperscrap", quantity: 5 }]);
	assert.equal(harness.player.items[1].name, "blade");
	assert.equal(harness.player.items[0], null);
});

test("[AC-6] duplicate starts, cancellation, settlement failure, and hydrated completion leave one safe terminal result", () => {
	const duplicate = runtimeHarness("copperbar");
	const channel = start(duplicate, "copperbar");
	assert.throws(() => start(duplicate, "copperbar", 1001, "request-b"), { code: "smithing_busy" });
	assert.equal(duplicate.runtime.cancel(duplicate.player), channel);
	assert.equal(duplicate.player.c.smithing, undefined);
	assert.equal(duplicate.player.items[0].b, undefined);
	assert.equal(duplicate.player.skills.smithing.xp, 0);
	assert.equal(duplicate.commits.length, 0);
	for (const [state, reason] of [[{ rip: true }, "dead"], [{ connected: false }, "disconnected"]]) {
		const unavailable = runtimeHarness("copperbar");
		Object.assign(unavailable.player, state);
		assert.throws(() => start(unavailable, "copperbar"), (error) => error.code === "smithing_cancelled" && error.reason === reason);
		assert.equal(unavailable.player.c.smithing, undefined);
		assert.equal(unavailable.player.items[0].b, undefined);
	}

	const rollback = runtimeHarness("copperbar", { failCommit: true });
	const rollbackChannel = start(rollback, "copperbar");
	assert.throws(() => rollback.runtime.settle(rollback.player, rollbackChannel, rollbackChannel.completes_at), { code: "forced_commit_failure" });
	assert.deepEqual(rollback.player.items, [{ name: "copperore", q: 2 }]);
	assert.equal(rollback.player.items[0].b, undefined);
	assert.equal(rollback.player.skills.smithing.xp, 0);
	assert.equal(rollback.player.c.smithing, undefined);

	const hydrated = runtimeHarness("ironbar");
	const hydratedChannel = structuredClone(start(hydrated, "ironbar", 5000));
	hydrated.player.c.smithing = hydratedChannel;
	assert.equal(hydrated.runtime.settle(hydrated.player, hydratedChannel, hydratedChannel.completes_at).outcome, "success");
	assert.equal(hydrated.commits.length, 1);
});

test("[AC-6] completion validation is read-only until the single commit callback", () => {
	const recipe = craft.copperbar;
	const attempt = prepare(recipe, "copperbar", [{ slot: 4, name: "copperore", quantity: 2 }]);
	const inventory = { 4: { name: "copperore", q: 2 } };
	assert.equal(validateSmithingCompletion(smithing, attempt, {
		character: character(),
		getItem: (slot) => inventory[slot],
		inventoryCanAccept: () => true,
	}), 99);
	assert.deepEqual(inventory, { 4: { name: "copperore", q: 2 } });
	assert.throws(() => complete(attempt, inventory, { character: character({ connected: false }) }), (error) => error.reason === "disconnected");
});

function sourceBetween(source, startMarker, endMarker) {
	const start = source.indexOf(startMarker);
	const end = source.indexOf(endMarker, start);
	assert.ok(start >= 0 && end > start, `could not extract ${startMarker}`);
	return source.slice(start, end);
}

function plain(value) {
	return JSON.parse(JSON.stringify(value));
}

function craftsmanHarness() {
	const source = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const craftStart = source.indexOf('socket.on("craft", function (data) {');
	const craftEnd = source.indexOf('\n\t\t});\n\t\tsocket.on("exchange"', craftStart);
	assert.ok(craftStart >= 0 && craftEnd > craftStart, "could not extract Craftsman handler");
	const craftBody = source.slice(source.indexOf("{", craftStart) + 1, craftEnd);
	const tickStart = source.indexOf("\t\tfor (var name in player.c) {", craftEnd);
	const tickEnd = source.indexOf("\n\t\t\tif (ref.ms <= 0) {", tickStart);
	assert.ok(tickStart >= 0 && tickEnd > tickStart, "could not extract Smithing tick");
	const smithingTick = source.slice(tickStart, tickEnd) + "\n\t\t}";
	const cancelSource = sourceBetween(source, "function cancel_smithing_action", "function preserve_action_channels");
	const emitted = [];
	const failures = [];
	const successes = [];
	const logs = [];
	const resends = [];
	let now = 1_000;
	const socket = { id: "craftsman-socket", emit: (name, payload) => emitted.push({ name, payload }) };
	const player = {
		id: "craftsman-character",
		socket,
		user: false,
		computer: true,
		gold: 1_000,
		c: {},
		p: { skill_xp_sources: [] },
		skills: { smithing: { level: 99, xp: 0 } },
		items: [{ name: "copperore", q: 4 }, { name: "blade" }, { name: "carrot", q: 2 }],
		citems: [{ name: "copperore", q: 4 }, { name: "blade" }, { name: "carrot", q: 2 }],
	};
	const context = {
		B: { sell_dist: 400 },
		D: { craftmap: { copperore: "copperbar", "blade,copperbar": "copperblade", "blade,carrot": "carrotsword" } },
		Date: { now: () => now },
		G: { craft, titles: {} },
		Math,
		players: { [socket.id]: player },
		socket,
		randomStr: (length) => "x".repeat(length),
		random_one: (values) => values[Object.keys(values)[0]],
		recipeTier,
		server_id: "test-server",
		simple_distance: () => 0,
		get_npc_coords: () => ({ x: 0, y: 0 }),
		can_add_item: () => true,
		create_new_item: (name, quantity) => ({ name, q: quantity || 1 }),
		consume(current, slot, quantity) {
			const item = current.items[slot];
			if ((item.q || 1) === quantity) current.items[slot] = current.citems[slot] = null;
			else {
				item.q -= quantity;
				current.citems[slot] = { ...item };
			}
		},
		add_item(current, item) {
			current.items.push(typeof item === "string" ? { name: item } : item);
			current.citems = structuredClone(current.items);
			return current.items.length - 1;
		},
		fail_response: (response) => failures.push(response),
		success_response: (response, payload) => successes.push({ response, payload }),
		resend: (_current, event) => resends.push(event),
		log_smithing_event: (_current, event) => logs.push(event),
		smithing_character_view: (current) => ({ rip: current.rip, connected: Boolean(current.socket && !current.dc && context.players[current.socket.id] === current), skills: current.skills }),
		smithing_terminal_cancel: (current, channel, reason) => current.socket.emit("game_response", { response: "data", place: "smithing", outcome: "cancelled", output: channel.output, reason }),
	};
	context.smithing_runtime_data = smithing;
	context.smithing_runtime_for = (current) =>
		createSmithingRuntime(smithing, {
			recipeForOutput: (output) => craft[output],
			inventoryCanAccept: () => true,
			reserve: (target, channel) => channel.inputs.forEach((input) => {
				target.items[input.slot].b = true;
				target.citems[input.slot].b = true;
			}),
			release: (target, channel) => channel.inputs.forEach((input) => {
				if (target.items[input.slot]) delete target.items[input.slot].b;
				if (target.citems[input.slot]) delete target.citems[input.slot].b;
			}),
			characterView: context.smithing_character_view,
			getItem: (target, slot) => target.items[slot],
			commit: (target, attempt, reward) => {
				const consumed = reward.outcome === "success" || !attempt.forge ? attempt.recipeInputs : attempt.recipeInputs.filter((input) => input.name === attempt.tier.bar);
				for (const input of consumed) {
					const selected = attempt.inputs.find((entry) => entry.name === input.name);
					context.consume(target, selected.slot, input.quantity);
				}
				for (const output of reward.outputs) context.add_item(target, context.create_new_item(output.name, output.quantity));
				target.skills.smithing.xp += reward.xp;
				target.p.skill_xp_sources.push({ source_id: reward.sourceId, expires_at: now + 60_000 });
			},
		});
	context.cancel_smithing_action = vm.runInNewContext(`(${cancelSource})`, context);
	const handleCraft = vm.runInNewContext(`(function(data) {${craftBody}})`, context);
	const tick = vm.runInNewContext(`(function(player, ms) {${smithingTick}})`, context);
	return {
		player,
		emitted,
		failures,
		successes,
		logs,
		resends,
		handleCraft,
		tick,
		cancel: (reason) => context.cancel_smithing_action(player, reason),
		setNow: (value) => {
			now = value;
		},
	};
}

test("[AC-4, AC-5, AC-6, AC-9] Craftsman executes authoritative Smithing start, tick, cancel, replay, and ordinary crafting paths", () => {
	const harness = craftsmanHarness();
	harness.handleCraft({ craft_id: "refinea", items: [[0, 0]] });
	const channel = harness.player.c.smithing;
	assert.ok(channel);
	assert.equal(channel.source_id, "test-server:smithing:craftsman-character:refinea");
	assert.match(channel.action_id, /^smithing-x{24}$/);
	assert.equal(harness.player.items[0].b, true);
	assert.deepEqual(plain(harness.emitted.at(-1)), {
		name: "game_response",
		payload: { response: "data", place: "smithing", success: false, in_progress: true, duration: 30_000, output: "copperbar" },
	});

	harness.handleCraft({ craft_id: "refineb", items: [[0, 0]] });
	assert.equal(harness.failures.at(-1), "item_locked");
	assert.equal(harness.player.c.smithing, channel);
	harness.cancel("stopped");
	assert.equal(harness.player.c.smithing, undefined);
	assert.equal(harness.player.items[0].b, undefined);
	assert.deepEqual(plain(harness.emitted.at(-1).payload), { response: "data", place: "smithing", outcome: "cancelled", output: "copperbar", reason: "stopped" });

	harness.handleCraft({ craft_id: "refinecomplete", items: [[0, 0]] });
	const completing = harness.player.c.smithing;
	harness.setNow(completing.started_at + 1);
	harness.tick(harness.player, 1);
	assert.equal(harness.player.c.smithing, completing, "pre-completion server tick keeps the channel live");
	harness.setNow(completing.completes_at);
	harness.tick(harness.player, completing.len - 1);
	assert.equal(harness.player.c.smithing, undefined);
	assert.equal(harness.player.skills.smithing.xp, 4_958);
	assert.equal(harness.player.p.skill_xp_sources.length, 1);
	harness.handleCraft({ craft_id: "refinecomplete", items: [[0, 0]] });
	assert.deepEqual(plain(harness.successes.at(-1)), { response: "craft", payload: { cevent: true, replayed: true } });
	assert.equal(harness.player.c.smithing, undefined);

	harness.player.items[1] = harness.player.citems[1] = { name: "blade", level: 1 };
	harness.handleCraft({ craft_id: "upgraderejected", items: [[0, 1], [0, 3]] });
	assert.equal(harness.failures.at(-1), "craft_cant");
	assert.equal(harness.player.c.smithing, undefined);

	harness.player.items[1] = harness.player.citems[1] = { name: "blade" };
	harness.handleCraft({ items: [[0, 1], [0, 2]] });
	assert.equal(harness.player.items.some((item) => item?.name === "carrotsword"), true);
	assert.deepEqual(plain(harness.successes.at(-1)), { response: "craft", payload: { num: harness.player.items.length - 1, name: "carrotsword", cevent: true } });
});
