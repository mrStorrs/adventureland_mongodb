"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isCompatibleOffhand } = require("../game/equipment");
const { buildEquipmentAcquisitionFixture, functionalCompletionEffort, loadEquipmentFixture, mapPercentileToLevel, pinnedTargetLoadout, validateEquipmentAcquisitionFixture } = require("../tools/equipment-balance");
const { assignPercentiles, buildProductionAcquisitionResolver, loadSourceData } = require("../tools/acquisition-ranking");
const { loadRankingFixture } = require("../tools/weapon-acquisition-ranking");

test("equipment acquisition fixture covers every published non-weapon route deterministically", () => {
	const fixture = loadEquipmentFixture("equipment-acquisition-ranking.json");
	const generated = buildEquipmentAcquisitionFixture();
	assert.doesNotThrow(() => validateEquipmentAcquisitionFixture(fixture, generated));
	assert.equal(fixture.schema_version, 1);
	assert.ok(fixture.rows.length > 0);
	assert.ok(fixture.rows.every((row) => row.item_id && row.selected_route_id && ["permanent", "event"].includes(row.availability) && row.mapped_level >= 1 && row.unlock >= 1));
	assert.deepEqual(fixture.rows.filter((row) => row.availability === "event").map((row) => row.item_id), ["tigershield"]);
	assert.ok(fixture.rows.every((row) => Number.isInteger(row.tie_band) && row.tie_band >= 1));
	const rankedOffhandRows = Object.values(fixture.ladders.offhands).flat();
	const tigerShield = rankedOffhandRows.find((row) => row.item_id === "tigershield");
	const permanentOffhands = rankedOffhandRows.filter((row) => row.availability === "permanent");
	const derivedTigerPercentile = assignPercentiles([
		...permanentOffhands.map((row) => ({ item_id: row.item_id, effort: row.selected_effort })),
		{ item_id: tigerShield.item_id, effort: tigerShield.selected_effort },
	]).find((row) => row.item_id === tigerShield.item_id).percentile;
	assert.equal(tigerShield.percentile, derivedTigerPercentile);
	assert.equal(tigerShield.mapped_level, mapPercentileToLevel(derivedTigerPercentile));
	assert.equal(tigerShield.unlock, mapPercentileToLevel(derivedTigerPercentile, 99));
	assert.equal(tigerShield.sideload_percentile_basis, "selected event-route effort ranked with the permanent combined-offhand population");
	const sourceData = loadSourceData();
	const { resolver: sourceResolver } = buildProductionAcquisitionResolver({ data: sourceData, evidence: loadRankingFixture() });
	for (const item_id of ["helmet", "shoes"]) {
		const row = fixture.rows.find((candidate) => candidate.item_id === item_id);
		assert.deepEqual({ selected_route_id: row.selected_route_id, selected_effort: row.selected_effort, tie_band: row.tie_band, percentile: row.percentile, mapped_level: row.mapped_level, unlock: row.unlock }, { selected_route_id: `starter:${item_id}`, selected_effort: 0, tie_band: 1, percentile: 0.125, mapped_level: 10, unlock: 13 });
		assert.deepEqual(sourceResolver.allRoutes(item_id).find((route) => route.route_id === `starter:${item_id}`), { route_id: `starter:${item_id}`, kind: "starter", source_path: "design/character.js:character.starter.equipment", effort: 0 });
	}
	const starterOnly = {
		...fixture,
		rows: fixture.rows.filter((row) => ["helmet", "shoes"].includes(row.item_id)),
		ladders: { ...fixture.ladders, armor_set_details: {}, armor_sets: { heavy: [], medium: [], light: [] } },
	};
	const rangerNine = pinnedTargetLoadout(sourceData.items, starterOnly, "ranger", 9, "dex");
	const rangerTen = pinnedTargetLoadout(sourceData.items, starterOnly, "ranger", 10, "dex");
	assert.equal(rangerNine.slots.helmet.item_id, null);
	assert.equal(rangerNine.slots.shoes.item_id, null);
	assert.equal(rangerTen.slots.helmet.item_id, "helmet");
	assert.equal(rangerTen.slots.shoes.item_id, "shoes");
	assert.deepEqual(Object.keys(fixture.ladders.armor_sets), ["heavy", "medium", "light"]);
	assert.equal(Object.values(fixture.ladders.armor_sets).flat().length, 19);
	assert.deepEqual(Object.values(fixture.ladders.armor_sets).flat().map((row) => row.set_id).sort(), ["bunny", "fury", "holidays", "legends", "mmage", "mmerchant", "mpaladin", "mpriest", "mpx", "mranger", "mrogue", "mwarrior", "rugged", "swift", "tiger", "vampires", "wanderers", "wt3", "wt4"]);
	assert.equal(fixture.planned_items.length, 25);
	assert.deepEqual(fixture.planned_items.map((item) => item.item_id).sort(), ["egloves", "epants", "furyarmor", "furyboots", "furygloves", "legendboots", "legendhelmet", "mpalarmor", "mpalboots", "mpalgloves", "mpalhelmet", "mpalpants", "mpxarmor", "mpxboots", "mpxhelmet", "mpxpants", "swiftarmor", "swifthelmet", "swiftpants", "tigerarmor", "tigerboots", "tigergloves", "tigerpants", "vhelmet", "vpants"]);
	assert.ok(fixture.planned_items.every((item) => item.type && item.name && item.set && item.weight && item.asset && item.routes.some((route) => route.availability === "permanent" && route.allocation || route.availability === "event" && route.allocation?.permanent_peer_set_id)));
	assert.ok(fixture.excluded.every((row) => row.target && ["event", "hidden", "unsupported", "reviewed_exclusion"].includes(row.reason) && row.evidence));
	assert.ok(fixture.excluded.every((row) => row.reason !== "event"), "reviewed event-only inventory is represented as optional evidence");
	assert.deepEqual(fixture.optional_event_rows.map((row) => row.item_id), ["cdragon", "ecape", "fcape", "frankypants", "gcape", "horsecapeg", "iceskates", "oxhelmet", "rednose", "snowboots", "tigercape", "tigershield"]);
	assert.ok(fixture.optional_event_rows.every((row) => row.reason === "event" && row.routes.length && row.routes.every((route) => route.availability === "event")));
	assert.ok(Object.keys(fixture.source_artifact_hashes).length >= 1);
	const audit = fixture.source_audit;
	assert.equal(audit.previous_commit, "76a50408fac4a7b1df1e1906ed631ac013b1123c");
	assert.equal(Object.keys(audit.source_table_hashes).length, 11);
	assert.ok(Object.values(audit.source_table_hashes).every((hashes) => typeof hashes.after === "string" && hashes.after.length === 64));
	assert.deepEqual(Object.fromEntries(Object.entries(audit.drop_themes).map(([setId, theme]) => [setId, [theme.before_mass, theme.after_mass]])), {
		tiger: [0.1, 0.1], vampires: [0.2, 0.2], mpx: [0.0005, 0.0005], fury: [0.005, 0.005], legends: [1, 1], bunny: [1, 1],
	});
	for (const recipe of Object.values(audit.recipes)) {
		assert.equal(recipe.before, null);
		assert.equal(recipe.source_recipe_id, "wingedboots");
		assert.deepEqual(recipe.after, recipe.source_recipe);
	}
	assert.deepEqual(Object.fromEntries(Object.entries(audit.token_costs).map(([itemId, token]) => [itemId, token.after])), {
		mpalhelmet: 7, mpalarmor: 12, mpalpants: 11, mpalgloves: 8, mpalboots: 15,
	});
	assert.ok(fixture.availability_overrides.every((override) => override.route_id && override.rationale));
	for (const [setId, set] of Object.entries(fixture.ladders.armor_set_details)) {
		assert.ok(["heavy", "medium", "light"].includes(set.weight), setId);
		assert.deepEqual(Object.keys(set.slots), ["helmet", "chest", "pants", "gloves", "shoes"], setId);
		assert.ok(Object.values(set.slots).every((alternatives) => alternatives.length > 0), setId);
		assert.equal(set.exclusions.length, 0, setId);
		if (set.optional_event_sidegrade) {
			assert.equal(set.functional_completion_effort, null, setId);
			assert.ok(set.ranking_effort > 0, setId);
			assert.ok(["measured", "incomplete_event_inventory"].includes(set.event_completion_status), setId);
			if (set.event_completion_status === "measured") assert.ok(set.event_completion_effort > 0, setId);
			assert.ok(Object.values(set.slots).flat().some((row) => row.availability === "event" && row.allocation?.permanent_peer_set_id === set.optional_event_sidegrade.permanent_peer_set_id), setId);
			continue;
		}
		const independentSum = Object.values(set.slots).reduce((sum, alternatives) => sum + Math.min(...alternatives.filter((row) => row.availability === "permanent").map((row) => row.selected_effort)), 0);
		assert.ok(set.functional_completion_effort > 0 && set.functional_completion_effort <= independentSum + 1e-6, setId);
	}
	assert.equal(fixture.ladders.armor_set_details.wt3.functional_completion_effort, 527518.04325);
	for (const [weight, ladder] of Object.entries(fixture.ladders.armor_sets))
		for (const row of ladder) {
			assert.equal(weight, fixture.ladders.armor_set_details[row.set_id].weight);
			assert.ok(Number.isInteger(row.tie_band) && row.mapped_level >= 1 && row.unlock >= 1);
		}
	assert.ok(Object.values(fixture.ladders.offhands).flat().every((row) => /^one_hand_/.test(row.legal_hand_profile)));
	const offhandRows = new Map(Object.values(fixture.ladders.offhands).flat().map((row) => [row.item_id, row]));
	for (const skill of ["mage", "priest"]) {
		const loadout = pinnedTargetLoadout(sourceData.items, fixture, skill, 70, "int");
		const mainhandId = skill === "mage" ? "staff" : "wbook0";
		assert.ok(loadout.slots.offhand.item_id, `${skill} canonical offhand`);
		assert.equal(offhandRows.get(loadout.slots.offhand.item_id).availability, "permanent", `${skill} canonical availability`);
		assert.equal(isCompatibleOffhand({ name: mainhandId }, { name: loadout.slots.offhand.item_id }, sourceData.items), true, `${skill} canonical compatibility`);
	}
});

