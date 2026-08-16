"use strict";

const DIRECT_EFFECT_KEYS = Object.freeze([
	"damage",
	"heal",
	"attacks_per_second",
	"hp",
	"mp",
	"base_crit",
	"crit",
	"courage",
	"mcourage",
	"pcourage",
	"pvp_damage_reduction",
	"throw_range",
	"armor",
	"resistance",
	"speed",
	"apiercing",
	"rpiercing",
	"lifesteal",
	"manasteal",
	"evasion",
	"reflection",
	"mp_cost",
	"mp_reduction",
	"output",
	"range",
	"critdamage",
	"miss",
	"avoidance",
	"luck",
	"gold",
	"xp",
	"incdmgamp",
	"stun",
	"blast",
	"explosion",
	"cuteness",
	"bling",
	"dreturn",
	"pnresistance",
	"firesistance",
	"fzresistance",
	"phresistance",
	"stresistance",
]);

const DIRECT_EFFECT_KEY_SET = new Set(DIRECT_EFFECT_KEYS);
const CLAMPED_EFFECTS = Object.freeze({ base_crit: [0, 80], pvp_damage_reduction: [0, 100] });

function directEffectError(message, details = {}) {
	const error = new Error(message);
	error.code = "invalid_direct_effect";
	Object.assign(error, details);
	return error;
}

function isPlainObject(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function finiteNumber(value, path) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw directEffectError(`Direct effect at ${path} must be finite`, { path, value });
	}
	return value;
}

function canonicalDirectVector(vector, { allowEmpty = false, path = "effects" } = {}) {
	if (!isPlainObject(vector)) throw directEffectError(`Direct effect vector at ${path} must be an object`, { path });
	const result = {};
	for (const key of Object.keys(vector).sort()) {
		if (!DIRECT_EFFECT_KEY_SET.has(key)) {
			throw directEffectError(`Unknown direct effect ${key} at ${path}`, { path: `${path}.${key}`, key });
		}
		const value = finiteNumber(vector[key], `${path}.${key}`);
		if (value !== 0) result[key] = value;
	}
	if (!allowEmpty && Object.keys(result).length === 0) {
		throw directEffectError(`Direct effect vector at ${path} must contain a nonzero effect`, { path });
	}
	return result;
}

function validateDirectVector(vector, options) {
	return canonicalDirectVector(vector, options);
}

function validateDirectBonus(value, { knownSources, path = "direct_bonus" } = {}) {
	if (!isPlainObject(value)) throw directEffectError(`Direct bonus at ${path} must be an object`, { path });
	if (value.version !== 1) {
		throw directEffectError(`Unsupported direct bonus version at ${path}`, { path: `${path}.version`, version: value.version });
	}
	if (typeof value.source !== "string" || !value.source) {
		throw directEffectError(`Direct bonus source at ${path} must be a stable item ID`, { path: `${path}.source` });
	}
	if (!(knownSources instanceof Set) || !knownSources.has(value.source)) {
		throw directEffectError(`Unknown direct bonus source ${value.source} at ${path}`, {
			path: `${path}.source`,
			source: value.source,
		});
	}
	const allowed = new Set(["version", "source", "effects"]);
	for (const key of Object.keys(value)) {
		if (!allowed.has(key)) throw directEffectError(`Unknown direct bonus field ${key} at ${path}`, { path: `${path}.${key}`, key });
	}
	return { version: 1, source: value.source, effects: canonicalDirectVector(value.effects, { path: `${path}.effects` }) };
}

function clampEffect(key, value) {
	const range = CLAMPED_EFFECTS[key];
	if (!range) return value;
	return Math.max(range[0], Math.min(range[1], value));
}

function mergeDirectEffects(...vectors) {
	const result = {};
	for (const vector of vectors) {
		if (vector === undefined || vector === null) continue;
		for (const [key, value] of Object.entries(canonicalDirectVector(vector, { allowEmpty: true }))) {
			result[key] = (result[key] || 0) + value;
		}
	}
	for (const key of Object.keys(result)) {
		result[key] = clampEffect(key, result[key]);
		if (result[key] === 0) delete result[key];
	}
	return result;
}

function directDps(damage, attacksPerSecond) {
	return finiteNumber(damage, "damage") * finiteNumber(attacksPerSecond, "attacks_per_second");
}

module.exports = {
	DIRECT_EFFECT_KEYS,
	DIRECT_EFFECT_KEY_SET,
	CLAMPED_EFFECTS,
	directDps,
	mergeDirectEffects,
	validateDirectBonus,
	validateDirectVector,
};
