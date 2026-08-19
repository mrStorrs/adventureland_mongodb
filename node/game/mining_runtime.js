"use strict";

const { completeMiningAttempt, prepareMiningAttempt, publicRockState } = require("./mining");

function requireDependency(dependencies, name) {
	if (typeof dependencies[name] !== "function") throw new TypeError(`Mining runtime dependency ${name} is required`);
	return dependencies[name];
}

function createAtomicMiningRewardCommit(dependencies) {
	const snapshot = requireDependency(dependencies, "snapshot");
	const restore = requireDependency(dependencies, "restore");
	const addItem = requireDependency(dependencies, "addItem");
	const canAddItem = requireDependency(dependencies, "canAddItem");
	const awardXp = requireDependency(dependencies, "awardXp");
	return function commitMiningRewards(character, reward) {
		const before = snapshot(character);
		try {
			addItem(character, reward.ore);
			let bonus = null;
			let bonusOmitted = false;
			if (reward.bonus) {
				if (canAddItem(character, reward.bonus)) {
					addItem(character, reward.bonus);
					bonus = reward.bonus;
				} else {
					bonusOmitted = true;
				}
			}
			const xpResult = awardXp(character, {
				skill: reward.skill,
				xp: reward.xp,
				sourceId: reward.sourceId,
			});
			if (xpResult && typeof xpResult.then === "function") {
				throw new TypeError("Mining reward XP commits must be synchronous");
			}
			return { bonus, bonus_omitted: bonusOmitted, xp: xpResult };
		} catch (error) {
			restore(character, before);
			throw error;
		}
	};
}

function createMiningRuntime(data, dependencies) {
	const characterView = requireDependency(dependencies, "characterView");
	const loadAccountState = requireDependency(dependencies, "loadAccountState");
	const claim = requireDependency(dependencies, "claim");
	const compensate = requireDependency(dependencies, "compensate");
	const inventoryCanAccept = requireDependency(dependencies, "inventoryCanAccept");
	const commitRewards = requireDependency(dependencies, "commitRewards");
	const emit = requireDependency(dependencies, "emit");
	const emitNearby = requireDependency(dependencies, "emitNearby");
	const now = dependencies.now || Date.now;
	const random = dependencies.random || Math.random;
	const bonusRandom = dependencies.bonusRandom || Math.random;
	const log = dependencies.log || function () {};
	const beginAttempt = dependencies.beginAttempt || function () {};
	const reconcileCompensation = dependencies.reconcileCompensation || function () {};

	async function accountState(character) {
		const loaded = await loadAccountState(character);
		return loaded && Object.prototype.hasOwnProperty.call(loaded, "state") ? loaded.state : loaded;
	}

	async function start(character, targetId, actionId) {
		const startedAt = now();
		const state = await accountState(character);
		const attempt = prepareMiningAttempt(data, {
			character: characterView(character),
			state,
			targetId,
			now: startedAt,
			actionId,
			inventoryCanAccept: function (_view, itemName) {
				return inventoryCanAccept(character, itemName);
			},
		});
		const response = {
			response: "data",
			place: "mining",
			success: false,
			in_progress: true,
			rock_id: attempt.rockId,
			duration: attempt.duration,
		};
		beginAttempt(character, attempt);
		emit(character, "mining_state", publicRockState(data, state, now()));
		emit(character, "game_response", response);
		emitNearby(character, "ui", { type: "mining_start", name: character.name, rock_id: attempt.rockId });
		log(character, { action_id: attempt.actionId, rock_id: attempt.rockId, outcome: "started" });
		return { attempt, response, state };
	}

	async function complete(character, attempt) {
		const completionStartedAt = now();
		let claimMs = 0;
		try {
			const result = await completeMiningAttempt(data, attempt, {
				character: characterView(character),
				characterView: function () {
					return characterView(character);
				},
				state: {},
				now: now(),
				random,
				bonusRandom,
				inventoryCanAccept: function (_view, itemName) {
					return inventoryCanAccept(character, itemName);
				},
				claimAdapter: {
					load: function () {
						return accountState(character);
					},
					claim: async function (request) {
						const claimStartedAt = now();
						try {
							return await claim(character, request);
						} finally {
							claimMs += Math.max(0, now() - claimStartedAt);
						}
					},
					compensate: function (request) {
						return compensate(character, request);
					},
				},
				commitRewards: function (reward) {
					return commitRewards(character, reward);
				},
				onCompensationFailure: function (failure) {
					try {
						log(character, {
							action_id: attempt.actionId,
							rock_id: attempt.rockId,
							outcome: "compensation_failed",
							reason: failure.cause,
							exception_code: failure.error && (failure.error.code || failure.error.name),
							claim_ms: claimMs,
						});
					} finally {
						reconcileCompensation(character, failure.request);
					}
				},
			});
			emit(character, "game_response", result);
			log(character, {
				action_id: attempt.actionId,
				rock_id: attempt.rockId,
				outcome: result.outcome,
				reason: result.reason,
				ore: result.ore,
				xp: result.xp,
				bonus: result.bonus,
				claim_ms: claimMs,
				completion_ms: now() - completionStartedAt,
			});
			return result;
		} catch (error) {
			log(character, {
				action_id: attempt && attempt.actionId,
				rock_id: attempt && attempt.rockId,
				outcome: "error",
				exception_code: error && (error.code || error.name),
				claim_ms: claimMs,
				completion_ms: now() - completionStartedAt,
			});
			throw error;
		}
	}

	return { start, complete };
}

module.exports = { createAtomicMiningRewardCommit, createMiningRuntime };
