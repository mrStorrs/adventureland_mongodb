"use strict";

const { SKILL_IDS, MAX_LEVEL, cumulativeXp, maxXpForSkill } = require("./skill_domain");
const { skill_xp } = require("../../design/skill_xp");
const { progression } = require("../../design/progression");
const PRE_MINING_SKILL_IDS = Object.freeze(SKILL_IDS.slice(0, SKILL_IDS.indexOf("mining")));
const PRE_SMITHING_SKILL_IDS = Object.freeze(SKILL_IDS.slice(0, SKILL_IDS.indexOf("smithing")));

function stateError(path, reason, details = {}) {
	const error = new Error(`Invalid character skill state at ${path}: ${reason}`);
	error.code = "invalid_character_skill_state";
	error.path = path;
	error.reason = reason;
	Object.assign(error, details);
	return error;
}

function registryIds(registry) {
	if (Array.isArray(registry)) return registry.slice();
	if (registry && typeof registry === "object") return Object.keys(registry);
	return SKILL_IDS.slice();
}

function nextThreshold(skillId, level, xpTable) {
	if (level >= MAX_LEVEL) return null;
	return (xpTable && xpTable[level + 1]) || cumulativeXp(level + 1, skillId);
}

function createSkillState(registry = SKILL_IDS) {
	const skills = {};
	for (const id of registryIds(registry)) skills[id] = { level: 1, xp: 0 };
	return skills;
}

function computeTotalLevel(skills, registry = null) {
	const ids = registryIds(registry || skills);
	return ids.reduce((total, id) => total + skills[id].level, 0);
}

function validateSkillState(skills, options = {}) {
	const ids = registryIds(options.registry || SKILL_IDS);
	if (!skills || typeof skills !== "object" || Array.isArray(skills)) throw stateError("skills", "must be an object");
	const actualIds = Object.keys(skills);
	if (actualIds.length !== ids.length || actualIds.some((id, index) => id !== ids[index])) {
		throw stateError("skills", "must contain exactly the registered skills in registry order", {
			expected: ids,
			actual: actualIds,
		});
	}
	const xpTable = options.xpTable || null;
	for (const id of ids) {
		const record = skills[id];
		if (!record || typeof record !== "object" || Array.isArray(record))
			throw stateError(`skills.${id}`, "must be an object");
		const keys = Object.keys(record);
		if (keys.some((key) => !["level", "xp"].includes(key))) throw stateError(`skills.${id}`, "contains unknown fields");
		if (!Number.isInteger(record.level) || record.level < 1 || record.level > MAX_LEVEL) {
			throw stateError(`skills.${id}.level`, "must be an integer from 1 through 99");
		}
		const cap = maxXpForSkill(id);
		if (!Number.isSafeInteger(record.xp) || record.xp < 0 || record.xp > cap) {
			throw stateError(`skills.${id}.xp`, `must be a safe integer from 0 through ${cap}`);
		}
		const table = xpTable || null;
		const minimum = (table && table[record.level]) || cumulativeXp(record.level, id);
		const next = nextThreshold(id, record.level, table);
		if (record.xp < minimum || (next !== null && record.xp >= next)) {
			throw stateError(`skills.${id}.xp`, "does not belong to its declared level", { level: record.level });
		}
	}
	return skills;
}

function createCharacterState(registry = SKILL_IDS) {
	const skills = createSkillState(registry);
	return { skills, total_level: computeTotalLevel(skills, registry) };
}

function projectPersistenceState(state, registry = null) {
	validateSkillState(state.skills, { registry: registry || Object.keys(state.skills) });
	return {
		info: {
			skills: JSON.parse(JSON.stringify(state.skills)),
		},
		total_level: computeTotalLevel(state.skills, registry || Object.keys(state.skills)),
	};
}

function loadCharacterState(character, options = {}) {
	if (!character || !character.info || !character.info.skills) throw stateError("info.skills", "is missing");
	const registry = options.registry || SKILL_IDS;
	const ids = registryIds(registry);
	const skills = JSON.parse(JSON.stringify(character.info.skills));
	const actualIds = skills && typeof skills === "object" && !Array.isArray(skills) ? Object.keys(skills) : [];
	const miningMigration =
		SKILL_IDS.includes("mining") &&
		actualIds.length === PRE_MINING_SKILL_IDS.length &&
		actualIds.every((id, index) => id === PRE_MINING_SKILL_IDS[index]);
	const smithingMigration =
		SKILL_IDS.at(-1) === "smithing" &&
		actualIds.length === PRE_SMITHING_SKILL_IDS.length &&
		actualIds.every((id, index) => id === PRE_SMITHING_SKILL_IDS[index]);
	const smeltingRename = actualIds.length === SKILL_IDS.length && actualIds.at(-1) === "smelting" && actualIds.slice(0, -1).every((id, index) => id === SKILL_IDS[index]);
	if (miningMigration) {
		skills.mining = { level: 1, xp: 0 };
		skills.smithing = { level: 1, xp: 0 };
	} else if (smithingMigration) {
		skills.smithing = { level: 1, xp: 0 };
	} else if (smeltingRename) {
		skills.smithing = skills.smelting;
		delete skills.smelting;
	}
	const legacyCurve = character.info.skill_curve_version !== progression.COMBAT_XP_CURVE_VERSION;
	if (legacyCurve) {
		for (const id of ids) {
			if (id === "merchant" || !skills[id] || !Number.isSafeInteger(skills[id].xp)) continue;
			if (id === "mining" || id === "smithing") {
				const level = Math.min(MAX_LEVEL, Math.max(1, Number.isInteger(skills[id].level) ? skills[id].level : 1));
				const oldStart = skill_xp.merchant[level];
				const oldEnd = level === MAX_LEVEL ? oldStart : skill_xp.merchant[level + 1];
				const fraction = oldEnd === oldStart ? 0 : Math.max(0, Math.min(1, (skills[id].xp - oldStart) / (oldEnd - oldStart)));
				const newStart = cumulativeXp(level, id);
				const newEnd = level === MAX_LEVEL ? newStart : cumulativeXp(level + 1, id);
				skills[id] = { level, xp: level === MAX_LEVEL ? newStart : Math.floor(newStart + fraction * (newEnd - newStart)) };
			} else {
				let level = 1;
				for (let candidate = 2; candidate <= MAX_LEVEL; candidate += 1) {
					if (cumulativeXp(candidate, id) > skills[id].xp) break;
					level = candidate;
				}
				skills[id].level = level;
			}
		}
	}
	validateSkillState(skills, { registry, xpTable: options.xpTable });
	const total_level = computeTotalLevel(skills, registry);
	if (!miningMigration && !smithingMigration && !smeltingRename && !legacyCurve && character.total_level !== undefined && character.total_level !== total_level) {
		throw stateError("total_level", "does not equal the sum of registered skill levels", {
			actual: character.total_level,
			expected: total_level,
		});
	}
	return { skills, total_level, skill_curve_version: progression.COMBAT_XP_CURVE_VERSION };
}

function withSkillState(state, skills, registry = null) {
	validateSkillState(skills, { registry: registry || Object.keys(state.skills) });
	return {
		...state,
		skills: JSON.parse(JSON.stringify(skills)),
		total_level: computeTotalLevel(skills, registry || Object.keys(skills)),
	};
}

module.exports = {
	createSkillState,
	createCharacterState,
	computeTotalLevel,
	validateSkillState,
	projectPersistenceState,
	loadCharacterState,
	withSkillState,
	stateError,
	PRE_MINING_SKILL_IDS,
	PRE_SMITHING_SKILL_IDS,
};
