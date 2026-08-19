"use strict";

const crypto = require("node:crypto");
const { skills: DESIGN_SKILLS } = require("../../design/skills");
const { character: CHARACTER_DEFINITION } = require("../../design/character");
const { progression } = require("../../design/progression");
const { skill_xp: DESIGN_SKILL_XP } = require("../../design/skill_xp");
const { mining: DESIGN_MINING } = require("../../design/mining");
const { validateMiningData } = require("./mining");
const { validateSmeltingData } = require("./smelting");

const SKILL_IDS = Object.freeze(Object.keys(DESIGN_SKILLS));
const SKILL_DEFINITIONS = DESIGN_SKILLS;
const COMBAT_SKILL_IDS = Object.freeze(
	SKILL_IDS.filter((id) => DESIGN_SKILLS[id] && DESIGN_SKILLS[id].kind === "combat"),
);
const MAX_LEVEL = progression.MAX_LEVEL;
const MAX_XP = progression.MAX_XP;
const COMBAT_SKILL_SET = new Set(COMBAT_SKILL_IDS);
const STARTER_WEAPONS = Object.freeze([...(CHARACTER_DEFINITION.starter?.weapons || [])]);
const EXPECTED_BASELINE = Object.freeze({ ...(CHARACTER_DEFINITION.baseline || {}) });
const EQUIPPABLE_TYPES = new Set([
	"helmet",
	"pants",
	"chest",
	"weapon",
	"amulet",
	"earring",
	"shoes",
	"gloves",
	"ring",
	"shield",
	"belt",
	"source",
	"orb",
	"quiver",
	"cape",
	"misc_offhand",
	"tool",
]);
const NONCOMBAT_TOOL_TYPES = new Set(["rod", "pickaxe"]);
const MINING_REQUIREMENTS = new Map([
	...DESIGN_MINING.tiers.map((tier) => [tier.pickaxe, [{ skill: "mining", level: tier.level }]]),
	[DESIGN_MINING.cape.item, [{ skill: "mining", level: DESIGN_MINING.cape.level }]],
]);
const VALIDATED_PUBLICATION = Symbol("validated progression publication");
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function fail(code, message, details) {
	const error = new Error(message);
	error.code = code;
	if (details) Object.assign(error, details);
	return error;
}

function tableForSkill(skillId) {
	const key = COMBAT_SKILL_SET.has(skillId) ? "combat" : "merchant";
	return DESIGN_SKILL_XP[key];
}

function maxXpForSkill(skillId) {
	return tableForSkill(skillId)[MAX_LEVEL];
}

function cumulativeXp(level, skillId = "merchant") {
	if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
		throw fail("invalid_skill_level", `Skill level must be an integer from 1 to ${MAX_LEVEL}`, { level });
	}
	return tableForSkill(skillId)[level];
}

function tierToRequiredLevel(tier) {
	const value = tier === undefined ? 1 : tier;
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw fail("invalid_item_tier", "Item tier must be a finite non-negative number", { tier });
	}
	if (value <= 1) return 1;
	if (value <= 1.25) return 10;
	if (value <= 1.5) return 20;
	if (value <= 1.75) return 30;
	if (value <= 2) return 40;
	if (value <= 2.25) return 50;
	if (value <= 2.5) return 60;
	if (value <= 2.75) return 70;
	if (value <= 3) return 80;
	if (value <= 3.5) return 90;
	return 95;
}

function buildWeaponOwners(registry) {
	const loadedCombatSkillIds = SKILL_IDS.filter((id) => registry[id] && registry[id].kind === "combat");
	if (loadedCombatSkillIds.length !== COMBAT_SKILL_IDS.length) {
		throw fail("invalid_skill_registry", "The loaded registry must contain exactly six combat skills", {
			combat_skills: loadedCombatSkillIds,
		});
	}
	const weaponOwners = new Map();
	for (const id of loadedCombatSkillIds) {
		for (const weaponType of registry[id].weapon_types || []) {
			if (NONCOMBAT_TOOL_TYPES.has(weaponType)) {
				throw fail("invalid_skill_registry", `Noncombat tool ${weaponType} cannot be a combat weapon`, {
					skill: id,
					weapon_type: weaponType,
				});
			}
			if (weaponOwners.has(weaponType)) {
				throw fail("invalid_skill_registry", `Weapon type ${weaponType} has multiple owners`, {
					weapon_type: weaponType,
					owners: [weaponOwners.get(weaponType), id],
				});
			}
			weaponOwners.set(weaponType, id);
		}
	}
	return weaponOwners;
}

