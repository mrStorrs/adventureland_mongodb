"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
	DIRECT_EFFECT_KEYS,
	directDps,
	mergeDirectEffects,
	validateDirectBonus,
	validateDirectVector,
} = require("../game/direct_effects");
const { REDUCED_ARMOR_SET_COMPLETION_COUNTS, RETIRED_ARMOR_ITEM_IDS } = require("../game/equipment_schema");
const { loadCurrentCatalog, verifyCurrent } = require("../tools/direct-effect-conversion");

const fixturePath = path.join(__dirname, "fixtures", "direct-effect-conversion.json");

function loadOracle() {
	return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

test("direct vectors accept only finite published effects and preserve exact linear values", () => {
	assert.deepEqual(validateDirectVector({ hp: -144, mp: 45, throw_range: 9 }), {
		hp: -144,
		mp: 45,
		throw_range: 9,
	});
	assert.throws(() => validateDirectVector({ str: 3 }), /unknown direct effect/i);
	assert.throws(() => validateDirectVector({ hp: Infinity }), /finite/i);
	assert.throws(() => validateDirectVector({ hp: 0 }), /nonzero/i);
	assert.ok(!DIRECT_EFFECT_KEYS.includes("str"));
	assert.ok(!DIRECT_EFFECT_KEYS.includes("dex"));
	assert.ok(!DIRECT_EFFECT_KEYS.includes("int"));
	assert.ok(!DIRECT_EFFECT_KEYS.includes("vit"));
	assert.ok(!DIRECT_EFFECT_KEYS.includes("for"));
});

test("direct bonuses reject primary metadata and require a known stable scroll source", () => {
	const knownSources = new Set(["strscroll", "critscroll"]);
	assert.deepEqual(
		validateDirectBonus(
			{ version: 1, source: "strscroll", effects: { damage: 12, throw_range: 3 } },
			{ knownSources, path: "items[0]" },
		),
		{ version: 1, source: "strscroll", effects: { damage: 12, throw_range: 3 } },
	);
	assert.throws(
		() => validateDirectBonus({ version: 1, source: "missing", effects: { hp: 48 } }, { knownSources }),
		/unknown direct bonus source/i,
	);
	assert.throws(
		() => validateDirectBonus({ version: 2, source: "strscroll", effects: { hp: 48 } }, { knownSources }),
		/unsupported direct bonus version/i,
	);
	assert.throws(
		() => validateDirectBonus({ version: 1, source: "strscroll", effects: { stat_type: 1 } }, { knownSources }),
		/unknown direct effect/i,
	);
});

test("direct merge keeps the critical channels separate and derives DPS without persistence", () => {
	const merged = mergeDirectEffects(
		{ damage: 10, attacks_per_second: 0.4, base_crit: 79, crit: 18, hp: 100 },
		{ damage: 5, attacks_per_second: 0.1, base_crit: 8, crit: 7, hp: -48 },
	);
	assert.deepEqual(merged, {
		damage: 15,
		attacks_per_second: 0.5,
		base_crit: 80,
		crit: 25,
		hp: 52,
	});
	assert.equal(directDps(15, 0.5), 7.5);
	assert.throws(() => directDps(1, Infinity), /finite/i);
});

test("the frozen oracle covers the catalog, all scroll profiles, and the weapon authority", () => {
	const oracle = loadOracle();
	assert.equal(oracle.schema_version, 1);
	assert.equal(oracle.source_revision, "80655fd");
	assert.equal(oracle.audit.definition_count, 562);
	assert.equal(oracle.audit.primary_definition_count, 264);
	assert.equal(oracle.scroll_profiles.length, 22);
	assert.equal(oracle.weapon_policy.visible_weapon_count, 83);
	assert.equal(oracle.weapon_policy.rank_requirement_count, 11);
	assert.deepEqual(oracle.violations, []);
	assert.ok(oracle.sources.length >= oracle.audit.primary_definition_count);
});

test("every oracle allocation reconstructs its observed primary delta with an eligible residue owner", () => {
	const oracle = loadOracle();
	for (const row of oracle.sources) {
		assert.ok(row.source_kind && row.source_id, JSON.stringify(row));
		assert.ok(row.canonical_authority, `${row.source_kind}:${row.source_id}`);
		for (const [key, value] of Object.entries(row.direct_delta)) assert.ok(Number.isFinite(value), `${row.source_id}:${key}`);
		for (const [key, residue] of Object.entries(row.residue || {})) {
			assert.ok(Number.isFinite(residue), `${row.source_id}:${key}`);
			assert.notEqual(row.signed_primary_share[key], 0, `${row.source_id}:${key} residue owner`);
		}
	}
	for (const context of oracle.canonical_contexts) {
		for (const [key, value] of Object.entries(context.reconstructed_vector)) {
			assert.ok(Number.isFinite(value), `${context.id}:${key}`);
			assert.ok(Math.abs(value - context.primary_delta[key]) <= 1e-9, `${context.id}:${key}`);
		}
	}
});

test("the oracle preserves isolated direct and special effect identities", () => {
	const oracle = loadOracle();
	for (const row of oracle.sources) {
		assert.match(row.preexisting_effect_hash, /^[a-f0-9]{64}$/i, `${row.source_kind}:${row.source_id}`);
		assert.ok(!Object.hasOwn(row.direct_delta, "stat_type"));
	}
});

test("current conversion verification accepts only exact armor retirements and threshold collapses", () => {
	const current = loadCurrentCatalog();
	const result = verifyCurrent({ currentCatalog: current });
	assert.equal(result.retired_items, RETIRED_ARMOR_ITEM_IDS.length);
	assert.deepEqual(result.collapsed_sets, REDUCED_ARMOR_SET_COMPLETION_COUNTS);
	for (const itemId of RETIRED_ARMOR_ITEM_IDS) assert.equal(current.items[itemId], undefined, itemId);
	for (const [setId, count] of Object.entries(REDUCED_ARMOR_SET_COMPLETION_COUNTS)) {
		assert.deepEqual(Object.keys(current.sets[setId]).filter((key) => /^\d+$/.test(key)).map(Number), [count], setId);
	}
});

test("current conversion verification rejects a 19th retirement, unrelated threshold loss, signature drift, or unrelated core drift", () => {
	const missingItem = loadCurrentCatalog();
	delete missingItem.items.arcstaff;
	assert.throws(() => verifyCurrent({ currentCatalog: missingItem }), /Converted source is missing.*arcstaff/i);

	const missingThreshold = loadCurrentCatalog();
	delete missingThreshold.sets.holidays[2];
	assert.throws(() => verifyCurrent({ currentCatalog: missingThreshold }), /Converted source is missing.*holidays.*pieces:2/i);

	const signatureDrift = loadCurrentCatalog();
	signatureDrift.sets.wt4[2].reflection = 2;
	assert.throws(() => verifyCurrent({ currentCatalog: signatureDrift }), /Special effect drifted.*wt4.*reflection/i);

	const coreDrift = loadCurrentCatalog();
	coreDrift.items.angelwings.hp += 1;
	assert.throws(() => verifyCurrent({ currentCatalog: coreDrift }), /Core effect drifted.*angelwings.*hp/i);
});
