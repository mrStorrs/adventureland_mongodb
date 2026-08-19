"use strict";

const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const {
	ARMOR_PROGRESSION_SET_TIERS,
	ARMOR_SET_SIGNATURES,
	ARMOR_SLOTS,
	REDUCED_ARMOR_SET_COMPLETION_COUNTS,
	REDUCED_ARMOR_SET_COMPLETION_PAYLOADS,
	RETIRED_ARMOR_ITEM_IDS,
} = require("../game/equipment_schema");

const SOURCE_REVISION = "80655fd";
const ROOT = path.resolve(__dirname, "../..");
const FIXTURE_PATH = path.join(ROOT, "node/tests/fixtures/direct-effect-conversion.json");
const PRIMARY_KEYS = new Set(["str", "dex", "int", "vit", "for"]);
const ARMOR_CORE_KEYS = Object.freeze(["hp", "mp", "armor", "resistance"]);
const SOURCE_FILES = Object.freeze([
	"design/items.js",
	"design/conditions.js",
	"design/titles.js",
	"design/abilities.js",
	"design/character.js",
	"node/tests/fixtures/weapon-loadout-balance.json",
]);
const METADATA_KEYS = new Set([
	"type",
	"name",
	"skin",
	"explanation",
	"requirements",
	"duration",
	"source",
	"title",
	"set",
	"armor_weight",
	"wtype",
	"stat",
	"multiplier",
	"s",
	"g",
	"level",
	"count",
]);

function conversionError(message, details = {}) {
	const error = new Error(message);
	error.code = "direct_effect_conversion_failed";
	Object.assign(error, details);
	return error;
}

function canonicalize(value) {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(
		Object.keys(value)
			.sort()
			.map((key) => [key, canonicalize(value[key])]),
	);
}

function serialize(value) {
	return `${JSON.stringify(canonicalize(value), null, "\t")}\n`;
}

function hash(value) {
	return crypto.createHash("sha256").update(typeof value === "string" ? value : serialize(value)).digest("hex");
}

function readSource(revision, sourcePath) {
	try {
		return childProcess.execFileSync("git", ["show", `${revision}:${sourcePath}`], {
			cwd: ROOT,
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
			stdio: ["ignore", "pipe", "pipe"],
		});
	} catch (error) {
		throw conversionError(`Cannot read ${sourcePath} at ${revision}`, { source_revision: revision, source_path: sourcePath });
	}
}

function loadSourceCatalog(revision) {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	for (const sourcePath of SOURCE_FILES.filter((file) => file.startsWith("design/"))) {
		vm.runInContext(readSource(revision, sourcePath), context, { filename: sourcePath });
	}
	return context;
}

function primaryVector(value) {
	const vector = {};
	for (const key of PRIMARY_KEYS) {
		if (typeof value[key] === "number") {
			if (!Number.isFinite(value[key])) throw conversionError(`Non-finite ${key} source value`);
			vector[key] = value[key];
		}
	}
	return vector;
}

function directLinearVector(primary) {
	const vector = {};
	if (primary.vit) vector.hp = primary.vit * 48;
	if (primary.int) vector.mp = primary.int * 15;
	if (primary.str) vector.throw_range = primary.str * 3;
	return vector;
}

function nonPrimaryEffects(value) {
	const result = {};
	for (const [key, entry] of Object.entries(value || {})) {
		if (PRIMARY_KEYS.has(key) || METADATA_KEYS.has(key) || typeof entry !== "number") continue;
		if (!Number.isFinite(entry)) throw conversionError(`Non-finite existing effect ${key}`);
		result[key] = entry;
	}
	return result;
}

function stateRow({ source_kind, source_id, state, value, canonical_authority }) {
	const primary = primaryVector(value);
	if (!Object.keys(primary).length) return null;
	const direct_delta = directLinearVector(primary);
	return {
		source_kind,
		source_id,
		state,
		canonical_authority,
		primary,
		signed_primary_share: { ...direct_delta },
		direct_delta,
		residue: {},
		preexisting_effect_hash: hash(nonPrimaryEffects(value)),
	};
}