test("reviewed planned routes preserve route-native distributions and event-only peers", () => {
	const fixture = loadEquipmentFixture("equipment-acquisition-ranking.json");
	const data = loadSourceData();
	const { resolver } = buildProductionAcquisitionResolver({ data, evidence: loadRankingFixture() });
	const routeRows = Object.values(fixture.ladders.armor_set_details).flatMap((set) => Object.values(set.slots).flat());
	const unique = new Map(routeRows.map((row) => [`${row.item_id}:${row.selected_route_id}`, row]));
	const byItem = new Map();
	for (const row of unique.values()) {
		if (!byItem.has(row.item_id)) byItem.set(row.item_id, []);
		byItem.get(row.item_id).push(row);
	}
	const mass = new Map();
	for (const rows of byItem.values()) for (const row of rows.filter((candidate) => candidate.availability === "permanent" && candidate.allocation)) {
		const allocation = row.allocation;
		if (allocation.kind === "drop_redistribution") {
			assert.equal(row.source_item_id, row.item_id, row.item_id);
			assert.equal(row.distribution.source_key, `${allocation.source_table}:${allocation.source_route_id}`, row.item_id);
			const source = resolver.allRoutes(row.source_item_id).find((candidate) => candidate.route_id === allocation.source_route_id);
			assert.ok(source, row.item_id);
			assert.equal(row.distribution.outcome_probability, source.effective_probability, row.item_id);
			assert.equal(row.selected_effort, Number((row.distribution.encounter_effort / row.distribution.outcome_probability).toPrecision(12)), row.item_id);
				const sourceKey = `${allocation.source_table}:${allocation.source_route_id}`;
				mass.set(sourceKey, (mass.get(sourceKey) || 0) + allocation.source_share);
		} else if (allocation.kind === "recipe_copy") {
			const source = resolver.allRoutes(row.source_item_id).find((candidate) => candidate.route_id === allocation.copied_route_id);
			assert.ok(source, row.item_id);
			assert.equal(row.selected_effort, source.effort, row.item_id);
			assert.deepEqual(row.dependency_chain, source.dependency_route_ids || [], row.item_id);
		} else if (allocation.kind === "token_exchange") {
			const source = resolver.allRoutes(allocation.token_id)[0];
			assert.equal(row.token_quantity, allocation.token_quantity, row.item_id);
			assert.equal(row.selected_effort, Number((source.effort * allocation.token_quantity).toPrecision(12)), row.item_id);
			assert.deepEqual(row.dependency_chain, [source.route_id, ...(source.dependency_route_ids || [])].sort(), row.item_id);
		}
	}
	for (const [sourceTable, total] of mass) assert.ok(Math.abs(total - 1) < 1e-12, sourceTable);
	for (const rows of byItem.values()) {
		const permanent = rows.find((row) => row.availability === "permanent");
		for (const event of rows.filter((row) => row.availability === "event" && row.allocation?.permanent_counterpart)) {
			assert.equal(event.allocation.permanent_counterpart, permanent.selected_route_id, event.item_id);
			const source = resolver.allRoutes(event.source_item_id).find((candidate) => candidate.route_id === event.allocation.source_route_id);
			assert.ok(source, event.item_id);
			if (event.allocation.source_share) {
				assert.equal(event.selected_effort, Number((event.distribution.encounter_effort / event.distribution.outcome_probability).toPrecision(12)), event.item_id);
				assert.equal(event.distribution.correlation, "exclusive_allocation", event.item_id);
			} else assert.equal(event.selected_effort, source.effort, event.item_id);
		}
	}
	for (const setId of ["tiger", "mpx", "legends", "bunny", "holidays"]) {
		const set = fixture.ladders.armor_set_details[setId];
		assert.equal(set.functional_completion_effort, null, setId);
		assert.ok(set.optional_event_sidegrade.permanent_peer_set_id, setId);
		assert.ok(set.event_completion_effort > 0, setId);
		assert.equal(set.ranking_basis, "permanent_peer", setId);
	}
	const eventAuthority = {
		tiger: { item_id: "tigerhelmet", probability: 0.02, completion: 114.166666667 },
		mpx: { item_id: "mpxhelmet", probability: 0.0001, completion: 1864279103590 },
		legends: { item_id: "legendhelmet", probability: 1.24048042949e-8, completion: 817581997111000 },
		bunny: { item_id: "eears", probability: 0.00174794616326, completion: 2000242849.38 },
		holidays: { item_id: "xmashat", probability: 0.00483411286087, completion: 12374.9615636 },
	};
	for (const [setId, expected] of Object.entries(eventAuthority)) {
		const set = fixture.ladders.armor_set_details[setId];
		const route = Object.values(set.slots).flat().find((row) => row.item_id === expected.item_id && row.availability === "event");
		const peerId = set.optional_event_sidegrade.permanent_peer_set_id;
		const peer = fixture.ladders.armor_set_details[peerId];
		const setRank = fixture.ladders.armor_sets[set.weight].find((row) => row.set_id === setId);
		const peerRank = fixture.ladders.armor_sets[peer.weight].find((row) => row.set_id === peerId);
		assert.equal(route.distribution.outcome_probability, expected.probability, setId);
		assert.equal(set.event_completion_effort, expected.completion, setId);
		assert.equal(set.ranking_effort, peer.functional_completion_effort, setId);
		assert.deepEqual({ percentile: setRank.percentile, mapped_level: setRank.mapped_level, unlock: setRank.unlock }, { percentile: peerRank.percentile, mapped_level: peerRank.mapped_level, unlock: peerRank.unlock }, setId);
	}
	const bunnyRoutes = Object.values(fixture.ladders.armor_set_details.bunny.slots).flat().filter((row) => row.availability === "event");
	assert.equal(new Set(bunnyRoutes.map((row) => row.distribution.source_key)).size, 1);
	assert.ok(bunnyRoutes.every((row) => row.distribution.correlation === "exclusive_allocation"));
	assert.deepEqual(bunnyRoutes.map((row) => row.distribution.outcome_probability).sort((left, right) => right - left), [0.00174794616326, 0.00174794616326, 0.000582648721086, 0.000582648721086, 0.000582648721086]);
	assert.deepEqual(Object.fromEntries(fixture.planned_items.filter((item) => item.set === "mpaladin").map((item) => [item.item_id, item.routes.find((route) => route.availability === "permanent").token_quantity])), {
		mpalhelmet: 7, mpalarmor: 12, mpalpants: 11, mpalgloves: 8, mpalboots: 15,
	});
});

