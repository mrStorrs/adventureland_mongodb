"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { isCompatibleOffhand } = require("../game/equipment");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { calculateStats } = require("../game/stats");
const { buildEquipmentAcquisitionFixture, buildWeaponLoadoutBalanceFixture, validateWeaponLoadoutBalanceFixture } = require("../tools/equipment-balance");
const { loadRankingFixture } = require("../tools/weapon-acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");
const { loadSourceData } = require("../tools/acquisition-ranking");

const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/vanilla-equipment-baseline.json"), "utf8"));
const ranking = loadRankingFixture();
const PLACEHOLDER_RANGE_PEERS = Object.freeze({
	wbook2: "wbook0",
	wbook3: "wbook0",
	wbook4: "wbook1",
	wbook5: "wbook1",
	wbook6: "wbookhs",
	wbook7: "wbookhs",
	wbook8: "wbookhs",
	wbook9: "wbookhs",
});
const REVIEWED_OFFHAND_IDS = Object.freeze(["wshield", "shield", "sshield", "mshield", "xshield", "quiver", "t2quiver", "alloyquiver", "lantern", "exoarm", "tigershield"]);
let checked;
let generated;

function loadoutFixture() {
	if (!checked) checked = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/weapon-loadout-balance.json"), "utf8"));
	return checked;
}

function generatedFixture() {
	if (!generated) generated = buildWeaponLoadoutBalanceFixture();
	return generated;
}

function rangeStates(definition) {
	const enhancement = definition.upgrade?.range === undefined && definition.compound?.range === undefined ? null : definition.upgrade ? "upgrade" : "compound";
	const maximum = enhancement ? Math.max(0, Number(definition.grades?.[3] || (enhancement === "upgrade" ? 12 : 8))) : 0;
	return Array.from({ length: maximum + 1 }, (_, level) => level);
}

test("every ranked weapon uses its profile range plus its actual-level range exactly once", () => {
	const data = loadSourceData();
	const calculators = loadPropertyCalculators(data);
	const pinnedRanges = new Map(baseline.weapon_ranges.map((row) => [row.weapon_id, row]));
	for (const { weapon_id: weaponId } of ranking.weapons) {
		const definition = data.items[weaponId];
		const profile = WEAPON_PROFILES[definition.wtype];
		const pinned = pinnedRanges.get(PLACEHOLDER_RANGE_PEERS[weaponId] || weaponId);
		assert.ok(profile, `${weaponId} profile`);
		assert.ok(pinned, `${weaponId} pinned range`);
		assert.equal(Number(definition.range || 0), pinned.raw_range, `${weaponId} raw range`);
		assert.equal(Number(definition.upgrade?.range || 0), pinned.upgrade_range_delta, `${weaponId} upgrade range`);
		assert.equal(Number(definition.compound?.range || 0), pinned.compound_range_delta, `${weaponId} compound range`);
		assert.deepEqual(rangeStates(definition).map((level) => ({ level, range: calculators.current.calculate_item_properties({ name: weaponId, level }).range })), pinned.states, `${weaponId} range states`);
		for (const level of rangeStates(definition)) {
			const properties = calculators.current.calculate_item_properties({ name: weaponId, level });
			const stats = calculateStats({ slots: { mainhand: { name: weaponId, level } }, items: data.items, getItemProperties: calculators.current.calculate_item_properties });
			assert.equal(stats.range, profile.range + properties.range, `${weaponId}+${level} additive range`);
		}
	}
});

