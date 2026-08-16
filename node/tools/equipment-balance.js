"use strict";

const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { WEAPON_PROFILES } = require("../game/active_skill");
const { isCompatibleOffhand } = require("../game/equipment");
const { calculateStats } = require("../game/stats");
const { assignPercentiles, buildProductionAcquisitionResolver, canonicalJson, dropOutcomeProbability, fixtureSha256, loadSourceData, sha256 } = require("./acquisition-ranking");
const { compactContributionEvidence, createContributionCatalog, expandContributionEvidence, validateContributionCatalog } = require("./contribution-evidence");
const { assertEnhancementFeasibility, compactEnhancementFeasibility, enhancementFeasibilityReport, fullSheetContext, loadRankingFixture, publicationCatalogFromSource, validateRankingPublicationBundle } = require("./weapon-acquisition-ranking");
const { loadPropertyCalculators } = require("./weapon-progression-parity");
const { COMPOUND_STEP_WEIGHTS, UPGRADE_STEP_WEIGHTS, enhancementStepWeight } = require("./enhancement-steps");
const { serializeFixture } = require("./fixture-serialization");

const REPOSITORY_ROOT = path.resolve(__dirname, "../..");
const FIXTURE_DIRECTORY = path.resolve(__dirname, "../tests/fixtures");
const PINNED_COMMIT = "99d1a8672438227948caf5a5f8c9d595466d8019";
const PRE_PLAN_TWO_COMMIT = "76a50408fac4a7b1df1e1906ed631ac013b1123c";
const EQUIPMENT_REBALANCE_BASE_COMMIT = "19120727d5eabce23a028deaa5db59c9ce571115";
const PRIEST_BOOK_SKILL_DOMAIN_SHA256 = "437940fcc6f40a483887b086431c5d161131684c7532e87f9dc0bda15c63508f";
const PINNED_SOURCES = Object.freeze([
	"design/classes.js",
	"design/items.js",
	"design/monsters.js",
	"design/upgrades.js",
	"js/old_common_functions.js",
	"node/server.js",
]);
const PINNED_BLOB_IDS = Object.freeze({
	"design/classes.js": "788fbc38d1d684ff67c31cf2d3d51aba83e22022",
	"design/items.js": "37e10f03315274fb027d9560c45f99dae918c84f",
	"design/monsters.js": "220f039ef600c13281737d878c829d0b197ce5b8",
	"design/upgrades.js": "c1a99cf4853cdc057cde649134a5f5c878668506",
	"js/old_common_functions.js": "a4836c14aae59e67dedc6687b82dc174440f5350",
	"node/server.js": "30f040b307727a6d2a64b5b6ecd61b6fe775a5ce",
});
const CORE_TYPES = new Set(["helmet", "chest", "pants", "gloves", "shoes", "cape", "shield", "source", "quiver", "misc_offhand"]);
const ROLE_SKILLS = Object.freeze(["warrior", "paladin", "ranger", "rogue", "mage", "priest"]);
const CORE_FIELDS = Object.freeze(["str", "dex", "int", "vit", "hp", "mp", "armor", "resistance"]);
const REBALANCED_ARMOR_TYPES = Object.freeze(new Set(["helmet", "chest", "pants", "gloves", "shoes"]));
const WEAPON_REFERENCE_LEVELS = Object.freeze([1, 8, 15, 22, 29, 36, 42, 49, 56, 63, 70]);
const EFFECT_FIELDS = Object.freeze(["crit", "frequency", "speed", "range", "apiercing", "rpiercing", "lifesteal", "manasteal", "evasion", "reflection", "dreturn", "mp_reduction", "pnresistance", "firesistance", "fzresistance", "phresistance", "stresistance"]);
const DOMINATION_FIELDS = Object.freeze([...CORE_FIELDS, ...EFFECT_FIELDS]);
const EVIDENCE_CONTRIBUTION_FIELDS = Object.freeze([...new Set([...DOMINATION_FIELDS, "attack", "output"])]);
const REVIEWED_OFFHAND_IDS = Object.freeze(["wshield", "shield", "sshield", "mshield", "xshield", "quiver", "t2quiver", "alloyquiver", "lantern", "exoarm", "tigershield"]);
const REVIEWED_EVENT_SIDEGRADE_PLANS = Object.freeze({
	tigershield: { kind: "event_sidegrade", source_item_id: "tigershield", source_table: "monsters.tiger", source_route_id: "event-monster:tiger", source_evidence: "design/drops.js:drops.tiger cooperative event source", direct_source_entry: true },
});

function assertRankingEnhancementFeasible(ranking) {
	const rows = ranking?.enhancement_full_sheet_rows;
	const catalog = ranking?.enhancement_contribution_catalog;
	const invalid = (message) => {
		const error = new Error(message);
		error.code = "weapon_target_unrepresentable";
		throw error;
	};
	if (!Array.isArray(rows) || !catalog) invalid("Weapon ranking enhancement feasibility evidence is missing");
	validateContributionCatalog(catalog);
	if (rows.length !== ROLE_SKILLS.length * WEAPON_REFERENCE_LEVELS.length)
		invalid("Weapon ranking enhancement rows do not cover every class and rank");
	const rowIds = new Set();
	const expectedStates = UPGRADE_STEP_WEIGHTS.length * COMPOUND_STEP_WEIGHTS.length;
	for (const row of rows) {
		const rowId = `${row.skill}:rank-${row.shared_rank}`;
		if (!ROLE_SKILLS.includes(row.skill) || !Number.isInteger(row.shared_rank) || row.shared_rank < 1 || row.shared_rank > WEAPON_REFERENCE_LEVELS.length || row.id !== rowId || row.reference_level !== WEAPON_REFERENCE_LEVELS[row.shared_rank - 1] || rowIds.has(rowId) || !Array.isArray(row.states) || row.states.length !== expectedStates)
			invalid(`Weapon ranking enhancement row is incomplete: ${rowId}`);
		rowIds.add(rowId);
		const stateIds = new Set();
		for (const state of row.states) {
			const stateId = `${state.upgrade_level}/${state.compound_level}`;
			if (!Number.isInteger(state.upgrade_level) || state.upgrade_level < 0 || state.upgrade_level >= UPGRADE_STEP_WEIGHTS.length || !Number.isInteger(state.compound_level) || state.compound_level < 0 || state.compound_level >= COMPOUND_STEP_WEIGHTS.length || stateIds.has(stateId))
				invalid(`Weapon ranking enhancement state is incomplete: ${rowId}:+${state.upgrade_level}/+${state.compound_level}`);
			stateIds.add(stateId);
			expandContributionEvidence(state.rebalanced_contributions, catalog, { validateCatalog: false });
		}
	}
	const report = enhancementFeasibilityReport(rows, catalog);
	assertEnhancementFeasibility(report);
	const summary = compactEnhancementFeasibility(report);
	if (canonicalJson(ranking.enhancement_feasibility) !== canonicalJson(summary))
		invalid("Weapon ranking enhancement feasibility summary drifted from reconstructed evidence");
	if (ranking.hashes?.enhancement_contribution_catalog_sha256 !== catalog.catalog_sha256 || ranking.hashes?.enhancement_full_sheet_contributions_sha256 !== fixtureSha256(rows.map((row) => row.states.map((state) => state.rebalanced_contributions.contributions_sha256))))
		invalid("Weapon ranking enhancement feasibility hashes drifted from reconstructed evidence");
	return true;
}
const OFFHAND_REQUIREMENT_SKILLS = Object.freeze({
	shield: Object.freeze(["warrior", "paladin", "priest"]),
	source: Object.freeze(["paladin", "mage", "priest"]),
	misc_offhand: Object.freeze(["warrior", "paladin", "mage", "priest", "rogue"]),
	quiver: Object.freeze(["ranger"]),
});
const PLACEHOLDER_WEAPON_PEERS = Object.freeze({ wbook2: "wbook0", wbook3: "wbook0", wbook4: "wbook1", wbook5: "wbook1", wbook6: "wbookhs", wbook7: "wbookhs", wbook8: "wbookhs", wbook9: "wbookhs" });
const ARMOR_SET_SLOTS = Object.freeze({
	tiger: { helmet: ["tigerhelmet"], chest: ["tigerarmor"], pants: ["tigerpants"], gloves: ["tigergloves"], shoes: ["tigerboots"] },
	vampires: { helmet: ["vhelmet"], chest: ["mcape", "vattire"], pants: ["vpants"], gloves: ["vgloves"], shoes: ["vboots"] },
	mpx: { helmet: ["mpxhelmet"], chest: ["mpxarmor"], pants: ["mpxpants"], gloves: ["mpxgloves"], shoes: ["mpxboots"] },
	fury: { helmet: ["fury"], chest: ["furyarmor"], pants: ["fallen"], gloves: ["furygloves"], shoes: ["furyboots"] },
	legends: { helmet: ["legendhelmet"], chest: ["warpvest"], pants: ["starkillers"], gloves: ["powerglove", "goldenpowerglove"], shoes: ["legendboots"] },
	swift: { helmet: ["swifthelmet"], chest: ["swiftarmor"], pants: ["swiftpants"], gloves: ["fierygloves"], shoes: ["wingedboots"] },
	holidays: { helmet: ["xmashat"], chest: ["xmassweater", "sweaterhs"], pants: ["xmaspants"], gloves: ["mittens", "supermittens"], shoes: ["xmasshoes"] },
	wanderers: { helmet: ["wcap"], chest: ["wattire"], pants: ["wbreeches"], gloves: ["wgloves"], shoes: ["wshoes"] },
	wt3: { helmet: ["hhelmet"], chest: ["harmor"], pants: ["hpants"], gloves: ["hgloves"], shoes: ["hboots"] },
	wt4: { helmet: ["xhelmet"], chest: ["xarmor"], pants: ["xpants"], gloves: ["xgloves"], shoes: ["xboots"] },
	rugged: { helmet: ["helmet1"], chest: ["coat1"], pants: ["pants1"], gloves: ["gloves1"], shoes: ["shoes1"] },
	mwarrior: { helmet: ["mwhelmet"], chest: ["mwarmor"], pants: ["mwpants"], gloves: ["mwgloves"], shoes: ["mwboots"] },
	mmage: { helmet: ["mmhat"], chest: ["mmarmor"], pants: ["mmpants"], gloves: ["mmgloves"], shoes: ["mmshoes"] },
	mpriest: { helmet: ["mphat"], chest: ["mparmor"], pants: ["mppants"], gloves: ["mpgloves"], shoes: ["mpshoes"] },
	mranger: { helmet: ["mrnhat"], chest: ["mrnarmor"], pants: ["mrnpants"], gloves: ["mrngloves"], shoes: ["mrnboots"] },
	mrogue: { helmet: ["mrhood"], chest: ["mrarmor"], pants: ["mrpants"], gloves: ["mrgloves"], shoes: ["mrboots"] },
	mmerchant: { helmet: ["mchat"], chest: ["mcarmor"], pants: ["mcpants"], gloves: ["mcgloves"], shoes: ["mcboots"] },
	bunny: { helmet: ["eears"], chest: ["epyjamas"], pants: ["epants"], gloves: ["egloves"], shoes: ["eslippers"] },
	mpaladin: { helmet: ["mpalhelmet"], chest: ["mpalarmor"], pants: ["mpalpants"], gloves: ["mpalgloves"], shoes: ["mpalboots"] },
});
const SET_WEIGHTS = Object.freeze({ tiger: "heavy", fury: "heavy", legends: "heavy", wt3: "heavy", wt4: "heavy", mwarrior: "heavy", mpaladin: "heavy", vampires: "medium", swift: "medium", holidays: "medium", wanderers: "medium", rugged: "medium", mranger: "medium", mrogue: "medium", mmerchant: "medium", mpx: "light", mmage: "light", mpriest: "light", bunny: "light" });
const PLANNED_ITEM_SOURCES = Object.freeze({ tigerarmor: "tigerhelmet", tigerpants: "tigerhelmet", tigergloves: "tigerhelmet", tigerboots: "tigerhelmet", vhelmet: "vgloves", vpants: "vattire", mpxhelmet: "mpxgloves", mpxarmor: "mpxgloves", mpxpants: "mpxgloves", mpxboots: "mpxgloves", furyarmor: "fury", furygloves: "fury", furyboots: "fury", legendhelmet: "warpvest", legendboots: "warpvest", swifthelmet: "wingedboots", swiftarmor: "wingedboots", swiftpants: "wingedboots", epants: "epyjamas", egloves: "epyjamas", mpalhelmet: "mwhelmet", mpalarmor: "mwarmor", mpalpants: "mwpants", mpalgloves: "mwgloves", mpalboots: "mwboots" });
const SET_SIGNATURES = Object.freeze({
	tiger: ["speed", "evasion"], fury: ["frequency", "apiercing"], legends: ["dreturn", "reflection"], wt3: ["pnresistance", "stresistance"], wt4: ["reflection", "firesistance"], mwarrior: ["crit", "apiercing"], mpaladin: ["lifesteal", "stresistance"], vampires: ["lifesteal", "manasteal"], swift: ["frequency", "evasion"], holidays: ["fzresistance", "stresistance"], wanderers: ["speed", "range"], rugged: ["pnresistance", "phresistance"], mranger: ["range", "apiercing"], mrogue: ["evasion", "crit"], mmerchant: ["dreturn", "speed"], mpx: ["mp_reduction", "manasteal"], mmage: ["rpiercing", "crit"], mpriest: ["mp_reduction", "stresistance"], bunny: ["speed", "reflection"],
});
const PLANNED_ITEM_IDENTITIES = Object.freeze({
	tigerarmor: { type: "chest", name: "Armor of the Tiger", set: "tiger", weight: "heavy", asset: "tigerhelmet" },
	tigerpants: { type: "pants", name: "Pants of the Tiger", set: "tiger", weight: "heavy", asset: "tigerhelmet" },
	tigergloves: { type: "gloves", name: "Gloves of the Tiger", set: "tiger", weight: "heavy", asset: "tigerhelmet" },
	tigerboots: { type: "shoes", name: "Boots of the Tiger", set: "tiger", weight: "heavy", asset: "tigerhelmet" },
	vhelmet: { type: "helmet", name: "Vampiric Hood", set: "vampires", weight: "medium", asset: "vgloves" },
	vpants: { type: "pants", name: "Vampiric Pants", set: "vampires", weight: "medium", asset: "vattire" },
	mpxhelmet: { type: "helmet", name: "Mana Hood", set: "mpx", weight: "light", asset: "mpxgloves" },
	mpxarmor: { type: "chest", name: "Mana Robe", set: "mpx", weight: "light", asset: "mpxgloves" },
	mpxpants: { type: "pants", name: "Mana Pants", set: "mpx", weight: "light", asset: "mpxgloves" },
	mpxboots: { type: "shoes", name: "Mana Boots", set: "mpx", weight: "light", asset: "mpxgloves" },
	furyarmor: { type: "chest", name: "Armor of Fury", set: "fury", weight: "heavy", asset: "fury" },
	furygloves: { type: "gloves", name: "Gloves of Fury", set: "fury", weight: "heavy", asset: "fury" },
	furyboots: { type: "shoes", name: "Boots of Fury", set: "fury", weight: "heavy", asset: "fury" },
	legendhelmet: { type: "helmet", name: "Legendary Visor", set: "legends", weight: "heavy", asset: "warpvest" },
	legendboots: { type: "shoes", name: "Legendary Boots", set: "legends", weight: "heavy", asset: "warpvest" },
	swifthelmet: { type: "helmet", name: "Helm of Swift Judgement", set: "swift", weight: "medium", asset: "wingedboots" },
	swiftarmor: { type: "chest", name: "Armor of Swift Judgement", set: "swift", weight: "medium", asset: "wingedboots" },
	swiftpants: { type: "pants", name: "Pants of Swift Judgement", set: "swift", weight: "medium", asset: "wingedboots" },
	epants: { type: "pants", name: "Fluffy Pants", set: "bunny", weight: "light", asset: "epyjamas" },
	egloves: { type: "gloves", name: "Fluffy Gloves", set: "bunny", weight: "light", asset: "epyjamas" },
	mpalhelmet: { type: "helmet", name: "Helmet of the Hunter Paladin", set: "mpaladin", weight: "heavy", asset: "mwhelmet" },
	mpalarmor: { type: "chest", name: "Armor of the Hunter Paladin", set: "mpaladin", weight: "heavy", asset: "mwarmor" },
	mpalpants: { type: "pants", name: "Underarmor of the Hunter Paladin", set: "mpaladin", weight: "heavy", asset: "mwpants" },
	mpalgloves: { type: "gloves", name: "Gloves of the Hunter Paladin", set: "mpaladin", weight: "heavy", asset: "mwgloves" },
	mpalboots: { type: "shoes", name: "Boots of the Hunter Paladin", set: "mpaladin", weight: "heavy", asset: "mwboots" },
});
const REVIEWED_WEIGHT_INVENTORY = Object.freeze({
	heavy: ["fallen", "fury", "gphelmet", "harmor", "hboots", "hgloves", "hhelmet", "hpants", "mwarmor", "mwboots", "mwgloves", "mwhelmet", "mwpants", "oxhelmet", "phelmet", "spikedhelmet", "tigerhelmet", "xarmor", "xboots", "xgloves", "xhelmet", "xpants", "tigercape", "tigershield"],
	medium: ["bcape", "cape", "coat", "coat1", "fcape", "gloves", "gloves1", "helmet", "helmet1", "horsecape", "horsecapeg", "mchat", "mcape", "mcarmor", "mcboots", "mcgloves", "mcpants", "mrarmor", "mrboots", "mrgloves", "mrhood", "mrnarmor", "mrnboots", "mrngloves", "mrnhat", "mrnpants", "mrpants", "pants", "pants1", "shoes", "shoes1", "stealthcape", "swiftarmor", "swifthelmet", "swiftpants", "vattire", "vboots", "vcape", "vgloves", "vhelmet", "vpants", "wattire", "wcap", "wbreeches", "wgloves", "wingedboots", "wshoes", "xmasshoes", "xmashat", "xmassweater", "xmaspants", "sweaterhs", "mittens", "supermittens"],
	light: ["angelwings", "bunnyears", "cdragon", "cyber", "eears", "ecape", "egloves", "epants", "epyjamas", "eslippers", "frankypants", "gcape", "ghatb", "ghatp", "handofmidas", "iceskates", "luckyt", "mageshood", "mmarmor", "mmhat", "mmshoes", "mmpants", "mparmor", "mphat", "mpgloves", "mpxarmor", "mpxboots", "mpxgloves", "mpxhelmet", "mpxpants", "mpshoes", "mppants", "partyhat", "poker", "pyjamas", "rednose", "snowboots", "tshirt0", "tshirt1", "tshirt2", "tshirt3", "tshirt4", "tshirt6", "tshirt7", "tshirt8", "tshirt88", "tshirt9"],
});
const REVIEWED_EXCLUSIONS = Object.freeze({
	bunnyears: { reason: "unsupported", source_evidence: "design/drops.js:commented bunny event entry" },
	ecape: { reason: "event", source_evidence: "design/drops.js:wabbit event source" },
	fcape: { reason: "event", source_evidence: "design/drops.js:phoenix event source" },
	frankypants: { reason: "event", source_evidence: "design/drops.js:franky event source" },
	gcape: { reason: "event", source_evidence: "design/drops.js:grinch event source" },
	ghatb: { reason: "hidden", source_evidence: "design/items.js:unpublished cosmetic helmet" },
	ghatp: { reason: "hidden", source_evidence: "design/items.js:unpublished cosmetic helmet" },
	mageshood: { reason: "hidden", source_evidence: "design/items.js:ignore" },
	poker: { reason: "unsupported", source_evidence: "design/drops.js:mini-game reward; no combat normal route" },
	powerglove: { reason: "unsupported", source_evidence: "design/drops.js:cooperative-only Legend alternative" },
	pyjamas: { reason: "hidden", source_evidence: "design/drops.js:commented event entry" },
	snowboots: { reason: "event", source_evidence: "design/items.js:seasonal item without permanent route" },
	tigercape: { reason: "event", source_evidence: "design/drops.js:drops.tiger cooperative event source" },
	tigerhelmet: { reason: "event", source_evidence: "design/drops.js:drops.tiger cooperative event source" },
	tigershield: { reason: "event", source_evidence: "design/drops.js:drops.tiger cooperative event source" },
	cdragon: { reason: "event", source_evidence: "design/drops.js:lunar-new-year event source" },
	gphelmet: { reason: "event", source_evidence: "design/drops.js:halloween event source" },
	lantern: { reason: "event", source_evidence: "design/drops.js:halloween event source" },
	horsecapeg: { reason: "event", source_evidence: "design/drops.js:dragold event source" },
	iceskates: { reason: "event", source_evidence: "design/drops.js:grinch event source" },
	mshield: { reason: "event", source_evidence: "design/drops.js:holiday event source" },
	oxhelmet: { reason: "event", source_evidence: "design/drops.js:lunar-new-year event source" },
	phelmet: { reason: "event", source_evidence: "design/drops.js:halloween event source" },
	rednose: { reason: "event", source_evidence: "design/drops.js:holiday event source" },
});
const OPTIONAL_EVENT_SET_PEERS = Object.freeze({
	tiger: { permanent_peer_set_id: "fury", rationale: "Tiger routes are cooperative-event evidence; Fury is its permanent acquisition peer." },
	mpx: { permanent_peer_set_id: "mmage", rationale: "MP X routes are Franky-event evidence; Monster Hunter Mage is its permanent acquisition peer." },
	legends: { permanent_peer_set_id: "wt4", rationale: "Legends routes are Halloween-event evidence; Darkforge is its permanent acquisition peer." },
	bunny: { permanent_peer_set_id: "mpriest", rationale: "Bunny routes are Wabbit-event evidence; Monster Hunter Priest is its permanent acquisition peer." },
	holidays: { permanent_peer_set_id: "wanderers", rationale: "Holiday routes are seasonal-event evidence; Wanderer's is its permanent acquisition peer." },
});
const redistributed = (source_table, source_route_id, source_share) => ({ kind: "drop_redistribution", source_table, source_route_id, source_share });
const eventOnly = (source_item_id, source_evidence = null, options = {}) => ({ kind: "event_sidegrade", source_item_id, source_evidence, ...options });
const PLANNED_ROUTE_DISTRIBUTIONS = Object.freeze({
	tigerhelmet: { optional_event: eventOnly("tigerhelmet", "design/drops.js:drops.tiger cooperative event source", { source_table: "monsters.tiger", source_route_id: "event-monster:tiger", source_share: 0.2, direct_source_entry: true }) },
	tigerarmor: { optional_event: eventOnly("tigerarmor", "design/drops.js:drops.tiger cooperative event source", { source_table: "monsters.tiger", source_route_id: "event-monster:tiger", source_share: 0.2, direct_source_entry: true }) },
	tigerpants: { optional_event: eventOnly("tigerpants", "design/drops.js:drops.tiger cooperative event source", { source_table: "monsters.tiger", source_route_id: "event-monster:tiger", source_share: 0.2, direct_source_entry: true }) },
	tigergloves: { optional_event: eventOnly("tigergloves", "design/drops.js:drops.tiger cooperative event source", { source_table: "monsters.tiger", source_route_id: "event-monster:tiger", source_share: 0.2, direct_source_entry: true }) },
	tigerboots: { optional_event: eventOnly("tigerboots", "design/drops.js:drops.tiger cooperative event source", { source_table: "monsters.tiger", source_route_id: "event-monster:tiger", source_share: 0.2, direct_source_entry: true }) },
	vgloves: { permanent: redistributed("drops.monsters.a3", "monster:a3", 0.5) },
	vhelmet: { permanent: redistributed("drops.monsters.a3", "monster:a3", 0.5) },
	vattire: { permanent: redistributed("drops.monsters.a1", "monster:a1", 0.5) },
	vpants: { permanent: redistributed("drops.monsters.a1", "monster:a1", 0.5) },
	mpxgloves: { optional_event: eventOnly("mpxgloves", null, { source_group: "franky", source_share: 0.2, direct_source_entry: true }) },
	mpxhelmet: { optional_event: eventOnly("mpxhelmet", null, { source_group: "franky", source_share: 0.2, direct_source_entry: true }) },
	mpxarmor: { optional_event: eventOnly("mpxarmor", null, { source_group: "franky", source_share: 0.2, direct_source_entry: true }) },
	mpxpants: { optional_event: eventOnly("mpxpants", null, { source_group: "franky", source_share: 0.2, direct_source_entry: true }) },
	mpxboots: { optional_event: eventOnly("mpxboots", null, { source_group: "franky", source_share: 0.2, direct_source_entry: true }) },
	fury: { permanent: redistributed("drops.maps.main", "map:main:monster:scorpion", 0.2) },
	fallen: { permanent: redistributed("drops.maps.main", "map:main:monster:scorpion", 0.2), event: { source_item_id: "fallen" } },
	furyarmor: { permanent: redistributed("drops.maps.main", "map:main:monster:scorpion", 0.2) },
	furygloves: { permanent: redistributed("drops.maps.main", "map:main:monster:scorpion", 0.2) },
	furyboots: { permanent: redistributed("drops.maps.main", "map:main:monster:scorpion", 0.2) },
	warpvest: { optional_event: eventOnly("warpvest", null, { source_group: "mysterybox", source_share: 1 / 3, direct_source_entry: true }) },
	legendhelmet: { optional_event: eventOnly("legendhelmet", null, { source_group: "mysterybox", source_share: 1 / 3, direct_source_entry: true }) },
	legendboots: { optional_event: eventOnly("legendboots", null, { source_group: "mysterybox", source_share: 1 / 3, direct_source_entry: true }) },
	goldenpowerglove: { optional_event: eventOnly("goldenpowerglove") },
	swifthelmet: { permanent: { kind: "recipe_copy", source_item_id: "wingedboots", source_table: "craft.wingedboots" } },
	swiftarmor: { permanent: { kind: "recipe_copy", source_item_id: "wingedboots", source_table: "craft.wingedboots" } },
	swiftpants: { permanent: { kind: "recipe_copy", source_item_id: "wingedboots", source_table: "craft.wingedboots" } },
	eears: { optional_event: eventOnly("eears", null, { source_group: "basketofeggs", source_share: 1 / 3, direct_source_entry: true }) },
	epyjamas: { optional_event: eventOnly("epyjamas", null, { source_group: "basketofeggs", source_share: 1 / 9, direct_source_entry: true }) },
	epants: { optional_event: eventOnly("epants", null, { source_group: "basketofeggs", source_share: 1 / 9, direct_source_entry: true }) },
	egloves: { optional_event: eventOnly("egloves", null, { source_group: "basketofeggs", source_share: 1 / 9, direct_source_entry: true }) },
	eslippers: { optional_event: eventOnly("eslippers", null, { source_group: "basketofeggs", source_share: 1 / 3, direct_source_entry: true }) },
	xmashat: { optional_event: eventOnly("xmashat") },
	xmassweater: { optional_event: eventOnly("xmassweater") },
	sweaterhs: { optional_event: eventOnly("sweaterhs") },
	xmaspants: { optional_event: eventOnly("xmaspants") },
	mittens: { optional_event: eventOnly("mittens") },
	supermittens: { optional_event: eventOnly("supermittens") },
	xmasshoes: { optional_event: eventOnly("xmasshoes") },
	mpalhelmet: { permanent: { kind: "token_exchange", token_id: "monstertoken", token_quantity: 7, source_table: "tokens.monstertoken.mpalhelmet" } },
	mpalarmor: { permanent: { kind: "token_exchange", token_id: "monstertoken", token_quantity: 12, source_table: "tokens.monstertoken.mpalarmor" } },
	mpalpants: { permanent: { kind: "token_exchange", token_id: "monstertoken", token_quantity: 11, source_table: "tokens.monstertoken.mpalpants" } },
	mpalgloves: { permanent: { kind: "token_exchange", token_id: "monstertoken", token_quantity: 8, source_table: "tokens.monstertoken.mpalgloves" } },
	mpalboots: { permanent: { kind: "token_exchange", token_id: "monstertoken", token_quantity: 15, source_table: "tokens.monstertoken.mpalboots" } },
});
const EXPLICIT_MONSTER_DIAGNOSTIC_REASONS = Object.freeze({
	chestm: "special",
	rudolph: "event",
	goldenbot: "scripted_mechanic",
	kitty1: "special",
	kitty2: "special",
	kitty3: "special",
	kitty4: "special",
	puppy1: "special",
	puppy2: "special",
	puppy3: "special",
	puppy4: "special",
	cutebee: "event",
	goldenbat: "event",
	eelemental: "special",
	felemental: "special",
	nelemental: "special",
	welemental: "special",
	ligerx: "special",
	nerfedbat: "special",
	nerfedmummy: "special",
});

