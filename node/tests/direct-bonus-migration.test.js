"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { ObjectId } = require("mongodb");
const { assertCorpusHydrated, canonicalHash, migrateCorpus } = require("../game/direct_bonus_migration");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/direct-equipment-authority");
const { ORACLE_SOURCE_REVISION, parseArgs, runAdapters, runMongo, versionFilter } = require("../tools/migrate-direct-equipment-effects");

const fixturePath = path.join(__dirname, "fixtures/direct-bonus-migration.json");

function fixture() {
	return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function context() {
	const data = loadSourceData();
	return { items: data.items, calculateItemProperties: loadPropertyCalculators(data).current.calculate_item_properties };
}

function withAllBankPacks(source) {
	const legacyTypes = ["str", "int", "dex", "vit", "for", "evasion", "reflection", "gold", "luck", "xp", "armor", "resistance", "speed", "lifesteal", "manasteal", "rpiercing", "apiercing", "crit", "dreturn", "frequency", "mp_cost", "output"];
	for (let index = 0; index < 48; index += 1) {
		const key = `items${index}`;
		if (!Array.isArray(source.User[0].info[key])) source.User[0].info[key] = [{ name: "mshield", level: index % 12, stat_type: legacyTypes[index % legacyTypes.length], p: index % 2 ? "shiny" : undefined }];
	}
	return source;
}

function memoryAdapters(corpus, { concurrentModel = null } = {}) {
	const store = structuredClone(corpus);
	const adapters = {};
	for (const model of ["Character", "User", "Mail", "Server"]) {
		adapters[model] = {
			find: async () => structuredClone(store[model]),
			compareAndSwap: async (original, next) => {
				if (concurrentModel === model || canonicalHash(store[model].find((document) => document._id === original._id)) !== canonicalHash(original)) return false;
				store[model][store[model].findIndex((document) => document._id === original._id)] = structuredClone(next);
				return true;
			},
			read: async (id) => structuredClone(store[model].find((document) => document._id === id)),
		};
	}
	return { adapters, store };
}

test("dry-run converts every supported persisted path without mutating its corpus", () => {
	const source = withAllBankPacks(fixture());
	const before = JSON.stringify(source);
	const result = migrateCorpus(source, context());
	assert.equal(JSON.stringify(source), before);
	assert.equal(JSON.stringify(result.documents), before);
	assert.ok(result.summary.changed >= 78);
	assert.deepEqual(Object.keys(result.summary.sources).sort(), ["apiercingscroll", "armorscroll", "critscroll", "dexscroll", "dreturnscroll", "evasionscroll", "forscroll", "frequencyscroll", "goldscroll", "intscroll", "lifestealscroll", "luckscroll", "manastealscroll", "mpcostscroll", "outputscroll", "reflectionscroll", "resistancescroll", "rpiercingscroll", "speedscroll", "strscroll", "vitscroll", "xpscroll"]);
	assert.ok(result.reports.some((report) => report.paths["info.p.trade_history[0][2]"]));
	for (let index = 0; index < 48; index += 1) assert.ok(result.reports.some((report) => report.paths[`info.items${index}[0]`]), `items${index}`);
	assert.ok(result.reports.every((report) => !JSON.stringify(report).includes("character-redacted")));
	assert.ok(result.reports.every((report) => /^[a-f0-9]{64}$/.test(report.before_hash) && /^[a-f0-9]{64}$/.test(report.after_hash)));
});

test("write simulation preserves every item field except legacy bonus replacement and schema marker", () => {
	const source = fixture();
	const characterId = new ObjectId();
	source.Character[0]._id = characterId;
	source.Character[0].info.items[0] = {
		...source.Character[0].info.items[0],
		ps: [1, 2], m: "merchant", v: 1, l: "l", ld: 2, r: 3, skin: "skin", charges: 4, expires: 5, gift: 1, acl: ["owner"], acc: "account", ach: "achievement", custom: { preserved: true },
	};
	const result = migrateCorpus(source, context(), { mode: "write" });
	const character = result.documents.Character[0];
	assert.equal(character.info.direct_effects_schema, 1);
	for (const item of character.info.items) {
		assert.equal(Object.hasOwn(item, "stat_type"), false);
		assert.equal(item.direct_bonus.version, 1);
		assert.ok(item.direct_bonus.source.endsWith("scroll"));
	}
	assert.equal(character.info.items[0].data, "kept");
	assert.equal(character.info.slots.mainhand.l, "l");
	assert.equal(character.info.p.trade_history[0][2].price, 7);
	assert.deepEqual(character.info.items[0].custom, { preserved: true });
	assert.equal(character.info.items[0].charges, 4);
	assert.ok(character._id instanceof ObjectId);
	assert.equal(character._id.toHexString(), characterId.toHexString());
	assert.doesNotThrow(() => assertCorpusHydrated(result.documents, context()));
});

test("migration is idempotent and fails closed before returning partial writes", () => {
	const first = migrateCorpus(fixture(), context(), { mode: "write" });
	const second = migrateCorpus(first.documents, context(), { mode: "write" });
	assert.equal(second.summary.changed, 0);
	assert.ok(second.reports.every((report) => report.before_hash === report.after_hash));
	const invalid = fixture();
	invalid.User[0].info.items0.push({ name: "mshield", level: 1, stat_type: "unknown" });
	assert.throws(() => migrateCorpus(invalid, context(), { mode: "write" }), (error) => error.code === "unknown_legacy_scroll");
	assert.equal(invalid.User[0].info.items0.at(-1).stat_type, "unknown");
	const ambiguous = fixture();
	ambiguous.User[0].info.items0[0].direct_bonus = { version: 1, source: "strscroll", effects: { damage: 1 } };
	assert.throws(() => migrateCorpus(ambiguous, context(), { mode: "write" }), (error) => error.code === "ambiguous_item_bonus");
	const unmigrated = fixture();
	assert.throws(() => assertCorpusHydrated(unmigrated, context()), (error) => error.code === "unmigrated_item" && error.path === "info.items[0]");
});

test("adapter preflight is compare-and-swap safe, verifies rereads, and refuses legacy verify-only input", async () => {
	const legacy = fixture();
	const rejected = memoryAdapters(legacy, { concurrentModel: "User" });
	await assert.rejects(runAdapters(rejected.adapters, context(), "write"), /Concurrent migration change/);
	assert.deepEqual(rejected.store, legacy);
	await assert.rejects(runAdapters(memoryAdapters(legacy).adapters, context(), "verify-only"), /unmigrated item bonuses/);
	const successful = memoryAdapters(legacy);
	const written = await runAdapters(successful.adapters, context(), "write");
	assert.equal(written.summary.changed, 34);
	const repeated = await runAdapters(successful.adapters, context(), "write");
	assert.equal(repeated.summary.changed, 0);
	const verified = await runAdapters(successful.adapters, context(), "verify-only");
	assert.equal(verified.summary.changed, 0);
	assert.doesNotThrow(() => assertCorpusHydrated(successful.store, context()));
});

test("rollout CLI accepts only guarded writes and versioned compare-and-swap filters", async () => {
	assert.throws(() => parseArgs(["--write"]), /--ack-backup/);
	assert.deepEqual(parseArgs(["--write", "--ack-backup=checkpoint", `--expected-oracle-source-revision=${ORACLE_SOURCE_REVISION}`, "--database=adventureland"]), {
		mode: "write", fixture: null, database: "adventureland", ackBackup: "checkpoint", sourceRevision: ORACLE_SOURCE_REVISION,
	});
	assert.throws(() => parseArgs(["--fixture=a.json", "--database=adventureland"]), /either --fixture or --database/);
	assert.deepEqual(versionFilter({ _id: "id", updated: 1, __v: 2, info: {} }), { _id: "id", updated: 1, __v: 2, "info.direct_effects_schema": { $exists: false } });
	assert.deepEqual(versionFilter({ _id: "id", info: { direct_effects_schema: 1 } }), { _id: "id", "info.direct_effects_schema": 1 });
	await assert.rejects(runMongo({ database: null }, {}), /requires ADVENTURELAND_MONGODB_URI and --database/);
	const source = fs.readFileSync(path.resolve(__dirname, "../tools/migrate-direct-equipment-effects.js"), "utf8");
	assert.doesNotMatch(source, /deleteMany|dropDatabase|replaceOne|replaceMany/);
	assert.match(source, /compareAndSwap/);
});
