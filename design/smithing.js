var smithing = {
	version: 2,
	success_cap_multiplier: 1.25,
	tiers: [
		{ index: 0, id: "copper", name: "Copper", level: 1, ore: "copperore", bar: "copperbar", scrap: "copperscrap", ore_quantity: 2, bars_per_weapon: 5, duration_ms: 30000, xp: 4958, base_success: 0.076098, scrap_g: 639 },
		{ index: 1, id: "iron", name: "Iron", level: 20, ore: "ironore", bar: "ironbar", scrap: "ironscrap", ore_quantity: 2, bars_per_weapon: 5, duration_ms: 36000, xp: 11997, base_success: 0.049492, scrap_g: 1013 },
		{ index: 2, id: "gold", name: "Gold", level: 40, ore: "goldore", bar: "goldbar", scrap: "goldscrap", ore_quantity: 2, bars_per_weapon: 5, duration_ms: 42000, xp: 19055, base_success: 0.036459, scrap_g: 1766 },
		{ index: 3, id: "mithril", name: "Mithril", level: 60, ore: "mithrilore", bar: "mithrilbar", scrap: "mithrilscrap", ore_quantity: 2, bars_per_weapon: 5, duration_ms: 48000, xp: 72944, base_success: 0.032022, scrap_g: 2687 },
		{ index: 4, id: "adamantite", name: "Adamantite", level: 80, ore: "adamantiteore", bar: "adamantitebar", scrap: "adamantitescrap", ore_quantity: 2, bars_per_weapon: 5, duration_ms: 54000, xp: 85834, base_success: 0.02574, scrap_g: 3772 },
		{ index: 5, id: "runite", name: "Runite", level: 90, ore: "runiteore", bar: "runitebar", scrap: "runitescrap", ore_quantity: 2, bars_per_weapon: 5, duration_ms: 60000, xp: 104909, base_success: 0.015367, scrap_g: 5574 },
	],
};

var smithing_weapon_classes = [
	{ id: "blade", name: "Blade", skill: "warrior", starter: "blade" },
	{ id: "mace", name: "Mace", skill: "paladin", starter: "mace" },
	{ id: "staff", name: "Staff", skill: "mage", starter: "staff" },
	{ id: "book", name: "Book", skill: "priest", starter: "wbook0" },
	{ id: "bow", name: "Bow", skill: "ranger", starter: "bow" },
	{ id: "claw", name: "Claw", skill: "rogue", starter: "claw" },
];
var smithing_weapon_anchors = [
	["fsword", "ololipop", "firestaff", "wbook3", "hbow", "stinger"],
	["swifty", "glolipop", "froststaff", "wbook5", "merry", "fclaw"],
	["sword", "pmaceofthedead", "arcstaff", "wbook6", "crossbow", "firestars"],
	["bataxe", "xmace", "vstaff", "wbook8", "t3bow", "rapier"],
	["scythe", "vhammer", "wblade", "wbook9", "weaver", "vdagger"],
	["vsword", "lmace", "pinkie", "wbookhs", "gbow", "dragondagger"],
];
var smithing_weapon_requirements = [20, 40, 60, 80, 90, 99];
var smithing_weapon_chain = [];
for (var smithing_weapon_tier_index = 0; smithing_weapon_tier_index < smithing.tiers.length; smithing_weapon_tier_index++) {
	var smithing_weapon_tier = smithing.tiers[smithing_weapon_tier_index];
	for (var smithing_weapon_class_index = 0; smithing_weapon_class_index < smithing_weapon_classes.length; smithing_weapon_class_index++) {
		var smithing_weapon_class = smithing_weapon_classes[smithing_weapon_class_index];
		smithing_weapon_chain.push({
			output: smithing_weapon_tier.id + smithing_weapon_class.id,
			tier_id: smithing_weapon_tier.id,
			class_id: smithing_weapon_class.id,
			name: smithing_weapon_tier.name + " " + smithing_weapon_class.name,
			skill: smithing_weapon_class.skill,
			requirement: smithing_weapon_requirements[smithing_weapon_tier_index],
			anchor: smithing_weapon_anchors[smithing_weapon_tier_index][smithing_weapon_class_index],
			predecessor:
				smithing_weapon_tier_index === 0
					? smithing_weapon_class.starter
					: smithing.tiers[smithing_weapon_tier_index - 1].id + smithing_weapon_class.id,
		});
	}
}
smithing.weapons = smithing_weapon_chain;

if (typeof module !== "undefined") module.exports = { smithing: smithing, smithing_weapon_chain: smithing_weapon_chain };