test("offhand weapons never add range and published Priest books keep the book profile", () => {
	const data = loadSourceData();
	const calculators = loadPropertyCalculators(data);
	const weaponIds = ranking.weapons.map((row) => row.weapon_id);
	for (const mainId of weaponIds) for (const offhandId of weaponIds) {
		if (mainId === offhandId || !isCompatibleOffhand({ name: mainId }, { name: offhandId }, data.items)) continue;
		const properties = calculators.current.calculate_item_properties({ name: mainId, level: 0 });
		const stats = calculateStats({ slots: { mainhand: { name: mainId, level: 0 }, offhand: { name: offhandId, level: 0 } }, items: data.items, getItemProperties: calculators.current.calculate_item_properties });
		assert.equal(stats.range, WEAPON_PROFILES[data.items[mainId].wtype].range + properties.range, `${mainId}/${offhandId} suppresses offhand range`);
	}
	for (const bookId of ["wbook0", "wbook2", "wbook3", "wbook4", "wbook5", "wbook1", "wbook6", "wbook7", "wbook8", "wbook9", "wbookhs"]) {
		const definition = data.items[bookId];
		const properties = calculators.current.calculate_item_properties({ name: bookId, level: 0 });
		const stats = calculateStats({ slots: { mainhand: { name: bookId, level: 0 } }, items: data.items, getItemProperties: calculators.current.calculate_item_properties });
		assert.equal(definition.wtype, "book", `${bookId} published type`);
		assert.equal(stats.projectile, "pmagic", `${bookId} projectile`);
		assert.equal(stats.range, WEAPON_PROFILES.book.range + properties.range, `${bookId} additive range`);
	}
});

test("shared-rank weapon evidence covers every rank, weapon, and +0 through +5 state", () => {
	const fixture = loadoutFixture();
	assert.deepEqual(fixture.policy.shared_rank_requirements, [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99]);
	assert.deepEqual(fixture.policy.reference_levels, [1, 8, 15, 22, 29, 36, 42, 49, 56, 63, 70]);
	assert.deepEqual(fixture.policy.rank_targets, ranking.policy.rank_targets);
	assert.deepEqual(fixture.policy.full_sheet_endpoints, ranking.policy.full_sheet_endpoints);
	assert.deepEqual(fixture.counts, {
		weapons: 83,
		retained_weapons: 75,
		placeholder_weapons: 8,
		offhands: 11,
		legal_layouts: fixture.legal_layouts.length,
	});
	assert.equal(fixture.rank_bands.length, 11);
	assert.equal(fixture.rank_bands.reduce((sum, row) => sum + row.progression_count, 0), 66);
	assert.equal(fixture.rank_bands.reduce((sum, row) => sum + row.sidegrade_count, 0), 17);
	for (const row of fixture.rank_bands) {
		assert.equal(row.progression_count, 6, `rank-${row.shared_rank} progression anchors`);
		assert.ok(row.minimum >= row.lower_boundary - 1e-12, `rank-${row.shared_rank} lower boundary`);
		assert.ok(row.maximum <= row.upper_boundary + 1e-12, `rank-${row.shared_rank} upper boundary`);
	}
	assert.equal(fixture.weapon_states.length, 498);
	for (const weapon of ranking.weapons) {
		const states = fixture.weapon_states.filter((row) => row.weapon_id === weapon.weapon_id);
		assert.deepEqual(states.map((row) => row.level), [0, 1, 2, 3, 4, 5], weapon.weapon_id);
		assert.ok(states.every((row) => Number.isFinite(row.attack_property) && row.attack_property > 0 && Number.isFinite(row.base_dps) && row.base_dps > 0), weapon.weapon_id);
		for (let index = 1; index < states.length; index += 1)
			assert.ok(states[index].base_dps >= states[index - 1].base_dps, `${weapon.weapon_id}+${states[index].level} Base DPS must be nondecreasing`);
	}
});

test("all directed legal hand layouts are represented exactly once", () => {
	const fixture = loadoutFixture();
	const data = loadSourceData();
	const weaponIds = ranking.weapons.map((row) => row.weapon_id);
	const expected = [];
	for (const mainId of weaponIds) {
		expected.push(mainId);
		for (const offhandId of [...weaponIds, ...REVIEWED_OFFHAND_IDS])
			if (isCompatibleOffhand({ name: mainId }, { name: offhandId }, data.items)) expected.push(`${mainId}+${offhandId}`);
	}
	assert.equal(fixture.counts.legal_layouts, expected.length);
	assert.deepEqual(fixture.legal_layouts.map((row) => row.id).sort(), expected.sort());
	assert.equal(Object.values(Object.fromEntries(["one_hand", "one_hand_offhand", "two_hand", "dual_wield"].map((kind) => [kind, fixture.legal_layouts.filter((row) => row.layout_kind === kind).length]))).reduce((sum, count) => sum + count, 0), expected.length);
});

