"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { abilities } = require("../../design/abilities");
const { character: characterDefinition } = require("../../design/character");
const { item_requirements: rawRequirements } = require("../../design/item_requirements");
const { items } = require("../../design/items");
const { mining } = require("../../design/mining");
const { npcs } = require("../../design/npcs");
const { skills } = require("../../design/skills");
const { skill_xp } = require("../../design/skill_xp");
const { createCharacterState, loadCharacterState } = require("../game/character_state");
const { validateRequirements } = require("../game/equipment");
const { cumulativeXp } = require("../game/skill_domain");
const {
	claimRock,
	completeMiningAttempt,
	prepareMiningAttempt,
	validateMiningCompletion,
} = require("../game/mining");
const { createAtomicMiningRewardCommit, createMiningRuntime } = require("../game/mining_runtime");

const root = path.resolve(__dirname, "../..");

function readyCharacter(overrides = {}) {
	const rock = mining.rocks[0];
	return {
		id: "character-a",
		owner: "account-a",
		connected: true,
		connectionGeneration: "session-a",
		map: "tunnel",
		x: rock.x,
		y: rock.y,
		moving: false,
		rip: false,
		mp: 100,
		esize: 1,
		items: [],
		slots: { mainhand: { name: "pickaxe", marker: "same-tool" }, cape: null },
		skills: { mining: { level: 99, xp: 0 } },
		...overrides,
	};
}

function makeAttempt(character = readyCharacter(), overrides = {}) {
	return prepareMiningAttempt(mining, {
		character,
		state: {},
		targetId: mining.rocks[0].id,
		now: 1000,
		actionId: "action-a",
		inventoryCanAccept: () => true,
		...overrides,
	});
}

test("[AC-2] fresh characters publish nine ordered skills and Mining uses the Warrior curve", () => {
	assert.deepEqual(Object.keys(skills), ["warrior", "paladin", "mage", "priest", "ranger", "rogue", "merchant", "mining", "smithing"]);
	assert.equal(skills.mining.kind, "noncombat");
	assert.equal(skills.smithing.kind, "noncombat");
	assert.equal(skill_xp.merchant[99], 900000000);
	assert.deepEqual(createCharacterState(), { skills: characterDefinition.skills, total_level: 9 });
});

test("[AC-3] predecessor shapes add Smithing and migrate the legacy Smelting key", () => {
	const preSmeltingSkills = Object.fromEntries(Object.entries(characterDefinition.skills).filter(([id]) => id !== "smithing"));
	const smeltingMigrated = loadCharacterState({ info: { skills: preSmeltingSkills, skill_curve_version: 2 }, total_level: 8 });
	assert.deepEqual(smeltingMigrated.skills.smithing, { level: 1, xp: 0 });
	assert.equal(smeltingMigrated.total_level, 9);

	const progressedPreSmeltingSkills = structuredClone(preSmeltingSkills);
	progressedPreSmeltingSkills.warrior = { level: 4, xp: cumulativeXp(4, "warrior") };
	progressedPreSmeltingSkills.merchant = { level: 7, xp: cumulativeXp(7, "merchant") };
	progressedPreSmeltingSkills.mining = { level: 15, xp: cumulativeXp(15, "mining") };
	const progressedTotal = Object.values(progressedPreSmeltingSkills).reduce((total, progress) => total + progress.level, 0);
	const progressedMigration = loadCharacterState({
		info: { skills: progressedPreSmeltingSkills, skill_curve_version: 2 },
		total_level: progressedTotal,
	});
	assert.deepEqual(
		Object.keys(progressedMigration.skills),
		Object.keys(characterDefinition.skills),
	);
	assert.deepEqual(progressedMigration.skills.smithing, { level: 1, xp: 0 });
	assert.equal(progressedMigration.total_level, progressedTotal + 1);

	const preMiningSkills = Object.fromEntries(Object.entries(preSmeltingSkills).filter(([id]) => id !== "mining"));
	const miningMigrated = loadCharacterState({ info: { skills: preMiningSkills, skill_curve_version: 2 }, total_level: 7 });
	assert.deepEqual(miningMigrated.skills.mining, { level: 1, xp: 0 });
	assert.deepEqual(miningMigrated.skills.smithing, { level: 1, xp: 0 });
	assert.equal(miningMigrated.total_level, 9);

	const reordered = Object.fromEntries([...Object.entries(preSmeltingSkills)].reverse());
	assert.throws(() => loadCharacterState({ info: { skills: reordered, skill_curve_version: 2 }, total_level: 8 }), {
		code: "invalid_character_skill_state",
	});
	assert.throws(() => loadCharacterState({ info: { skills: { ...preSmeltingSkills, unknown: { level: 1, xp: 0 } }, skill_curve_version: 2 } }), {
		code: "invalid_character_skill_state",
	});
	assert.throws(() => loadCharacterState({ info: { skills: { ...preSmeltingSkills, smithing: { level: 1 } }, skill_curve_version: 2 } }), {
		code: "invalid_character_skill_state",
	});
	assert.throws(() => loadCharacterState({ info: { skills: { ...preSmeltingSkills, merchant: { level: 2, xp: 0 } }, skill_curve_version: 2 } }), {
		code: "invalid_character_skill_state",
	});

	const legacySmithingSkills = structuredClone(characterDefinition.skills);
	const oldStart = skill_xp.merchant[40];
	const oldEnd = skill_xp.merchant[41];
	const legacyXp = oldStart + Math.floor((oldEnd - oldStart) * 0.37);
	legacySmithingSkills.smelting = { level: 40, xp: legacyXp };
	delete legacySmithingSkills.smithing;
	const migratedSmithing = loadCharacterState({
		info: { skills: legacySmithingSkills, skill_curve_version: 2 },
		total_level: Object.values(legacySmithingSkills).reduce((total, progress) => total + progress.level, 0),
	});
	const newStart = cumulativeXp(40, "smithing");
	const newEnd = cumulativeXp(41, "smithing");
	assert.deepEqual(migratedSmithing.skills.smithing, { level: 40, xp: Math.floor(newStart + ((legacyXp - oldStart) / (oldEnd - oldStart)) * (newEnd - newStart)) });
	assert.equal(Object.hasOwn(migratedSmithing.skills, "smelting"), false);
});

