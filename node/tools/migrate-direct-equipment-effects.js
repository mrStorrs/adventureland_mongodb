"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { MongoClient } = require("mongodb");
const { assertCorpusHydrated, canonicalHash, migrateCorpus } = require("../game/direct_bonus_migration");
const { loadSourceData } = require("./acquisition-ranking");
const { loadPropertyCalculators } = require("./direct-equipment-authority");

const ORACLE_SOURCE_REVISION = "80655fd";

function parseArgs(argv) {
	const options = { mode: "dry-run", fixture: null, database: null, ackBackup: null, sourceRevision: null };
	for (const argument of argv) {
		if (argument === "--dry-run") options.mode = "dry-run";
		else if (argument === "--write") options.mode = "write";
		else if (argument === "--verify-only") options.mode = "verify-only";
		else if (argument.startsWith("--fixture=")) options.fixture = argument.slice("--fixture=".length);
		else if (argument.startsWith("--database=")) options.database = argument.slice("--database=".length);
		else if (argument.startsWith("--ack-backup=")) options.ackBackup = argument.slice("--ack-backup=".length);
		else if (argument.startsWith("--expected-oracle-source-revision=")) options.sourceRevision = argument.slice("--expected-oracle-source-revision=".length);
		else throw new Error(`Unknown argument ${argument}`);
	}
	if (options.mode === "write" && (!options.ackBackup || options.sourceRevision !== ORACLE_SOURCE_REVISION))
		throw new Error(`--write requires --ack-backup=<operator checkpoint> and --expected-oracle-source-revision=${ORACLE_SOURCE_REVISION}`);
	if (options.fixture && options.database) throw new Error("Use either --fixture or --database, not both");
	return options;
}

function migrationContext() {
	const data = loadSourceData();
	return { items: data.items, calculateItemProperties: loadPropertyCalculators(data).current.calculate_item_properties };
}

function redact(result) {
	return {
		mode: result.mode,
		summary: result.summary,
		reports: result.reports.map(({ model, before_hash, after_hash, paths, sources, changed }) => ({ model, before_hash, after_hash, paths, sources, changed })),
	};
}

function versionFilter(document) {
	const filter = { _id: document._id };
	if (document.updated !== undefined) filter.updated = document.updated;
	if (document.__v !== undefined) filter.__v = document.__v;
	const marker = document.info && document.info.direct_effects_schema;
	filter["info.direct_effects_schema"] = marker === undefined ? { $exists: false } : marker;
	return filter;
}

function createMongoAdapters(database) {
	const collections = { Character: "character", User: "user", Mail: "mail", Server: "server" };
	return Object.fromEntries(
		Object.entries(collections).map(([model, collectionName]) => {
			const collection = database.collection(collectionName);
			return [
				model,
				{
					find: () => collection.find({}).toArray(),
					async compareAndSwap(original, next) {
						const result = await collection.updateOne(versionFilter(original), { $set: { info: next.info } });
						return result.modifiedCount === 1;
					},
					read: (id) => collection.findOne({ _id: id }),
				},
			];
		}),
	);
}

async function runAdapters(adapters, context = migrationContext(), mode = "dry-run") {
	const corpus = {};
	for (const model of ["Character", "User", "Mail", "Server"]) corpus[model] = await (adapters[model]?.find() || []);
	const preflight = migrateCorpus(corpus, context, { mode: "write" });
	if (mode === "verify-only") {
		if (preflight.summary.changed) throw new Error(`Verification found ${preflight.summary.changed} unmigrated item bonuses`);
		assertCorpusHydrated(corpus, context);
		return redact({ ...preflight, mode, summary: { changed: 0, documents: 0, sources: {} } });
	}
	if (mode === "dry-run") return redact({ ...preflight, mode });
	const applied = [];
	try {
		for (const model of ["Character", "User", "Mail", "Server"]) {
			const adapter = adapters[model];
			for (let index = 0; index < (corpus[model] || []).length; index += 1) {
				const original = corpus[model][index];
				const next = preflight.documents[model][index];
				if (canonicalHash(original) === canonicalHash(next)) continue;
				if (!adapter || !(await adapter.compareAndSwap(original, next))) throw new Error(`Concurrent migration change for ${model}`);
				applied.push({ adapter, original, next, model });
				const reread = await adapter.read(original._id);
				if (canonicalHash(reread) !== canonicalHash(next)) throw new Error(`Migration reread mismatch for ${model}`);
			}
		}
	} catch (error) {
		for (const change of applied.reverse()) {
			if (!(await change.adapter.compareAndSwap(change.next, change.original))) {
				throw new Error(`Migration rollback failed for ${change.model} after ${error.message}`);
			}
		}
		throw error;
	}
	return redact({ ...preflight, mode });
}

async function runMongo(options, env = process.env) {
	const uri = env.ADVENTURELAND_MONGODB_URI;
	const databaseName = options.database;
	if (!uri || !databaseName) throw new Error("Production migration requires ADVENTURELAND_MONGODB_URI and --database=<name>");
	const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 });
	try {
		await client.connect();
		return await runAdapters(createMongoAdapters(client.db(databaseName)), migrationContext(), options.mode);
	} finally {
		await client.close();
	}
}

async function main(argv = process.argv.slice(2), env = process.env) {
	const options = parseArgs(argv);
	if (options.fixture) {
		const fixturePath = path.resolve(process.cwd(), options.fixture);
		const corpus = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
		const context = migrationContext();
		const result = migrateCorpus(corpus, context, { mode: options.mode === "dry-run" ? "dry-run" : "write" });
		if (options.mode === "verify-only") {
			if (result.summary.changed) throw new Error(`Verification found ${result.summary.changed} unmigrated item bonuses`);
			assertCorpusHydrated(corpus, context);
			result.mode = options.mode;
			result.summary = { changed: 0, documents: 0, sources: {} };
		}
		const report = redact({ ...result, mode: options.mode });
		process.stdout.write(`${JSON.stringify(report)}\n`);
		return report;
	}
	const report = await runMongo(options, env);
	process.stdout.write(`${JSON.stringify(report)}\n`);
	return report;
}

if (require.main === module) {
	main().catch((error) => {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	});
}

module.exports = { ORACLE_SOURCE_REVISION, createMongoAdapters, main, migrationContext, parseArgs, runAdapters, runMongo, versionFilter };