function readSourceAtCommit(commit, filename) {
	const result = childProcess.spawnSync("git", ["show", `${commit}:${filename}`], {
		cwd: REPOSITORY_ROOT,
		encoding: "utf8",
	});
	if (result.status !== 0) throw new Error(`Unable to read pinned source ${filename}: ${result.stderr.trim()}`);
	return result.stdout;
}

function readPinnedSource(filename) {
	return readSourceAtCommit(PINNED_COMMIT, filename);
}

function sourceValue(source, dottedPath) {
	return dottedPath.split(".").reduce((value, key) => value?.[key], source);
}

function sourceWeight(entries, itemIds) {
	return Number((entries.filter((entry) => itemIds.includes(entry[1])).reduce((sum, entry) => sum + Number(entry[0]), 0)).toPrecision(12));
}

function sourceOpenWeight(entries, tableId) {
	return Number((entries.filter((entry) => entry[1] === "open" && entry[2] === tableId).reduce((sum, entry) => sum + Number(entry[0]), 0)).toPrecision(12));
}

function loadPrePlanTwoSources() {
	const context = { Math, console: { log() {}, error() {} }, items: {}, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	for (const filename of ["design/recipes.js", "design/tokens.js", "design/drops.js"])
		vm.runInContext(readSourceAtCommit(PRE_PLAN_TWO_COMMIT, filename), context, { filename, timeout: 250 });
	return { craft: context.craft, drops: context.drops, tokens: context.tokens };
}

function buildRebalanceSourceAudit(data) {
	const before = loadPrePlanTwoSources();
	const tablePaths = ["monsters.tiger", "monsters.a1", "monsters.a3", "monsters.franky", "armorbox", "mysterybox", "basketofeggs", "tigerarmorbox", "vampirea1armorbox", "vampirea3armorbox", "mpxarmorbox"];
	const sourceTableHashes = Object.fromEntries(tablePaths.map((tablePath) => {
		const previous = sourceValue(before.drops, tablePath);
		const current = sourceValue(data.drops, tablePath);
		return [tablePath, { before: previous === undefined ? null : sha256(previous), after: current === undefined ? null : sha256(current) }];
	}));
	const dropThemes = {
		tiger: { before_mass: sourceWeight(before.drops.monsters.tiger, ["tigerhelmet"]), after_mass: sourceOpenWeight(data.drops.monsters.tiger, "tigerarmorbox") },
		vampires: { before_mass: sourceWeight(before.drops.monsters.a1, ["vattire"]) + sourceWeight(before.drops.monsters.a3, ["vgloves"]), after_mass: sourceOpenWeight(data.drops.monsters.a1, "vampirea1armorbox") + sourceOpenWeight(data.drops.monsters.a3, "vampirea3armorbox") },
		mpx: { before_mass: sourceWeight(before.drops.monsters.franky, ["mpxgloves"]), after_mass: sourceOpenWeight(data.drops.monsters.franky, "mpxarmorbox") },
		fury: { before_mass: sourceWeight(before.drops.armorbox, ["fury"]), after_mass: sourceWeight(data.drops.armorbox, ["fury", "furyarmor", "fallen", "furygloves", "furyboots"]) },
		legends: { before_mass: sourceWeight(before.drops.mysterybox, ["warpvest"]), after_mass: sourceWeight(data.drops.mysterybox, ["warpvest", "legendhelmet", "legendboots"]) },
		bunny: { before_mass: sourceWeight(before.drops.basketofeggs, ["epyjamas"]), after_mass: sourceWeight(data.drops.basketofeggs, ["epyjamas", "epants", "egloves"]) },
	};
	const swiftIds = ["swifthelmet", "swiftarmor", "swiftpants"];
	const recipes = Object.fromEntries(swiftIds.map((itemId) => [itemId, {
		before: before.craft[itemId] || null,
		after: data.craft[itemId],
		source_recipe_id: "wingedboots",
		source_recipe: data.craft.wingedboots,
		after_hash: sha256(data.craft[itemId]),
	}]));
	const tokenIds = ["mpalhelmet", "mpalarmor", "mpalpants", "mpalgloves", "mpalboots"];
	const tokenCosts = Object.fromEntries(tokenIds.map((itemId) => [itemId, { before: before.tokens.monstertoken[itemId] ?? null, after: data.tokens.monstertoken[itemId] }]));
	return { previous_commit: PRE_PLAN_TWO_COMMIT, source_table_hashes: sourceTableHashes, drop_themes: dropThemes, recipes, token_costs: tokenCosts, recipe_table_hash: sha256(Object.fromEntries(swiftIds.map((itemId) => [itemId, data.craft[itemId]]))), token_table_hash: sha256(Object.fromEntries(tokenIds.map((itemId) => [itemId, data.tokens.monstertoken[itemId]]))) };
}

function mapPercentileToLevel(percentile, maximum = 70) {
	if (!Number.isFinite(percentile) || percentile < 0 || percentile > 1 || !Number.isInteger(maximum) || maximum < 1)
		throw new Error("Invalid rank percentile or maximum level");
	return Math.round(1 + (maximum - 1) * percentile);
}

function reviewedWeightMap(data) {
	const mapping = new Map();
	for (const [weight, ids] of Object.entries(REVIEWED_WEIGHT_INVENTORY)) for (const itemId of ids) {
		if (!data.items[itemId] && !PLANNED_ITEM_IDENTITIES[itemId]) throw new Error(`Reviewed weight inventory references unknown item ${itemId}`);
		if (mapping.has(itemId)) throw new Error(`Reviewed weight inventory duplicates ${itemId}`);
		mapping.set(itemId, weight);
	}
	for (const [setId, slots] of Object.entries(ARMOR_SET_SLOTS)) for (const itemId of Object.values(slots).flat()) {
		if (!data.items[itemId] && !PLANNED_ITEM_IDENTITIES[itemId]) continue;
		const weight = SET_WEIGHTS[setId];
		if (mapping.has(itemId) && mapping.get(itemId) !== weight) throw new Error(`Reviewed set weight conflicts for ${itemId}`);
		mapping.set(itemId, weight);
	}
	for (const [itemId, identity] of Object.entries(PLANNED_ITEM_IDENTITIES)) {
		if (mapping.has(itemId) && mapping.get(itemId) !== identity.weight) throw new Error(`Planned item weight conflicts for ${itemId}`);
		mapping.set(itemId, identity.weight);
	}
	return mapping;
}

function reviewedWeight(itemId, item, mapping) {
	if (["shield", "source", "quiver", "misc_offhand"].includes(item.type)) return null;
	const weight = mapping.get(itemId);
	if (!weight) throw new Error(`No reviewed weight classification for ${itemId}`);
	return weight;
}

function reviewedNonWeaponCatalog(data = loadSourceData()) {
	const { resolver } = buildProductionAcquisitionResolver({ data, evidence: loadRankingFixture() });
	const weights = reviewedWeightMap(data);
	const excluded = [];
	const optional_event_rows = [];
	const rows = Object.entries(data.items)
		.filter(([, item]) => CORE_TYPES.has(item.type))
		.map(([item_id, item]) => {
			reviewedWeight(item_id, item, weights);
			const routes = resolver.allRoutes(item_id);
			const permanentRoutes = routes.filter((route) => routeAvailability(route) === "permanent");
			if (!permanentRoutes.length) {
				if (PLANNED_ROUTE_DISTRIBUTIONS[item_id]) return null;
				const review = REVIEWED_EXCLUSIONS[item_id];
				if (!review) throw new Error(`Unreviewed acquisition exclusion for ${item_id}`);
				if (review.reason === "event") {
					const rawEventRoutes = routes.filter((route) => routeAvailability(route) === "event");
					const sidegradePlan = REVIEWED_EVENT_SIDEGRADE_PLANS[item_id];
					const plannedSidegrade = !rawEventRoutes.length && sidegradePlan
						? plannedEventRoute(item_id, sidegradePlan, null, null, null, data)
						: null;
					const eventRoutes = rawEventRoutes.length
						? rawEventRoutes.map((route) => compactRouteEvidence({ item_id, ...route }))
						: plannedSidegrade ? [compactRouteEvidence(plannedSidegrade)] : [];
					optional_event_rows.push({
						item_id,
						type: item.type,
						reason: review.reason,
						evidence: review.source_evidence,
						routes: eventRoutes.length ? eventRoutes : [{
							item_id,
							source_item_id: item_id,
							selected_route_id: `event-evidence:${item_id}`,
							availability: "event",
							source_evidence: review.source_evidence,
							allocation: { kind: "reviewed_event_evidence", source_evidence: review.source_evidence },
						}],
					});
					if (sidegradePlan) {
						const route = rawEventRoutes[0] || (plannedSidegrade && {
							...plannedSidegrade,
							route_id: plannedSidegrade.selected_route_id,
							effort: plannedSidegrade.selected_effort,
							kind: "event_drop",
							dependency_route_ids: plannedSidegrade.dependency_chain,
						});
						if (!route) throw new Error(`Reviewed event sidegrade ${item_id} has no event route`);
						return {
							item_id,
							type: item.type,
							weight: reviewedWeight(item_id, item, weights),
							routes: rawEventRoutes.length ? rawEventRoutes : [route],
							route,
							effort: route.effort,
						};
					}
					return null;
				}
				excluded.push({ item_id, type: item.type, ...review });
				return null;
			}
			const route = permanentRoutes[0];
			return {
				item_id,
				type: item.type,
				weight: reviewedWeight(item_id, item, weights),
				routes: permanentRoutes,
				route,
				effort: route.effort,
			};
		})
		.filter(Boolean);
	return {
		rows: rows.sort((left, right) => left.item_id.localeCompare(right.item_id)),
		excluded: excluded.sort((left, right) => left.item_id.localeCompare(right.item_id)),
		optional_event_rows: optional_event_rows.sort((left, right) => left.item_id.localeCompare(right.item_id)),
	};
}

function compactAcquisitionRow(row) {
	return {
		item_id: row.item_id,
		type: row.type,
		weight: row.weight,
		selected_route_id: row.route.route_id,
		selected_effort: row.route.effort,
		availability: routeAvailability(row.route),
		dependency_chain: row.route.dependency_route_ids || [],
		...(row.legal_hand_profile ? { legal_hand_profile: row.legal_hand_profile } : {}),
	};
}

function rankLadder(ladderId, rows, combinedPercentiles) {
	const combined = new Map(combinedPercentiles.map((row) => [row.item_id, row.percentile]));
	const ranked = assignPercentiles(rows.map((row) => ({ item_id: row.item_id, effort: row.effort })), {
		threshold: 0.05,
		combinedPercentile: rows.length === 1 ? combined.get(rows[0].item_id) : null,
	});
	let tieBand = 0;
	let previous;
	return ranked.map((rank) => {
		if (previous === undefined || rank.percentile !== previous) tieBand += 1;
		previous = rank.percentile;
		const source = rows.find((row) => row.item_id === rank.item_id);
		return {
			...compactAcquisitionRow(source),
			ladder_id: ladderId,
			tie_band: tieBand,
			percentile: rank.percentile,
			mapped_level: mapPercentileToLevel(rank.percentile),
			unlock: mapPercentileToLevel(rank.percentile, 99),
		};
	});
}

function rankArmorSets(sets) {
	const complete = Object.entries(sets)
		.filter(([, set]) => Number.isFinite(set.ranking_effort))
		.map(([set_id, set]) => ({ item_id: set_id, effort: set.ranking_effort, set }));
	const byWeight = new Map(["heavy", "medium", "light"].map((weight) => [weight, []]));
	for (const row of complete) byWeight.get(row.set.weight).push(row);
	return Object.fromEntries([...byWeight].map(([weight, rows]) => {
		const ladderRows = rows.map(({ item_id, effort, set }) => ({ item_id, effort, type: "armor_set", weight, route: { route_id: `set:${item_id}`, effort, dependency_route_ids: [], kind: "functional_set" }, set }));
		return [weight, rankLadder(`armor_sets:${weight}`, ladderRows, assignPercentiles(ladderRows.map(({ item_id, effort }) => ({ item_id, effort })))).map(({ item_id, selected_effort, tie_band, percentile, mapped_level, unlock }) => ({ set_id: item_id, selected_effort, tie_band, percentile, mapped_level, unlock, ...(sets[item_id].optional_event_sidegrade ? { optional_event_sidegrade: sets[item_id].optional_event_sidegrade } : {}) }))];
	}));
}

function routeAvailability(route) {
	return route.kind === "event_drop" || route.event_id || String(route.route_id).startsWith("event:") || String(route.route_id).startsWith("event-monster:") ? "event" : "permanent";
}

function routeSourceKey(route) {
	const routeId = route.source_route_id || route.route_id || route.selected_route_id;
	return route.source_key || (route.effective_probability === undefined ? `independent:${routeId}` : `${route.source_path}:${routeId}`);
}

function sourceEventComponents(route, source_key) {
	const components = route.probability_components || [];
	if (!components.length) return null;
	return components.map((component, index) => {
		const match = String(component.path || "").match(/(?:^| > )entry:(\d+)/);
		const outcome_probability = Number(component.effective_probability);
		if (!(outcome_probability > 0 && outcome_probability <= 1)) throw new Error(`Invalid source component for ${route.item_id || route.route_id}`);
		return {
			event_key: `${source_key}:entry:${match ? match[1] : `component:${index}`}`,
			outcome_probability,
		};
	});
}

function routeDistribution(route) {
	if (route.distribution) return route.distribution;
	const allocation = route.allocation;
	if (allocation?.kind === "drop_redistribution" || allocation?.kind === "event_sidegrade" && Number.isFinite(Number(allocation.source_share))) {
		const outcome_probability = Number(allocation.source_share);
		const encounter_effort = Number(route.selected_effort) * outcome_probability;
		if (!(outcome_probability > 0 && outcome_probability <= 1 && encounter_effort > 0)) throw new Error(`Invalid planned distribution for ${route.item_id}`);
		return {
			source_key: `${allocation.source_table}:${allocation.source_route_id}`,
			correlation: "exclusive_allocation",
			outcome_probability,
			encounter_effort: Number(encounter_effort.toPrecision(12)),
		};
	}
	const outcome_probability = Number(route.effective_probability ?? 1);
	const selected_effort = Number(route.selected_effort ?? route.effort);
	if (!(outcome_probability > 0 && outcome_probability <= 1 && selected_effort >= 0)) throw new Error(`Invalid resolved distribution for ${route.item_id || route.route_id}`);
	const source_key = routeSourceKey(route);
	return {
		source_key,
		correlation: "source_entry",
		outcome_probability,
		encounter_effort: Number((selected_effort * outcome_probability).toPrecision(12)),
		...(sourceEventComponents(route, source_key) ? { source_event_components: sourceEventComponents(route, source_key) } : {}),
	};
}

function sourceRoute(resolver, itemId, routeId, availability = "permanent") {
	const routes = resolver.allRoutes(itemId).filter((route) => routeAvailability(route) === availability);
	const selected = routeId ? routes.find((route) => route.route_id === routeId) : routes[0];
	if (!selected) throw new Error(`Reviewed route ${routeId || availability} for ${itemId} is unavailable`);
	return selected;
}

function sourceRouteByEvidence(resolver, routePlan, itemId) {
	const expectedSourcePath = `design/drops.js:${routePlan.source_table}`;
	const selected = resolver.allRoutes(itemId).find((route) => route.route_id === routePlan.source_route_id && route.source_path === expectedSourcePath);
	if (selected) return selected;
	throw new Error(`Reviewed route ${routePlan.source_route_id} is unavailable for ${itemId} from ${routePlan.source_table}`);
}

function plannedRoute(itemId, routePlan, resolver, data) {
	if (routePlan.kind === "token_exchange") {
		const tokenRoute = sourceRoute(resolver, routePlan.token_id);
		return {
			item_id: itemId,
			source_item_id: routePlan.token_id,
			route_id: `planned:${itemId}:token:${routePlan.token_id}`,
			selected_route_id: `planned:${itemId}:token:${routePlan.token_id}`,
			selected_effort: Number((Number(tokenRoute.effort) * Number(routePlan.token_quantity)).toPrecision(12)),
			availability: "permanent",
			dependency_chain: [tokenRoute.route_id, ...(tokenRoute.dependency_route_ids || [])].sort(),
			token_quantity: routePlan.token_quantity,
			allocation: { kind: routePlan.kind, source_table: routePlan.source_table, token_id: routePlan.token_id, token_quantity: routePlan.token_quantity },
		};
	}
	if (routePlan.kind === "recipe_copy") {
		const source = sourceRoute(resolver, routePlan.source_item_id);
		return {
			item_id: itemId,
			source_item_id: routePlan.source_item_id,
			route_id: `planned:${itemId}:${source.route_id}`,
			selected_route_id: `planned:${itemId}:${source.route_id}`,
			selected_effort: source.effort,
			availability: "permanent",
			dependency_chain: source.dependency_route_ids || [],
			allocation: { kind: routePlan.kind, source_table: routePlan.source_table, copied_route_id: source.route_id, copied_cost: source.gold_cost || 0, copied_inputs: source.recursive_inputs || [] },
		};
	}
	const source = sourceRouteByEvidence(resolver, routePlan, itemId);
	if (!(Number(routePlan.source_share) > 0 && Number(routePlan.source_share) <= 1)) throw new Error(`Planned route ${itemId} has invalid source share`);
	if (source.source_path !== `design/drops.js:${routePlan.source_table}`)
		throw new Error(`Planned route ${itemId} source table ${routePlan.source_table} does not match ${source.source_path}`);
	const encounterEffort = Number((Number(source.effort) * Number(source.effective_probability ?? 1)).toPrecision(12));
	const outcomeProbability = Number(source.effective_probability);
	if (!(outcomeProbability > 0 && outcomeProbability <= 1)) throw new Error(`Planned route ${itemId} has invalid published source probability`);
	return {
		item_id: itemId,
		source_item_id: itemId,
		route_id: `planned:${itemId}:${source.route_id}`,
		selected_route_id: `planned:${itemId}:${source.route_id}`,
		selected_effort: Number((encounterEffort / outcomeProbability).toPrecision(12)),
		availability: "permanent",
		dependency_chain: source.dependency_route_ids || [],
		allocation: { kind: routePlan.kind, source_table: routePlan.source_table, source_route_id: source.route_id, source_share: routePlan.source_share, conserved_reward_mass: true },
		distribution: { source_key: `${routePlan.source_table}:${source.route_id}`, correlation: "exclusive_allocation", outcome_probability: outcomeProbability, encounter_effort: encounterEffort },
	};
}

function sourceTable(data, source_table) {
	const value = String(source_table || "").split(".").reduce((current, key) => current?.[key], data.drops);
	if (!Array.isArray(value)) throw new Error(`Reviewed event source ${source_table} is not a direct drop table`);
	return value;
}

function directEventEvidence(itemId, eventPlan, data) {
	if (!eventPlan.source_table || !eventPlan.source_route_id) return null;
	const entries = sourceTable(data, eventPlan.source_table);
	const source_probability = dropOutcomeProbability(entries, eventPlan.source_item_id, data.drops, { items: data.items });
	if (!(source_probability > 0 && source_probability <= 1))
		throw new Error(`Reviewed event source ${eventPlan.source_table} lacks ${eventPlan.source_item_id}`);
	return {
		source_key: `design/drops.js:drops.${eventPlan.source_table}:${eventPlan.source_route_id}`,
		source_probability,
		source_event_components: [],
	};
}

function plannedEventRoute(itemId, eventPlan, source, peer, permanent_counterpart, data) {
	const allocation = {
		kind: eventPlan.kind || "event_sidegrade",
		...(source ? { source_route_id: source.route_id, source_table: eventPlan.source_table || source.source_path } : { source_table: eventPlan.source_table, source_evidence: eventPlan.source_evidence }),
		...(Number.isFinite(Number(eventPlan.source_share)) ? { source_share: Number(eventPlan.source_share), conserved_reward_mass: true } : {}),
		...(permanent_counterpart ? { permanent_counterpart } : {}),
		...(peer ? { permanent_peer_set_id: peer.permanent_peer_set_id } : {}),
	};
	if (source) {
		const sourceDistribution = routeDistribution(source);
		const source_share = Number(eventPlan.source_share || 1);
		const outcome_probability = sourceDistribution.outcome_probability * (eventPlan.direct_source_entry ? 1 : source_share);
		return {
			item_id: itemId,
			source_item_id: eventPlan.source_item_id,
			route_id: `planned:${itemId}:${source.route_id}`,
			selected_route_id: `planned:${itemId}:${source.route_id}`,
			selected_effort: Number((sourceDistribution.encounter_effort / outcome_probability).toPrecision(12)),
			availability: "event",
			dependency_chain: source.dependency_route_ids || [],
			allocation,
			distribution: source_share === 1 && !eventPlan.direct_source_entry
				? sourceDistribution
				: { source_key: `event:${sourceDistribution.source_key}`, correlation: "exclusive_allocation", outcome_probability, encounter_effort: sourceDistribution.encounter_effort },
		};
	}
	const evidence = directEventEvidence(itemId, eventPlan, data);
	if (!evidence) {
		if (!eventPlan.source_evidence) throw new Error(`Reviewed event route ${eventPlan.route_id || "for " + eventPlan.source_item_id} is unavailable`);
		return {
			item_id: itemId,
			source_item_id: eventPlan.source_item_id,
			route_id: `planned:${itemId}:event-evidence`,
			selected_route_id: `planned:${itemId}:event-evidence`,
			availability: "event",
			source_evidence: eventPlan.source_evidence,
			allocation,
		};
	}
	const source_share = Number(eventPlan.source_share || 1);
	const outcome_probability = evidence.source_probability * (eventPlan.direct_source_entry ? 1 : source_share);
	return {
		item_id: itemId,
		source_item_id: eventPlan.source_item_id,
		route_id: `planned:${itemId}:${eventPlan.source_route_id}`,
		selected_route_id: `planned:${itemId}:${eventPlan.source_route_id}`,
		selected_effort: Number((1 / outcome_probability).toPrecision(12)),
		availability: "event",
		source_evidence: eventPlan.source_evidence,
		allocation,
		distribution: {
			source_key: evidence.source_key,
			correlation: "exclusive_allocation",
			outcome_probability,
			encounter_effort: 1,
			source_event_components: evidence.source_event_components,
		},
	};
}

function plannedRoutes(itemId, resolver, data) {
	const distribution = PLANNED_ROUTE_DISTRIBUTIONS[itemId];
	if (!distribution) return null;
	const routes = [];
	if (distribution.permanent) routes.push(plannedRoute(itemId, distribution.permanent, resolver, data));
	const eventPlan = distribution.event || distribution.optional_event;
	if (eventPlan) {
		const candidates = eventPlan.source_item_id ? resolver.allRoutes(eventPlan.source_item_id).filter((route) => routeAvailability(route) === "event") : [];
		const source = eventPlan.route_id ? candidates.find((route) => route.route_id === eventPlan.route_id) : candidates[0];
		const peer = OPTIONAL_EVENT_SET_PEERS[PLANNED_ITEM_IDENTITIES[itemId]?.set];
		routes.push(plannedEventRoute(itemId, eventPlan, source, peer, routes[0]?.selected_route_id, data));
	}
	return routes
		.sort((left, right) => (left.selected_effort ?? Infinity) - (right.selected_effort ?? Infinity) || left.selected_route_id.localeCompare(right.selected_route_id))
		.map((route) => Number.isFinite(route.selected_effort) ? { ...route, distribution: route.distribution || routeDistribution(route) } : route);
}

function validatePlannedRouteDistributions() {
	const groups = new Map();
	for (const [item_id, distribution] of Object.entries(PLANNED_ROUTE_DISTRIBUTIONS)) {
		const route = distribution.permanent;
		if (!route && !distribution.optional_event) throw new Error(`Planned route ${item_id} lacks reviewed source evidence`);
		if (route) {
			if (!route.kind || !route.source_table) throw new Error(`Planned route ${item_id} lacks permanent source evidence`);
			if (route.kind === "drop_redistribution") {
				const sourceKey = `${route.source_table}:${route.source_route_id}`;
				if (!groups.has(sourceKey)) groups.set(sourceKey, []);
				groups.get(sourceKey).push({ item_id, source_share: Number(route.source_share) });
			}
			if (route.kind === "token_exchange" && (!(Number(route.token_quantity) > 0) || !route.token_id)) throw new Error(`Planned token route ${item_id} is incomplete`);
		}
		const event = distribution.event || distribution.optional_event;
		if (event && Number.isFinite(Number(event.source_share))) {
			const sourceKey = `${event.source_table || "resolved"}:${event.source_group || event.source_route_id || event.source_item_id}`;
			if (!groups.has(sourceKey)) groups.set(sourceKey, []);
			groups.get(sourceKey).push({ item_id, source_share: Number(event.source_share) });
		}
	}
	for (const [source_table, rows] of groups) {
		const total = rows.reduce((sum, row) => sum + row.source_share, 0);
		if (Math.abs(total - 1) > 1e-12) throw new Error(`Planned redistribution ${source_table} does not conserve reward mass: ${total}`);
	}
	return true;
}

function expectedJointDropEffort(rows) {
	const distributions = rows.map((row) => ({ row, distribution: row.distribution || routeDistribution(row) }));
	const encounter_effort = distributions[0]?.distribution.encounter_effort;
	if (!(encounter_effort >= 0) || distributions.some(({ distribution }) => Math.abs(distribution.encounter_effort - encounter_effort) > Math.max(1e-6, Math.abs(encounter_effort) * 1e-11)))
		throw new Error("Joint drop completion requires one consistent source effort");
	return { encounter_effort, distributions };
}

function sourceActionOutcomes(source_key, rows) {
	const events = new Map();
	const add = (event_key, slotMask, probability) => {
		if (!events.has(event_key)) events.set(event_key, new Map());
		const outcomes = events.get(event_key);
		outcomes.set(slotMask, (outcomes.get(slotMask) || 0) + probability);
	};
	for (const { slotIndex, distribution } of rows) {
		const slotMask = 2 ** slotIndex;
		if (distribution.correlation === "exclusive_allocation") {
			add(`${source_key}:exclusive`, slotMask, distribution.outcome_probability);
			continue;
		}
		const components = distribution.source_event_components || [{ event_key: `${source_key}:single`, outcome_probability: distribution.outcome_probability }];
		for (const component of components) add(component.event_key, slotMask, component.outcome_probability);
	}
	let combinations = new Map([[0, 1]]);
	for (const [event_key, outcomes] of events) {
		const total = [...outcomes.values()].reduce((sum, probability) => sum + probability, 0);
		if (total > 1 + 1e-12) throw new Error(`Source event ${event_key} exceeds one outcome per encounter`);
		const eventOutcomes = [[0, Math.max(0, 1 - total)], ...outcomes.entries()];
		const next = new Map();
		for (const [mask, probability] of combinations) for (const [outcomeMask, outcomeProbability] of eventOutcomes) {
			const combinedMask = mask | outcomeMask;
			next.set(combinedMask, (next.get(combinedMask) || 0) + probability * outcomeProbability);
		}
		combinations = next;
	}
	return [...combinations.entries()].filter(([, probability]) => probability > 0);
}

function functionalCompletionEffort(slotRows, { availability = "permanent" } = {}) {
	const slots = Object.keys(slotRows);
	const alternatives = slots.map((slot) => slotRows[slot].filter((row) => row.availability === availability && Number.isFinite(row.selected_effort)));
	if (alternatives.some((rows) => !rows.length)) return null;
	const sources = new Map();
	for (const [slotIndex, rows] of alternatives.entries()) for (const row of rows) {
		const distribution = routeDistribution(row);
		if (!sources.has(distribution.source_key)) sources.set(distribution.source_key, []);
		sources.get(distribution.source_key).push({ row, slotIndex, distribution });
	}
	const actions = [...sources.entries()].map(([source_key, rows]) => {
		const { encounter_effort } = expectedJointDropEffort(rows.map((entry) => entry.row));
		return { source_key, encounter_effort, outcomes: sourceActionOutcomes(source_key, rows) };
	});
	const complete = 2 ** slots.length - 1;
	const expected = new Map([[complete, 0]]);
	const effortFor = (mask) => {
		if (expected.has(mask)) return expected.get(mask);
		const candidates = actions.map((action) => {
			let changed_probability = 0;
			let next_effort = action.encounter_effort;
			for (const [outcomeMask, probability] of action.outcomes) {
				const nextMask = mask | outcomeMask;
				if (nextMask === mask) continue;
				changed_probability += probability;
				next_effort += probability * effortFor(nextMask);
			}
			return changed_probability > 0 ? next_effort / changed_probability : Infinity;
		});
		const result = Math.min(...candidates);
		expected.set(mask, result);
		return result;
	};
	return Number(effortFor(0).toPrecision(12));
}

function compactRouteEvidence(route) {
	const compact = {
		item_id: route.item_id,
		source_item_id: route.source_item_id || route.item_id,
		selected_route_id: route.selected_route_id || route.route_id,
		selected_effort: route.selected_effort === undefined ? route.effort : route.selected_effort,
		availability: route.availability || routeAvailability(route),
		dependency_chain: route.dependency_chain || route.dependency_route_ids || [],
		...(route.allocation ? { allocation: route.allocation } : {}),
	};
	return { ...compact, distribution: routeDistribution({ ...route, ...compact }) };
}

function buildEquipmentAcquisitionFixture() {
	const data = loadSourceData();
	const evidence = loadRankingFixture();
	const shared = buildProductionAcquisitionResolver({ data, evidence });
	const { resolver } = shared;
	validatePlannedRouteDistributions();
	const catalog = reviewedNonWeaponCatalog(data);
	const candidates = catalog.rows;
	const selectedRoute = (itemId, setId) => {
		const projected = plannedRoutes(itemId, resolver, data);
		if (projected) {
			const optional = OPTIONAL_EVENT_SET_PEERS[setId];
			return projected.map((route) => optional && route.availability === "event"
				? { ...route, allocation: { ...route.allocation, permanent_peer_set_id: optional.permanent_peer_set_id } }
				: route);
		}
		const routes = ["permanent", "event"].flatMap((availability) => resolver.allRoutes(itemId).filter((route) => routeAvailability(route) === availability).slice(0, 1).map((route) => compactRouteEvidence({ item_id: itemId, ...route })));
		if (!routes.some((route) => route.availability === "permanent")) {
			const optional = OPTIONAL_EVENT_SET_PEERS[setId];
			if (optional && routes.some((route) => route.availability === "event"))
				return routes.filter((route) => route.availability === "event").map((route) => compactRouteEvidence({
					...route,
					item_id: itemId,
					allocation: { kind: "optional_event_sidegrade", source_route_id: route.selected_route_id, source_table: route.source_path, permanent_peer_set_id: optional.permanent_peer_set_id },
				}));
			const review = REVIEWED_EXCLUSIONS[itemId];
			if (!review) throw new Error(`Target item ${itemId} lacks a reviewed permanent route or exclusion`);
			return [{ item_id: itemId, source_item_id: itemId, exclusion: review.reason, source_evidence: review.source_evidence }];
		}
		return routes;
	};
	const armor_sets = Object.fromEntries(Object.entries(ARMOR_SET_SLOTS).map(([setId, slots]) => {
		const slotRows = Object.fromEntries(Object.entries(slots).map(([slot, ids]) => [slot, ids.flatMap((itemId) => selectedRoute(itemId, setId))]));
		const effort = functionalCompletionEffort(slotRows);
		const event_completion_effort = functionalCompletionEffort(slotRows, { availability: "event" });
		const optional = OPTIONAL_EVENT_SET_PEERS[setId];
		const complete = Number.isFinite(effort);
		if (!complete && !optional) return [setId, { weight: SET_WEIGHTS[setId], slots: slotRows, functional_completion_effort: effort, event_completion_effort, event_completion_status: Number.isFinite(event_completion_effort) ? "measured" : "incomplete_event_inventory", exclusions: ["reviewed_exclusion"] }];
		return [setId, { weight: SET_WEIGHTS[setId], slots: slotRows, functional_completion_effort: effort, event_completion_effort, event_completion_status: Number.isFinite(event_completion_effort) ? "measured" : "incomplete_event_inventory", optional_event_sidegrade: optional || null, exclusions: [] }];
	}));
	for (const [setId, set] of Object.entries(armor_sets)) {
		if (!set.optional_event_sidegrade) {
			set.ranking_effort = set.functional_completion_effort;
			continue;
		}
		const peer = armor_sets[set.optional_event_sidegrade.permanent_peer_set_id];
		if (!peer || !Number.isFinite(peer.functional_completion_effort)) throw new Error(`Optional set ${setId} lacks a permanent peer completion effort`);
		set.ranking_effort = peer.functional_completion_effort;
		set.ranking_basis = "permanent_peer";
	}
	const excluded = [
		...catalog.excluded.filter((row) => !PLANNED_ROUTE_DISTRIBUTIONS[row.item_id]).map((row) => ({ target: row.item_id, reason: row.reason, evidence: row.source_evidence })),
		...Object.entries(armor_sets)
		.filter(([, set]) => set.exclusions.length)
		.map(([set_id, set]) => ({ target: `armor_set:${set_id}`, reason: set.exclusions[0], evidence: Object.values(set.slots).flat().filter((row) => row.exclusion).map((row) => ({ item_id: row.item_id, source_item_id: row.source_item_id, source_evidence: row.source_evidence })) })),
	].sort((left, right) => left.target.localeCompare(right.target));
	const setMembers = new Set(Object.values(ARMOR_SET_SLOTS).flatMap((slots) => Object.values(slots).flat()).filter((id) => data.items[id]));
	const standaloneGroups = new Map();
	const capeGroups = new Map();
	const offhandGroups = new Map();
	const offhandProfile = (type) => ({ shield: "one_hand_defensive", source: "one_hand_caster", quiver: "one_hand_ranged", misc_offhand: "one_hand_universal" })[type];
	for (const row of candidates) {
		if (["helmet", "chest", "pants", "gloves", "shoes"].includes(row.type) && !setMembers.has(row.item_id)) {
			const id = `${row.weight}.${row.type}`;
			if (!standaloneGroups.has(id)) standaloneGroups.set(id, []);
			standaloneGroups.get(id).push(row);
		} else if (row.type === "cape") {
			if (!capeGroups.has(row.weight)) capeGroups.set(row.weight, []);
			capeGroups.get(row.weight).push(row);
		} else if (["shield", "source", "quiver", "misc_offhand"].includes(row.type)) {
			const profile = offhandProfile(row.type);
			if (!profile) throw new Error(`Combat offhand ${row.item_id} has no legal hand profile`);
			if (!offhandGroups.has(profile)) offhandGroups.set(profile, []);
			offhandGroups.get(profile).push({ ...row, legal_hand_profile: profile });
		}
	}
	const categoryPercentiles = (rows) => assignPercentiles(rows.map((row) => ({ item_id: row.item_id, effort: row.effort })));
	const rankOffhandLadder = (id, rows) => {
		const permanentRows = rows.filter((row) => routeAvailability(row.route) === "permanent");
		const permanentPopulation = [...offhandGroups.values()].flat().filter((row) => routeAvailability(row.route) === "permanent");
		const ranked = rankLadder(`offhand:${id}`, permanentRows, categoryPercentiles(permanentPopulation));
		for (const row of rows.filter((candidate) => routeAvailability(candidate.route) === "event")) {
			if (!Number.isFinite(row.effort) || !row.route?.route_id) throw new Error(`Reviewed event sidegrade ${row.item_id} has no acquisition evidence`);
			const percentile = assignPercentiles([
				...permanentPopulation.map((candidate) => ({ item_id: candidate.item_id, effort: candidate.effort })),
				{ item_id: row.item_id, effort: row.effort },
			]).find((candidate) => candidate.item_id === row.item_id)?.percentile;
			if (!Number.isFinite(percentile)) throw new Error(`Reviewed event sidegrade ${row.item_id} has no derived sideload percentile`);
			ranked.push({
				...compactAcquisitionRow(row),
				ladder_id: `offhand:${id}`,
				tie_band: 0,
				percentile,
				mapped_level: mapPercentileToLevel(percentile),
				unlock: mapPercentileToLevel(percentile, 99),
				sideload_percentile_basis: "selected event-route effort ranked with the permanent combined-offhand population",
			});
		}
		ranked.sort((left, right) => left.percentile - right.percentile || left.selected_effort - right.selected_effort || left.item_id.localeCompare(right.item_id));
		let tieBand = 0;
		let previous;
		for (const row of ranked) {
			if (previous === undefined || row.percentile !== previous) tieBand += 1;
			row.tie_band = tieBand;
			previous = row.percentile;
		}
		return ranked;
	};
	const ladders = {
		armor_sets: rankArmorSets(armor_sets),
		armor_set_details: armor_sets,
		standalone_armor: Object.fromEntries([...standaloneGroups].sort(([left], [right]) => left.localeCompare(right)).map(([id, rows]) => {
			const category = [...standaloneGroups].filter(([key]) => key.startsWith(`${id.split(".")[0]}.`)).flatMap(([, value]) => value);
			return [id, rankLadder(`standalone:${id}`, rows, categoryPercentiles(category))];
		})),
		capes: Object.fromEntries([...capeGroups].sort(([left], [right]) => left.localeCompare(right)).map(([id, rows]) => [id, rankLadder(`cape:${id}`, rows, categoryPercentiles([...capeGroups.values()].flat()))])),
		offhands: Object.fromEntries([...offhandGroups].sort(([left], [right]) => left.localeCompare(right)).map(([id, rows]) => [id, rankOffhandLadder(id, rows)])),
	};
	const rows = [
		...Object.values(ladders.standalone_armor).flat(),
		...Object.values(ladders.capes).flat(),
		...Object.values(ladders.offhands).flat(),
	].sort((left, right) => left.item_id.localeCompare(right.item_id));
	return {
		schema_version: 1,
		policy: { route: "easiest-permanent-normal-route", equip_unlock_affects_effort: false, rank_threshold: evidence.policy.rank_threshold, event_routes_are_optional: true, functional_set_operator: "AND(slots) with OR(alternatives)" },
		source_artifact_hashes: evidence.source_artifact_hashes,
		source_audit: buildRebalanceSourceAudit(data),
		availability_overrides: evidence.availability_overrides.map(({ route_id, source_artifact, source_field, rationale, reason }) => ({ route_id, source_artifact, source_field, rationale: rationale || reason })),
		ladders,
		planned_items: Object.entries(PLANNED_ITEM_IDENTITIES).map(([item_id, identity]) => ({ item_id, source_item_id: PLANNED_ITEM_SOURCES[item_id], ...identity, routes: selectedRoute(item_id).filter((route) => !route.exclusion) })),
		excluded,
		optional_event_rows: catalog.optional_event_rows,
		rows,
		hash: sha256(ladders),
	};
}

function sourceHashes() {
	for (const filename of PINNED_SOURCES) {
		const result = childProcess.spawnSync("git", ["rev-parse", `${PINNED_COMMIT}:${filename}`], { cwd: REPOSITORY_ROOT, encoding: "utf8" });
		if (result.status !== 0 || result.stdout.trim() !== PINNED_BLOB_IDS[filename]) throw new Error(`Pinned blob drifted: ${filename}`);
	}
	return { ...PINNED_BLOB_IDS };
}

function canonicalMonster(monster) {
	return JSON.parse(canonicalJson(monster));
}

function monsterMapContext(data) {
	const context = new Map();
	for (const [map_id, map] of Object.entries(data.maps || {})) {
		for (const pack of map.monsters || []) {
			if (!context.has(pack.type)) context.set(pack.type, []);
			context.get(pack.type).push({
				map_id,
				event_map: Boolean(map.event),
				instance: Boolean(map.instance),
				special_spawn: Boolean(pack.special || pack.stype === "randomrespawn"),
				count: Number(pack.count || 0),
			});
		}
	}
	return context;
}

function classifyMonster(id, monster, contexts = []) {
	const facts = {
		cooperative: Boolean(monster.cooperative),
		event: Boolean(monster.event || contexts.some((row) => row.event_map)),
		boss_or_raid: Boolean(monster.boss || monster.raid || monster.announce),
		scripted_mechanic: Boolean(monster.special || monster.operator || monster.rbuff || monster.respawn_as || monster.immune || monster.spawns || monster.abilities || contexts.some((row) => row.special_spawn)),
		special: Boolean(monster.hide || monster.ignore || Number(monster.xp) <= 0 || /^(test|dummy|target)/i.test(id)),
	};
	const explicitReason = EXPLICIT_MONSTER_DIAGNOSTIC_REASONS[id] || null;
	const reason = explicitReason || (facts.cooperative ? "cooperative"
		: facts.event ? "event"
			: facts.boss_or_raid ? "boss_or_raid"
				: facts.scripted_mechanic ? "scripted_mechanic"
					: facts.special ? "special"
						: null);
	return {
		classification: reason ? "diagnostic" : "hard",
		reason,
		context: {
			maps: contexts.map((row) => row.map_id).sort(),
			event_maps: contexts.filter((row) => row.event_map).map((row) => row.map_id).sort(),
			instance_maps: contexts.filter((row) => row.instance).map((row) => row.map_id).sort(),
			special_spawns: contexts.filter((row) => row.special_spawn).map((row) => row.map_id).sort(),
			flags: Object.entries(facts).filter(([, value]) => value).map(([key]) => key),
			explicit_reason: explicitReason,
		},
	};
}

function pinnedClasses() {
	const context = {};
	vm.createContext(context);
	vm.runInContext(readPinnedSource("design/classes.js"), context, { filename: "pinned:design/classes.js", timeout: 250 });
	if (!context.classes || typeof context.classes !== "object") throw new Error("Pinned classes catalog is unavailable");
	return JSON.parse(canonicalJson(context.classes));
}

function catalogFromSource(source, filename, binding) {
	const context = { Math, ceil: Math.ceil, min: Math.min, max: Math.max, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(source, context, { filename, timeout: 250 });
	if (!context[binding] || typeof context[binding] !== "object") throw new Error(`${binding} catalog is unavailable from ${filename}`);
	return JSON.parse(canonicalJson(context[binding]));
}

function pinnedCatalog(filename, binding) {
	return catalogFromSource(readPinnedSource(filename), `pinned:${filename}`, binding);
}

function boundedSource(source, startMarker, endMarker, authorityId) {
	const start = source.indexOf(startMarker);
	const end = source.indexOf(endMarker, start + startMarker.length);
	if (start === -1 || end === -1 || end <= start) throw new Error(`Frozen authority slice is unavailable: ${authorityId}`);
	return source.slice(start, end);
}

function frozenAuthorityRows({ currentSourceOverrides = {} } = {}) {
	const rows = [];
	const currentSource = (filename) => Object.prototype.hasOwnProperty.call(currentSourceOverrides, filename)
		? currentSourceOverrides[filename]
		: fs.readFileSync(path.resolve(REPOSITORY_ROOT, filename), "utf8");
	for (const filename of [
		"design/abilities.js",
		"design/character.js",
		"design/upgrades.js",
		"js/old_common_functions.js",
		"node/game/active_skill.js",
		"node/tools/progression-benchmark.js",
		"node/tests/fixtures/progression-benchmark-routes.json",
		"node/tests/fixtures/progression-benchmark-targets.json",
	]) {
		const expected = readSourceAtCommit(EQUIPMENT_REBALANCE_BASE_COMMIT, filename);
		const current = currentSource(filename);
		rows.push({ authority_id: filename, expected_ref: EQUIPMENT_REBALANCE_BASE_COMMIT, expected_sha256: sha256(expected), current_sha256: sha256(current), matches: current === expected });
	}
	const skillDomainFilename = "node/game/skill_domain.js";
	const currentSkillDomainSha256 = sha256(currentSource(skillDomainFilename));
	rows.push({
		authority_id: skillDomainFilename,
		expected_ref: `sha256:${PRIEST_BOOK_SKILL_DOMAIN_SHA256}`,
		expected_sha256: PRIEST_BOOK_SKILL_DOMAIN_SHA256,
		current_sha256: currentSkillDomainSha256,
		matches: currentSkillDomainSha256 === PRIEST_BOOK_SKILL_DOMAIN_SHA256,
	});
	const serverFilename = "node/server.js";
	const expectedServer = readSourceAtCommit(EQUIPMENT_REBALANCE_BASE_COMMIT, serverFilename);
	const currentServer = currentSource(serverFilename);
	const expectedCombat = boundedSource(expectedServer, "function commence_attack", "function target_player", "server-combat-formulas");
	const currentCombat = boundedSource(currentServer, "function commence_attack", "function target_player", "server-combat-formulas");
	rows.push({ authority_id: "node/server.js:commence_attack..target_player", expected_ref: EQUIPMENT_REBALANCE_BASE_COMMIT, expected_sha256: sha256(expectedCombat), current_sha256: sha256(currentCombat), matches: currentCombat === expectedCombat });

	const statsFilename = "node/game/stats.js";
	const expectedStats = readSourceAtCommit(EQUIPMENT_REBALANCE_BASE_COMMIT, statsFilename);
	const currentStats = currentSource(statsFilename);
	rows.push({ authority_id: statsFilename, expected_ref: EQUIPMENT_REBALANCE_BASE_COMMIT, expected_sha256: sha256(expectedStats), current_sha256: sha256(currentStats), matches: currentStats === expectedStats });

	const accessoryTypes = new Set(["amulet", "earring", "ring", "belt", "orb"]);
	const project = (catalog) => Object.fromEntries(Object.entries(catalog).filter(([, definition]) => accessoryTypes.has(definition.type)).sort(([left], [right]) => left.localeCompare(right)));
	const expectedItems = catalogFromSource(readSourceAtCommit(EQUIPMENT_REBALANCE_BASE_COMMIT, "design/items.js"), "base:design/items.js", "items");
	const currentItems = catalogFromSource(currentSource("design/items.js"), "current:design/items.js", "items");
	const expectedAccessories = project(expectedItems);
	const currentAccessories = project(currentItems);
	rows.push({ authority_id: "design/items.js:accessories-and-orbs", expected_ref: EQUIPMENT_REBALANCE_BASE_COMMIT, expected_sha256: sha256(expectedAccessories), current_sha256: sha256(currentAccessories), matches: canonicalJson(currentAccessories) === canonicalJson(expectedAccessories) });
	return rows.sort((left, right) => left.authority_id.localeCompare(right.authority_id));
}

const FROZEN_LOADOUTS = Object.freeze({
	warrior: { stat_type: "str", mainhand: "blade", ring1: "cring", ring2: "cring", earring1: "dexearringx", earring2: "dexearringx", amulet: "t2dexamulet", belt: "dexbelt", orb: "orbofdex" },
	paladin: { stat_type: "str", mainhand: "mace", ring1: "cring", ring2: "cring", earring1: "dexearringx", earring2: "dexearringx", amulet: "t2dexamulet", belt: "dexbelt", orb: "orbofdex" },
	ranger: { stat_type: "dex", mainhand: "bow", ring1: "cring", ring2: "cring", earring1: "dexearringx", earring2: "dexearringx", amulet: "t2dexamulet", belt: "dexbelt", orb: "orbofdex" },
	rogue: { stat_type: "dex", mainhand: "claw", ring1: "cring", ring2: "cring", earring1: "dexearringx", earring2: "dexearringx", amulet: "t2dexamulet", belt: "dexbelt", orb: "orbofdex" },
	mage: { stat_type: "int", mainhand: "staff", ring1: "cring", ring2: "cring", earring1: "dexearringx", earring2: "dexearringx", amulet: "t2dexamulet", belt: "dexbelt", orb: "orbofdex" },
	priest: { stat_type: "int", mainhand: "wbook0", ring1: "cring", ring2: "cring", earring1: "dexearringx", earring2: "dexearringx", amulet: "t2dexamulet", belt: "dexbelt", orb: "orbofdex" },
});

function pinnedClassAttributes(definition, level) {
	const stat = (field) => Math.floor(Number(definition.stats[field] || 0) + level * Number(definition.lstats[field] || 0) + [40, 55, 65].reduce((sum, threshold) => sum + (level > threshold ? (level - threshold) * Number(definition.lstats[field] || 0) : 0), 0));
	return Object.fromEntries(["str", "dex", "int", "vit"].map((field) => [field, stat(field)]));
}

function pinnedSheetCore(definition, level, equipment = {}) {
	const attributes = pinnedClassAttributes(definition, level);
	for (const field of ["str", "dex", "int", "vit"]) attributes[field] += Number(equipment[field] || 0);
	const hp = Math.max(1, Number(definition.hp || 0) + attributes.str * 21 + attributes.vit * (48 + level / 3) + Number(equipment.hp || 0));
	const mp = Math.max(1, Number(definition.mp || 0) + attributes.int * 15 + level * 5 + Number(equipment.mp || 0));
	const armor = Number(definition.armor || 0) + Math.min(attributes.str, 160) + Math.max(0, attributes.str - 160) * 0.25 + Number(equipment.armor || 0);
	const resistance = Number(definition.resistance || 0) + Math.min(attributes.int, 180) + Math.max(0, attributes.int - 180) * 0.25 + Number(equipment.resistance || 0);
	return { ...attributes, hp: Math.round(hp), mp: Math.round(mp), armor: Math.round(armor), resistance: Math.round(resistance) };
}

function pinnedClassCore(definition, level) {
	return pinnedSheetCore(definition, level);
}

function addVector(left, right, fields, multiplier = 1) {
	return Object.fromEntries(fields.map((field) => [field, Number(left[field] || 0) + multiplier * Number(right[field] || 0)]));
}

function addCore(left, right, multiplier = 1) {
	return addVector(left, right, CORE_FIELDS, multiplier);
}

function pinnedTargetLoadout(items, acquisition, skill, level, stat_type) {
	const weight = ({ warrior: "heavy", paladin: "heavy", ranger: "medium", rogue: "medium", mage: "light", priest: "light" })[skill];
	const compatibilityItems = normalizedPinnedWeaponCatalog(items);
	const mainhand = { name: FROZEN_LOADOUTS[skill].mainhand };
	const setCandidates = Object.entries(acquisition.ladders.armor_set_details).flatMap(([set_id, set]) => {
		const ranked = acquisition.ladders.armor_sets[set.weight].find((row) => row.set_id === set_id);
		return Object.values(set.slots).flat().filter((row) => row.availability === "permanent" && items[row.item_id] && ranked.mapped_level <= level).map((row) => ({
			item_id: row.item_id,
			type: items[row.item_id].type,
			weight: set.weight,
			mapped_level: ranked.mapped_level,
			selected_effort: row.selected_effort,
		}));
	});
	const candidates = [...acquisition.rows, ...setCandidates].filter((row) => items[row.item_id] && row.availability !== "event" && Number.isFinite(row.mapped_level) && row.mapped_level <= level);
	const select = (type, profile = null) => candidates
		.filter((row) => row.type === type && (profile ? row.legal_hand_profile === profile : type === "cape" || row.weight === weight))
		.sort((left, right) => right.mapped_level - left.mapped_level || left.selected_effort - right.selected_effort || left.item_id.localeCompare(right.item_id))[0];
	const selectOffhand = () => candidates
		.filter((row) => ["shield", "source", "quiver", "misc_offhand"].includes(row.type))
		.filter((row) => isCompatibleOffhand(mainhand, { name: row.item_id }, compatibilityItems))
		.sort((left, right) => right.mapped_level - left.mapped_level || left.selected_effort - right.selected_effort || left.item_id.localeCompare(right.item_id))[0];
	const completeSets = Object.entries(acquisition.ladders.armor_set_details)
		.map(([set_id, set]) => {
			const ranked = acquisition.ladders.armor_sets[set.weight].find((row) => row.set_id === set_id);
			const slots = Object.fromEntries(Object.entries(set.slots).map(([slot, alternatives]) => [slot, alternatives
				.filter((row) => row.availability === "permanent" && items[row.item_id])
				.sort((left, right) => left.selected_effort - right.selected_effort || left.item_id.localeCompare(right.item_id))[0]]));
			return { set_id, set, ranked, slots };
		})
		.filter((candidate) => candidate.set.weight === weight && candidate.ranked.mapped_level <= level && Object.values(candidate.slots).every(Boolean))
		.sort((left, right) => right.ranked.mapped_level - left.ranked.mapped_level || left.ranked.selected_effort - right.ranked.selected_effort || left.set_id.localeCompare(right.set_id));
	const chosenSet = completeSets[0] || null;
	const slots = chosenSet
		? chosenSet.slots
		: Object.fromEntries(["helmet", "chest", "pants", "gloves", "shoes"].map((slot) => [slot, select(slot)]));
	slots.cape = select("cape");
	slots.offhand = selectOffhand();
	return {
		set_id: chosenSet?.set_id || null,
		slots: Object.fromEntries(Object.entries(slots).map(([slot, row]) => [slot, row ? { item_id: row.item_id, level: 0, stat_type, mapped_level: row.mapped_level } : { item_id: null, level: 0, stat_type, unavailable: `no_legal_${slot}_at_level_${level}` }])),
	};
}

function pinnedSetCounts(items, slots) {
	const counts = {};
	for (const slot of slots) {
		const set_id = items[slot?.item_id]?.set;
		if (set_id) counts[set_id] = (counts[set_id] || 0) + 1;
	}
	return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function cumulativeSetProperties(sets, set_id, count, fields = DOMINATION_FIELDS) {
	const total = Object.fromEntries(fields.map((field) => [field, 0]));
	for (let threshold = 1; threshold <= Number(count || 0); threshold += 1)
		for (const field of fields) total[field] += Number(sets?.[set_id]?.[threshold]?.[field] || 0);
	return total;
}

function pinnedSetProperties(sets, set_counts = {}, fields = DOMINATION_FIELDS) {
	return Object.entries(set_counts).reduce((total, [set_id, count]) => addVector(total, cumulativeSetProperties(sets, set_id, count, fields), fields), Object.fromEntries(fields.map((field) => [field, 0])));
}

function pinnedRoleRows() {
	const classes = pinnedClasses();
	const items = pinnedCatalog("design/items.js", "items");
	const sets = pinnedCatalog("design/items.js", "sets");
	const acquisition = buildEquipmentAcquisitionFixture();
	return ROLE_SKILLS.flatMap((skill) => {
		const definition = classes[skill];
		if (!definition?.stats || !definition?.lstats) throw new Error(`Pinned role is incomplete: ${skill}`);
		const loadout = FROZEN_LOADOUTS[skill];
		if (!loadout) throw new Error(`Pinned role has no frozen loadout: ${skill}`);
		return Array.from({ length: 70 }, (_, index) => {
			const level = index + 1;
			const class_core = pinnedClassCore(definition, level);
				const frozen_slots = Object.fromEntries(Object.entries(loadout).filter(([slot]) => !["stat_type", "mainhand"].includes(slot)).map(([slot, item_id]) => {
					if (!items[item_id]) throw new Error(`Pinned frozen loadout ${skill}.${slot} references ${item_id}`);
					return [slot, { item_id, level: 0, stat_type: loadout.stat_type }];
				}));
				const weapon_slot = { item_id: loadout.mainhand, level: 0, stat_type: loadout.stat_type };
				if (!items[weapon_slot.item_id]) throw new Error(`Pinned weapon loadout ${skill} references ${weapon_slot.item_id}`);
				const target = pinnedTargetLoadout(items, acquisition, skill, level, loadout.stat_type);
				const target_slots = target.slots;
				const zero = Object.fromEntries(CORE_FIELDS.map((field) => [field, 0]));
				const sheetFor = (slots) => {
					const properties = slots.reduce((sum, item) => addCore(sum, pinnedItemProperties(items[item.item_id], item.level, item)), zero);
					const set_counts = pinnedSetCounts(items, slots);
					const set_properties = pinnedSetProperties(sets, set_counts);
					return { set_counts, set_properties, sheet: pinnedSheetCore(definition, level, addCore(properties, set_properties)) };
				};
				const frozenState = sheetFor(Object.values(frozen_slots));
				const weaponState = sheetFor([...Object.values(frozen_slots), weapon_slot]);
				const fullState = sheetFor([...Object.values(frozen_slots), weapon_slot, ...Object.values(target_slots).filter((item) => item.item_id)]);
				const frozen_sheet = frozenState.sheet;
				const weapon_sheet = weaponState.sheet;
				const full_core = fullState.sheet;
				const frozen_core = addCore(frozen_sheet, class_core, -1);
				const weapon_core = addCore(weapon_sheet, frozen_sheet, -1);
				const target_core = addCore(full_core, weapon_sheet, -1);
				const core = addCore(addCore(full_core, frozen_core, -1), weapon_core, -1);
			return {
				skill,
				level,
				core,
				class_core,
					full_core,
					frozen_core,
						weapon_core,
						target_core,
						loadout: {
						target_slots: ["helmet", "chest", "pants", "gloves", "shoes", "cape", "offhand"],
							target_items: target_slots,
							target_set_id: target.set_id,
							target_set_counts: pinnedSetCounts(items, Object.values(target_slots).filter((item) => item.item_id)),
							equipped_set_counts: fullState.set_counts,
							equipped_set_bonus: fullState.set_properties,
						weapon_slot,
					frozen_slots,
				},
			};
		});
	});
}

function normalizationDenominators(roleRows) {
	const fields = CORE_FIELDS;
	return Object.fromEntries(fields.map((field) => {
		const deltas = ROLE_SKILLS.map((skill) => {
			const first = roleRows.find((row) => row.skill === skill && row.level === 1)?.core[field] || 0;
			const last = roleRows.find((row) => row.skill === skill && row.level === 70)?.core[field] || 0;
			return last - first;
		}).filter((value) => value > 0);
		const values = deltas.length ? deltas : ROLE_SKILLS.map((skill) => roleRows.find((row) => row.skill === skill && row.level === 1)?.core[field] || 0).filter((value) => value > 0);
		if (!values.length) throw new Error(`Pinned normalization has no positive ${field} reference`);
		return [field, values.reduce((sum, value) => sum + value, 0) / values.length];
	}));
}

function pinnedItemProperties(definition, level = 0, { stat_type = null } = {}) {
	const values = Object.fromEntries([...CORE_FIELDS, ...EFFECT_FIELDS].map((field) => [field, 0]));
	let genericStat = 0;
	const upgrade = definition.upgrade || definition.compound;
	for (let index = 1; index <= level && upgrade; index += 1) {
		const multiplier = enhancementStepWeight(definition.upgrade ? "upgrade" : "compound", index);
		for (const field of Object.keys(upgrade)) {
			if (field === "stat") genericStat += Math.round(Number(upgrade[field] || 0) * multiplier) + (index >= 7 ? 1 : 0);
			else if (field in values) values[field] += Number(upgrade[field] || 0) * multiplier;
		}
	}
	genericStat += Number(definition.stat || 0);
	for (const field of Object.keys(values)) values[field] = Math.round(values[field] + Number(definition[field] || 0));
	if (stat_type && CORE_FIELDS.includes(stat_type)) values[stat_type] = Math.round(values[stat_type] + genericStat);
	return values;
}

function pinnedSlotContributionTables(items) {
	const compact = (definition) => Object.fromEntries([...CORE_FIELDS, ...EFFECT_FIELDS].filter((field) => Number(definition[field] || 0) !== 0).map((field) => [field, definition[field]]));
	const select = (types) => Object.fromEntries(Object.entries(items).filter(([, item]) => types.includes(item.type)).sort(([left], [right]) => left.localeCompare(right)).map(([itemId, item]) => [itemId, compact(pinnedItemProperties(item))]));
	const generic_stat_variants = Object.fromEntries(
		Object.entries(items)
			.filter(([, item]) => Number(item.stat || 0) !== 0)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([itemId, item]) => [itemId, Object.fromEntries(["str", "dex", "int", "vit"].map((stat_type) => [stat_type, compact(pinnedItemProperties(item, 0, { stat_type }))]))]),
	);
	return {
		base_armor: select(["helmet", "chest", "pants", "gloves", "shoes"]),
		capes: select(["cape"]),
		offhands: select(["shield", "source", "quiver", "misc_offhand"]),
		frozen_accessories: select(["ring", "earring", "amulet", "belt", "orb"]),
		generic_stat_variants,
	};
}

function rangeStates(definition) {
	const change = definition.upgrade?.range === undefined && definition.compound?.range === undefined ? null : definition.upgrade ? "upgrade" : "compound";
	const maximum = change ? Math.max(0, Number(definition.grades?.[3] || (change === "upgrade" ? 12 : 8))) : 0;
	return Array.from({ length: maximum + 1 }, (_, level) => ({ level, range: pinnedItemProperties(definition, level).range }));
}

function pairedAllocationVectors(roleRows, denominators) {
	const pairs = { heavy: ["warrior", "paladin"], medium: ["ranger", "rogue"], light_int: ["mage", "priest"] };
	const slotShares = { helmet: 0.15, chest: 0.3, pants: 0.25, gloves: 0.1, shoes: 0.1, cape: 0.1, offhand: 0 };
	return Array.from({ length: 70 }, (_, index) => {
		const level = index + 1;
		const deltas = Object.fromEntries(Object.entries(pairs).map(([weight, skills]) => [weight, Object.fromEntries(CORE_FIELDS.map((field) => [field, skills.reduce((sum, skill) => {
			const start = roleRows.find((row) => row.skill === skill && row.level === 1).core[field];
			const current = roleRows.find((row) => row.skill === skill && row.level === level).core[field];
			return sum + current - start;
			}, 0) / skills.length]))]));
		const totals = Object.fromEntries(Object.entries(deltas).map(([weight, vector]) => [weight, normalizedCore(vector, denominators)]));
		const target = [totals.heavy, totals.medium, totals.light_int].reduce((sum, value) => sum + value, 0) / 3;
		const vectors = Object.fromEntries(Object.entries(deltas).map(([weight, distribution]) => {
			const total = totals[weight];
			const core = Object.fromEntries(CORE_FIELDS.map((field) => [field, total ? denominators[field] * target * (distribution[field] / denominators[field]) / total : 0]));
			return [weight, { core, normalized_total: normalizedCore(core, denominators), paired_roles: pairs[weight], paired_role_delta: distribution, slot_shares: slotShares }];
		}));
		const dexReference = Object.fromEntries(CORE_FIELDS.map((field) => [field, ["ranger", "rogue"].reduce((sum, skill) => {
			const start = roleRows.find((row) => row.skill === skill && row.level === 1).core[field];
			const current = roleRows.find((row) => row.skill === skill && row.level === level).core[field];
			return sum + current - start;
		}, 0) / 2]));
		const survivalFields = new Set(["vit", "hp", "mp", "armor", "resistance"]);
		const survivor = vectors.light_int.core;
		const dexCost = vectors.medium.core.dex / denominators.dex;
		const survivorCost = [...survivalFields].reduce((sum, field) => sum + survivor[field] / denominators[field], 0);
		const survivalScale = survivorCost ? Math.max(0, (target - dexCost) / survivorCost) : 0;
		const dexCore = Object.fromEntries(CORE_FIELDS.map((field) => {
			if (field === "dex") return [field, denominators.dex * dexCost];
			if (survivalFields.has(field)) return [field, survivor[field] * survivalScale];
			return [field, 0];
		}));
		const dexVariant = {
			core: dexCore,
			normalized_total: normalizedCore(dexCore, denominators),
			paired_roles: ["ranger", "rogue"],
			paired_role_delta: dexReference,
			survivability_reference: ["mage", "priest"],
			slot_shares: slotShares,
			variant: "dex",
		};
		return {
			heavy: vectors.heavy,
			medium: vectors.medium,
			light: {
				...vectors.light_int,
				variant: "int",
				variants: {
					int: vectors.light_int,
					dex: dexVariant,
				},
			},
		};
	});
}

function completedPinnedLoadouts(items, acquisition, sets) {
	const roleStatType = { heavy: "str", medium: "dex", light: "int" };
	const roleForWeight = { heavy: "warrior", medium: "ranger", light: "mage" };
	return Object.entries(acquisition.ladders.armor_set_details)
		.map(([set_id, set]) => {
			const ranked = acquisition.ladders.armor_sets[set.weight].find((row) => row.set_id === set_id);
			if (!ranked) throw new Error(`Pinned completed loadout ${set_id} lacks an acquisition rank`);
			const role = roleForWeight[set.weight];
			const target = pinnedTargetLoadout(items, acquisition, role, ranked.mapped_level, roleStatType[set.weight]);
			const compatibleFillers = [
				...acquisition.rows,
				...Object.entries(acquisition.ladders.armor_set_details).flatMap(([candidateSetId, candidateSet]) => {
					const candidateRank = acquisition.ladders.armor_sets[candidateSet.weight].find((row) => row.set_id === candidateSetId);
					return Object.values(candidateSet.slots).flat().map((row) => ({ ...row, weight: candidateSet.weight, mapped_level: candidateRank.mapped_level }));
				}),
			].filter((row) => items[row.item_id]);
			const fillers = [];
			const selected = Object.entries(set.slots).map(([slot, alternatives]) => {
				const selectedRow = alternatives
					.filter((row) => row.availability === "permanent" && Number.isFinite(row.selected_effort) && items[row.item_id])
					.sort((left, right) => left.selected_effort - right.selected_effort || left.item_id.localeCompare(right.item_id))[0];
				if (selectedRow) return { item_id: selectedRow.item_id, level: 0, stat_type: roleStatType[set.weight], source: "set_permanent" };
				const legalFiller = target.slots[slot];
				const slotFillers = compatibleFillers.filter((row) => row.type === slot);
				const fallbackFiller = slotFillers
					.sort((left, right) => left.mapped_level - right.mapped_level || left.selected_effort - right.selected_effort || left.item_id.localeCompare(right.item_id))[0];
				const filler = legalFiller?.item_id && items[legalFiller.item_id]
					? { item_id: legalFiller.item_id, reason: "missing_historical_set_slot" }
					: fallbackFiller ? { item_id: fallbackFiller.item_id, reason: "no_legal_slot_at_band" } : null;
				if (!filler) throw new Error(`Pinned completed loadout ${set_id} lacks a compatible ${slot} filler`);
				fillers.push({ slot, ...filler, compatible_weight: fallbackFiller?.weight || set.weight });
				return { item_id: filler.item_id, level: 0, stat_type: roleStatType[set.weight], source: "pinned_compatible_filler" };
			});
			const frozen = FROZEN_LOADOUTS[role];
			const targetNonArmor = [target.slots.cape, target.slots.offhand].filter((row) => row.item_id);
			const frozenItems = Object.entries(frozen).filter(([slot]) => slot !== "stat_type").map(([, item_id]) => ({ item_id, level: 0, stat_type: roleStatType[set.weight] }));
			const vector = [...selected, ...targetNonArmor, ...frozenItems].reduce((sum, row) => {
				const definition = items[row.item_id];
				if (!definition) throw new Error(`Pinned completed loadout ${set_id} references non-pinned ${row.item_id}`);
				return addVector(sum, pinnedItemProperties(definition, 0, { stat_type: roleStatType[set.weight] }), [...CORE_FIELDS, ...EFFECT_FIELDS]);
			}, Object.fromEntries([...CORE_FIELDS, ...EFFECT_FIELDS].map((field) => [field, 0])));
			const equippedItems = [...selected, ...targetNonArmor, ...frozenItems];
			const equipped_set_counts = pinnedSetCounts(items, equippedItems);
			const completePinnedSetId = equipped_set_counts[set_id] === Object.keys(set.slots).length ? set_id : null;
			const setBonus = pinnedSetProperties(sets, equipped_set_counts);
			return {
				set_id,
				weight: set.weight,
				role,
				band: `power-${ranked.mapped_level}`,
				mapped_level: ranked.mapped_level,
				item_ids: selected.map((row) => row.item_id).sort(),
				filler_slots: fillers,
				frozen_item_ids: frozenItems.map((row) => row.item_id).sort(),
				cape_item_id: target.slots.cape.item_id,
				offhand_item_id: target.slots.offhand.item_id,
				complete_pinned_set_id: completePinnedSetId,
				equipped_set_counts,
				set_bonus: setBonus,
				vector: addVector(vector, setBonus, [...CORE_FIELDS, ...EFFECT_FIELDS]),
			};
		})
		.sort((left, right) => left.mapped_level - right.mapped_level || left.set_id.localeCompare(right.set_id));
}

function quartiles(values) {
	const sorted = [...values].sort((left, right) => left - right);
	return { q1: sorted[Math.floor((sorted.length - 1) * 0.25)], q3: sorted[Math.floor((sorted.length - 1) * 0.75)] };
}

function effectEnvelopes(items, acquisition, sets) {
	const loadouts = completedPinnedLoadouts(items, acquisition, sets);
	const bands = [...new Set(loadouts.map((row) => row.band))].sort((left, right) => Number(left.slice(6)) - Number(right.slice(6)));
	return EFFECT_FIELDS.flatMap((effect) => bands.map((band, index) => {
		const inBand = loadouts.filter((row) => row.band === band && Number(row.vector[effect]) > 0);
		const adjacentBand = inBand.length >= 4 ? null : bands[index - 1] || bands[index + 1] || null;
		const adjacent = adjacentBand ? loadouts.filter((row) => row.band === adjacentBand && Number(row.vector[effect]) > 0) : [];
		const samples = inBand.map((row) => row.vector[effect]);
		const widened = samples.length < 4 ? adjacent.map((row) => row.vector[effect]) : [];
		const values = [...samples, ...widened].sort((left, right) => left - right);
		if (!values.length) return {
			effect,
			band,
			sample_loadout_ids: [],
			sample_values: [],
			local_sample_values: [],
			adjacent_values: [],
			sample_count: 0,
			adjacent_band: adjacentBand,
			adjacent_sample_loadout_ids: [],
			q1: null,
			q3: null,
			upper_fence: null,
			cap: null,
			status: "capless",
		};
		const { q1, q3 } = quartiles(values);
		const upper_fence = q3 + 1.5 * (q3 - q1);
		return {
			effect,
			band,
			sample_loadout_ids: inBand.map((row) => row.set_id).sort(),
			sample_values: values,
			local_sample_values: samples.sort((left, right) => left - right),
			adjacent_values: widened.sort((left, right) => left - right),
			sample_count: samples.length,
			adjacent_band: samples.length < 4 ? adjacentBand : null,
			adjacent_sample_loadout_ids: samples.length < 4 ? adjacent.map((row) => row.set_id).sort() : [],
			q1,
			q3,
			upper_fence,
			cap: effectCap(samples, { allowAdjacent: widened }),
			status: "capped",
		};
	}));
}

function buildVanillaBaseline() {
	const pinnedMonsters = pinnedCatalog("design/monsters.js", "monsters");
	const pinnedItems = pinnedCatalog("design/items.js", "items");
	const pinnedSets = pinnedCatalog("design/items.js", "sets");
	const currentMonsterCatalog = loadSourceData().monsters;
	if (canonicalJson(currentMonsterCatalog) !== canonicalJson(pinnedMonsters)) throw new Error("Current monster catalog differs from pinned vanilla authority");
	const mapContexts = monsterMapContext(loadSourceData());
	const roleRows = pinnedRoleRows();
	const weaponRankEndpointOracle = buildWeaponRankEndpointOracle(roleRows, pinnedItems, pinnedSets);
	const weaponRankEnhancementOracle = buildWeaponRankEnhancementOracle(roleRows, pinnedItems, pinnedSets);
	const contributionCatalogBuilder = createContributionCatalog(EVIDENCE_CONTRIBUTION_FIELDS);
	for (const endpoint of [weaponRankEndpointOracle.start, weaponRankEndpointOracle.end])
		endpoint.contributions = compactContributionEvidence(endpoint.contributions, contributionCatalogBuilder);
	for (const row of weaponRankEnhancementOracle)
		for (const state of row.states) state.contributions = compactContributionEvidence(state.contributions, contributionCatalogBuilder);
	const enhancementContributionCatalog = contributionCatalogBuilder.finalize();
	const denominators = normalizationDenominators(roleRows);
	const slotTables = pinnedSlotContributionTables(pinnedItems);
	const acquisition = buildEquipmentAcquisitionFixture();
	const monsters = Object.fromEntries(
		Object.entries(pinnedMonsters)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([id, monster]) => [id, { ...classifyMonster(id, monster, mapContexts.get(id) || []), hash: sha256(canonicalMonster(monster)) }]),
	);
	const weaponFixture = JSON.parse(fs.readFileSync(path.resolve(FIXTURE_DIRECTORY, "weapon-acquisition-ranking.json"), "utf8"));
	const ranges = weaponFixture.weapons.filter((weapon) => weapon.origin === "retained").map((weapon) => {
		const definition = pinnedItems[weapon.weapon_id];
		if (!definition) throw new Error(`Pinned weapon range is missing ${weapon.weapon_id}`);
		const states = rangeStates(definition);
		return { weapon_id: weapon.weapon_id, raw_range: Number(definition.range || 0), base_range: states[0].range, upgrade_range_delta: Number(definition.upgrade?.range || 0), compound_range_delta: Number(definition.compound?.range || 0), states };
	}).sort((left, right) => left.weapon_id.localeCompare(right.weapon_id));
	return {
		schema_version: 2,
		pinned_commit: PINNED_COMMIT,
		source_hashes: sourceHashes(),
		evidence_hashes: {
			pinned_set_catalog_sha256: sha256(pinnedSets),
			frozen_loadout_policy_sha256: sha256(FROZEN_LOADOUTS),
			enhancement_contribution_catalog_sha256: enhancementContributionCatalog.catalog_sha256,
			weapon_rank_enhancement_contributions_sha256: sha256(weaponRankEnhancementOracle.map((row) => row.states.map((state) => state.contributions.contributions_sha256))),
		},
		role_rows: roleRows,
		weapon_rank_endpoint_oracle: weaponRankEndpointOracle,
		weapon_rank_enhancement_oracle: weaponRankEnhancementOracle,
		enhancement_contribution_catalog: enhancementContributionCatalog,
		monsters,
		whole_monster_hash: sha256(canonicalMonster(pinnedMonsters)),
		current_whole_monster_hash: sha256(canonicalMonster(currentMonsterCatalog)),
		weapon_ranges: ranges,
		normalization_denominators: denominators,
		slot_contribution_tables: slotTables,
		allocation_vectors: pairedAllocationVectors(roleRows, denominators),
		core_credit_exclusions: ["for", "gold", "luck", ...EFFECT_FIELDS],
		completed_loadouts: completedPinnedLoadouts(pinnedItems, acquisition, pinnedSets),
		effect_envelopes: effectEnvelopes(pinnedItems, acquisition, pinnedSets),
		slot_shares: { helmet: 0.15, chest: 0.3, pants: 0.25, gloves: 0.1, shoes: 0.1, cape: 0.1, offhand: 0 },
	};
}

function constraintInventory(baseline = buildVanillaBaseline(), acquisition = buildEquipmentAcquisitionFixture()) {
	const envelopes = baseline.effect_envelopes
		.map((row) => ({ effect: row.effect, band: row.band, status: row.status }))
		.sort((left, right) => left.effect.localeCompare(right.effect) || left.band.localeCompare(right.band));
	const required_effects = Object.entries(SET_SIGNATURES).flatMap(([set_id, effects]) => {
		const weight = acquisition.ladders.armor_set_details[set_id].weight;
		const row = acquisition.ladders.armor_sets[weight].find((candidate) => candidate.set_id === set_id);
		return effects.map((effect) => ({ set_id, effect, band: `power-${row.mapped_level}` }));
	});
	return {
		budget_levels: baseline.allocation_vectors.map((_, index) => index + 1),
		required_effects,
		reviewed_lower_value_effects: required_effects.filter((required) => envelopes.find((row) => row.effect === required.effect && row.band === required.band)?.status !== "capped"),
		effect_envelopes: envelopes,
		set_ids: Object.keys(ARMOR_SET_SLOTS).sort(),
		hard_monster_ids: Object.entries(baseline.monsters).filter(([, row]) => row.classification === "hard").map(([id]) => id).sort(),
		weapon_ids: loadRankingFixture().weapons.map((row) => row.weapon_id).sort(),
	};
}

function buildBalanceContract(baseline = buildVanillaBaseline()) {
	const ranking = loadRankingFixture();
	assertRankingEnhancementFeasible(ranking);
	return {
		schema_version: 2,
		core_fields: [...CORE_FIELDS],
		effect_fields: [...EFFECT_FIELDS],
		weights: { heavy: ["warrior", "paladin"], medium: ["ranger", "rogue"], light: ["mage", "priest"] },
		light_variants: { int: ["mage", "priest"], dex: ["ranger", "rogue"], survivability_reference: ["mage", "priest"] },
		weight_unlocks: { heavy: { any_skill: ["warrior", "paladin"] }, medium: { any_skill: ["ranger", "rogue"] }, light: { any_skill: ["mage", "priest"] }, mmerchant: { skill: "merchant" } },
		rank_mapping: { base_power: "round(1 + 69p)", unlock: "round(1 + 98p)", degenerate_ladder: "combined_category_percentile" },
		slot_shares: { helmet: 0.15, chest: 0.3, pants: 0.25, gloves: 0.1, shoes: 0.1, cape: 0.1, offhand: 0 },
		rounding: { method: "largest-remainder", tie_break: "item_id", publish_after_solve: true },
		set_thresholds: [2, 3, 4, 5],
		set_cumulative_shares: [0.15, 0.35, 0.6, 1],
		set_signatures: SET_SIGNATURES,
		weight_mapping: REVIEWED_WEIGHT_INVENTORY,
		planned_items: Object.entries(PLANNED_ITEM_IDENTITIES).map(([item_id, identity]) => ({ item_id, source_item_id: PLANNED_ITEM_SOURCES[item_id], ...identity })),
		planned_route_distributions: PLANNED_ROUTE_DISTRIBUTIONS,
		hand_slot_contract: { layouts: ["one_hand", "one_hand_offhand", "dual_wield", "two_hand"], shields_trade_offense_for_survival: true },
		strict_domination: { scope: "same_ladder_equal_or_easier", comparable_coordinates: "core_and_allowed_effects", equal_or_easier_only: true },
		weight_budget_tolerance: 1e-9,
		set_bonus_target: 0.2,
		set_bonus_minimum: 0.15,
		set_bonus_maximum: 0.25,
		weapon_shared_rank_count: 11,
		weapon_shared_rank_requirements: [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99],
		weapon_reference_levels: ranking.policy.reference_levels,
		weapon_full_sheet_endpoints: ranking.policy.full_sheet_endpoints,
		weapon_rank_growth_factor: ranking.policy.growth_factor,
		weapon_rank_targets: ranking.policy.rank_targets,
		weapon_rank_boundaries: ranking.policy.rank_boundaries,
		weapon_class_multipliers: ranking.policy.class_multipliers,
		weapon_rank_targets_by_skill: ranking.policy.rank_targets_by_skill,
		weapon_rank_boundaries_by_skill: ranking.policy.rank_boundaries_by_skill,
		weapon_enhancement_policy: ranking.policy.enhancement,
		weapon_enhancement_source_hashes: ranking.policy.enhancement_source_hashes,
		weapon_enhancement_evidence_hashes: ranking.policy.enhancement_evidence_hashes,
		weapon_core_allocation_envelope: ranking.policy.core_allocation_envelope,
		weapon_enhancement_contract: "class-split-hard-endpoints-with-diagnostic-intermediate-enhancement-surface",
		armor_offensive_fields: { types: ["helmet", "chest", "pants", "gloves", "shoes"], forbidden: ["str", "dex", "int", "stat"], compensation_owner: "plan-04-weapon-numeric-fields" },
		combat_outgoing_ttk_classification: "diagnostic",
		combat_survival_ratio_minimum: 0.8,
		combat_survival_ratio_maximum: 1.2,
		release_gates: {
			weapon_full_sheet_rank: { classification: "hard", evidence_fixture: "weapon-acquisition-ranking.json", constraints: ["endpoint", "core_allocation_envelope", "rank_band", "quantization", "adjacent_band_separation", "enhancement_monotonicity"] },
			weapon_intermediate_enhancement: { classification: "diagnostic", evidence_fixture: "weapon-acquisition-ranking.json", constraints: ["target", "actual", "signed_error", "contributions"] },
			legal_hand_layout: { classification: "hard", evidence_fixture: "weapon-loadout-balance.json", constraints: ["compatibility", "range_identity", "strict_domination"] },
			outgoing_ttk: { classification: "diagnostic", evidence_fixture: "equipment-combat-matrix.json" },
			incoming_survival: { classification: "hard", evidence_fixture: "equipment-combat-matrix.json", ratio: [0.8, 1.2] },
		},
		failure_policy: "fail-closed",
		solver_status: "passed",
		constraint_inventory: constraintInventory(baseline),
		violations: [],
	};
}

function compactCore(vector, fields = CORE_FIELDS) {
	return Object.fromEntries(fields.filter((field) => Number(vector?.[field] || 0) !== 0).map((field) => [field, Number(vector[field])]))
}

function sumCore(vectors) {
	return (vectors || []).reduce((total, vector) => addCore(total, vector), Object.fromEntries(CORE_FIELDS.map((field) => [field, 0])));
}

function canonicalEnhancement(item) {
	return JSON.parse(canonicalJson({ upgrade: item?.upgrade || null, compound: item?.compound || null }));
}

function enhancedObjectHash(item) {
	return crypto.createHash("sha256").update(canonicalJson(canonicalEnhancement(item))).digest("hex");
}

function loadCatalogBeforeBaseNonweaponPublication() {
	const filename = path.resolve(REPOSITORY_ROOT, "design/items.js");
	const source = fs.readFileSync(filename, "utf8");
	const marker = "\nvar base_nonweapon_progression={";
	const cutoff = source.indexOf(marker);
	if (cutoff === -1) throw new Error("Missing base non-weapon publication marker");
	const context = { Math, ceil: Math.ceil, min: Math.min, max: Math.max, multipliers: { shells_to_gold: 1 } };
	vm.createContext(context);
	vm.runInContext(source.slice(0, cutoff), context, { filename, timeout: 250 });
	if (!context.items || typeof context.items !== "object") throw new Error("Base non-weapon pre-publication catalog is unavailable");
	return JSON.parse(canonicalJson({ items: context.items, sets: context.sets }));
}

function reviewedArmorRoleVector(baseline, weight, level, variant = "int") {
	const source = baseline.allocation_vectors[level - 1];
	if (!source) throw new Error(`Missing reviewed role vector at level ${level}`);
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

function armorOnlyRoleVector(baseline, weight, level, variant = "int") {
	const vector = reviewedArmorRoleVector(baseline, weight, level, variant);
	return Object.fromEntries(CORE_FIELDS.map((field) => [field, ["str", "dex", "int"].includes(field) ? 0 : Number(vector[field] || 0)]));
}

function armorEnhancementWithoutOffense(item) {
	const enhancement = canonicalEnhancement(item);
	for (const kind of ["upgrade", "compound"]) {
		if (!enhancement[kind]) continue;
		for (const field of ["stat", "str", "dex", "int"]) delete enhancement[kind][field];
	}
	return enhancement;
}

function largestRemainderCoreAllocation(vector, destinations, weights, totalWeight, tieId, denominators = null) {
	const result = Object.fromEntries(destinations.map((destination) => [destination, Object.fromEntries(CORE_FIELDS.map((field) => [field, 0]))]));
	const evidence = Object.fromEntries(destinations.map((destination) => [destination, {}]));
	for (const field of CORE_FIELDS) {
		const pieces = destinations.map((destination) => ({ destination, value: vector[field] * weights[destination] }));
		const target = Math.round(vector[field] * totalWeight);
		const floors = pieces.reduce((total, piece) => total + Math.floor(piece.value), 0);
		for (const piece of pieces) result[piece.destination][field] = Math.floor(piece.value);
		pieces.sort((left, right) => right.value - Math.floor(right.value) - (left.value - Math.floor(left.value)) || tieId(left.destination).localeCompare(tieId(right.destination)));
		for (let index = 0; index < target - floors; index += 1) result[pieces[index].destination][field] += 1;
		for (let index = 0; index < pieces.length; index += 1) {
			const piece = pieces[index];
			evidence[piece.destination][field] = {
				raw: piece.value,
				normalization_denominator: denominators ? Number(denominators[field]) : null,
				normalized_value: denominators ? piece.value / Number(denominators[field]) : null,
				floor: Math.floor(piece.value),
				remainder: piece.value - Math.floor(piece.value),
				remainder_rank: index + 1,
				received_remainder: index < target - floors,
				tie_break: tieId(piece.destination),
				published: result[piece.destination][field],
			};
		}
	}
	return {
		allocations: Object.fromEntries(Object.entries(result).map(([key, value]) => [key, compactCore(value)])),
		evidence,
	};
}

function reviewedSlotRoutes(routes) {
	const availabilityOrder = { permanent: 0, event: 1, unsupported: 2 };
	const selected = new Map();
	for (const route of [...routes].sort((left, right) => (availabilityOrder[left.availability || "unsupported"] ?? 3) - (availabilityOrder[right.availability || "unsupported"] ?? 3) || Number(left.selected_effort || Infinity) - Number(right.selected_effort || Infinity) || String(left.selected_route_id || left.route_id || left.item_id).localeCompare(String(right.selected_route_id || right.route_id || right.item_id))))
		if (!selected.has(route.item_id)) selected.set(route.item_id, route);
	return [...selected.values()];
}

function canonicalArmorRoundingTolerance(denominators) {
	return 2 * CORE_FIELDS.reduce((total, field) => total + 1 / Number(denominators[field]), 0);
}

function assertCanonicalArmorCrossWeightRounding(baseline, destinations, weights, totalWeight) {
	const profiles = [
		{ id: "heavy", weight: "heavy", variant: "int" },
		{ id: "medium", weight: "medium", variant: "int" },
		{ id: "light", weight: "light", variant: "int" },
		{ id: "light_dex", weight: "light", variant: "dex" },
	];
	const tolerance = canonicalArmorRoundingTolerance(baseline.normalization_denominators);
	let observed = 0;
	for (let level = 1; level <= 70; level += 1) {
		const allocations = Object.fromEntries(profiles.map((profile) => [profile.id, largestRemainderCoreAllocation(armorOnlyRoleVector(baseline, profile.weight, level, profile.variant), destinations, weights, totalWeight, String, baseline.normalization_denominators).allocations]));
		for (const slot of destinations) {
			const totals = profiles.map((profile) => normalizedCore(allocations[profile.id][slot], baseline.normalization_denominators));
			const spread = Math.max(...totals) - Math.min(...totals);
			observed = Math.max(observed, spread);
		}
	}
	return {
		legacy_tolerance: tolerance,
		observed,
		status: "non-gating-after-offensive-armor-removal",
		reason: "Removing STR/DEX/INT changes normalized cross-weight totals; the locked armor-offense rule supersedes the old rounding-only spread gate.",
	};
}

function buildArmorSetBalanceFixture({ baseline = buildVanillaBaseline(), acquisition = buildEquipmentAcquisitionFixture(), data = loadSourceData(), beforePublication = loadCatalogBeforeBaseNonweaponPublication() } = {}) {
	const contract = buildBalanceContract(baseline);
	const slots = ["helmet", "chest", "pants", "gloves", "shoes"];
	const baseSlotWeights = Object.fromEntries(slots.map((slot) => [slot, .8 * contract.slot_shares[slot]]));
	const baseSlotWeight = .8 * slots.reduce((total, slot) => total + contract.slot_shares[slot], 0);
	const crossWeightRounding = assertCanonicalArmorCrossWeightRounding(baseline, slots, baseSlotWeights, baseSlotWeight);
	const setRanks = Object.fromEntries(Object.entries(acquisition.ladders.armor_sets).flatMap(([weight, rows]) => rows.map((row) => [row.set_id, { ...row, weight }])));
	const itemMap = {};
	const itemRows = {};
	const setRows = {};
	const publishItem = (itemId, row) => {
		if (itemMap[itemId]) return;
		const beforeItem = beforePublication.items[itemId];
		const finalItem = data.items[itemId];
		if (!beforeItem || !finalItem) throw new Error(`Missing enhancement authority for ${itemId}`);
		const sourceEnhancement = canonicalEnhancement(beforeItem);
		const enhancement = REBALANCED_ARMOR_TYPES.has(row.type) ? armorEnhancementWithoutOffense(beforeItem) : sourceEnhancement;
		itemMap[itemId] = compactCore(row.base_core);
		itemRows[itemId] = {
			type: row.type,
			weight: row.weight,
			scope: row.scope,
			...(row.set_id ? { set_id: row.set_id } : {}),
			...(row.slot ? { slot: row.slot } : {}),
			variant: row.variant,
			acquisition: row.acquisition,
			base_core: itemMap[itemId],
			normalized_total: normalizedCore(itemMap[itemId], baseline.normalization_denominators),
			source_enhancement: sourceEnhancement,
			enhancement,
			enhancement_hash: crypto.createHash("sha256").update(canonicalJson(enhancement)).digest("hex"),
			offense_removal: {
				base: Object.fromEntries(["str", "dex", "int"].map((field) => [field, { source: Number(beforeItem[field] || 0), published: Number(itemMap[itemId][field] || 0) }])),
				enhancement: Object.fromEntries(["upgrade", "compound"].map((kind) => [kind, Object.fromEntries(["stat", "str", "dex", "int"].map((field) => [field, { source: Number(sourceEnhancement[kind]?.[field] || 0), published: Number(enhancement[kind]?.[field] || 0) }]))])),
			},
			rounding: row.rounding,
			...(row.event_only ? { event_only: true } : {}),
		};
	};
	for (const [setId, details] of Object.entries(acquisition.ladders.armor_set_details)) {
		const rank = setRanks[setId];
		const variant = setId === "bunny" ? "dex" : "int";
		const vector = armorOnlyRoleVector(baseline, rank.weight, rank.mapped_level, variant);
		const choices = Object.fromEntries(slots.map((slot) => [slot, reviewedSlotRoutes(details.slots[slot])]));
		const availability = slots.every((slot) => choices[slot].some((route) => route.availability === "permanent")) ? "permanent" : "event";
		const canonicalSlots = Object.fromEntries(slots.map((slot) => {
			const choice = choices[slot][0];
			return [slot, choice.item_id];
		}));
		const baseAllocation = largestRemainderCoreAllocation(vector, slots, baseSlotWeights, baseSlotWeight, (slot) => canonicalSlots[slot], baseline.normalization_denominators);
		const bases = baseAllocation.allocations;
		for (const slot of slots) for (const route of choices[slot]) publishItem(route.item_id, {
			type: data.items[route.item_id].type,
			weight: rank.weight,
			scope: "set_piece",
			set_id: setId,
			slot,
			variant,
			acquisition: { percentile: rank.percentile, mapped_level: rank.mapped_level, unlock: rank.unlock, tie_band: rank.tie_band, selected_effort: rank.selected_effort, availability: route.availability || "unsupported", route_id: route.selected_route_id || route.route_id || null, route_effort: Number.isFinite(Number(route.selected_effort)) ? Number(route.selected_effort) : null },
			base_core: bases[slot],
			rounding: baseAllocation.evidence[slot],
		});
		const bonusAllocation = largestRemainderCoreAllocation(vector, [2, 3, 4, 5], { 2: .027, 3: .036, 4: .045, 5: .072 }, .18, String, baseline.normalization_denominators);
		const increments = bonusAllocation.allocations;
		const signature = contract.set_signatures[setId];
		increments[2] = { ...increments[2], [signature[0]]: 1 };
		increments[5] = { ...increments[5], [signature[1]]: 1 };
		const cumulative = {};
		let core = Object.fromEntries(CORE_FIELDS.map((field) => [field, 0]));
		let effects = Object.fromEntries(EFFECT_FIELDS.map((field) => [field, 0]));
		for (const threshold of [2, 3, 4, 5]) {
			core = Object.fromEntries(CORE_FIELDS.map((field) => [field, core[field] + Number(increments[threshold][field] || 0)]));
			effects = Object.fromEntries(EFFECT_FIELDS.map((field) => [field, effects[field] + Number(increments[threshold][field] || 0)]));
			cumulative[threshold] = { core: compactCore(core), effects: compactCore(effects, EFFECT_FIELDS) };
		}
		const caps = Object.fromEntries(signature.map((effect) => {
			const envelope = baseline.effect_envelopes.find((row) => row.effect === effect && row.band === `power-${rank.mapped_level}`);
			return [effect, envelope?.status === "capped"
				? { cap: envelope.cap, source: "pinned_envelope", band: envelope.band }
				: { cap: 1, source: "reviewed_lower_value", band: `power-${rank.mapped_level}`, reason: "No positive pinned sample exists in the local or adjacent acquisition band; the reviewed minimum preserves the mandated signature without relaxing into a higher value." }];
		}));
		const rawTotal = sumCore(Object.values(canonicalSlots).map((itemId) => itemMap[itemId]));
		setRows[setId] = {
			weight: rank.weight,
			variant,
			acquisition: { percentile: rank.percentile, mapped_level: rank.mapped_level, unlock: rank.unlock, tie_band: rank.tie_band, selected_effort: rank.selected_effort, availability, route_effort: rank.selected_effort },
			role_core: compactCore(vector),
			canonical_slots: canonicalSlots,
			raw_total: rawTotal,
			raw_normalized_total: normalizedCore(rawTotal, baseline.normalization_denominators),
			bonus_total: cumulative[5].core,
			bonus_normalized_total: normalizedCore(cumulative[5].core, baseline.normalization_denominators),
			target_normalized_total: normalizedCore(vector, baseline.normalization_denominators) * .9,
			raw_rounding: baseAllocation.evidence,
			bonus_rounding: bonusAllocation.evidence,
			increments,
			cumulative,
			signature,
			caps,
		};
	}
	for (const row of acquisition.rows.filter((row) => ["helmet", "chest", "pants", "gloves", "shoes", "cape"].includes(row.type))) {
		if (itemMap[row.item_id]) continue;
		const variant = row.weight === "light" && row.item_id === "handofmidas" ? "dex" : "int";
		const vector = row.type === "cape"
			? reviewedArmorRoleVector(baseline, row.weight, row.mapped_level, variant)
			: armorOnlyRoleVector(baseline, row.weight, row.mapped_level, variant);
		const share = row.type === "cape" ? contract.slot_shares.cape : contract.slot_shares[row.type];
		const allocation = largestRemainderCoreAllocation(vector, [row.item_id], { [row.item_id]: share }, share, String, baseline.normalization_denominators);
		publishItem(row.item_id, { type: row.type, weight: row.weight, scope: row.type === "cape" ? "cape" : "standalone", variant, acquisition: { percentile: row.percentile, mapped_level: row.mapped_level, unlock: row.unlock, tie_band: row.tie_band, selected_effort: row.selected_effort, availability: "permanent", ladder_id: row.ladder_id }, base_core: allocation.allocations[row.item_id], rounding: allocation.evidence[row.item_id] });
	}
	for (const event of reviewedNonWeaponCatalog(data).optional_event_rows.filter((row) => ["helmet", "chest", "pants", "gloves", "shoes", "cape"].includes(row.type))) {
		if (itemMap[event.item_id]) continue;
		const allocation = largestRemainderCoreAllocation(Object.fromEntries(CORE_FIELDS.map((field) => [field, 0])), [event.item_id], { [event.item_id]: 0 }, 0, String, baseline.normalization_denominators);
		publishItem(event.item_id, { type: event.type, weight: data.items[event.item_id].armor_weight, scope: event.type === "cape" ? "cape" : "standalone", variant: "int", acquisition: { percentile: 0, mapped_level: 1, unlock: 1, tie_band: 0, selected_effort: 0, availability: "event", permanent_alternative: "lower_optional" }, base_core: {}, rounding: allocation.evidence[event.item_id], event_only: true });
	}
	const dominationVector = (vector) => Object.fromEntries(DOMINATION_FIELDS.map((field) => [field, Number(vector?.[field] || 0)]));
	const dominationRow = (row) => ({
		...row,
		vector: dominationVector(row.vector),
		normalized_vector: Object.fromEntries(DOMINATION_FIELDS.map((field) => [field, CORE_FIELDS.includes(field) ? Number(row.vector?.[field] || 0) / Number(baseline.normalization_denominators[field]) : Number(row.vector?.[field] || 0)])),
		route_effort: row.route_effort !== null && row.route_effort !== undefined && Number.isFinite(Number(row.route_effort)) ? Number(row.route_effort) : null,
		comparable: Number.isFinite(Number(row.effort)),
		...(Number.isFinite(Number(row.effort)) ? {} : { exclusion: "unsupported acquisition route" }),
	});
	const dominationRows = [
		...Object.entries(itemRows).map(([itemId, row]) => dominationRow({
			id: `raw:${itemId}`,
			scope: row.scope === "set_piece" ? "raw_piece" : row.scope,
			ladder_id: row.scope === "set_piece" ? row.acquisition.availability === "permanent" ? `raw_piece:${row.weight}:${row.slot}` : `raw_piece:event:${row.set_id}:${row.slot}` : row.acquisition.ladder_id || `${row.scope}:${row.weight}:${row.type}:${row.acquisition.availability}`,
			tie_band: row.acquisition.tie_band,
			effort: row.acquisition.selected_effort,
			route_effort: row.scope === "set_piece" ? row.acquisition.route_effort : row.acquisition.selected_effort,
			vector: row.base_core,
		})),
		...Object.entries(setRows).flatMap(([setId, row]) => [2, 3, 4, 5].map((threshold) => dominationRow({
			id: `threshold:${setId}:${threshold}`,
			scope: "cumulative_threshold",
			ladder_id: row.acquisition.availability === "permanent" ? `set_threshold:${row.weight}:${threshold}` : `set_threshold:event:${setId}:${threshold}`,
			tie_band: row.acquisition.tie_band,
			effort: row.acquisition.selected_effort,
			route_effort: row.acquisition.route_effort,
			vector: { ...row.cumulative[threshold].core, ...row.cumulative[threshold].effects },
		}))),
		...Object.entries(setRows).map(([setId, row]) => dominationRow({
			id: `complete:${setId}`,
			scope: "completed_set",
			ladder_id: row.acquisition.availability === "permanent" ? `completed_set:${row.weight}` : `completed_set:event:${setId}`,
			tie_band: row.acquisition.tie_band,
			effort: row.acquisition.selected_effort,
			route_effort: row.acquisition.route_effort,
			vector: { ...sumCore([row.raw_total, row.bonus_total]), ...Object.fromEntries(row.signature.map((effect) => [effect, 1])) },
		})),
	].sort((left, right) => left.scope.localeCompare(right.scope) || left.ladder_id.localeCompare(right.ladder_id) || left.effort - right.effort || left.id.localeCompare(right.id));
	assertNoStrictDomination(dominationRows, baseline.normalization_denominators, { equalOrEasier: true });
	return {
		schema_version: 2,
		derivation: { pinned_commit: PINNED_COMMIT, core_fields: [...CORE_FIELDS], effect_fields: [...EFFECT_FIELDS], normalization_denominators: baseline.normalization_denominators, slot_shares: contract.slot_shares, raw_piece_share: .8, completed_set_bonus_share: .2, completed_nonweapon_share: .9, cross_weight_rounding: crossWeightRounding, threshold_increment_shares: { 2: .15, 3: .2, 4: .25, 5: .4 }, cumulative_shares: { 2: .15, 3: .35, 4: .6, 5: 1 } },
		items: Object.fromEntries(Object.entries(itemRows).sort(([left], [right]) => left.localeCompare(right))),
		sets: Object.fromEntries(Object.entries(setRows).sort(([left], [right]) => left.localeCompare(right))),
		event_only_rows: Object.keys(itemRows).filter((itemId) => itemRows[itemId].event_only).sort(),
		domination_rows: dominationRows,
	};
}

function validateArmorSetBalanceFixture(fixture, generated = buildArmorSetBalanceFixture()) {
	if (fixture?.schema_version !== 2 || canonicalJson(fixture) !== canonicalJson(generated)) throw new Error("Armor set balance fixture drifted from deterministic generation");
	return true;
}

function violation(rule, ids, actual, expected) {
	const error = new Error(`${rule}: ${ids.join(", ")}`);
	error.code = "equipment_balance_violation";
	error.rule = rule;
	error.ids = [...ids];
	error.actual = actual;
	error.expected = expected;
	throw error;
}

function normalizedCore(vector, denominators) {
	return CORE_FIELDS.reduce((sum, field) => {
		const value = Number(vector?.[field] || 0);
		const denominator = Number(denominators?.[field]);
		if (!Number.isFinite(value) || !Number.isFinite(denominator) || denominator <= 0) violation("finite_core_budget", [field], value, denominator);
		return sum + value / denominator;
	}, 0);
}

function assertEqualWeightBudgets(vectors, denominators, tolerance = 1e-9) {
	const totals = Object.entries(vectors || {}).map(([weight, vector]) => [weight, normalizedCore(vector, denominators)]);
	if (totals.length !== 3 || totals.some(([, total]) => !Number.isFinite(total))) violation("equal_weight_budget", totals.map(([weight]) => weight), totals, "three finite totals");
	const [, first] = totals[0];
	for (const [, total] of totals) if (Math.abs(total - first) > tolerance) violation("equal_weight_budget", totals.map(([weight]) => weight), totals, tolerance);
	return totals;
}

function effectCap(samples, { allowAdjacent = null } = {}) {
	let values = [...(samples || [])].filter((value) => Number.isFinite(value) && value > 0).sort((left, right) => left - right);
	const sparse = values.length < 4;
	if (sparse && allowAdjacent) values = values.concat(allowAdjacent.filter((value) => Number.isFinite(value) && value > 0)).sort((left, right) => left - right);
	if (!values.length) violation("capless_effect", ["effect"], values, "positive pinned sample");
	if (sparse) return values.at(-1);
	const quartile = (fraction) => values[Math.floor((values.length - 1) * fraction)];
	const q1 = quartile(0.25);
	const q3 = quartile(0.75);
	const fence = q3 + 1.5 * (q3 - q1);
	return values.filter((value) => value <= fence).at(-1);
}

function assertNoStrictDomination(rows, denominators = null, { equalOrEasier = false } = {}) {
	const normalized = (row, field) => CORE_FIELDS.includes(field) && denominators ? Number(row.vector?.[field] || 0) / Number(denominators[field]) : Number(row.vector?.[field] || 0);
	for (const left of rows || []) for (const right of rows || []) {
		if (!left?.id || !right?.id) violation("finite_domination_row", [left?.id || "unknown", right?.id || "unknown"], { left, right }, "finite IDs");
		if (left.comparable === false || right.comparable === false) continue;
		if (!Number.isFinite(Number(left.effort)) || !Number.isFinite(Number(right.effort))) violation("finite_domination_row", [left.id, right.id], { left, right }, "finite comparable efforts");
		const leftGroup = `${left.ladder_id || "legacy"}:${left.tie_band ?? 1}`;
		const rightGroup = `${right.ladder_id || "legacy"}:${right.tie_band ?? 1}`;
		if (left === right || left.ladder_id !== right.ladder_id || (!equalOrEasier && leftGroup !== rightGroup) || Number(left.effort) > Number(right.effort)) continue;
		const fields = DOMINATION_FIELDS;
		if (fields.some((field) => !Number.isFinite(normalized(left, field)) || !Number.isFinite(normalized(right, field)))) violation("finite_domination_vector", [left.id, right.id], { left: left.vector, right: right.vector }, "finite normalized comparable coordinates");
		const noWorse = fields.every((field) => normalized(left, field) >= normalized(right, field));
		const better = fields.some((field) => normalized(left, field) > normalized(right, field));
		if (noWorse && better) violation("strict_domination", [left.id, right.id], { ladder_id: left.ladder_id || "legacy", tie_band: left.tie_band ?? 1, dominating: left.vector, dominated: right.vector }, equalOrEasier ? "same-ladder equal-or-easier normalized Pareto sidegrade" : "same-ladder normalized Pareto sidegrade");
	}
	return true;
}

function assertRatio(rule, actual, minimum, maximum, ids) {
	if (!Number.isFinite(actual) || actual < minimum || actual > maximum) violation(rule, ids, actual, `[${minimum}, ${maximum}]`);
	return actual;
}

function requiredSolveInventory(baseline = buildVanillaBaseline(), acquisition = buildEquipmentAcquisitionFixture(), weaponFixture = loadRankingFixture()) {
	const candidateData = loadSourceData();
	const candidateItem = (item_id) => candidateData.items[item_id] || candidateData.items[PLANNED_ITEM_SOURCES[item_id]];
	const candidateSetVector = (set_id) => {
		const pieces = Object.values(ARMOR_SET_SLOTS[set_id]).map((alternatives) => alternatives.map(candidateItem).find(Boolean));
		if (pieces.some((piece) => !piece)) throw new Error(`Candidate domination set is incomplete: ${set_id}`);
		const raw = pieces.reduce((vector, piece) => addVector(vector, pinnedItemProperties(piece), DOMINATION_FIELDS), Object.fromEntries(DOMINATION_FIELDS.map((field) => [field, 0])));
		return addVector(raw, cumulativeSetProperties(candidateData.sets, set_id, pieces.length), DOMINATION_FIELDS);
	};
	const armorSetRows = Object.entries(acquisition.ladders.armor_sets).flatMap(([weight, rows]) => rows.map((row) => ({ ladder_id: `armor_sets:${weight}`, id: row.set_id })));
	const rankRows = [...acquisition.rows.map((row) => ({ ladder_id: row.ladder_id, id: row.item_id })), ...armorSetRows]
		.sort((left, right) => left.ladder_id.localeCompare(right.ladder_id) || left.id.localeCompare(right.id));
	const armorSetMetadata = Object.entries(acquisition.ladders.armor_sets).flatMap(([weight, rows]) => rows.map((row) => ({
		id: `set:armor_sets:${weight}:${row.set_id}`,
		ladder_id: `armor_sets:${weight}`,
		tie_band: row.tie_band,
		effort: row.selected_effort,
	})));
	const domination = [
		...acquisition.rows.map((row) => {
			const item = candidateItem(row.item_id);
			if (!item) throw new Error(`Candidate domination item is unavailable: ${row.item_id}`);
			return { id: `item:${row.ladder_id}:${row.item_id}`, ladder_id: row.ladder_id, tie_band: row.tie_band, effort: row.selected_effort, vector: pinnedItemProperties(item) };
		}),
		...armorSetMetadata.map((row) => {
			const set_id = row.id.slice(row.id.lastIndexOf(":") + 1);
			return { ...row, vector: candidateSetVector(set_id) };
		}),
	].sort((left, right) => left.id.localeCompare(right.id));
	const weapon_full_sheet = weaponFixture.weapons.map((weapon) => ({
		id: weapon.weapon_id,
		shared_rank: weapon.shared_rank,
		target: weapon.assigned_dps_target,
		actual: weapon.solved_dps,
		lower: weapon.rank_band.lower,
		upper: weapon.rank_band.upper,
		lower_inclusive: weapon.rank_band.lower_inclusive,
		upper_inclusive: weapon.rank_band.upper_inclusive,
	})).sort((left, right) => left.id.localeCompare(right.id));
	const bands = [...new Set(Object.values(acquisition.ladders.armor_sets).flat().map((row) => `power-${row.mapped_level}`))].sort((left, right) => Number(left.slice(6)) - Number(right.slice(6)));
	const hardMonsterIds = Object.entries(baseline.monsters).filter(([, row]) => row.classification === "hard").map(([id]) => id).sort();
	const combat = hardMonsterIds.flatMap((monster_id) => ROLE_SKILLS.flatMap((skill) => ["heavy", "medium", "light"].flatMap((weight) => bands.map((band) =>
		`${monster_id}:${skill}:${weight}:${band}:survival`,
	))));
	return {
		budget: baseline.allocation_vectors.map((_, index) => String(index + 1)),
		effect: constraintInventory(baseline, acquisition).required_effects.map((row) => `${row.effect}:${row.band}`).sort(),
		domination,
		combat,
		set_bonus: Object.keys(ARMOR_SET_SLOTS).sort(),
		weapon_full_sheet,
		rank: rankRows.map((row) => `${row.ladder_id}:${row.id}`),
		mob: Object.keys(baseline.monsters).sort(),
	};
}

function assertSolveInput(input, inventory = requiredSolveInventory()) {
	const required = ["budget_vectors", "budget_rows", "denominators", "effect_samples", "domination_rows", "combat_rows", "set_bonus_rows", "weapon_full_sheet_rows", "rank_rows", "mob_rows"];
	for (const key of required) if (!(key in input) || input[key] === null || input[key] === undefined) violation("missing_solve_section", [key], input[key], "required complete solve section");
	if (!Array.isArray(input.budget_rows) || !Array.isArray(input.effect_samples) || !Array.isArray(input.domination_rows) || !Array.isArray(input.combat_rows) || !Array.isArray(input.set_bonus_rows) || !Array.isArray(input.weapon_full_sheet_rows) || !Array.isArray(input.rank_rows) || !Array.isArray(input.mob_rows)) violation("invalid_solve_section", ["arrays"], input, "typed arrays");
	const exact = (section, rows, key) => {
		const expected = new Set(["domination", "weapon_full_sheet"].includes(section) ? inventory[section].map((row) => row.id) : inventory[section] || []);
		const actual = new Set(rows.map(key));
		if (!expected.size || expected.size !== actual.size || [...expected].some((value) => !actual.has(value))) violation(`${section}_completeness`, [...actual].sort(), [...expected].sort(), "complete reviewed inventory");
	};
	exact("budget", input.budget_rows, (row) => String(row.level));
	exact("effect", input.effect_samples, (row) => `${row.effect}:${row.band}`);
	exact("domination", input.domination_rows, (row) => row.id);
	exact("combat", input.combat_rows, (row) => row.key);
	exact("set_bonus", input.set_bonus_rows, (row) => row.id);
	exact("weapon_full_sheet", input.weapon_full_sheet_rows, (row) => row.id);
	exact("rank", input.rank_rows, (row) => `${row.ladder_id}:${row.id}`);
	exact("mob", input.mob_rows, (row) => row.id);
	return true;
}

function assertPinnedDenominators(actual, expected) {
	for (const field of CORE_FIELDS) {
		const value = Number(actual?.[field]);
		const pinned = Number(expected?.[field]);
		if (!Number.isFinite(value) || value !== pinned) violation("normalization_denominators", [field], value, pinned);
	}
	return true;
}

function assertDominationMetadata(rows, expectedRows) {
	const expected = new Map(expectedRows.map((row) => [row.id, row]));
	for (const row of rows) {
		const source = expected.get(row.id);
		if (!source || row.ladder_id !== source.ladder_id || Number(row.tie_band) !== Number(source.tie_band) || Number(row.effort) !== Number(source.effort))
			violation("domination_metadata", [row.id || "unknown"], { ladder_id: row.ladder_id, tie_band: row.tie_band, effort: row.effort }, source || "reviewed acquisition metadata");
		const keys = Object.keys(row.vector || {}).sort();
		if (keys.length !== DOMINATION_FIELDS.length || keys.some((field, index) => field !== DOMINATION_FIELDS.slice().sort()[index]))
			violation("domination_vector", [row.id || "unknown"], keys, DOMINATION_FIELDS);
		for (const field of DOMINATION_FIELDS) if (!Number.isFinite(Number(row.vector?.[field])) || Number(row.vector[field]) !== Number(source.vector[field]))
			violation("domination_vector", [row.id], row.vector, source.vector);
	}
	return true;
}

function assertPinnedEffectSample(sample, envelopes) {
	const source = envelopes.get(`${sample.effect}:${sample.band}`);
	if (!source) violation("effect_evidence", [sample.effect || "effect", sample.band || "band"], sample, "pinned effect envelope");
	if (!Number.isFinite(Number(sample.actual))) violation("finite_effect_sample", [sample.effect, sample.band], sample.actual, "finite effect actual");
	if (canonicalJson(sample.values || []) !== canonicalJson(source.local_sample_values) || canonicalJson(sample.adjacent_values || []) !== canonicalJson(source.adjacent_values))
		violation("effect_evidence", [sample.effect, sample.band], { values: sample.values, adjacent_values: sample.adjacent_values }, { values: source.local_sample_values, adjacent_values: source.adjacent_values });
	if (source.status === "capped") {
		if (sample.source !== "pinned_envelope" || Number(sample.actual) > Number(source.cap)) violation("effect_cap", [sample.effect, sample.band], sample, source.cap);
	} else if (sample.source !== "reviewed_lower_value" || Number(sample.actual) !== 1 || typeof sample.reason !== "string" || !sample.reason.length) {
		violation("reviewed_effect_value", [sample.effect, sample.band], sample, "reviewed lower value 1 with reason");
	}
	return true;
}

function assertSetBonusRows(rows) {
	for (const row of rows) assertRatio("set_bonus_share", row.ratio, 0.15, 0.25, [row.id || "set"]);
	return true;
}

function assertWeaponFullSheetRows(rows, expectedRows) {
	const expected = new Map(expectedRows.map((row) => [row.id, row]));
	const rankBands = new Map();
	for (const row of rows) {
		const source = expected.get(row.id);
		if (!source || canonicalJson(row) !== canonicalJson(source)) violation("weapon_full_sheet_evidence", [row.id || "unknown"], row, source || "ranked weapon evidence");
		const lowerPass = row.lower_inclusive ? row.actual >= row.lower : row.actual > row.lower;
		const upperPass = row.upper_inclusive ? row.actual <= row.upper : row.actual < row.upper;
		if (!Number.isFinite(row.actual) || row.actual <= 0 || !lowerPass || !upperPass) violation("weapon_rank_band", [row.id], row.actual, { lower: row.lower, upper: row.upper, lower_inclusive: row.lower_inclusive, upper_inclusive: row.upper_inclusive });
		if (!rankBands.has(row.shared_rank)) rankBands.set(row.shared_rank, []);
		rankBands.get(row.shared_rank).push(row.actual);
	}
	for (let rank = 1; rank < 11; rank += 1) {
		const current = rankBands.get(rank) || [];
		const next = rankBands.get(rank + 1) || [];
		if (!current.length || !next.length || Math.max(...current) >= Math.min(...next)) violation("weapon_rank_separation", [`rank-${rank}`, `rank-${rank + 1}`], { current_maximum: current.length ? Math.max(...current) : null, next_minimum: next.length ? Math.min(...next) : null }, "strictly separated adjacent full-sheet rank bands");
	}
	return true;
}

function assertRankRows(rows) {
	const ladders = new Map();
	for (const row of rows) {
		if (!row?.id || !row?.ladder_id || !Number.isFinite(Number(row.effort)) || !Number.isFinite(Number(row.unlock)))
			violation("finite_rank_row", [row?.id || "unknown"], row, "finite ID, ladder, effort, and unlock");
		if (!ladders.has(row.ladder_id)) ladders.set(row.ladder_id, []);
		ladders.get(row.ladder_id).push(row);
	}
	for (const [ladder_id, ladder] of ladders) {
		const ordered = [...ladder].sort((left, right) => left.effort - right.effort || left.id.localeCompare(right.id));
		for (let index = 1; index < ordered.length; index += 1) {
			const previous = ordered[index - 1];
			const current = ordered[index];
			if (!Number.isFinite(previous.effort) || !Number.isFinite(current.effort) || !Number.isFinite(previous.unlock) || !Number.isFinite(current.unlock) || previous.effort > current.effort || previous.unlock > current.unlock) violation("rank_inversion", [previous.id || `${ladder_id}:${index - 1}`, current.id || `${ladder_id}:${index}`], { previous, current }, "nondecreasing effort and unlock");
		}
	}
	return true;
}

function assertMobRows(rows) {
	const reasons = new Set(["cooperative", "special", "event", "boss_or_raid", "scripted_mechanic"]);
	for (const row of rows) if (!row?.id || !["hard", "diagnostic"].includes(row.classification) || row.classification === "diagnostic" && !reasons.has(row.reason) || row.classification === "hard" && row.reason !== null) violation("mob_classification", [row?.id || "unknown"], row, "classified hard or reviewed diagnostic reason");
	return true;
}

function evidenceNumber(value) {
	if (!Number.isFinite(Number(value))) return value;
	return Number(Number(value).toPrecision(12));
}

function compactNumericFields(source, fields) {
	return Object.fromEntries(fields.filter((field) => Number(source?.[field] || 0) !== 0).map((field) => [field, evidenceNumber(source[field])]));
}

function weaponStateRows(data, ranking, calculators, baseline) {
	return ranking.weapons.flatMap((weapon) => {
		const definition = data.items[weapon.weapon_id];
		const enhancementKind = definition.compound ? "compound" : definition.upgrade ? "upgrade" : null;
		const attackGrowth = Number(definition[enhancementKind]?.attack || 0);
		const allocation = { str: Number(definition.str || 0), int: Number(definition.int || 0), dex: Number(definition.dex || 0) };
		const context = fullSheetContext(data, calculators, baseline, weapon);
		const maximumLevel = enhancementKind === "compound" ? 10 : 12;
		return Array.from({ length: maximumLevel + 1 }, (_, level) => {
			const properties = calculators.current.calculate_item_properties({ name: weapon.weapon_id, level });
			const stats = context.evaluateState(level, Number(definition.attack || 0), attackGrowth, allocation);
			return {
				weapon_id: weapon.weapon_id,
				skill: weapon.skill,
				shared_rank: weapon.shared_rank,
				role: weapon.role,
				level,
				attack_property: evidenceNumber(properties.attack),
				hit_damage: evidenceNumber(stats.sheet_attack),
				attacks_per_second: evidenceNumber(stats.sheet_frequency),
				base_dps: evidenceNumber(stats.dps),
				range: evidenceNumber(properties.range + WEAPON_PROFILES[definition.wtype].range),
			};
		});
	});
}

function reviewedOffhandRows(data, acquisition, calculators) {
	const acquisitionRows = new Map(Object.values(acquisition.ladders.offhands).flat().map((row) => [row.item_id, row]));
	const pinnedItems = pinnedCatalog("design/items.js", "items");
	return REVIEWED_OFFHAND_IDS.map((itemId) => {
		const item = data.items[itemId];
		const pinned = pinnedItems[itemId];
		const acquisitionRow = acquisitionRows.get(itemId);
		if (!item || !pinned || !acquisitionRow) throw new Error(`Missing reviewed offhand authority: ${itemId}`);
		const expectedRequirements = [{ any_skill: OFFHAND_REQUIREMENT_SKILLS[item.type], level: acquisitionRow.unlock }];
		if (canonicalJson(data.itemRequirements[itemId]) !== canonicalJson(expectedRequirements)) throw new Error(`Offhand requirement drifted: ${itemId}`);
		if (canonicalJson(canonicalEnhancement(item)) !== canonicalJson(canonicalEnhancement(pinned))) throw new Error(`Offhand enhancement drifted: ${itemId}`);
		const properties = calculators.current.calculate_item_properties({ name: itemId, level: 0 });
		return {
			item_id: itemId,
			type: item.type,
			legal_hand_profile: acquisitionRow.legal_hand_profile,
			selected_route_id: acquisitionRow.selected_route_id,
			selected_effort: acquisitionRow.selected_effort,
			availability: acquisitionRow.availability,
			tie_band: acquisitionRow.tie_band,
			percentile: acquisitionRow.percentile,
			mapped_level: acquisitionRow.mapped_level,
			unlock: acquisitionRow.unlock,
			requirements: expectedRequirements,
			base_output: compactNumericFields(properties, [...DOMINATION_FIELDS, "stat", "explosion"]),
			enhancement: canonicalEnhancement(item),
			enhancement_hash: enhancedObjectHash(item),
			raw_range: Number(item.range || 0),
		};
	}).sort((left, right) => left.item_id.localeCompare(right.item_id));
}

function layoutScore(stats, data) {
	return {
		base_dps: evidenceNumber(stats.attack * stats.frequency),
		physical_survival: evidenceNumber(stats.max_hp / data.damageMultiplier(stats.armor)),
		magical_survival: evidenceNumber(stats.max_hp / data.damageMultiplier(stats.resistance)),
		range: evidenceNumber(stats.range),
		core_str: evidenceNumber(stats.str),
		core_dex: evidenceNumber(stats.dex),
		core_int: evidenceNumber(stats.int),
		core_vit: evidenceNumber(stats.vit),
		core_hp: evidenceNumber(stats.max_hp),
		core_mp: evidenceNumber(stats.max_mp),
		core_armor: evidenceNumber(stats.armor),
		core_resistance: evidenceNumber(stats.resistance),
		...compactNumericFields(stats, EFFECT_FIELDS.filter((field) => field !== "range")),
	};
}

function layoutItemIdentity(definition) {
	if (!definition) return null;
	const profile = definition.type === "weapon" ? WEAPON_PROFILES[definition.wtype] : null;
	return {
		type: definition.type,
		weapon_type: definition.wtype || null,
		damage_type: definition.damage_type || profile?.damage_type || null,
		projectile: definition.projectile || profile?.projectile || null,
		hands: profile?.hands || null,
		ability: definition.ability || null,
		aura: definition.aura || null,
	};
}

function legalHandLayouts(data, ranking, offhands, calculators, baseline) {
	const weapons = new Map(ranking.weapons.map((row) => [row.weapon_id, row]));
	const offhandRows = new Map(offhands.map((row) => [row.item_id, row]));
	const candidateOffhands = [...weapons.keys(), ...offhandRows.keys()].sort();
	const layouts = [];
	const add = (mainId, offhandId = null) => {
		const main = weapons.get(mainId);
		const mainDefinition = data.items[mainId];
		const profile = WEAPON_PROFILES[mainDefinition.wtype];
		const stat_type = ({ warrior: "str", paladin: "str", mage: "int", priest: "int", ranger: "dex", rogue: "dex" })[main.skill];
		const offhandDefinition = offhandId ? data.items[offhandId] : null;
		const offhandRank = offhandId && weapons.get(offhandId);
		const offhandRow = offhandId && offhandRows.get(offhandId);
		const offhandRequirement = offhandRank?.assigned_requirement ?? offhandRow?.requirements?.[0]?.level ?? 1;
		const offhandSharedRank = offhandRank?.shared_rank ?? Math.max(1, ranking.policy.shared_rank_requirements.findIndex((level) => level >= offhandRequirement) + 1 || ranking.policy.shared_rank_count);
		const layoutRank = Math.max(main.shared_rank, offhandSharedRank);
		const context = fullSheetContext(data, calculators, baseline, { ...main, shared_rank: layoutRank });
		const enhancementKind = mainDefinition.compound ? "compound" : mainDefinition.upgrade ? "upgrade" : null;
		const evaluated = context.evaluateState(
			0,
			Number(mainDefinition.attack || 0),
			Number(mainDefinition[enhancementKind]?.attack || 0),
			{ str: Number(mainDefinition.str || 0), int: Number(mainDefinition.int || 0), dex: Number(mainDefinition.dex || 0) },
			{ offhand: offhandId ? { name: offhandId, level: 0, stat_type } : null },
		);
		const stats = evaluated.sheet;
		const selectedOffhandEffort = offhandRank?.selected_effort ?? offhandRow?.selected_effort ?? 0;
		const offhandEffort = offhandDefinition?.type === "weapon" ? Math.max(1, selectedOffhandEffort, Number(offhandDefinition.g || 0) / 120) : selectedOffhandEffort;
		const layoutKind = profile.hands === 2 ? "two_hand" : !offhandId ? "one_hand" : offhandDefinition.type === "weapon" ? "dual_wield" : "one_hand_offhand";
		layouts.push({
			id: offhandId ? `${mainId}+${offhandId}` : mainId,
			mainhand_id: mainId,
			offhand_id: offhandId,
			skill: main.skill,
			shared_rank: main.shared_rank,
			offhand_shared_rank: offhandId ? offhandSharedRank : 0,
			layout_rank: layoutRank,
			layout_requirement: Math.max(main.assigned_requirement, offhandRequirement),
			layout_kind: layoutKind,
			offhand_type: offhandDefinition?.type || null,
			identity: { layout_kind: layoutKind, mainhand: layoutItemIdentity(data.items[mainId]), offhand: layoutItemIdentity(offhandDefinition) },
			mainhand_effort: main.selected_effort,
			offhand_effort: offhandEffort,
			acquisition_effort: evidenceNumber(main.selected_effort + offhandEffort),
			score: layoutScore(stats, data),
		});
	};
	for (const mainId of weapons.keys()) {
		add(mainId);
		for (const offhandId of candidateOffhands) {
			if (!isCompatibleOffhand({ name: mainId }, { name: offhandId }, data.items)) continue;
			add(mainId, offhandId);
		}
	}
	return layouts.sort((left, right) => left.skill.localeCompare(right.skill) || left.shared_rank - right.shared_rank || left.id.localeCompare(right.id));
}

function layoutDominationViolations(layouts) {
	const coordinates = ["base_dps", "physical_survival", "magical_survival", "range", ...CORE_FIELDS.map((field) => `core_${field}`), ...EFFECT_FIELDS.filter((field) => field !== "range")];
	const violations = [];
	for (const easier of layouts) for (const harder of layouts) {
		const easierItems = [easier.mainhand_id, easier.offhand_id].filter(Boolean).sort().join("+");
		const harderItems = [harder.mainhand_id, harder.offhand_id].filter(Boolean).sort().join("+");
		if (easier === harder || easierItems === harderItems || easier.skill !== harder.skill || easier.shared_rank !== harder.shared_rank || easier.acquisition_effort > harder.acquisition_effort || canonicalJson(easier.identity) !== canonicalJson(harder.identity)) continue;
		const left = coordinates.map((field) => Number(easier.score[field] || 0));
		const right = coordinates.map((field) => Number(harder.score[field] || 0));
		if (left.every((value, index) => value >= right[index]) && left.some((value, index) => value > right[index]))
			violations.push({ dominating_layout_id: easier.id, dominated_layout_id: harder.id, skill: easier.skill, shared_rank: easier.shared_rank, dominating_offhand_shared_rank: easier.offhand_shared_rank, dominated_offhand_shared_rank: harder.offhand_shared_rank });
	}
	return violations.sort((left, right) => left.dominating_layout_id.localeCompare(right.dominating_layout_id) || left.dominated_layout_id.localeCompare(right.dominated_layout_id));
}

function buildWeaponLoadoutBalanceFixture({ data = loadSourceData(), ranking = loadRankingFixture(), acquisition = buildEquipmentAcquisitionFixture(), baseline = buildVanillaBaseline() } = {}) {
	assertRankingEnhancementFeasible(ranking);
	const calculators = loadPropertyCalculators(data);
	const weapon_states = weaponStateRows(data, ranking, calculators, baseline);
	const offhands = reviewedOffhandRows(data, acquisition, calculators);
	const legal_layouts = legalHandLayouts(data, ranking, offhands, calculators, baseline);
	const rank_bands = Array.from({ length: ranking.policy.shared_rank_count }, (_, index) => {
		const shared_rank = index + 1;
		const rows = ranking.weapons.filter((row) => row.shared_rank === shared_rank);
		const values = rows.map((row) => row.solved_dps);
		return {
			shared_rank,
			requirement: ranking.policy.shared_rank_requirements[index],
			target: ranking.policy.rank_targets[index],
			targets_by_skill: Object.fromEntries(ranking.policy.combat_skills.map((skill) => [skill, ranking.policy.rank_targets_by_skill[skill][index]])),
			lower_boundary: index === 0 ? ranking.policy.rank_targets[0] : ranking.policy.rank_boundaries[index - 1],
			upper_boundary: index === ranking.policy.shared_rank_count - 1 ? ranking.policy.rank_targets.at(-1) : ranking.policy.rank_boundaries[index],
			boundaries_by_skill: Object.fromEntries(ranking.policy.combat_skills.map((skill) => [skill, {
				lower: index === 0 ? ranking.policy.rank_targets_by_skill[skill][0] : ranking.policy.rank_boundaries_by_skill[skill][index - 1],
				upper: index === ranking.policy.shared_rank_count - 1 ? ranking.policy.rank_targets_by_skill[skill].at(-1) : ranking.policy.rank_boundaries_by_skill[skill][index],
			}])),
			minimum: Math.min(...values),
			maximum: Math.max(...values),
			spread_ratio: evidenceNumber(Math.max(...values) / Math.min(...values)),
			weapon_ids: rows.map((row) => row.weapon_id).sort(),
			progression_count: rows.filter((row) => row.role === "progression").length,
			sidegrade_count: rows.filter((row) => row.role === "sidegrade").length,
		};
	});
	const retainedRanges = new Map(baseline.weapon_ranges.map((row) => [row.weapon_id, row]));
	const range_rows = ranking.weapons.map((weapon) => {
		const peerId = PLACEHOLDER_WEAPON_PEERS[weapon.weapon_id] || weapon.weapon_id;
		const pinned = retainedRanges.get(peerId);
		const definition = data.items[weapon.weapon_id];
		if (!pinned || !definition) throw new Error(`Missing range counterpart: ${weapon.weapon_id}`);
		return {
			weapon_id: weapon.weapon_id,
			counterpart_id: peerId,
			raw_range: Number(definition.range || 0),
			upgrade_range_delta: Number(definition.upgrade?.range || 0),
			compound_range_delta: Number(definition.compound?.range || 0),
			counterpart_raw_range: pinned.raw_range,
			counterpart_upgrade_range_delta: pinned.upgrade_range_delta,
			counterpart_compound_range_delta: pinned.compound_range_delta,
		};
	}).sort((left, right) => left.weapon_id.localeCompare(right.weapon_id));
	const domination_violations = layoutDominationViolations(legal_layouts);
	return {
		schema_version: 2,
		policy: {
			shared_rank_count: ranking.policy.shared_rank_count,
			shared_rank_requirements: ranking.policy.shared_rank_requirements,
			reference_levels: ranking.policy.reference_levels,
			full_sheet_endpoints: ranking.policy.full_sheet_endpoints,
			growth_factor: ranking.policy.growth_factor,
			rank_targets: ranking.policy.rank_targets,
			rank_boundaries: ranking.policy.rank_boundaries,
			class_multipliers: ranking.policy.class_multipliers,
			rank_targets_by_skill: ranking.policy.rank_targets_by_skill,
			rank_boundaries_by_skill: ranking.policy.rank_boundaries_by_skill,
			enhancement: ranking.policy.enhancement,
			failure_policy: "fail-closed",
		},
		counts: { weapons: ranking.weapons.length, retained_weapons: ranking.weapons.filter((row) => row.origin === "retained").length, placeholder_weapons: ranking.weapons.filter((row) => row.origin === "placeholder").length, offhands: offhands.length, legal_layouts: legal_layouts.length },
		hashes: {
			retained_catalog_identity_sha256: ranking.hashes.retained_catalog_identity_sha256,
			retained_acquisition_projection_sha256: ranking.hashes.retained_acquisition_projection_sha256,
			retained_raw_range_sha256: sha256(baseline.weapon_ranges),
			weapon_profiles_sha256: sha256(WEAPON_PROFILES),
			offhand_enhancements_sha256: sha256(offhands.map((row) => [row.item_id, row.enhancement_hash])),
			pinned_set_catalog_sha256: baseline.evidence_hashes.pinned_set_catalog_sha256,
			current_set_catalog_sha256: sha256(data.sets),
			frozen_loadout_policy_sha256: baseline.evidence_hashes.frozen_loadout_policy_sha256,
			canonical_loadouts_sha256: sha256(legal_layouts),
			weapon_states_sha256: sha256(weapon_states),
			enhancement_contribution_catalog_sha256: ranking.hashes.enhancement_contribution_catalog_sha256,
			enhancement_full_sheet_contributions_sha256: ranking.hashes.enhancement_full_sheet_contributions_sha256,
		},
		rank_bands,
		compression_rows: ranking.weapons.filter((row) => row.origin === "retained").map((row) => ({ weapon_id: row.weapon_id, skill: row.skill, historical_rank: row.historical_rank, shared_rank: row.shared_rank, role: row.role })).sort((left, right) => left.skill.localeCompare(right.skill) || left.historical_rank - right.historical_rank || left.weapon_id.localeCompare(right.weapon_id)),
		quantization_rows: ranking.weapons.map((row) => ({ weapon_id: row.weapon_id, shared_rank: row.shared_rank, ...row.quantization })).sort((left, right) => left.weapon_id.localeCompare(right.weapon_id)),
		weapon_states,
		range_rows,
		offhands,
		legal_layouts,
		domination_violations,
		application: { status: domination_violations.length ? "failed" : "passed", violations: domination_violations },
	};
}

function validateWeaponLoadoutBalanceFixture(fixture, generated = buildWeaponLoadoutBalanceFixture()) {
	if (!fixture || fixture.schema_version !== 2 || fixture.counts?.weapons !== 83 || fixture.counts?.retained_weapons !== 75 || fixture.counts?.placeholder_weapons !== 8 || fixture.rank_bands?.length !== 11 || fixture.offhands?.length !== 11 || fixture.weapon_states?.length !== 1079 || !fixture.legal_layouts?.length || fixture.application?.status !== "passed" || fixture.domination_violations?.length || canonicalJson(fixture) !== canonicalJson(generated))
		throw new Error("Weapon loadout balance fixture drifted or contains active violations");
	return true;
}

function enhancementMultiplier(definition, level) {
	return enhancementStepWeight(definition.upgrade ? "upgrade" : definition.compound ? "compound" : null, level);
}

function pinnedCombatProperties(definition, level = 0, instance = {}) {
	const properties = pinnedItemProperties(definition, level, instance);
	for (const field of ["attack", "critdamage", "miss", "avoidance", "output", "stun", "blast", "explosion", "incdmgamp", "courage", "mcourage", "pcourage"]) {
		let value = Number(definition[field] || 0);
		const enhancement = definition.upgrade || definition.compound;
		for (let current = 1; current <= level && enhancement; current += 1) value += Number(enhancement[field] || 0) * enhancementMultiplier(definition, current);
		properties[field] = Math.round(value);
	}
	return properties;
}

function classCoreItem(core, skill) {
	return {
		type: "class_core",
		name: `Pinned ${skill} class core`,
		str: core.str,
		dex: core.dex,
		int: core.int,
		vit: core.vit,
		hp: core.hp - 100 - core.vit * 48,
		mp: core.mp - 100 - core.int * 15,
		armor: core.armor,
		resistance: core.resistance,
	};
}

function normalizedPinnedWeaponCatalog(pinnedItems) {
	const catalog = JSON.parse(canonicalJson(pinnedItems));
	for (const bookId of ["wbook0", "wbook1", "wbookhs"]) {
		if (!catalog[bookId]) continue;
		catalog[bookId].type = "weapon";
		catalog[bookId].wtype = "book";
		catalog[bookId].damage_type = "magical";
		catalog[bookId].projectile = "pmagic";
		if (bookId === "wbookhs") {
			if (catalog[bookId].dex !== undefined) {
				catalog[bookId].int = catalog[bookId].dex;
				delete catalog[bookId].dex;
			}
			if (catalog[bookId].compound?.dex !== undefined) {
				catalog[bookId].compound.int = catalog[bookId].compound.dex;
				delete catalog[bookId].compound.dex;
			}
		}
	}
	return catalog;
}

function compactPinnedContribution(properties) {
	return Object.fromEntries(EVIDENCE_CONTRIBUTION_FIELDS
		.map((field) => [field, evidenceNumber(Number(properties?.[field] || 0))])
		.filter(([, value]) => value !== 0));
}

function pinnedContributionGroup(rows) {
	const items = rows.map(({ slot, item, properties }) => ({
		slot,
		item_id: item.name,
		level: Number(item.level || 0),
		stat_type: item.stat_type || null,
		properties: compactPinnedContribution(properties),
	}));
	const totals = {};
	for (const item of items)
		for (const [field, value] of Object.entries(item.properties)) totals[field] = evidenceNumber(Number(totals[field] || 0) + value);
	return { items, totals: compactPinnedContribution(totals) };
}

function pinnedContributionEvidence({ role, classDefinition, mainhand, equipmentEntries, frozenEntries, catalog, setCounts, setProperties }) {
	const itemRows = [["mainhand", mainhand], ...equipmentEntries, ...frozenEntries].map(([slot, item]) => ({
		slot,
		item,
		properties: pinnedCombatProperties(catalog[item.name], item.level || 0, item),
	}));
	const select = (predicate) => pinnedContributionGroup(itemRows.filter(predicate));
	const mainhandProfile = classDefinition.doublehand?.[catalog[mainhand.name].wtype] || classDefinition.mainhand?.[catalog[mainhand.name].wtype] || {};
	const offhandRow = itemRows.find((row) => row.slot === "offhand");
	const offhandDefinition = offhandRow && catalog[offhandRow.item.name];
	const offhandProfile = offhandDefinition ? classDefinition.offhand?.[offhandDefinition.wtype] || classDefinition.offhand?.[offhandDefinition.type] || {} : {};
	const groups = {
		class: pinnedContributionGroup([{
			slot: "class_core",
			item: { name: role.skill, level: role.level },
			properties: { ...role.class_core, attack: classDefinition.attack, frequency: classDefinition.frequency, output: classDefinition.output },
		}]),
		weapon: select((row) => row.slot === "mainhand"),
		armor: select((row) => ["helmet", "chest", "pants", "gloves", "shoes"].includes(row.slot)),
		cape: select((row) => row.slot === "cape"),
		offhand: select((row) => row.slot === "offhand"),
		accessories_orb: pinnedContributionGroup(itemRows.filter((row) => frozenEntries.some(([slot]) => slot === row.slot))),
		profile: pinnedContributionGroup([
			{ slot: "mainhand_profile", item: { name: catalog[mainhand.name].wtype, level: 0 }, properties: mainhandProfile },
			...(offhandDefinition ? [{ slot: "offhand_profile", item: { name: offhandDefinition.wtype || offhandDefinition.type, level: 0 }, properties: offhandProfile }] : []),
		]),
		set: pinnedContributionGroup(Object.keys(setCounts).length ? [{
			slot: "set",
			item: { name: Object.keys(setCounts).sort().join("+"), level: 0 },
			properties: setProperties,
		}] : []),
	};
	const groupHashes = Object.fromEntries(Object.entries(groups).map(([group, value]) => [group, sha256(value)]));
	const loadout = itemRows
		.map(({ slot, item }) => ({ slot, item_id: item.name, level: Number(item.level || 0), stat_type: item.stat_type || null }))
		.sort((left, right) => left.slot.localeCompare(right.slot));
	return {
		fields: [...EVIDENCE_CONTRIBUTION_FIELDS],
		groups,
		group_hashes: groupHashes,
		set_counts: setCounts,
		set_sha256: sha256({ counts: setCounts, contribution: groups.set }),
		loadout,
		loadout_sha256: sha256(loadout),
		contributions_sha256: sha256(groups),
	};
}

function legacyEndpointCombatSheet({ role, classDefinition, mainhand, equipmentEntries, frozenEntries, catalog, setProperties }) {
	const itemRows = [
		["mainhand", mainhand],
		...equipmentEntries,
		...frozenEntries,
	].map(([slot, item]) => ({ slot, item, properties: pinnedCombatProperties(catalog[item.name], item.level || 0, item) }));
	const sheet = {
		str: Number(role.class_core.str || 0),
		dex: Number(role.class_core.dex || 0),
		int: Number(role.class_core.int || 0),
	};
	for (const { properties } of itemRows)
		for (const field of ["str", "dex", "int"]) sheet[field] += Number(properties[field] || 0);
	for (const field of ["str", "dex", "int"]) sheet[field] += Number(setProperties[field] || 0);

	let itemAttack = 0;
	let rawAttack = 0;
	let itemAndProfileFrequency = 0;
	let outputDelta = 0;
	const applyCombatProperties = (properties) => {
		rawAttack += Number(properties?.attack || 0);
		itemAndProfileFrequency += Number(properties?.frequency || 0) / 100;
		outputDelta += Number(properties?.output || 0);
	};
	for (const { slot, item, properties } of itemRows) {
		applyCombatProperties(properties);
		if (slot === "mainhand") {
			itemAttack += Number(properties.attack || 0);
			const weaponType = catalog[item.name].wtype;
			applyCombatProperties(classDefinition.doublehand?.[weaponType] || classDefinition.mainhand?.[weaponType]);
		}
		if (slot === "offhand") {
			itemAttack += Number(properties.attack || 0) * 0.7;
			const definition = catalog[item.name];
			applyCombatProperties(classDefinition.offhand?.[definition.wtype] || classDefinition.offhand?.[definition.type]);
		}
	}
	applyCombatProperties(setProperties);
	const offhand = itemRows.find((row) => row.slot === "offhand");
	if (offhand && catalog[mainhand.name].wtype === "stars" && catalog[offhand.item.name].wtype !== "stars") itemAttack /= 3;
	itemAttack = Math.max(itemAttack, 5);

	const primaryMultiplier = role.skill === "paladin"
		? sheet.str / 20 + sheet.int / 40
		: sheet[classDefinition.main_stat] / 20;
	const itemScaled = itemAttack * primaryMultiplier;
	const priestMultiplier = role.skill === "priest" ? 1.6 : 1;
	const preOutput = (Number(classDefinition.attack || 0) + itemScaled + rawAttack) * priestMultiplier;
	const outputPercent = Math.max(5, Number(classDefinition.output || 0) + outputDelta);
	const attack = Math.round(preOutput * outputPercent / 100);
	const levelFrequency = Math.min(role.level, 80) / 164;
	const dexFrequency = Math.min(160, sheet.dex) / 640 + Math.max(sheet.dex - 160, 0) / 925;
	const intFrequency = sheet.int / 1575;
	const classFrequency = Number(classDefinition.frequency || 0);
	const frequency = classFrequency + itemAndProfileFrequency + levelFrequency + dexFrequency + intFrequency;

	return {
		sheet: {
			attack,
			frequency: evidenceNumber(frequency),
			str: sheet.str,
			dex: sheet.dex,
			int: sheet.int,
		},
		legacy_formula: {
			attack: {
				class_base: evidenceNumber(classDefinition.attack || 0),
				item_attack: evidenceNumber(itemAttack),
				primary_multiplier: evidenceNumber(primaryMultiplier),
				item_scaled: evidenceNumber(itemScaled),
				raw_item_and_profile: evidenceNumber(rawAttack),
				priest_multiplier: evidenceNumber(priestMultiplier),
				pre_output: evidenceNumber(preOutput),
				output_percent: evidenceNumber(outputPercent),
				rounded: attack,
			},
			frequency: {
				class_base: evidenceNumber(classFrequency),
				item_and_profile: evidenceNumber(itemAndProfileFrequency),
				level: evidenceNumber(levelFrequency),
				dex: evidenceNumber(dexFrequency),
				int: evidenceNumber(intFrequency),
				total: evidenceNumber(frequency),
			},
		},
	};
}

function endpointSheet(role, mainhandId, pinnedItems, pinnedSets, classDefinitions, { upgradeLevel = 0, compoundLevel = 0 } = {}) {
	const catalog = normalizedPinnedWeaponCatalog(pinnedItems);
	const statType = FROZEN_LOADOUTS[role.skill].stat_type;
	const enhancedLevel = (itemId, fallback = 0) => catalog[itemId]?.compound ? compoundLevel : catalog[itemId]?.upgrade ? upgradeLevel : fallback;
	const mainhand = { name: mainhandId, level: enhancedLevel(mainhandId), stat_type: statType };
	const classDefinition = classDefinitions[role.skill];
	if (!catalog[mainhandId] || catalog[mainhandId].type !== "weapon" || !classDefinition) return null;
	const targetItems = Object.entries(role.loadout.target_items)
		.filter(([, item]) => item.item_id)
		.map(([slot, item]) => [slot, { name: item.item_id, level: enhancedLevel(item.item_id, item.level || 0), stat_type: item.stat_type || statType }]);
	const targetOffhand = targetItems.find(([slot]) => slot === "offhand");
	const compatibleOffhand = targetOffhand && isCompatibleOffhand(mainhand, targetOffhand[1], catalog) ? targetOffhand : null;
	const equipmentEntries = targetItems.filter(([slot]) => slot !== "offhand");
	if (compatibleOffhand) equipmentEntries.push(compatibleOffhand);
	const frozenEntries = Object.entries(role.loadout.frozen_slots).map(([slot, item]) => [slot, { name: item.item_id, level: enhancedLevel(item.item_id, item.level || 0), stat_type: item.stat_type || statType }]);
	const countedInstances = [mainhand, ...equipmentEntries.map(([, item]) => item), ...frozenEntries.map(([, item]) => item)];
	const setCounts = pinnedSetCounts(catalog, countedInstances.map((item) => ({ item_id: item.name })));
	const endpointFields = [...new Set([...DOMINATION_FIELDS, "attack", "output"])];
	const setProperties = pinnedSetProperties(pinnedSets, setCounts, endpointFields);
	const legacy = legacyEndpointCombatSheet({ role, classDefinition, mainhand, equipmentEntries, frozenEntries, catalog, setProperties });
	const contributions = pinnedContributionEvidence({ role, classDefinition, mainhand, equipmentEntries, frozenEntries, catalog, setCounts, setProperties });
	const sheet = legacy.sheet;
	const baseDps = evidenceNumber(sheet.attack * sheet.frequency);
	if (!(baseDps > 0) || !Number.isFinite(baseDps)) return null;
	const equipmentInstances = [...equipmentEntries.map(([, item]) => item), ...frozenEntries.map(([, item]) => item)];
	const equipmentCore = equipmentInstances.reduce(
		(total, item) => addCore(total, pinnedItemProperties(catalog[item.name], item.level || 0, item)),
		Object.fromEntries(CORE_FIELDS.map((field) => [field, 0])),
	);
	const equipmentWithSetCore = addCore(equipmentCore, setProperties);
	const armorSlots = new Set(["helmet", "chest", "pants", "gloves", "shoes"]);
	return {
		id: `${role.skill}:${role.level}:${mainhandId}${compatibleOffhand ? `+${compatibleOffhand[1].name}` : ""}`,
		skill: role.skill,
		reference_level: role.level,
		mainhand_id: mainhandId,
		offhand_id: compatibleOffhand?.[1].name || null,
		class_core: JSON.parse(canonicalJson(role.class_core)),
		weapon_core: pinnedItemProperties(catalog[mainhandId], mainhand.level, mainhand),
		equipment_core: Object.fromEntries(CORE_FIELDS.map((field) => [field, Number(equipmentWithSetCore[field] || 0)])),
		set_counts: setCounts,
		sheet: {
			attack: sheet.attack,
			frequency: sheet.frequency,
			str: sheet.str,
			dex: sheet.dex,
			int: sheet.int,
		},
		legacy_formula: legacy.legacy_formula,
		contributions,
		base_dps: baseDps,
		source_items: {
			mainhand: mainhandId,
			offhand: compatibleOffhand?.[1].name || null,
			armor: equipmentEntries.filter(([slot]) => armorSlots.has(slot)).map(([, item]) => item.name),
			cape: equipmentEntries.find(([slot]) => slot === "cape")?.[1].name || null,
			frozen_accessories: frozenEntries.map(([, item]) => item.name),
		},
		source_hashes: JSON.parse(canonicalJson(PINNED_BLOB_IDS)),
		enhancement_state: { upgrade_level: upgradeLevel, compound_level: compoundLevel },
	};
}

function buildWeaponRankEndpointOracle(roleRows = pinnedRoleRows(), pinnedItems = pinnedCatalog("design/items.js", "items"), pinnedSets = pinnedCatalog("design/items.js", "sets"), classDefinitions = pinnedClasses()) {
	const warriorOne = roleRows.find((row) => row.skill === "warrior" && row.level === 1);
	if (!warriorOne) throw new Error("Pinned level-1 Warrior endpoint role row is missing");
	const starterCandidates = [endpointSheet(warriorOne, warriorOne.loadout.weapon_slot.item_id, pinnedItems, pinnedSets, classDefinitions)].filter(Boolean);
	const warriorSeventy = roleRows.find((row) => row.skill === "warrior" && row.level === 70);
	if (!warriorSeventy) throw new Error("Pinned level-70 Warrior endpoint role row is missing");
	const retainedWarriorIds = loadRankingFixture().weapons
		.filter((row) => row.origin === "retained" && row.skill === "warrior")
		.map((row) => row.weapon_id);
	const endCandidates = retainedWarriorIds
		.map((weaponId) => endpointSheet(warriorSeventy, weaponId, pinnedItems, pinnedSets, classDefinitions))
		.filter(Boolean)
		.sort((left, right) => right.base_dps - left.base_dps || left.id.localeCompare(right.id));
	if (!starterCandidates.length || !endCandidates.length) throw new Error("Pinned full-sheet endpoint oracle has no valid candidates");
	if (!(endCandidates[0].base_dps > starterCandidates[0].base_dps)) throw new Error("Pinned full-sheet endpoint order is invalid");
	return {
		start: { selection: "level-1-warrior-starter", ...starterCandidates[0] },
		end: { selection: "highest-valid-level-70-warrior-mainhand", ...endCandidates[0] },
		candidate_counts: { start: starterCandidates.length, end: endCandidates.length },
	};
}

function buildWeaponRankEnhancementOracle(roleRows = pinnedRoleRows(), pinnedItems = pinnedCatalog("design/items.js", "items"), pinnedSets = pinnedCatalog("design/items.js", "sets"), classDefinitions = pinnedClasses()) {
	const ranking = loadRankingFixture();
	const progression = new Map(ranking.weapons
		.filter((row) => row.skill === "warrior" && row.role === "progression")
		.map((row) => [row.shared_rank, row.weapon_id]));
	const rows = [];
	for (let rank = 1; rank <= WEAPON_REFERENCE_LEVELS.length; rank += 1) {
		const referenceLevel = WEAPON_REFERENCE_LEVELS[rank - 1];
		const role = roleRows.find((row) => row.skill === "warrior" && row.level === referenceLevel);
		const mainhandId = rank === 11 ? "scythe" : progression.get(rank);
		if (!role || !mainhandId) throw new Error(`Pinned Warrior enhancement authority is missing rank ${rank}`);
		const base = endpointSheet(role, mainhandId, pinnedItems, pinnedSets, classDefinitions);
		const states = [];
		for (let upgradeLevel = 0; upgradeLevel <= 12; upgradeLevel += 1)
			for (let compoundLevel = 0; compoundLevel <= 10; compoundLevel += 1) {
				const sheet = endpointSheet(role, mainhandId, pinnedItems, pinnedSets, classDefinitions, { upgradeLevel, compoundLevel });
				states.push({
					upgrade_level: upgradeLevel,
					compound_level: compoundLevel,
					pinned_dps: sheet.base_dps,
					amplification: evidenceNumber(sheet.base_dps / base.base_dps),
					sheet: sheet.sheet,
					contributions: sheet.contributions,
				});
			}
		rows.push({ shared_rank: rank, reference_level: referenceLevel, mainhand_id: mainhandId, base_dps: base.base_dps, states });
	}
	return rows;
}

function nearestArmorSet(armor, weight, level, forcedSetId = null) {
	const candidates = Object.entries(armor.sets)
		.filter(([setId, row]) => row.weight === weight && row.acquisition.availability === "permanent" && (!forcedSetId || setId === forcedSetId))
		.map(([set_id, row]) => ({ set_id, ...row }));
	if (!candidates.length) throw new Error(`No permanent ${weight} armor set`);
	return candidates.sort((left, right) => Math.abs(left.acquisition.mapped_level - level) - Math.abs(right.acquisition.mapped_level - level) || left.acquisition.selected_effort - right.acquisition.selected_effort || left.set_id.localeCompare(right.set_id))[0];
}

function nearestCape(armor, weight, level) {
	const candidates = Object.entries(armor.items)
		.filter(([, row]) => row.scope === "cape" && row.weight === weight && row.acquisition.availability === "permanent")
		.map(([item_id, row]) => ({ item_id, ...row }));
	return candidates.sort((left, right) => Math.abs(left.acquisition.mapped_level - level) - Math.abs(right.acquisition.mapped_level - level) || left.acquisition.selected_effort - right.acquisition.selected_effort || left.item_id.localeCompare(right.item_id))[0] || null;
}

function canonicalHandLayouts(loadoutFixture, ranking) {
	const rankById = new Map(ranking.weapons.map((row) => [row.weapon_id, row]));
	const offhandById = new Map(loadoutFixture.offhands.map((row) => [row.item_id, row]));
	const result = [];
	for (const weapon of ranking.weapons) {
		const candidates = loadoutFixture.legal_layouts.filter((row) => {
			if (row.mainhand_id !== weapon.weapon_id) return false;
			const reviewedOffhand = row.offhand_id && offhandById.get(row.offhand_id);
			return !reviewedOffhand || reviewedOffhand.availability === "permanent";
		});
		const alone = candidates.find((row) => row.offhand_id === null);
		if (!alone) throw new Error(`Canonical hand layout is missing ${weapon.weapon_id}`);
		result.push(alone);
		for (const type of [...new Set(candidates.filter((row) => row.layout_kind === "one_hand_offhand").map((row) => row.offhand_type))].sort()) {
			const selected = candidates.filter((row) => row.offhand_type === type).sort((left, right) => {
				const leftLevel = offhandById.get(left.offhand_id)?.mapped_level ?? weapon.assigned_requirement;
				const rightLevel = offhandById.get(right.offhand_id)?.mapped_level ?? weapon.assigned_requirement;
				return Math.abs(leftLevel - weapon.assigned_requirement) - Math.abs(rightLevel - weapon.assigned_requirement) || left.acquisition_effort - right.acquisition_effort || left.id.localeCompare(right.id);
			})[0];
			if (selected) result.push(selected);
		}
		const dual = candidates.filter((row) => row.layout_kind === "dual_wield").sort((left, right) => Math.abs((rankById.get(left.offhand_id)?.shared_rank || 0) - weapon.shared_rank) - Math.abs((rankById.get(right.offhand_id)?.shared_rank || 0) - weapon.shared_rank) || left.acquisition_effort - right.acquisition_effort || left.id.localeCompare(right.id))[0];
		if (dual) result.push(dual);
	}
	return [...new Map(result.map((row) => [row.id, row])).values()].sort((left, right) => left.skill.localeCompare(right.skill) || left.shared_rank - right.shared_rank || left.id.localeCompare(right.id));
}

function canonicalCombatLoadouts({ baseline, armor, loadoutFixture, ranking }) {
	const hands = canonicalHandLayouts(loadoutFixture, ranking);
	const rows = [];
	const add = (hand, weight, level, setId = null, purpose = "weapon") => {
		const set = nearestArmorSet(armor, weight, level, setId);
		const cape = nearestCape(armor, weight, level);
		const role = baseline.role_rows.find((row) => row.skill === hand.skill && row.level === Math.max(1, Math.min(70, level)));
		if (!role) throw new Error(`Missing combat role row ${hand.skill}:${level}`);
		const stat_type = FROZEN_LOADOUTS[hand.skill].stat_type;
		const slots = {
			mainhand: { name: hand.mainhand_id, level: 0, stat_type },
			...(hand.offhand_id ? { offhand: { name: hand.offhand_id, level: 0, stat_type } } : {}),
			...Object.fromEntries(Object.entries(set.canonical_slots).map(([slot, name]) => [slot, { name, level: 0, stat_type }])),
			...(cape ? { cape: { name: cape.item_id, level: 0, stat_type } } : {}),
			...Object.fromEntries(Object.entries(role.loadout.frozen_slots).map(([slot, item]) => [slot, { name: item.item_id, level: item.level, stat_type: item.stat_type }])),
		};
		const id = `${purpose}:${hand.id}:${weight}:${set.set_id}`;
		if (rows.some((row) => row.id === id)) return;
		rows.push({ id, purpose, skill: hand.skill, weight, level: role.level, shared_rank: hand.shared_rank, hand_layout_id: hand.id, armor_set_id: set.set_id, armor_band: set.acquisition.mapped_level, cape_id: cape?.item_id || null, slots, class_core: role.class_core });
	};
	for (const hand of hands) for (const weight of ["heavy", "medium", "light"]) add(hand, weight, ranking.weapons.find((row) => row.weapon_id === hand.mainhand_id).assigned_requirement);
	for (const skill of ROLE_SKILLS) for (const weight of ["heavy", "medium", "light"]) {
		const representative = hands.filter((row) => row.skill === skill && row.offhand_id === null).sort((left, right) => left.shared_rank - right.shared_rank || left.id.localeCompare(right.id));
		for (const [setId, set] of Object.entries(armor.sets).filter(([, row]) => row.weight === weight && row.acquisition.availability === "permanent")) {
			const hand = representative.sort((left, right) => Math.abs((ranking.weapons.find((row) => row.weapon_id === left.mainhand_id)?.assigned_requirement || 1) - set.acquisition.mapped_level) - Math.abs((ranking.weapons.find((row) => row.weapon_id === right.mainhand_id)?.assigned_requirement || 1) - set.acquisition.mapped_level) || left.id.localeCompare(right.id))[0];
			if (hand) add(hand, weight, set.acquisition.mapped_level, setId, "band");
		}
	}
	return rows.sort((left, right) => left.id.localeCompare(right.id));
}

function pinnedCounterpartDefinition(itemId, current, pinnedItems) {
	if (PLACEHOLDER_WEAPON_PEERS[itemId] && current) return JSON.parse(canonicalJson(current));
	const sourceId = PLACEHOLDER_WEAPON_PEERS[itemId] || PLANNED_ITEM_SOURCES[itemId] || itemId;
	const source = pinnedItems[sourceId];
	if (!source) throw new Error(`Pinned combat counterpart is missing ${itemId} (${sourceId})`);
	const definition = JSON.parse(canonicalJson(source));
	if (current) {
		definition.type = current.type;
		if (current.set) definition.set = current.set;
		if (current.wtype) definition.wtype = current.wtype;
		if (current.damage_type) definition.damage_type = current.damage_type;
		if (current.projectile) definition.projectile = current.projectile;
	}
	return definition;
}

function combatStatsForLoadout(loadout, data, calculators, pinnedItems, baseline, armor) {
	const classItem = classCoreItem(loadout.class_core, loadout.skill);
	const currentItems = { ...data.items, __class_core: classItem };
	const current = calculateStats({
		slots: { ...loadout.slots, class_core: { name: "__class_core", level: 0 } },
		items: currentItems,
		sets: data.sets,
		getItemProperties: (instance, definition) => instance.name === "__class_core" ? classItem : calculators.current.calculate_item_properties(instance),
	});
	const armorVariant = armor.sets[loadout.armor_set_id]?.variant || "int";
	const setReference = reviewedArmorRoleVector(baseline, loadout.weight, loadout.armor_band, armorVariant);
	const capeRow = loadout.cape_id ? armor.items[loadout.cape_id] : null;
	const capeReference = capeRow ? reviewedArmorRoleVector(baseline, loadout.weight, capeRow.acquisition.mapped_level, capeRow.variant || armorVariant) : Object.fromEntries(CORE_FIELDS.map((field) => [field, 0]));
	const referenceArmor = {
		type: "reference_core",
		name: `Pinned ${loadout.weight} armor/cape reference`,
		...Object.fromEntries(CORE_FIELDS.map((field) => [field, Number(setReference[field] || 0) * .9 + Number(capeReference[field] || 0) * .1])),
	};
	const pinnedCatalogForLoadout = { ...pinnedItems, __class_core: classItem, __reference_armor: referenceArmor };
	const pinnedSlots = {
		mainhand: loadout.slots.mainhand,
		...(loadout.slots.offhand ? { offhand: loadout.slots.offhand } : {}),
		...Object.fromEntries(Object.entries(loadout.slots).filter(([slot]) => ["ring1", "ring2", "earring1", "earring2", "amulet", "belt", "orb"].includes(slot))),
		class_core: { name: "__class_core", level: 0 },
		reference_armor: { name: "__reference_armor", level: 0 },
	};
	for (const instance of Object.values(pinnedSlots)) {
		if (instance.name.startsWith("__")) continue;
		pinnedCatalogForLoadout[instance.name] = pinnedCounterpartDefinition(instance.name, data.items[instance.name], pinnedItems);
	}
	const pinned = calculateStats({
		slots: pinnedSlots,
		items: pinnedCatalogForLoadout,
		sets: {},
		getItemProperties: (instance, definition) => instance.name === "__class_core" ? classItem : instance.name === "__reference_armor" ? referenceArmor : pinnedCombatProperties(definition, instance.level || 0, instance),
	});
	return { current, pinned };
}

function expectedOutgoing(stats, monster, damageMultiplier) {
	const magical = stats.damage_type === "magical";
	const defense = magical ? Number(monster.resistance || 0) : Number(monster.armor || 0);
	const piercing = magical ? Number(stats.rpiercing || 0) : Number(stats.apiercing || 0);
	const hitChance = Math.max(0.01, (magical ? 1 : 1 - Math.min(100, Number(monster.evasion || 0)) / 100) * (1 - Math.min(100, Number(monster.avoidance || 0)) / 100) * (1 - Math.min(100, Number(stats.miss || 0)) / 100));
	const critical = 1 + Math.min(100, Math.max(0, Number(stats.crit || 0))) / 100 * (1 + Number(stats.critdamage || 0) / 100);
	const damagePerSecond = Math.max(0.000001, Number(stats.attack || 0) * Number(stats.frequency || 0) * damageMultiplier(defense - piercing) * hitChance * critical);
	return { hit_chance: evidenceNumber(hitChance), critical_expectation: evidenceNumber(critical), damage_per_second: evidenceNumber(damagePerSecond), ttk: evidenceNumber(Math.max(1, Number(monster.hp || 1)) / damagePerSecond) };
}

function expectedIncoming(stats, monster, damageMultiplier) {
	const magical = monster.damage_type === "magical";
	const defense = magical ? Number(stats.resistance || 0) : Number(stats.armor || 0);
	const piercing = magical ? Number(monster.rpiercing || 0) : Number(monster.apiercing || 0);
	const effectiveDefense = defense - piercing;
	const hitChance = Math.max(0.01,
		(magical ? 1 : 1 - Math.min(100, Math.max(0, Number(stats.evasion || 0))) / 100) *
		(1 - Math.min(100, Math.max(0, Number(monster.miss || 0))) / 100) *
		(1 - Math.min(100, Math.max(0, Number(stats.avoidance || 0))) / 100));
	const critical = 1 + Math.min(100, Math.max(0, Number(monster.crit || 0))) / 100 * (1 + Number(monster.critdamage || 0) / 100);
	const damagePerSecond = Math.max(0.000001, Math.max(1, Number(monster.attack || 0)) * Math.max(0.01, Number(monster.frequency || 0)) * damageMultiplier(effectiveDefense) * hitChance * critical);
	return {
		defense: evidenceNumber(defense),
		piercing: evidenceNumber(piercing),
		effective_defense: evidenceNumber(effectiveDefense),
		hit_chance: evidenceNumber(hitChance),
		critical_expectation: evidenceNumber(critical),
		damage_per_second: evidenceNumber(damagePerSecond),
		time_to_defeat: evidenceNumber(Number(stats.max_hp || 1) / damagePerSecond),
	};
}

function buildEquipmentCombatMatrixFixture({ data = loadSourceData(), baseline = buildVanillaBaseline(), ranking = loadRankingFixture(), loadoutFixture = buildWeaponLoadoutBalanceFixture({ data, ranking, baseline }), armor = buildArmorSetBalanceFixture({ data, baseline }) } = {}) {
	assertRankingEnhancementFeasible(ranking);
	const calculators = loadPropertyCalculators(data);
	const pinnedItems = pinnedCatalog("design/items.js", "items");
	const frozen_authorities = frozenAuthorityRows();
	if (frozen_authorities.some((row) => !row.matches)) throw new Error(`Frozen equipment authority drifted: ${frozen_authorities.filter((row) => !row.matches).map((row) => row.authority_id).join(", ")}`);
	const loadouts = canonicalCombatLoadouts({ baseline, armor, loadoutFixture, ranking });
	const sheets = new Map(loadouts.map((loadout) => [loadout.id, combatStatsForLoadout(loadout, data, calculators, pinnedItems, baseline, armor)]));
	const rows = [];
	const violations = [];
	for (const loadout of loadouts) for (const [monsterId, monsterEvidence] of Object.entries(baseline.monsters)) {
		const monster = data.monsters[monsterId];
		const sheet = sheets.get(loadout.id);
		const currentOutgoing = expectedOutgoing(sheet.current, monster, data.damageMultiplier);
		const pinnedOutgoing = expectedOutgoing(sheet.pinned, monster, data.damageMultiplier);
		const currentIncoming = expectedIncoming(sheet.current, monster, data.damageMultiplier);
		const pinnedIncoming = expectedIncoming(sheet.pinned, monster, data.damageMultiplier);
		const ttk_ratio = evidenceNumber(currentOutgoing.ttk / pinnedOutgoing.ttk);
		const survival_ratio = evidenceNumber(currentIncoming.time_to_defeat / pinnedIncoming.time_to_defeat);
		const incoming_pass = monsterEvidence.classification === "diagnostic" || survival_ratio >= 0.8 && survival_ratio <= 1.2;
		const hard_pass = incoming_pass;
		const row = {
			monster_id: monsterId,
			loadout_id: loadout.id,
			classification: monsterEvidence.classification,
			reason: monsterEvidence.reason,
			outgoing_status: "diagnostic",
			incoming_status: monsterEvidence.classification,
			incoming_pass,
			ttk_ratio,
			survival_ratio,
			current: { outgoing: currentOutgoing, incoming: currentIncoming },
			pinned: { outgoing: pinnedOutgoing, incoming: pinnedIncoming },
			hard_pass,
		};
		rows.push(row);
		if (!hard_pass) violations.push({ monster_id: monsterId, loadout_id: loadout.id, survival_ratio });
	}
	const diagnosticReasons = Object.fromEntries([...new Set(Object.values(baseline.monsters).filter((row) => row.classification === "diagnostic").map((row) => row.reason))].sort().map((reason) => [reason, Object.values(baseline.monsters).filter((row) => row.reason === reason).length]));
	return {
		schema_version: 1,
		policy: { outgoing_ttk: "diagnostic", diagnostic_ttk_ratio_reference: [0.8, 1.2], incoming_survival_ratio: [0.8, 1.2], hard_gate: "ordinary solo mob incoming survival", diagnostics_are_non_gating: true, active_abilities: "excluded", random_damage_roll: "expected 1.0", failure_policy: "fail-closed" },
		hashes: { pinned_commit: PINNED_COMMIT, whole_monster_sha256: baseline.whole_monster_hash, current_whole_monster_sha256: baseline.current_whole_monster_hash, monster_rows_sha256: sha256(Object.entries(baseline.monsters).map(([id, row]) => [id, row.hash])), weapon_profiles_sha256: loadoutFixture.hashes.weapon_profiles_sha256, frozen_authorities_sha256: sha256(frozen_authorities) },
		frozen_authorities,
		monsters: Object.fromEntries(Object.entries(baseline.monsters).map(([id, row]) => [id, { classification: row.classification, reason: row.reason, hash: row.hash }])),
		loadouts,
		sheets: Object.fromEntries([...sheets].map(([id, sheet]) => [id, { current: compactNumericFields(sheet.current, ["str", "dex", "int", "vit", "max_hp", "max_mp", "armor", "resistance", "attack", "frequency", "crit", "critdamage", "apiercing", "rpiercing", "evasion", "avoidance"]), pinned: compactNumericFields(sheet.pinned, ["str", "dex", "int", "vit", "max_hp", "max_mp", "armor", "resistance", "attack", "frequency", "crit", "critdamage", "apiercing", "rpiercing", "evasion", "avoidance"]) }])),
		rows,
		violations,
		summary: { monsters: Object.keys(baseline.monsters).length, hard_monsters: Object.values(baseline.monsters).filter((row) => row.classification === "hard").length, diagnostic_monsters: Object.values(baseline.monsters).filter((row) => row.classification === "diagnostic").length, diagnostic_reasons: diagnosticReasons, loadouts: loadouts.length, rows: rows.length, hard_violations: violations.length, status: violations.length ? "failed" : "passed" },
	};
}

function validateEquipmentCombatMatrixFixture(fixture, generated = buildEquipmentCombatMatrixFixture()) {
	const expectedAuthorityRefs = new Map(frozenAuthorityRows().map((row) => [row.authority_id, row.expected_ref]));
	if (!fixture || fixture.schema_version !== 1 || fixture.summary?.monsters !== 129 || fixture.summary?.hard_monsters !== 47 || fixture.summary?.diagnostic_monsters !== 82 || fixture.summary?.status !== "passed" || fixture.summary?.hard_violations !== 0 || fixture.rows?.length !== fixture.summary.rows || fixture.rows.length !== fixture.loadouts.length * 129 || fixture.frozen_authorities?.length !== 12 || fixture.frozen_authorities.some((row) => !row.matches || row.expected_ref !== expectedAuthorityRefs.get(row.authority_id) || row.expected_sha256 !== row.current_sha256) || fixture.hashes?.frozen_authorities_sha256 !== sha256(fixture.frozen_authorities) || canonicalJson(fixture) !== canonicalJson(generated))
		throw new Error("Equipment combat matrix drifted or contains hard violations");
	return true;
}

function solveBalanceContract(input = {}) {
	const violations = [];
	const check = (run) => { try { run(); } catch (error) { if (error.code !== "equipment_balance_violation") throw error; violations.push({ rule: error.rule, ids: error.ids, actual: error.actual, expected: error.expected }); } };
	const baseline = buildVanillaBaseline();
	const acquisition = buildEquipmentAcquisitionFixture();
	const inventory = requiredSolveInventory(baseline, acquisition);
	const denominators = baseline.normalization_denominators;
	const effectEnvelopes = new Map(baseline.effect_envelopes.map((row) => [`${row.effect}:${row.band}`, row]));
	check(() => assertSolveInput(input, inventory));
	if (violations.length) return { status: "failed", violations };
	check(() => assertPinnedDenominators(input.denominators, denominators));
	check(() => assertEqualWeightBudgets(input.budget_vectors, denominators));
	for (const row of input.budget_rows) check(() => assertEqualWeightBudgets(row.vectors, denominators));
	for (const sample of input.effect_samples) check(() => assertPinnedEffectSample(sample, effectEnvelopes));
	check(() => assertDominationMetadata(input.domination_rows, inventory.domination));
	check(() => assertNoStrictDomination(input.domination_rows, denominators));
	check(() => assertWeaponFullSheetRows(input.weapon_full_sheet_rows, inventory.weapon_full_sheet));
	for (const row of input.combat_rows) {
		if (row.kind !== "survival") check(() => violation("combat_classification", row.ids || [row.key || "combat"], row.kind, "survival hard gate; outgoing TTK is diagnostic"));
		else check(() => assertRatio("combat_survival", row.ratio, 0.8, 1.2, row.ids));
	}
	check(() => assertSetBonusRows(input.set_bonus_rows));
	check(() => assertRankRows(input.rank_rows));
	check(() => assertMobRows(input.mob_rows));
	return { status: violations.length ? "failed" : "passed", violations };
}

function buildApprovedSolveInput(input) {
	if (!input || typeof input !== "object") {
		const error = new Error("Equipment balance verification requires an explicit computed solve input");
		error.code = "equipment_balance_input_required";
		throw error;
	}
	return input;
}

function writeEvidenceFixtures({ write = fs.writeFileSync } = {}) {
	const acquisition = buildEquipmentAcquisitionFixture();
	const baseline = buildVanillaBaseline();
	const fixtures = {
		"equipment-acquisition-ranking.json": acquisition,
		"vanilla-equipment-baseline.json": baseline,
		"equipment-balance-contract.json": buildBalanceContract(baseline),
	};
	for (const [name, fixture] of Object.entries(fixtures)) write(fixturePath(name), serializeFixture(fixture));
	return fixtures;
}

function writeArmorPublication({
	fixture,
	ranking = loadRankingFixture(),
	itemsFilename = path.resolve(REPOSITORY_ROOT, "design/items.js"),
	read = fs.readFileSync,
	write = fs.writeFileSync,
} = {}) {
	let source = read(itemsFilename, "utf8");
	validateRankingPublicationBundle(ranking, { publication: publicationCatalogFromSource(source, itemsFilename) });
	const generatedFixture = buildArmorSetBalanceFixture();
	fixture ||= generatedFixture;
	try {
		validateArmorSetBalanceFixture(fixture, generatedFixture);
	} catch (cause) {
		const error = new Error("Armor publication fixture drifted from deterministic generation");
		error.code = "armor_publication_fixture_invalid";
		error.cause = cause;
		throw error;
	}
	const itemPublication = Object.fromEntries(Object.entries(fixture.items).map(([itemId, row]) => [itemId, {
		...row.base_core,
		...(row.enhancement.upgrade ? { upgrade: row.enhancement.upgrade } : {}),
		...(row.enhancement.compound ? { compound: row.enhancement.compound } : {}),
	}]));
	const setPublication = Object.fromEntries(Object.entries(fixture.sets).map(([setId, row]) => [setId, row.increments]));
	const itemPattern = /var base_nonweapon_progression=\{[\s\S]*?\};\nvar base_nonweapon_base_fields/;
	const setPattern = /var armor_set_incremental_bonuses=\{[\s\S]*?\};\nfor\(var armor_set_incremental_id/;
	if (!itemPattern.test(source) || !setPattern.test(source)) throw new Error("Reviewed armor publication maps are missing");
	source = source.replace(itemPattern, `var base_nonweapon_progression=${JSON.stringify(itemPublication, null, "\t")};\nvar base_nonweapon_base_fields`);
	source = source.replace(setPattern, `var armor_set_incremental_bonuses=${JSON.stringify(setPublication, null, "\t")};\nfor(var armor_set_incremental_id`);
	write(itemsFilename, source);
	return itemsFilename;
}

function writePlanFourFixtures({ write = fs.writeFileSync } = {}) {
	const data = loadSourceData();
	const baseline = buildVanillaBaseline();
	const ranking = loadRankingFixture();
	const acquisition = buildEquipmentAcquisitionFixture();
	const armor = buildArmorSetBalanceFixture({ baseline, acquisition, data });
	const loadout = buildWeaponLoadoutBalanceFixture({ data, ranking, acquisition, baseline });
	const fixtures = {
		"weapon-loadout-balance.json": loadout,
		"equipment-combat-matrix.json": buildEquipmentCombatMatrixFixture({ data, baseline, ranking, loadoutFixture: loadout, armor }),
	};
	for (const [name, fixture] of Object.entries(fixtures)) {
		write(fixturePath(name), serializeFixture(fixture));
	}
	return fixtures;
}

function writeBalanceFixtures({ solve_input, write = fs.writeFileSync } = {}) {
	if (!solve_input) {
		const error = new Error("Equipment balance solve input is required before fixtures may be written");
		error.code = "equipment_balance_unsatisfied";
		throw error;
	}
	const result = solveBalanceContract(solve_input);
	if (result.status !== "passed") {
		const error = new Error("Equipment balance solve failed; fixtures were not written");
		error.code = "equipment_balance_unsatisfied";
		error.violations = result.violations;
		throw error;
	}
	return writeEvidenceFixtures({ write });
}

function fixturePath(name) {
	return path.resolve(FIXTURE_DIRECTORY, name);
}

function loadEquipmentFixture(name) {
	return JSON.parse(fs.readFileSync(fixturePath(name), "utf8"));
}

function validateEquipmentAcquisitionFixture(fixture, generated = buildEquipmentAcquisitionFixture()) {
	const setRows = Object.values(fixture.ladders?.armor_sets || {}).flat();
	if (fixture.schema_version !== 1 || Object.keys(fixture.ladders?.armor_sets || {}).join("\0") !== "heavy\0medium\0light" || setRows.length !== 19 || new Set(setRows.map((row) => row.set_id)).size !== 19 || !setRows.every((row) => Number.isInteger(row.tie_band) && Number.isFinite(row.selected_effort) && row.mapped_level >= 1 && row.unlock >= 1) || !Object.keys(fixture.ladders?.standalone_armor || {}).length || !Object.keys(fixture.ladders?.capes || {}).length || !Object.keys(fixture.ladders?.offhands || {}).length || fixture.planned_items?.length !== 25 || !fixture.planned_items.every((item) => item.type && item.name && item.set && item.weight && item.asset && item.routes.some((route) => route.availability === "permanent" && route.allocation || route.availability === "event" && route.allocation?.permanent_peer_set_id)) || !fixture.excluded?.every((row) => row.target && row.reason && row.evidence) || !fixture.optional_event_rows?.every((row) => row.reason === "event" && row.routes?.every((route) => route.availability === "event")) || fixture.source_audit?.previous_commit !== PRE_PLAN_TWO_COMMIT || Object.keys(fixture.source_audit?.drop_themes || {}).length !== 6 || !Object.values(fixture.source_audit?.drop_themes || {}).every((theme) => Math.abs(theme.before_mass - theme.after_mass) < 1e-12) || Object.keys(fixture.source_audit?.recipes || {}).length !== 3 || !Object.values(fixture.source_audit?.recipes || {}).every((recipe) => recipe.before === null && recipe.source_recipe_id === "wingedboots" && recipe.after_hash) || Object.values(fixture.source_audit?.token_costs || {}).length !== 5 || !Object.values(fixture.source_audit?.token_costs || {}).every((token) => token.before === null && Number(token.after) > 0) || canonicalJson(fixture.source_artifact_hashes) !== canonicalJson(loadRankingFixture().source_artifact_hashes) || fixture.hash !== sha256(fixture.ladders) || canonicalJson(fixture) !== canonicalJson(generated))
		throw new Error("Equipment acquisition fixture drifted from deterministic generation");
	return true;
}

function validateVanillaBaseline(fixture, generated = buildVanillaBaseline()) {
	if (
		fixture.schema_version !== 2 ||
		canonicalJson(fixture.source_hashes) !== canonicalJson(PINNED_BLOB_IDS) ||
		!fixture.evidence_hashes ||
		fixture.evidence_hashes.pinned_set_catalog_sha256 !== sha256(pinnedCatalog("design/items.js", "sets")) ||
		fixture.evidence_hashes.frozen_loadout_policy_sha256 !== sha256(FROZEN_LOADOUTS) ||
		!validateContributionCatalog(fixture.enhancement_contribution_catalog) ||
		fixture.evidence_hashes.enhancement_contribution_catalog_sha256 !== fixture.enhancement_contribution_catalog.catalog_sha256 ||
		!Array.isArray(fixture.weapon_rank_enhancement_oracle) ||
		fixture.evidence_hashes.weapon_rank_enhancement_contributions_sha256 !== sha256(fixture.weapon_rank_enhancement_oracle.map((row) => row.states?.map((state) => state.contributions?.contributions_sha256))) ||
		Object.keys(fixture.monsters || {}).length !== 129 || !Object.values(fixture.monsters || {}).every((row) => row.context && Array.isArray(row.context.flags) && (row.classification !== "diagnostic" || row.reason && (row.context.flags.length || row.context.explicit_reason === row.reason))) ||
		fixture.role_rows?.length !== 420 || !fixture.role_rows.every((row) => row.full_core && row.frozen_core && row.loadout?.target_slots?.length === 7 && row.loadout?.frozen_slots?.orb) || !fixture.weapon_rank_endpoint_oracle?.start?.base_dps || !fixture.weapon_rank_endpoint_oracle?.end?.base_dps || fixture.weapon_rank_endpoint_oracle.end.base_dps <= fixture.weapon_rank_endpoint_oracle.start.base_dps || fixture.weapon_rank_enhancement_oracle?.length !== 11 || !fixture.weapon_rank_enhancement_oracle.every((row) => row.states?.length === 143 && row.states.every((state) => {
			if (!state.contributions?.contributions_sha256 || !state.contributions?.set_sha256 || !state.contributions?.loadout_sha256) return false;
			expandContributionEvidence(state.contributions, fixture.enhancement_contribution_catalog, { validateCatalog: false });
			return true;
		})) || fixture.weapon_ranges?.length !== 75 || !fixture.weapon_ranges.every((row) => Array.isArray(row.states) && row.states.length && row.states[0].level === 0) || !fixture.slot_contribution_tables?.base_armor || !fixture.slot_contribution_tables?.frozen_accessories || !fixture.slot_contribution_tables?.generic_stat_variants || fixture.allocation_vectors?.length !== 70 || !fixture.allocation_vectors.every((row) => row.light?.variants?.int && row.light?.variants?.dex) || !fixture.completed_loadouts?.length || !fixture.effect_envelopes?.length || !fixture.effect_envelopes.every((row) => EFFECT_FIELDS.includes(row.effect) && ["capped", "capless"].includes(row.status) && (row.status === "capped" ? Number.isFinite(row.cap) : row.cap === null)) ||
		canonicalJson(fixture) !== canonicalJson(generated)
	)
		throw new Error("Vanilla equipment baseline drifted from pinned source authority");
	return true;
}

function validateBalanceContract(contract) {
	assertRankingEnhancementFeasible(loadRankingFixture());
	if (
		!contract ||
		contract.schema_version !== 2 ||
		contract.failure_policy !== "fail-closed" ||
		canonicalJson(contract.core_fields) !== canonicalJson(CORE_FIELDS) || canonicalJson(contract.effect_fields) !== canonicalJson(EFFECT_FIELDS) || canonicalJson(contract.set_signatures) !== canonicalJson(SET_SIGNATURES) || Object.keys(contract.set_signatures || {}).length !== 19 || contract.planned_items?.length !== 25 || !contract.planned_items.every((item) => item.type && item.name && item.set && item.weight && item.asset) || !Object.values(contract.set_signatures).flat().every((effect) => contract.effect_fields.includes(effect)) || !contract.weight_mapping || !contract.planned_route_distributions ||
		contract.weight_budget_tolerance !== 1e-9 || contract.solver_status !== "passed" || !Array.isArray(contract.violations) || contract.violations.length !== 0 ||
		!contract.constraint_inventory || contract.constraint_inventory.budget_levels?.length !== 70 || contract.constraint_inventory.set_ids?.length !== 19 || contract.constraint_inventory.required_effects?.length !== 38 || !contract.constraint_inventory.reviewed_lower_value_effects?.length || !contract.constraint_inventory.effect_envelopes?.some((row) => row.status === "capless") ||
		contract.release_gates?.weapon_full_sheet_rank?.classification !== "hard" || contract.release_gates?.weapon_intermediate_enhancement?.classification !== "diagnostic" || contract.release_gates?.outgoing_ttk?.classification !== "diagnostic" || contract.release_gates?.incoming_survival?.classification !== "hard" || canonicalJson(contract.release_gates?.incoming_survival?.ratio) !== canonicalJson([0.8, 1.2]) ||
		"weapon_same_rank_spread" in contract ||
		contract.weapon_shared_rank_count !== 11 ||
		canonicalJson(contract.weapon_shared_rank_requirements) !== canonicalJson([1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99]) ||
		canonicalJson(contract.weapon_reference_levels) !== canonicalJson(loadRankingFixture().policy.reference_levels) ||
		canonicalJson(contract.weapon_full_sheet_endpoints) !== canonicalJson(loadRankingFixture().policy.full_sheet_endpoints) ||
		contract.weapon_rank_growth_factor !== loadRankingFixture().policy.growth_factor ||
		canonicalJson(contract.weapon_rank_targets) !== canonicalJson(loadRankingFixture().policy.rank_targets) ||
		canonicalJson(contract.weapon_rank_boundaries) !== canonicalJson(loadRankingFixture().policy.rank_boundaries) ||
		canonicalJson(contract.weapon_class_multipliers) !== canonicalJson(loadRankingFixture().policy.class_multipliers) ||
		canonicalJson(contract.weapon_rank_targets_by_skill) !== canonicalJson(loadRankingFixture().policy.rank_targets_by_skill) ||
		canonicalJson(contract.weapon_rank_boundaries_by_skill) !== canonicalJson(loadRankingFixture().policy.rank_boundaries_by_skill) ||
		canonicalJson(contract.weapon_enhancement_policy) !== canonicalJson(loadRankingFixture().policy.enhancement) ||
		canonicalJson(contract.weapon_enhancement_source_hashes) !== canonicalJson(loadRankingFixture().policy.enhancement_source_hashes) ||
		canonicalJson(contract.weapon_enhancement_evidence_hashes) !== canonicalJson(loadRankingFixture().policy.enhancement_evidence_hashes) ||
		canonicalJson(contract.weapon_core_allocation_envelope) !== canonicalJson(loadRankingFixture().policy.core_allocation_envelope) ||
		contract.weapon_enhancement_contract !== "class-split-hard-endpoints-with-diagnostic-intermediate-enhancement-surface" ||
		canonicalJson(contract.armor_offensive_fields) !== canonicalJson({ types: ["helmet", "chest", "pants", "gloves", "shoes"], forbidden: ["str", "dex", "int", "stat"], compensation_owner: "plan-04-weapon-numeric-fields" }) ||
		"weapon_crossover_minimum" in contract || "weapon_crossover_maximum" in contract ||
		contract.combat_outgoing_ttk_classification !== "diagnostic" ||
		contract.combat_survival_ratio_minimum !== 0.8 ||
		contract.combat_survival_ratio_maximum !== 1.2 ||
		contract.strict_domination?.scope !== "same_ladder_equal_or_easier" ||
		contract.strict_domination?.comparable_coordinates !== "core_and_allowed_effects" ||
		contract.strict_domination?.equal_or_easier_only !== true
	)
		throw new Error("Balance contract contains a relaxed spread or bound");
	validatePlannedRouteDistributions();
	return true;
}

function main(argv = process.argv.slice(2)) {
	if (!argv.includes("--verify")) throw new Error("Usage: node tools/equipment-balance.js --verify [--solve-input=/absolute/path.json]");
	const inputArgument = argv.find((argument) => argument.startsWith("--solve-input="));
	const input = inputArgument ? JSON.parse(fs.readFileSync(inputArgument.slice("--solve-input=".length), "utf8")) : buildApprovedSolveInput();
	const result = solveBalanceContract(input);
	if (result.status !== "passed") {
		const details = result.violations.map((row) => `${row.rule}: ${row.ids.join(", ")}`).join("; ");
		throw new Error(`Equipment balance solve failed without writing fixtures: ${details}`);
	}
	process.stdout.write("Equipment balance solve passed; no fixtures written.\n");
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	}
}

module.exports = {
	PINNED_COMMIT,
	EQUIPMENT_REBALANCE_BASE_COMMIT,
	buildBalanceContract,
	buildArmorSetBalanceFixture,
	buildEquipmentCombatMatrixFixture,
	buildWeaponLoadoutBalanceFixture,
	buildEquipmentAcquisitionFixture,
	buildVanillaBaseline,
	buildWeaponRankEndpointOracle,
	buildWeaponRankEnhancementOracle,
	frozenAuthorityRows,
	functionalCompletionEffort,
	fixturePath,
	serializeFixture,
	loadEquipmentFixture,
	mapPercentileToLevel,
	validateBalanceContract,
	validateArmorSetBalanceFixture,
	validateEquipmentAcquisitionFixture,
	validateEquipmentCombatMatrixFixture,
	validateVanillaBaseline,
	validateWeaponLoadoutBalanceFixture,
	assertEqualWeightBudgets,
	assertCanonicalArmorCrossWeightRounding,
	assertNoStrictDomination,
	assertRatio,
	buildApprovedSolveInput,
	constraintInventory,
	requiredSolveInventory,
	assertSolveInput,
	effectCap,
	normalizedCore,
	pinnedTargetLoadout,
	pinnedRoleRows,
	pinnedItemProperties,
	pairedAllocationVectors,
	armorOnlyRoleVector,
	reviewedNonWeaponCatalog,
	solveBalanceContract,
	writeBalanceFixtures,
	writeEvidenceFixtures,
	writeArmorPublication,
	writePlanFourFixtures,
};