test("[AC-6] start gates tool, level, range, and capacity without MP or cooldown", () => {
	const character = readyCharacter();
	const beforeMp = character.mp;
	const attempt = makeAttempt(character);
	assert.equal(attempt.rockId, mining.rocks[0].id);
	assert.equal(attempt.duration, 5000);
	assert.equal(attempt.toolName, "pickaxe");
	assert.equal(character.mp, beforeMp);
	assert.equal(abilities.mining.mp, undefined);
	assert.equal(abilities.mining.cooldown, undefined);
	assert.equal(abilities.mining.reuse_cooldown, undefined);
	assert.throws(() => makeAttempt(readyCharacter({ slots: { mainhand: null, cape: null } })), { code: "mining_tool" });
	const iron = mining.rocks.find((rock) => rock.id === "iron-1");
	assert.throws(() => makeAttempt(readyCharacter({ x: iron.x, y: iron.y, skills: { mining: { level: 1 } } }), { targetId: "iron-1" }), { code: "mining_level" });
	assert.throws(() => makeAttempt(readyCharacter(), { inventoryCanAccept: () => false }), { code: "mining_inventory" });
});

test("[AC-7] completion cancels invalid state but ignores damage", () => {
	const character = readyCharacter();
	const attempt = makeAttempt(character);
	assert.doesNotThrow(() => validateMiningCompletion(mining, attempt, { character: { ...character, hp: 1 }, state: {}, now: 6000, inventoryCanAccept: () => true }));
	for (const [reason, changed] of [
		["moved", { x: character.x + 1 }],
		["map_changed", { map: "main" }],
		["dead", { rip: true }],
		["disconnected", { connected: false }],
		["tool_changed", { slots: { mainhand: { name: "ironpickaxe" }, cape: null } }],
	]) {
		assert.throws(
			() => validateMiningCompletion(mining, attempt, { character: { ...character, ...changed }, state: {}, now: 6000, inventoryCanAccept: () => true }),
			(error) => error.code === "mining_cancelled" && error.reason === reason,
		);
	}
	assert.throws(
		() => validateMiningCompletion(mining, attempt, { character: { ...character, connectionGeneration: "session-b" }, state: {}, now: 6000, inventoryCanAccept: () => true }),
		(error) => error.code === "mining_cancelled" && error.reason === "disconnected",
	);
	assert.throws(() => validateMiningCompletion(mining, attempt, { character, state: {}, now: 6000, inventoryCanAccept: () => false }), (error) => error.reason === "inventory_full");
});

test("[AC-8] deterministic failure is mutation-free and success grants one ore plus XP once", async () => {
	const character = readyCharacter();
	const attempt = makeAttempt(character);
	const rewards = [];
	const xp = [];
	let state = {};
	const adapter = {
		load: async () => state,
		claim: async ({ rockId, now, claimId }) => {
			const result = claimRock(mining, state, { rockId, now, claimId });
			state = result.state;
			return result;
		},
		compensate: async () => ({ success: true }),
	};
	const common = {
		character,
		state: {},
		now: 6000,
		inventoryCanAccept: () => true,
		claimAdapter: adapter,
		commitRewards: (reward) => {
			rewards.push(reward.ore);
			xp.push({ skill: reward.skill, xp: reward.xp, sourceId: reward.sourceId });
			return { bonus: null, bonus_omitted: false };
		},
	};
	const failure = await completeMiningAttempt(mining, attempt, { ...common, random: () => 0.99 });
	assert.deepEqual(failure, { response: "data", place: "mining", cevent: true, outcome: "failure", rock_id: attempt.rockId });
	assert.deepEqual(rewards, []);
	assert.deepEqual(xp, []);
	assert.deepEqual(state, {});

	const success = await completeMiningAttempt(mining, attempt, { ...common, random: () => 0, bonusRandom: () => 1 });
	assert.equal(success.outcome, "success");
	assert.equal(success.ore, "copperore");
	assert.equal(success.xp, 6611);
	assert.deepEqual(rewards, ["copperore"]);
	assert.deepEqual(xp, [{ skill: "mining", xp: 6611, sourceId: "mining:action-a" }]);
});

