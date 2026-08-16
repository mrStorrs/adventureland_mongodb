"use strict";

const { WEAPON_PROFILES, resolveMainhand } = require("./active_skill");
const { EXPECTED_BASELINE } = require("./skill_domain");
const { applySicknessMultiplier } = require("./death_sickness");

const BASELINE = Object.freeze({
	max_hp: Number(EXPECTED_BASELINE.max_hp || 100),
	max_mp: Number(EXPECTED_BASELINE.max_mp || 100),
	speed: Number(EXPECTED_BASELINE.speed || 0),
	inventory_size: Number(EXPECTED_BASELINE.inventory_size || 42),
	attack: Number(EXPECTED_BASELINE.attack || 0),
	heal: Number(EXPECTED_BASELINE.heal || 0),
	armor: Number(EXPECTED_BASELINE.armor || 0),
	resistance: Number(EXPECTED_BASELINE.resistance || 0),
	piercing: 0,
	crit: 0,
	luck: 0,
	gold: 0,
	xp: 0,
});

const BASE_CRIT_CAP = 80;
const GEAR_CRIT_CAP = 20;

const ATTRIBUTES = new Set([
	"hp",
	"mp",
	"speed",
	"armor",
	"resistance",
	"attacks_per_second",
	"damage",
	"heal",
	"base_crit",
	"crit",
	"critdamage",
	"evasion",
	"miss",
	"avoidance",
	"lifesteal",
	"manasteal",
	"apiercing",
	"rpiercing",
	"range",
	"throw_range",
	"output",
	"courage",
	"mcourage",
	"pcourage",
	"pvp_damage_reduction",
	"luck",
	"gold",
	"xp",
	"mp_cost",
	"mp_reduction",
	"incdmgamp",
	"stun",
	"blast",
	"explosion",
	"cuteness",
	"bling",
	"dreturn",
	"reflection",
	"pnresistance",
	"firesistance",
	"fzresistance",
	"phresistance",
	"stresistance",
]);

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function baseStats() {
	return {
		...BASELINE,
		max_hp: BASELINE.max_hp,
		max_mp: BASELINE.max_mp,
		attack: 0,
		heal: 0,
		frequency: 0,
		range: 0,
		throw_range: 0,
		damage_type: null,
		projectile: null,
		mp_cost: 0,
		attack_ms: 0,
		output: 100,
		courage: 0,
		mcourage: 0,
		pcourage: 0,
		pvp_damage_reduction: 0,
		sets: {},
		abilities: {},
		auras: {},
	};
}

function mergeProperty(stats, property, { noRange = false, critSource = null } = {}) {
	for (const [key, value] of Object.entries(property || {})) {
		if (typeof value !== "number" || !Number.isFinite(value)) continue;
		if (noRange && key === "range") continue;
		if (!ATTRIBUTES.has(key)) continue;
		if (key === "attacks_per_second") stats.frequency += value;
		else if (key === "damage") stats.attack += value;
		else if (key === "base_crit") stats._base_crit += value;
		else if (key === "crit" && critSource) stats[critSource] += value;
		else if (key === "hp") stats.max_hp += value;
		else if (key === "mp") stats.max_mp += value;
		else if (key === "output") stats.output += value;
		else if (key === "luck") stats.xluck += value;
		else if (key === "gold") stats.xgold += value;
		else if (key === "xp") stats.xxp += value;
		else stats[key] = (stats[key] || 0) + value;
	}
}

function itemProperties(item, definition, getProperties) {
	if (getProperties) return getProperties(item, definition) || {};
	const props = {};
	for (const key of ATTRIBUTES) if (typeof definition[key] === "number") props[key] = definition[key];
	return props;
}

function applyProfile(stats, profile, item) {
	if (!profile) return;
	stats.range = profile.range;
	stats.projectile = item.projectile === undefined ? profile.projectile : item.projectile;
	stats.damage_type = item.damage_type === undefined ? profile.damage_type : item.damage_type;
	stats.mp_cost = profile.mp_cost;
	if (profile.mp_cost_modifier) stats.mp_cost += profile.mp_cost_modifier;
	if (profile.speed) stats.speed += profile.speed;
	if (profile.apiercing) stats.apiercing += profile.apiercing;
}

function applySetProperties(stats, slots, items, sets, getProperties) {
	const counts = {};
	for (const slot of ["helmet", "chest", "pants", "gloves", "shoes"]) {
		const item = slots && slots[slot];
		const definition = item && items[item.name];
		if (!definition || !definition.set || !sets || !sets[definition.set]) continue;
		const members = sets[definition.set].bonus_items && sets[definition.set].bonus_items[slot];
		if (!Array.isArray(members) || !members.includes(item.name)) continue;
		const set = definition.set;
		counts[set] = (counts[set] || 0) + 1;
	}
	stats.sets = counts;
	for (const [set, count] of Object.entries(counts)) {
		const property = sets && sets[set] && sets[set][count];
		if (property) {
			mergeProperty(stats, getProperties ? getProperties({ name: set, count }, property) : property, {
				critSource: "_gear_crit",
			});
		}
	}
}

