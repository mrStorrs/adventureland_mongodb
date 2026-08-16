"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { calculateStats } = require("../game/stats");
const { loadSourceData } = require("../tools/acquisition-ranking");
const { loadPropertyCalculators } = require("../tools/weapon-progression-parity");

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "weapon-loadout-balance.json"), "utf8"));

test("every intermediate direct weapon state is finite, positive, and monotone", () => {
	const data = loadSourceData();
	const calculators = loadPropertyCalculators(data);
	for (const [weaponId, states] of Object.entries(Object.groupBy(fixture.weapon_states, (row) => row.weapon_id))) {
		let previousDps = 0;
		for (const row of states) {
			const properties = calculators.current.calculate_item_properties({ name: weaponId, level: row.level });
			const stats = calculateStats({
				slots: { mainhand: { name: weaponId, level: row.level } },
				items: data.items,
				getItemProperties: calculators.current.calculate_item_properties,
			});
			assert.ok(Number.isFinite(properties.damage) && properties.damage > 0, `${weaponId}+${row.level}:definition damage`);
			assert.ok(Number.isFinite(stats.frequency) && stats.frequency > 0, `${weaponId}+${row.level}:cadence`);
			assert.ok(Number.isFinite(stats.attack * stats.frequency) && stats.attack * stats.frequency > 0, `${weaponId}+${row.level}:dps`);
			assert.ok(stats.attack * stats.frequency >= previousDps, `${weaponId}+${row.level}:monotone dps`);
			previousDps = stats.attack * stats.frequency;
		}
	}
});