function validateSkillRegistry(registry) {
	if (!registry || typeof registry !== "object")
		throw fail("invalid_skill_registry", "Skill registry must be an object");
	if (Object.keys(registry).join("\0") !== SKILL_IDS.join("\0")) {
		throw fail("invalid_skill_registry", "Skill registry order or IDs differ from the canonical registry", {
			actual: Object.keys(registry),
		});
	}
	for (const id of SKILL_IDS) {
		const definition = registry[id];
		const expected = SKILL_DEFINITIONS[id];
		const allowedKeys = new Set(["id", "name", "kind", "max_level"]);
		if (expected.weapon_types) allowedKeys.add("weapon_types");
		const unexpectedKeys = definition && Object.keys(definition).filter((key) => !allowedKeys.has(key));
		if (
			!definition ||
			unexpectedKeys.length ||
			definition.id !== id ||
			definition.name !== expected.name ||
			definition.kind !== expected.kind ||
			definition.max_level !== expected.max_level
		) {
			throw fail("invalid_skill_registry", `Invalid skill definition for ${id}`, {
				skill: id,
				unexpected_keys: unexpectedKeys,
			});
		}
		if (definition.kind === "combat" && (!Array.isArray(definition.weapon_types) || !definition.weapon_types.length)) {
			throw fail("invalid_skill_registry", `Combat skill ${id} has no weapon ownership`, { skill: id });
		}
		if (definition.kind === "noncombat" && definition.weapon_types) {
			throw fail("invalid_skill_registry", `Noncombat skill ${id} owns weapons`, { skill: id });
		}
	}
	const weaponOwners = buildWeaponOwners(registry);
	for (const id of SKILL_IDS) {
		if (JSON.stringify(registry[id].weapon_types || []) !== JSON.stringify(SKILL_DEFINITIONS[id].weapon_types || [])) {
			throw fail("invalid_skill_registry", `Weapon ownership differs from the canonical registry for ${id}`, {
				skill: id,
				weapon_types: registry[id].weapon_types,
			});
		}
	}
	return weaponOwners;
}

function validateXpTable(table, skillId = "merchant") {
	if (!table || typeof table !== "object") throw fail("invalid_skill_xp", "Skill XP table must be an object");
	const keys = Object.keys(table);
	if (keys.length !== MAX_LEVEL || keys[0] !== "1" || keys[keys.length - 1] !== String(MAX_LEVEL)) {
		throw fail("invalid_skill_xp", "Skill XP table must contain levels 1 through 99");
	}
	let previous = -1;
	for (let level = 1; level <= MAX_LEVEL; level += 1) {
		const actual = table[level];
		const expected = cumulativeXp(level, skillId);
		if (!Number.isSafeInteger(actual) || actual !== expected || actual < previous) {
			throw fail("invalid_skill_xp", `Skill XP threshold mismatch at level ${level}`, { level, actual, expected });
		}
		previous = actual;
	}
	return table;
}

function validateSkillXpTables(tables) {
	if (!tables || typeof tables !== "object" || Object.keys(tables).join("\0") !== "combat\0merchant")
		throw fail("invalid_skill_xp", "Skill XP tables must contain combat and merchant tables in order");
	validateXpTable(tables.combat, "warrior");
	validateXpTable(tables.merchant, "merchant");
	if (tables.merchant[MAX_LEVEL] !== progression.MAX_XP)
		throw fail("invalid_skill_xp", "Merchant XP cap must retain the legacy cap");
	return tables;
}