function applyConditionProperties(stats, conditions, conditionDefinitions) {
	for (const [name, condition] of Object.entries(conditions || {})) {
		mergeProperty(stats, condition, { critSource: "_effect_crit" });
		if (conditionDefinitions && conditionDefinitions[name]) {
			mergeProperty(stats, conditionDefinitions[name], { critSource: "_effect_crit" });
		}
	}
}

function calculateStats({
	slots = {},
	items = {},
	sets = {},
	conditions = {},
	conditionDefinitions = {},
	profiles = WEAPON_PROFILES,
	getItemProperties = null,
	getSetProperties = null,
	previousHp = null,
	previousMp = null,
	deathSickness = false,
	worldEffects = null,
}) {
	const stats = baseStats();
	stats.xluck = 0;
	stats.xgold = 0;
	stats.xxp = 0;
	stats._base_crit = 0;
	stats._gear_crit = 0;
	stats._effect_crit = 0;
	const mainResolution = resolveMainhand(slots, items, profiles);
	const main = mainResolution && mainResolution.item;
	const profile = mainResolution && mainResolution.profile;
	if (main) applyProfile(stats, profile, main);

	for (const [slot, instance] of Object.entries(slots || {})) {
		if (!instance || !items[instance.name]) continue;
		const definition = items[instance.name];
		const property = itemProperties(instance, definition, getItemProperties);
		mergeProperty(stats, property, {
			noRange: slot === "offhand" && definition.type === "weapon",
			critSource: "_gear_crit",
		});
		if (definition.ability) {
			stats.abilities[definition.ability] = {
				...(stats.abilities[definition.ability] || {}),
				attr0: ((stats.abilities[definition.ability] && stats.abilities[definition.ability].attr0) || 0) + (property.attr0 || 0),
				attr1: ((stats.abilities[definition.ability] && stats.abilities[definition.ability].attr1) || 0) + (property.attr1 || 0),
			};
		}
		if (definition.aura) stats.auras[definition.aura] = { attr0: property.attr0 || 0, attr1: property.attr1 || 0 };
		if (slot === "offhand" && definition.type === "weapon") stats.attack -= (property.damage || 0) * 0.3;
	}
	applySetProperties(stats, slots, items, sets, getSetProperties);
	applyConditionProperties(stats, conditions, conditionDefinitions);

	if (main && slots.offhand && items[slots.offhand.name] && main.wtype === "stars" && items[slots.offhand.name].wtype !== "stars") {
		stats.attack /= 3;
	}
	if (worldEffects) mergeProperty(stats, worldEffects, { critSource: "_effect_crit" });
	stats.crit = Math.max(0, Math.min(100, Math.min(BASE_CRIT_CAP, stats._base_crit) + Math.min(GEAR_CRIT_CAP, stats._gear_crit) + stats._effect_crit));
	stats.pvp_damage_reduction = Math.max(0, Math.min(100, stats.pvp_damage_reduction));
	Object.assign(stats, applySicknessMultiplier(stats, deathSickness));
	stats.attack = Math.max(0, Math.round(stats.attack));
	stats.heal = Math.max(0, Math.round(stats.heal));
	stats.max_hp = Math.max(1, Math.round(stats.max_hp));
	stats.max_mp = Math.max(1, Math.round(stats.max_mp));
	stats.armor = Math.round(stats.armor);
	stats.resistance = Math.round(stats.resistance);
	stats.frequency = Math.max(0.01, stats.frequency);
	stats.attack_ms = Math.round(1000 / stats.frequency);
	stats.mp_cost = Math.max(1, Math.round(stats.mp_cost));
	stats.xpm = Math.max(0.01, 1 + stats.xxp / 100);
	stats.xgold = Math.max(0, stats.xgold);
	stats.xluck = Math.max(0, stats.xluck);
	stats.goldm = 1 + stats.xgold / 100;
	stats.luckm = 1 + stats.xluck / 100;
	stats.hp = previousHp === null ? stats.max_hp : Math.max(0, Math.min(previousHp, stats.max_hp));
	stats.mp = previousMp === null ? stats.max_mp : Math.max(0, Math.min(previousMp, stats.max_mp));
	delete stats._base_crit;
	delete stats._gear_crit;
	delete stats._effect_crit;
	return clone(stats);
}

module.exports = {
	BASELINE,
	BASE_CRIT_CAP,
	GEAR_CRIT_CAP,
	calculateStats,
	baseStats,
	mergeProperty,
};