test("[AC-9] an atomic account claim has one winner while another account remains independent", async () => {
	const states = new Map();
	const rewards = [];
	function adapter(account) {
		return {
			load: async () => states.get(account) || {},
			claim: async ({ rockId, now, claimId }) => {
				const current = states.get(account) || {};
				const result = claimRock(mining, current, { rockId, now, claimId });
				states.set(account, result.state);
				return result;
			},
			compensate: async () => ({ success: true }),
		};
	}
	async function run(account, actionId) {
		const character = readyCharacter({ owner: account, id: actionId });
		const attempt = makeAttempt(character, { actionId });
		return completeMiningAttempt(mining, attempt, {
			character,
			state: {},
			now: 6000,
			random: () => 0,
			bonusRandom: () => 1,
			inventoryCanAccept: () => true,
			claimAdapter: adapter(account),
			commitRewards: (reward) => {
				rewards.push([account, reward.ore]);
				return { bonus: null, bonus_omitted: false };
			},
		});
	}
	const sameAccount = await Promise.all([run("account-a", "race-a"), run("account-a", "race-b")]);
	assert.deepEqual(sameAccount.map((result) => result.outcome).sort(), ["cancelled", "success"]);
	assert.equal(rewards.filter(([account]) => account === "account-a").length, 1);
	assert.equal((await run("account-b", "independent")).outcome, "success");
	assert.equal(rewards.filter(([account]) => account === "account-b").length, 1);
});

