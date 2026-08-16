"use strict";

const crypto = require("node:crypto");
const { validateDirectBonus, validateDirectVector } = require("./direct_effects");

const LEGACY_SCROLL_SOURCES = Object.freeze({
	str: "strscroll",
	int: "intscroll",
	dex: "dexscroll",
	vit: "vitscroll",
	for: "forscroll",
	evasion: "evasionscroll",
	reflection: "reflectionscroll",
	gold: "goldscroll",
	luck: "luckscroll",
	xp: "xpscroll",
	armor: "armorscroll",
	resistance: "resistancescroll",
	speed: "speedscroll",
	lifesteal: "lifestealscroll",
	manasteal: "manastealscroll",
	rpiercing: "rpiercingscroll",
	apiercing: "apiercingscroll",
	crit: "critscroll",
	dreturn: "dreturnscroll",
	frequency: "frequencyscroll",
	mp_cost: "mpcostscroll",
	output: "outputscroll",
});

const CHARACTER_SNAPSHOT_FIELDS = Object.freeze(["u_item", "u_itemx", "c_item", "c_itemx"]);

function migrationError(code, message, fields = {}) {
	const error = new Error(message);
	error.code = code;
	Object.assign(error, fields);
	return error;
}

function clone(value) {
	if (Array.isArray(value)) return value.map(clone);
	if (!value || typeof value !== "object") return value;
	if (value instanceof Date) return new Date(value.getTime());
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) return value;
	const result = Object.create(prototype);
	for (const [key, nested] of Object.entries(value)) result[key] = clone(nested);
	return result;
}

function canonicalize(value) {
	if (value instanceof Date) return value.toJSON();
	if (value && typeof value.toHexString === "function") return value.toHexString();
	if (value && typeof value.toJSON === "function") return canonicalize(value.toJSON());
	if (Array.isArray(value)) return value.map(canonicalize);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalHash(value) {
	return crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function isItem(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value) && typeof value.name === "string" && value.name);
}

function scrollSources(items) {
	const result = new Map();
	for (const [source, definition] of Object.entries(items || {})) {
		if (definition?.type !== "pscroll") continue;
		const effects = validateDirectVector(definition.scroll_effects, { path: `items.${source}.scroll_effects` });
		if (!(Number(definition.scroll_value) > 0)) throw migrationError("invalid_scroll_source", `Scroll ${source} has no positive scroll_value`, { source });
		result.set(source, { source, effects, scroll_value: Number(definition.scroll_value) });
	}
	if (result.size !== 22) throw migrationError("invalid_scroll_source", "The catalog must publish all 22 direct-effect scroll sources", { count: result.size });
	for (const source of Object.values(LEGACY_SCROLL_SOURCES))
		if (!result.has(source)) throw migrationError("invalid_scroll_source", `Scroll source ${source} is missing`, { source });
	return result;
}

function sourceForLegacyStat(statType, sources) {
	const source = LEGACY_SCROLL_SOURCES[statType];
	if (!source || !sources.has(source)) throw migrationError("unknown_legacy_scroll", `No direct scroll source exists for legacy stat_type ${statType}`, { stat_type: statType });
	return source;
}

function scrollValueForItem(item, items, calculateItemProperties) {
	if (!isItem(item) || !items?.[item.name]) throw migrationError("invalid_item", "Item instance has no catalog definition", { item_name: item?.name });
	const properties = calculateItemProperties ? calculateItemProperties(item, items[item.name]) : items[item.name];
	const value = Number(properties?.scroll_value ?? items[item.name].scroll_value ?? 0);
	if (!Number.isFinite(value) || value <= 0) throw migrationError("invalid_scroll_value", `Item ${item.name} has no representable scroll value`, { item_name: item.name, level: item.level || 0 });
	return value;
}

function directBonusFor(item, source, { items, calculateItemProperties, sources = scrollSources(items) } = {}) {
	const profile = sources.get(source);
	if (!profile) throw migrationError("unknown_scroll_source", `Unknown direct bonus source ${source}`, { source });
	const value = scrollValueForItem(item, items, calculateItemProperties);
	const ratio = value / profile.scroll_value;
	const effects = validateDirectVector(Object.fromEntries(Object.entries(profile.effects).map(([key, amount]) => [key, amount * ratio])), { path: `direct_bonus.${source}.effects` });
	return validateDirectBonus({ version: 1, source, effects }, { knownSources: new Set(sources.keys()) });
}

function validateItemBonus(item, context) {
	if (!isItem(item)) return null;
	if (Object.hasOwn(item, "stat_type")) {
		const path = context?.path || "item";
		throw migrationError("unmigrated_item", `Unmigrated item ${item.name} reached ${path}`, { item_name: item.name, path });
	}
	if (!item.direct_bonus) return null;
	return validateDirectBonus(item.direct_bonus, { knownSources: new Set(scrollSources(context.items).keys()), path: context.path || "item.direct_bonus" });
}

function assertItemFieldPreservation(original, migrated, path) {
	const before = clone(original);
	const after = clone(migrated);
	delete before.stat_type;
	delete before.direct_bonus;
	delete after.stat_type;
	delete after.direct_bonus;
	if (JSON.stringify(canonicalize(before)) !== JSON.stringify(canonicalize(after))) {
		throw migrationError("item_field_drift", `Migration changed an unrelated field at ${path}`, { path });
	}
}