function itemRows(items) {
	const rows = [];
	for (const [source_id, item] of Object.entries(items).sort(([left], [right]) => left.localeCompare(right))) {
		const authority = item.type === "weapon" ? `weapon:${source_id}` : `equipment:${source_id}`;
		for (const [state, value] of [
			["base", item],
			["upgrade", item.upgrade],
			["compound", item.compound],
		]) {
			if (!value || typeof value !== "object") continue;
			const row = stateRow({ source_kind: "item", source_id, state, value, canonical_authority: authority });
			if (row) rows.push(row);
		}
	}
	return rows;
}

function setRows(sets) {
	const rows = [];
	for (const [source_id, set] of Object.entries(sets || {}).sort(([left], [right]) => left.localeCompare(right))) {
		for (const state of [2, 3, 4, 5]) {
			const value = set[state];
			if (!value || typeof value !== "object") continue;
			const row = stateRow({
				source_kind: "set_threshold",
				source_id,
				state: `pieces:${state}`,
				value,
				canonical_authority: `set:${source_id}:${state}`,
			});
			if (row) rows.push(row);
		}
	}
	return rows;
}

function namedRows(source_kind, definitions) {
	const rows = [];
	for (const [source_id, value] of Object.entries(definitions || {}).sort(([left], [right]) => left.localeCompare(right))) {
		const row = stateRow({
			source_kind,
			source_id,
			state: "base",
			value,
			canonical_authority: `${source_kind}:${source_id}`,
		});
		if (row) rows.push(row);
	}
	return rows;
}

function abilityRows(abilities) {
	const rows = [];
	for (const [source_id, ability] of Object.entries(abilities || {}).sort(([left], [right]) => left.localeCompare(right))) {
		const requirements = ability && ability.requirements;
		if (!requirements || typeof requirements !== "object") continue;
		const row = stateRow({
			source_kind: "ability_requirement",
			source_id,
			state: "requirements",
			value: requirements,
			canonical_authority: `ability:${source_id}`,
		});
		if (row) rows.push(row);
	}
	return rows;
}

function scrollProfiles(items) {
	return Object.entries(items)
		.filter(([, item]) => item && item.type === "pscroll")
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([source, item]) => ({ source, legacy_effect: item.stat, multiplier: item.multiplier }));
}

function weaponPolicy(revision) {
	const fixture = JSON.parse(readSource(revision, "node/tests/fixtures/weapon-loadout-balance.json"));
	const rank_bands = fixture.rank_bands || [];
	return {
		visible_weapon_count: new Set((fixture.weapon_states || []).map((row) => row.weapon_id)).size,
		rank_requirement_count: rank_bands.length,
		rank_requirements: rank_bands.map((row) => row.requirement),
		class_multipliers: { warrior: 1, paladin: 0.9, mage: 1.1, priest: 0.9, ranger: 1.1, rogue: 1.1 },
		legal_layout_hash: hash(fixture.legal_layouts || []),
		intermediate_state_hash: hash(fixture.weapon_states || []),
		fixture_hash: hash(fixture),
	};
}

function canonicalContexts(rows) {
	return rows.map((row) => ({
		id: `${row.source_kind}:${row.source_id}:${row.state}`,
		primary_delta: { ...row.direct_delta },
		primary_removed_vector: {},
		full_legacy_vector: { ...row.direct_delta },
		allocation_total: { ...row.direct_delta },
		reconstructed_vector: { ...row.direct_delta },
	}));
}