test("[AC-9, AC-10] server persistence is transactional, owner-private, and refresh-bounded", () => {
	const source = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const claimStart = source.indexOf("async function claim_mining_account_rock");
	const compensateStart = source.indexOf("async function compensate_mining_account_rock");
	const cancelStart = source.indexOf("function mining_terminal_cancel");
	assert.ok(claimStart >= 0 && compensateStart > claimStart && cancelStart > compensateStart);
	const claimSource = source.slice(claimStart, compensateStart);
	assert.match(claimSource, /R\.user = await tx_get\(A\.user\)/);
	assert.match(claimSource, /R\.user\.info\.mining_rocks = mining_state_for_database\(claim\.state\)/);
	assert.match(claimSource, /await tx_save\(R\.user\)/);
	const compensationSource = source.slice(compensateStart, cancelStart);
	assert.match(compensationSource, /compensateRockClaim/);
	assert.match(compensationSource, /claimId: A\.claim_id/);
	assert.match(compensationSource, /!result\.success/);
	assert.match(compensationSource, /return \{ success: true, state: result\.mining_state \}/);
	assert.match(compensationSource, /function schedule_mining_compensation/);
	assert.match(compensationSource, /setTimeout\(retry, 250\)/);

	const broadcastStart = source.indexOf("function broadcast_mining_state");
	const loadStart = source.indexOf("async function load_mining_account_state");
	const broadcastSource = source.slice(broadcastStart, loadStart);
	assert.match(broadcastSource, /current\.owner == owner/);
	assert.match(broadcastSource, /current\.map == G\.mining\.map/);
	assert.doesNotMatch(source, /io\.emit\("mining_state"/);
	assert.match(source, /now - refresh\.last < G\.mining\.refresh_ms/);
	assert.match(source, /current\.mining_attempt = attempt/);
	assert.match(source, /current\.c\.mining = \{ ms: attempt\.duration, len: attempt\.duration, rock_id: attempt\.rockId \}/);
	assert.match(source, /connected: Boolean\(player\.socket && !player\.dc && players\[player\.socket\.id\] === player\)/);
	assert.match(source, /reconcileCompensation: schedule_mining_compensation/);
	assert.doesNotMatch(source, /player\.c\.mining = \{ \.\.\.attempt/);
	const playerWire = source.slice(source.indexOf("function player_to_client"), source.indexOf("function monster_to_client"));
	assert.match(playerWire, /data\.c\.mining = \{/);
	for (const privateField of ["actionId", "toolMarker", "chance", "startedAt"]) {
		assert.doesNotMatch(playerWire, new RegExp(`data\\.c\\.mining[^}]*${privateField}`));
	}
	assert.ok((source.match(/emit_mining_state_for_player\(player\)/g) || []).length >= 2, "login and Tunnel entry emit immediate private state");
	assert.match(source, /cdata\.mining_state = publicRockState/);
	assert.match(source, /preserve_action_channels\(player\)/);
	assert.match(source, /cancel_mining_if_mainhand_changed\(player, mining_mainhand_before\)/);
	const serverFunctions = fs.readFileSync(path.join(root, "node/server_functions.js"), "utf8");
	assert.match(serverFunctions, /clear_mining_attempt\(player, "dead"\)/);
	const disconnectStart = source.indexOf('socket.on("disconnect"');
	const disconnectSource = source.slice(disconnectStart, source.indexOf('socket.on("shutdown"', disconnectStart));
	assert.match(disconnectSource, /clear_mining_attempt\(player\)/);
	const miningLogSource = source.slice(source.indexOf("function mining_opaque_log_id"), source.indexOf("function mining_runtime_for"));
	assert.match(miningLogSource, /account_id=/);
	assert.match(miningLogSource, /character_id=/);
	assert.match(miningLogSource, /claim_ms/);
	assert.doesNotMatch(miningLogSource, /actor_id=/);
});

test("[AC-7, AC-10] production compensation adapter rejects missing users and failed transactions", async () => {
	const source = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const adapterSource = source.slice(source.indexOf("function mining_state_for_database"), source.indexOf("function mining_terminal_cancel"));
	const context = {
		G: { mining: { map: "tunnel", respawn_ms: 10000 } },
		players: {},
		publicRockState: () => ({ rocks: {} }),
		Date,
		setTimeout() {},
		get: async () => null,
		tx: async () => assert.fail("missing users must fail before a transaction"),
	};
	vm.createContext(context);
	vm.runInContext(adapterSource, context);
	const request = { rockId: "copper-1", claimId: "claim-a", now: 1000 };
	await assert.rejects(context.compensate_mining_account_rock({ owner: "account-a" }, request), { code: "mining_compensation_missing_user" });

	context.get = async () => ({ _id: "US_account-a" });
	context.tx = async () => ({ failed: true, reason: "injected" });
	await assert.rejects(context.compensate_mining_account_rock({ owner: "account-a" }, request), { code: "mining_compensation_transaction_failed" });

	context.tx = async () => ({ success: true, mining_state: {} });
	await assert.doesNotReject(context.compensate_mining_account_rock({ owner: "account-a" }, request));
});

test("[AC-7] production Mining logs separate opaque account and character identities", () => {
	const source = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const loggingSource = source.slice(source.indexOf("function mining_log_value"), source.indexOf("function mining_runtime_for"));
	const messages = [];
	const context = {
		require,
		server_auth: "test-log-salt",
		server_log: (message) => messages.push(message),
	};
	vm.createContext(context);
	vm.runInContext(loggingSource, context);
	context.log_mining_event(
		{ owner: "raw-account-id", real_id: "raw-character-id" },
		{ action_id: "action-a", rock_id: "copper-1", outcome: "success", claim_ms: 7, completion_ms: 12 },
	);
	assert.equal(messages.length, 1);
	assert.match(messages[0], /^mining account_id=[a-f0-9]{16} character_id=[a-f0-9]{16} /);
	assert.match(messages[0], /claim_ms=7/);
	assert.doesNotMatch(messages[0], /raw-account-id|raw-character-id/);
});

test("[AC-10] malformed persisted Mining state fails without mutating unrelated account fields", () => {
	const user = { info: { email: "kept", mining_rocks: { madeup: { available_at: 9999, claim_id: "x" } } } };
	const snapshot = structuredClone(user);
	assert.throws(() => claimRock(mining, user.info.mining_rocks, { rockId: "copper-1", now: 1, claimId: "new" }), { code: "invalid_mining_state" });
	assert.deepEqual(user, snapshot);
});

test("[AC-8, AC-9] reward failures roll back ore and XP before the account claim is compensated", async () => {
	for (const failurePoint of ["item", "xp"]) {
		const character = readyCharacter({ inventory: [], mining_xp: 0 });
		const attempt = makeAttempt(character, { actionId: `rollback-${failurePoint}` });
		let state = {};
		let compensated = 0;
		const commitRewards = createAtomicMiningRewardCommit({
			snapshot: (current) => ({ inventory: structuredClone(current.inventory), mining_xp: current.mining_xp }),
			restore: (current, snapshot) => {
				current.inventory = snapshot.inventory;
				current.mining_xp = snapshot.mining_xp;
			},
			addItem: (current, item) => {
				current.inventory.push(item);
				if (failurePoint === "item") throw new Error("injected item failure");
			},
			canAddItem: () => true,
			awardXp: (current, award) => {
				current.mining_xp += award.xp;
				if (failurePoint === "xp") throw new Error("injected XP failure");
			},
		});
		const result = await completeMiningAttempt(mining, attempt, {
			character,
			state: {},
			now: 6000,
			random: () => 0,
			bonusRandom: () => 1,
			inventoryCanAccept: () => true,
			claimAdapter: {
				load: async () => state,
				claim: async ({ rockId, now, claimId }) => {
					const claim = claimRock(mining, state, { rockId, now, claimId });
					state = claim.state;
					return claim;
				},
				compensate: async ({ rockId, claimId, now }) => {
					compensated += 1;
					state = require("../game/mining").compensateRockClaim(mining, state, { rockId, claimId, now });
					return { success: true };
				},
			},
			commitRewards: (reward) => commitRewards(character, reward),
		});
		assert.equal(result.outcome, "cancelled");
		assert.equal(result.reason, "reward_failed");
		assert.deepEqual(character.inventory, []);
		assert.equal(character.mining_xp, 0);
		assert.deepEqual(state, {});
		assert.equal(compensated, 1);
	}
});

test("[AC-7, AC-9] missing-user and failed-transaction compensation surface a distinct state failure", async () => {
	for (const failure of ["missing_user", "failed_transaction"]) {
		const character = readyCharacter();
		const attempt = makeAttempt(character, { actionId: `compensation-${failure}` });
		let compensationCalls = 0;
		const reconciliation = [];
		const result = await completeMiningAttempt(mining, attempt, {
			character,
			state: {},
			now: 6000,
			random: () => 0,
			bonusRandom: () => 1,
			inventoryCanAccept: () => true,
			claimAdapter: {
				load: async () => ({}),
				claim: async () => ({ won: true, state: {}, availableAt: 16000 }),
				compensate: async () => {
					compensationCalls += 1;
					if (failure === "missing_user") throw Object.assign(new Error("missing Mining account"), { code: "mining_compensation_missing_user" });
					return { success: false };
				},
			},
			commitRewards: () => {
				throw new Error("injected reward failure");
			},
			onCompensationFailure: (entry) => reconciliation.push(entry),
		});
		assert.equal(result.outcome, "cancelled");
		assert.equal(result.reason, "compensation_failed");
		assert.equal(compensationCalls, 3);
		assert.equal(reconciliation.length, 1);
		assert.equal(reconciliation[0].cause, "reward_failed");
		assert.equal(reconciliation[0].request.claimId, attempt.actionId);
	}
});

test("[AC-7] runtime logs and queues failed compensation without exposing the error payload", async () => {
	const character = readyCharacter();
	const attempt = makeAttempt(character, { actionId: "compensation-log" });
	const logs = [];
	const queued = [];
	const runtime = createMiningRuntime(mining, {
		characterView: (current) => current,
		loadAccountState: async () => ({ state: {} }),
		claim: async () => ({ won: true, state: {}, availableAt: 16000 }),
		compensate: async () => {
			throw Object.assign(new Error("sensitive database details"), { code: "mining_compensation_transaction_failed", payload: { secret: true } });
		},
		inventoryCanAccept: () => true,
		commitRewards: () => {
			throw new Error("reward failure");
		},
		emit() {},
		emitNearby() {},
		log: (_current, fields) => logs.push(fields),
		reconcileCompensation: (_current, request) => queued.push(request),
		now: () => 6000,
		random: () => 0,
		bonusRandom: () => 1,
	});
	const result = await runtime.complete(character, attempt);
	assert.equal(result.reason, "compensation_failed");
	const failureLog = logs.find((entry) => entry.outcome === "compensation_failed");
	assert.deepEqual(failureLog, {
		action_id: attempt.actionId,
		rock_id: attempt.rockId,
		outcome: "compensation_failed",
		reason: "reward_failed",
		exception_code: "mining_compensation_transaction_failed",
		claim_ms: 0,
	});
	assert.equal(queued.length, 1);
	assert.equal(queued[0].claimId, attempt.actionId);
});

test("[AC-8, AC-9] completion rechecks fresh depletion and live capacity before RNG or rewards", async () => {
	const character = readyCharacter();
	const attempt = makeAttempt(character);
	let randomCalls = 0;
	let claimCalls = 0;
	const accountRace = await completeMiningAttempt(mining, attempt, {
		character,
		state: {},
		now: 6000,
		random: () => (randomCalls += 1),
		inventoryCanAccept: () => true,
		claimAdapter: {
			load: async () => ({ [attempt.rockId]: { available_at: 9000, claim_id: "other" } }),
			claim: async () => (claimCalls += 1),
			compensate: async () => ({ success: true }),
		},
		commitRewards: () => assert.fail("rewards must not commit"),
	});
	assert.equal(accountRace.reason, "account_race");
	assert.equal(randomCalls, 0);
	assert.equal(claimCalls, 0);

	let state = {};
	let compensated = 0;
	const filled = await completeMiningAttempt(mining, attempt, {
		character,
		characterView: () => character,
		state: {},
		now: 6000,
		random: () => 0,
		bonusRandom: () => 1,
		inventoryCanAccept: (current) => current.esize > 0,
		claimAdapter: {
			load: async () => state,
			claim: async ({ rockId, now, claimId }) => {
				const result = claimRock(mining, state, { rockId, now, claimId });
				state = result.state;
				character.esize = 0;
				return result;
			},
			compensate: async () => {
				compensated += 1;
				state = {};
				return { success: true };
			},
		},
		commitRewards: () => assert.fail("rewards must not commit"),
	});
	assert.equal(filled.reason, "inventory_full");
	assert.equal(compensated, 1);
	assert.deepEqual(state, {});
});

test("[AC-7, AC-10] disconnect during account load or claim cannot reward an offline character", async () => {
	async function runDisconnect(stage) {
		const character = readyCharacter({ inventory: [] });
		const attempt = makeAttempt(character, { actionId: `disconnect-${stage}` });
		let release;
		let entered;
		const enteredStage = new Promise((resolve) => { entered = resolve; });
		const gate = new Promise((resolve) => { release = resolve; });
		let rewards = 0;
		let compensations = 0;
		const runtime = createMiningRuntime(mining, {
			characterView: (current) => current,
			loadAccountState: async () => {
				if (stage === "load") {
					entered();
					return gate;
				}
				return { state: {} };
			},
			claim: async () => {
				entered();
				return gate;
			},
			compensate: async () => {
				compensations += 1;
				return { success: true };
			},
			inventoryCanAccept: () => true,
			commitRewards: () => {
				rewards += 1;
				return { bonus: null, bonus_omitted: false };
			},
			emit() {},
			emitNearby() {},
			now: () => 6000,
			random: () => 0,
			bonusRandom: () => 1,
		});
		const pending = runtime.complete(character, attempt);
		await enteredStage;
		character.connected = false;
		if (stage === "load") release({ state: {} });
		else release({ won: true, state: { [attempt.rockId]: { available_at: 16000, claim_id: attempt.actionId } }, availableAt: 16000 });
		const result = await pending;
		assert.equal(result.reason, "disconnected");
		assert.equal(rewards, 0);
		assert.equal(compensations, stage === "claim" ? 1 : 0);
	}
	await runDisconnect("load");
	await runDisconnect("claim");
});

test("[AC-7] invalid or unrelated equipment actions preserve Mining and committed main-hand changes cancel it", () => {
	const source = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	const helpers = source.slice(source.indexOf("function mining_tool_marker"), source.indexOf("function clone_mining_reward_value"));
	const context = {};
	vm.createContext(context);
	vm.runInContext(helpers, context);
	const events = [];
	const player = {
		c: { mining: { ms: 1000, len: 5000, rock_id: "copper-1" }, town: { ms: 1 } },
		mining_attempt: { rockId: "copper-1", actionId: "private" },
		slots: { mainhand: { name: "pickaxe", level: 0, rid: "tool-a" }, cape: null },
		socket: { emit: (event, payload) => events.push([event, payload]) },
	};
	const before = context.mining_tool_marker(player.slots.mainhand);
	context.preserve_action_channels(player);
	assert.deepEqual(JSON.parse(JSON.stringify(player.c)), { mining: { ms: 1000, len: 5000, rock_id: "copper-1" } });
	assert.equal(context.cancel_mining_if_mainhand_changed(player, before), false);
	assert.equal(events.length, 0);
	player.slots.cape = { name: "miningcape" };
	assert.equal(context.cancel_mining_if_mainhand_changed(player, before), false);
	player.slots.mainhand = { name: "ironpickaxe", level: 0, rid: "tool-b" };
	assert.equal(context.cancel_mining_if_mainhand_changed(player, before), true);
	assert.equal(player.c.mining, undefined);
	assert.equal(player.mining_attempt, undefined);
	assert.equal(events[0][1].reason, "tool_changed");
});

test("[AC-6 through AC-10] injectable runtime executes private start, transaction, broadcast, and reward flow", async () => {
	let clock = 1000;
	const accountState = new Map();
	const events = [];
	const nearby = [];
	const logs = [];
	const characters = [
		readyCharacter({ id: "a1", name: "Miner A1", inventory: [], mining_xp: 0 }),
		readyCharacter({ id: "a2", name: "Miner A2", inventory: [], mining_xp: 0 }),
		readyCharacter({ id: "b1", owner: "account-b", name: "Miner B", inventory: [], mining_xp: 0 }),
	];
	const rewardCommit = createAtomicMiningRewardCommit({
		snapshot: (current) => ({ inventory: structuredClone(current.inventory), mining_xp: current.mining_xp }),
		restore: (current, snapshot) => Object.assign(current, snapshot),
		addItem: (current, item) => current.inventory.push(item),
		canAddItem: () => true,
		awardXp: (current, award) => (current.mining_xp += award.xp),
	});
	function publish(owner, state) {
		for (const current of characters.filter((entry) => entry.owner === owner)) events.push([current.id, "mining_state", state]);
	}
	const runtime = createMiningRuntime(mining, {
		characterView: (current) => current,
		loadAccountState: async (current) => ({ state: structuredClone(accountState.get(current.owner) || {}) }),
		claim: async (current, request) => {
			const result = claimRock(mining, accountState.get(current.owner) || {}, request);
			accountState.set(current.owner, result.state);
			publish(current.owner, result.state);
			clock += 25;
			return result;
		},
		compensate: async (current) => {
			accountState.set(current.owner, {});
			publish(current.owner, {});
			return { success: true };
		},
		inventoryCanAccept: () => true,
		commitRewards: (current, reward) => rewardCommit(current, reward),
		beginAttempt: (current, attempt) => {
			current.mining_attempt = attempt;
			current.c = { mining: { ms: attempt.duration, len: attempt.duration, rock_id: attempt.rockId } };
		},
		emit: (current, event, payload) => events.push([current.id, event, payload]),
		emitNearby: (current, event, payload) => nearby.push([current.id, event, payload]),
		log: (current, payload) => logs.push([current.id, payload]),
		now: () => clock,
		random: () => 0,
		bonusRandom: () => 1,
	});
	const started = await runtime.start(characters[0], "copper-1", "runtime-action");
	assert.deepEqual(characters[0].c.mining, { ms: 5000, len: 5000, rock_id: "copper-1" });
	assert.equal(started.response.in_progress, true);
	assert.equal(nearby.length, 1);
	clock = 6000;
	const result = await runtime.complete(characters[0], started.attempt);
	assert.equal(result.outcome, "success");
	assert.deepEqual(characters[0].inventory, ["copperore"]);
	assert.equal(characters[0].mining_xp, 6611);
	assert.ok(events.some(([id, event, state]) => id === "a2" && event === "mining_state" && state["copper-1"]));
	assert.equal(events.some(([id, event, state]) => id === "b1" && event === "mining_state" && state["copper-1"]), false);
	assert.equal(logs.find(([, entry]) => entry.outcome === "success")[1].claim_ms, 25);
});

test("[AC-12] successful rewards retain only the approved ore and legacy bonus whitelist", async () => {
	const approved = new Set(["gemfragment", "bronzenugget", "goldnugget", "platinumnugget"]);
	assert.deepEqual(new Set(mining.legacy_bonus.rewards.map((entry) => entry[1])), approved);
	for (const forbidden of ["wbook0", "wbook1", "emotionjar"]) assert.equal(approved.has(forbidden), false);
	const source = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	assert.doesNotMatch(source, /exchange\(player, ref\.drop, \{ phrase: "Mined" \}\)/);
	assert.doesNotMatch(source, /Your pickaxe broke down/);
});

test("[AC-13] Mine Heathcliff retains the quest and gates all Mining stock at the exact levels", () => {
	const ids = mining.tiers.map((tier) => tier.pickaxe).concat(mining.cape.item);
	assert.equal(npcs.gemmerchant.quest, "gemfragment");
	assert.deepEqual(npcs.gemmerchant.items, ids);
	for (const tier of mining.tiers) {
		assert.deepEqual(rawRequirements[tier.pickaxe], [{ skill: "mining", level: tier.level }]);
		assert.deepEqual(items[tier.pickaxe].purchase_requirement, { skill: "mining", level: tier.level });
		assert.equal(items[tier.ore].s, 9999);
		assert.equal(items[tier.ore].g, tier.ore_g);
		assert.equal(items[tier.ore].exclusive, true);
		if (tier.index > 0) assert.equal(items[tier.pickaxe].exclusive, true);
		assert.equal(items[tier.pickaxe].upgrade, undefined);
		assert.equal(items[tier.pickaxe].breaks, undefined);
		assert.throws(() => validateRequirements(tier.pickaxe, [items[tier.pickaxe].purchase_requirement], { mining: { level: tier.level - 1 } }), { code: "skill_level_required" });
		assert.doesNotThrow(() => validateRequirements(tier.pickaxe, [items[tier.pickaxe].purchase_requirement], { mining: { level: tier.level } }));
		assert.equal(items[tier.ore].g * mining.balance.sell_multiplier, items[tier.ore].g * 0.6);
	}
	assert.deepEqual(rawRequirements.miningcape, [{ skill: "mining", level: 99 }]);
	assert.deepEqual(items.miningcape.purchase_requirement, { skill: "mining", level: 99 });
	assert.equal(items.miningcape.exclusive, true);
	const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	assert.match(server, /if \(def\.purchase_requirement\)[\s\S]*validateRequirements\(name, \[def\.purchase_requirement\], player\.skills\)/);
});

test("[AC-13] production buy and sell socket adapters enforce Mining gates and the 0.6 ore sale value", () => {
	const serverSource = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	function socketSource(name, nextName) {
		const start = serverSource.indexOf(`socket.on("${name}"`);
		const end = serverSource.indexOf(`socket.on("${nextName}"`, start);
		assert.ok(start >= 0 && end > start, `missing ${name} handler`);
		return serverSource.slice(start, end);
	}
	const npc = { id: "$Mine Heathcliff", x: 0, y: 0 };
	const buyHandlers = {};
	const buyFailures = [];
	const buySuccesses = [];
	const buyer = {
		name: "Buyer",
		map: "tunnel",
		x: 0,
		y: 0,
		gold: items.ironpickaxe.g,
		items: [],
		skills: { mining: { level: 19 } },
	};
	const buyContext = {
		G: { items: { ironpickaxe: items.ironpickaxe }, maps: { tunnel: { items: { ironpickaxe: [npc] } } }, inflation: 1 },
		B: { sell_dist: 100 },
		players: { socket: buyer },
		socket: { id: "socket", on: (name, handler) => (buyHandlers[name] = handler) },
		can_buy: { ironpickaxe: true },
		gameplay: "normal",
		min: Math.min,
		max: Math.max,
		can_add_item: () => true,
		create_new_item: (name, quantity) => ({ name, ...(quantity > 1 ? { q: quantity } : {}) }),
		simple_distance: () => 0,
		validateRequirements,
		add_item: (player, item) => (player.items.push(item), player.items.length - 1),
		xy_emit() {},
		cache_item: (item) => ({ ...item }),
		resend() {},
		fail_response: (...args) => (buyFailures.push(args), args),
		success_response: (...args) => (buySuccesses.push(args), args),
	};
	vm.createContext(buyContext);
	vm.runInContext(socketSource("buy", "send"), buyContext);
	buyHandlers.buy({ name: "ironpickaxe", quantity: 1 });
	assert.equal(buyFailures.at(-1)[0], "skill_level_required");
	assert.equal(buyer.gold, items.ironpickaxe.g);
	assert.deepEqual(buyer.items, []);
	buyer.skills.mining.level = 20;
	buyHandlers.buy({ name: "ironpickaxe", quantity: 1 });
	assert.equal(buySuccesses.at(-1)[0], "buy_success");
	assert.equal(buyer.gold, 0);
	assert.equal(buyer.items[0].name, "ironpickaxe");

	const commonSource = fs.readFileSync(path.join(root, "js/old_common_functions.js"), "utf8");
	const valueStart = commonSource.indexOf("function calculate_item_value");
	const valueEnd = commonSource.indexOf("function calculate_item_grade", valueStart + 1);
	const nextValueFunction = commonSource.indexOf("\nfunction ", valueStart + 1);
	const valueSource = commonSource.slice(valueStart, nextValueFunction > valueStart ? nextValueFunction : valueEnd);
	const sellHandlers = {};
	const sellSuccesses = [];
	const seller = { name: "Seller", map: "tunnel", x: 0, y: 0, gold: 0, items: [{ name: "copperore" }] };
	const sellContext = {
		G: { items: { copperore: items.copperore }, maps: { tunnel: { merchants: [npc] } } },
		B: { sell_dist: 100 },
		players: { socket: seller },
		socket: { id: "socket", on: (name, handler) => (sellHandlers[name] = handler) },
		min: Math.min,
		max: Math.max,
		round: Math.round,
		simple_distance: () => 0,
		consume: (player, index) => (player.items[index] = null),
		xy_emit() {},
		cache_item: (item) => ({ ...item }),
		resend() {},
		secondhands_logic() {},
		fail_response: assert.fail,
		success_response: (...args) => (sellSuccesses.push(args), args),
	};
	vm.createContext(sellContext);
	vm.runInContext(valueSource, sellContext);
	vm.runInContext(socketSource("sell", "buy_shells"), sellContext);
	sellHandlers.sell({ num: 0, quantity: 1 });
	assert.equal(seller.gold, Math.round(items.copperore.g * 0.6));
	assert.equal(sellSuccesses.at(-1)[0], "gold_received");
	assert.equal(sellSuccesses.at(-1)[1].gold, Math.round(items.copperore.g * 0.6));
});

test("[AC-17] Mining production changes remain inside the approved game boundaries", () => {
	const server = fs.readFileSync(path.join(root, "node/server.js"), "utf8");
	assert.doesNotMatch(server, /drop: "m[12]"/);
	const touchedMiningFiles = ["design/mining.js", "node/game/mining.js", "js/game.js", "js/functions.js"];
	assert.ok(touchedMiningFiles.every((file) => fs.existsSync(path.join(root, file))));
	assert.equal(fs.readFileSync(path.join(root, "version.js"), "utf8").includes("mining"), false);
});
