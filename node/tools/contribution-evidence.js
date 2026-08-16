"use strict";

const { canonicalJson, sha256 } = require("./acquisition-ranking");

const CONTRIBUTION_GROUP_ORDER = Object.freeze([
	"class",
	"weapon",
	"armor",
	"cape",
	"offhand",
	"accessories_orb",
	"profile",
	"set",
]);
const LOADOUT_GROUPS = Object.freeze(new Set(["weapon", "armor", "cape", "offhand", "accessories_orb"]));

function createContributionCatalog(fields) {
	const items = [];
	const itemReferences = new Map();
	const groups = [];
	const groupReferences = new Map();
	const referenceItem = (item) => {
		const hash = sha256(item);
		if (!itemReferences.has(hash)) {
			const ref = items.length;
			itemReferences.set(hash, ref);
			items.push({ ref, sha256: hash, ...item });
		}
		return itemReferences.get(hash);
	};
	return {
		referenceGroup(group, expectedHash, groupId) {
			const hash = sha256(group);
			if (hash !== expectedHash) throw new Error(`Contribution evidence group hash is invalid: ${groupId} expected=${expectedHash} actual=${hash}`);
			if (!groupReferences.has(hash)) {
				const ref = groups.length;
				groupReferences.set(hash, ref);
				groups.push({
					ref,
					sha256: hash,
					item_refs: group.items.map(referenceItem),
					totals: group.totals,
				});
			}
			return groupReferences.get(hash);
		},
		finalize() {
			const catalog = {
				schema_version: 1,
				fields: [...fields],
				group_order: [...CONTRIBUTION_GROUP_ORDER],
				items,
				groups,
			};
			return { ...catalog, catalog_sha256: sha256(catalog) };
		},
	};
}

function compactContributionEvidence(evidence, catalog) {
	if (!evidence?.groups || !catalog?.referenceGroup) throw new Error("Contribution evidence or catalog is missing");
	const groupRefs = [];
	for (const groupId of CONTRIBUTION_GROUP_ORDER) {
		const group = evidence.groups[groupId];
		if (!group || !Array.isArray(group.items) || !group.totals || !evidence.group_hashes?.[groupId])
			throw new Error(`Contribution evidence group is incomplete: ${groupId}`);
		groupRefs.push(catalog.referenceGroup(group, evidence.group_hashes[groupId], groupId));
	}
	return {
		group_refs: groupRefs,
		set_counts: evidence.set_counts,
		set_sha256: evidence.set_sha256,
		loadout_sha256: evidence.loadout_sha256,
		contributions_sha256: evidence.contributions_sha256,
	};
}

function validateContributionCatalog(catalog) {
	if (!catalog || catalog.schema_version !== 1 || !Array.isArray(catalog.fields) || !Array.isArray(catalog.items) || !Array.isArray(catalog.groups) || canonicalJson(catalog.group_order) !== canonicalJson(CONTRIBUTION_GROUP_ORDER))
		throw new Error("Contribution evidence catalog metadata is invalid");
	const core = { schema_version: catalog.schema_version, fields: catalog.fields, group_order: catalog.group_order, items: catalog.items, groups: catalog.groups };
	if (catalog.catalog_sha256 !== sha256(core)) throw new Error("Contribution evidence catalog hash drifted");
	for (const [index, item] of catalog.items.entries()) {
		const { ref, sha256: expected, ...value } = item;
		if (ref !== index || expected !== sha256(value)) throw new Error(`Contribution evidence catalog item ${index} drifted`);
	}
	for (const [index, group] of catalog.groups.entries()) {
		const { ref, sha256: expected, item_refs: itemRefs, totals } = group;
		const items = itemRefs.map((itemRef) => {
			const item = catalog.items[itemRef];
			if (!item) throw new Error(`Contribution evidence group item reference is missing: ${itemRef}`);
			const { ref: ignoredRef, sha256: ignoredHash, ...value } = item;
			return value;
		});
		if (ref !== index || expected !== sha256({ items, totals })) throw new Error(`Contribution evidence catalog group ${index} drifted`);
	}
	return true;
}

function contributionGroupHashes(evidence, catalog) {
	if (!Array.isArray(evidence?.group_refs) || evidence.group_refs.length !== CONTRIBUTION_GROUP_ORDER.length)
		throw new Error("Compact contribution evidence group references are incomplete");
	return Object.fromEntries(CONTRIBUTION_GROUP_ORDER.map((groupId, index) => {
		const group = catalog.groups[evidence.group_refs[index]];
		if (!group) throw new Error(`Contribution evidence group reference is missing: ${evidence.group_refs[index]}`);
		return [groupId, group.sha256];
	}));
}

function expandContributionEvidence(evidence, catalog, { validateCatalog = true } = {}) {
	if (validateCatalog) validateContributionCatalog(catalog);
	const groups = {};
	const groupHashes = contributionGroupHashes(evidence, catalog);
	for (const [index, groupId] of CONTRIBUTION_GROUP_ORDER.entries()) {
		const compact = catalog.groups[evidence.group_refs[index]];
		const items = compact.item_refs.map((ref) => {
			const item = catalog.items[ref];
			if (!item) throw new Error(`Contribution evidence item reference is missing: ${ref}`);
			const { ref: ignoredRef, sha256: ignoredHash, ...value } = item;
			return value;
		});
		groups[groupId] = { items, totals: compact.totals };
		if (compact.sha256 !== sha256(groups[groupId])) throw new Error(`Contribution evidence group hash drifted: ${groupId}`);
	}
	const loadout = CONTRIBUTION_GROUP_ORDER
		.filter((groupId) => LOADOUT_GROUPS.has(groupId))
		.flatMap((groupId) => groups[groupId].items)
		.map(({ slot, item_id, level, direct_bonus }) => ({ slot, item_id, level, direct_bonus: direct_bonus || null }))
		.sort((left, right) => left.slot.localeCompare(right.slot));
	if (evidence.loadout_sha256 !== sha256(loadout)) throw new Error("Contribution loadout hash drifted");
	if (evidence.set_sha256 !== sha256({ counts: evidence.set_counts, contribution: groups.set })) throw new Error("Contribution set hash drifted");
	if (evidence.contributions_sha256 !== sha256(groups)) throw new Error("Contribution aggregate hash drifted");
	return {
		fields: [...catalog.fields],
		groups,
		group_hashes: groupHashes,
		set_counts: evidence.set_counts,
		set_sha256: evidence.set_sha256,
		loadout,
		loadout_sha256: evidence.loadout_sha256,
		contributions_sha256: evidence.contributions_sha256,
	};
}

module.exports = {
	CONTRIBUTION_GROUP_ORDER,
	compactContributionEvidence,
	contributionGroupHashes,
	createContributionCatalog,
	expandContributionEvidence,
	validateContributionCatalog,
};