function validateRequirements(itemId, requirements, registry = null) {
	if (!Array.isArray(requirements) || requirements.length === 0) {
		throw fail("invalid_equipment_requirements", `Equippable item ${itemId} has no requirements`, { item: itemId });
	}
	const seen = new Set();
	let previousIndex = -1;
	for (const requirement of requirements) {
		if (!requirement || typeof requirement !== "object" || !Number.isInteger(requirement.level) || requirement.level < 1 || requirement.level > MAX_LEVEL) {
			throw fail("invalid_equipment_requirements", `Malformed requirements for ${itemId}`, {
				item: itemId,
				requirement,
			});
		}
		const hasSkill = own(requirement, "skill");
		const hasAnySkill = own(requirement, "any_skill");
		if (hasSkill === hasAnySkill) {
			throw fail("invalid_equipment_requirements", `Malformed requirements for ${itemId}`, { item: itemId, requirement });
		}
		const ids = hasSkill ? [requirement.skill] : requirement.any_skill;
		if (!Array.isArray(ids) && !hasSkill) {
			throw fail("invalid_equipment_requirements", `Malformed requirements for ${itemId}`, { item: itemId, requirement });
		}
		if (!ids.length || (hasSkill && typeof requirement.skill !== "string")) {
			throw fail("invalid_equipment_requirements", `Malformed requirements for ${itemId}`, { item: itemId, requirement });
		}
		const allowedKeys = hasSkill ? ["skill", "level"] : ["any_skill", "level"];
		if (Object.keys(requirement).some((key) => !allowedKeys.includes(key))) {
			throw fail("invalid_equipment_requirements", `Malformed requirements for ${itemId}`, { item: itemId, requirement });
		}
		let index = -1;
		for (const skillId of ids) {
			const skillIndex = SKILL_IDS.indexOf(skillId);
			if (typeof skillId !== "string" || skillIndex === -1 || (registry && !own(registry, skillId))) {
				throw fail("invalid_equipment_requirements", `Unknown requirement skill ${skillId} for ${itemId}`, {
					item: itemId,
					skill: skillId,
				});
			}
			if (seen.has(skillId) || skillIndex <= index) {
				throw fail("invalid_equipment_requirements", `Requirements for ${itemId} are duplicated or out of registry order`, { item: itemId });
			}
			seen.add(skillId);
			index = skillIndex;
		}
		if (index < previousIndex) {
			throw fail(
				"invalid_equipment_requirements",
				`Requirements for ${itemId} are duplicated or out of registry order`,
				{ item: itemId },
			);
		}
		previousIndex = index;
	}
	return requirements;
}

function validateAbilityCatalog(abilities, registry) {
	if (!abilities || typeof abilities !== "object")
		throw fail("invalid_ability_catalog", "Ability catalog must be an object");
	for (const [id, definition] of Object.entries(abilities)) {
		if (!definition || typeof definition !== "object")
			throw fail("invalid_ability_catalog", `Invalid ability ${id}`, { ability: id });
		if (own(definition, "class")) {
			throw fail("invalid_ability_catalog", `Legacy class ownership remains on ${id}`, { ability: id });
		}
		if (!["skill", "active_combat", "item", "system", "monster"].includes(definition.applicability)) {
			throw fail("invalid_ability_catalog", `Invalid applicability for ${id}`, { ability: id });
		}
		if (
			own(definition, "level") &&
			(!Number.isInteger(definition.level) || definition.level < 1 || definition.level > MAX_LEVEL)
		) {
			throw fail("invalid_ability_catalog", `Invalid level for ${id}`, { ability: id, level: definition.level });
		}
		if (own(definition, "skill") && definition.applicability !== "skill") {
			throw fail("invalid_ability_catalog", `Non-skill ability ${id} has a skill owner`, { ability: id });
		}
		if (definition.applicability === "skill") {
			if (
				!registry ||
				!own(registry, definition.skill) ||
				!Number.isInteger(definition.level) ||
				definition.level < 1 ||
				definition.level > MAX_LEVEL
			) {
				throw fail("invalid_ability_catalog", `Invalid skill gate for ${id}`, { ability: id });
			}
		}
		if (own(definition, "style_bound") && typeof definition.style_bound !== "boolean") {
			throw fail("invalid_ability_catalog", `Invalid style-bound metadata for ${id}`, { ability: id });
		}
		if (own(definition, "requirements")) {
			if (
				!definition.requirements ||
				typeof definition.requirements !== "object" ||
				Array.isArray(definition.requirements) ||
				Object.keys(definition.requirements).join("\0") !== "max_mp" ||
				!Number.isFinite(definition.requirements.max_mp) ||
				definition.requirements.max_mp <= 0
			) {
				throw fail("invalid_ability_catalog", `Invalid direct requirement for ${id}`, { ability: id });
			}
		}
		if (own(definition, "contribution")) {
			const contribution = definition.contribution;
			if (
				!contribution ||
				!Number.isSafeInteger(contribution.weight_per_use) ||
				contribution.weight_per_use <= 0 ||
				!Number.isSafeInteger(contribution.max_weight_per_target_per_encounter) ||
				contribution.max_weight_per_target_per_encounter < contribution.weight_per_use
			) {
				throw fail("invalid_ability_catalog", `Invalid contribution metadata for ${id}`, { ability: id });
			}
		}
	}
	return abilities;
}

