"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const { FIXTURE_PATH, buildHunterWeaponEconomy, resolvedDropSources, validateHunterWeaponEconomy } = require("../tools/hunter-weapon-economy");
const { loadSourceData } = require("../tools/acquisition-ranking");

test("Hunter weapon price derives one shared whole-hunt cost from final source evidence", () => {
	const evidence = buildHunterWeaponEconomy(loadSourceData());
	assert.doesNotThrow(() => validateHunterWeaponEconomy(evidence));
	assert.equal(evidence.hunter_weapon_ids.length, 6);
	assert.equal(new Set(evidence.hunter_weapon_ids.map((itemId) => evidence.token_prices[itemId])).size, 1);
	assert.equal(evidence.shared_price, evidence.whole_hunts * 4);
	assert.equal(evidence.whole_hunts, Math.ceil(evidence.ordinary_copy_hours / evidence.tier5_hunt_hours));
	assert.deepEqual(evidence, JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")));
	const altered = { ...loadSourceData(), tokens: structuredClone(loadSourceData().tokens) };
	altered.tokens.monstertoken.mhspear = 1;
	assert.throws(() => validateHunterWeaponEconomy(buildHunterWeaponEconomy(altered)), /price_mismatch/);
});

test("Hunter weapon economy resolves nested drop tables before accepting token-only sources", () => {
	const altered = loadSourceData();
	altered.drops.huntertest = [[1, "open", "huntertest_inner"]];
	altered.drops.huntertest_inner = [[1, "mhspear"]];
	assert.deepEqual(resolvedDropSources(altered, "mhspear"), [{ route_id: "drops.huntertest", probability: 1 }, { route_id: "drops.huntertest_inner", probability: 1 }]);
	assert.throws(() => validateHunterWeaponEconomy(buildHunterWeaponEconomy(altered)), /hunter_weapon_has_non_token_source/);
});
