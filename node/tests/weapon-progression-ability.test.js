"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { authorizeAbility } = require("../game/ability_access");
const { COMBAT_SKILL_IDS } = require("../game/skill_domain");
const { calculateStats } = require("../game/stats");
const { RANKING_FIXTURE_PATH, loadRankingFixture } = require("../tools/weapon-acquisition-ranking");
const {
	PARITY_FIXTURE_PATH,
	LEGACY_BASELINE_PATH,
	buildParityReport,
	loadParityFixture,
	loadPropertyCalculators,
} = require("../tools/weapon-progression-parity");

function weaponAtAbilityLevel(rows, skill, level) {
	const candidates = rows
		.filter((row) => row.skill === skill && row.requirement_level <= level)
		.sort((left, right) => right.requirement_level - left.requirement_level || left.weapon_id.localeCompare(right.weapon_id));
	assert.ok(candidates.length, `${skill} has a weapon at level ${level}`);
	return candidates[0];
}

function abilityEffect(ability, semantics, stats) {
	if (semantics.effect === "mana_ratio") return stats.max_mp * semantics.ratio;
	if (semantics.effect === "fixed_damage") return semantics.damage;
	if (semantics.effect === "attack_multiplier") return stats.attack * semantics.damage_multiplier;
	if (semantics.effect === "damage_taken_multiplier") return semantics.damage_multiplier;
	throw new Error(`Selected ability ${ability.name} has no documented deterministic effect`);
}

function abilityResourceCost(ability, stats) {
	return Number(ability.ratio) > 0 ? stats.max_mp : Number(ability.mp || 0);
}

function weaponStats(report, calculators, weaponId, upgradeLevel) {
	return calculateStats({
		slots: { mainhand: { name: weaponId, level: upgradeLevel } },
		items: report.data.items,
		getItemProperties: calculators.current.calculate_item_properties,
	});
}

test("combat abilities are selected or explicitly excluded and retain access, effects, cooldowns, and resources", () => {
	const fixture = loadParityFixture(PARITY_FIXTURE_PATH);
	const validation = fixture.ability_validation;
	assert.ok(validation && Array.isArray(validation.selected) && validation.exceptions && validation.semantics);
	const report = buildParityReport({ fixturePath: PARITY_FIXTURE_PATH, legacyBaselinePath: LEGACY_BASELINE_PATH });
	const ranking = loadRankingFixture(RANKING_FIXTURE_PATH);
	for (const target of ranking.weapons) {
		const row = report.rows.find((candidate) => candidate.weapon_id === target.weapon_id);
		assert.ok(row, target.weapon_id);
		assert.equal(row.current_requirement_level, target.assigned_requirement, target.weapon_id);
	}
	const calculators = loadPropertyCalculators(report.data);
	const abilities = report.data.abilities;
	const combatAbilities = Object.entries(abilities)
		.filter(([, ability]) => COMBAT_SKILL_IDS.includes(ability.skill))
		.map(([id]) => id)
		.sort();
	const covered = new Set([...validation.selected, ...Object.keys(validation.exceptions)]);
	assert.deepEqual([...covered].sort(), combatAbilities);
	for (const [id, reason] of Object.entries(validation.exceptions)) assert.ok(reason.length > 0, id);

	for (const abilityId of validation.selected) {
		const ability = abilities[abilityId];
		const semantics = validation.semantics[abilityId];
		assert.ok(ability, abilityId);
		assert.ok(semantics, abilityId);
		assert.equal(ability.cooldown || 0, semantics.cooldown, abilityId);
		if (semantics.mp !== undefined) assert.equal(ability.mp || 0, semantics.mp, abilityId);
		if (semantics.ratio !== undefined) assert.equal(ability.ratio, semantics.ratio, abilityId);
		if (semantics.damage !== undefined) assert.equal(ability.damage, semantics.damage, abilityId);
		if (semantics.effect === "attack_multiplier") assert.equal(ability.damage_multiplier, semantics.damage_multiplier, abilityId);
		if (semantics.effect === "damage_taken_multiplier") {
			assert.equal(ability.condition, "cursed", abilityId);
			assert.equal(ability.duration, semantics.duration, abilityId);
		}
		const weapon = weaponAtAbilityLevel(report.rows, ability.skill, ability.level || 1);
		const character = { skills: { [ability.skill]: { level: ability.level || 1 } } };
		const slots = { mainhand: { name: weapon.weapon_id, level: 0 } };
		const result = authorizeAbility({ ability, abilityId, character, slots, items: report.data.items });
		assert.equal(result.authorized, true, abilityId);
		assert.equal(result.active_skill, ability.skill, abilityId);
		const stats = weaponStats(report, calculators, weapon.weapon_id, 0);
		const effect = abilityEffect(ability, semantics, stats);
		assert.ok(Number.isFinite(effect) && effect > 0, abilityId);
		const resourceCost = abilityResourceCost(ability, stats);
		assert.ok(Number.isFinite(resourceCost) && resourceCost >= 0, abilityId);
		assert.ok(Number.isFinite(semantics.mp_regen_per_second) && semantics.mp_regen_per_second > 0, abilityId);
		if (Number(ability.ratio) > 0) assert.equal(resourceCost, stats.max_mp, abilityId);
		if (ability.cooldown !== undefined) {
			assert.ok(Number.isFinite(ability.cooldown) && ability.cooldown >= 0, abilityId);
			if (ability.cooldown > 0) {
				assert.throws(
					() => authorizeAbility({ ability, abilityId, character, slots, items: report.data.items, now: 10_000, lastUse: 10_000 - ability.cooldown + 1, cooldown: ability.cooldown }),
					(error) => error.code === "ability_on_cooldown",
					abilityId,
				);
			}
		}
		if (ability.damage_type !== undefined) assert.ok(["physical", "magical", "pure"].includes(ability.damage_type), abilityId);
		assert.throws(
			() => authorizeAbility({ ability, abilityId, character, slots: { mainhand: { name: "blade", level: 0 } }, items: report.data.items }),
			(error) => error.code === "wrong_active_skill",
			abilityId,
		);
	}
});