function normalizeItems(items, itemRequirements) {
	if (!items || typeof items !== "object") throw fail("invalid_game_data", "Item catalog must be an object");
	if (!itemRequirements || typeof itemRequirements !== "object") {
		throw fail("invalid_game_data", "Item requirements must be an object");
	}
	const normalized = JSON.parse(JSON.stringify(items));
	for (const bookId of ["wbook0", "wbook2", "wbook3", "wbook4", "wbook5", "wbook1", "wbook6", "wbook7", "wbook8", "wbook9", "wbookhs"]) {
		if (!own(normalized, bookId)) throw fail("invalid_game_data", `Missing Priest book ${bookId}`, { item: bookId });
		if (normalized[bookId].compound) {
			if (normalized[bookId].upgrade) throw fail("invalid_game_data", `Priest book ${bookId} has conflicting enhancement kinds`, { item: bookId });
			normalized[bookId].upgrade = normalized[bookId].compound;
			delete normalized[bookId].compound;
		}
		normalized[bookId].type = "weapon";
		normalized[bookId].wtype = "book";
		normalized[bookId].damage_type = "magical";
		normalized[bookId].projectile = "pmagic";
	}
	for (const [itemId, requirements] of Object.entries(itemRequirements)) {
		if (!own(normalized, itemId))
			throw fail("invalid_game_data", `Requirements reference missing item ${itemId}`, { item: itemId });
		normalized[itemId].requirements = JSON.parse(JSON.stringify(requirements));
		delete normalized[itemId].class;
		for (const skillId of SKILL_IDS) delete normalized[itemId][skillId];
	}
	return normalized;
}

function validateItemRequirements(items, itemRequirements, registry, weaponOwners) {
	if (!items || typeof items !== "object") throw fail("invalid_game_data", "Item catalog must be an object");
	if (!itemRequirements || typeof itemRequirements !== "object") {
		throw fail("invalid_game_data", "Item requirements must be an object");
	}
	if (!(weaponOwners instanceof Map)) throw fail("invalid_skill_registry", "Weapon ownership index is missing");
	for (const [itemId, requirements] of Object.entries(itemRequirements)) {
		if (!own(items, itemId)) {
			throw fail("invalid_game_data", `Requirements reference missing item ${itemId}`, { item: itemId });
		}
		if (!Array.isArray(requirements)) {
			throw fail("invalid_equipment_requirements", `Malformed requirements for ${itemId}`, { item: itemId, requirements });
		}
		if (requirements.length) validateRequirements(itemId, requirements, registry);
		if (JSON.stringify(items[itemId].requirements) !== JSON.stringify(requirements)) {
			throw fail("invalid_game_data", `Item requirements differ from the normalized snapshot for ${itemId}`, {
				item: itemId,
			});
		}
		if (own(items[itemId], "class")) {
			throw fail("invalid_game_data", `Legacy class ownership remains on item ${itemId}`, { item: itemId });
		}
	}
	for (const bookId of ["wbook0", "wbook2", "wbook3", "wbook4", "wbook5", "wbook1", "wbook6", "wbook7", "wbook8", "wbook9", "wbookhs"]) {
		const book = items[bookId];
		if (
			!book ||
			book.type !== "weapon" ||
			book.wtype !== "book" ||
			book.damage_type !== "magical" ||
			book.projectile !== "pmagic" ||
			!book.upgrade ||
			book.compound !== undefined ||
			(!Number.isFinite(book.damage) || book.damage <= 0 ||
				!Number.isFinite(book.attacks_per_second) || book.attacks_per_second <= 0 ||
				!Number.isFinite(book.upgrade.damage) ||
				!Number.isFinite(book.upgrade.attacks_per_second))
		) {
			throw fail("invalid_game_data", `Priest book ${bookId} is not a normalized main-hand weapon`, { item: bookId });
		}
	}
	if (
		!items.pmace ||
		items.pmace.type !== "weapon" ||
		items.pmace.wtype !== "pmace" ||
		items.pmace.name !== "Paladin's Hammer" ||
		items.pmace.skin !== "hammer" ||
		items.pmace.damage_type !== "physical" ||
		items.pmace.speed !== -2
	) {
		throw fail("invalid_game_data", "Paladin pmace presentation/profile is not normalized", { item: "pmace" });
	}
	for (const [itemId, item] of Object.entries(items)) {
		if (EQUIPPABLE_TYPES.has(item.type) && !own(itemRequirements, itemId)) {
			throw fail("invalid_game_data", `Equippable item ${itemId} is missing an explicit requirement`, { item: itemId });
		}
		if (item.type !== "weapon") {
			const miningRequirements = MINING_REQUIREMENTS.get(itemId);
			if (miningRequirements) {
				if (
					JSON.stringify(itemRequirements[itemId]) !== JSON.stringify(miningRequirements) ||
					JSON.stringify(item.purchase_requirement) !== JSON.stringify(miningRequirements[0])
				) {
					throw fail("invalid_game_data", `Mining equipment ${itemId} has an invalid gate`, { item: itemId });
				}
			} else if (EQUIPPABLE_TYPES.has(item.type) && itemRequirements[itemId].length) {
				throw fail("invalid_game_data", `Nonweapon equipment ${itemId} must be ungated`, { item: itemId });
			}
			continue;
		}
		if (!weaponOwners.has(item.wtype)) {
			throw fail("invalid_game_data", `Weapon ${itemId} has an unowned weapon type ${item.wtype}`, {
				item: itemId,
				weapon_type: item.wtype,
			});
		}
		if (itemRequirements[itemId].length !== 1 || itemRequirements[itemId][0].skill !== weaponOwners.get(item.wtype)) {
			throw fail(
				"invalid_game_data",
				`Weapon ${itemId} does not have exactly its ${weaponOwners.get(item.wtype)} owner`,
				{
					item: itemId,
				},
			);
		}
	}
	return itemRequirements;
}