function buildOracle({ sourceRevision = SOURCE_REVISION } = {}) {
	if (sourceRevision !== SOURCE_REVISION) {
		throw conversionError(`Source revision must be ${SOURCE_REVISION}`, { source_revision: sourceRevision });
	}
	const catalog = loadSourceCatalog(sourceRevision);
	const items = catalog.items;
	const rows = [
		...itemRows(items),
		...setRows(catalog.sets),
		...namedRows("condition", catalog.conditions),
		...namedRows("title", catalog.titles),
		...abilityRows(catalog.abilities),
	];
	const itemPrimaryDefinitions = Object.values(items).filter((item) => {
		return [item, item.upgrade, item.compound].some((value) => value && Object.keys(primaryVector(value)).length);
	}).length;
	const source_hashes = Object.fromEntries(SOURCE_FILES.map((sourcePath) => [sourcePath, hash(readSource(sourceRevision, sourcePath))]));
	const violations = [];
	if (Object.keys(items).length !== 562) violations.push({ code: "definition_count", actual: Object.keys(items).length, expected: 562 });
	if (itemPrimaryDefinitions !== 264) {
		violations.push({ code: "primary_definition_count", actual: itemPrimaryDefinitions, expected: 264 });
	}
	const profiles = scrollProfiles(items);
	if (profiles.length !== 22) violations.push({ code: "scroll_profile_count", actual: profiles.length, expected: 22 });
	for (const row of rows) {
		for (const value of Object.values(row.direct_delta)) {
			if (!Number.isFinite(value)) violations.push({ code: "non_finite_direct_delta", source_id: row.source_id });
		}
	}
	if (violations.length) throw conversionError("Frozen conversion evidence is incomplete", { violations });
	return {
		schema_version: 1,
		source_revision: sourceRevision,
		source_hashes,
		audit: {
			definition_count: Object.keys(items).length,
			primary_definition_count: itemPrimaryDefinitions,
			affected_row_count: rows.length,
			set_threshold_count: rows.filter((row) => row.source_kind === "set_threshold").length,
			condition_count: rows.filter((row) => row.source_kind === "condition").length,
			title_count: rows.filter((row) => row.source_kind === "title").length,
			ability_requirement_count: rows.filter((row) => row.source_kind === "ability_requirement").length,
		},
		direct_effect_contract: {
			linear: { hp_per_vit: 48, mp_per_int: 15, throw_range_per_str: 3 },
			base_crit_cap: [0, 80],
			pvp_damage_reduction_cap: [0, 100],
		},
		sources: rows,
		scroll_profiles: profiles,
		weapon_policy: weaponPolicy(sourceRevision),
		canonical_contexts: canonicalContexts(rows),
		violations,
	};
}

function verifyOracle({ sourceRevision = SOURCE_REVISION, fixturePath = FIXTURE_PATH } = {}) {
	const expected = buildOracle({ sourceRevision });
	if (!fs.existsSync(fixturePath)) throw conversionError("Frozen conversion fixture is missing", { fixture_path: fixturePath });
	const actual = fs.readFileSync(fixturePath, "utf8");
	if (actual !== serialize(expected)) throw conversionError("Frozen conversion fixture differs from source evidence", { fixture_path: fixturePath });
	return expected;
}

function loadCurrentCatalog() {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	for (const sourcePath of SOURCE_FILES.filter((file) => file.startsWith("design/"))) {
		vm.runInContext(fs.readFileSync(path.join(ROOT, sourcePath), "utf8"), context, { filename: sourcePath });
	}
	return context;
}

function currentSourceValue(catalog, row) {
	if (row.source_kind === "item") return catalog.items?.[row.source_id]?.[row.state === "base" ? "__base__" : row.state] || (row.state === "base" ? catalog.items?.[row.source_id] : null);
	if (row.source_kind === "set_threshold") return catalog.sets?.[row.source_id]?.[Number(row.state.slice("pieces:".length))];
	if (row.source_kind === "condition") return catalog.conditions?.[row.source_id];
	if (row.source_kind === "title") return catalog.titles?.[row.source_id];
	if (row.source_kind === "ability_requirement") return catalog.abilities?.[row.source_id]?.requirements;
	return null;
}

function currentItemState(catalog, row) {
	const item = catalog.items?.[row.source_id];
	if (!item) return null;
	return row.state === "base" ? item : item[row.state];
}

function assertCurrentNumber(value, path) {
	if (typeof value !== "number" || !Number.isFinite(value)) throw conversionError(`Current catalog has no finite ${path}`);
}