test("shared-drop completion treats slot alternatives as OR and five slots as AND", () => {
	const share = 1 / 7;
	const encounterEffort = 208268432.619;
	const row = (item_id, slot) => ({
		item_id,
		availability: "permanent",
		selected_effort: encounterEffort / share,
		distribution: { source_key: "reviewed:holiday", outcome_probability: share, encounter_effort: encounterEffort },
		allocation: { kind: "drop_redistribution", source_table: "reviewed", source_route_id: "holiday", source_share: share },
		slot,
	});
	const holiday = functionalCompletionEffort({
		helmet: [row("xmashat", "helmet")],
		chest: [row("xmassweater", "chest"), row("sweaterhs", "chest")],
		pants: [row("xmaspants", "pants")],
		gloves: [row("mittens", "gloves"), row("supermittens", "gloves")],
		shoes: [row("xmasshoes", "shoes")],
	});
	assert.equal(holiday, 2808152699.81);
});

test("shared-source completion preserves independent direct outcomes and real source-event keys", () => {
	const independent = functionalCompletionEffort({
		helm: [{ item_id: "helm", availability: "permanent", selected_effort: 2, distribution: { source_key: "monster:test", correlation: "source_entry", outcome_probability: 0.5, encounter_effort: 1, source_event_components: [{ event_key: "monster:test:entry:0", outcome_probability: 0.5 }] } }],
		boots: [{ item_id: "boots", availability: "permanent", selected_effort: 2, distribution: { source_key: "monster:test", correlation: "source_entry", outcome_probability: 0.5, encounter_effort: 1, source_event_components: [{ event_key: "monster:test:entry:1", outcome_probability: 0.5 }] } }],
	});
	assert.equal(independent, 2.66666666667);
	const fixture = loadEquipmentFixture("equipment-acquisition-ranking.json");
	const wanderers = fixture.ladders.armor_set_details.wanderers;
	const shared = [wanderers.slots.helmet[0], wanderers.slots.shoes[0]];
	assert.equal(shared[0].distribution.source_key, shared[1].distribution.source_key);
	assert.deepEqual(shared.flatMap((row) => row.distribution.source_event_components.map((component) => component.event_key)).sort(), [
		"design/drops.js:drops.maps.main:map:main:monster:scorpion:entry:4",
		"design/drops.js:drops.maps.main:map:main:monster:scorpion:entry:5",
	]);
});