function validateCharacterDefinition(character, items) {
	if (!character || typeof character !== "object")
		throw fail("invalid_game_data", "Character definition must be an object");
	if (!Array.isArray(character.appearances) || character.appearances.length !== 28) {
		throw fail("invalid_game_data", "Character definition must contain the 28 canonical appearances", {
			appearances: character.appearances && character.appearances.length,
		});
	}
	for (const appearance of character.appearances) {
		if (
			!Array.isArray(appearance) ||
			appearance.length !== 2 ||
			typeof appearance[0] !== "string" ||
			!appearance[1] ||
			typeof appearance[1] !== "object" ||
			Array.isArray(appearance[1])
		) {
			throw fail("invalid_game_data", "Character appearance has an invalid shape", { appearance });
		}
	}
	if (
		crypto.createHash("sha256").update(JSON.stringify(character.appearances)).digest("hex") !==
		"3baf1e07aaaaa0a601981c3dd211721b396a3bc33ac967eb65839a9a46bb8880"
	) {
		throw fail("invalid_game_data", "Character appearances differ from the canonical snapshot");
	}
	const baselineFields = [
		"max_hp",
		"max_mp",
		"speed",
		"inventory_size",
		"heal",
		"armor",
		"resistance",
	];
	if (!character.baseline || baselineFields.some((field) => !Number.isFinite(character.baseline[field]))) {
		throw fail("invalid_game_data", "Character baseline is incomplete");
	}
	if (JSON.stringify(character.baseline) !== JSON.stringify(EXPECTED_BASELINE)) {
		throw fail("invalid_game_data", "Character baseline differs from the neutral progression contract");
	}
	if (
		!character.skills ||
		Object.keys(character.skills).join("\0") !== SKILL_IDS.join("\0") ||
		Object.values(character.skills).some((skill) => !skill || skill.level !== 1 || skill.xp !== 0) ||
		character.total_level !== SKILL_IDS.length
	) {
		throw fail("invalid_game_data", "Character skill starter state differs from the neutral progression contract");
	}
	if (
		!character.starter ||
		!Array.isArray(character.starter.weapons) ||
		JSON.stringify(character.starter.weapons) !== JSON.stringify(STARTER_WEAPONS) ||
		!items ||
		STARTER_WEAPONS.some((itemId) => !own(items, itemId) || items[itemId].type !== "weapon") ||
		!Array.isArray(character.starter.consumables) ||
		JSON.stringify(character.starter.consumables) !==
			JSON.stringify([
				{ name: "hpot0", q: 200, gift: 1 },
				{ name: "mpot0", q: 200, gift: 1 },
			]) ||
		!Array.isArray(character.starter.equipment) ||
		JSON.stringify(character.starter.equipment) !==
			JSON.stringify([
				{ name: "helmet", level: 0, gift: 1 },
				{ name: "shoes", level: 0, gift: 1 },
			]) ||
		!character.starter.slots ||
		typeof character.starter.slots !== "object" ||
		Array.isArray(character.starter.slots) ||
		Object.keys(character.starter.slots).length !== 0
	) {
		throw fail("invalid_game_data", "Character starter definition is incomplete");
	}
	const starterItemTypes = { hpot0: "pot", mpot0: "pot", helmet: "helmet", shoes: "shoes" };
	for (const [itemId, type] of Object.entries(starterItemTypes)) {
		if (!items || !own(items, itemId) || items[itemId].type !== type) {
			throw fail("invalid_game_data", `Starter item ${itemId} is missing or has the wrong type`, {
				item: itemId,
				type,
			});
		}
	}
	return character;
}

