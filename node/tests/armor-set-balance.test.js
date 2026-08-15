"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { calculateStats, dexCrit } = require("../game/stats");
const { DEX_CRIT_CALIBRATION } = require("../game/stat_calibration");
const { extractSourceBlock } = require("./source-extract");
const { assertCanonicalArmorCrossWeightRounding, assertNoStrictDomination, buildArmorSetBalanceFixture, buildVanillaBaseline, validateArmorSetBalanceFixture } = require("../tools/equipment-balance");

const root = path.resolve(__dirname, "../..");
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/armor-set-balance.json"), "utf8"));
const acquisitionFixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/equipment-acquisition-ranking.json"), "utf8"));
const coreFields = fixture.derivation.core_fields;
const effectFields = fixture.derivation.effect_fields;
const allPublishedFields = [...coreFields, ...effectFields];

function loadCatalog() {
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(root, "design/items.js"), "utf8"), context, { filename: "items.js" });
	return context;
}

function loadCatalogBeforeBasePublication() {
	const filename = path.join(root, "design/items.js");
	const source = fs.readFileSync(filename, "utf8");
	const cutoff = source.indexOf("\nvar base_nonweapon_progression={");
	assert.ok(cutoff > 0, "base publication marker");
	const context = { console, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(source.slice(0, cutoff), context, { filename: "items.before-base-publication.js" });
	return context;
}

function publishSetsThroughServer(sets) {
	const source = fs.readFileSync(path.join(root, "node/server_functions.js"), "utf8");
	const context = { G: { sets: JSON.parse(JSON.stringify(sets)) } };
	vm.createContext(context);
	vm.runInContext(extractSourceBlock(source, "for (var sname in G.sets) {"), context, { filename: "server_functions.set-publication.js" });
	return context.G.sets;
}

function loadProperties() {
	const context = loadCatalog();
	const common = fs.readFileSync(path.join(root, "js/old_common_functions.js"), "utf8");
	const start = common.indexOf("function calculate_item_properties");
	const end = common.indexOf("\nfunction random_one", start);
	Object.assign(context, {
		G: { items: context.items, titles: {} },
		prop_cache: {},
		doublehand_types: [],
		round: Math.round,
		clone: (value) => JSON.parse(JSON.stringify(value)),
		in_arr: (value, values) => values.includes(value),
	});
	vm.runInContext(common.slice(start, end), context, { filename: "old_common_functions.js" });
	return { ...context, properties: (item) => context.calculate_item_properties(item) };
}

function compact(vector, fields = allPublishedFields) {
	return Object.fromEntries(fields.filter((field) => Number(vector?.[field] || 0) !== 0).map((field) => [field, Number(vector[field])]))
}

function sum(vectors, fields = coreFields) {
	return vectors.reduce((total, vector) => Object.fromEntries(fields.map((field) => [field, total[field] + Number(vector?.[field] || 0)])), Object.fromEntries(fields.map((field) => [field, 0])));
}

function normalizedTotal(vector) {
	return coreFields.reduce((total, field) => total + Number(vector?.[field] || 0) / fixture.derivation.normalization_denominators[field], 0);
}

function enhancementHash(item) {
	const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
	return crypto.createHash("sha256").update(JSON.stringify(canonicalize({ upgrade: item.upgrade || null, compound: item.compound || null }))).digest("hex");
}

function canonicalEnhancement(item) {
	const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
	return canonicalize({ upgrade: item.upgrade || null, compound: item.compound || null });
}

function cumulativeIncrements(increments) {
	const core = Object.fromEntries(coreFields.map((field) => [field, 0]));
	const effects = Object.fromEntries(effectFields.map((field) => [field, 0]));
	const cumulative = {};
	for (const threshold of [2, 3, 4, 5]) {
		for (const field of coreFields) core[field] += Number(increments[threshold][field] || 0);
		for (const field of effectFields) effects[field] += Number(increments[threshold][field] || 0);
		cumulative[threshold] = { core: compact(core, coreFields), effects: compact(effects, effectFields) };
	}
	return cumulative;
}

function roleVector(baseline, weight, level, variant = "int") {
	const source = baseline.allocation_vectors[level - 1];
	if (weight === "medium") return { ...source.medium.core };
	if (weight === "light") return { ...source.light.variants[variant].core };
	const heavy = { ...source.heavy.core };
	const light = source.light.variants.int.core;
	for (const field of ["dex", "int"]) {
		const ceiling = Math.max(0, Math.min(source.medium.core[field] > 0 ? source.medium.core[field] - 1 : 0, light[field] > 0 ? light[field] - 1 : 0));
		const capped = Math.max(0, Math.min(heavy[field], ceiling));
		heavy.str += (heavy[field] - capped) / baseline.normalization_denominators[field] * baseline.normalization_denominators.str;
		heavy[field] = capped;
	}
	return heavy;
}

function preferredRoutes(routes) {
	const availabilityOrder = { permanent: 0, event: 1, unsupported: 2 };
	const selected = new Map();
	for (const route of [...routes].sort((left, right) => (availabilityOrder[left.availability || "unsupported"] ?? 3) - (availabilityOrder[right.availability || "unsupported"] ?? 3) || Number(left.selected_effort || Infinity) - Number(right.selected_effort || Infinity) || String(left.selected_route_id || left.route_id || left.item_id).localeCompare(String(right.selected_route_id || right.route_id || right.item_id))))
		if (!selected.has(route.item_id)) selected.set(route.item_id, route);
	return [...selected.values()];
}

function independentLargestRemainder(vector, destinations, weights, totalWeight, tieId) {
	const allocation = Object.fromEntries(destinations.map((destination) => [destination, Object.fromEntries(coreFields.map((field) => [field, 0]))]));
	const evidence = Object.fromEntries(destinations.map((destination) => [destination, {}]));
	for (const field of coreFields) {
		const pieces = destinations.map((destination) => ({ destination, raw: Number(vector[field] || 0) * Number(weights[destination] || 0) }));
		const target = Math.round(Number(vector[field] || 0) * totalWeight);
		const floors = pieces.reduce((total, piece) => total + Math.floor(piece.raw), 0);
		pieces.sort((left, right) => right.raw - Math.floor(right.raw) - (left.raw - Math.floor(left.raw)) || tieId(left.destination).localeCompare(tieId(right.destination)));
		for (const piece of pieces) allocation[piece.destination][field] = Math.floor(piece.raw);
		for (let index = 0; index < target - floors; index += 1) allocation[pieces[index].destination][field] += 1;
		for (let index = 0; index < pieces.length; index += 1) {
			const piece = pieces[index];
			evidence[piece.destination][field] = {
				raw: piece.raw,
				normalization_denominator: fixture.derivation.normalization_denominators[field],
				normalized_value: piece.raw / fixture.derivation.normalization_denominators[field],
				floor: Math.floor(piece.raw),
				remainder: piece.raw - Math.floor(piece.raw),
				remainder_rank: index + 1,
				received_remainder: index < target - floors,
				tie_break: tieId(piece.destination),
				published: allocation[piece.destination][field],
			};
		}
	}
	return { allocations: Object.fromEntries(Object.entries(allocation).map(([id, vector]) => [id, compact(vector, coreFields)])), evidence };
}

function independentArmorSlotAllocations(baseline, level, destinations, weights, totalWeight, selectedId = null, tieId = (destination) => destination) {
	const profiles = [
		{ id: "heavy", weight: "heavy", variant: "int" },
		{ id: "medium", weight: "medium", variant: "int" },
		{ id: "light", weight: "light", variant: "int" },
		{ id: "light_dex", weight: "light", variant: "dex" },
	].map((profile) => ({ ...profile, vector: roleVector(baseline, profile.weight, level, profile.variant) }));
	const allocations = Object.fromEntries(profiles.map((profile) => [profile.id, independentLargestRemainder(profile.vector, destinations, weights, totalWeight, profile.id === selectedId ? tieId : String)]));
	if (!selectedId) return { allocations: Object.fromEntries(Object.entries(allocations).map(([profileId, allocation]) => [profileId, allocation.allocations])) };
	const selected = profiles.find((profile) => profile.id === selectedId);
	return { allocations: Object.fromEntries(Object.entries(allocations).map(([profileId, allocation]) => [profileId, allocation.allocations])), selected: { allocations: allocations[selected.id].allocations, evidence: allocations[selected.id].evidence } };
}

function fixtureSetProperties(row, count) {
	return count < 2 ? {} : { ...row.cumulative[count].core, ...row.cumulative[count].effects };
}

function assertRuntimeCumulativeOutput(catalog, publishedSets, setId, row, slots, count, label) {
	const expected = fixtureSetProperties(row, count);
	const withoutBonus = calculateStats({ items: catalog.items, slots, sets: {} });
	const withBonus = calculateStats({ items: catalog.items, slots, sets: publishedSets });
	assert.deepEqual(withBonus.sets, count ? { [setId]: count } : {}, `${label}:set-count`);
	if (count >= 2) assert.deepEqual(JSON.parse(JSON.stringify(publishedSets[setId][count])), expected, `${label}:published-cumulative`);
	for (const field of ["str", "dex", "int", "vit", "armor", "resistance", "speed", "range", "apiercing", "rpiercing", "lifesteal", "manasteal", "evasion", "reflection", "dreturn", "mp_reduction", "pnresistance", "firesistance", "fzresistance", "phresistance", "stresistance"])
		assert.equal(Number(withBonus[field] || 0) - Number(withoutBonus[field] || 0), Number(expected[field] || 0), `${label}:${field}`);
	assert.equal(withBonus.max_hp - withoutBonus.max_hp, Number(expected.hp || 0) + Number(expected.vit || 0) * 48, `${label}:hp`);
	assert.equal(withBonus.max_mp - withoutBonus.max_mp, Number(expected.mp || 0) + Number(expected.int || 0) * 15, `${label}:mp`);
	assert.ok(Math.abs((withBonus.frequency - withoutBonus.frequency) - Number(expected.frequency || 0) / 100) < 1e-12, `${label}:frequency`);
	const expectedCrit = Math.min(100, dexCrit(withoutBonus.dex + Number(expected.dex || 0), DEX_CRIT_CALIBRATION) + Math.min(20, Number(expected.crit || 0)));
	assert.equal(withBonus.crit, expectedCrit, `${label}:crit`);
}

test("reviewed base armor and cape rows replace legacy power without changing enhancements", () => {
	const catalog = loadProperties();
	const beforePublication = loadCatalogBeforeBasePublication();
	assert.equal(fixture.schema_version, 1);
	assert.doesNotThrow(() => validateArmorSetBalanceFixture(fixture));
	assert.equal(`${JSON.stringify(buildArmorSetBalanceFixture(), null, "\t")}\n`, fs.readFileSync(path.join(__dirname, "fixtures/armor-set-balance.json"), "utf8"));
	assert.equal(Object.keys(fixture.items).length, 138);
	assert.deepEqual(Object.keys(catalog.base_nonweapon_progression).sort(), Object.keys(fixture.items).sort());
	for (const [itemId, row] of Object.entries(fixture.items)) {
		const item = catalog.items[itemId];
		assert.ok(item, itemId);
		assert.equal(item.type, row.type, itemId);
		assert.equal(item.armor_weight, row.weight, itemId);
		assert.deepEqual(compact(item), row.base_core, itemId);
		assert.deepEqual(compact(catalog.properties({ name: itemId, level: 0 })), row.base_core, `${itemId} properties`);
		assert.equal(item.for, undefined, `${itemId} has no Fortitude`);
		assert.equal(item.stat, undefined, `${itemId} has no legacy generic stat`);
		assert.equal(item.extra_stat, undefined, `${itemId} has no legacy extra stat`);
		assert.deepEqual(canonicalEnhancement(beforePublication.items[itemId]), row.enhancement, `${itemId} before enhancement object`);
		assert.deepEqual(canonicalEnhancement(item), row.enhancement, `${itemId} final enhancement object`);
		assert.equal(enhancementHash(item), row.enhancement_hash, `${itemId} enhancement hash`);
	}
	for (const [setId, details] of Object.entries(acquisitionFixture.ladders.armor_set_details)) {
		const rank = acquisitionFixture.ladders.armor_sets[fixture.sets[setId].weight].find((row) => row.set_id === setId);
		const hasPermanentSetRoute = Object.values(details.slots).every((routes) => routes.some((route) => route.availability === "permanent"));
		assert.equal(fixture.sets[setId].acquisition.availability, hasPermanentSetRoute ? "permanent" : "event", `${setId} set availability`);
		assert.equal(fixture.sets[setId].acquisition.route_effort, rank.selected_effort, `${setId} set completion effort`);
		for (const routes of Object.values(details.slots)) for (const route of preferredRoutes(routes)) {
			const row = fixture.items[route.item_id];
			assert.ok(row, route.item_id);
			assert.equal(row.acquisition.availability, route.availability || "unsupported", `${route.item_id} route availability`);
			assert.equal(row.acquisition.route_id, route.selected_route_id || route.route_id || null, `${route.item_id} route ID`);
			assert.equal(row.acquisition.route_effort, Number.isFinite(Number(route.selected_effort)) ? Number(route.selected_effort) : null, `${route.item_id} route effort`);
			assert.equal(row.acquisition.selected_effort, rank.selected_effort, `${route.item_id} set completion effort`);
		}
	}
	for (const itemId of fixture.event_only_rows) {
		assert.equal(fixture.items[itemId].acquisition.availability, "event", itemId);
		assert.equal(fixture.items[itemId].normalized_total, 0, itemId);
		assert.equal(fixture.items[itemId].acquisition.permanent_alternative, "lower_optional", itemId);
	}
});

test("all nineteen sets publish the reviewed incremental ladders and exact production runtime matrix", () => {
	const catalog = loadCatalog();
	assert.equal(Object.keys(fixture.sets).length, 19);
	for (const [setId, row] of Object.entries(fixture.sets)) {
		const set = catalog.sets[setId];
		assert.ok(set, setId);
		assert.equal(set[1], undefined, `${setId} has no one-piece bonus`);
		for (const threshold of [2, 3, 4, 5]) {
			assert.deepEqual(JSON.parse(JSON.stringify(set[threshold])), row.increments[threshold], `${setId}:${threshold}`);
			assert.ok(Object.keys(row.increments[threshold]).length > 0, `${setId}:${threshold} is non-empty`);
			assert.equal(row.increments[threshold].for, undefined, `${setId}:${threshold} has no Fortitude`);
		}
		const cumulative = cumulativeIncrements(row.increments);
		assert.deepEqual(cumulative, row.cumulative, `${setId} cumulative fixture`);
		const raw = sum(Object.values(row.canonical_slots).map((itemId) => fixture.items[itemId].base_core));
		assert.deepEqual(raw, row.raw_total, `${setId} raw total`);
		assert.deepEqual(cumulative[5].core, row.bonus_total, `${setId} bonus total`);
		assert.deepEqual(Object.keys(cumulative[5].effects).sort(), row.signature.slice().sort(), `${setId} signature keys`);
		for (const effect of row.signature) {
			assert.equal(cumulative[5].effects[effect], 1, `${setId}:${effect}`);
			assert.ok(cumulative[5].effects[effect] <= row.caps[effect].cap, `${setId}:${effect} cap`);
			if (row.caps[effect].source === "reviewed_lower_value") {
				assert.equal(row.caps[effect].cap, 1, `${setId}:${effect} reviewed minimum`);
				assert.match(row.caps[effect].reason, /No positive pinned sample/);
			} else assert.equal(row.caps[effect].source, "pinned_envelope", `${setId}:${effect} source`);
		}
	}
	const publishedSets = publishSetsThroughServer(catalog.sets);
	for (const [setId, row] of Object.entries(fixture.sets)) {
		const orderedSlots = Object.keys(row.canonical_slots);
		for (let count = 0; count <= 5; count += 1) {
			const slots = Object.fromEntries(orderedSlots.slice(0, count).map((slot) => [slot, { name: row.canonical_slots[slot], level: 0 }]));
			assertRuntimeCumulativeOutput(catalog, publishedSets, setId, row, slots, count, `${setId}:${count}:canonical`);
			for (const slot of orderedSlots.slice(0, count)) for (const itemId of catalog.sets[setId].bonus_items[slot]) {
				if (itemId === row.canonical_slots[slot]) continue;
				assertRuntimeCumulativeOutput(catalog, publishedSets, setId, row, { ...slots, [slot]: { name: itemId, level: 0 } }, count, `${setId}:${count}:${slot}:${itemId}`);
			}
		}
	}
});

test("reviewed budgets, distributions, threshold shares, and alternatives remain constrained", () => {
	const baseline = buildVanillaBaseline();
	const unitRounding = Math.max(...coreFields.map((field) => 1 / fixture.derivation.normalization_denominators[field]));
	const crossWeightRoundingTolerance = 2 * coreFields.reduce((total, field) => total + 1 / fixture.derivation.normalization_denominators[field], 0);
	assert.equal(fixture.derivation.cross_weight_rounding.tolerance, crossWeightRoundingTolerance, "derived cross-weight rounding tolerance");
	let observedCrossWeightSpread = 0;
	for (let level = 1; level <= 70; level += 1) {
		const source = baseline.allocation_vectors[level - 1];
		const heavy = roleVector(baseline, "heavy", level);
		const medium = roleVector(baseline, "medium", level);
		const light = roleVector(baseline, "light", level, "int");
		const dexLight = roleVector(baseline, "light", level, "dex");
		for (const vector of [heavy, medium, light, dexLight]) assert.ok(Math.abs(coreFields.reduce((total, field) => total + vector[field] / baseline.normalization_denominators[field], 0) - baseline.allocation_vectors[level - 1].heavy.normalized_total) < 1e-9, `equal budget level ${level}`);
		assert.deepEqual(medium, source.medium.core, `medium paired-role authority ${level}`);
		assert.deepEqual(light, source.light.variants.int.core, `light paired-role authority ${level}`);
		assert.deepEqual(dexLight, source.light.variants.dex.core, `DEX-light paired-role authority ${level}`);
		for (const field of ["vit", "hp", "armor", "resistance"]) assert.equal(heavy[field], source.heavy.core[field], `heavy survivability lane ${level}:${field}`);
		assert.ok(heavy.str / baseline.normalization_denominators.str >= medium.str / baseline.normalization_denominators.str && heavy.str / baseline.normalization_denominators.str >= light.str / baseline.normalization_denominators.str, `heavy STR lane ${level}`);
		for (const field of ["dex", "int"]) {
			assert.ok(heavy[field] <= medium[field] && heavy[field] <= light[field], `heavy low ${field} ${level}`);
			if (medium[field] > 0 && light[field] > 0) assert.ok(heavy[field] < medium[field] && heavy[field] < light[field], `heavy strict low ${field} ${level}`);
		}
		assert.ok(Math.abs(dexLight.dex - medium.dex) < 1e-9, `DEX-light offense level ${level}`);
		const crossWeight = independentArmorSlotAllocations(baseline, level, ["helmet", "chest", "pants", "gloves", "shoes"], { helmet: .12, chest: .24, pants: .2, gloves: .08, shoes: .08 }, .72);
		for (const slot of ["helmet", "chest", "pants", "gloves", "shoes"]) {
			const totals = ["heavy", "medium", "light", "light_dex"].map((profile) => normalizedTotal(crossWeight.allocations[profile][slot]));
			const spread = Math.max(...totals) - Math.min(...totals);
			observedCrossWeightSpread = Math.max(observedCrossWeightSpread, spread);
			assert.ok(spread <= crossWeightRoundingTolerance + 1e-12, `cross-weight ${level}:${slot} canonical rounding tolerance`);
		}
	}
	assert.equal(fixture.derivation.cross_weight_rounding.observed, observedCrossWeightSpread, "generated cross-weight rounding evidence");
	const invalidBaseline = JSON.parse(JSON.stringify(baseline));
	invalidBaseline.allocation_vectors[0].medium.core.str += 10000;
	assert.throws(() => assertCanonicalArmorCrossWeightRounding(invalidBaseline, ["helmet", "chest", "pants", "gloves", "shoes"], { helmet: .12, chest: .24, pants: .2, gloves: .08, shoes: .08 }, .72), /Cross-weight canonical rounding exceeds tolerance at level 1, helmet/);
	for (const [setId, row] of Object.entries(fixture.sets)) {
		const vector = roleVector(baseline, row.weight, row.acquisition.mapped_level, row.variant);
		assert.deepEqual(row.role_core, compact(vector, coreFields), `${setId} role evidence`);
		const profileId = row.weight === "light" && row.variant === "dex" ? "light_dex" : row.weight;
		const rawAllocation = independentArmorSlotAllocations(baseline, row.acquisition.mapped_level, Object.keys(row.canonical_slots), Object.fromEntries(Object.keys(row.canonical_slots).map((slot) => [slot, .8 * fixture.derivation.slot_shares[slot]])), .8 * Object.keys(row.canonical_slots).reduce((total, slot) => total + fixture.derivation.slot_shares[slot], 0), profileId, (slot) => row.canonical_slots[slot]).selected;
		const bonusAllocation = independentLargestRemainder(vector, [2, 3, 4, 5], { 2: .027, 3: .036, 4: .045, 5: .072 }, .18, String);
		assert.deepEqual(row.raw_rounding, rawAllocation.evidence, `${setId} raw rounding evidence`);
		assert.deepEqual(row.bonus_rounding, bonusAllocation.evidence, `${setId} bonus rounding evidence`);
		for (const [slot, itemId] of Object.entries(row.canonical_slots)) {
			assert.deepEqual(fixture.items[itemId].base_core, rawAllocation.allocations[slot], `${setId}:${slot} independent allocation`);
			assert.deepEqual(fixture.items[itemId].rounding, rawAllocation.evidence[slot], `${setId}:${slot} item rounding evidence`);
			for (const field of coreFields) assert.ok(Math.abs(Number(fixture.items[itemId].base_core[field] || 0) - vector[field] * .8 * fixture.derivation.slot_shares[slot]) <= 1, `${setId}:${slot}:${field} one quantum`);
		}
		for (const threshold of [2, 3, 4, 5]) assert.deepEqual(compact(row.increments[threshold], coreFields), bonusAllocation.allocations[threshold], `${setId}:${threshold} independent increment`);
		const completed = row.raw_normalized_total + row.bonus_normalized_total;
		const bonusShare = row.bonus_normalized_total / completed;
		assert.ok(bonusShare >= .15 && bonusShare <= .25, `${setId} bonus share`);
		const cumulative = cumulativeIncrements(row.increments);
		for (const threshold of [2, 3, 4, 5]) assert.deepEqual(cumulative[threshold].core, compact(sum([2, 3, 4, 5].filter((candidate) => candidate <= threshold).map((candidate) => bonusAllocation.allocations[candidate])), coreFields), `${setId}:${threshold} cumulative allocation`);
		const increments = [2, 3, 4, 5].map((threshold) => normalizedTotal(row.increments[threshold]));
		assert.ok(increments[3] >= Math.max(...increments.slice(0, 3)), `${setId} five-piece increment`);
	}
	for (const [itemId, row] of Object.entries(fixture.items)) {
		const vector = row.event_only ? Object.fromEntries(coreFields.map((field) => [field, 0])) : roleVector(baseline, row.weight, row.acquisition.mapped_level, row.variant);
		if (row.scope === "set_piece") continue;
		const share = row.scope === "cape" ? fixture.derivation.slot_shares.cape : fixture.derivation.slot_shares[row.type];
		const allocation = independentLargestRemainder(vector, [itemId], { [itemId]: share || 0 }, share || 0, String);
		assert.deepEqual(row.base_core, allocation.allocations[itemId], `${itemId} standalone/cape allocation`);
		assert.deepEqual(row.rounding, allocation.evidence[itemId], `${itemId} standalone/cape rounding evidence`);
		assert.ok(Math.abs(row.normalized_total - normalizedTotal(allocation.allocations[itemId])) <= unitRounding, `${itemId} standalone/cape one quantum`);
	}
	assert.ok(Array.isArray(fixture.domination_rows));
	assert.deepEqual([...new Set(fixture.domination_rows.map((row) => row.scope))].sort(), ["cape", "completed_set", "cumulative_threshold", "raw_piece", "standalone"]);
	for (const row of fixture.domination_rows) {
		assert.deepEqual(Object.keys(row.vector).sort(), [...coreFields, ...effectFields].sort(), `${row.id} domination vector`);
		assert.deepEqual(row.normalized_vector, Object.fromEntries([...coreFields, ...effectFields].map((field) => [field, coreFields.includes(field) ? row.vector[field] / fixture.derivation.normalization_denominators[field] : row.vector[field]])), `${row.id} normalized domination vector`);
		if (row.scope === "raw_piece") {
			const item = fixture.items[row.id.slice("raw:".length)];
			assert.equal(row.route_effort, item.acquisition.route_effort, `${row.id} actual route effort`);
			assert.equal(row.effort, item.acquisition.selected_effort, `${row.id} gated progression effort`);
		} else assert.equal(row.route_effort, row.effort, `${row.id} route effort`);
	}
	assert.doesNotThrow(() => assertNoStrictDomination(fixture.domination_rows, fixture.derivation.normalization_denominators, { equalOrEasier: true }));
	const mutatedRows = JSON.parse(JSON.stringify(fixture.domination_rows));
	const dominatedPair = mutatedRows.flatMap((left, leftIndex) => mutatedRows.slice(leftIndex + 1).filter((right) => left.comparable && right.comparable && left.ladder_id === right.ladder_id && left.tie_band !== right.tie_band && left.effort < right.effort).map((right) => [left, right]))[0];
	assert.ok(dominatedPair, "cross-band domination mutation pair");
	const [easier, harder] = dominatedPair;
	assert.doesNotThrow(() => assertNoStrictDomination([easier, harder], fixture.derivation.normalization_denominators, { equalOrEasier: true }));
	easier.vector = Object.fromEntries([...coreFields, ...effectFields].map((field) => [field, Number(harder.vector[field] || 0) + (field === "str" ? 1 : 0)]));
	assert.throws(() => assertNoStrictDomination(mutatedRows, fixture.derivation.normalization_denominators, { equalOrEasier: true }), { code: "equipment_balance_violation", rule: "strict_domination" });
});

test("the item-property formula remains the pinned authority", () => {
	const current = fs.readFileSync(path.join(root, "js/old_common_functions.js"), "utf8");
	const pinned = childProcess.execFileSync("git", ["show", "99d1a8672438227948caf5a5f8c9d595466d8019:js/old_common_functions.js"], { cwd: root, encoding: "utf8" });
	const extract = (source) => source.slice(source.indexOf("function calculate_item_properties"), source.indexOf("\nfunction random_one", source.indexOf("function calculate_item_properties")));
	assert.equal(extract(current), extract(pinned));
});