test("degenerate ladders use their legal combined category rather than the global non-weapon population", () => {
	const fixture = loadEquipmentFixture("equipment-acquisition-ranking.json");
	for (const [ladderId, ladder] of Object.entries(fixture.ladders.standalone_armor)) {
		if (ladder.length !== 1) continue;
		const weight = ladderId.split(".")[0];
		const combined = fixture.rows.filter((row) => row.ladder_id.startsWith(`standalone:${weight}.`));
		const expected = assignPercentiles(combined.map((row) => ({ item_id: row.item_id, effort: row.selected_effort })));
		assert.equal(ladder[0].percentile, expected.find((row) => row.item_id === ladder[0].item_id).percentile, ladderId);
	}
	for (const [profile, ladder] of Object.entries(fixture.ladders.offhands)) {
		if (ladder.length !== 1) continue;
		const expected = assignPercentiles(Object.values(fixture.ladders.offhands).flat().map((row) => ({ item_id: row.item_id, effort: row.selected_effort })));
		assert.equal(ladder[0].percentile, expected.find((row) => row.item_id === ladder[0].item_id).percentile, profile);
	}
	const capes = Object.values(fixture.ladders.capes).flat();
	const angel = capes.find((row) => row.item_id === "angelwings");
	assert.equal(angel.percentile, assignPercentiles(capes.map((row) => ({ item_id: row.item_id, effort: row.selected_effort }))).find((row) => row.item_id === "angelwings").percentile);
});