function verifyCurrent({ fixturePath = FIXTURE_PATH, currentCatalog = null } = {}) {
	const oracle = verifyOracle({ fixturePath });
	const current = currentCatalog || loadCurrentCatalog();
	const filesystemCatalog = currentCatalog ? loadCurrentCatalog() : current;
	const legacyCatalog = loadSourceCatalog(SOURCE_REVISION);
	const retiredItems = new Set(RETIRED_ARMOR_ITEM_IDS);
	const tieredSetIds = new Set(Object.keys(ARMOR_PROGRESSION_SET_TIERS));
	const armorSlots = new Set(ARMOR_SLOTS);
	const allowsApprovedArmorCoreDrift = (row) => {
		if (row.source_kind === "set_threshold") return tieredSetIds.has(row.source_id) || Object.hasOwn(REDUCED_ARMOR_SET_COMPLETION_COUNTS, row.source_id);
		if (row.source_kind !== "item") return false;
		const item = current.items?.[row.source_id];
		return Boolean(item && tieredSetIds.has(item.set) && armorSlots.has(item.type));
	};
	const forbidden = [...PRIMARY_KEYS, "stat", "stat_type"];
	const checkNoPrimary = (value, label) => {
		if (!value || typeof value !== "object") return;
		for (const key of forbidden) if (Object.hasOwn(value, key)) throw conversionError(`Current catalog retains ${key} at ${label}`);
	};
	for (const [itemId, item] of Object.entries(current.items || {})) {
		checkNoPrimary(item, `item:${itemId}`);
		checkNoPrimary(item.upgrade, `item:${itemId}:upgrade`);
		checkNoPrimary(item.compound, `item:${itemId}:compound`);
		if (item.type === "weapon" && item.progression) {
			assertCurrentNumber(item.damage, `weapon damage ${itemId}`);
			assertCurrentNumber(item.attacks_per_second, `weapon attacks_per_second ${itemId}`);
			if (!(item.damage > 0 && item.attacks_per_second > 0)) throw conversionError(`Weapon ${itemId} must publish positive direct combat values`);
		}
	}
	for (const itemId of RETIRED_ARMOR_ITEM_IDS) {
		if (current.items?.[itemId]) throw conversionError(`Retired armor item remains: ${itemId}`);
	}
	for (const itemId of Object.keys(legacyCatalog.items || {})) {
		if (!retiredItems.has(itemId) && !current.items?.[itemId]) throw conversionError(`Converted source is missing item:${itemId}`);
	}
	for (const itemId of Object.keys(filesystemCatalog.items || {})) {
		if (!current.items?.[itemId] && !retiredItems.has(itemId)) throw conversionError(`Converted source is missing item:${itemId}`);
	}
	for (const [setId, set] of Object.entries(current.sets || {})) {
		for (const count of Object.keys(set).filter((key) => /^\d+$/.test(key)).map(Number)) checkNoPrimary(set[count], `set:${setId}:${count}`);
	}
	for (const [setId, completionCount] of Object.entries(REDUCED_ARMOR_SET_COMPLETION_COUNTS)) {
		const thresholds = Object.keys(current.sets?.[setId] || {}).filter((key) => /^\d+$/.test(key)).map(Number).sort((left, right) => left - right);
		if (JSON.stringify(thresholds) !== JSON.stringify([completionCount])) {
			throw conversionError(`Converted source has invalid collapsed thresholds for ${setId}`);
		}
		if (JSON.stringify(current.sets[setId][completionCount]) !== JSON.stringify(REDUCED_ARMOR_SET_COMPLETION_PAYLOADS[setId])) {
			throw conversionError(`Converted source has invalid collapsed payload for ${setId}`);
		}
	}
	for (const [setId, legacySet] of Object.entries(legacyCatalog.sets || {})) {
		if (Object.hasOwn(REDUCED_ARMOR_SET_COMPLETION_COUNTS, setId)) continue;
		for (const count of Object.keys(legacySet).filter((key) => /^\d+$/.test(key)).map(Number)) {
			if (!current.sets?.[setId]?.[count]) throw conversionError(`Converted source is missing set:${setId}:pieces:${count}`);
		}
	}
	for (const [setId, signatures] of Object.entries(ARMOR_SET_SIGNATURES)) {
		for (const count of [2, 3, 4, 5]) {
			const currentSignature = Object.fromEntries(Object.entries(current.sets?.[setId]?.[count] || {}).filter(([key]) => !["hp", "mp", "armor", "resistance"].includes(key)));
			const expectedSignature = signatures[count] || {};
			if (JSON.stringify(currentSignature) !== JSON.stringify(expectedSignature)) {
				const changedKey = [...new Set([...Object.keys(currentSignature), ...Object.keys(expectedSignature)])].find((key) => currentSignature[key] !== expectedSignature[key]) || "unknown";
				throw conversionError(`Special effect drifted for ${setId}:pieces:${count}:${changedKey}`);
			}
		}
	}
	for (const [name, value] of Object.entries(current.conditions || {})) checkNoPrimary(value, `condition:${name}`);
	for (const [name, value] of Object.entries(current.titles || {})) checkNoPrimary(value, `title:${name}`);
	for (const [name, value] of Object.entries(current.abilities || {})) checkNoPrimary(value?.requirements, `ability:${name}:requirements`);
	checkNoPrimary(current.character, "character");

	for (const row of oracle.sources) {
		const currentValue = row.source_kind === "item" ? currentItemState(current, row) : currentSourceValue(current, row);
		if (!currentValue) {
			if (row.source_kind === "item" && retiredItems.has(row.source_id)) continue;
			if (row.source_kind === "set_threshold" && Object.hasOwn(REDUCED_ARMOR_SET_COMPLETION_COUNTS, row.source_id)) continue;
			throw conversionError(`Converted source is missing: ${row.source_kind}:${row.source_id}:${row.state}`);
		}
		if (row.source_kind === "ability_requirement") {
			if (row.source_id === "mentalburst" && currentValue.max_mp !== 100 + Number(row.direct_delta.mp || 0))
				throw conversionError("Mental Burst does not preserve its direct Max MP requirement");
			continue;
		}
		const legacyValue = currentSourceValue(legacyCatalog, row);
		for (const [key, value] of Object.entries(row.direct_delta)) {
			assertCurrentNumber(currentValue[key], `${row.source_id}:${row.state}:${key}`);
			const legacy = currentValue[key] - value;
			if (!Number.isFinite(legacy)) throw conversionError(`Converted ${key} is invalid for ${row.source_id}:${row.state}`);
		}
		if (!legacyValue) continue;
		if (!allowsApprovedArmorCoreDrift(row)) {
			for (const key of ARMOR_CORE_KEYS) {
				const legacyCore = typeof legacyValue[key] === "number" ? legacyValue[key] : 0;
				const convertedCore = typeof row.direct_delta[key] === "number" ? row.direct_delta[key] : 0;
				const expected = legacyCore + convertedCore;
				const actual = typeof currentValue[key] === "number" ? currentValue[key] : 0;
				if (actual !== expected) throw conversionError(`Core effect drifted for ${row.source_id}:${row.state}:${key}`);
			}
		}
		for (const [key, value] of Object.entries(nonPrimaryEffects(legacyValue))) {
			if ([...ARMOR_CORE_KEYS, "attack", "frequency"].includes(key)) continue;
			if (currentValue[key] !== value) throw conversionError(`Special effect drifted for ${row.source_id}:${row.state}:${key}`);
		}
	}
	return {
		sources: oracle.sources.length,
		weapons: Object.values(current.items).filter((item) => item.type === "weapon" && item.progression).length,
		retired_items: RETIRED_ARMOR_ITEM_IDS.length,
		collapsed_sets: { ...REDUCED_ARMOR_SET_COMPLETION_COUNTS },
	};
}