function migrateItem(item, context) {
	if (!isItem(item)) return { item, changed: false, source: null };
	const sources = context.sources || scrollSources(context.items);
	if (item.stat_type === undefined) {
		if (item.direct_bonus) validateDirectBonus(item.direct_bonus, { knownSources: new Set(sources.keys()), path: context.path || "item.direct_bonus" });
		return { item, changed: false, source: null };
	}
	if (typeof item.stat_type !== "string" || !item.stat_type) throw migrationError("invalid_legacy_scroll", "Legacy stat_type must be a nonempty string", { path: context.path });
	if (item.direct_bonus) throw migrationError("ambiguous_item_bonus", "Item cannot contain both legacy and direct applied bonuses", { path: context.path });
	const source = sourceForLegacyStat(item.stat_type, sources);
	const next = clone(item);
	next.direct_bonus = directBonusFor(next, source, { ...context, sources });
	delete next.stat_type;
	assertItemFieldPreservation(item, next, context.path || "item");
	return { item: next, changed: true, source };
}

function itemLocations(model, document) {
	const info = document?.info || {};
	const paths = [];
	const add = (parent, key, path) => {
		if (isItem(parent?.[key])) paths.push({ parent, key, path });
	};
	const addArray = (parent, key, path) => {
		if (!Array.isArray(parent?.[key])) return;
		parent[key].forEach((value, index) => { if (isItem(value)) paths.push({ parent: parent[key], key: index, path: `${path}[${index}]` }); });
	};
	if (model === "Character") {
		addArray(info, "items", "info.items");
		for (const key of Object.keys(info.slots || {})) add(info.slots, key, `info.slots.${key}`);
		if (Array.isArray(info.p?.trade_history)) info.p.trade_history.forEach((entry, index) => { if (isItem(entry?.[2])) paths.push({ parent: entry, key: 2, path: `info.p.trade_history[${index}][2]` }); });
		for (const key of CHARACTER_SNAPSHOT_FIELDS) add(info.p || {}, key, `info.p.${key}`);
	} else if (model === "User") {
		for (let index = 0; index <= 47; index += 1) addArray(info, `items${index}`, `info.items${index}`);
	} else if (model === "Mail") add(info, "item", "info.item");
	else if (model === "Server") {
		addArray(info.data || {}, "sold", "info.data.sold");
		addArray(info.data || {}, "found", "info.data.found");
	} else throw migrationError("unknown_model", `Unsupported migration model ${model}`, { model });
	return paths;
}

function redactDocument(document) {
	return { has_id: Boolean(document?._id), version: document?.__v ?? document?.updated_at ?? null };
}

function migrateDocument(model, document, context) {
	const next = clone(document);
	const report = { model, document: redactDocument(document), before_hash: canonicalHash(document), after_hash: null, paths: {}, sources: {}, changed: 0 };
	for (const location of itemLocations(model, next)) {
		const result = migrateItem(location.parent[location.key], { ...context, path: location.path });
		if (!result.changed) continue;
		location.parent[location.key] = result.item;
		report.changed += 1;
		report.paths[location.path] = (report.paths[location.path] || 0) + 1;
		report.sources[result.source] = (report.sources[result.source] || 0) + 1;
	}
	if (report.changed && next.info) next.info.direct_effects_schema = 1;
	report.after_hash = canonicalHash(next);
	return { document: next, report };
}

function migrateCorpus(corpus, context, { mode = "dry-run" } = {}) {
	if (!corpus || typeof corpus !== "object") throw migrationError("invalid_corpus", "Migration corpus must be an object");
	if (!context?.items) throw migrationError("missing_catalog", "Migration requires an item catalog");
	const sources = scrollSources(context.items);
	const staged = {};
	const reports = [];
	for (const model of ["Character", "User", "Mail", "Server"]) {
		staged[model] = [];
		for (const document of corpus[model] || []) {
			const result = migrateDocument(model, document, { ...context, sources });
			staged[model].push(result.document);
			reports.push(result.report);
		}
	}
	const summary = reports.reduce((total, report) => total + report.changed, 0);
	return { mode, documents: mode === "dry-run" ? clone(corpus) : staged, reports, summary: { changed: summary, documents: reports.filter((report) => report.changed).length, sources: Object.fromEntries(reports.flatMap((report) => Object.entries(report.sources)).reduce((entries, [source, count]) => entries.set(source, (entries.get(source) || 0) + count), new Map())) } };
}

function assertCorpusHydrated(corpus, context) {
	for (const model of ["Character", "User", "Mail", "Server"])
		for (const document of corpus?.[model] || [])
			for (const location of itemLocations(model, document)) validateItemBonus(location.parent[location.key], { ...context, path: location.path });
	return true;
}

module.exports = { CHARACTER_SNAPSHOT_FIELDS, LEGACY_SCROLL_SOURCES, assertCorpusHydrated, assertItemFieldPreservation, canonicalHash, directBonusFor, itemLocations, migrateCorpus, migrateDocument, migrateItem, migrationError, scrollSources, sourceForLegacyStat, validateItemBonus };
