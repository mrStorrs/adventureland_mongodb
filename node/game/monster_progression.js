"use strict";

const { resolveMainhand } = require("./active_skill");

function maximumAssignableTier(weapon, progression) {
	if (!weapon || !Number.isInteger(weapon.rank) || weapon.rank < 1 || !Number.isFinite(weapon.enhancement)) return null;
	const maximum = Number(progression.HUNTER_MAX_ASSIGNABLE_TIER);
	if (!(maximum >= 1)) return null;
	return Math.min(maximum, weapon.rank + (weapon.enhancement >= 4 ? 1 : 0));
}

function resolveHuntWeapon(slots, items, progression) {
	const mainhand = resolveMainhand(slots, items);
	const rank = Number(mainhand?.item?.progression?.shared_rank);
	const enhancement = Number(slots?.mainhand?.level || 0);
	if (!mainhand || !Number.isInteger(rank) || rank < 1 || !Number.isInteger(enhancement) || enhancement < 0) return null;
	const maximum_tier = maximumAssignableTier({ rank, enhancement }, progression);
	if (!maximum_tier) return null;
	return { weapon_id: slots.mainhand.name, skill: mainhand.skill, rank, enhancement, maximum_tier };
}

function chooseHuntCandidate({ instances, maps, progression, maximum_tier, hunted_ids = new Set() }) {
	if (!Number.isInteger(maximum_tier) || maximum_tier < 1) return null;
	const candidates = [];
	for (const [instanceId, instance] of Object.entries(instances || {})) {
		if (instance.name !== instanceId || (maps && (!maps[instanceId] || maps[instanceId].irregular))) continue;
		for (const monster of Object.values(instance.monsters || {})) {
			const definition = progression.MONSTER_PROGRESSION?.[monster.type];
			if (!definition?.hunter_eligible || !Number.isInteger(definition.tier) || definition.tier > maximum_tier || hunted_ids.has(monster.type) || monster.target || !(Number(monster.max_hp) > 0)) continue;
			candidates.push({ monster_id: monster.type, tier: definition.tier, level: Number(monster.level || 0), max_hp: Number(monster.max_hp) });
		}
	}
	if (!candidates.length) return null;
	candidates.sort((left, right) => right.tier - left.tier || right.level - left.level);
	const selected = candidates[0];
	return { monster_id: selected.monster_id, tier: selected.tier, max_hp: selected.max_hp };
}

function huntPopulation(maps, monsterId) {
	let population = 0;
	for (const map of Object.values(maps || {})) {
		if (map.irregular || !map.monsters) continue;
		for (const pack of map.monsters) if (pack.type === monsterId) population += Number(pack.count || 0);
	}
	return population;
}

function calculateHuntCount({ population, max_hp, respawn, hardcore }) {
	const hp = Number(max_hp) / 1000;
	if (!(Number(population) > 0 && hp > 0 && Number(respawn) >= 0)) return null;
	let count = Math.max(1, Math.min(500, parseInt((20 * 60 * Math.max(1, Number(population))) / hp / (Number(respawn) + .25))));
	if (hardcore) count = Math.max(1, parseInt(count / 10));
	return Number.isInteger(count) && count > 0 ? count : null;
}

function createHuntRecord({ server_name, monster_id, tier, count }) {
	if (typeof server_name !== "string" || typeof monster_id !== "string" || !Number.isInteger(tier) || !(Number(count) > 0)) return null;
	return { v: 2, sn: server_name, id: monster_id, tier, c: count, ms: 30 * 60 * 1000, dl: true };
}

function normalizeHunt(record, progression) {
	if (!record || typeof record.id !== "string" || !Number.isFinite(Number(record.c))) return null;
	const tier = Number(progression.MONSTER_PROGRESSION?.[record.id]?.tier);
	if (!Number.isInteger(tier) || tier < 1 || tier > Number(progression.HUNTER_MAX_ASSIGNABLE_TIER)) return null;
	return { ...record, v: 2, tier };
}

function rewardQuantity(tier, hardcore, progression) {
	const reward = Number(progression.HUNTER_TOKEN_REWARDS?.[tier]);
	if (!Number.isSafeInteger(reward) || reward < 1) return null;
	return hardcore ? reward * 100 : reward;
}

module.exports = { calculateHuntCount, chooseHuntCandidate, createHuntRecord, huntPopulation, maximumAssignableTier, normalizeHunt, resolveHuntWeapon, rewardQuantity };