test("reviewed offhands publish exact acquisition requirements and preserved enhancements", () => {
	const fixture = loadoutFixture();
	const acquisition = buildEquipmentAcquisitionFixture();
	const acquisitionRows = new Map(Object.values(acquisition.ladders.offhands).flat().map((row) => [row.item_id, row]));
	assert.deepEqual(fixture.offhands.map((row) => row.item_id), [...REVIEWED_OFFHAND_IDS].sort());
	for (const row of fixture.offhands) {
		const source = acquisitionRows.get(row.item_id);
		assert.equal(row.selected_route_id, source.selected_route_id, row.item_id);
		assert.equal(row.selected_effort, source.selected_effort, row.item_id);
		assert.equal(row.mapped_level, source.mapped_level, row.item_id);
		assert.equal(row.unlock, source.unlock, row.item_id);
		assert.equal(row.availability, row.item_id === "tigershield" ? "event" : "permanent", row.item_id);
		assert.ok(row.enhancement_hash && row.enhancement_hash.length === 64, row.item_id);
	}
});

test("the event shield interpolates between its adjacent permanent acquisition anchors", () => {
	const offhands = new Map(loadoutFixture().offhands.map((row) => [row.item_id, row]));
	const lower = offhands.get("wshield");
	const upper = offhands.get("shield");
	const tiger = offhands.get("tigershield");
	const interpolation = (tiger.percentile - lower.percentile) / (upper.percentile - lower.percentile);
	assert.equal(interpolation, 0.4);
	assert.deepEqual(tiger.base_output, {
		armor: Math.round(lower.base_output.armor + interpolation * (upper.base_output.armor - lower.base_output.armor)),
		resistance: Math.round(lower.base_output.resistance + interpolation * (upper.base_output.resistance - lower.base_output.resistance)),
		speed: 2,
	});
});

test("cross-offhand-rank shield comparisons independently reject strict domination", () => {
	const fixture = loadoutFixture();
	const shieldIds = new Set(fixture.offhands.filter((row) => row.type === "shield").map((row) => row.item_id));
	const layouts = fixture.legal_layouts.filter((row) => shieldIds.has(row.offhand_id));
	const violations = [];
	let comparisons = 0;
	for (const easier of layouts) for (const harder of layouts) {
		if (easier === harder || easier.mainhand_id !== harder.mainhand_id || easier.offhand_shared_rank === harder.offhand_shared_rank || easier.acquisition_effort > harder.acquisition_effort) continue;
		comparisons += 1;
		const coordinates = [...new Set([...Object.keys(easier.score), ...Object.keys(harder.score)])];
		const left = coordinates.map((field) => Number(easier.score[field] || 0));
		const right = coordinates.map((field) => Number(harder.score[field] || 0));
		if (left.every((value, index) => value >= right[index]) && left.some((value, index) => value > right[index]))
			violations.push([easier.id, harder.id]);
	}
	assert.ok(comparisons > 0);
	for (const mainhand of ["pmace", "xmace", "lmace"]) {
		const tiger = layouts.find((row) => row.id === `${mainhand}+tigershield`);
		const permanent = layouts.find((row) => row.id === `${mainhand}+shield`);
		assert.ok(tiger.acquisition_effort < permanent.acquisition_effort, mainhand);
		assert.notEqual(tiger.offhand_shared_rank, permanent.offhand_shared_rank, mainhand);
	}
	assert.deepEqual(violations, []);
});

test("no equal-or-easier comparable legal layout strictly dominates another", () => {
	const fixture = loadoutFixture();
	assert.deepEqual(fixture.domination_violations, []);
	assert.deepEqual(fixture.application, { status: "passed", violations: [] });
});

test("weapon loadout evidence regenerates deterministically", () => {
	assert.doesNotThrow(() => validateWeaponLoadoutBalanceFixture(loadoutFixture(), generatedFixture()));
	assert.deepEqual(buildWeaponLoadoutBalanceFixture(), generatedFixture());
});
