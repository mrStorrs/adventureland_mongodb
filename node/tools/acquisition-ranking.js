"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { loadBenchmarkData, stableJson } = require("./progression-benchmark");
const crypto = require("node:crypto");

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function canonicalize(value) {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalJson(value) {
	return JSON.stringify(canonicalize(value));
}

function sha256(value) {
	return crypto.createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");
}

function canonicalSha256(value) {
	return crypto.createHash("sha256").update(typeof value === "string" ? value : canonicalJson(value)).digest("hex");
}

function assignPercentiles(rows, { threshold = 0.05, combinedPercentile = null } = {}) {
	if (!(threshold >= 0 && threshold < 1)) throw new Error("Acquisition rank threshold must be in [0, 1)");
	const ordered = [...rows].map((row) => ({ ...row })).sort((left, right) => Number(left.effort) - Number(right.effort) || String(left.item_id).localeCompare(String(right.item_id)));
	let start = 0;
	while (start < ordered.length) {
		let end = start + 1;
		while (end < ordered.length && ordered[end].effort <= ordered[start].effort * (1 + threshold)) end += 1;
		const percentile = ordered.length === 1 ? (combinedPercentile === null ? 0.5 : combinedPercentile) : ((start + end - 1) / 2) / (ordered.length - 1);
		for (let index = start; index < end; index += 1) ordered[index].percentile = percentile;
		start = end;
	}
	return ordered;
}

const DESIGN_DIRECTORY = path.resolve(__dirname, "../../design");
const SERVER_PATH = path.resolve(__dirname, "../server.js");
const SERVER_FUNCTIONS_PATH = path.resolve(__dirname, "../server_functions.js");
const REPOSITORY_ROOT = path.resolve(__dirname, "../..");
const FORBIDDEN_DROP_TABLES = Object.freeze(["glitch", "lglitch"]);
const YEAR_SECONDS = 365 * 24 * 60 * 60;
const FORMULAS = Object.freeze({
	effective_probability: "product(direct independent probabilities and conditional nested weights)",
	physical_survival: "hp / damageMultiplier(armor) / max((1-evasion/100)*(1-avoidance/100), 0.01)",
	magical_survival: "hp / damageMultiplier(resistance) / max(1-avoidance/100, 0.01)",
	effective_durability: "min(physical_survival, magical_survival)",
	offensive_pressure: "max(1, attack*frequency) * max(1, difficulty||1) * (1 + max(apiercing||0, rpiercing||0)/1000)",
	progression_access_multiplier: "max(1, encounter_units)",
	mean_respawn_ms: "respawn>200 ? respawn*960 : respawn*1000+450",
	monster_route_effort: "((encounter_units + wait_units) / effective_probability) * availability_multiplier * progression_access_multiplier",
	economic_route_effort: "gold_units + sum(quantity * recursively_selected_input_effort)",
});

function median(values) {
	if (!values.length) throw new Error("Cannot calculate a median from an empty population");
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function roundEvidence(value) {
	if (!Number.isFinite(value)) return value;
	return Number(value.toPrecision(12));
}

function loadVmSources(files, context = {}) {
	const sandbox = {
		Math,
		ceil: Math.ceil,
		console: { log() {}, error() {} },
		max: Math.max,
		min: Math.min,
		multipliers: { shells_to_gold: 1 },
		round: Math.round,
		...context,
	};
	vm.createContext(sandbox);
	for (const filename of files) {
		const absolute = path.resolve(DESIGN_DIRECTORY, filename);
		vm.runInContext(fs.readFileSync(absolute, "utf8"), sandbox, { filename: absolute, timeout: 250 });
	}
	return sandbox;
}

function loadSourceData() {
	const data = loadBenchmarkData();
	const source = loadVmSources(["character.js", "maps.js", "monsters.js", "npcs.js", "recipes.js", "tokens.js", "drops.js", "upgrades.js", "events.js"], {
		items: data.items,
	});
	return {
		...data,
		character: clone(source.character),
		compounds: clone(source.compounds),
		craft: clone(source.craft),
		drops: clone(source.drops),
		events: clone(source.events),
		maps: clone(source.maps),
		monsterGold: clone(source.monster_gold),
		monsters: clone(source.monsters),
		npcs: clone(source.npcs),
		tokens: clone(source.tokens),
		upgrades: clone(source.upgrades),
	};
}

function isDynamicPack(pack) {
	return Boolean(pack.special || pack.stype === "randomrespawn");
}

function activePopulationByMonster(data, { normalOnly = true } = {}) {
	const populations = new Map();
	for (const [mapId, mapDefinition] of Object.entries(data.maps)) {
		if (mapDefinition.ignore) continue;
		if (normalOnly && (mapDefinition.instance || mapDefinition.event)) continue;
		for (const pack of mapDefinition.monsters || []) {
			if (normalOnly && isDynamicPack(pack)) continue;
			const count = Number(pack.count || 0);
			if (!(count > 0) || !data.monsters[pack.type]) continue;
			populations.set(pack.type, (populations.get(pack.type) || 0) + count);
		}
	}
	return populations;
}

function mapPopulationByMonster(data, mapId, { normalOnly = true } = {}) {
	const map = data.maps[mapId];
	const populations = new Map();
	if (!map || map.ignore || (normalOnly && (map.instance || map.event))) return populations;
	for (const pack of map.monsters || []) {
		if (normalOnly && isDynamicPack(pack)) continue;
		const count = Number(pack.count || 0);
		if (!(count > 0) || !data.monsters[pack.type]) continue;
		populations.set(pack.type, (populations.get(pack.type) || 0) + count);
	}
	return populations;
}

function isPermanentNormalMonster(monster, population) {
	return Boolean(
		monster &&
		population > 0 &&
		Number(monster.hp) > 0 &&
		Number(monster.xp) > 0 &&
		Number(monster.attack) > 0 &&
		Number(monster.respawn) >= 0 &&
		!monster.special &&
		!monster.operator &&
		!monster.rbuff &&
		!monster.event &&
		!monster.raid &&
		!monster.boss &&
		!monster.hide &&
		!monster.respawn_as &&
		!monster.immune
	);
}

function rawMonsterDurability(monster, damageMultiplier) {
	const avoidance = Math.max(0.01, 1 - Number(monster.avoidance || 0) / 100);
	const physicalHit = Math.max(0.01, (1 - Number(monster.evasion || 0) / 100) * avoidance);
	const physical = Number(monster.hp) / damageMultiplier(Number(monster.armor || 0)) / physicalHit;
	const magical = Number(monster.hp) / damageMultiplier(Number(monster.resistance || 0)) / avoidance;
	return Math.min(physical, magical);
}

function rawMonsterOffense(monster) {
	return (
		Math.max(1, Number(monster.attack || 0) * Number(monster.frequency || 0)) *
		Math.max(1, Number(monster.difficulty || 1)) *
		(1 + Math.max(Number(monster.apiercing || 0), Number(monster.rpiercing || 0), 0) / 1000)
	);
}

function meanRespawnMs(respawn) {
	if (!Number.isFinite(Number(respawn)) || Number(respawn) < 0) throw new Error(`Invalid normal respawn ${respawn}`);
	return Number(respawn) > 200 ? Number(respawn) * 960 : Number(respawn) * 1000 + 450;
}

function normalizationMedians(data) {
	const population = activePopulationByMonster(data);
	const rows = Object.entries(data.monsters)
		.filter(([monsterId, monster]) => isPermanentNormalMonster(monster, population.get(monsterId) || 0))
		.map(([monsterId, monster]) => ({
			monster_id: monsterId,
			durability: rawMonsterDurability(monster, data.damageMultiplier),
			offense: rawMonsterOffense(monster),
			wait: meanRespawnMs(monster.respawn) / population.get(monsterId),
			gold: Number(data.monsterGold[monsterId] || 0),
		}));
	if (!rows.length || rows.some((row) => !(row.durability > 0 && row.offense > 0 && row.wait > 0 && row.gold > 0)))
		throw new Error("Permanent normal-monster normalization population is invalid");
	return {
		population_size: rows.length,
		durability: roundEvidence(median(rows.map((row) => row.durability))),
		offense: roundEvidence(median(rows.map((row) => row.offense))),
		wait: roundEvidence(median(rows.map((row) => row.wait))),
		gold: roundEvidence(median(rows.map((row) => row.gold))),
		monster_ids: rows.map((row) => row.monster_id).sort(),
	};
}

function monsterRouteFactors(monster, effectiveProbability, options) {
	if (!(effectiveProbability > 0 && effectiveProbability <= 1)) throw new Error(`Invalid effective probability ${effectiveProbability}`);
	const medians = options.medians;
	for (const field of ["durability", "offense", "wait"])
		if (!(Number(medians[field]) > 0)) throw new Error(`Invalid ${field} normalization median`);
	const activePopulation = Number(options.activePopulation);
	if (!(activePopulation > 0)) throw new Error("Monster route requires positive active population evidence");
	const effectiveDurability = rawMonsterDurability(monster, options.damageMultiplier);
	const offensivePressure = rawMonsterOffense(monster);
	const encounterUnits = Math.sqrt((effectiveDurability / medians.durability) * (offensivePressure / medians.offense));
	const progressionAccessMultiplier = Math.max(1, encounterUnits);
	const respawnMs = options.meanRespawnMs === undefined ? meanRespawnMs(monster.respawn) : Number(options.meanRespawnMs);
	if (!(respawnMs > 0)) throw new Error("Monster route requires positive respawn evidence");
	const waitUnits = respawnMs / activePopulation / medians.wait;
	const availabilityMultiplier = Number(options.availabilityMultiplier === undefined ? 1 : options.availabilityMultiplier);
	if (!(availabilityMultiplier > 0)) throw new Error("Monster route requires a positive availability multiplier");
	return {
		effective_probability: roundEvidence(effectiveProbability),
		expected_attempts: roundEvidence(1 / effectiveProbability),
		effective_durability: roundEvidence(effectiveDurability),
		offensive_pressure: roundEvidence(offensivePressure),
		active_population: roundEvidence(activePopulation),
		mean_respawn_ms: roundEvidence(respawnMs),
		encounter_units: roundEvidence(encounterUnits),
		progression_access_multiplier: roundEvidence(progressionAccessMultiplier),
		wait_units: roundEvidence(waitUnits),
		availability_multiplier: roundEvidence(availabilityMultiplier),
		effort: roundEvidence(((encounterUnits + waitUnits) / effectiveProbability) * availabilityMultiplier * progressionAccessMultiplier),
	};
}

function keyedInstanceAccessEvidence(effectiveProbability, population) {
	const probability = Number(effectiveProbability);
	const activePopulation = Number(population);
	if (!(probability > 0 && probability <= 1)) throw new Error(`Invalid keyed-instance probability ${effectiveProbability}`);
	if (!Number.isSafeInteger(activePopulation) || activePopulation <= 0)
		throw new Error(`Invalid keyed-instance population ${population}`);
	const instanceSuccessProbability = probability === 1 ? 1 : -Math.expm1(activePopulation * Math.log1p(-probability));
	return {
		instance_population: activePopulation,
		instance_success_probability: roundEvidence(instanceSuccessProbability),
		expected_instance_attempts: roundEvidence(1 / instanceSuccessProbability),
	};
}

function conditionalTableOutcomes(tableId, tables, items, forbiddenTables, seen, chanceData) {
	if (forbiddenTables.includes(tableId)) return [];
	if (seen.has(tableId)) throw new Error(`Drop-table cycle detected at ${[...seen, tableId].join(" -> ")}`);
	const table = tables[tableId];
	if (!Array.isArray(table) || !table.length) return [];
	const total = table.reduce((sum, entry) => sum + Math.max(0, Number(entry[0] || 0)), 0);
	if (!(total > 0)) throw new Error(`Drop table ${tableId} has no positive weight`);
	const nextSeen = new Set(seen);
	nextSeen.add(tableId);
	return table.flatMap((entry, index) => {
		const probability = Math.max(0, Number(entry[0] || 0)) / total;
		return entryOutcomes(entry, probability, tables, items, forbiddenTables, nextSeen, chanceData).map((outcome) => ({
			...outcome,
			component_path: [`table:${tableId}[${index}]`, ...outcome.component_path],
			drop_tables: [tableId, ...outcome.drop_tables],
		}));
	});
}

function entryOutcomes(entry, probability, tables, items, forbiddenTables, seen = new Set(), chanceData = {}) {
	if (!(probability > 0)) return [];
	if (entry[1] === "open") {
		const tableId = entry[2];
		return conditionalTableOutcomes(tableId, tables, items, forbiddenTables, seen, chanceData).map((outcome) => ({
			...outcome,
			probability: probability * outcome.probability,
			attempt_inputs: (outcome.attempt_inputs || []).map((input) => ({ ...input, quantity: input.quantity * probability })),
		}));
	}
	const itemId = entry[1];
	const definition = items[itemId];
	if (!definition) return [];
	const quantity = definition.s ? Math.max(1, Number(entry[2] || 1)) : 1;
	const outcomes = [
		{
			item_id: itemId,
			probability,
			quantity,
			component_path: [`item:${itemId}`],
			drop_tables: [],
			enhancement_transitions: [],
			attempt_inputs: [],
		},
	];
	if (definition.e && definition.cash === undefined && !definition.p2w) {
		const exchangeTables = definition.upgrade || definition.compound
			? Object.keys(tables)
					.filter((tableId) => tableId.startsWith(itemId) && /^\d+$/.test(tableId.slice(itemId.length)))
					.map((tableId) => ({ table_id: tableId, level: Number(tableId.slice(itemId.length)) }))
					.sort((left, right) => left.level - right.level)
			: [{ table_id: itemId, level: 0 }];
		for (const exchange of exchangeTables) {
			if (!Array.isArray(tables[exchange.table_id]) || forbiddenTables.includes(exchange.table_id) || seen.has(exchange.table_id)) continue;
			const enhancement = expectedEnhancedCopies(definition, exchange.level, chanceData);
			const exchangeCount = quantity / (Number(definition.e) * enhancement.base_copies);
			for (const nested of conditionalTableOutcomes(exchange.table_id, tables, items, forbiddenTables, seen, chanceData)) {
				const exchangeRate = probability * exchangeCount;
				outcomes.push({
					...nested,
					probability: Math.min(1, exchangeRate * nested.probability),
					component_path: [`exchange:${exchange.table_id}`, ...nested.component_path],
					enhancement_transitions: [
						...enhancement.transitions.map((transition) => ({ item_id: itemId, ...transition })),
						...(nested.enhancement_transitions || []),
					],
					attempt_inputs: [
						...enhancement.transitions.map((transition) => ({
							item_id: transition.scroll_item_id,
							purpose: "nested_exchange_scroll",
							quantity: exchangeRate * transition.expected_scroll_copies,
						})),
						...(nested.attempt_inputs || []).map((input) => ({ ...input, quantity: input.quantity * exchangeRate })),
					],
				});
			}
		}
	}
	return outcomes;
}

function independentOutcomes(entries, tables, items, forbiddenTables = FORBIDDEN_DROP_TABLES, chanceData = {}, directMultiplier = 1) {
	if (!(Number.isFinite(Number(directMultiplier)) && Number(directMultiplier) > 0))
		throw new Error(`Invalid direct drop multiplier ${directMultiplier}`);
	return (entries || []).flatMap((entry, index) => {
		const rawProbability = Number(entry[0]);
		if (!Number.isFinite(rawProbability) || rawProbability < 0) throw new Error(`Invalid direct probability at entry ${index}`);
		if (rawProbability === 0) return [];
		const effectiveProbability = Math.min(1, rawProbability * Number(directMultiplier));
		return entryOutcomes(entry, effectiveProbability, tables, items, forbiddenTables, new Set(), chanceData).map((outcome) => ({
			...outcome,
			entry_index: index,
			raw_probability: rawProbability,
			probability_multiplier: Number(directMultiplier),
			component_path: [`entry:${index}`, ...outcome.component_path],
		}));
	});
}

function aggregateOutcomes(outcomes) {
	const grouped = new Map();
	for (const outcome of outcomes) {
		if (!grouped.has(outcome.item_id)) grouped.set(outcome.item_id, []);
		grouped.get(outcome.item_id).push(outcome);
	}
	const result = new Map();
	for (const [itemId, components] of grouped) {
		const perEntry = new Map();
		for (const component of components)
			perEntry.set(component.entry_index, Math.min(1, (perEntry.get(component.entry_index) || 0) + component.probability));
		const probability = 1 - [...perEntry.values()].reduce((product, entryProbability) => product * (1 - entryProbability), 1);
		result.set(itemId, {
			effective_probability: roundEvidence(probability),
			probability_components: components.map((component) => ({
				raw_probability: roundEvidence(component.raw_probability),
				probability_multiplier: roundEvidence(component.probability_multiplier),
				effective_probability: roundEvidence(component.probability),
				quantity: roundEvidence(component.quantity),
				path: component.component_path.join(" > "),
				enhancement_transitions: component.enhancement_transitions || [],
			})),
			drop_tables: [...new Set(components.flatMap((component) => component.drop_tables))].sort(),
			attempt_inputs: Object.values(
				components
					.flatMap((component) => component.attempt_inputs || [])
					.reduce((inputs, input) => {
						const key = `${input.purpose}:${input.item_id}`;
						if (!inputs[key]) inputs[key] = { item_id: input.item_id, purpose: input.purpose, quantity: 0 };
						inputs[key].quantity += Number(input.quantity);
						return inputs;
					}, {}),
			).map((input) => ({ ...input, quantity: roundEvidence(input.quantity) })),
		});
	}
	return result;
}

function acquisitionOutcomes(entries, data, evidence, directMultiplier = 1) {
	const outcomes = independentOutcomes(entries, data.drops, data.items, [], data, directMultiplier).filter((outcome) => {
		const forbiddenTables = outcome.drop_tables.filter((tableId) => FORBIDDEN_DROP_TABLES.includes(tableId));
		if (!forbiddenTables.length) return true;
		const allowedTables = evidence.policy.forbidden_drop_table_weapon_exceptions?.[outcome.item_id] || [];
		return forbiddenTables.every((tableId) => allowedTables.includes(tableId));
	});
	return aggregateOutcomes(outcomes);
}

function dropOutcomeProbability(entries, targetItemId, tables, options = {}) {
	const items = options.items || Object.fromEntries(
		[...new Set([targetItemId, ...Object.values(tables).flatMap((table) => table.map((entry) => entry[1]))])].map((itemId) => [itemId, {}]),
	);
	const aggregated = aggregateOutcomes(
		independentOutcomes(
			entries,
			tables,
			items,
			options.forbiddenTables || FORBIDDEN_DROP_TABLES,
			options.chanceData || {},
			options.directMultiplier === undefined ? 1 : options.directMultiplier,
		),
	);
	return aggregated.get(targetItemId)?.effective_probability || 0;
}

function extractBlock(source, openingIndex) {
	const brace = source.indexOf("{", openingIndex);
	if (brace < 0) return "";
	let depth = 0;
	for (let index = brace; index < source.length; index += 1) {
		if (source[index] === "{") depth += 1;
		else if (source[index] === "}") {
			depth -= 1;
			if (depth === 0) return source.slice(brace + 1, index);
		}
	}
	throw new Error("Unterminated runtime event block");
}

function safeNumberExpression(expression) {
	const compact = expression.trim();
	if (!/^[0-9eE+*/().\s-]+$/.test(compact)) throw new Error(`Unsafe numeric event-drop expression ${compact}`);
	const value = vm.runInNewContext(compact, Object.create(null), { timeout: 50 });
	if (!(Number.isFinite(value) && value > 0)) throw new Error(`Invalid event-drop probability ${compact}`);
	return value;
}

function runtimeEventDropRoots(data, source) {
	const roots = [];
	for (const [eventId, eventDefinition] of Object.entries(data.events)) {
		const marker = `if (events.${eventId})`;
		const openingIndex = source.indexOf(marker);
		if (openingIndex < 0) continue;
		const block = extractBlock(source, openingIndex);
		const entries = [];
		const expression = /D\.drops\.maps\.global\.push\(\[([^,]+),\s*"([^"]+)"(?:,\s*"([^"]+)")?\]\);/g;
		let match;
		while ((match = expression.exec(block))) {
			const probability = safeNumberExpression(match[1]);
			entries.push(match[2] === "open" ? [probability, "open", match[3]] : [probability, match[2]]);
		}
		if (!entries.length) continue;
		roots.push({
			route_id: `event:${eventId}`,
			event_id: eventId,
			entries,
			duration_seconds: Number(eventDefinition.duration),
			source_artifact: "node/server_functions.js",
			source_field: marker,
		});
	}
	return roots;
}

function exactFailureBucketProbability(probability) {
	if (!(Number.isFinite(probability) && probability > 0 && probability < 1))
		throw new Error(`Invalid exact-failure probability ${probability}`);
	const bucketEnd = Math.min(1, (Math.floor(probability * 10000) + 1) / 10000);
	return roundEvidence(Math.max(0, bucketEnd - probability));
}

function scheduledEventFrequency(sources, eventId, eventType) {
	if (!["daily", "nightly"].includes(eventType)) return 1;
	const plural = eventType === "daily" ? "dailies" : "nightlies";
	const server = sources["node/server.js"];
	const poolMatch = server.match(new RegExp(`var ${plural} = \\[([^\\]]+)\\]`));
	const scheduleMatch = server.match(new RegExp(`${plural}: \\[([^\\]]+)\\]`));
	if (!poolMatch || !scheduleMatch) throw new Error(`Runtime ${eventType} schedule evidence drifted`);
	const pool = [...poolMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
	const scheduleSlots = scheduleMatch[1].split(",").map((value) => Number(value.trim())).filter(Number.isFinite);
	if (!pool.includes(eventId) || !pool.length || !scheduleSlots.length) throw new Error(`Runtime schedule omits ${eventId}`);
	return scheduleSlots.length / pool.length;
}

function runtimeEventExchangeRewardRoots(data, sources) {
	const source = sources["node/server_functions.js"];
	const roots = [];
	for (const [eventId, event] of Object.entries(data.events)) {
		const marker = `if (events.${eventId})`;
		const markerIndex = source.indexOf(marker);
		if (markerIndex < 0) continue;
		const block = extractBlock(source, markerIndex);
		if (!block.includes("exchange(player, table)")) continue;
		const tableIds = [...new Set([...block.matchAll(/(?:var\s+)?table\s*=\s*"([^"]+)"/g)].map((match) => match[1]))].sort();
		if (!tableIds.length) throw new Error(`Runtime event exchange ${eventId} has no source tables`);
		const eventFrequency = scheduledEventFrequency(sources, eventId, event.type);
		const eventMultiplier = (24 * 60 * 60) / (Number(event.duration) * eventFrequency);
		const rootsByItem = new Map();
		for (const tableId of tableIds) {
			const table = data.drops[tableId];
			if (!Array.isArray(table) || !table.length) throw new Error(`Runtime event exchange table ${tableId} is missing`);
			const totalWeight = table.reduce((sum, entry) => sum + Math.max(0, Number(entry[0] || 0)), 0);
			if (!(totalWeight > 0)) throw new Error(`Runtime event exchange table ${tableId} has no positive weight`);
			const expectedQuantities = new Map();
			const probabilityComponents = new Map();
			for (const [entryIndex, entry] of table.entries()) {
				const weight = Math.max(0, Number(entry[0] || 0));
				const itemId = entry[1];
				if (!(weight > 0) || !data.items[itemId]) continue;
				const probability = weight / totalWeight;
				const quantity = data.items[itemId].s ? Math.max(1, Number(entry[2] || 1)) : 1;
				expectedQuantities.set(itemId, (expectedQuantities.get(itemId) || 0) + probability * quantity);
				if (!probabilityComponents.has(itemId)) probabilityComponents.set(itemId, []);
				probabilityComponents.get(itemId).push({
					path: `table:${tableId}[${entryIndex}] > item:${itemId}`,
					raw_weight: weight,
					effective_probability: roundEvidence(probability),
					quantity,
				});
			}
			const outcomeId = tableId === eventId ? "winner" : tableId.startsWith(`${eventId}_`) ? tableId.slice(eventId.length + 1) : tableId;
			for (const [itemId, expectedQuantity] of expectedQuantities) {
				if (!data.tokens[itemId] && data.items[itemId].type !== "weapon") continue;
				if (!rootsByItem.has(itemId)) {
					rootsByItem.set(itemId, {
						route_id: `runtime:${eventId}:${itemId}`,
						route_model: "event_exchange",
						item_id: itemId,
						event_id: eventId,
						default_event_frequency: eventFrequency,
						default_multiplier: eventMultiplier,
						source_artifact: "node/server_functions.js",
						source_field: `${marker} selects an outcome table then calls exchange(player, table)`,
						runtime_conditions: [
							`join and complete the ${eventId} event with inventory space`,
							"receive one normalized exchange roll from the mutually exclusive outcome table",
						],
						outcome_components: [],
					});
				}
				rootsByItem.get(itemId).outcome_components.push({
					route_id: `runtime:${eventId}:${outcomeId}:${itemId}`,
					outcome_id: outcomeId,
					drop_table_id: tableId,
					availability_condition: `event:${eventId}:${outcomeId}`,
					default_outcome_probability: 1 / tableIds.length,
					expected_quantity: roundEvidence(expectedQuantity),
					probability_components: probabilityComponents.get(itemId),
					source_field: `${marker} selects ${tableId} then exchange(player, table)`,
				});
			}
		}
		for (const root of rootsByItem.values()) {
			for (const tableId of tableIds) {
				if (root.outcome_components.some((component) => component.drop_table_id === tableId)) continue;
				const outcomeId = tableId === eventId ? "winner" : tableId.startsWith(`${eventId}_`) ? tableId.slice(eventId.length + 1) : tableId;
				root.outcome_components.push({
					route_id: `runtime:${eventId}:${outcomeId}:${root.item_id}`,
					outcome_id: outcomeId,
					drop_table_id: tableId,
					availability_condition: `event:${eventId}:${outcomeId}`,
					default_outcome_probability: 1 / tableIds.length,
					expected_quantity: 0,
					probability_components: [],
					source_field: `${marker} selects ${tableId} then exchange(player, table)`,
				});
			}
			root.outcome_components.sort((left, right) => left.outcome_id.localeCompare(right.outcome_id));
			roots.push(root);
		}
	}
	return roots.sort((left, right) => left.route_id.localeCompare(right.route_id));
}

function runtimeRewardRoots(data, sources) {
	const essenceItemId = "sword";
	const essenceGrade = calculateItemGrade(data.items[essenceItemId], 0);
	const essenceUpgradeProbability = Number(data.upgrades[essenceGrade]?.[1]);
	const essenceProbability = exactFailureBucketProbability(essenceUpgradeProbability);
	const roots = [];
	for (const definition of [
		{
			route_model: "attempt_reward",
			item_id: "essenceofgreed",
			marker: 'add_item(player, "essenceofgreed")',
			probability: essenceProbability,
			default_multiplier: 1,
			source_artifact: "node/server.js",
			attempt_inputs: [
				{ item_id: essenceItemId, quantity: 1 },
				{ item_id: `scroll${essenceGrade}`, quantity: 1 },
			],
			runtime_conditions: [
				`upgrade ${essenceItemId} from +0 with grade-${essenceGrade} scroll`,
				`failure roll falls in the same four-decimal bucket as probability ${essenceUpgradeProbability}`,
				"player has one empty inventory slot",
			],
		},
		{
			route_model: "global_static",
			item_id: "pvptoken",
			marker: 'D.drops.maps.global_static.push([1.0 / ((gameplay == "hardcore" && 1000) || 100000), "pvptoken"])',
			probability: 1 / 100000,
			default_multiplier: 1,
			source_artifact: "node/server_functions.js",
			runtime_conditions: ["PvP map/server context", "normal gameplay probability branch"],
		},
		{
			route_model: "hunt",
			item_id: "monstertoken",
			marker: 'add_item(player, "monstertoken", { log: true, q: (gameplay == "hardcore" && 100) || 1 })',
			probability: 1 / 500,
			default_attempts: 500,
			default_multiplier: 1,
			source_artifact: "node/server.js",
			runtime_conditions: [
				"complete the assigned monster hunt within its timer",
				"normal hunt count is clamped to the published 1..500 range",
				"neutral evidence uses the conservative 500-kill bound because the selected live monster is runtime state",
			],
		},
	]) {
		if (!data.items[definition.item_id] || !sources[definition.source_artifact].includes(definition.marker))
			throw new Error(`Runtime reward evidence for ${definition.item_id} drifted`);
		roots.push({
			route_id: `runtime:${definition.item_id}`,
			route_model: definition.route_model,
			item_id: definition.item_id,
			default_effective_probability: definition.probability,
			default_expected_attempts: definition.default_attempts,
			default_multiplier: definition.default_multiplier,
			source_artifact: definition.source_artifact,
			source_field: definition.marker,
			attempt_inputs: definition.attempt_inputs || [],
			runtime_conditions: definition.runtime_conditions,
		});
	}
	return [...roots, ...runtimeEventExchangeRewardRoots(data, sources)];
}

function runtimeMonsterMutationRoots(data, source) {
	return [
		{ event_id: "halloween", monster_id: "jr", respawn: 480 },
		{ event_id: "halloween", monster_id: "greenjr", respawn: 480 },
	].map((definition) => {
		const marker = `G.monsters.${definition.monster_id}.respawn = ${definition.respawn};`;
		if (!source.includes(marker) || !data.monsters[definition.monster_id] || !data.drops.monsters[definition.monster_id])
			throw new Error(`Runtime monster mutation evidence drifted for ${definition.monster_id}`);
		return {
			route_id: `event-monster:${definition.event_id}:${definition.monster_id}`,
			event_id: definition.event_id,
			availability_condition: `season:${definition.event_id}`,
			monster_id: definition.monster_id,
			respawn: definition.respawn,
			source_artifact: "node/server_functions.js",
			source_field: marker,
		};
	});
}

function runtimeDynamicMonsterRoots(data, sources) {
	const server = sources["node/server.js"];
	const functions = sources["node/server_functions.js"];
	const dailySeconds = 24 * 60 * 60;
	const seasonal = [
		["halloween", "mrpumpkin"],
		["halloween", "mrgreen"],
		["halloween", "slenderman"],
		["holidayseason", "grinch"],
		["holidayseason", "snowman"],
		["lunarnewyear", "dragold"],
		["valentines", "pinkgoo"],
		["egghunt", "wabbit"],
	].map(([eventId, monsterId]) => ({
		route_id: `monster:${monsterId}`,
		event_id: eventId,
		availability_condition: `season:${eventId}`,
		monster_id: monsterId,
		default_multiplier: YEAR_SECONDS / Number(data.events[eventId]?.duration),
		default_active_population: 1,
		default_mean_respawn_ms: meanRespawnMs(data.monsters[monsterId]?.respawn),
		source_artifact: "node/server_functions.js",
		source_field: `["${eventId}", "${monsterId}"] in eventmap`,
		markers: [`["${eventId}", "${monsterId}"`],
	}));
	const scheduled = [
		["crabxx", "event:crabxx"],
		["franky", "event:franky"],
		["icegolem", "event:icegolem"],
	].map(([monsterId, availabilityCondition]) => ({
		route_id: `monster:${monsterId}`,
		event_id: monsterId,
		availability_condition: availabilityCondition,
		monster_id: monsterId,
		default_multiplier: dailySeconds / (
			Number(data.events[monsterId]?.duration) * scheduledEventFrequency(sources, monsterId, data.events[monsterId]?.type)
		),
		default_active_population: 1,
		default_mean_respawn_ms: Number(data.events[monsterId]?.duration) * 1000,
		source_artifact: "node/server_functions.js",
		source_field: `["crabxx", "franky", "icegolem"] scheduled event loop`,
		markers: ['["crabxx", "franky", "icegolem"]', `spawn_special_monster(name)`],
	}));
	const counterSpawned = [
		["goldenbat", "bat", Number(data.monsters.goldenbat?.explanation?.match(/[\d,]+/)?.[0]?.replaceAll(",", "")) || 80000],
		["goldenbot", "targetron + stats.kills.sparkbot", 100000],
		["cutebee", "bee", Number(data.monsters.cutebee?.explanation?.match(/[\d,]+/)?.[0]?.replaceAll(",", "")) || 480000],
	].map(([monsterId, counter, multiplier]) => ({
		route_id: `monster:${monsterId}`,
		availability_condition: `spawn-counter:${monsterId}`,
		monster_id: monsterId,
		default_multiplier: multiplier,
		default_active_population: 1,
		default_mean_respawn_ms: meanRespawnMs(0),
		source_artifact: "node/server_functions.js",
		source_field: `kill counter spawns ${monsterId}`,
		markers: [`stats.kills.${counter}`, `spawn_special_monster("${monsterId}")`],
	}));
	const roots = [
		...seasonal,
		...scheduled,
		...counterSpawned,
		{
			route_id: "monster:rgoo",
			event_id: "goobrawl",
			availability_condition: "event:goobrawl",
			monster_id: "rgoo",
			default_multiplier: dailySeconds / (
				Number(data.events.goobrawl?.duration) * scheduledEventFrequency(sources, "goobrawl", data.events.goobrawl?.type)
			),
			default_active_population: 1,
			default_mean_respawn_ms: Number(data.events.goobrawl?.duration) * 1000,
			source_artifact: "node/server_functions.js",
			source_field: 'goobrawl assigns data.type = "rgoo"',
			markers: ["if (events.goobrawl)", 'data.type = "rgoo"'],
		},
		{
			route_id: "runtime-monster:snowman-offseason",
			availability_condition: "outside-season:holidayseason",
			monster_id: "snowman",
			default_multiplier: YEAR_SECONDS / (YEAR_SECONDS - Number(data.events.holidayseason?.duration)),
			default_active_population: 1,
			default_mean_respawn_ms: 20 * 60 * 60 * 1000,
			source_artifact: "node/server_functions.js",
			source_field: "off-season snowman 20-hour timer",
			markers: ["if (!events.holidayseason && events.snowman", "future_s(events.snowman * 60)", 'spawn_special_monster("snowman")'],
			server_markers: ["snowman: 20 * 60"],
		},
	];
	for (const root of roots) {
		if (!isIntendedMonsterSource(root.monster_id, data.monsters[root.monster_id]) || !(Number(data.monsters[root.monster_id].xp) > 0))
			throw new Error(`Runtime dynamic monster ${root.monster_id} is not an intended combat encounter`);
		for (const marker of root.markers || [])
			if (!functions.includes(marker)) throw new Error(`Runtime dynamic monster evidence drifted for ${root.route_id}`);
		for (const marker of root.server_markers || [])
			if (!server.includes(marker)) throw new Error(`Runtime dynamic monster schedule drifted for ${root.route_id}`);
		for (const field of ["default_multiplier", "default_active_population", "default_mean_respawn_ms"])
			if (!(Number.isFinite(root[field]) && root[field] > 0)) throw new Error(`Runtime dynamic monster ${root.route_id} has invalid ${field}`);
		delete root.markers;
		delete root.server_markers;
	}
	return roots;
}

function loadRuntimeSnapshot(data) {
	const sources = {
		"node/server.js": fs.readFileSync(SERVER_PATH, "utf8"),
		"node/server_functions.js": fs.readFileSync(SERVER_FUNCTIONS_PATH, "utf8"),
	};
	const homeServerDropMarker = "D.drops.monsters_home_server[monster.type]";
	if (!sources["node/server.js"].includes(homeServerDropMarker))
		throw new Error("Home-server monster drop runtime evidence drifted");
	return {
		dynamic_monster_roots: runtimeDynamicMonsterRoots(data, sources),
		event_drop_roots: runtimeEventDropRoots(data, sources["node/server_functions.js"]),
		monster_mutation_roots: runtimeMonsterMutationRoots(data, sources["node/server_functions.js"]),
		reward_roots: runtimeRewardRoots(data, sources),
		home_server_drop_evidence: {
			source_artifact: "node/server.js",
			source_field: homeServerDropMarker,
			availability_condition: "home-server:player",
		},
		source_hashes: Object.fromEntries(Object.entries(sources).map(([filename, source]) => [filename, sha256(source)])),
	};
}

function validateAvailabilityOverrides(overrides, routeIds, sourceArtifactHashes = {}) {
	const seen = new Set();
	for (const override of overrides || []) {
		if (!override || typeof override.route_id !== "string" || !override.route_id) throw new Error("Availability override is missing route_id");
		if (seen.has(override.route_id)) throw new Error(`Duplicate availability override ${override.route_id}`);
		seen.add(override.route_id);
		for (const field of ["multiplier", "active_population", "mean_respawn_ms", "effective_probability", "expected_attempts", "outcome_probability"]) {
			if (!(field in override)) continue;
			if (typeof override[field] !== "number" || !Number.isFinite(override[field]) || !(override[field] > 0))
				throw new Error(`Availability override ${override.route_id} requires a positive finite ${field}`);
		}
		for (const field of ["effective_probability", "outcome_probability"])
			if (field in override && override[field] > 1)
				throw new Error(`Availability override ${override.route_id} requires ${field} at most one`);
		if ("effective_probability" in override && "expected_attempts" in override) {
			const reciprocalError = Math.abs(override.effective_probability * override.expected_attempts - 1);
			if (reciprocalError > 1e-9)
				throw new Error(`Availability override ${override.route_id} has inconsistent effective_probability and expected_attempts`);
		}
		if (!("multiplier" in override)) throw new Error(`Availability override ${override.route_id} requires a positive multiplier`);
		for (const field of ["availability_condition", "reason", "source_artifact", "source_field"])
			if (typeof override[field] !== "string" || !override[field]) throw new Error(`Availability override ${override.route_id} is missing ${field}`);
		for (const forbidden of ["rank", "assigned_requirement", "assigned_dps_target", "solved_attack"])
			if (forbidden in override) throw new Error(`Availability override ${override.route_id} cannot assign ${forbidden}`);
		if (!routeIds.has(override.route_id)) throw new Error(`Orphaned availability override ${override.route_id}`);
		const absoluteSource = path.resolve(REPOSITORY_ROOT, override.source_artifact);
		if (!absoluteSource.startsWith(`${REPOSITORY_ROOT}${path.sep}`) || !fs.existsSync(absoluteSource))
			throw new Error(`Availability override ${override.route_id} has an invalid source artifact`);
		const expectedHash = sourceArtifactHashes[override.source_artifact];
		if (typeof expectedHash !== "string" || sha256(fs.readFileSync(absoluteSource, "utf8")) !== expectedHash)
			throw new Error(`Availability override ${override.route_id} source evidence drifted`);
	}
	return true;
}

function routeOverrideMap(evidence) {
	return new Map((evidence.availability_overrides || []).map((override) => [override.route_id, override]));
}

function needsMonsterOverride(monster, population) {
	return Boolean(
		!monster ||
		!(population > 0) ||
		Number(monster.respawn) < 0 ||
		monster.special ||
		monster.operator ||
		monster.event ||
		monster.raid ||
		monster.boss ||
		monster.respawn_as
	);
}

function dynamicMonsterRoots(data, runtimeSnapshot) {
	const roots = new Map(runtimeSnapshot.dynamic_monster_roots.map((root) => [root.route_id, clone(root)]));
	for (const [mapId, map] of Object.entries(data.maps)) {
		if (map.ignore || map.instance) continue;
		for (const pack of map.monsters || []) {
			const monster = data.monsters[pack.type];
			if (
				!(Number(pack.count || 0) > 0) ||
				!(isDynamicPack(pack) || needsMonsterOverride(monster, Number(pack.count))) ||
				!isIntendedMonsterSource(pack.type, monster) ||
				!(Number(monster.xp) > 0)
			) continue;
			const routeId = `monster:${pack.type}`;
			if (roots.has(routeId)) continue;
			roots.set(routeId, {
				route_id: routeId,
				availability_condition: isDynamicPack(pack) ? `spawn-location:${pack.type}` : `persistent-special:${pack.type}`,
				monster_id: pack.type,
				default_multiplier: 1,
				default_active_population: Number(pack.count),
				default_mean_respawn_ms: Number(monster.respawn) < 0 ? meanRespawnMs(0) : meanRespawnMs(monster.respawn),
				source_artifact: "design/maps.js",
				source_field: `maps.${mapId}.monsters[type=${pack.type}] dynamic pack`,
			});
		}
	}
	return [...roots.values()].sort((left, right) => left.route_id.localeCompare(right.route_id));
}

function requiredDynamicMonsterOverrideIds(data = loadSourceData()) {
	const runtimeSnapshot = loadRuntimeSnapshot(data);
	return [...new Set([
		...dynamicMonsterRoots(data, runtimeSnapshot).map((root) => root.route_id),
		...runtimeSnapshot.monster_mutation_roots.map((root) => root.route_id),
	])].sort();
}

function validateRequiredDynamicMonsterOverrides(evidence, data = loadSourceData(), runtimeSnapshot = loadRuntimeSnapshot(data)) {
	const overrides = routeOverrideMap(evidence);
	const dynamicRoots = dynamicMonsterRoots(data, runtimeSnapshot);
	const roots = [
		...dynamicRoots,
		...runtimeSnapshot.monster_mutation_roots,
	];
	const missing = roots.map((root) => root.route_id).filter((routeId) => !overrides.has(routeId)).sort();
	if (missing.length) throw new Error(`Missing availability override for: ${missing.join(", ")}`);
	for (const root of roots) {
		const actual = overrides.get(root.route_id).availability_condition;
		if (actual !== root.availability_condition)
			throw new Error(`Availability override ${root.route_id} condition ${actual} does not match ${root.availability_condition}`);
	}
	return dynamicRoots;
}

function availabilityFactor(override, defaults = {}) {
	const conditionId = override?.availability_condition || defaults.availability_condition;
	if (!conditionId) return null;
	return {
		condition_id: conditionId,
		multiplier: Number(override?.multiplier ?? defaults.default_multiplier ?? 1),
		override_id: override?.route_id,
	};
}

function composeAvailabilityFactors(...factorGroups) {
	const factors = factorGroups.flat().filter(Boolean);
	const seasonal = new Set(factors.map((factor) => factor.condition_id).filter((conditionId) => conditionId.startsWith("season:")));
	if (seasonal.size > 1) return null;
	for (const conditionId of seasonal) {
		const eventId = conditionId.slice("season:".length);
		if (factors.some((factor) => factor.condition_id === `outside-season:${eventId}`)) return null;
	}
	const unique = new Map();
	for (const factor of factors) {
		if (!(Number.isFinite(factor.multiplier) && factor.multiplier > 0))
			throw new Error(`Availability condition ${factor.condition_id} requires a positive multiplier`);
		const existing = unique.get(factor.condition_id);
		if (existing && Math.abs(existing.multiplier - factor.multiplier) > 1e-9)
			throw new Error(`Availability condition ${factor.condition_id} has inconsistent multipliers`);
		if (!existing) unique.set(factor.condition_id, factor);
		else if (!existing.override_id && factor.override_id) unique.set(factor.condition_id, factor);
	}
	const values = [...unique.values()].sort((left, right) => left.condition_id.localeCompare(right.condition_id));
	return {
		availability_condition_ids: values.map((factor) => factor.condition_id),
		availability_multiplier: values.reduce((product, factor) => product * factor.multiplier, 1),
		availability_override_ids: [...new Set(factors.map((factor) => factor.override_id).filter(Boolean))].sort(),
	};
}

function isIntendedMonsterSource(monsterId, monster) {
	return Boolean(monster && !monster.unlist && !monster.hide && !monsterId.startsWith("target_"));
}

function monsterSpecialMechanics(monster) {
	return ["special", "operator", "event", "raid", "boss", "rbuff", "immune", "reflection", "avoidance", "evasion", "apiercing", "rpiercing"]
		.filter((field) => monster[field])
		.sort();
}

function instanceAccessForMap(data, mapId) {
	const accessItems = Object.entries(data.items)
		.filter(([, definition]) => definition.type === "dungeon_key" && definition.opens === mapId)
		.map(([itemId]) => itemId)
		.sort();
	if (!accessItems.length) return null;
	if (accessItems.length !== 1) throw new Error(`Instance ${mapId} requires exactly one published dungeon key`);
	return { map_id: mapId, access_item_id: accessItems[0] };
}

function instanceAccess(data, monsterId) {
	const candidates = Object.entries(data.maps)
		.filter(([, map]) => !map.ignore && map.instance)
		.filter(([, map]) => (map.monsters || []).some((pack) => pack.type === monsterId && Number(pack.count || 0) > 0))
		.map(([mapId]) => instanceAccessForMap(data, mapId))
		.filter(Boolean)
		.sort((left, right) => left.map_id.localeCompare(right.map_id));
	if (!candidates.length) return null;
	if (candidates.length > 1) throw new Error(`Monster ${monsterId} appears in multiple keyed instances: ${candidates.map((candidate) => candidate.map_id).join(", ")}`);
	return candidates[0];
}

function sourceRouteIndex(data, medians, evidence, runtimeSnapshot) {
	const index = new Map();
	const requiredOverrideIds = new Set();
	const overrides = routeOverrideMap(evidence);
	const normalPopulation = activePopulationByMonster(data);
	const allPopulation = activePopulationByMonster(data, { normalOnly: false });
	const encounterCandidates = new Map();
	const keyedEncounters = new Map();
	const dynamicRoots = validateRequiredDynamicMonsterOverrides(evidence, data, runtimeSnapshot);

	function add(itemId, route) {
		if (!index.has(itemId)) index.set(itemId, []);
		index.get(itemId).push(route);
	}

	function addEncounterCandidate(routeId, monsterId, options = {}) {
		if (encounterCandidates.has(routeId)) return;
		const monster = data.monsters[monsterId];
		if (!isIntendedMonsterSource(monsterId, monster) || !(Number(monster.xp) > 0)) return;
		const override = options.override;
		const basePopulation = normalPopulation.get(monsterId) || 0;
		const totalPopulation = allPopulation.get(monsterId) || 0;
		const activePopulation = Number(override?.active_population ?? options.activePopulation ?? (basePopulation || totalPopulation || 1));
		const candidateRespawnMs = Number(
			override?.mean_respawn_ms ??
			options.meanRespawnMs ??
			(options.respawn === undefined
				? Number(monster.respawn) < 0 ? medians.wait : meanRespawnMs(monster.respawn)
				: meanRespawnMs(options.respawn)),
		);
		const access = options.access || (basePopulation > 0 ? null : instanceAccess(data, monsterId));
		const candidateAvailabilityFactor = availabilityFactor(override, options);
		const availability = composeAvailabilityFactors(candidateAvailabilityFactor);
		encounterCandidates.set(routeId, {
			route_id: routeId,
			monster_id: monsterId,
			monster,
			event_id: options.eventId,
			encounter_source_path: options.sourcePath || `design/maps.js:active population for ${monsterId}`,
			active_population: activePopulation,
			mean_respawn_ms: candidateRespawnMs,
			availability_factors: candidateAvailabilityFactor ? [candidateAvailabilityFactor] : [],
			...availability,
			...(access || {}),
		});
	}

	for (const [mapId, map] of Object.entries(data.maps)) {
		if (map.ignore || map.event) continue;
		const perMap = new Map();
		for (const pack of map.monsters || []) {
			const monster = data.monsters[pack.type];
			const count = Number(pack.count || 0);
			if (!(count > 0) || !isIntendedMonsterSource(pack.type, monster) || !(Number(monster.xp) > 0)) continue;
			perMap.set(pack.type, (perMap.get(pack.type) || 0) + count);
		}
		for (const [monsterId, population] of perMap) {
			const monster = data.monsters[monsterId];
			if (map.instance) {
				const access = instanceAccessForMap(data, mapId);
				if (!access) continue;
				keyedEncounters.set(monsterId, { access, activePopulation: population, meanRespawnMs: meanRespawnMs(0), mapId });
				addEncounterCandidate(`monster:${monsterId}`, monsterId, {
					access,
					activePopulation: population,
					meanRespawnMs: meanRespawnMs(0),
					override: overrides.get(`monster:${monsterId}`),
					sourcePath: `design/maps.js:maps.${mapId}.monsters[type=${monsterId}]`,
				});
			} else if (!(map.monsters || []).some((pack) => pack.type === monsterId && (isDynamicPack(pack) || needsMonsterOverride(monster, population)))) {
				addEncounterCandidate(`monster:${monsterId}`, monsterId);
			}
		}
	}
	for (const root of dynamicRoots) {
		const override = overrides.get(root.route_id);
		requiredOverrideIds.add(root.route_id);
		addEncounterCandidate(root.route_id, root.monster_id, {
			availability_condition: root.availability_condition,
			default_multiplier: root.default_multiplier,
			activePopulation: root.default_active_population,
			meanRespawnMs: root.default_mean_respawn_ms,
			eventId: root.event_id,
			override,
			sourcePath: `${root.source_artifact}:${root.source_field}`,
		});
	}
	for (const root of runtimeSnapshot.monster_mutation_roots) {
		const override = overrides.get(root.route_id);
		requiredOverrideIds.add(root.route_id);
		addEncounterCandidate(root.route_id, root.monster_id, {
			availability_condition: root.availability_condition,
			eventId: root.event_id,
			override,
			respawn: root.respawn,
			sourcePath: `${root.source_artifact}:${root.source_field}`,
		});
	}

	function addMonsterRoot(monsterId, entries, sourcePath, options = {}) {
		const monster = data.monsters[monsterId];
		if (!monster) throw new Error(`Drop source references missing monster ${monsterId}`);
		if (!isIntendedMonsterSource(monsterId, monster)) return;
		const routeId = options.routeId || `monster:${monsterId}`;
		const basePopulation = normalPopulation.get(monsterId) || 0;
		const totalPopulation = allPopulation.get(monsterId) || 0;
		const override = options.override || overrides.get(routeId);
		const outcomes = acquisitionOutcomes(entries, data, evidence);
		if (!outcomes.size) return;
		const requiresOverride = Boolean(options.requiresOverride ?? needsMonsterOverride(monster, basePopulation));
		if (requiresOverride) requiredOverrideIds.add(routeId);
		const availability = composeAvailabilityFactors(
			availabilityFactor(override),
			options.availabilityFactors || [],
		);
		if (!availability) return;
		const activePopulation = Number(override?.active_population ?? options.activePopulation ?? (basePopulation || totalPopulation || 1));
		const respawnEvidence = override?.mean_respawn_ms ?? options.meanRespawnMs ?? (Number(monster.respawn) < 0 ? medians.wait : undefined);
		const access = options.access || (basePopulation > 0 ? null : instanceAccess(data, monsterId));
		for (const [itemId, outcome] of outcomes) {
			if (access?.access_item_id === itemId) continue;
			const factors = monsterRouteFactors(monster, outcome.effective_probability, {
				activePopulation,
				availabilityMultiplier: availability.availability_multiplier,
				damageMultiplier: data.damageMultiplier,
				meanRespawnMs: respawnEvidence,
				medians,
			});
			add(itemId, {
				route_id: routeId,
				kind: options.kind || (requiresOverride ? "event_drop" : outcome.drop_tables.length ? "nested_drop" : "monster_drop"),
				source_path: sourcePath,
				encounter_source_path: options.encounterSourcePath,
				availability_source_path: options.availabilitySourcePath,
				event_id: options.eventId,
				monster_id: monsterId,
				runtime_conditions: options.runtimeConditions,
				special_mechanics: monsterSpecialMechanics(monster),
				...(access || {}),
				drop_tables: outcome.drop_tables,
				probability_components: outcome.probability_components,
				attempt_inputs: outcome.attempt_inputs,
				availability_override_id: availability.availability_override_ids.length === 1 ? availability.availability_override_ids[0] : undefined,
				...(availability.availability_override_ids.length ? { availability_override_ids: availability.availability_override_ids } : {}),
				...(availability.availability_condition_ids.length ? { availability_condition_ids: availability.availability_condition_ids } : {}),
				...(access ? keyedInstanceAccessEvidence(outcome.effective_probability, activePopulation) : {}),
				...factors,
			});
		}
	}

	for (const [monsterId, entries] of Object.entries(data.drops.monsters || {})) {
		const sourcePath = `design/drops.js:drops.monsters.${monsterId}`;
		if (normalPopulation.get(monsterId) > 0) addMonsterRoot(monsterId, entries, sourcePath, { requiresOverride: false });
		else if (keyedEncounters.has(monsterId)) {
			const keyed = keyedEncounters.get(monsterId);
			addMonsterRoot(monsterId, entries, sourcePath, {
				access: keyed.access,
				activePopulation: keyed.activePopulation,
				meanRespawnMs: keyed.meanRespawnMs,
				requiresOverride: false,
			});
		}
		for (const root of dynamicRoots.filter((candidate) => candidate.monster_id === monsterId))
			addMonsterRoot(monsterId, entries, `${root.source_artifact}:${root.source_field}`, {
				routeId: root.route_id,
				override: overrides.get(root.route_id),
				activePopulation: root.default_active_population,
				meanRespawnMs: root.default_mean_respawn_ms,
				requiresOverride: true,
			});
	}

	for (const [monsterId, entries] of Object.entries(data.drops.monsters_home_server || {})) {
		const candidates = [...encounterCandidates.values()].filter((candidate) => candidate.monster_id === monsterId);
		for (const candidate of candidates) {
			addMonsterRoot(monsterId, entries, `design/drops.js:drops.monsters_home_server.${monsterId}`, {
				routeId: `home-server:${candidate.route_id}`,
				access: candidate.access_item_id ? { map_id: candidate.map_id, access_item_id: candidate.access_item_id } : undefined,
				activePopulation: candidate.active_population,
				meanRespawnMs: candidate.mean_respawn_ms,
				availabilityFactors: [
					...(candidate.availability_factors || []),
					{ condition_id: runtimeSnapshot.home_server_drop_evidence.availability_condition, multiplier: 1 },
				],
				encounterSourcePath: candidate.encounter_source_path,
				availabilitySourcePath: `${runtimeSnapshot.home_server_drop_evidence.source_artifact}:${runtimeSnapshot.home_server_drop_evidence.source_field}`,
				eventId: candidate.event_id,
				kind: candidate.event_id ? "event_drop" : undefined,
				requiresOverride: false,
				runtimeConditions: ["player.p.home matches the current region and server name"],
			});
		}
	}

	for (const [mapId, entries] of Object.entries(data.drops.maps || {})) {
		if (mapId === "global" || mapId === "global_static") continue;
		const map = data.maps[mapId];
		if (!map || map.ignore) continue;
		const normalMapPopulation = mapPopulationByMonster(data, mapId);
		const allMapPopulation = mapPopulationByMonster(data, mapId, { normalOnly: false });
		for (const [monsterId, totalPopulation] of allMapPopulation) {
			const monster = data.monsters[monsterId];
			if (!isIntendedMonsterSource(monsterId, monster)) continue;
			const routeId = `map:${mapId}:monster:${monsterId}`;
			const normalCount = normalMapPopulation.get(monsterId) || 0;
			const override = overrides.get(routeId) || overrides.get(`monster:${monsterId}`);
			const requiresOverride = Boolean(!map.instance && (map.event || needsMonsterOverride(monster, normalCount)));
			if (requiresOverride) requiredOverrideIds.add(override?.route_id || routeId);
			const outcomes = acquisitionOutcomes(entries, data, evidence, Number(monster.hp) / 1000);
			if (!outcomes.size) continue;
			const population = Number(override?.active_population ?? (normalCount || totalPopulation || 1));
			const access = map.instance ? instanceAccessForMap(data, mapId) : null;
			if (map.instance && !access) continue;
			for (const [itemId, outcome] of outcomes) {
				if (access?.access_item_id === itemId) continue;
				const factors = monsterRouteFactors(monster, outcome.effective_probability, {
					activePopulation: population,
					availabilityMultiplier: override?.multiplier ?? 1,
					damageMultiplier: data.damageMultiplier,
					meanRespawnMs: override?.mean_respawn_ms ?? (map.instance ? meanRespawnMs(0) : Number(monster.respawn) < 0 ? medians.wait : undefined),
					medians,
				});
				add(itemId, {
					route_id: routeId,
					kind: requiresOverride ? "event_drop" : outcome.drop_tables.length ? "nested_drop" : "monster_drop",
					source_path: `design/drops.js:drops.maps.${mapId}`,
					map_id: mapId,
					monster_id: monsterId,
					special_mechanics: monsterSpecialMechanics(monster),
					...(access || {}),
					drop_tables: outcome.drop_tables,
					probability_components: outcome.probability_components,
					attempt_inputs: outcome.attempt_inputs,
					availability_override_id: override?.route_id,
					...(access ? keyedInstanceAccessEvidence(outcome.effective_probability, population) : {}),
					...factors,
				});
			}
		}
	}

	const addGlobalRoutes = ({ entries, routePrefix, sourcePath, eventId, availabilityCondition, defaultMultiplier = 1, override, hpScaled = true }) => {
		for (const candidate of encounterCandidates.values()) {
			const availability = composeAvailabilityFactors(
				candidate.availability_factors || [],
				availabilityFactor(override, { availability_condition: availabilityCondition, default_multiplier: defaultMultiplier }),
			);
			if (!availability) continue;
			const availabilityOverrideIds = [...new Set([
				...(candidate.availability_override_ids || []),
				...(availability.availability_override_ids || []),
			])].sort();
			const monster = candidate.monster;
			const outcomes = acquisitionOutcomes(entries, data, evidence, hpScaled ? Number(monster.hp) / 1000 : 1);
			for (const [itemId, outcome] of outcomes) {
				if (candidate.access_item_id === itemId) continue;
				const factors = monsterRouteFactors(monster, outcome.effective_probability, {
					activePopulation: candidate.active_population,
					availabilityMultiplier: availability.availability_multiplier,
					damageMultiplier: data.damageMultiplier,
					meanRespawnMs: candidate.mean_respawn_ms,
					medians,
				});
				add(itemId, {
					route_id: `${routePrefix}:${candidate.route_id}`,
					kind: eventId ? "event_drop" : outcome.drop_tables.length ? "nested_drop" : "monster_drop",
					source_path: sourcePath,
					encounter_source_path: candidate.encounter_source_path,
					event_id: eventId,
					monster_id: candidate.monster_id,
					special_mechanics: monsterSpecialMechanics(monster),
					...(candidate.map_id ? { map_id: candidate.map_id } : {}),
					...(candidate.access_item_id ? { access_item_id: candidate.access_item_id } : {}),
					drop_tables: outcome.drop_tables,
					probability_components: outcome.probability_components,
					attempt_inputs: outcome.attempt_inputs,
					availability_override_id: availabilityOverrideIds.length === 1 ? availabilityOverrideIds[0] : undefined,
					availability_override_ids: availabilityOverrideIds,
					availability_condition_ids: availability.availability_condition_ids,
					...(candidate.access_item_id ? keyedInstanceAccessEvidence(outcome.effective_probability, candidate.active_population) : {}),
					...factors,
				});
			}
		}
	};

	addGlobalRoutes({
		entries: data.drops.maps.global || [],
		routePrefix: "global",
		sourcePath: "design/drops.js:drops.maps.global",
	});

	for (const root of runtimeSnapshot.event_drop_roots) {
		const override = overrides.get(root.route_id);
		requiredOverrideIds.add(root.route_id);
		addGlobalRoutes({
			entries: root.entries,
			routePrefix: root.route_id,
			sourcePath: `${root.source_artifact}:${root.source_field}`,
			eventId: root.event_id,
			availabilityCondition: `season:${root.event_id}`,
			defaultMultiplier: YEAR_SECONDS / root.duration_seconds,
			override,
		});
	}

	for (const root of runtimeSnapshot.monster_mutation_roots) {
		const override = overrides.get(root.route_id);
		requiredOverrideIds.add(root.route_id);
		const monster = data.monsters[root.monster_id];
		const outcomes = acquisitionOutcomes(data.drops.monsters[root.monster_id], data, evidence);
		for (const [itemId, outcome] of outcomes) {
			const factors = monsterRouteFactors(monster, outcome.effective_probability, {
				activePopulation: override?.active_population ?? normalPopulation.get(root.monster_id),
				availabilityMultiplier: override?.multiplier ?? 1,
				damageMultiplier: data.damageMultiplier,
				meanRespawnMs: override?.mean_respawn_ms ?? meanRespawnMs(root.respawn),
				medians,
			});
			add(itemId, {
				route_id: root.route_id,
				kind: "event_drop",
				source_path: `${root.source_artifact}:${root.source_field}`,
				event_id: root.event_id,
				monster_id: root.monster_id,
				special_mechanics: monsterSpecialMechanics(monster),
				drop_tables: outcome.drop_tables,
				probability_components: outcome.probability_components,
				attempt_inputs: outcome.attempt_inputs,
				availability_override_id: override ? root.route_id : undefined,
				...factors,
			});
		}
	}

	for (const root of runtimeSnapshot.reward_roots) {
		if (root.route_model === "event_exchange") {
			if (!Array.isArray(root.outcome_components) || !root.outcome_components.length)
				throw new Error(`Runtime event exchange ${root.route_id} has no outcome evidence`);
			const outcomeIds = new Set();
			const tableIds = new Set();
			const outcomeComponents = [];
			let totalOutcomeProbability = 0;
			let expectedQuantityPerEvent = 0;
			let multiplier;
			for (const component of root.outcome_components) {
				if (outcomeIds.has(component.outcome_id) || tableIds.has(component.drop_table_id))
					throw new Error(`Runtime event exchange ${root.route_id} has overlapping outcome evidence`);
				outcomeIds.add(component.outcome_id);
				tableIds.add(component.drop_table_id);
				const outcomeOverride = overrides.get(component.route_id);
				requiredOverrideIds.add(component.route_id);
				const outcomeProbability = Number(outcomeOverride?.outcome_probability ?? component.default_outcome_probability);
				const expectedQuantity = Number(component.expected_quantity);
				const outcomeMultiplier = Number(outcomeOverride?.multiplier ?? root.default_multiplier);
				if (!(outcomeProbability > 0 && outcomeProbability <= 1) || !(Number.isFinite(expectedQuantity) && expectedQuantity >= 0))
					throw new Error(`Runtime event exchange ${component.route_id} has invalid outcome evidence`);
				if (!(Number.isFinite(outcomeMultiplier) && outcomeMultiplier > 0))
					throw new Error(`Runtime event exchange ${component.route_id} has invalid availability multiplier`);
				if (outcomeOverride && outcomeOverride.availability_condition !== component.availability_condition)
					throw new Error(`Availability override ${component.route_id} condition does not match ${component.availability_condition}`);
				if (multiplier === undefined) multiplier = outcomeMultiplier;
				else if (Math.abs(multiplier - outcomeMultiplier) > 1e-9)
					throw new Error(`Runtime event exchange ${root.route_id} outcome multipliers disagree`);
				totalOutcomeProbability += outcomeProbability;
				expectedQuantityPerEvent += outcomeProbability * expectedQuantity;
				outcomeComponents.push({
					route_id: component.route_id,
					outcome_id: component.outcome_id,
					drop_table_id: component.drop_table_id,
					outcome_probability: roundEvidence(outcomeProbability),
					expected_quantity_per_exchange: roundEvidence(expectedQuantity),
					weighted_expected_quantity: roundEvidence(outcomeProbability * expectedQuantity),
					probability_components: clone(component.probability_components),
					availability_condition: component.availability_condition,
					availability_override_id: outcomeOverride?.route_id,
					source_field: component.source_field,
				});
			}
			if (Math.abs(totalOutcomeProbability - 1) > 1e-9)
				throw new Error(`Runtime event exchange ${root.route_id} outcome probabilities must form an exhaustive distribution summing to one`);
			if (!(expectedQuantityPerEvent > 0))
				throw new Error(`Runtime event exchange ${root.route_id} has no positive expected reward quantity`);
			const expectedAttempts = 1 / expectedQuantityPerEvent;
			add(root.item_id, {
				route_id: root.route_id,
				kind: "runtime_reward",
				source_path: `${root.source_artifact}:${root.source_field}`,
				event_id: root.event_id,
				drop_tables: [...tableIds].sort(),
				outcome_components: outcomeComponents,
				total_outcome_probability: roundEvidence(totalOutcomeProbability),
				expected_quantity_per_event: roundEvidence(expectedQuantityPerEvent),
				event_frequency_per_day: roundEvidence(root.default_event_frequency),
				event_duration_seconds: Number(data.events[root.event_id].duration),
				expected_attempts: roundEvidence(expectedAttempts),
				availability_multiplier: roundEvidence(multiplier),
				availability_condition_ids: outcomeComponents.map((component) => component.availability_condition).sort(),
				availability_override_ids: outcomeComponents.map((component) => component.availability_override_id).filter(Boolean).sort(),
				runtime_conditions: clone(root.runtime_conditions),
				effort: roundEvidence(expectedAttempts * multiplier),
			});
			continue;
		}
		const override = overrides.get(root.route_id);
		requiredOverrideIds.add(root.route_id);
		const probability = Number(override?.effective_probability ?? root.default_effective_probability);
		const multiplier = Number(override?.multiplier ?? root.default_multiplier);
		if (root.route_model === "global_static") {
			addGlobalRoutes({
				entries: [[probability, root.item_id]],
				routePrefix: root.route_id,
				sourcePath: `${root.source_artifact}:${root.source_field}`,
				availabilityCondition: override?.availability_condition || `runtime:${root.item_id}`,
				defaultMultiplier: multiplier,
				override,
				hpScaled: false,
			});
			continue;
		}
		if (root.route_model === "hunt") {
			const expectedAttempts = Number(override?.expected_attempts ?? root.default_expected_attempts);
			if (!(Number.isFinite(expectedAttempts) && expectedAttempts > 0)) throw new Error("Monster hunt requires positive expected attempts");
			const encounterUnits = 1;
			const waitUnits = 1;
			add(root.item_id, {
				route_id: root.route_id,
				kind: "runtime_reward",
				source_path: `${root.source_artifact}:${root.source_field}`,
				encounter_profile: "permanent_normal_monster_medians",
				effective_probability: roundEvidence(1 / expectedAttempts),
				expected_attempts: roundEvidence(expectedAttempts),
				effective_durability: medians.durability,
				offensive_pressure: medians.offense,
				active_population: 1,
				mean_respawn_ms: medians.wait,
				encounter_units: encounterUnits,
				progression_access_multiplier: 1,
				wait_units: waitUnits,
				availability_multiplier: multiplier,
				availability_override_id: override ? root.route_id : undefined,
				runtime_conditions: clone(root.runtime_conditions),
				effort: roundEvidence((encounterUnits + waitUnits) * expectedAttempts * multiplier),
			});
			continue;
		}
		add(root.item_id, {
			route_id: root.route_id,
			kind: "runtime_reward",
			source_path: `${root.source_artifact}:${root.source_field}`,
			effective_probability: probability,
			expected_attempts: roundEvidence(1 / probability),
			availability_multiplier: multiplier,
			availability_override_id: override ? root.route_id : undefined,
			attempt_inputs: clone(root.attempt_inputs),
			runtime_conditions: clone(root.runtime_conditions),
			effort: roundEvidence(multiplier / probability),
		});
	}

	return { index, requiredOverrideIds };
}

function calculateItemGrade(definition, level = 0) {
	if (!definition || (!definition.upgrade && !definition.compound)) return 0;
	const grades = definition.grades || [9, 10, 11, 12];
	if (level >= grades[3]) return 4;
	if (level >= grades[2]) return 3;
	if (level >= grades[1]) return 2;
	if (level >= grades[0]) return 1;
	return 0;
}

function expectedEnhancedCopies(definition, targetLevel, chanceData) {
	if (!Number.isSafeInteger(targetLevel) || targetLevel < 0) throw new Error(`Invalid requested item level ${targetLevel}`);
	if (!targetLevel) return { base_copies: 1, transitions: [] };
	if (!definition.upgrade && !definition.compound) throw new Error("Requested item level requires upgrade or compound inputs");
	const tableName = definition.compound ? "compounds" : "upgrades";
	const table = chanceData[tableName];
	if (!table) throw new Error(`Missing published ${tableName} probabilities`);
	let expectedCopies = 1;
	const transitions = [];
	for (let level = 1; level <= targetLevel; level += 1) {
		const fromLevel = level - 1;
		const probabilityGrade = definition.compound && fromLevel >= 3
			? calculateItemGrade(definition, fromLevel - 2)
			: calculateItemGrade(definition, 0);
		const scrollGrade = calculateItemGrade(definition, fromLevel);
		const probability = Number(table[probabilityGrade]?.[level]);
		if (!(probability > 0 && probability <= 1)) throw new Error(`Missing ${tableName} success probability for level ${level}`);
		expectedCopies = definition.compound ? (expectedCopies * 3) / probability : expectedCopies / probability;
		transitions.push({
			from_level: fromLevel,
			to_level: level,
			probability_grade: probabilityGrade,
			success_probability: probability,
			expected_input_copies: roundEvidence(expectedCopies),
			scroll_grade: scrollGrade,
			scroll_item_id: `${definition.compound ? "cscroll" : "scroll"}${scrollGrade}`,
			expected_scroll_copies: 0,
			offering_item_id: null,
			expected_offering_copies: 0,
		});
	}
	let demandedOutputs = 1;
	for (let index = transitions.length - 1; index >= 0; index -= 1) {
		const transition = transitions[index];
		const attempts = demandedOutputs / transition.success_probability;
		transition.expected_scroll_copies = roundEvidence(attempts);
		demandedOutputs = attempts * (definition.compound ? 3 : 1);
	}
	return { base_copies: roundEvidence(demandedOutputs), transitions };
}

function assertAcyclicSourceGraph(graph) {
	const active = new Set();
	const complete = new Set();
	function visit(node, pathToNode) {
		if (active.has(node)) throw new Error(`Acquisition source cycle detected: ${[...pathToNode, node].join(" -> ")}`);
		if (complete.has(node)) return;
		active.add(node);
		for (const child of graph[node] || []) visit(child, [...pathToNode, node]);
		active.delete(node);
		complete.add(node);
	}
	for (const node of Object.keys(graph)) visit(node, []);
	return true;
}

function sourceGraph(data) {
	const graph = {};
	for (const [itemId, recipe] of Object.entries(data.craft || {})) graph[itemId] = (recipe.items || []).map((input) => input[1]);
	for (const [tokenId, rewards] of Object.entries(data.tokens || {})) {
		for (const itemId of Object.keys(rewards)) {
			if (!graph[itemId]) graph[itemId] = [];
			graph[itemId].push(tokenId);
		}
	}
	return graph;
}

function activeGoldShopIndex(data, medians) {
	const activeNpcIds = new Set();
	for (const map of Object.values(data.maps)) {
		if (map.ignore) continue;
		for (const npc of map.npcs || []) if (npc.id) activeNpcIds.add(npc.id);
	}
	const index = new Map();
	for (const npcId of [...activeNpcIds].sort()) {
		const npc = data.npcs[npcId];
		if (!npc || npc.role !== "merchant" || npc.ignore) continue;
		for (const itemId of npc.items || []) {
			const item = data.items[itemId];
			if (!item || item.cash !== undefined || item.p2w) continue;
			const goldCost = Number(item.g);
			if (!(Number.isFinite(goldCost) && goldCost >= 0)) throw new Error(`Shop ${npcId} item ${itemId} has invalid gold cost`);
			if (!index.has(itemId)) index.set(itemId, []);
			index.get(itemId).push({
				route_id: `shop:${npcId}`,
				kind: "shop",
				source_path: `design/npcs.js:npcs.${npcId}.items`,
				npc_id: npcId,
				gold_cost: goldCost,
				gold_units: roundEvidence(goldCost / medians.gold),
				effort: roundEvidence(goldCost / medians.gold),
			});
		}
	}
	return index;
}

const ROUTE_RESULT_FIELDS = new Set([
	"kind",
	"drop_tables",
	"probability_components",
	"effective_probability",
	"expected_attempts",
	"instance_population",
	"instance_success_probability",
	"expected_instance_attempts",
	"outcome_components",
	"total_outcome_probability",
	"expected_quantity_per_event",
	"gold_cost",
	"gold_units",
	"token_quantity",
	"recursive_inputs",
	"enhancement_transitions",
	"dependency_route_ids",
	"availability_override_ids",
	"effort",
]);

function routeSourceRecord(route) {
	return Object.fromEntries(
		Object.entries(route)
			.filter(([field, value]) => field !== "route_id" && !ROUTE_RESULT_FIELDS.has(field) && field !== "attempt_inputs" && value !== undefined)
			.map(([field, value]) => [field, clone(value)]),
	);
}

function compactRoute(route) {
	return Object.fromEntries(
		Object.entries(route)
			.filter(([field, value]) => field === "route_id" || ROUTE_RESULT_FIELDS.has(field) && value !== undefined)
			.map(([field, value]) => [field, clone(value)]),
	);
}

function buildRouteResolver(data, directSourceIndex, shopIndex, medians) {
	const memo = new Map();
	const active = [];
	const routeSources = new Map();
	const routeResults = new Map();
	const starters = new Map([
		...(data.character.starter.weapons || []).map((item_id) => [item_id, "design/character.js:character.starter.weapons"]),
		...(data.character.starter.equipment || []).map((entry) => [entry?.name, "design/character.js:character.starter.equipment"]),
	]);
	const tokenRewards = new Map();
	for (const [tokenId, rewards] of Object.entries(data.tokens || {})) {
		for (const [itemId, rawQuantity] of Object.entries(rewards)) {
			const quantity = Number(rawQuantity);
			if (!(Number.isFinite(quantity) && quantity > 0)) throw new Error(`Token route ${tokenId}:${itemId} has invalid quantity`);
			if (!tokenRewards.has(itemId)) tokenRewards.set(itemId, []);
			tokenRewards.get(itemId).push({ token_id: tokenId, quantity });
		}
	}

	function registerRouteSource(route) {
		const source = routeSourceRecord(route);
		const existing = routeSources.get(route.route_id);
		if (existing && stableJson(existing) !== stableJson(source))
			throw new Error(`Route source ${route.route_id} has inconsistent shared evidence`);
		routeSources.set(route.route_id, source);
	}

	function selectedInputRow(spec, selectedRoute) {
		const totalQuantity = Number(spec.total_quantity);
		return {
			item_id: spec.item_id,
			purpose: spec.purpose,
			quantity: roundEvidence(totalQuantity),
			requested_level: Number(spec.requested_level || 0),
			expected_base_copies: roundEvidence(spec.expected_base_copies === undefined ? totalQuantity : spec.expected_base_copies),
			selected_route_id: selectedRoute.route_id,
			...(selectedRoute.effective_probability === undefined ? {} : { selected_effective_probability: selectedRoute.effective_probability }),
			...(selectedRoute.expected_attempts === undefined ? {} : { selected_expected_attempts: selectedRoute.expected_attempts }),
			dependency_route_ids: [...new Set([
				...(selectedRoute.dependency_route_ids || []),
				...(selectedRoute.availability_override_id ? [selectedRoute.availability_override_id] : []),
				...(selectedRoute.availability_override_ids || []),
			])].sort(),
			unit_effort: selectedRoute.effort,
			total_effort: roundEvidence(totalQuantity * selectedRoute.effort),
		};
	}

	function resolveAll(itemId) {
		if (memo.has(itemId)) return clone(memo.get(itemId));
		if (active.includes(itemId)) throw new Error(`Acquisition source cycle detected: ${[...active, itemId].join(" -> ")}`);
		active.push(itemId);
		const routes = (directSourceIndex.get(itemId) || []).map((sourceRoute) => {
			try {
					const route = clone(sourceRoute);
					const inputSpecs = [];
					if (route.access_item_id) {
						const instanceAttempts = Number(route.expected_instance_attempts);
						if (!(Number.isFinite(instanceAttempts) && instanceAttempts > 0))
							throw new Error(`Keyed route ${route.route_id} is missing expected instance attempts`);
						inputSpecs.push({
							item_id: route.access_item_id,
							purpose: "instance_access",
							total_quantity: instanceAttempts,
							requested_level: 0,
						});
					}
					for (const input of route.attempt_inputs || []) {
						const quantity = Number(input.quantity);
						if (!(Number.isFinite(quantity) && quantity > 0)) throw new Error(`Runtime route ${route.route_id} has invalid input quantity`);
						inputSpecs.push({
							item_id: input.item_id,
							purpose: input.purpose || "runtime_attempt",
							total_quantity: quantity * Number(route.expected_attempts || 1),
							requested_level: 0,
						});
					}
					delete route.attempt_inputs;
					if (inputSpecs.length) {
						const recursiveInputs = inputSpecs.map((spec) => selectedInputRow(spec, easiestRoute(spec.item_id)));
						route.recursive_inputs = recursiveInputs;
						route.dependency_route_ids = [...new Set(recursiveInputs.flatMap((input) => [input.selected_route_id, ...(input.dependency_route_ids || [])]))].sort();
						route.effort = roundEvidence(route.effort + recursiveInputs.reduce((sum, input) => sum + input.total_effort, 0));
					}
					return route;
			} catch (error) {
				if (/Acquisition source cycle detected:/i.test(error.message))
					throw new Error(`Acquisition source cycle in route ${sourceRoute.route_id} for ${itemId}: ${error.message}`);
				throw error;
			}
		});
		for (const shop of shopIndex.get(itemId) || []) routes.push(clone(shop));
		if (starters.has(itemId))
			routes.push({ route_id: `starter:${itemId}`, kind: "starter", source_path: starters.get(itemId), effort: 0 });

		const recipe = data.craft[itemId];
		if (recipe) {
			const recipeCost = Number(recipe.cost ?? 0);
			if (!(Number.isFinite(recipeCost) && recipeCost >= 0)) throw new Error(`Recipe ${itemId} has invalid gold cost`);
			if (!Array.isArray(recipe.items)) throw new Error(`Recipe ${itemId} has invalid input list`);
			const recursiveInputs = [];
			const enhancementTransitions = [];
			let effort = recipeCost / medians.gold;
			for (const input of recipe.items) {
				if (!Array.isArray(input)) throw new Error(`Recipe ${itemId} has invalid input`);
				const [rawQuantity, inputId, rawLevel = 0] = input;
				const quantity = Number(rawQuantity);
				const level = Number(rawLevel);
				if (!(Number.isFinite(quantity) && quantity > 0)) throw new Error(`Recipe ${itemId} input ${inputId} has invalid quantity`);
				if (!Number.isSafeInteger(level) || level < 0) throw new Error(`Recipe ${itemId} input ${inputId} has invalid level`);
				const inputDefinition = data.items[inputId];
				if (!inputDefinition) throw new Error(`Recipe ${itemId} references missing input ${inputId}`);
				const enhancement = expectedEnhancedCopies(inputDefinition, level, data);
				let selectedInput;
				try {
					selectedInput = easiestRoute(inputId);
				} catch (error) {
					throw new Error(`Recipe ${itemId} has unresolved input ${inputId}: ${error.message}`);
				}
				const totalQuantity = quantity * enhancement.base_copies;
				const baseInput = selectedInputRow(
					{ item_id: inputId, purpose: "recipe_input", total_quantity: totalQuantity, requested_level: level, expected_base_copies: enhancement.base_copies },
					selectedInput,
				);
				recursiveInputs.push(baseInput);
				effort += baseInput.total_effort;
				for (const transition of enhancement.transitions) {
					let selectedScroll;
					try {
						selectedScroll = easiestRoute(transition.scroll_item_id);
					} catch (error) {
						throw new Error(`Recipe ${itemId} has unresolved enhancement input ${transition.scroll_item_id}: ${error.message}`);
					}
					const scrollQuantity = quantity * transition.expected_scroll_copies;
					const scrollInput = selectedInputRow(
						{ item_id: transition.scroll_item_id, purpose: "enhancement_scroll", total_quantity: scrollQuantity, requested_level: 0 },
						selectedScroll,
					);
					recursiveInputs.push(scrollInput);
					effort += scrollInput.total_effort;
					enhancementTransitions.push({
						item_id: inputId,
						...transition,
						scroll_expected_quantity: roundEvidence(scrollQuantity),
						scroll_route_id: selectedScroll.route_id,
						scroll_unit_effort: selectedScroll.effort,
						scroll_total_effort: scrollInput.total_effort,
					});
				}
			}
			routes.push({
				route_id: `${recipe.quest ? "quest" : "craft"}:${itemId}`,
				kind: recipe.quest ? "quest_recipe" : "craft",
				source_path: `design/recipes.js:craft.${itemId}`,
				quest_id: recipe.quest || undefined,
				gold_cost: recipeCost,
				gold_units: roundEvidence(recipeCost / medians.gold),
				recursive_inputs: recursiveInputs,
				enhancement_transitions: enhancementTransitions,
				dependency_route_ids: [...new Set(recursiveInputs.flatMap((input) => [input.selected_route_id, ...(input.dependency_route_ids || [])]))].sort(),
				effort: roundEvidence(effort),
			});
		}

		for (const token of tokenRewards.get(itemId) || []) {
			const selectedToken = easiestRoute(token.token_id);
			const tokenInput = selectedInputRow(
				{ item_id: token.token_id, purpose: "token_exchange", total_quantity: token.quantity, requested_level: 0 },
				selectedToken,
			);
			routes.push({
				route_id: `token:${token.token_id}:${itemId}`,
				kind: "token",
				source_path: `design/tokens.js:tokens.${token.token_id}.${itemId}`,
				token_id: token.token_id,
				token_quantity: token.quantity,
				recursive_inputs: [tokenInput],
				dependency_route_ids: [...new Set([tokenInput.selected_route_id, ...(tokenInput.dependency_route_ids || [])])].sort(),
				effort: tokenInput.total_effort,
			});
		}

		active.pop();
		routes.sort((left, right) => left.effort - right.effort || left.route_id.localeCompare(right.route_id));
		for (const route of routes) registerRouteSource(route);
		routeResults.set(itemId, clone(routes));
		memo.set(itemId, clone(routes));
		return clone(routes);
	}

	function easiestRoute(itemId) {
		const routes = resolveAll(itemId);
		if (!routes.length) throw new Error(`Unresolved acquisition source for ${itemId}`);
		return clone(routes[0]);
	}

	return { allRoutes: resolveAll, easiestRoute, routeResults, routeSources };
}

function buildProductionAcquisitionResolver({ evidence, data = loadSourceData() } = {}) {
	if (!evidence) throw new Error("Acquisition production resolver requires reviewed evidence");
	const graph = sourceGraph(data);
	assertAcyclicSourceGraph(graph);
	const medians = normalizationMedians(data);
	const runtimeSnapshot = loadRuntimeSnapshot(data);
	const directSources = sourceRouteIndex(data, medians, evidence, runtimeSnapshot);
	const shopIndex = activeGoldShopIndex(data, medians);
	return {
		medians,
		resolver: buildRouteResolver(data, directSources.index, shopIndex, medians),
		source_graph: graph,
		runtimeSnapshot,
		directSources,
	};
}

module.exports = {
	FORMULAS,
	FORBIDDEN_DROP_TABLES,
	assertAcyclicSourceGraph,
	buildProductionAcquisitionResolver,
	assignPercentiles,
	canonicalJson,
	canonicalize,
	clone,
	compactRoute,
	dropOutcomeProbability,
	expectedEnhancedCopies,
	keyedInstanceAccessEvidence,
	loadSourceData,
	monsterRouteFactors,
	roundEvidence,
	routeOverrideMap,
	requiredDynamicMonsterOverrideIds,
	stableJson,
	sourceGraph,
	fixtureSha256: sha256,
	sha256: canonicalSha256,
	validateAvailabilityOverrides,
	validateRequiredDynamicMonsterOverrides,
};