function parseArguments(argv) {
	const options = { mode: "verify", sourceRevision: SOURCE_REVISION };
	for (const argument of argv) {
		if (argument === "--verify") options.mode = "verify";
		else if (argument === "--verify-current") options.mode = "verify-current";
		else if (argument === "--write") options.mode = "write";
		else if (argument.startsWith("--source-revision=")) options.sourceRevision = argument.slice("--source-revision=".length);
		else throw conversionError(`Unknown argument ${argument}`);
	}
	return options;
}

function main(argv = process.argv.slice(2)) {
	const options = parseArguments(argv);
	if (options.mode === "verify") {
		const oracle = verifyOracle({ sourceRevision: options.sourceRevision });
		process.stdout.write(`${JSON.stringify({ status: "verified", sources: oracle.sources.length, scroll_profiles: oracle.scroll_profiles.length })}\n`);
		return;
	}
	if (options.mode === "verify-current") {
		const result = verifyCurrent();
		process.stdout.write(`${JSON.stringify({ status: "current-verified", ...result })}\n`);
		return;
	}
	if (options.sourceRevision !== SOURCE_REVISION) {
		throw conversionError(`--write requires --source-revision=${SOURCE_REVISION}`);
	}
	const oracle = buildOracle({ sourceRevision: options.sourceRevision });
	fs.writeFileSync(FIXTURE_PATH, serialize(oracle));
	process.stdout.write(`${JSON.stringify({ status: "written", sources: oracle.sources.length, scroll_profiles: oracle.scroll_profiles.length })}\n`);
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`${error.code || "error"}: ${error.message}\n`);
		process.exitCode = 1;
	}
}

module.exports = {
	SOURCE_REVISION,
	FIXTURE_PATH,
	buildOracle,
	conversionError,
	loadCurrentCatalog,
	serialize,
	verifyCurrent,
	verifyOracle,
};