function validateProgressionData(data) {
	if (!data || typeof data !== "object") throw fail("invalid_game_data", "Progression data must be an object");
	const weaponOwners = validateSkillRegistry(data.skills);
	validateSkillXpTables(data.skill_xp);
	validateAbilityCatalog(data.abilities, data.skills);
	validateItemRequirements(data.items, data.item_requirements, data.skills, weaponOwners);
	validateCharacterDefinition(data.character, data.items);
	validateMiningData(data.mining, { items: data.items });
	validateSmeltingData(data.smelting, { items: data.items });
	return data;
}

function deepFreeze(value) {
	if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
	for (const child of Object.values(value)) deepFreeze(child);
	return Object.freeze(value);
}

function buildProgressionData(data) {
	if (!data || typeof data !== "object") throw fail("invalid_game_data", "Progression data must be an object");
	const normalized = {
		...data,
		items: normalizeItems(data.items, data.item_requirements),
		skills: JSON.parse(JSON.stringify(data.skills)),
		skill_xp: JSON.parse(JSON.stringify(data.skill_xp)),
		abilities: JSON.parse(JSON.stringify(data.abilities)),
		character: JSON.parse(JSON.stringify(data.character)),
		item_requirements: JSON.parse(JSON.stringify(data.item_requirements)),
		mining: JSON.parse(JSON.stringify(data.mining)),
		smelting: JSON.parse(JSON.stringify(data.smelting)),
	};
	validateProgressionData(normalized);
	Object.defineProperty(normalized, VALIDATED_PUBLICATION, { value: true });
	deepFreeze(normalized);
	return normalized;
}

function loadProgressionPublication(target, progressionData) {
	const next =
		progressionData && progressionData[VALIDATED_PUBLICATION] ? progressionData : buildProgressionData(progressionData);
	const publication = { ...target };
	delete publication.classes;
	delete publication.levels;
	return Object.assign(
		{ ...publication, protocol: 4 },
		{
			items: next.items,
			item_requirements: next.item_requirements,
			skills: next.skills,
			skill_xp: next.skill_xp,
			abilities: next.abilities,
			// The legacy runtime derives a small cosmetic cache during server initialization.
			// Keep that cache outside the frozen progression source while preserving the
			// canonical character definition underneath it.
			character: { ...next.character, xcx: [] },
			mining: next.mining,
			smelting: next.smelting,
		},
	);
}

module.exports = {
	SKILL_IDS,
	COMBAT_SKILL_IDS,
	STARTER_WEAPONS,
	EXPECTED_BASELINE,
	MAX_LEVEL,
	MAX_XP,
	cumulativeXp,
	tableForSkill,
	maxXpForSkill,
	tierToRequiredLevel,
	validateSkillRegistry,
	validateXpTable,
	validateSkillXpTables,
	validateRequirements,
	validateAbilityCatalog,
	validateItemRequirements,
	validateCharacterDefinition,
	validateProgressionData,
	normalizeItems,
	buildProgressionData,
	loadProgressionPublication,
	buildWeaponOwners,
};
