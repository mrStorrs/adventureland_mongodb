var smelting = {
	version: 1,
	tiers: [
		{ index: 0, id: "copper", name: "Copper", level: 1, ore: "copperore", bar: "copperbar", ore_quantity: 10, xp: 8000, bar_g: 200 },
		{ index: 1, id: "iron", name: "Iron", level: 15, ore: "ironore", bar: "ironbar", ore_quantity: 10, xp: 12000, bar_g: 1000 },
		{ index: 2, id: "gold", name: "Gold", level: 30, ore: "goldore", bar: "goldbar", ore_quantity: 10, xp: 18000, bar_g: 5000 },
		{ index: 3, id: "mithril", name: "Mithril", level: 55, ore: "mithrilore", bar: "mithrilbar", ore_quantity: 10, xp: 28000, bar_g: 20000 },
		{ index: 4, id: "adamantite", name: "Adamantite", level: 70, ore: "adamantiteore", bar: "adamantitebar", ore_quantity: 10, xp: 40000, bar_g: 80000 },
		{ index: 5, id: "runite", name: "Runite", level: 85, ore: "runiteore", bar: "runitebar", ore_quantity: 10, xp: 60000, bar_g: 320000 },
	],
};

if (typeof module !== "undefined") module.exports = { smelting: smelting };
