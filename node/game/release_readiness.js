"use strict";

const { worldError } = require("./world_schema");

const { SKILL_IDS } = require("./skill_domain");

function assertProtocol4Publication(publication) {
	if (!publication || publication.protocol !== 4 || publication.classes || publication.levels) {
		throw worldError("WORLD_PUBLICATION", "Protocol 4 publication is required and legacy class data is forbidden");
	}
	if (
		!publication.skills ||
		JSON.stringify(Object.keys(publication.skills).sort()) !== JSON.stringify([...SKILL_IDS].sort())
	) {
		throw worldError("WORLD_PUBLICATION", "Protocol 4 publication must expose exactly the seven registered skills");
	}
	if (!publication.abilities || typeof publication.abilities !== "object") {
		throw worldError("WORLD_PUBLICATION", "Protocol 4 publication is missing abilities");
	}
	for (const item of Object.values(publication.items || {})) {
		for (const key of ["str", "dex", "int", "vit", "for", "stat", "stat_type", "attack", "frequency"])
			if (Object.hasOwn(item, key)) throw worldError("WORLD_PUBLICATION", `Protocol 4 item contains forbidden ${key}`);
	}
	return { protocol: 4, skillCount: SKILL_IDS.length, abilityCount: Object.keys(publication.abilities).length };
}

module.exports = { SKILL_IDS, assertProtocol4Publication };
