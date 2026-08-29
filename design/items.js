var items={
	"test": {
		"type": "test",
		"skin": "test",
		"ignore": true,
		"name": "Test",
		"explanation": "An item to test item looks, just set the 'skin' property.",
		"g": 1
	},
	"test2": {
		"type": "orb",
		"skin": "shells",
		"ignore": true,
		"name": "Test",
		"manasteal": 2,
		"critdamage": 60,
		"explanation": "An item to test properties!",
		"g": 1,
		"pvp_damage_reduction": 85.71428571428572
	},
	"test_orb": {
		"type": "orb",
		"skin": "test_orb",
		"name": "Orb of Testing",
		"ability": "poison",
		"attr0": 50,
		"compound": {},
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 1
	},
	"placeholder": {
		"type": "placeholder",
		"skin": "placeholder",
		"ignore": true,
		"name": "Placeholder",
		"g": 1
	},
	"placeholder_m": {
		"type": "placeholder",
		"skin": "placeholder_m",
		"ignore": true,
		"name": "Placeholder",
		"g": 1
	},
	"stealthcape": {
		"type": "cape",
		"skin": "stealthcape",
		"name": "Stealth Cape",
		"upgrade": {
			"resistance": 1,
			"scroll_value": 0.3
		},
		"explanation": "Thanks to its stealth capabilities, no one can track your endeavours any more.",
		"grades": [
			0,
			4,
			10,
			12
		],
		"g": 2000000,
		"armor_weight": "medium",
		"hp": 470,
		"mp": 82,
		"armor": 13,
		"resistance": 15,
		"damage": 4,
		"throw_range": 6,
		"attacks_per_second": 0.013000000000000001,
		"base_crit": 1.6
	},
	"cape": {
		"type": "cape",
		"skin": "cape0",
		"name": "Cape",
		"upgrade": {
			"armor": 2,
			"resistance": 1,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			8,
			10,
			12
		],
		"g": 20000,
		"armor_weight": "medium",
		"hp": 132,
		"mp": 40,
		"armor": 4,
		"resistance": 4,
		"attacks_per_second": 0.0046875,
		"base_crit": 0.6
	},
	"horsecape": {
		"type": "cape",
		"skin": "horsecape",
		"name": "Horse Leather Cape",
		"upgrade": {
			"armor": 2,
			"resistance": 2,
			"speed": 0.1,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			5,
			10,
			12
		],
		"g": 1600000,
		"armor_weight": "medium"
	},
	"horsecapeg": {
		"type": "cape",
		"skin": "horsecapeg",
		"gold": 3,
		"name": "Horse Leather Cape",
		"upgrade": {
			"armor": 2,
			"gold": 0.5,
			"resistance": 2,
			"speed": 0.1,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			0,
			10,
			12
		],
		"g": 1600000,
		"armor_weight": "medium"
	},
	"fcape": {
		"type": "cape",
		"skin": "fcape",
		"name": "Fiery Cape",
		"upgrade": {
			"armor": 2,
			"firesistance": 4,
			"resistance": 2,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			0,
			10,
			12
		],
		"g": 16000000,
		"armor_weight": "medium"
	},
	"ecape": {
		"set": "bunny",
		"type": "cape",
		"skin": "ecape",
		"cuteness": 20,
		"name": "Fluffy Blanket",
		"upgrade": {
			"armor": 2,
			"cuteness": 3,
			"resistance": 1,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			7,
			10,
			12
		],
		"g": 20000,
		"armor_weight": "light"
	},
	"gcape": {
		"type": "cape",
		"skin": "gcape",
		"name": "Grinch's Cape",
		"upgrade": {
			"pnresistance": 1,
			"resistance": 4,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			7,
			10,
			12
		],
		"g": 8008,
		"armor_weight": "light"
	},
	"angelwings": {
		"type": "cape",
		"skin": "angelwings",
		"name": "Angel Wings",
		"upgrade": {
			"evasion": 0.2,
			"resistance": 1,
			"speed": 0.2,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120000,
		"a": true,
		"action": "FLAP",
		"onclick": "socket.emit('activate',{slot:$(this).data('id')})",
		"armor_weight": "light",
		"hp": 148,
		"mp": 135,
		"armor": 5,
		"resistance": 8,
		"damage": 5,
		"throw_range": 3,
		"attacks_per_second": 0.0025625,
		"base_crit": 0.2
	},
	"tigercape": {
		"set": "tiger",
		"type": "cape",
		"skin": "tigercape",
		"name": "Cape of the Tiger",
		"upgrade": {
			"armor": 3,
			"resistance": 2,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			4,
			10,
			12
		],
		"a": true,
		"g": 2400000,
		"armor_weight": "heavy"
	},
	"bcape": {
		"type": "cape",
		"skin": "cape1",
		"name": "Well-Crafted Cape",
		"upgrade": {
			"armor": 3,
			"resistance": 2,
			"scroll_value": 0.1
		},
		"grades": [
			0,
			4,
			10,
			12
		],
		"a": true,
		"g": 2400000,
		"armor_weight": "medium",
		"hp": 141,
		"mp": 51,
		"armor": 14,
		"resistance": 11,
		"damage": 2,
		"throw_range": 3,
		"attacks_per_second": 0.009625,
		"base_crit": 1.2
	},
	"hpot0": {
		"type": "pot",
		"skin": "hpot0",
		"gives": [
			[
				"hp",
				200
			]
		],
		"name": "HP Potion",
		"cooldown": 2000,
		"s": 9999,
		"g": 20
	},
	"mpot0": {
		"type": "pot",
		"skin": "mpot0",
		"gives": [
			[
				"mp",
				300
			]
		],
		"name": "MP Potion",
		"cooldown": 2000,
		"s": 9999,
		"g": 20
	},
	"hpot1": {
		"type": "pot",
		"skin": "hpot1",
		"gives": [
			[
				"hp",
				400
			]
		],
		"name": "HP Potion",
		"cooldown": 2000,
		"s": 9999,
		"g": 100
	},
	"mpot1": {
		"type": "pot",
		"skin": "mpot1",
		"gives": [
			[
				"mp",
				500
			]
		],
		"name": "MP Potion",
		"cooldown": 2000,
		"s": 9999,
		"g": 100
	},
	"hpotx": {
		"type": "pot",
		"skin": "hpotx",
		"gives": [
			[
				"hp",
				10000
			]
		],
		"name": "Super HP Potion",
		"cooldown": 2000,
		"s": 9999,
		"g": 20000
	},
	"mpotx": {
		"type": "pot",
		"skin": "mpotx",
		"gives": [
			[
				"mp",
				10000
			]
		],
		"name": "Super MP Potion",
		"cooldown": 2000,
		"s": 9999,
		"g": 20000
	},
	"fury": {
		"set": "fury",
		"tier": 1.5,
		"type": "helmet",
		"class": [
			"rogue",
			"warrior",
			"ranger",
			"paladin"
		],
		"skin": "fury",
		"scroll": true,
		"upgrade": {
			"apiercing": 10,
			"armor": 1.5,
			"crit": 0.5,
			"resistance": 1.5
		},
		"legacy": {
			"class": null,
			"set": null
		},
		"name": "Band of Fury",
		"grades": [
			0,
			0,
			10,
			12
		],
		"g": 6400000,
		"a": true,
		"armor_weight": "heavy",
		"hp": 728,
		"mp": 126,
		"armor": 27,
		"resistance": 20
	},
	"tigerhelmet": {
		"set": "tiger",
		"tier": 2,
		"type": "helmet",
		"skin": "tigerhelmet",
		"scroll": true,
		"rogue": {
			"crit": 2,
			"upgrade": {
				"crit": 0.25
			}
		},
		"upgrade": {
			"armor": 2.5,
			"resistance": 2.5
		},
		"name": "Helmet of the Tiger",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 640000,
		"a": true,
		"protection": true,
		"armor_weight": "heavy",
		"hp": 728,
		"mp": 126,
		"armor": 27,
		"resistance": 20
	},
	"mageshood": {
		"tier": 2,
		"type": "helmet",
		"class": [
			"mage"
		],
		"skin": "mageshood",
		"scroll": true,
		"crit": 0.5,
		"upgrade": {
			"rpiercing": 10,
			"resistance": 2.5,
			"armor": 2.5,
			"scroll_value": 1
		},
		"name": "Mage's Hood",
		"grades": [
			0,
			8,
			10,
			12
		],
		"g": 640000,
		"a": true,
		"ignore": true,
		"extra_stat": 1,
		"armor": 14,
		"resistance": 16,
		"protection": true,
		"armor_weight": "light",
		"scroll_value": 2
	},
	"rednose": {
		"type": "helmet",
		"skin": "rednose",
		"scroll": true,
		"cuteness": 9,
		"compound": {
			"cuteness": 3,
			"range": 4
		},
		"name": "Rudolph's Red Nose",
		"grades": [
			2,
			4,
			6,
			7
		],
		"g": 32000,
		"a": true,
		"armor_weight": "light"
	},
	"helmet": {
		"tier": 1,
		"type": "helmet",
		"skin": "helmet",
		"scroll": true,
		"upgrade": {
			"armor": 0.25,
			"resistance": 0.25
		},
		"name": "Helmet",
		"g": 3200,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 116,
		"mp": 8,
		"set": "basic"
	},
	"cyber": {
		"mcourage": 1,
		"pcourage": 1,
		"tier": 3,
		"type": "helmet",
		"skin": "cyber",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5
		},
		"name": "Cybernetic Implants",
		"g": 320000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"protection": true,
		"armor_weight": "light",
		"hp": 892,
		"mp": 384,
		"armor": 24,
		"resistance": 24
	},
	"wcap": {
		"set": "wanderers",
		"tier": 1,
		"type": "helmet",
		"skin": "wcap",
		"scroll": true,
		"upgrade": {
			"armor": 0.5,
			"resistance": 0.5
		},
		"name": "Wanderer's Cap",
		"g": 6400,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 312,
		"mp": 33,
		"armor": 2,
		"resistance": 1
	},
	"xmashat": {
		"set": "holidays",
		"tier": 1.5,
		"type": "helmet",
		"skin": "xmashat",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"resistance": 1.5
		},
		"name": "Xmas Hat",
		"xcx": [
			"hat100"
		],
		"g": 13200,
		"a": true,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 27,
		"mp": 15,
		"armor": 2,
		"resistance": 1
	},
	"ghatb": {
		"type": "helmet",
		"skin": "ghatb",
		"hat": "hat114",
		"name": "Hat of Generosity",
		"explanation": "If you put on this hat, you can run item giveaways!",
		"g": 128000,
		"armor_weight": "light",
		"hp": 1152
	},
	"ghatp": {
		"type": "helmet",
		"skin": "ghatp",
		"hat": "hat115",
		"name": "Hat of Generosity",
		"explanation": "If you put on this hat, you can run item giveaways!",
		"g": 128000,
		"armor_weight": "light",
		"hp": 1152
	},
	"helmet1": {
		"set": "rugged",
		"tier": 2,
		"type": "helmet",
		"skin": "helmet1",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"resistance": 2.5
		},
		"name": "Rugged Helmet",
		"g": 32000,
		"a": 2,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "medium",
		"hp": 516,
		"mp": 21,
		"armor": 10,
		"resistance": 8
	},
	"mwhelmet": {
		"class": [
			"warrior"
		],
		"set": "mwarrior",
		"tier": 2.625,
		"type": "helmet",
		"skin": "mwhelmet",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Helmet of the Hunter Warrior",
		"explanation": "You served our realm well",
		"g": 64000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"protection": true,
		"armor_weight": "heavy",
		"hp": 650,
		"mp": 17,
		"armor": 28,
		"resistance": 14
	},
	"mmhat": {
		"class": [
			"mage"
		],
		"set": "mmage",
		"tier": 2.125,
		"type": "helmet",
		"skin": "mmhat",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Hat of the Hunter Mage",
		"explanation": "You served our realm well",
		"g": 64000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "light",
		"hp": 877,
		"mp": 110,
		"armor": 17,
		"resistance": 17
	},
	"mphat": {
		"class": [
			"priest"
		],
		"set": "mpriest",
		"tier": 2.125,
		"type": "helmet",
		"skin": "mphat",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Hat of the Hunter Priest",
		"explanation": "You served our realm well",
		"g": 64000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "light",
		"hp": 877,
		"mp": 110,
		"armor": 17,
		"resistance": 17
	},
	"mrnhat": {
		"class": [
			"ranger"
		],
		"set": "mranger",
		"tier": 2.25,
		"type": "helmet",
		"skin": "mrnhat",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Hat of the Hunter Ranger",
		"explanation": "You served our realm well",
		"g": 64000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "medium",
		"hp": 746,
		"mp": 70,
		"armor": 22,
		"resistance": 16
	},
	"mrhood": {
		"class": [
			"rogue"
		],
		"set": "mrogue",
		"tier": 2.25,
		"type": "helmet",
		"skin": "mrhood",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Hood of the Hunter Rogue",
		"explanation": "You served our realm well",
		"g": 64000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "medium",
		"hp": 746,
		"mp": 70,
		"armor": 22,
		"resistance": 16
	},
	"mchat": {
		"class": [
			"merchant"
		],
		"set": "mmerchant",
		"tier": 2.25,
		"type": "helmet",
		"skin": "mchat",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Hat of the Hunter Merchant",
		"explanation": "Your comrades served our realm well",
		"g": 64000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "medium",
		"hp": 746,
		"mp": 70,
		"armor": 22,
		"resistance": 16
	},
	"partyhat": {
		"tier": 1,
		"type": "helmet",
		"skin": "partyhat",
		"scroll": true,
		"upgrade": {
			"armor": 0.5,
			"resistance": 0.5,
			"hp": 4.800000000000001
		},
		"name": "Party Hat",
		"g": 12000,
		"a": 2,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "light"
	},
	"phelmet": {
		"tier": 2,
		"type": "helmet",
		"skin": "phelmet",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"reflection": 0.4,
			"resistance": 2.5
		},
		"name": "Pumpkin Head",
		"g": 72000,
		"a": 2,
		"grades": [
			0,
			7,
			10,
			12
		],
		"protection": true,
		"armor_weight": "heavy"
	},
	"gphelmet": {
		"tier": 2,
		"type": "helmet",
		"skin": "gphelmet",
		"scroll": true,
		"luck": -4,
		"upgrade": {
			"armor": 2.5,
			"crit": 0.1,
			"reflection": 0.4,
			"resistance": 2.5
		},
		"name": "Green Pumpkin Head",
		"g": 32000,
		"a": 2,
		"grades": [
			0,
			0,
			10,
			12
		],
		"protection": true,
		"armor_weight": "heavy",
		"hp": 1135,
		"mp": 198,
		"armor": 34,
		"resistance": 26
	},
	"bunnyears": {
		"tier": 2,
		"type": "helmet",
		"skin": "bunnyears",
		"scroll": true,
		"cuteness": 12,
		"evasion": 1,
		"upgrade": {
			"cuteness": 2,
			"evasion": 0.2,
			"resistance": 2.5,
			"armor": 2.5,
			"scroll_value": 1
		},
		"name": "Legacy Bunny Ears",
		"g": 32000,
		"a": 2,
		"grades": [
			4,
			8,
			10,
			12
		],
		"extra_stat": 1,
		"armor": 14,
		"resistance": 16,
		"protection": true,
		"armor_weight": "light",
		"scroll_value": 2,
		"hp": 192
	},
	"eears": {
		"set": "bunny",
		"tier": 1.5,
		"type": "helmet",
		"skin": "eears",
		"scroll": true,
		"cuteness": 12,
		"upgrade": {
			"armor": 1.5,
			"cuteness": 2,
			"evasion": 0.2,
			"resistance": 1.5
		},
		"name": "Bunny Ears",
		"g": 32000,
		"a": 2,
		"grades": [
			6,
			9,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 148,
		"mp": 98,
		"armor": 15,
		"resistance": 15
	},
	"hhelmet": {
		"set": "wt3",
		"tier": 3,
		"type": "helmet",
		"skin": "hhelmet",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5
		},
		"name": "Heavy Helmet",
		"g": 320000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"protection": true,
		"armor_weight": "heavy",
		"hp": 700,
		"mp": 38,
		"armor": 21,
		"resistance": 13
	},
	"xhelmet": {
		"set": "wt4",
		"tier": 4,
		"type": "helmet",
		"skin": "xhelmet",
		"xscroll": true,
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Darkforge Helmet",
		"g": 3200000,
		"a": 2,
		"grades": [
			0,
			0,
			8,
			10
		],
		"protection": true,
		"armor_weight": "heavy",
		"hp": 886,
		"mp": 57,
		"armor": 25,
		"resistance": 15
	},
	"spikedhelmet": {
		"tier": 0,
		"type": "helmet",
		"skin": "spikedhelmet",
		"scroll": true,
		"upgrade": {
			"armor": 7.75,
			"dreturn": 1
		},
		"grades": [
			0,
			0,
			8,
			10
		],
		"name": "Spiked Helmet",
		"g": 3200000,
		"a": 2,
		"armor_weight": "heavy",
		"hp": 342,
		"mp": 66,
		"armor": 27,
		"resistance": 16
	},
	"luckyt": {
		"type": "chest",
		"skin": "luckyt",
		"luck": 7,
		"xp": 5,
		"scroll": true,
		"upgrade": {
			"luck": 1.75,
			"resistance": 10,
			"xp": 1
		},
		"grades": [
			0,
			0,
			0,
			12
		],
		"name": "Lucky T-Shirt",
		"g": 120000,
		"armor_weight": "light",
		"hp": 1831,
		"mp": 768,
		"armor": 49,
		"resistance": 49
	},
	"tshirt0": {
		"type": "chest",
		"skin": "tshirt0",
		"upgrade": {},
		"name": "T-Shirt (Int)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 195,
		"mp": 136,
		"armor": 1,
		"resistance": 8
	},
	"tshirt1": {
		"type": "chest",
		"skin": "tshirt1",
		"upgrade": {},
		"name": "T-Shirt (Dex)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 195,
		"mp": 136,
		"armor": 1,
		"resistance": 8
	},
	"tshirt2": {
		"type": "chest",
		"skin": "tshirt2",
		"upgrade": {},
		"name": "T-Shirt (Str)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 195,
		"mp": 136,
		"armor": 1,
		"resistance": 8
	},
	"tshirt3": {
		"type": "chest",
		"skin": "tshirt3",
		"xp": 2,
		"upgrade": {
			"xp": 0.75
		},
		"name": "T-Shirt (XP)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 365,
		"mp": 174,
		"armor": 21,
		"resistance": 20
	},
	"tshirt4": {
		"type": "chest",
		"skin": "tshirt4",
		"upgrade": {
			"speed": 0.5
		},
		"name": "T-Shirt (Speed)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 492,
		"mp": 226,
		"armor": 16,
		"resistance": 23
	},
	"tshirt88": {
		"type": "chest",
		"skin": "tshirt88",
		"luck": 12,
		"xp": 5,
		"upgrade": {},
		"name": "T-Shirt (Lucky)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 1331,
		"mp": 603,
		"armor": 34,
		"resistance": 67
	},
	"tshirt6": {
		"type": "chest",
		"skin": "tshirt6",
		"upgrade": {
			"rpiercing": 5
		},
		"name": "T-Shirt (Res. Piercing)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 486,
		"mp": 285,
		"armor": 40,
		"resistance": 41
	},
	"tshirt7": {
		"type": "chest",
		"skin": "tshirt7",
		"upgrade": {
			"apiercing": 5
		},
		"name": "T-Shirt (Armor Piercing)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 486,
		"mp": 285,
		"armor": 40,
		"resistance": 41
	},
	"tshirt8": {
		"type": "chest",
		"skin": "tshirt8",
		"mp_cost": -5,
		"upgrade": {
			"mp_cost": -2
		},
		"name": "T-Shirt (Attack MP Cost)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 917,
		"mp": 461,
		"armor": 32,
		"resistance": 59
	},
	"tshirt9": {
		"type": "chest",
		"skin": "tshirt9",
		"upgrade": {
			"manasteal": 0.1
		},
		"name": "T-Shirt (Manasteal)",
		"grades": [
			0,
			6,
			10,
			12
		],
		"g": 120,
		"armor_weight": "light",
		"hp": 917,
		"mp": 461,
		"armor": 32,
		"resistance": 59
	},
	"coat": {
		"tier": 1,
		"type": "chest",
		"skin": "coat",
		"scroll": true,
		"upgrade": {
			"armor": 0.25,
			"resistance": 0.25
		},
		"name": "Coat",
		"g": 6000,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 232,
		"mp": 17,
		"set": "basic"
	},
	"wattire": {
		"set": "wanderers",
		"tier": 1,
		"type": "chest",
		"skin": "wattire",
		"scroll": true,
		"upgrade": {
			"armor": 0.5,
			"resistance": 0.5
		},
		"name": "Wanderer's Attire",
		"g": 12000,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 623,
		"mp": 67,
		"armor": 4,
		"resistance": 3
	},
	"xmassweater": {
		"set": "holidays",
		"tier": 1.5,
		"type": "chest",
		"skin": "xmassweater",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"evasion": 0.25,
			"resistance": 1.5
		},
		"explanation": "Such a beautiful vest. But for some reason, every time you wear this, people seem to avoid you.",
		"name": "Xmas Sweater",
		"g": 16000,
		"a": true,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 55,
		"mp": 31,
		"armor": 4,
		"resistance": 3
	},
	"sweaterhs": {
		"set": "holidays",
		"tier": 2.5,
		"type": "chest",
		"skin": "sweaterhs",
		"scroll": true,
		"upgrade": {
			"armor": 4,
			"resistance": 4
		},
		"name": "Super Sweater",
		"g": 160000,
		"a": true,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 55,
		"mp": 31,
		"armor": 4,
		"resistance": 3
	},
	"coat1": {
		"set": "rugged",
		"tier": 2,
		"type": "chest",
		"skin": "coat1",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"resistance": 2.5
		},
		"name": "Rugged Coat",
		"g": 48000,
		"a": 2,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1032,
		"mp": 41,
		"armor": 20,
		"resistance": 16
	},
	"mwarmor": {
		"class": [
			"warrior"
		],
		"set": "mwarrior",
		"tier": 2.625,
		"type": "chest",
		"skin": "mwarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Warrior",
		"explanation": "You served our realm well",
		"g": 96000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"hp": 2192,
		"mp": 38,
		"armor": 59,
		"resistance": 31
	},
	"mmarmor": {
		"class": [
			"mage"
		],
		"set": "mmage",
		"tier": 2.125,
		"type": "chest",
		"skin": "mmarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Mage",
		"explanation": "You served our realm well",
		"g": 96000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 1544,
		"mp": 219,
		"armor": 33,
		"resistance": 33
	},
	"mparmor": {
		"class": [
			"priest"
		],
		"set": "mpriest",
		"tier": 2.125,
		"type": "chest",
		"skin": "mparmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Priest",
		"explanation": "You served our realm well",
		"g": 96000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 1544,
		"mp": 219,
		"armor": 33,
		"resistance": 33
	},
	"mrnarmor": {
		"class": [
			"ranger"
		],
		"set": "mranger",
		"tier": 2.25,
		"type": "chest",
		"skin": "mrnarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Ranger",
		"explanation": "You served our realm well",
		"g": 96000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1563,
		"mp": 139,
		"armor": 43,
		"resistance": 33
	},
	"mrarmor": {
		"class": [
			"rogue"
		],
		"set": "mrogue",
		"tier": 2.25,
		"type": "chest",
		"skin": "mrarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Rogue",
		"explanation": "You served our realm well",
		"g": 96000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1563,
		"mp": 139,
		"armor": 43,
		"resistance": 33
	},
	"mcarmor": {
		"class": [
			"merchant"
		],
		"set": "mmerchant",
		"tier": 2.25,
		"type": "chest",
		"skin": "mcarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Merchant",
		"explanation": "Your comrades served our realm well",
		"g": 96000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1563,
		"mp": 139,
		"armor": 43,
		"resistance": 33
	},
	"harmor": {
		"set": "wt3",
		"tier": 3,
		"type": "chest",
		"skin": "harmor",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5
		},
		"name": "Heavy Armor",
		"g": 480000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "heavy",
		"hp": 1399,
		"mp": 78,
		"armor": 43,
		"resistance": 25
	},
	"cdragon": {
		"type": "chest",
		"skin": "dragonarmor",
		"name": "Dragon Armor",
		"g": 8900000,
		"a": 2,
		"grades": [
			0,
			0,
			10,
			12
		],
		"armor_weight": "light"
	},
	"oxhelmet": {
		"type": "helmet",
		"skin": "oxhelmet",
		"output": 1,
		"name": "OX Helmet",
		"g": 8900000,
		"a": 2,
		"grades": [
			0,
			0,
			10,
			12
		],
		"armor_weight": "heavy"
	},
	"xarmor": {
		"set": "wt4",
		"tier": 4,
		"type": "chest",
		"skin": "xarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Darkforge Armor",
		"g": 4800000,
		"a": 2,
		"grades": [
			0,
			0,
			8,
			10
		],
		"armor_weight": "heavy",
		"hp": 1771,
		"mp": 113,
		"armor": 50,
		"resistance": 29
	},
	"mcape": {
		"set": "vampires",
		"tier": 2,
		"type": "chest",
		"skin": "mcape",
		"scroll": true,
		"upgrade": {
			"armor": 3,
			"hp": 35,
			"lifesteal": 0.2,
			"resistance": 8
		},
		"name": "Dracul's Attire",
		"g": 480000,
		"a": 2,
		"grades": [
			0,
			6,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1868,
		"mp": 248,
		"armor": 51,
		"resistance": 17
	},
	"vattire": {
		"set": "vampires",
		"tier": 3,
		"type": "chest",
		"skin": "vattire",
		"scroll": true,
		"upgrade": {
			"armor": 6,
			"hp": 325,
			"lifesteal": 0.2,
			"resistance": 6
		},
		"name": "Spike's Attire",
		"g": 4800000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "medium",
		"hp": 1868,
		"mp": 248,
		"armor": 51,
		"resistance": 17
	},
	"warpvest": {
		"set": "legends",
		"tier": 3,
		"type": "chest",
		"skin": "warpvest",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5,
			"hp": 30.72,
			"pvp_damage_reduction": 4.761904761904767
		},
		"name": "Warp Vest",
		"explanation": "Warps space-time. Ancient Computer unlocks only a fraction of its capabilities. Needs to be recharged in order to initiate a jump.",
		"ability": "warp",
		"charge": 1,
		"g": 36400000,
		"a": 2,
		"edge": 5,
		"grades": [
			0,
			0,
			6,
			10
		],
		"armor_weight": "heavy",
		"hp": 585,
		"mp": 113,
		"armor": 50,
		"resistance": 29
	},
	"pyjamas": {
		"tier": 2,
		"type": "chest",
		"skin": "pyjamas",
		"scroll": true,
		"hp": 400,
		"charisma": -5,
		"upgrade": {
			"hp": 50,
			"resistance": 2.5,
			"armor": 2.5,
			"scroll_value": 1
		},
		"name": "Legacy Pyjamas",
		"g": 480000,
		"a": 2,
		"grades": [
			4,
			8,
			10,
			12
		],
		"explanation": "Comfortable.",
		"extra_stat": 1,
		"armor": 24,
		"resistance": 16,
		"armor_weight": "light",
		"scroll_value": 2
	},
	"epyjamas": {
		"set": "bunny",
		"tier": 1.5,
		"type": "chest",
		"skin": "epyjamas",
		"scroll": true,
		"charisma": -5,
		"upgrade": {
			"armor": 1.5,
			"hp": 50,
			"resistance": 1.5
		},
		"name": "Pyjamas",
		"g": 48000,
		"a": 2,
		"grades": [
			5,
			8,
			10,
			12
		],
		"explanation": "Comfortable.",
		"armor_weight": "light",
		"hp": 344,
		"mp": 197,
		"armor": 29,
		"resistance": 29
	},
	"pants": {
		"tier": 1,
		"type": "pants",
		"skin": "pants",
		"scroll": true,
		"upgrade": {
			"armor": 0.25,
			"resistance": 0.25
		},
		"name": "Pants",
		"g": 7800,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 193,
		"mp": 14,
		"set": "basic"
	},
	"fallen": {
		"set": "fury",
		"tier": 1.5,
		"type": "pants",
		"class": [
			"rogue",
			"warrior"
		],
		"skin": "fallen",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"crit": 0.5,
			"resistance": 1.5
		},
		"name": "Pants of the Fallen Master",
		"grades": [
			0,
			0,
			8,
			10
		],
		"g": 6400000,
		"a": true,
		"armor_weight": "heavy",
		"hp": 1180,
		"mp": 210,
		"armor": 44,
		"resistance": 34
	},
	"wbreeches": {
		"set": "wanderers",
		"tier": 1,
		"type": "pants",
		"skin": "wbreeches",
		"scroll": true,
		"upgrade": {
			"armor": 0.5,
			"resistance": 0.5
		},
		"name": "Wanderer's Breeches",
		"g": 15600,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 520,
		"mp": 57,
		"armor": 4,
		"resistance": 2
	},
	"xmaspants": {
		"set": "holidays",
		"tier": 1.5,
		"type": "pants",
		"skin": "xmaspants",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"resistance": 1.5
		},
		"name": "Xmas Pants",
		"g": 17800,
		"a": true,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 46,
		"mp": 26,
		"armor": 4,
		"resistance": 2
	},
	"pants1": {
		"set": "rugged",
		"tier": 2,
		"type": "pants",
		"skin": "pants1",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"resistance": 2.5
		},
		"name": "Rugged Pants",
		"g": 78000,
		"a": 2,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 860,
		"mp": 34,
		"armor": 17,
		"resistance": 14
	},
	"mwpants": {
		"class": [
			"warrior"
		],
		"set": "mwarrior",
		"tier": 2.625,
		"type": "pants",
		"skin": "mwpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Underarmor of the Hunter Warrior",
		"explanation": "You served our realm well",
		"g": 128000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"hp": 1077,
		"mp": 31,
		"armor": 48,
		"resistance": 28
	},
	"mmpants": {
		"class": [
			"mage"
		],
		"set": "mmage",
		"tier": 2.125,
		"type": "pants",
		"skin": "mmpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Pants of the Hunter Mage",
		"explanation": "You served our realm well",
		"g": 128000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 1185,
		"mp": 183,
		"armor": 27,
		"resistance": 27
	},
	"mppants": {
		"class": [
			"priest"
		],
		"set": "mpriest",
		"tier": 2.125,
		"type": "pants",
		"skin": "mppants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Pants of the Hunter Priest",
		"explanation": "You served our realm well",
		"g": 128000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 1185,
		"mp": 183,
		"armor": 27,
		"resistance": 27
	},
	"mrnpants": {
		"class": [
			"ranger"
		],
		"set": "mranger",
		"tier": 2.25,
		"type": "pants",
		"skin": "mrnpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Pants of the Hunter Ranger",
		"explanation": "You served our realm well",
		"g": 128000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1268,
		"mp": 115,
		"armor": 36,
		"resistance": 27
	},
	"mrpants": {
		"class": [
			"rogue"
		],
		"set": "mrogue",
		"tier": 2.25,
		"type": "pants",
		"skin": "mrpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Pants of the Hunter Rogue",
		"explanation": "You served our realm well",
		"g": 128000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1268,
		"mp": 115,
		"armor": 36,
		"resistance": 27
	},
	"mcpants": {
		"class": [
			"merchant"
		],
		"set": "mmerchant",
		"tier": 2.25,
		"type": "pants",
		"skin": "mcpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Pants of the Hunter Merchant",
		"explanation": "Your comrades served our realm well",
		"g": 128000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 1268,
		"mp": 115,
		"armor": 36,
		"resistance": 27
	},
	"starkillers": {
		"set": "legends",
		"class": [
			"mage",
			"priest"
		],
		"tier": 3,
		"type": "pants",
		"skin": "starkillers",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"crit": 0.2,
			"resistance": 5.5,
			"rpiercing": 5
		},
		"legacy": {
			"class": null,
			"set": null
		},
		"name": "Star Killer's Pants",
		"g": 7800000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "heavy",
		"hp": 512,
		"mp": 95,
		"armor": 42,
		"resistance": 25
	},
	"hpants": {
		"set": "wt3",
		"tier": 3,
		"type": "pants",
		"skin": "hpants",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5
		},
		"name": "Heavy Underarmor",
		"g": 780000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "heavy",
		"hp": 1166,
		"mp": 65,
		"armor": 36,
		"resistance": 21
	},
	"frankypants": {
		"tier": 3,
		"type": "pants",
		"skin": "frankypants",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5
		},
		"name": "Franky Pants",
		"g": 780000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "light"
	},
	"xpants": {
		"set": "wt4",
		"tier": 4,
		"type": "pants",
		"skin": "xpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Darkforge Underarmor",
		"g": 7800000,
		"a": 2,
		"grades": [
			0,
			0,
			8,
			10
		],
		"armor_weight": "heavy",
		"hp": 1476,
		"mp": 95,
		"armor": 42,
		"resistance": 25
	},
	"shoes": {
		"tier": 1,
		"type": "shoes",
		"skin": "shoes",
		"scroll": true,
		"upgrade": {
			"armor": 0.25,
			"speed": 0.625
		},
		"name": "Shoes",
		"g": 12100,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 77,
		"mp": 6,
		"set": "basic"
	},
	"wshoes": {
		"set": "wanderers",
		"tier": 1,
		"type": "shoes",
		"skin": "wshoes",
		"scroll": true,
		"upgrade": {
			"armor": 0.5,
			"speed": 0.625
		},
		"name": "Wanderer's Shoes",
		"g": 24200,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 208,
		"mp": 22,
		"armor": 1,
		"resistance": 1
	},
	"iceskates": {
		"tier": 2,
		"type": "shoes",
		"skin": "iceskates",
		"scroll": true,
		"winterland": {
			"speed": 25,
			"upgrade": {
				"speed": 1
			}
		},
		"upgrade": {
			"armor": 2.5,
			"speed": 1
		},
		"name": "Ice Skates",
		"g": 920000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light"
	},
	"snowboots": {
		"tier": 2,
		"type": "shoes",
		"skin": "snowboots",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"fzresistance": 1,
			"speed": 0.875
		},
		"name": "Snow Boots",
		"g": 720000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light"
	},
	"eslippers": {
		"set": "bunny",
		"tier": 1.5,
		"type": "shoes",
		"skin": "eslippers",
		"scroll": true,
		"cuteness": 24,
		"upgrade": {
			"armor": 1.5,
			"cuteness": 2,
			"speed": 0.75
		},
		"grades": [
			7,
			9,
			10,
			12
		],
		"name": "Fluffy Slippers",
		"g": 24200,
		"armor_weight": "light",
		"hp": 114,
		"mp": 65,
		"armor": 10,
		"resistance": 10
	},
	"wingedboots": {
		"set": "swift",
		"tier": 1.5,
		"type": "shoes",
		"skin": "wingedboots",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"resistance": 1.5,
			"speed": 1,
			"attacks_per_second": 0.00625
		},
		"name": "Winged Boots",
		"g": 150000,
		"credit": "Pluet",
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 106,
		"mp": 22,
		"armor": 8,
		"resistance": 7
	},
	"xmasshoes": {
		"set": "holidays",
		"tier": 1.5,
		"type": "shoes",
		"skin": "xmasshoes",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"speed": 0.75
		},
		"name": "Xmas Shoes",
		"g": 36000,
		"a": true,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"shoes1": {
		"set": "rugged",
		"tier": 2,
		"type": "shoes",
		"skin": "shoes1",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"speed": 0.875
		},
		"name": "Rugged Shoes",
		"g": 120000,
		"a": 2,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 344,
		"mp": 14,
		"armor": 6,
		"resistance": 5
	},
	"mwboots": {
		"class": [
			"warrior"
		],
		"set": "mwarrior",
		"tier": 2.625,
		"type": "shoes",
		"skin": "mwboots",
		"scroll": true,
		"upgrade": {
			"speed": 1.03125,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Boots of the Hunter Warrior",
		"explanation": "You served our realm well",
		"g": 240000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"hp": 427,
		"mp": 14,
		"armor": 21,
		"resistance": 10
	},
	"mmshoes": {
		"class": [
			"mage"
		],
		"set": "mmage",
		"tier": 2.125,
		"type": "shoes",
		"skin": "mmshoes",
		"scroll": true,
		"upgrade": {
			"speed": 0.90625,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Shoes of the Hunter Mage",
		"explanation": "You served our realm well",
		"g": 240000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 513,
		"mp": 73,
		"armor": 10,
		"resistance": 11
	},
	"mpshoes": {
		"class": [
			"priest"
		],
		"set": "mpriest",
		"tier": 2.125,
		"type": "shoes",
		"skin": "mpshoes",
		"scroll": true,
		"upgrade": {
			"speed": 0.90625,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Shoes of the Hunter Priest",
		"explanation": "You served our realm well",
		"g": 240000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 513,
		"mp": 73,
		"armor": 10,
		"resistance": 11
	},
	"mrnboots": {
		"class": [
			"ranger"
		],
		"set": "mranger",
		"tier": 2.25,
		"type": "shoes",
		"skin": "mrnboots",
		"scroll": true,
		"upgrade": {
			"speed": 0.9375,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Boots of the Hunter Ranger",
		"explanation": "You served our realm well",
		"g": 240000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 522,
		"mp": 46,
		"armor": 14,
		"resistance": 10
	},
	"mrboots": {
		"class": [
			"rogue"
		],
		"set": "mrogue",
		"tier": 2.25,
		"type": "shoes",
		"skin": "mrboots",
		"scroll": true,
		"upgrade": {
			"speed": 0.9375,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Boots of the Hunter Rogue",
		"explanation": "You served our realm well",
		"g": 240000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 522,
		"mp": 46,
		"armor": 14,
		"resistance": 10
	},
	"mcboots": {
		"class": [
			"merchant"
		],
		"set": "mmerchant",
		"tier": 2.75,
		"type": "shoes",
		"skin": "mcboots",
		"scroll": true,
		"upgrade": {
			"speed": 1.0625,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Boots of the Hunter Merchant",
		"explanation": "Your comrades served our realm well",
		"g": 240000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 522,
		"mp": 46,
		"armor": 14,
		"resistance": 10
	},
	"hboots": {
		"set": "wt3",
		"tier": 3,
		"type": "shoes",
		"skin": "hboots",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 2.75,
			"speed": 1.125
		},
		"name": "Heavy Boots",
		"g": 1240000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "heavy",
		"hp": 466,
		"mp": 26,
		"armor": 14,
		"resistance": 9
	},
	"xboots": {
		"set": "wt4",
		"tier": 4,
		"type": "shoes",
		"skin": "xboots",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 3.75,
			"speed": 1.375
		},
		"name": "Darkforge Boots",
		"g": 12400000,
		"a": 2,
		"grades": [
			0,
			0,
			8,
			10
		],
		"armor_weight": "heavy",
		"hp": 590,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"gloves": {
		"tier": 1,
		"type": "gloves",
		"skin": "gloves",
		"scroll": true,
		"upgrade": {
			"armor": 0.25,
			"resistance": 0.25
		},
		"name": "Gloves",
		"g": 3400,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 78,
		"mp": 6,
		"set": "basic"
	},
	"vgloves": {
		"set": "vampires",
		"tier": 3,
		"type": "gloves",
		"skin": "vgloves",
		"scroll": true,
		"upgrade": {
			"armor": 6,
			"resistance": 6
		},
		"name": "Vampiric Gloves",
		"g": 340000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "medium",
		"hp": 622,
		"mp": 82,
		"armor": 17,
		"resistance": 5
	},
	"vboots": {
		"set": "vampires",
		"tier": 3,
		"type": "shoes",
		"skin": "vboots",
		"scroll": true,
		"upgrade": {
			"armor": 6,
			"resistance": 3,
			"speed": 1.125
		},
		"name": "Vampiric Boots",
		"g": 340000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "medium",
		"hp": 623,
		"mp": 83,
		"armor": 17,
		"resistance": 6
	},
	"vcape": {
		"set": "vampires",
		"tier": 4,
		"type": "cape",
		"skin": "vcape",
		"scroll": true,
		"upgrade": {
			"scroll_value": 1
		},
		"name": "Vampiric Cape",
		"g": 340000,
		"grades": [
			0,
			0,
			8,
			10
		],
		"armor_weight": "medium",
		"hp": 797,
		"mp": 163,
		"armor": 21,
		"resistance": 7,
		"damage": 8,
		"throw_range": 12,
		"attacks_per_second": 0.0244375,
		"base_crit": 3
	},
	"fierygloves": {
		"set": "swift",
		"tier": 1.5,
		"type": "gloves",
		"skin": "fierygloves",
		"scroll": true,
		"upgrade": {
			"armor": 1.5,
			"resistance": 1.5,
			"attacks_per_second": 0.00125
		},
		"grades": [
			0,
			7,
			10,
			12
		],
		"name": "Fiery Gloves",
		"g": 144000,
		"armor_weight": "medium",
		"hp": 106,
		"mp": 22,
		"armor": 8,
		"resistance": 7
	},
	"wgloves": {
		"set": "wanderers",
		"tier": 1,
		"type": "gloves",
		"skin": "wgloves",
		"scroll": true,
		"upgrade": {
			"armor": 0.5,
			"resistance": 0.5
		},
		"name": "Wanderer's Gloves",
		"g": 6800,
		"grades": [
			7,
			9,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 208,
		"mp": 22,
		"armor": 1,
		"resistance": 1
	},
	"mittens": {
		"set": "holidays",
		"tier": 1.5,
		"type": "gloves",
		"skin": "mittens",
		"scroll": true,
		"upgrade": {
			"apiercing": 2,
			"armor": 1.5,
			"resistance": 1.5,
			"rpiercing": 2
		},
		"name": "Mittens",
		"explanation": "Cute but deadly.",
		"g": 34000,
		"a": true,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"supermittens": {
		"set": "holidays",
		"tier": 2,
		"type": "gloves",
		"skin": "supermittens",
		"scroll": true,
		"upgrade": {
			"apiercing": 3,
			"armor": 2.5,
			"resistance": 2.5,
			"rpiercing": 3,
			"attacks_per_second": 0.002
		},
		"name": "Super Mittens",
		"explanation": "Swift and lethal!",
		"g": 340000,
		"a": true,
		"grades": [
			0,
			0,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"powerglove": {
		"set": "legends",
		"tier": 2,
		"type": "gloves",
		"skin": "powerglove",
		"scroll": true,
		"upgrade": {
			"apiercing": 2,
			"armor": 2.5,
			"resistance": 2.5,
			"rpiercing": 2,
			"attacks_per_second": 0.002
		},
		"ability": "power",
		"charge": 120,
		"name": "Power Glove",
		"g": 1600000,
		"a": true,
		"grades": [
			0,
			0,
			10,
			12
		],
		"armor_weight": "heavy",
		"hp": 195,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"goldenpowerglove": {
		"set": "legends",
		"tier": 4,
		"type": "gloves",
		"skin": "goldenpowerglove",
		"scroll": true,
		"upgrade": {
			"apiercing": 4,
			"armor": 7.5,
			"resistance": 7.5,
			"rpiercing": 4,
			"attacks_per_second": 0.002
		},
		"ability": "xpower",
		"charge": 90,
		"name": "Golden Power Glove",
		"g": 16000000,
		"a": true,
		"grades": [
			0,
			0,
			8,
			10
		],
		"armor_weight": "heavy",
		"hp": 195,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"handofmidas": {
		"tier": 3.5,
		"type": "gloves",
		"skin": "goldglove",
		"gold": 10,
		"upgrade": {
			"armor": 6.5,
			"gold": 1,
			"resistance": 6.5
		},
		"name": "Hand of Midas",
		"explanation": "You can feel the thirst for gold move through your veins.",
		"grades": [
			0,
			0,
			9,
			10
		],
		"g": 800000,
		"a": true,
		"armor_weight": "light",
		"hp": 122,
		"mp": 58,
		"armor": 7,
		"resistance": 7
	},
	"poker": {
		"tier": 1.5,
		"type": "gloves",
		"skin": "poker",
		"crit": 0.5,
		"ability": "poke",
		"scroll": true,
		"upgrade": {
			"resistance": 1.5,
			"armor": 1.5,
			"scroll_value": 1
		},
		"name": "Poker",
		"explanation": "Pokey pokey!",
		"g": 16000,
		"a": true,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor": 11,
		"resistance": 6,
		"armor_weight": "light",
		"scroll_value": 1
	},
	"gloves1": {
		"set": "rugged",
		"tier": 2,
		"type": "gloves",
		"skin": "gloves1",
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"resistance": 2.5
		},
		"name": "Rugged Gloves",
		"g": 34000,
		"a": 2,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 344,
		"mp": 14,
		"armor": 7,
		"resistance": 6
	},
	"mpxgloves": {
		"set": "mpx",
		"tier": 2,
		"type": "gloves",
		"skin": "mpxgloves",
		"ability": "restore_mp",
		"attr0": 2,
		"scroll": true,
		"upgrade": {
			"armor": 2.5,
			"attr0": 0.5,
			"resistance": 2.5
		},
		"name": "Mana Gloves",
		"explanation": "The powers of this glove grow fivefold against humanoids!",
		"grades": [
			0,
			0,
			9,
			12
		],
		"g": 34000000,
		"armor_weight": "light",
		"hp": 120,
		"mp": 71,
		"armor": 10,
		"resistance": 11
	},
	"mwgloves": {
		"class": [
			"warrior"
		],
		"set": "mwarrior",
		"tier": 2.625,
		"type": "gloves",
		"skin": "mwgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Warrior",
		"explanation": "You served our realm well",
		"g": 68000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"hp": 427,
		"mp": 14,
		"armor": 17,
		"resistance": 10
	},
	"mmgloves": {
		"class": [
			"mage"
		],
		"set": "mmage",
		"tier": 2.125,
		"type": "gloves",
		"skin": "mmgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Mage",
		"explanation": "You served our realm well",
		"g": 68000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 513,
		"mp": 73,
		"armor": 11,
		"resistance": 11
	},
	"mpgloves": {
		"output": 5,
		"class": [
			"priest"
		],
		"set": "mpriest",
		"tier": 2.125,
		"type": "gloves",
		"skin": "mpgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Priest",
		"explanation": "You served our realm well",
		"g": 68000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "light",
		"hp": 513,
		"mp": 73,
		"armor": 11,
		"resistance": 11
	},
	"mrngloves": {
		"class": [
			"ranger"
		],
		"set": "mranger",
		"tier": 2.25,
		"type": "gloves",
		"skin": "mrngloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Ranger",
		"explanation": "You served our realm well",
		"g": 68000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 522,
		"mp": 47,
		"armor": 14,
		"resistance": 10
	},
	"mrgloves": {
		"class": [
			"rogue"
		],
		"set": "mrogue",
		"tier": 2.25,
		"type": "gloves",
		"skin": "mrgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Rogue",
		"explanation": "You served our realm well",
		"g": 68000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 522,
		"mp": 47,
		"armor": 14,
		"resistance": 10
	},
	"mcgloves": {
		"gold": 5,
		"class": [
			"merchant"
		],
		"set": "mmerchant",
		"tier": 2.25,
		"type": "gloves",
		"skin": "mcgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Merchant",
		"explanation": "Your comrades served our realm well",
		"g": 68000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"armor_weight": "medium",
		"hp": 522,
		"mp": 47,
		"armor": 14,
		"resistance": 10
	},
	"hgloves": {
		"set": "wt3",
		"tier": 3,
		"type": "gloves",
		"skin": "hgloves",
		"scroll": true,
		"upgrade": {
			"armor": 5.5,
			"resistance": 5.5
		},
		"name": "Heavy Gloves",
		"g": 340000,
		"a": 2,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "heavy",
		"hp": 466,
		"mp": 26,
		"armor": 14,
		"resistance": 8
	},
	"xgloves": {
		"set": "wt4",
		"tier": 4,
		"type": "gloves",
		"skin": "xgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Darkforge Gloves",
		"g": 3400000,
		"a": 2,
		"grades": [
			0,
			0,
			8,
			10
		],
		"armor_weight": "heavy",
		"hp": 590,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"claw": {
		"type": "weapon",
		"wtype": "fist",
		"tier": 1,
		"skin": "claw",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 17.723076923076924,
			"attacks_per_second": 0
		},
		"name": "Claw",
		"g": 7200,
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 5,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 1,
			"shared_rank": 1,
			"role": "progression",
			"requirement": 1,
			"reference_level": 1,
			"target_dps": 55,
			"full_sheet_hit_damage": 105,
			"attacks_per_second": 0.5240625,
			"base_dps": 55.0265625,
			"selected_effort": 0
		},
		"damage": 105,
		"attacks_per_second": 0.5240625,
		"throw_range": 3,
		"base_crit": 1.4
	},
	"cclaw": {
		"type": "weapon",
		"wtype": "fist",
		"tier": 1.5,
		"skin": "cclaw",
		"apiercing": 20,
		"damage_type": "physical",
		"upgrade": {
			"apiercing": 4,
			"range": 1.5,
			"damage": 45.41538461538462,
			"attacks_per_second": 0
		},
		"name": "Crab Claw",
		"g": 9600,
		"grades": [
			5,
			8,
			10,
			12
		],
		"range": 5.5,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 2,
			"shared_rank": 2,
			"role": "progression",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 68.5152016789,
			"full_sheet_hit_damage": 97,
			"attacks_per_second": 0.70625,
			"base_dps": 68.50625,
			"selected_effort": 362.099525106
		},
		"damage": 97,
		"attacks_per_second": 0.70625,
		"throw_range": 3,
		"base_crit": 6.8
	},
	"throwingstars": {
		"type": "weapon",
		"wtype": "stars",
		"tier": 1,
		"skin": "throwingstars",
		"damage_type": "physical",
		"upgrade": {
			"range": 4,
			"damage": 78.0923076923077,
			"attacks_per_second": 0
		},
		"name": "Throwing Stars",
		"g": 72000,
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 50,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 6,
			"shared_rank": 6,
			"role": "progression",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 165,
			"full_sheet_hit_damage": 218,
			"attacks_per_second": 0.756875,
			"base_dps": 164.99875,
			"selected_effort": 54495.0725733
		},
		"damage": 218,
		"attacks_per_second": 0.756875,
		"throw_range": 309,
		"base_crit": 4.4
	},
	"snowflakes": {
		"type": "weapon",
		"wtype": "stars",
		"tier": 2,
		"ability": "freeze",
		"attr0": 1,
		"skin": "snowflakes",
		"skin_r": "snowflakes_r",
		"damage_type": "physical",
		"upgrade": {
			"attr0": 1,
			"range": 5,
			"damage": 58.83076923076923,
			"attacks_per_second": 0
		},
		"name": "Snowflakes",
		"g": 92000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 60,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 6,
			"shared_rank": 6,
			"role": "sidegrade",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 165,
			"full_sheet_hit_damage": 136,
			"attacks_per_second": 1.21324324324,
			"base_dps": 165.001081081,
			"selected_effort": 56757.5824774
		},
		"damage": 136,
		"attacks_per_second": 1.21324324324,
		"throw_range": 21,
		"base_crit": 24.6
	},
	"firestars": {
		"type": "weapon",
		"wtype": "stars",
		"tier": 2.5,
		"skin": "firestars",
		"skin_r": "firestars_r",
		"damage_type": "physical",
		"ability": "burn",
		"attr0": 1.5,
		"upgrade": {
			"attr0": 0.5,
			"range": 5.5,
			"damage": 62.276923076923076,
			"attacks_per_second": 0
		},
		"name": "Fiery Throwing Stars",
		"g": 290000,
		"grades": [
			0,
			4,
			10,
			12
		],
		"range": 65,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 7,
			"shared_rank": 7,
			"role": "progression",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 205.545605036,
			"full_sheet_hit_damage": 150,
			"attacks_per_second": 1.3703125,
			"base_dps": 205.546875,
			"selected_effort": 57253.3457055
		},
		"damage": 150,
		"attacks_per_second": 1.3703125,
		"throw_range": 144,
		"base_crit": 20.2
	},
	"fclaw": {
		"type": "weapon",
		"wtype": "fist",
		"tier": 2,
		"skin": "fclaw",
		"skin_r": "fclaw_r",
		"damage_type": "physical",
		"ability": "freeze",
		"attr0": 0.2,
		"upgrade": {
			"attr0": 0.1,
			"range": 1.5,
			"damage": 51.93846153846154,
			"attacks_per_second": 0
		},
		"name": "Frozen Claw",
		"g": 72000,
		"a": true,
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 6,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 4,
			"shared_rank": 4,
			"role": "progression",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 106.325012471,
			"full_sheet_hit_damage": 125,
			"attacks_per_second": 0.850625,
			"base_dps": 106.328125,
			"selected_effort": 4358.35314159
		},
		"damage": 125,
		"attacks_per_second": 0.850625,
		"throw_range": 3,
		"base_crit": 4.2
	},
	"pclaw": {
		"type": "weapon",
		"wtype": "fist",
		"tier": 2.4,
		"skin": "pclaw",
		"damage_type": "physical",
		"ability": "poison",
		"attr0": 1,
		"pnresistance": 2,
		"upgrade": {
			"attr0": 0.5,
			"pnresistance": 1,
			"range": 1.5,
			"damage": 94.76923076923077,
			"attacks_per_second": 0
		},
		"name": "Poison Claw",
		"g": 72000,
		"a": true,
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 6.4,
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 8,
			"shared_rank": 8,
			"role": "progression",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 256.054519696,
			"full_sheet_hit_damage": 213,
			"attacks_per_second": 1.20216216216,
			"base_dps": 256.060540541,
			"selected_effort": 62043.3070945
		},
		"damage": 213,
		"attacks_per_second": 1.20216216216,
		"throw_range": 129,
		"base_crit": 24.4
	},
	"stinger": {
		"type": "weapon",
		"wtype": "dagger",
		"tier": 1.4,
		"skin": "stinger",
		"damage_type": "physical",
		"upgrade": {
			"range": 2,
			"damage": 48.49230769230769,
			"attacks_per_second": 0
		},
		"name": "Stinger",
		"g": 16000,
		"cx": {
			"accent": "#96783E",
			"scale": 0.5,
			"extension": true
		},
		"grades": [
			5,
			8,
			10,
			12
		],
		"range": 5.4,
		"progression": {
			"historical_rank": 3,
			"shared_rank": 3,
			"role": "progression",
			"requirement": 20,
			"reference_level": 15,
			"target_dps": 85.3515065654,
			"full_sheet_hit_damage": 115,
			"attacks_per_second": 0.7421875,
			"base_dps": 85.3515625,
			"selected_effort": 972.08266329
		},
		"damage": 115,
		"attacks_per_second": 0.7421875,
		"throw_range": 3,
		"base_crit": 11.4
	},
	"dagger": {
		"type": "weapon",
		"wtype": "dagger",
		"tier": 2,
		"skin": "dagger",
		"damage_type": "physical",
		"upgrade": {
			"range": 2,
			"damage": 69.1076923076923,
			"attacks_per_second": 0
		},
		"name": "Dagger",
		"g": 167000,
		"a": true,
		"cx": {
			"accent": "#3B9A5C",
			"scale": 0.5,
			"extension": true
		},
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 6,
		"progression": {
			"historical_rank": 6,
			"shared_rank": 6,
			"role": "sidegrade",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 165,
			"full_sheet_hit_damage": 173,
			"attacks_per_second": 0.95375,
			"base_dps": 164.99875,
			"selected_effort": 54772.507506
		},
		"damage": 173,
		"attacks_per_second": 0.95375,
		"throw_range": 132,
		"base_crit": 16.8
	},
	"daggerofthedead": {
		"type": "weapon",
		"wtype": "dagger",
		"tier": 2.4,
		"skin": "daggerofthedead",
		"speed": -2,
		"apiercing": 20,
		"damage_type": "physical",
		"upgrade": {
			"range": 2,
			"damage": 58.83076923076923,
			"attacks_per_second": 0
		},
		"name": "Dagger of the Dead",
		"explanation": "A deadly weapon",
		"g": 224000,
		"a": true,
		"grades": [
			0,
			6,
			10,
			12
		],
		"cx": {
			"accent": "#D87F0E",
			"scale": 0.5,
			"extension": true
		},
		"range": 6.4,
		"progression": {
			"historical_rank": 5,
			"shared_rank": 5,
			"role": "progression",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 132.45235769,
			"full_sheet_hit_damage": 130,
			"attacks_per_second": 1.01875,
			"base_dps": 132.4375,
			"selected_effort": 13253.4955503
		},
		"damage": 130,
		"attacks_per_second": 1.01875,
		"throw_range": 234,
		"hp": -288,
		"base_crit": 1.8
	},
	"dragondagger": {
		"type": "weapon",
		"wtype": "dagger",
		"tier": 3,
		"skin": "dragondagger",
		"range": 11,
		"armor": 40,
		"damage_type": "physical",
		"upgrade": {
			"armor": 4,
			"range": 2,
			"damage": 125.72307692307692,
			"attacks_per_second": 0
		},
		"name": "Dragon Dagger",
		"g": 2400000,
		"a": true,
		"grades": [
			0,
			0,
			9,
			10
		],
		"explanation": "Majestic",
		"cx": {
			"accent": "#D19FDA",
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 11,
			"shared_rank": 11,
			"role": "progression",
			"requirement": 99,
			"reference_level": 70,
			"target_dps": 495,
			"full_sheet_hit_damage": 387,
			"attacks_per_second": 1.2790625,
			"base_dps": 494.9971875,
			"selected_effort": 700465416.306
		},
		"damage": 387,
		"attacks_per_second": 1.2790625,
		"throw_range": 717,
		"base_crit": 1.6
	},
	"hdagger": {
		"type": "weapon",
		"wtype": "dagger",
		"tier": 3,
		"class": [
			"rogue"
		],
		"skin": "hdagger",
		"firesistance": 15,
		"range": 11,
		"damage_type": "physical",
		"upgrade": {
			"range": 2,
			"damage": 140.6153846153846,
			"attacks_per_second": 0
		},
		"name": "Dagger of Hallowing",
		"g": 2400000,
		"a": true,
		"grades": [
			0,
			0,
			9,
			10
		],
		"cx": {
			"accent": "#847ADA",
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 10,
			"shared_rank": 10,
			"role": "sidegrade",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 397.357073071,
			"full_sheet_hit_damage": 265,
			"attacks_per_second": 1.49945945946,
			"base_dps": 397.356756757,
			"selected_effort": 5225270.29459
		},
		"damage": 265,
		"attacks_per_second": 1.49945945946,
		"throw_range": 147,
		"base_crit": 34.6
	},
	"dartgun": {
		"type": "weapon",
		"wtype": "dartgun",
		"tier": 3,
		"skin": "dartgun",
		"damage_type": "physical",
		"upgrade": {
			"range": 20,
			"damage": 138.33846153846153,
			"attacks_per_second": 0
		},
		"projectile": "dartgun",
		"name": "Golden Dart Gun",
		"explanation": "Don't let the looks fool you. It's a solid weapon with most components forged from gold. The barrel and trigger mechanism is a platinum alloy. Can shoot anything that fits its barrel, like actual gold.",
		"g": 20000000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"range": 50,
		"progression": {
			"historical_rank": 14,
			"shared_rank": 10,
			"role": "sidegrade",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 397.357073071,
			"full_sheet_hit_damage": 265,
			"attacks_per_second": 1.49945945946,
			"base_dps": 397.356756757,
			"selected_effort": 5847629.2595
		},
		"damage": 265,
		"attacks_per_second": 1.49945945946,
		"throw_range": 72,
		"base_crit": 40.2
	},
	"rod": {
		"type": "tool",
		"wtype": "rod",
		"tier": 1,
		"skin": "rod",
		"name": "Fishing Rod",
		"breaks": 1,
		"g": 2000,
		"upgrade": {
			"breaks": -0.064
		},
		"grades": [
			7,
			9,
			10,
			12
		]
	},
	"pickaxe": {
		"type": "tool",
		"wtype": "pickaxe",
		"tier": 1,
		"skin": "pickaxe",
		"name": "Copper Pickaxe",
		"g": 2000,
		"purchase_requirement": { "skill": "mining", "level": 1 }
	},
	"ironpickaxe": {
		"type": "tool", "wtype": "pickaxe", "tier": 2, "skin": "pickaxe", "name": "Iron Pickaxe", "g": 100000,
		"exclusive": true,
		"purchase_requirement": { "skill": "mining", "level": 20 }
	},
	"goldpickaxe": {
		"type": "tool", "wtype": "pickaxe", "tier": 3, "skin": "pickaxe", "name": "Gold Pickaxe", "g": 1000000,
		"exclusive": true,
		"purchase_requirement": { "skill": "mining", "level": 40 }
	},
	"mithrilpickaxe": {
		"type": "tool", "wtype": "pickaxe", "tier": 4, "skin": "pickaxe", "name": "Mithril Pickaxe", "g": 8000000,
		"exclusive": true,
		"purchase_requirement": { "skill": "mining", "level": 60 }
	},
	"adamantitepickaxe": {
		"type": "tool", "wtype": "pickaxe", "tier": 5, "skin": "pickaxe", "name": "Adamantite Pickaxe", "g": 35000000,
		"exclusive": true,
		"purchase_requirement": { "skill": "mining", "level": 80 }
	},
	"runitepickaxe": {
		"type": "tool", "wtype": "pickaxe", "tier": 6, "skin": "pickaxe", "name": "Runite Pickaxe", "g": 150000000,
		"exclusive": true,
		"purchase_requirement": { "skill": "mining", "level": 90 }
	},
	"miningcape": {
		"type": "cape", "skin": "cape0", "name": "Mining Cape", "g": 99000000, "armor_weight": "medium", "mining_bonus": 0.05,
		"exclusive": true,
		"purchase_requirement": { "skill": "mining", "level": 99 }
	},
	"copperore": {
		"type": "material", "skin": "smithing_copper_ore", "name": "Copper Ore", "s": 9999, "g": 1042, "exclusive": true
	},
	"ironore": {
		"type": "material", "skin": "smithing_iron_ore", "name": "Iron Ore", "s": 9999, "g": 1389, "exclusive": true
	},
	"goldore": {
		"type": "material", "skin": "smithing_gold_ore", "name": "Gold Ore", "s": 9999, "g": 2083, "exclusive": true
	},
	"mithrilore": {
		"type": "material", "skin": "smithing_mithril_ore", "name": "Mithril Ore", "s": 9999, "g": 2778, "exclusive": true
	},
	"adamantiteore": {
		"type": "material", "skin": "smithing_adamantite_ore", "name": "Adamantite Ore", "s": 9999, "g": 3472, "exclusive": true
	},
	"runiteore": {
		"type": "material", "skin": "smithing_runite_ore", "name": "Runite Ore", "s": 9999, "g": 4630, "exclusive": true
	},
	"copperbar": {
		"type": "material", "skin": "smithing_copper_bar", "name": "Copper Bar", "s": 9999, "g": 2084, "exclusive": true
	},
	"ironbar": {
		"type": "material", "skin": "smithing_iron_bar", "name": "Iron Bar", "s": 9999, "g": 2778, "exclusive": true
	},
	"goldbar": {
		"type": "material", "skin": "smithing_gold_bar", "name": "Gold Bar", "s": 9999, "g": 4166, "exclusive": true
	},
	"mithrilbar": {
		"type": "material", "skin": "smithing_mithril_bar", "name": "Mithril Bar", "s": 9999, "g": 5556, "exclusive": true
	},
	"adamantitebar": {
		"type": "material", "skin": "smithing_adamantite_bar", "name": "Adamantite Bar", "s": 9999, "g": 6944, "exclusive": true
	},
	"runitebar": {
		"type": "material", "skin": "smithing_runite_bar", "name": "Runite Bar", "s": 9999, "g": 9260, "exclusive": true
	},
	"bow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "bow",
		"tier": 1,
		"damage_type": "physical",
		"upgrade": {
			"range": 7.666666666666666,
			"damage": 17.96923076923077,
			"attacks_per_second": 0
		},
		"name": "Bow",
		"g": 16000,
		"cx": {
			"accent": "#AF2131"
		},
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 55,
		"projectile": "arrow",
		"progression": {
			"historical_rank": 1,
			"shared_rank": 1,
			"role": "progression",
			"requirement": 1,
			"reference_level": 1,
			"target_dps": 55,
			"full_sheet_hit_damage": 118,
			"attacks_per_second": 0.46625,
			"base_dps": 55.0175,
			"selected_effort": 0
		},
		"damage": 118,
		"attacks_per_second": 0.46625,
		"throw_range": 3
	},
	"pouchbow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "pouchbow",
		"tier": 0.2,
		"explosion": 10,
		"mp_reduction": -10,
		"projectile": "pouch",
		"damage_type": "physical",
		"upgrade": {
			"explosion": 2,
			"range": 7.133333333333333,
			"damage": 66.76923076923077,
			"attacks_per_second": 0
		},
		"name": "Poucher",
		"g": 24000,
		"cx": {
			"accent": "#9D7B1B"
		},
		"grades": [
			8,
			9,
			10,
			12
		],
		"range": 47,
		"progression": {
			"historical_rank": 5,
			"shared_rank": 4,
			"role": "progression",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 106.325012471,
			"full_sheet_hit_damage": 192,
			"attacks_per_second": 0.55375,
			"base_dps": 106.32,
			"selected_effort": 2500
		},
		"damage": 192,
		"attacks_per_second": 0.55375,
		"throw_range": 3,
		"base_crit": 10.6
	},
	"weaver": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "weaver",
		"tier": 1.75,
		"ability": "weave",
		"attr0": 4,
		"attr1": 1,
		"damage_type": "physical",
		"upgrade": {
			"attr0": 2,
			"attr1": 0.2,
			"range": 8.166666666666668,
			"damage": 219.8153846153846,
			"attacks_per_second": 0
		},
		"name": "Bow of the Weaver",
		"g": 36000,
		"cx": {
			"accent": "#AF2131"
		},
		"grades": [
			4,
			7,
			10,
			12
		],
		"range": 62.5,
		"projectile": "arrow",
		"progression": {
			"historical_rank": 13,
			"shared_rank": 10,
			"role": "progression",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 397.357073071,
			"full_sheet_hit_damage": 542,
			"attacks_per_second": 0.733125,
			"base_dps": 397.35375,
			"selected_effort": 1566256.20152
		},
		"damage": 542,
		"attacks_per_second": 0.733125,
		"throw_range": 555,
		"base_crit": 3
	},
	"crossbow": {
		"type": "weapon",
		"wtype": "crossbow",
		"skin": "crossbow",
		"tier": 2,
		"damage_type": "physical",
		"upgrade": {
			"range": 10.733333333333334,
			"damage": 103.81538461538462,
			"attacks_per_second": 0
		},
		"name": "Crossbow",
		"g": 480000,
		"projectile": "crossbowarrow",
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 101,
		"progression": {
			"historical_rank": 9,
			"shared_rank": 7,
			"role": "progression",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 205.545605036,
			"full_sheet_hit_damage": 325,
			"attacks_per_second": 0.632432432432,
			"base_dps": 205.540540541,
			"selected_effort": 273862.53753
		},
		"damage": 325,
		"attacks_per_second": 0.632432432432,
		"throw_range": 24,
		"base_crit": 28.2
	},
	"hbow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "hbow",
		"tier": 1.5,
		"range": 80,
		"apiercing": 40,
		"damage_type": "physical",
		"upgrade": {
			"apiercing": 5,
			"range": 8,
			"damage": 49.16923076923077,
			"attacks_per_second": 0
		},
		"name": "Hunting Bow",
		"g": 16000,
		"cx": {
			"accent": "#8B7FD6"
		},
		"grades": [
			5,
			8,
			10,
			12
		],
		"projectile": "arrow",
		"progression": {
			"historical_rank": 4,
			"shared_rank": 3,
			"role": "progression",
			"requirement": 20,
			"reference_level": 15,
			"target_dps": 85.3515065654,
			"full_sheet_hit_damage": 121,
			"attacks_per_second": 0.7053125,
			"base_dps": 85.3428125,
			"selected_effort": 1969.28097259
		},
		"damage": 121,
		"attacks_per_second": 0.7053125,
		"throw_range": 3,
		"base_crit": 11.4
	},
	"merry": {
		"set": "holidays",
		"type": "weapon",
		"wtype": "bow",
		"skin": "merry",
		"ability": "secondchance",
		"attr0": 10,
		"tier": 1.5,
		"damage_type": "physical",
		"upgrade": {
			"attr0": 2,
			"range": 8,
			"damage": 72.92307692307692,
			"attacks_per_second": 0
		},
		"name": "Bow of The Merry Ranger",
		"g": 124000,
		"grades": [
			0,
			8,
			10,
			12
		],
		"cx": {
			"accent": "#289E4D"
		},
		"range": 60,
		"projectile": "arrow",
		"progression": {
			"historical_rank": 6,
			"shared_rank": 5,
			"role": "progression",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 132.45235769,
			"full_sheet_hit_damage": 175,
			"attacks_per_second": 0.756875,
			"base_dps": 132.453125,
			"selected_effort": 5943.28703703
		},
		"damage": 175,
		"attacks_per_second": 0.756875,
		"throw_range": 69,
		"base_crit": 17.8
	},
	"cupid": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "cupid",
		"projectile": "cupid",
		"tier": 2.5,
		"range": 50,
		"damage_type": "heal",
		"upgrade": {
			"range": 8.666666666666668,
			"damage": 68.55384615384615,
			"hp": 96,
			"attacks_per_second": 0
		},
		"grades": [
			0,
			6,
			10,
			12
		],
		"name": "Cupid's Bow",
		"g": 90000,
		"a": true,
		"event": true,
		"cx": {
			"accent": "#DB2A86"
		},
		"progression": {
			"historical_rank": 10,
			"shared_rank": 7,
			"role": "sidegrade",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 205.545605036,
			"full_sheet_hit_damage": 173,
			"attacks_per_second": 1.18810810811,
			"base_dps": 205.542702703,
			"selected_effort": 391175.229927
		},
		"damage": 173,
		"attacks_per_second": 1.18810810811,
		"throw_range": 36,
		"hp": 480,
		"base_crit": 27.4
	},
	"firebow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "firebow",
		"skin_r": "firebow_r",
		"projectile": "firearrow",
		"tier": 2,
		"range": 45,
		"damage_type": "physical",
		"ability": "burn",
		"attr0": 2,
		"upgrade": {
			"attr0": 0.5,
			"range": 8.333333333333332,
			"damage": 40.184615384615384,
			"attacks_per_second": 0
		},
		"name": "Fire Bow",
		"explanation": "Rains fire upon the enemy",
		"g": 178000,
		"grades": [
			0,
			8,
			10,
			12
		],
		"a": true,
		"cx": {
			"accent": "#E34C25"
		},
		"progression": {
			"historical_rank": 3,
			"shared_rank": 2,
			"role": "sidegrade",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 68.5152016789,
			"full_sheet_hit_damage": 81,
			"attacks_per_second": 0.8459375,
			"base_dps": 68.5209375,
			"selected_effort": 1424.93979882
		},
		"damage": 81,
		"attacks_per_second": 0.8459375,
		"throw_range": 3,
		"base_crit": 10.2
	},
	"frostbow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "frostbow",
		"skin_r": "frostbow_r",
		"projectile": "frostarrow",
		"tier": 2,
		"damage_type": "physical",
		"ability": "freeze",
		"attr0": 2,
		"upgrade": {
			"attr0": 0.5,
			"range": 8.333333333333332,
			"damage": 66.64615384615385,
			"attacks_per_second": 0
		},
		"name": "Frost Bow",
		"explanation": "Let your enemy feel the cold",
		"g": 78000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"a": true,
		"cx": {
			"accent": "#2D9DE5"
		},
		"range": 65,
		"progression": {
			"historical_rank": 7,
			"shared_rank": 5,
			"role": "sidegrade",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 132.45235769,
			"full_sheet_hit_damage": 156,
			"attacks_per_second": 0.8490625,
			"base_dps": 132.45375,
			"selected_effort": 6620.86304571
		},
		"damage": 156,
		"attacks_per_second": 0.8490625,
		"throw_range": 174,
		"base_crit": 10.4
	},
	"t2bow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "t2bow",
		"tier": 2,
		"damage_type": "physical",
		"upgrade": {
			"range": 8.333333333333332,
			"damage": 40.184615384615384,
			"attacks_per_second": 0
		},
		"name": "Well-Crafted Bow",
		"explanation": "Crafted with the finest of materials",
		"g": 78000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"a": true,
		"cx": {
			"accent": "#CD3F3B"
		},
		"range": 65,
		"projectile": "arrow",
		"progression": {
			"historical_rank": 2,
			"shared_rank": 2,
			"role": "progression",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 68.5152016789,
			"full_sheet_hit_damage": 81,
			"attacks_per_second": 0.8459375,
			"base_dps": 68.5209375,
			"selected_effort": 152.381974249
		},
		"damage": 81,
		"attacks_per_second": 0.8459375,
		"throw_range": 3,
		"base_crit": 10.2
	},
	"harpybow": {
		"type": "weapon",
		"wtype": "bow",
		"tier": 3,
		"speed": 2,
		"evasion": 5,
		"skin": "harpybow",
		"damage_type": "physical",
		"upgrade": {
			"range": 9,
			"damage": 84.49230769230769,
			"attacks_per_second": 0
		},
		"name": "Harpy Bow",
		"explanation": "A bow decorated with exclusive Harpy feathers!",
		"g": 780000,
		"a": true,
		"cx": {
			"accent": "#DE6F22"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 75,
		"projectile": "arrow",
		"progression": {
			"historical_rank": 11,
			"shared_rank": 8,
			"role": "progression",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 256.054519696,
			"full_sheet_hit_damage": 191,
			"attacks_per_second": 1.340625,
			"base_dps": 256.059375,
			"selected_effort": 545705.09304
		},
		"damage": 191,
		"attacks_per_second": 1.340625,
		"throw_range": 195,
		"base_crit": 14.6
	},
	"t3bow": {
		"type": "weapon",
		"wtype": "bow",
		"tier": 3,
		"skin": "t3bow",
		"damage_type": "physical",
		"critdamage": 12,
		"upgrade": {
			"range": 9,
			"damage": 117.1076923076923,
			"attacks_per_second": 0
		},
		"name": "Artisan's Bow",
		"explanation": "Crafted by the finest of bowmasters",
		"g": 780000,
		"a": true,
		"cx": {
			"accent": "#DE6F22"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 75,
		"projectile": "arrow",
		"progression": {
			"historical_rank": 12,
			"shared_rank": 9,
			"role": "progression",
			"requirement": 80,
			"reference_level": 56,
			"target_dps": 318.975037414,
			"full_sheet_hit_damage": 216,
			"attacks_per_second": 1.47675675676,
			"base_dps": 318.979459459,
			"selected_effort": 1369312.68762
		},
		"damage": 216,
		"attacks_per_second": 1.47675675676,
		"throw_range": 51,
		"base_crit": 36
	},
	"bowofthedead": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "bowofthedead",
		"tier": 2.4,
		"crit": 1,
		"speed": -12,
		"range": 59,
		"damage_type": "physical",
		"upgrade": {
			"crit": 0.2,
			"range": 8.6,
			"damage": 73.25,
			"attacks_per_second": 0
		},
		"name": "Bow of the Dead",
		"explanation": "A weapon of death",
		"g": 228000,
		"a": true,
		"cx": {
			"accent": "#D87F0E"
		},
		"grades": [
			0,
			5,
			10,
			12
		],
		"projectile": "arrow",
		"progression": {
			"historical_rank": 8,
			"shared_rank": 6,
			"role": "progression",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 165,
			"full_sheet_hit_damage": 147,
			"attacks_per_second": 1.1225,
			"base_dps": 165.0075,
			"selected_effort": 13648.4955503
		},
		"damage": 147,
		"attacks_per_second": 1.1225,
		"throw_range": 123,
		"hp": -96,
		"base_crit": 17.4
	},
	"gbow": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "gbow",
		"projectile": "garrow",
		"tier": 2.5,
		"damage_type": "physical",
		"upgrade": {
			"range": 8.666666666666668,
			"damage": 185.04615384615386,
			"attacks_per_second": 0
		},
		"name": "Bow of the Feared Ranger",
		"g": 3200000,
		"grades": [
			0,
			0,
			10,
			12
		],
		"a": true,
		"cx": {
			"accent": "#DF6915",
			"border": 1
		},
		"range": 70,
		"progression": {
			"historical_rank": 15,
			"shared_rank": 11,
			"role": "progression",
			"requirement": 99,
			"reference_level": 70,
			"target_dps": 495,
			"full_sheet_hit_damage": 375,
			"attacks_per_second": 1.32,
			"base_dps": 495,
			"selected_effort": 54489049.6002
		},
		"damage": 375,
		"attacks_per_second": 1.32,
		"throw_range": 9,
		"base_crit": 51.4
	},
	"bow4": {
		"type": "weapon",
		"wtype": "bow",
		"skin": "bow4",
		"tier": 4,
		"damage_type": "physical",
		"upgrade": {
			"range": 9.666666666666668,
			"damage": 79.237554
		},
		"name": "T4 Bow",
		"g": 16000,
		"ignore": true,
		"cx": {
			"accent": "#E4B81D"
		},
		"grades": [
			0,
			0,
			8,
			10
		],
		"range": 85,
		"projectile": "arrow",
		"damage": 554.294,
		"attacks_per_second": 0.8397294594594595,
		"throw_range": 60,
		"mp": 300,
		"base_crit": 4
	},
	"spear": {
		"type": "weapon",
		"wtype": "spear",
		"tier": 1.25,
		"skin": "spear",
		"apiercing": 10,
		"damage_type": "physical",
		"upgrade": {
			"apiercing": 5,
			"range": 2,
			"damage": 42.46153846153846,
			"attacks_per_second": 0
		},
		"name": "Spear",
		"g": 72000,
		"a": 2,
		"grades": [
			3,
			8,
			10,
			12
		],
		"cx": {
			"accent": "#AE4731"
		},
		"range": 15.5,
		"progression": {
			"historical_rank": 2,
			"shared_rank": 2,
			"role": "progression",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 62.2865469808,
			"full_sheet_hit_damage": 92,
			"attacks_per_second": 0.6771875,
			"base_dps": 62.30125,
			"selected_effort": 152.381974249
		},
		"damage": 92,
		"attacks_per_second": 0.6771875,
		"throw_range": 93,
		"base_crit": 8.2
	},
	"spearofthedead": {
		"type": "weapon",
		"wtype": "spear",
		"tier": 2.4,
		"skin": "spearofthedead",
		"apiercing": 12,
		"damage_type": "physical",
		"upgrade": {
			"apiercing": 5,
			"range": 2,
			"damage": 54.276923076923076,
			"attacks_per_second": 0
		},
		"name": "Spear of the Dead",
		"explanation": "A deadly weapon",
		"g": 724000,
		"a": true,
		"cx": {
			"accent": "#D87F0E"
		},
		"grades": [
			0,
			5,
			10,
			12
		],
		"range": 17.8,
		"progression": {
			"historical_rank": 7,
			"shared_rank": 5,
			"role": "sidegrade",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 120.411234264,
			"full_sheet_hit_damage": 119,
			"attacks_per_second": 1.011875,
			"base_dps": 120.413125,
			"selected_effort": 25649.3730748
		},
		"damage": 119,
		"attacks_per_second": 1.011875,
		"throw_range": 132,
		"base_crit": 8.6,
		"pvp_damage_reduction": 13.043478260869556
	},
	"scythe": {
		"type": "weapon",
		"wtype": "scythe",
		"tier": 3,
		"skin": "scythe",
		"damage_type": "physical",
		"upgrade": {
			"range": 1,
			"damage": 165.1076923076923,
			"attacks_per_second": 0
		},
		"name": "Skeletor's Scythe",
		"g": 8600000,
		"cx": {
			"accent": "#5AAEED"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 13,
		"progression": {
			"historical_rank": 13,
			"shared_rank": 10,
			"role": "progression",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 361.233702792,
			"full_sheet_hit_damage": 357,
			"attacks_per_second": 1.011875,
			"base_dps": 361.239375,
			"selected_effort": 32430087.2093
		},
		"damage": 357,
		"attacks_per_second": 1.011875,
		"throw_range": 606,
		"base_crit": 0.8
	},
	"blade": {
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 1,
		"skin": "blade",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 15.076923076923077,
			"attacks_per_second": 0
		},
		"name": "Blade",
		"g": 8400,
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 5,
		"progression": {
			"historical_rank": 1,
			"shared_rank": 1,
			"role": "progression",
			"requirement": 1,
			"reference_level": 1,
			"target_dps": 50,
			"full_sheet_hit_damage": 78,
			"attacks_per_second": 0.64125,
			"base_dps": 50.0175,
			"selected_effort": 0
		},
		"damage": 78,
		"attacks_per_second": 0.64125,
		"throw_range": 45,
		"base_crit": 10
	},
	"sword": {
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 2.5,
		"skin": "sword",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 66.52307692307693,
			"attacks_per_second": 0
		},
		"name": "Short Sword",
		"g": 48000,
		"cx": {
			"accent": "#CC5A10"
		},
		"grades": [
			0,
			4,
			10,
			12
		],
		"range": 8,
		"progression": {
			"historical_rank": 9,
			"shared_rank": 7,
			"role": "progression",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 186.859640942,
			"full_sheet_hit_damage": 169,
			"attacks_per_second": 1.105625,
			"base_dps": 186.850625,
			"selected_effort": 54772.507506
		},
		"damage": 169,
		"attacks_per_second": 1.105625,
		"throw_range": 129,
		"base_crit": 19.6
	},
	"swifty": {
		"type": "weapon",
		"wtype": "sword",
		"tier": 1.75,
		"skin": "swifty",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 63.44615384615385,
			"attacks_per_second": 0
		},
		"name": "Swifty",
		"g": 48000,
		"cx": {
			"accent": "#CC54B2"
		},
		"grades": [
			4,
			7,
			10,
			12
		],
		"range": 7.25,
		"progression": {
			"historical_rank": 6,
			"shared_rank": 5,
			"role": "progression",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 120.411234264,
			"full_sheet_hit_damage": 152,
			"attacks_per_second": 0.7921875,
			"base_dps": 120.4125,
			"selected_effort": 8355.31708972
		},
		"damage": 152,
		"attacks_per_second": 0.7921875,
		"throw_range": 258,
		"base_crit": 4.8
	},
	"fsword": {
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 2,
		"skin": "fsword",
		"skin_r": "fsword_r",
		"damage_type": "physical",
		"ability": "freeze",
		"attr0": 0.2,
		"upgrade": {
			"attr0": 0.1,
			"range": 1.5,
			"damage": 38.83076923076923,
			"attacks_per_second": 0
		},
		"name": "Frozen Sword",
		"g": 72000,
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 7,
		"progression": {
			"historical_rank": 4,
			"shared_rank": 3,
			"role": "progression",
			"requirement": 20,
			"reference_level": 15,
			"target_dps": 77.5922786958,
			"full_sheet_hit_damage": 86,
			"attacks_per_second": 0.9021875,
			"base_dps": 77.588125,
			"selected_effort": 4358.35314159
		},
		"damage": 86,
		"attacks_per_second": 0.9021875,
		"throw_range": 75,
		"base_crit": 11.4
	},
	"rapier": {
		"type": "weapon",
		"wtype": "rapier",
		"tier": 2,
		"skin": "rapier",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 106.70769230769231,
			"attacks_per_second": 0
		},
		"name": "Rapier",
		"g": 84000,
		"cx": {
			"accent": "#5085B0"
		},
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 7,
		"progression": {
			"historical_rank": 9,
			"shared_rank": 9,
			"role": "progression",
			"requirement": 80,
			"reference_level": 56,
			"target_dps": 318.975037414,
			"full_sheet_hit_damage": 190,
			"attacks_per_second": 1.67875,
			"base_dps": 318.9625,
			"selected_effort": 547725.075063
		},
		"damage": 190,
		"attacks_per_second": 1.67875,
		"throw_range": 237,
		"base_crit": 19.6
	},
	"basher": {
		"type": "weapon",
		"wtype": "basher",
		"tier": 2,
		"skin": "basher",
		"damage_type": "physical",
		"armor": 20,
		"stun": 0.5,
		"upgrade": {
			"stun": 0.5,
			"armor": 4,
			"speed": 1,
			"range": 1,
			"damage": 51.2,
			"attacks_per_second": 0
		},
		"name": "Basher",
		"g": 72000,
		"a": true,
		"grades": [
			0,
			7,
			10,
			12
		],
		"cx": {
			"accent": "#5085B0",
			"large": true
		},
		"range": 6,
		"progression": {
			"historical_rank": 8,
			"shared_rank": 8,
			"role": "progression",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 209.499152478,
			"full_sheet_hit_damage": 225,
			"attacks_per_second": 0.931081081081,
			"base_dps": 209.493243243,
			"selected_effort": 54772.507506
		},
		"damage": 225,
		"attacks_per_second": 0.931081081081,
		"throw_range": 150,
		"base_crit": 24.2
	},
	"bataxe": {
		"type": "weapon",
		"wtype": "axe",
		"tier": 2.25,
		"skin": "bataxe",
		"damage_type": "physical",
		"reflection": 4,
		"upgrade": {
			"range": 1,
			"damage": 147.3846153846154,
			"attacks_per_second": 0
		},
		"name": "Ghastly Battle Axe",
		"g": 124000,
		"a": true,
		"grades": [
			0,
			6,
			10,
			12
		],
		"delia": "Now you see me, now you see the floor",
		"cx": {
			"accent": "#DF6915",
			"lightborder": true,
			"large": true
		},
		"range": 8.75,
		"progression": {
			"historical_rank": 12,
			"shared_rank": 9,
			"role": "progression",
			"requirement": 80,
			"reference_level": 56,
			"target_dps": 289.97730674,
			"full_sheet_hit_damage": 295,
			"attacks_per_second": 0.982972972973,
			"base_dps": 289.977027027,
			"selected_effort": 2362614.88927
		},
		"damage": 295,
		"attacks_per_second": 0.982972972973,
		"throw_range": 195,
		"base_crit": 26
	},
	"axe3": {
		"type": "weapon",
		"wtype": "axe",
		"tier": 3,
		"skin": "axe3",
		"damage_type": "physical",
		"reflection": 4,
		"upgrade": {
			"range": 1,
			"damage": 85.75555555555556
		},
		"name": "T3 Axe",
		"g": 124000,
		"a": true,
		"cx": {
			"accent": "#DF6915",
			"lightborder": true,
			"large": true
		},
		"ignore": true,
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 11,
		"damage": 432.6666666666667,
		"attacks_per_second": 0.5845950000000001,
		"throw_range": 54,
		"mp": 270,
		"base_crit": 3.6
	},
	"fireblade": {
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 2,
		"skin": "fireblade",
		"skin_r": "fireblade_r",
		"damage_type": "physical",
		"ability": "burn",
		"attr0": 1.5,
		"upgrade": {
			"attr0": 0.5,
			"range": 1.5,
			"damage": 36.55384615384615,
			"attacks_per_second": 0
		},
		"name": "Fiery Blade",
		"g": 96000,
		"a": true,
		"grades": [
			0,
			8,
			10,
			12
		],
		"cx": {
			"accent": "#E34C25"
		},
		"range": 7,
		"progression": {
			"historical_rank": 3,
			"shared_rank": 2,
			"role": "sidegrade",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 62.2865469808,
			"full_sheet_hit_damage": 73,
			"attacks_per_second": 0.853125,
			"base_dps": 62.278125,
			"selected_effort": 1424.93979882
		},
		"damage": 73,
		"attacks_per_second": 0.853125,
		"throw_range": 123,
		"base_crit": 6.4
	},
	"swordofthedead": {
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 2.5,
		"skin": "swordofthedead",
		"damage_type": "physical",
		"resistance": 20,
		"upgrade": {
			"resistance": 2.5,
			"range": 1.5,
			"damage": 66.52307692307693,
			"attacks_per_second": 0
		},
		"name": "Sword of the Dead",
		"g": 224000,
		"a": true,
		"cx": {
			"accent": "#D87F0E"
		},
		"grades": [
			0,
			4,
			10,
			12
		],
		"range": 8,
		"progression": {
			"historical_rank": 10,
			"shared_rank": 7,
			"role": "sidegrade",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 186.859640942,
			"full_sheet_hit_damage": 169,
			"attacks_per_second": 1.105625,
			"base_dps": 186.850625,
			"selected_effort": 67621.0030563
		},
		"damage": 169,
		"attacks_per_second": 1.105625,
		"throw_range": 129,
		"hp": -576,
		"base_crit": 19.6
	},
	"woodensword": {
		"type": "weapon",
		"wtype": "sword",
		"tier": 2,
		"skin": "woodensword",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 99.13846153846154,
			"attacks_per_second": 0.0031730769230769204,
			"base_crit": 0.4
		},
		"name": "Wooden Sword",
		"g": 224000,
		"a": true,
		"cx": {
			"accent": "#155E0C"
		},
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 8,
		"progression": {
			"historical_rank": 11,
			"shared_rank": 8,
			"role": "progression",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 232.776836087,
			"full_sheet_hit_damage": 259,
			"attacks_per_second": 0.89875,
			"base_dps": 232.77625,
			"selected_effort": 646580.656062
		},
		"damage": 259,
		"attacks_per_second": 0.89875,
		"throw_range": 270,
		"base_crit": 7.2
	},
	"heartwood": {
		"type": "weapon",
		"wtype": "sword",
		"tier": 3.5,
		"skin": "heartwood",
		"damage_type": "physical",
		"ability": "tangle",
		"speed": 4,
		"upgrade": {
			"range": 1.5,
			"damage": 116.24615384615385,
			"attacks_per_second": 0.005420478170461538,
			"base_crit": 0.8
		},
		"name": "Heartwood",
		"explanation": "One with nature",
		"g": 18700000,
		"a": true,
		"cx": {
			"accent": "#155E0C"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 12.5,
		"progression": {
			"historical_rank": 14,
			"shared_rank": 10,
			"role": "sidegrade",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 361.233702792,
			"full_sheet_hit_damage": 298,
			"attacks_per_second": 1.2121875,
			"base_dps": 361.231875,
			"selected_effort": 2728603202.81
		},
		"damage": 298,
		"attacks_per_second": 1.2121875,
		"throw_range": 405,
		"base_crit": 16.2
	},
	"glolipop": {
		"type": "weapon",
		"wtype": "mace",
		"tier": 0,
		"explosion": 20,
		"skin": "glolipop",
		"ability": "sugarrush",
		"attr0": 0.25,
		"damage_type": "physical",
		"upgrade": {
			"explosion": 2,
			"range": 1,
			"damage": 29.476923076923075,
			"attacks_per_second": 0
		},
		"name": "Lolipop Mace",
		"g": 16000,
		"cx": {
			"accent": "#64B553"
		},
		"grades": [
			8,
			9,
			10,
			12
		],
		"range": 4,
		"progression": {
			"historical_rank": 5,
			"shared_rank": 5,
			"role": "progression",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 108.370110838,
			"full_sheet_hit_damage": 174,
			"attacks_per_second": 0.6228125,
			"base_dps": 108.369375,
			"selected_effort": 10196.5759824
		},
		"damage": 174,
		"attacks_per_second": 0.6228125,
		"throw_range": 90,
		"mp": 15,
		"base_crit": 16.4
	},
	"ololipop": {
		"type": "weapon",
		"wtype": "mace",
		"tier": 0,
		"explosion": 20,
		"skin": "ololipop",
		"damage_type": "physical",
		"ability": "sugarrush",
		"attr0": 0.25,
		"upgrade": {
			"explosion": 2,
			"range": 1,
			"damage": 15.692307692307692,
			"attacks_per_second": 0
		},
		"name": "Lolipop Mace",
		"g": 16000,
		"cx": {
			"accent": "#DB763B"
		},
		"grades": [
			8,
			9,
			10,
			12
		],
		"range": 4,
		"progression": {
			"historical_rank": 3,
			"shared_rank": 3,
			"role": "progression",
			"requirement": 20,
			"reference_level": 15,
			"target_dps": 69.8330508262,
			"full_sheet_hit_damage": 124,
			"attacks_per_second": 0.563125,
			"base_dps": 69.8275,
			"selected_effort": 5225.27029459
		},
		"damage": 124,
		"attacks_per_second": 0.563125,
		"throw_range": 63,
		"base_crit": 12.8
	},
	"mace": {
		"type": "weapon",
		"wtype": "mace",
		"tier": 1,
		"skin": "mace",
		"damage_type": "physical",
		"upgrade": {
			"range": 1,
			"damage": 7.076923076923077,
			"attacks_per_second": 0
		},
		"name": "Mace",
		"g": 3700,
		"cx": {
			"accent": "#AF2131"
		},
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 5,
		"progression": {
			"historical_rank": 1,
			"shared_rank": 1,
			"role": "progression",
			"requirement": 1,
			"reference_level": 1,
			"target_dps": 45,
			"full_sheet_hit_damage": 94,
			"attacks_per_second": 0.47875,
			"base_dps": 45.0025,
			"selected_effort": 0
		},
		"damage": 94,
		"attacks_per_second": 0.47875,
		"throw_range": 159,
		"base_crit": 2
	},
	"xmace": {
		"set": "holidays",
		"type": "weapon",
		"wtype": "mace",
		"tier": 2.25,
		"stun": 2,
		"skin": "xmace",
		"damage_type": "physical",
		"upgrade": {
			"range": 1,
			"damage": 61.96923076923077,
			"attacks_per_second": 0
		},
		"name": "Merry Mace",
		"g": 37000,
		"cx": {
			"accent": "#AF2131"
		},
		"grades": [
			0,
			6,
			10,
			12
		],
		"range": 6.25,
		"progression": {
			"historical_rank": 9,
			"shared_rank": 9,
			"role": "progression",
			"requirement": 80,
			"reference_level": 56,
			"target_dps": 260.979576066,
			"full_sheet_hit_damage": 256,
			"attacks_per_second": 1.01945945946,
			"base_dps": 260.981621622,
			"selected_effort": 782331.387756
		},
		"damage": 256,
		"attacks_per_second": 1.01945945946,
		"throw_range": 183,
		"base_crit": 27.2
	},
	"wbasher": {
		"type": "weapon",
		"wtype": "basher",
		"tier": 1,
		"skin": "wbasher",
		"damage_type": "physical",
		"upgrade": {
			"range": 1,
			"damage": 6.2153846153846155,
			"attacks_per_second": 0
		},
		"name": "Wooden Basher",
		"g": 4900,
		"cx": {
			"accent": "#AF2131",
			"large": true
		},
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 3,
		"progression": {
			"historical_rank": 2,
			"shared_rank": 2,
			"role": "progression",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 56.0578922827,
			"full_sheet_hit_damage": 99,
			"attacks_per_second": 0.56625,
			"base_dps": 56.05875,
			"selected_effort": 40.8333333333
		},
		"damage": 99,
		"attacks_per_second": 0.56625,
		"throw_range": 24,
		"base_crit": 13.2
	},
	"hammer": {
		"type": "weapon",
		"wtype": "mace",
		"tier": 3,
		"skin": "hammer",
		"damage_type": "physical",
		"upgrade": {
			"range": 1,
			"damage": 34.83076923076923,
			"attacks_per_second": 0
		},
		"name": "Hammer",
		"g": 960000,
		"cx": {
			"accent": "#7A44A2"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 7,
		"progression": {
			"historical_rank": 7,
			"shared_rank": 7,
			"role": "progression",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 168.173676848,
			"full_sheet_hit_damage": 142,
			"attacks_per_second": 1.184375,
			"base_dps": 168.18125,
			"selected_effort": 18285.8369099
		},
		"damage": 142,
		"attacks_per_second": 1.184375,
		"throw_range": 201,
		"mp": 15,
		"base_crit": 15.6
	},
	"vhammer": {
		"set": "vampires",
		"type": "weapon",
		"wtype": "mace",
		"tier": 3,
		"lifesteal": 3,
		"explosion": 10,
		"skin": "vhammer",
		"damage_type": "physical",
		"upgrade": {
			"explosion": 2,
			"range": 1,
			"damage": 16.123076923076923,
			"attacks_per_second": 0
		},
		"name": "Vampiric Hammer",
		"g": 9600000,
		"cx": {
			"accent": "#B91A6A"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 7,
		"progression": {
			"historical_rank": 10,
			"shared_rank": 10,
			"role": "progression",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 325.110332513,
			"full_sheet_hit_damage": 239,
			"attacks_per_second": 1.36027027027,
			"base_dps": 325.104594595,
			"selected_effort": 4859508.60562
		},
		"damage": 239,
		"attacks_per_second": 1.36027027027,
		"throw_range": 18,
		"base_crit": 44
	},
	"vstaff": {
		"set": "vampires",
		"type": "weapon",
		"wtype": "staff",
		"tier": 3.25,
		"speed": 8,
		"armor": 120,
		"skin": "vstaff",
		"damage_type": "magical",
		"upgrade": {
			"range": 4.125,
			"damage": 89.78461538461538,
			"attacks_per_second": 0
		},
		"name": "Vampiric Staff",
		"g": 9600000,
		"cx": {
			"accent": "#B91A6A"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 63.5,
		"progression": {
			"historical_rank": 13,
			"shared_rank": 9,
			"role": "progression",
			"requirement": 80,
			"reference_level": 56,
			"target_dps": 318.975037414,
			"full_sheet_hit_damage": 302,
			"attacks_per_second": 1.05621,
			"base_dps": 318.97542,
			"selected_effort": 6659755.80498
		},
		"damage": 302,
		"attacks_per_second": 1.05621,
		"mp": 915
	},
	"vdagger": {
		"set": "vampires",
		"type": "weapon",
		"wtype": "dagger",
		"tier": 3.25,
		"lifesteal": 5,
		"skin": "vdagger",
		"damage_type": "physical",
		"upgrade": {
			"range": 2,
			"damage": 140.55384615384617,
			"attacks_per_second": 0
		},
		"name": "Vampiric Dagger",
		"g": 9600000,
		"cx": {
			"accent": "#B91A6A",
			"scale": 0.5,
			"extension": true
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 7.25,
		"progression": {
			"historical_rank": 10,
			"shared_rank": 10,
			"role": "progression",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 397.357073071,
			"full_sheet_hit_damage": 265,
			"attacks_per_second": 1.49945945946,
			"base_dps": 397.356756757,
			"selected_effort": 5075823.91936
		},
		"damage": 265,
		"attacks_per_second": 1.49945945946,
		"throw_range": 255,
		"base_crit": 27.2
	},
	"vsword": {
		"set": "vampires",
		"type": "weapon",
		"wtype": "sword",
		"tier": 3.25,
		"lifesteal": 5,
		"speed": 1,
		"skin": "vsword",
		"damage_type": "physical",
		"upgrade": {
			"range": 1.5,
			"damage": 62.95384615384615,
			"attacks_per_second": 0
		},
		"name": "Vampiric Sword",
		"g": 9600000,
		"cx": {
			"accent": "#B91A6A"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 11.75,
		"progression": {
			"historical_rank": 15,
			"shared_rank": 11,
			"role": "progression",
			"requirement": 99,
			"reference_level": 70,
			"target_dps": 450,
			"full_sheet_hit_damage": 305,
			"attacks_per_second": 1.47540540541,
			"base_dps": 449.998648649,
			"selected_effort": 8955060372.72
		},
		"damage": 305,
		"attacks_per_second": 1.47540540541,
		"throw_range": 6,
		"base_crit": 51.6
	},
	"maceofthedead": {
		"type": "weapon",
		"tier": 2.4,
		"wtype": "mace",
		"skin": "maceofthedead",
		"speed": -3,
		"damage_type": "physical",
		"upgrade": {
			"range": 1,
			"damage": 10.461538461538462,
			"attacks_per_second": 0
		},
		"name": "Mace of the Dead",
		"g": 224000,
		"a": true,
		"cx": {
			"accent": "#D87F0E"
		},
		"grades": [
			0,
			5,
			10,
			12
		],
		"range": 6.4,
		"progression": {
			"historical_rank": 6,
			"shared_rank": 6,
			"role": "progression",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 135,
			"full_sheet_hit_damage": 125,
			"attacks_per_second": 1.08,
			"base_dps": 135,
			"selected_effort": 14689.3288836
		},
		"damage": 125,
		"attacks_per_second": 1.08,
		"throw_range": 30,
		"hp": -384,
		"base_crit": 24
	},
	"pmaceofthedead": {
		"type": "weapon",
		"tier": 3,
		"wtype": "pmace",
		"skin": "pmaceofthedead",
		"speed": -3,
		"damage_type": "magical",
		"upgrade": {
			"range": 6,
			"damage": 34.83076923076923,
			"attacks_per_second": 0
		},
		"name": "Hand of the Dead",
		"g": 824000,
		"a": true,
		"cx": {
			"accent": "#D87F0E"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 15,
		"progression": {
			"historical_rank": 7,
			"shared_rank": 7,
			"role": "sidegrade",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 168.173676848,
			"full_sheet_hit_damage": 142,
			"attacks_per_second": 1.184375,
			"base_dps": 168.18125,
			"selected_effort": 18878.9056795
		},
		"damage": 142,
		"attacks_per_second": 1.184375,
		"throw_range": 201,
		"mp": 15,
		"base_crit": 15.6
	},
	"carrotsword": {
		"set": "bunny",
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 2,
		"skin": "carrotsword",
		"skin_c": "carrotsword_c",
		"range": 3,
		"charisma": -20,
		"damage_type": "physical",
		"upgrade": {
			"range": 1.25,
			"damage": 64,
			"attacks_per_second": 0
		},
		"name": "Carrot Sword",
		"g": 92000,
		"a": true,
		"grades": [
			0,
			7,
			10,
			12
		],
		"cx": {
			"accent": "#E9711A"
		},
		"progression": {
			"historical_rank": 8,
			"shared_rank": 6,
			"role": "progression",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 150,
			"full_sheet_hit_damage": 165,
			"attacks_per_second": 0.9090625,
			"base_dps": 149.9953125,
			"selected_effort": 39120.7360545
		},
		"damage": 165,
		"attacks_per_second": 0.9090625,
		"throw_range": 195,
		"base_crit": 9.8
	},
	"candycanesword": {
		"set": "holidays",
		"type": "weapon",
		"wtype": "short_sword",
		"tier": 2,
		"range": 5,
		"skin": "candycanesword",
		"damage_type": "physical",
		"ability": "sugarrush",
		"attr0": 0.25,
		"upgrade": {
			"range": 1,
			"damage": 47.56923076923077,
			"attacks_per_second": 0
		},
		"name": "Candy Cane Sword",
		"g": 72000,
		"a": true,
		"grades": [
			0,
			8,
			10,
			12
		],
		"progression": {
			"historical_rank": 5,
			"shared_rank": 4,
			"role": "progression",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 96.6591022466,
			"full_sheet_hit_damage": 115,
			"attacks_per_second": 0.840625,
			"base_dps": 96.671875,
			"selected_effort": 5033.67092033
		},
		"damage": 115,
		"attacks_per_second": 0.840625,
		"throw_range": 3,
		"base_crit": 4.2
	},
	"pinkie": {
		"set": "bunny",
		"type": "weapon",
		"wtype": "wand",
		"tier": 1.75,
		"skin": "pinkie",
		"skin_r": "pinkie_r",
		"charisma": -100,
		"speed": 2,
		"damage_type": "magical",
		"upgrade": {
			"range": 6.25,
			"damage": 46.46153846153846,
			"attacks_per_second": 0
		},
		"name": "Pink Wand",
		"grades": [
			0,
			7,
			10,
			12
		],
		"g": 124000,
		"cx": {
			"accent": "#DF33EC",
			"scale": 0.5,
			"extension": true
		},
		"projectile": "pinky",
		"range": 33.75,
		"progression": {
			"historical_rank": 16,
			"shared_rank": 11,
			"role": "progression",
			"requirement": 99,
			"reference_level": 70,
			"target_dps": 495,
			"full_sheet_hit_damage": 413,
			"attacks_per_second": 1.19828,
			"base_dps": 494.88964,
			"selected_effort": 8939157232.81
		},
		"damage": 413,
		"attacks_per_second": 1.19828,
		"mp": 510
	},
	"wand": {
		"type": "weapon",
		"wtype": "wand",
		"tier": 1,
		"skin": "wand",
		"damage_type": "magical",
		"upgrade": {
			"range": 6,
			"damage": 14.892307692307693,
			"attacks_per_second": 0
		},
		"name": "Wand",
		"g": 48600,
		"cx": {
			"accent": "#EA6238",
			"scale": 0.5,
			"extension": true
		},
		"projectile": "wandy",
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 30,
		"progression": {
			"historical_rank": 2,
			"shared_rank": 2,
			"role": "progression",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 68.5152016789,
			"full_sheet_hit_damage": 70,
			"attacks_per_second": 0.97872,
			"base_dps": 68.5104,
			"selected_effort": 405
		},
		"damage": 70,
		"attacks_per_second": 0.97872,
		"mp": 465
	},
	"broom": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 0,
		"speed": 2,
		"evasion": 5,
		"skin": "broom",
		"damage_type": "magical",
		"upgrade": {
			"speed": 1,
			"evasion": 1,
			"range": 2.5,
			"damage": 238.52307692307693,
			"attacks_per_second": 0
		},
		"name": "Broom",
		"g": 128,
		"cx": {
			"accent": "#7B68A5"
		},
		"grades": [
			8,
			9,
			10,
			12
		],
		"range": 44,
		"progression": {
			"historical_rank": 11,
			"shared_rank": 8,
			"role": "progression",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 256.054519696,
			"full_sheet_hit_damage": 639,
			"attacks_per_second": 0.40071,
			"base_dps": 256.05369,
			"selected_effort": 147234.916666
		},
		"damage": 639,
		"attacks_per_second": 0.40071,
		"mp": 2355
	},
	"staff": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 1,
		"skin": "staff",
		"damage_type": "magical",
		"upgrade": {
			"range": 3,
			"damage": 0,
			"attacks_per_second": 0
		},
		"name": "Staff",
		"g": 12400,
		"cx": {
			"accent": "#AF2131"
		},
		"grades": [
			7,
			9,
			10,
			12
		],
		"range": 50,
		"progression": {
			"historical_rank": 1,
			"shared_rank": 1,
			"role": "progression",
			"requirement": 1,
			"reference_level": 1,
			"target_dps": 55,
			"full_sheet_hit_damage": 148,
			"attacks_per_second": 0.371665,
			"base_dps": 55.00642,
			"selected_effort": 0
		},
		"damage": 148,
		"attacks_per_second": 0.371665,
		"mp": 15
	},
	"gstaff": {
		"type": "weapon",
		"wtype": "great_staff",
		"projectile": "bigmagic",
		"tier": 3,
		"blast": 40,
		"skin": "blaster",
		"damage_type": "magical",
		"upgrade": {
			"blast": 5,
			"range": 5,
			"damage": 150.03076923076924,
			"attacks_per_second": 0
		},
		"name": "Blaster",
		"explanation": "[Warning] Highly volatile - might lose its power suddenly!",
		"g": 1240000,
		"cx": {
			"accent": "#AF2131"
		},
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 86,
		"progression": {
			"historical_rank": 15,
			"shared_rank": 10,
			"role": "sidegrade",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 397.357073071,
			"full_sheet_hit_damage": 424,
			"attacks_per_second": 0.93717,
			"base_dps": 397.36008,
			"selected_effort": 2755353024.59
		},
		"damage": 424,
		"attacks_per_second": 0.93717,
		"mp": 1440
	},
	"sparkstaff": {
		"type": "weapon",
		"wtype": "great_staff",
		"projectile": "magic",
		"tier": 2.5,
		"blast": 30,
		"skin": "sparkstaff",
		"damage_type": "magical",
		"upgrade": {
			"blast": 5,
			"range": 4.5,
			"damage": 28.553846153846155,
			"attacks_per_second": 0
		},
		"name": "Spark Staff",
		"g": 224000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"cx": {
			"accent": "#201DAD"
		},
		"range": 82,
		"progression": {
			"historical_rank": 12,
			"shared_rank": 8,
			"role": "sidegrade",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 256.054519696,
			"full_sheet_hit_damage": 362,
			"attacks_per_second": 0.70735,
			"base_dps": 256.0607,
			"selected_effort": 1301924.40666
		},
		"damage": 362,
		"attacks_per_second": 0.70735,
		"mp": 180
	},
	"staff2": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 2,
		"skin": "staff",
		"damage_type": "magical",
		"upgrade": {
			"range": 3.5,
			"damage": 29.07857142857143
		},
		"name": "T2 Staff",
		"g": 12400,
		"cx": {
			"accent": "#AF2131"
		},
		"ignore": true,
		"grades": [
			0,
			7,
			10,
			12
		],
		"range": 56,
		"damage": 252.57142857142858,
		"attacks_per_second": 0.30905790714995024,
		"throw_range": 30,
		"mp": 210,
		"base_crit": 2.2
	},
	"staff3": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 3,
		"skin": "staff",
		"damage_type": "magical",
		"upgrade": {
			"range": 4,
			"damage": 59.477238888888884
		},
		"name": "T3 Staff",
		"g": 12400,
		"cx": {
			"accent": "#AF2131"
		},
		"ignore": true,
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 62,
		"damage": 519.036111111111,
		"attacks_per_second": 0.674125743310208,
		"throw_range": 54,
		"mp": 270,
		"base_crit": 3.6
	},
	"staff4": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 4,
		"skin": "staff",
		"damage_type": "magical",
		"upgrade": {
			"range": 4.5,
			"damage": 118.9544475
		},
		"name": "T4 Staff",
		"g": 12400,
		"cx": {
			"accent": "#AF2131"
		},
		"ignore": true,
		"grades": [
			0,
			0,
			8,
			10
		],
		"range": 68,
		"damage": 1099.219,
		"attacks_per_second": 0.7189882673267327,
		"throw_range": 60,
		"mp": 300,
		"base_crit": 4
	},
	"slimestaff": {
		"class": [
			"priest"
		],
		"type": "weapon",
		"wtype": "staff",
		"tier": 1.5,
		"skin": "slimestaff",
		"speed": -5,
		"damage_type": "magical",
		"upgrade": {
			"range": 3.25,
			"damage": 14.4,
			"attacks_per_second": 0,
			"base_crit": 0.4
		},
		"name": "Slime Staff",
		"g": 16400,
		"cx": {
			"accent": "#48A763"
		},
		"grades": [
			5,
			8,
			10,
			12
		],
		"range": 53,
		"progression": {
			"historical_rank": 3,
			"shared_rank": 2,
			"role": "sidegrade",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 68.5152016789,
			"full_sheet_hit_damage": 133,
			"attacks_per_second": 0.5151,
			"base_dps": 68.5083,
			"selected_effort": 789.697581691
		},
		"damage": 133,
		"attacks_per_second": 0.5151,
		"mp": 180
	},
	"mushroomstaff": {
		"class": [
			"mage"
		],
		"type": "weapon",
		"wtype": "staff",
		"tier": 1.25,
		"skin": "mushroomstaff",
		"rpiercing": 40,
		"damage_type": "magical",
		"upgrade": {
			"range": 3.125,
			"damage": 67.6923076923077,
			"attacks_per_second": 0
		},
		"name": "Mushroom Staff",
		"g": 16400,
		"cx": {
			"accent": "#D34C57"
		},
		"grades": [
			5,
			8,
			10,
			12
		],
		"range": 51.5,
		"progression": {
			"historical_rank": 5,
			"shared_rank": 4,
			"role": "progression",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 106.325012471,
			"full_sheet_hit_damage": 238,
			"attacks_per_second": 0.44677,
			"base_dps": 106.33126,
			"selected_effort": 3285.98054529
		},
		"damage": 238,
		"attacks_per_second": 0.44677,
		"mp": 1050
	},
	"firestaff": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 2,
		"skin": "firestaff",
		"skin_r": "firestaff_r",
		"projectile": "fireball",
		"damage_type": "magical",
		"ability": "burn",
		"attr0": 2,
		"upgrade": {
			"attr0": 0.5,
			"range": 3.5,
			"damage": 22.153846153846153,
			"attacks_per_second": 0
		},
		"name": "Fiery Staff",
		"g": 189000,
		"a": true,
		"grades": [
			0,
			8,
			10,
			12
		],
		"cx": {
			"accent": "#D3001E"
		},
		"range": 56,
		"progression": {
			"historical_rank": 4,
			"shared_rank": 3,
			"role": "progression",
			"requirement": 20,
			"reference_level": 15,
			"target_dps": 85.3515065654,
			"full_sheet_hit_damage": 131,
			"attacks_per_second": 0.65152,
			"base_dps": 85.34912,
			"selected_effort": 1424.93979882
		},
		"damage": 131,
		"attacks_per_second": 0.65152,
		"mp": 420
	},
	"ornamentstaff": {
		"set": "holidays",
		"type": "weapon",
		"wtype": "staff",
		"tier": 2,
		"skin": "ornamentstaff",
		"mp_cost": -40,
		"awesomeness": 99,
		"damage_type": "magical",
		"upgrade": {
			"awesomeness": 0.1,
			"range": 3.5,
			"damage": 29.6,
			"attacks_per_second": 0
		},
		"name": "Ornament Staff",
		"g": 120000,
		"a": true,
		"grades": [
			0,
			7,
			10,
			12
		],
		"cx": {
			"accent": "#0B5818"
		},
		"range": 56,
		"progression": {
			"historical_rank": 8,
			"shared_rank": 6,
			"role": "progression",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 165,
			"full_sheet_hit_damage": 254,
			"attacks_per_second": 0.6496,
			"base_dps": 164.9984,
			"selected_effort": 5033.67092033
		},
		"damage": 254,
		"attacks_per_second": 0.6496,
		"mp": 315
	},
	"staffofthedead": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 2.5,
		"skin": "staffofthedead",
		"speed": -6,
		"damage_type": "magical",
		"upgrade": {
			"range": 3.75,
			"damage": 25.29230769230769,
			"attacks_per_second": 0
		},
		"name": "Staff of the Dead",
		"g": 224000,
		"a": true,
		"grades": [
			0,
			6,
			10,
			12
		],
		"cx": {
			"accent": "#D87F0E"
		},
		"range": 59,
		"progression": {
			"historical_rank": 9,
			"shared_rank": 6,
			"role": "sidegrade",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 165,
			"full_sheet_hit_damage": 203,
			"attacks_per_second": 0.8128,
			"base_dps": 164.9984,
			"selected_effort": 13648.4955503
		},
		"damage": 203,
		"attacks_per_second": 0.8128,
		"mp": 345
	},
	"froststaff": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 2,
		"skin": "froststaff",
		"skin_r": "froststaff_r",
		"projectile": "frostball",
		"damage_type": "magical",
		"ability": "freeze",
		"attr0": 4,
		"upgrade": {
			"attr0": 1.25,
			"range": 3.5,
			"damage": 30.153846153846153,
			"mp": 3,
			"attacks_per_second": 0.000059076923076927505
		},
		"name": "Frost Staff",
		"g": 289000,
		"a": true,
		"grades": [
			0,
			8,
			10,
			12
		],
		"range": 56,
		"progression": {
			"historical_rank": 7,
			"shared_rank": 5,
			"role": "progression",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 132.45235769,
			"full_sheet_hit_damage": 204,
			"attacks_per_second": 0.64928,
			"base_dps": 132.45312,
			"selected_effort": 4358.35314159
		},
		"damage": 204,
		"attacks_per_second": 0.64928,
		"mp": 255
	},
	"oozingterror": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 2.75,
		"skin": "oozingterror",
		"projectile_test": "acid",
		"projectile": "magic_purple",
		"reflection": 1,
		"damage_type": "magical",
		"ability": "poison",
		"attr0": 1.5,
		"upgrade": {
			"reflection": 0.25,
			"attr0": 1,
			"range": 3.875,
			"damage": 38.76923076923077,
			"mp": 15,
			"attacks_per_second": 0.0004479999999999971
		},
		"name": "Oozing Terror",
		"g": 289000,
		"a": true,
		"grades": [
			0,
			5,
			10,
			12
		],
		"explanation": "It drains the life energy of the user",
		"nopo": "Mutates the brain to maximize its potential, sapping the user's life in the process.",
		"cx": {
			"accent": "#745DD6"
		},
		"range": 60.5,
		"progression": {
			"historical_rank": 10,
			"shared_rank": 7,
			"role": "progression",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 205.545605036,
			"full_sheet_hit_damage": 222,
			"attacks_per_second": 0.925925,
			"base_dps": 205.55535,
			"selected_effort": 48695.9578214
		},
		"damage": 222,
		"attacks_per_second": 0.925925,
		"hp": -1440,
		"mp": 390
	},
	"harbringer": {
		"type": "weapon",
		"wtype": "staff",
		"tier": 2.75,
		"skin": "harbringer",
		"skin_r": "harbringer_r",
		"projectile": "magic_divine",
		"rpiercing": 10,
		"damage_type": "magical",
		"upgrade": {
			"rpiercing": 5,
			"range": 3.875,
			"damage": 12.984615384615385,
			"attacks_per_second": 0
		},
		"name": "Harbringer",
		"g": 289000,
		"a": true,
		"grades": [
			0,
			5,
			10,
			12
		],
		"explanation": "Pure, unfiltered power!",
		"trex": "This staff is a relic of a past age long forgotten. Thought to be forged by the God of Lighting. Those who have seen this staff claim it radiates powerful energy. Though this staff is only wielded by few, it is feared by all.",
		"range": 60.5,
		"progression": {
			"historical_rank": 6,
			"shared_rank": 4,
			"role": "sidegrade",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 106.325012471,
			"full_sheet_hit_damage": 118,
			"attacks_per_second": 0.901125,
			"base_dps": 106.33275,
			"selected_effort": 3809.54935622
		},
		"damage": 118,
		"attacks_per_second": 0.901125,
		"mp": 255
	},
	"wblade": {
		"type": "weapon",
		"wtype": "wblade",
		"tier": 4,
		"skin": "wblade",
		"rpiercing": 40,
		"evasion": 10,
		"damage_type": "magical",
		"upgrade": {
			"evasion": 1,
			"rpiercing": 16,
			"range": 2,
			"damage": 120.92307692307692,
			"attacks_per_second": 0
		},
		"name": "Ethereal Blade of Destiny",
		"g": 48900000,
		"a": true,
		"exclusive": true,
		"grades": [
			0,
			0,
			8,
			10
		],
		"projectile": "wmomentum",
		"range": 30,
		"progression": {
			"historical_rank": 14,
			"shared_rank": 10,
			"role": "progression",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 397.357073071,
			"full_sheet_hit_damage": 369,
			"attacks_per_second": 1.076865,
			"base_dps": 397.363185,
			"selected_effort": 765950302.1
		},
		"damage": 369,
		"attacks_per_second": 1.076865,
		"mp": 1215
	},
	"pmace": {
		"type": "weapon",
		"wtype": "pmace",
		"tier": 2,
		"skin": "hammer",
		"class": [
			"priest"
		],
		"speed": -2,
		"damage_type": "physical",
		"upgrade": {
			"range": 5,
			"damage": 25.23076923076923,
			"mp": 30,
			"attacks_per_second": 0.001538461538461533,
			"base_crit": 0.2
		},
		"name": "Paladin's Hammer",
		"g": 89000,
		"a": true,
		"grades": [
			0,
			8,
			10,
			12
		],
		"range": 10,
		"progression": {
			"historical_rank": 4,
			"shared_rank": 4,
			"role": "progression",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 86.9931920219,
			"full_sheet_hit_damage": 106,
			"attacks_per_second": 0.820625,
			"base_dps": 86.98625,
			"selected_effort": 6030.4101292
		},
		"damage": 106,
		"attacks_per_second": 0.820625,
		"throw_range": 126,
		"base_crit": 10.6
	},
	"lmace": {
		"type": "weapon",
		"wtype": "pmace",
		"tier": 3,
		"skin": "lmace",
		"luck": 6,
		"class": [
			"priest"
		],
		"damage_type": "magical",
		"upgrade": {
			"range": 6,
			"damage": 138.4,
			"throw_range": 3,
			"mp": 30,
			"attacks_per_second": 0
		},
		"name": "Lunar Mace",
		"explanation": "Majestic",
		"g": 890000,
		"a": true,
		"grades": [
			0,
			0,
			9,
			10
		],
		"range": 15,
		"progression": {
			"historical_rank": 11,
			"shared_rank": 11,
			"role": "progression",
			"requirement": 99,
			"reference_level": 70,
			"target_dps": 405,
			"full_sheet_hit_damage": 360,
			"attacks_per_second": 1.125,
			"base_dps": 405,
			"selected_effort": 44328862.2444
		},
		"damage": 360,
		"attacks_per_second": 1.125,
		"throw_range": 684,
		"base_crit": 5
	},
	"shield": {
		"type": "shield",
		"tier": 2,
		"skin": "shield",
		"upgrade": {
			"armor": 12.5,
			"resistance": 7.5
		},
		"name": "Shield",
		"g": 24000,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor": 60,
		"resistance": 20
	},
	"tigershield": {
		"set": "tiger",
		"type": "shield",
		"tier": 2.5,
		"skin": "tigershield",
		"upgrade": {
			"armor": 13.5,
			"resistance": 8.5
		},
		"name": "Shield of the Tiger",
		"g": 240000,
		"grades": [
			0,
			6,
			10,
			12
		],
		"armor": 48,
		"resistance": 17,
		"speed": 2
	},
	"xshield": {
		"type": "shield",
		"tier": 3,
		"skin": "xshield",
		"xp": 8,
		"upgrade": {
			"resistance": 6,
			"damage": 1,
			"throw_range": 3
		},
		"name": "Shield X",
		"explanation": "A metallurgical failure but a magical marvel",
		"g": 1200000,
		"grades": [
			0,
			0,
			10,
			12
		],
		"cx": {
			"accent": "#4D828F"
		},
		"resistance": 24,
		"crit": 1,
		"speed": 5,
		"evasion": 4,
		"damage": 12,
		"throw_range": 24,
		"mp": 60,
		"attacks_per_second": 0.010374999999999999,
		"base_crit": 1.2
	},
	"mshield": {
		"type": "shield",
		"tier": 3,
		"skin": "mshield",
		"luck": 8,
		"upgrade": {
			"luck": 1,
			"armor": 5,
			"scroll_value": 1.25
		},
		"name": "Shield M",
		"g": 1200000,
		"grades": [
			0,
			0,
			10,
			12
		],
		"cx": {
			"accent": "#E90010"
		},
		"armor": 20,
		"scroll_value": 5
	},
	"exoarm": {
		"type": "misc_offhand",
		"tier": 3,
		"skin": "exoarm",
		"compound": {
			"damage": 12,
			"throw_range": 18,
			"mp": 90,
			"attacks_per_second": 0.0015
		},
		"name": "Exoskeletal Arm",
		"explanation": "It does more than just enhance your natural movements, almost like it has a mind of its own.",
		"g": 48000000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"cx": {},
		"armor": 80,
		"damage": 44,
		"throw_range": 72,
		"mp": 300,
		"attacks_per_second": 0.005
	},
	"lantern": {
		"type": "misc_offhand",
		"tier": 3,
		"skin": "lantern",
		"compound": {
			"resistance": 10,
			"evasion": 5
		},
		"name": "The Lantern",
		"explanation": "Forged from a naturally vibrating metal",
		"g": 480000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"cx": {
			"scale": 0.5
		},
		"resistance": 120,
		"evasion": 10
	},
	"sshield": {
		"type": "shield",
		"tier": 2,
		"skin": "sshield",
		"upgrade": {
			"dreturn": 1.5,
			"armor": 10,
			"resistance": 7
		},
		"name": "Spiked Shield",
		"g": 24000,
		"grades": [
			4,
			8,
			10,
			12
		],
		"armor": 60,
		"resistance": 20,
		"dreturn": 3
	},
	"wshield": {
		"type": "shield",
		"tier": 1,
		"skin": "wshield",
		"upgrade": {
			"armor": 8,
			"resistance": 5
		},
		"name": "Wooden Shield",
		"g": 4800,
		"grades": [
			7,
			9,
			10,
			12
		],
		"cx": {
			"accent": "#3D923A"
		},
		"armor": 40,
		"resistance": 15,
		"scroll_value": 2
	},
	"wbook0": {
		"type": "source",
		"tier": 1,
		"skin": "wbook0",
		"upgrade": {
			"damage": 54.58461538461538,
			"mp": 75,
			"attacks_per_second": 0.0009221538461538444
		},
		"name": "Book of Knowledge",
		"g": 12000,
		"grades": [
			4,
			5,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 1,
			"shared_rank": 1,
			"role": "progression",
			"requirement": 1,
			"reference_level": 1,
			"target_dps": 45,
			"full_sheet_hit_damage": 121,
			"attacks_per_second": 0.372035,
			"base_dps": 45.016235,
			"selected_effort": 0
		},
		"damage": 121,
		"attacks_per_second": 0.372035,
		"mp": 15
	},
	"wbook2": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbook0",
		"tier": 1,
		"skin": "wbook0",
		"upgrade": {
			"damage": 70.58461538461539,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Primer of Insight",
		"explanation": "A practical primer for an advancing Priest. Placeholder artwork reuses the Book of Knowledge.",
		"g": 12000,
		"grades": [
			4,
			5,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 2,
			"role": "progression",
			"requirement": 10,
			"reference_level": 8,
			"target_dps": 56.0578922827,
			"full_sheet_hit_damage": 154,
			"attacks_per_second": 0.364,
			"base_dps": 56.056,
			"selected_effort": 10000
		},
		"damage": 154,
		"mp": 1050,
		"attacks_per_second": 0.364
	},
	"wbook3": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbook0",
		"tier": 1,
		"skin": "wbook0",
		"upgrade": {
			"damage": 69.16923076923077,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Manual of Insight",
		"explanation": "A practical manual for an advancing Priest. Placeholder artwork reuses the Book of Knowledge.",
		"g": 12000,
		"grades": [
			4,
			5,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 3,
			"role": "progression",
			"requirement": 20,
			"reference_level": 15,
			"target_dps": 69.8330508262,
			"full_sheet_hit_damage": 196,
			"attacks_per_second": 0.3563,
			"base_dps": 69.8348,
			"selected_effort": 20000
		},
		"damage": 196,
		"mp": 390,
		"attacks_per_second": 0.3563
	},
	"wbook4": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbook1",
		"tier": 1,
		"skin": "wbook1",
		"upgrade": {
			"damage": 86.15384615384616,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Tome of Insight",
		"explanation": "A practical tome for an advancing Priest. Placeholder artwork reuses the Book of Secrets.",
		"g": 12000,
		"grades": [
			4,
			5,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 4,
			"role": "progression",
			"requirement": 30,
			"reference_level": 22,
			"target_dps": 86.9931920219,
			"full_sheet_hit_damage": 242,
			"attacks_per_second": 0.35945,
			"base_dps": 86.9869,
			"selected_effort": 40000
		},
		"damage": 242,
		"mp": 690,
		"attacks_per_second": 0.35945
	},
	"wbook1": {
		"type": "source",
		"tier": 2,
		"skin": "wbook1",
		"reflection": 2,
		"upgrade": {
			"reflection": 1,
			"damage": 61.16923076923077,
			"hp": 96,
			"mp": 75,
			"attacks_per_second": 0.0016200000000000027
		},
		"name": "Book of Secrets",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 2,
			"shared_rank": 6,
			"role": "progression",
			"requirement": 50,
			"reference_level": 36,
			"target_dps": 135,
			"full_sheet_hit_damage": 204,
			"attacks_per_second": 0.6617,
			"base_dps": 134.9868,
			"selected_effort": 54896.7249634
		},
		"damage": 204,
		"attacks_per_second": 0.6617,
		"hp": 288,
		"mp": 405
	},
	"wbook5": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbook1",
		"tier": 2,
		"skin": "wbook1",
		"upgrade": {
			"damage": 97.35384615384615,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Codex of Insight",
		"explanation": "An advanced codex for an experienced Priest. Placeholder artwork reuses the Book of Secrets.",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 5,
			"role": "progression",
			"requirement": 40,
			"reference_level": 29,
			"target_dps": 108.370110838,
			"full_sheet_hit_damage": 307,
			"attacks_per_second": 0.352975,
			"base_dps": 108.363325,
			"selected_effort": 50000
		},
		"damage": 307,
		"mp": 75,
		"attacks_per_second": 0.352975
	},
	"wbook6": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbookhs",
		"tier": 2,
		"skin": "wbookhs",
		"upgrade": {
			"damage": 132.24615384615385,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Grimoire of Insight",
		"explanation": "A masterwork grimoire for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 7,
			"role": "progression",
			"requirement": 60,
			"reference_level": 42,
			"target_dps": 168.173676848,
			"full_sheet_hit_damage": 472,
			"attacks_per_second": 0.3563,
			"base_dps": 168.1736,
			"selected_effort": 125000
		},
		"damage": 472,
		"mp": 405,
		"attacks_per_second": 0.3563
	},
	"wbook7": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbookhs",
		"tier": 2,
		"skin": "wbookhs",
		"upgrade": {
			"damage": 247.26153846153846,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Lexicon of Insight",
		"explanation": "A masterwork lexicon for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 8,
			"role": "progression",
			"requirement": 70,
			"reference_level": 49,
			"target_dps": 209.499152478,
			"full_sheet_hit_damage": 595,
			"attacks_per_second": 0.3521,
			"base_dps": 209.4995,
			"selected_effort": 275000
		},
		"damage": 595,
		"mp": 45,
		"attacks_per_second": 0.3521
	},
	"wbook8": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbookhs",
		"tier": 2,
		"skin": "wbookhs",
		"upgrade": {
			"damage": 220.6769230769231,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076953
		},
		"name": "Archive of Insight",
		"explanation": "A masterwork archive for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 9,
			"role": "progression",
			"requirement": 80,
			"reference_level": 56,
			"target_dps": 260.979576066,
			"full_sheet_hit_damage": 735,
			"attacks_per_second": 0.355075,
			"base_dps": 260.980125,
			"selected_effort": 600000
		},
		"damage": 735,
		"mp": 210,
		"attacks_per_second": 0.355075
	},
	"wbook9": {
		"type": "source",
		"placeholder_art": true,
		"placeholder_asset": "wbookhs",
		"tier": 2,
		"skin": "wbookhs",
		"upgrade": {
			"damage": 375.38461538461536,
			"mp": 75,
			"attacks_per_second": 0.0008723076923076919
		},
		"name": "Scripture of Insight",
		"explanation": "A masterwork scripture for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": null,
			"shared_rank": 10,
			"role": "progression",
			"requirement": 90,
			"reference_level": 63,
			"target_dps": 325.110332513,
			"full_sheet_hit_damage": 829,
			"attacks_per_second": 0.392175,
			"base_dps": 325.113075,
			"selected_effort": 1300000
		},
		"damage": 829,
		"mp": 3390,
		"attacks_per_second": 0.392175
	},
	"wbookhs": {
		"set": "holidays",
		"type": "source",
		"tier": 2,
		"skin": "wbookhs",
		"resistance": 120,
		"upgrade": {
			"resistance": 30,
			"damage": 81.84615384615384,
			"hp": 288,
			"attacks_per_second": 0.006121230769230752,
			"base_crit": 1.2
		},
		"name": "Book of Cheer",
		"g": 960000,
		"grades": [
			0,
			2,
			10,
			12
		],
		"cx": {
			"scale": 0.5,
			"extension": true
		},
		"progression": {
			"historical_rank": 3,
			"shared_rank": 11,
			"role": "progression",
			"requirement": 99,
			"reference_level": 70,
			"target_dps": 405,
			"full_sheet_hit_damage": 186,
			"attacks_per_second": 2.177175,
			"base_dps": 404.95455,
			"selected_effort": 2783467.40761
		},
		"damage": 186,
		"attacks_per_second": 2.177175,
		"hp": 768,
		"mp": 1935
	},
	"quiver": {
		"type": "quiver",
		"tier": 1,
		"skin": "quiver",
		"range": 20,
		"upgrade": {
			"armor": 2,
			"range": 3.5,
			"attacks_per_second": 0.0015625,
			"base_crit": 0.2
		},
		"name": "Quiver",
		"g": 24000,
		"grades": [
			3,
			7,
			10,
			12
		],
		"armor": 10,
		"attacks_per_second": 0.003125,
		"base_crit": 0.4
	},
	"t2quiver": {
		"type": "quiver",
		"tier": 2,
		"skin": "t2quiver",
		"range": 20,
		"upgrade": {
			"armor": 3,
			"range": 3.5,
			"attacks_per_second": 0.00234375,
			"base_crit": 0.3
		},
		"name": "Agile Quiver",
		"g": 960000,
		"grades": [
			0,
			4,
			10,
			12
		],
		"a": true,
		"armor": 12,
		"evasion": 1,
		"attacks_per_second": 0.0140625,
		"base_crit": 1.8
	},
	"alloyquiver": {
		"type": "quiver",
		"tier": 2,
		"skin": "alloyquiver",
		"range": 20,
		"upgrade": {
			"explosion": 1.5,
			"armor": 3.5,
			"resistance": 3,
			"range": 3.5,
			"attacks_per_second": 0.001953125,
			"base_crit": 0.25
		},
		"name": "Alloy Quiver",
		"g": 112000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"a": true,
		"armor": 15,
		"resistance": 12,
		"explosion": 2,
		"attacks_per_second": 0.003125,
		"base_crit": 0.4
	},
	"amuletofm": {
		"type": "amulet",
		"skin": "amuletofm",
		"evasion": 2,
		"reflection": 0.5,
		"manasteal": 0.5,
		"crit": 2,
		"hp": 400,
		"armor": 10,
		"dreturn": 1,
		"compound": {
			"evasion": 2,
			"crit": 1,
			"dreturn": 0.75,
			"hp": 120,
			"armor": 2,
			"damage": 2,
			"throw_range": 3,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Amulet of Mystery",
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 6400000,
		"a": true,
		"damage": 10,
		"throw_range": 12,
		"mp": 90,
		"attacks_per_second": 0.0061875,
		"base_crit": 0.6
	},
	"northstar": {
		"type": "amulet",
		"skin": "northstar",
		"xp": 10,
		"compound": {
			"xp": 5
		},
		"name": "The North Star",
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 64000000,
		"a": true
	},
	"bfangamulet": {
		"type": "amulet",
		"skin": "bfangamulet",
		"lifesteal": 2,
		"critdamage": 4,
		"apiercing": 20,
		"compound": {
			"lifesteal": 1,
			"critdamage": 4,
			"apiercing": 20
		},
		"name": "Ghastly Bat Fang",
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 6400000,
		"a": true
	},
	"mpxamulet": {
		"set": "mpx",
		"type": "amulet",
		"skin": "mpxamulet",
		"mp_cost": -5,
		"mp_reduction": 12,
		"compound": {
			"mp_cost": -2,
			"mp_reduction": 2
		},
		"name": "Amulet of MP",
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 56000000,
		"a": true
	},
	"suckerpunch": {
		"set": "fury",
		"type": "ring",
		"skin": "suckerpunch",
		"crit": 2,
		"apiercing": 20,
		"lifesteal": 2,
		"compound": {
			"apiercing": 20,
			"crit": 1,
			"lifesteal": 1
		},
		"name": "Sucker Punch",
		"g": 3200000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true
	},
	"vring": {
		"set": "vampires",
		"type": "ring",
		"skin": "vring",
		"dreturn": 9,
		"lifesteal": 6,
		"armor": 10,
		"pnresistance": 4,
		"courage": 1,
		"compound": {
			"damage": 4,
			"throw_range": 12
		},
		"name": "Vampiring",
		"g": 4200000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true,
		"damage": 12,
		"throw_range": 36,
		"hp": 288
	},
	"trigger": {
		"type": "ring",
		"skin": "trigger",
		"stun": 1.5,
		"apiercing": 10,
		"compound": {
			"stun": 0.75,
			"apiercing": 2,
			"damage": 2,
			"throw_range": 6
		},
		"name": "The Trigger",
		"g": 6400000,
		"grades": [
			0,
			0,
			1,
			3
		],
		"a": true,
		"damage": 6,
		"throw_range": 18
	},
	"zapper": {
		"type": "ring",
		"skin": "zapper",
		"rpiercing": 10,
		"resistance": 30,
		"compound": {
			"rpiercing": 4,
			"damage": 3,
			"mp": 45,
			"attacks_per_second": 0.00075
		},
		"name": "The Zapper",
		"ability": "zapperzap",
		"g": 6400000,
		"grades": [
			0,
			0,
			1,
			3
		],
		"a": true,
		"damage": 15,
		"throw_range": 15,
		"mp": 150,
		"attacks_per_second": 0.0025
	},
	"goldring": {
		"type": "ring",
		"skin": "goldenring",
		"gold": 4,
		"compound": {
			"gold": 2
		},
		"name": "Ring of Gold",
		"grades": [
			0,
			2,
			6,
			7
		],
		"g": 28000000,
		"a": true
	},
	"armorring": {
		"type": "ring",
		"skin": "armorring",
		"armor": 24,
		"compound": {
			"armor": 9,
			"dreturn": 0.25
		},
		"name": "Ring of Armor",
		"grades": [
			1,
			4,
			6,
			7
		],
		"g": 180000,
		"a": true
	},
	"resistancering": {
		"type": "ring",
		"skin": "resistancering",
		"resistance": 24,
		"compound": {
			"resistance": 9,
			"reflection": 0.125
		},
		"name": "Ring of Resistance",
		"grades": [
			1,
			4,
			6,
			7
		],
		"g": 180000,
		"a": true
	},
	"ringofluck": {
		"type": "ring",
		"skin": "ringofluck",
		"luck": 10,
		"compound": {
			"luck": 5
		},
		"name": "Ring of Luck",
		"g": 6400000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true
	},
	"ringhs": {
		"set": "holidays",
		"type": "ring",
		"skin": "ringhs",
		"luck": 8,
		"ability": "secondchance",
		"attr0": 3,
		"compound": {
			"luck": 3,
			"hp": 240
		},
		"name": "Ring of Holidays",
		"g": 6400000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true,
		"damage": 8,
		"throw_range": 12,
		"hp": 480,
		"mp": 60,
		"attacks_per_second": 0.00725,
		"base_crit": 0.8
	},
	"molesteeth": {
		"type": "earring",
		"skin": "molesteeth",
		"apiercing": 15,
		"compound": {
			"apiercing": 15
		},
		"name": "Mole's Teeth",
		"g": 500000,
		"grades": [
			0,
			1,
			6,
			7
		],
		"a": true
	},
	"mearring": {
		"set": "holidays",
		"type": "earring",
		"skin": "mearring",
		"luck": 8,
		"compound": {
			"luck": 4
		},
		"name": "Mistletoe Earring",
		"g": 12000000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true
	},
	"tristone": {
		"type": "ring",
		"skin": "tristone",
		"skin_a": "tristone_a",
		"apiercing": 5,
		"rpiercing": 5,
		"compound": {
			"apiercing": 5,
			"rpiercing": 5,
			"damage": 2,
			"throw_range": 3,
			"hp": 48,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Legacy Tri-Stone",
		"ignore": true,
		"g": 50000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"action": "ACTIVATE!",
		"onclick": "socket.emit('activate',{slot:$(this).data('id')})",
		"damage": 2,
		"throw_range": 3,
		"hp": 48,
		"mp": 15,
		"attacks_per_second": 0.0018125,
		"base_crit": 0.2
	},
	"ctristone": {
		"type": "ring",
		"skin": "tristone",
		"apiercing": 5,
		"rpiercing": 5,
		"compound": {
			"apiercing": 5,
			"rpiercing": 5,
			"damage": 2,
			"throw_range": 3,
			"hp": 48,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Tri-Stone",
		"g": 50000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"damage": 2,
		"throw_range": 3,
		"hp": 48,
		"mp": 15,
		"attacks_per_second": 0.0018125,
		"base_crit": 0.2
	},
	"darktristone": {
		"type": "ring",
		"skin": "darktristone",
		"skin_a": "darktristone_a",
		"apiercing": 5,
		"rpiercing": 5,
		"evasion": 3,
		"compound": {
			"apiercing": 5,
			"rpiercing": 5,
			"damage": 2,
			"throw_range": 3,
			"hp": 48,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Legacy Dark Tri-Stone",
		"ignore": true,
		"g": 50000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"action": "ACTIVATE!",
		"onclick": "socket.emit('activate',{slot:$(this).data('id')})",
		"damage": 2,
		"throw_range": 3,
		"hp": 48,
		"mp": 15,
		"attacks_per_second": 0.0018125,
		"base_crit": 0.2
	},
	"cdarktristone": {
		"type": "ring",
		"skin": "darktristone",
		"apiercing": 5,
		"rpiercing": 5,
		"evasion": 3,
		"compound": {
			"apiercing": 5,
			"rpiercing": 5,
			"damage": 2,
			"throw_range": 3,
			"hp": 48,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Dark Tri-Stone",
		"g": 50000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"damage": 2,
		"throw_range": 3,
		"hp": 48,
		"mp": 15,
		"attacks_per_second": 0.0018125,
		"base_crit": 0.2
	},
	"skullamulet": {
		"type": "amulet",
		"skin": "skullamulet",
		"hp": 200,
		"armor": 10,
		"compound": {
			"armor": 5,
			"hp": 320,
			"damage": 2,
			"throw_range": 3,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2,
			"pvp_damage_reduction": 4.761904761904767
		},
		"name": "Skull Amulet",
		"grades": [
			2,
			4,
			6,
			7
		],
		"g": 30000,
		"a": true,
		"damage": 2,
		"throw_range": 3,
		"mp": 15,
		"attacks_per_second": 0.0018125,
		"base_crit": 0.2,
		"pvp_damage_reduction": 16.666666666666664
	},
	"spookyamulet": {
		"type": "amulet",
		"skin": "spookyamulet",
		"name": "Amulet of Spooks",
		"reflection": 2,
		"evasion": 5,
		"xp": 2,
		"gold": 2,
		"luck": 2,
		"compound": {
			"reflection": 0.25,
			"evasion": 0.625,
			"xp": 0.25,
			"gold": 0.25,
			"luck": 0.25
		},
		"grades": [
			0,
			3,
			6,
			7
		],
		"g": 320000,
		"a": true
	},
	"hpamulet": {
		"type": "amulet",
		"skin": "hpamulet",
		"hp": 200,
		"compound": {
			"hp": 240
		},
		"name": "Amulet of HP",
		"g": 20000,
		"grades": [
			3,
			5,
			6,
			7
		]
	},
	"snring": {
		"type": "amulet",
		"skin": "snring",
		"armor": 20,
		"compound": {
			"armor": 5,
			"damage": 2,
			"throw_range": 6,
			"attacks_per_second": 0.0015625,
			"base_crit": 0.2
		},
		"name": "Stompy's Nose Ring",
		"g": 2400000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"damage": 14,
		"throw_range": 42,
		"attacks_per_second": 0.003125,
		"base_crit": 0.4
	},
	"sanguine": {
		"type": "amulet",
		"skin": "sanguine",
		"attr0": 2,
		"hp": 1200,
		"aura": "sanguine",
		"compound": {
			"attr0": 0.5,
			"hp": 300,
			"damage": 2,
			"throw_range": 3,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Sanguine Amulet",
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 32000000,
		"damage": 10,
		"throw_range": 15,
		"mp": 75,
		"attacks_per_second": 0.0090625,
		"base_crit": 1
	},
	"dexamulet": {
		"type": "amulet",
		"skin": "dexamulet",
		"compound": {
			"attacks_per_second": 0.0046875,
			"base_crit": 0.6
		},
		"name": "Amulet of Dexterity",
		"g": 30000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"attacks_per_second": 0.00625,
		"base_crit": 0.8
	},
	"stramulet": {
		"type": "amulet",
		"skin": "stramulet",
		"compound": {
			"damage": 3,
			"throw_range": 9
		},
		"name": "Amulet of Strength",
		"g": 30000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"damage": 4,
		"throw_range": 12
	},
	"intamulet": {
		"type": "amulet",
		"skin": "intamulet",
		"compound": {
			"damage": 3,
			"mp": 45,
			"attacks_per_second": 0.00075
		},
		"name": "Amulet of Intelligence",
		"g": 30000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"damage": 4,
		"mp": 60,
		"attacks_per_second": 0.001
	},
	"t2stramulet": {
		"type": "amulet",
		"skin": "t2stramulet",
		"resistance": 30,
		"compound": {
			"resistance": 20,
			"damage": 3,
			"throw_range": 9
		},
		"name": "Amulet of the Eager Warrior",
		"g": 160000,
		"edge": -1,
		"grades": [
			0,
			2,
			6,
			7
		],
		"damage": 6,
		"throw_range": 18
	},
	"t2intamulet": {
		"type": "amulet",
		"skin": "t2intamulet",
		"armor": 30,
		"compound": {
			"armor": 20,
			"damage": 3,
			"mp": 45,
			"attacks_per_second": 0.00075
		},
		"name": "Amulet of the Fierce Mage",
		"g": 160000,
		"edge": -1,
		"grades": [
			0,
			2,
			6,
			7
		],
		"damage": 6,
		"mp": 90,
		"attacks_per_second": 0.0015
	},
	"t2dexamulet": {
		"type": "amulet",
		"skin": "t2dexamulet",
		"compound": {
			"hp": 144,
			"attacks_per_second": 0.0046875,
			"base_crit": 0.6
		},
		"name": "Amulet of the Stubborn Ranger",
		"g": 160000,
		"edge": -1,
		"grades": [
			0,
			2,
			6,
			7
		],
		"hp": 240,
		"attacks_per_second": 0.009375,
		"base_crit": 1.2
	},
	"warmscarf": {
		"type": "amulet",
		"skin": "warmscarf",
		"armor": 10,
		"resistance": 10,
		"apiercing": 5,
		"rpiercing": 5,
		"upgrade": {
			"apiercing": 1.25,
			"rpiercing": 1.25
		},
		"name": "Warm Scarf",
		"explanation": "Stylish and deadly!",
		"g": 20000,
		"a": true,
		"grades": [
			7,
			9,
			10,
			12
		],
		"damage": 4,
		"throw_range": 6,
		"mp": 30,
		"attacks_per_second": 0.003625,
		"base_crit": 0.4
	},
	"hpbelt": {
		"type": "belt",
		"skin": "hpbelt",
		"hp": 160,
		"compound": {
			"hp": 240
		},
		"name": "Belt of HP",
		"g": 20000,
		"grades": [
			3,
			5,
			6,
			7
		]
	},
	"mpxbelt": {
		"set": "mpx",
		"type": "belt",
		"skin": "mpxbelt",
		"mp_cost": -5,
		"mp_reduction": 10,
		"compound": {
			"mp_cost": -1,
			"mp_reduction": 5
		},
		"name": "Belt of MP Reduction",
		"grades": [
			0,
			0,
			6,
			7
		],
		"g": 1200000
	},
	"lbelt": {
		"type": "belt",
		"skin": "lbelt",
		"speed": 1,
		"armor": 15,
		"compound": {
			"speed": 1.1,
			"armor": 5
		},
		"name": "Belt",
		"explanation": "A belt that can actually hold your pants in place!",
		"g": 40000,
		"grades": [
			3,
			5,
			6,
			7
		]
	},
	"strbelt": {
		"type": "belt",
		"skin": "strbelt",
		"compound": {
			"damage": 3,
			"throw_range": 9
		},
		"name": "Belt of Strength",
		"g": 50000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"damage": 4,
		"throw_range": 12
	},
	"mbelt": {
		"type": "belt",
		"skin": "mbelt",
		"speed": 1,
		"armor": 15,
		"compound": {
			"speed": 1.1,
			"armor": 10
		},
		"a": true,
		"name": "Well-Crafted Belt",
		"g": 640000,
		"grades": [
			0,
			1,
			6,
			7
		],
		"damage": 8,
		"mp": 120,
		"attacks_per_second": 0.0145,
		"base_crit": 1.6
	},
	"sbelt": {
		"type": "belt",
		"skin": "sbelt",
		"resistance": 15,
		"armor": 15,
		"compound": {
			"resistance": 10,
			"armor": 10,
			"damage": 4,
			"throw_range": 6,
			"mp": 30,
			"attacks_per_second": 0.003625,
			"base_crit": 0.4
		},
		"a": true,
		"name": "Belt of Hallowed Trials",
		"g": 640000,
		"grades": [
			0,
			1,
			6,
			7
		],
		"damage": 16,
		"throw_range": 24,
		"mp": 120,
		"attacks_per_second": 0.0145,
		"base_crit": 1.6,
		"pvp_damage_reduction": 37.5
	},
	"santasbelt": {
		"set": "holidays",
		"type": "belt",
		"skin": "santasbelt",
		"evasion": 4,
		"compound": {
			"attacks_per_second": 0.003125,
			"base_crit": 0.4
		},
		"a": true,
		"name": "Santa's Belt",
		"g": 640000,
		"grades": [
			0,
			3,
			6,
			7
		],
		"attacks_per_second": 0.0046875,
		"base_crit": 0.6
	},
	"dexbelt": {
		"type": "belt",
		"skin": "dexbelt",
		"compound": {
			"attacks_per_second": 0.0046875,
			"base_crit": 0.6
		},
		"name": "Belt of Dexterity",
		"g": 50000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"attacks_per_second": 0.00625,
		"base_crit": 0.8
	},
	"intbelt": {
		"type": "belt",
		"skin": "intbelt",
		"compound": {
			"damage": 3,
			"mp": 45,
			"attacks_per_second": 0.00075
		},
		"name": "Belt of Intelligence",
		"g": 50000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"damage": 4,
		"mp": 60,
		"attacks_per_second": 0.001
	},
	"ringsj": {
		"type": "ring",
		"skin": "ring",
		"resistance": 5,
		"compound": {
			"resistance": 5,
			"damage": 2,
			"throw_range": 3,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Ring of Small Joys",
		"g": 24000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"damage": 2,
		"throw_range": 3,
		"mp": 15,
		"attacks_per_second": 0.0018125,
		"base_crit": 0.2
	},
	"solitaire": {
		"type": "ring",
		"skin": "solitaire",
		"bling": 10,
		"compound": {
			"bling": 30
		},
		"name": "Solitaire Ring",
		"explanation": "The diamond is mesmerizing",
		"g": 1200000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"event": true
	},
	"vitring": {
		"type": "ring",
		"skin": "vitring",
		"compound": {
			"hp": 96
		},
		"name": "Ring of Vitality",
		"g": 24000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"hp": 96
	},
	"strring": {
		"type": "ring",
		"skin": "strring",
		"compound": {
			"damage": 2,
			"throw_range": 6
		},
		"name": "Ring of Strength",
		"g": 24000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"damage": 2,
		"throw_range": 6
	},
	"intring": {
		"type": "ring",
		"skin": "intring",
		"compound": {
			"damage": 2,
			"mp": 30,
			"attacks_per_second": 0.0005
		},
		"name": "Ring of Intelligence",
		"g": 24000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"damage": 2,
		"mp": 30,
		"attacks_per_second": 0.0005
	},
	"dexring": {
		"type": "ring",
		"skin": "dexring",
		"compound": {
			"attacks_per_second": 0.003125,
			"base_crit": 0.4
		},
		"name": "Ring of Dexterity",
		"g": 24000,
		"grades": [
			3,
			5,
			6,
			7
		],
		"attacks_per_second": 0.003125,
		"base_crit": 0.4
	},
	"cring": {
		"type": "ring",
		"skin": "cring",
		"compound": {
			"damage": 2,
			"mp": 30,
			"attacks_per_second": 0.003625,
			"base_crit": 0.4
		},
		"edge": -2,
		"name": "Ring of The Crypt",
		"g": 240000,
		"grades": [
			0,
			4,
			6,
			7
		],
		"damage": 4,
		"mp": 60,
		"attacks_per_second": 0.00725,
		"base_crit": 0.8
	},
	"cearring": {
		"type": "earring",
		"skin": "cearring",
		"compound": {
			"damage": 4,
			"throw_range": 6,
			"mp": 30,
			"attacks_per_second": 0.0005
		},
		"edge": -2,
		"name": "Earring of The Crypt",
		"g": 380000,
		"grades": [
			0,
			4,
			6,
			7
		],
		"damage": 10,
		"throw_range": 15,
		"mp": 75,
		"attacks_per_second": 0.00125
	},
	"intearring": {
		"type": "earring",
		"skin": "intearring",
		"compound": {
			"damage": 2,
			"mp": 30,
			"attacks_per_second": 0.0005
		},
		"name": "Earring of Intelligence",
		"g": 38000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"damage": 3,
		"mp": 45,
		"attacks_per_second": 0.00075
	},
	"strearring": {
		"type": "earring",
		"skin": "strearring",
		"compound": {
			"damage": 2,
			"throw_range": 6
		},
		"name": "Earring of Strength",
		"g": 38000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"damage": 3,
		"throw_range": 9
	},
	"dexearring": {
		"type": "earring",
		"skin": "dexearring",
		"compound": {
			"attacks_per_second": 0.003125,
			"base_crit": 0.4
		},
		"name": "Earring of Dexterity",
		"g": 38000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"attacks_per_second": 0.0046875,
		"base_crit": 0.6
	},
	"dexearringx": {
		"type": "earring",
		"skin": "dexearringx",
		"luck": 2,
		"speed": 1,
		"compound": {
			"luck": 2,
			"attacks_per_second": 0.003125,
			"base_crit": 0.4
		},
		"name": "Enchanted Earring",
		"g": 38000,
		"grades": [
			0,
			2,
			6,
			7
		],
		"attacks_per_second": 0.009375,
		"base_crit": 1.2
	},
	"vitearring": {
		"type": "earring",
		"skin": "vitearring",
		"compound": {
			"hp": 96
		},
		"name": "Earring of Vitality",
		"g": 38000,
		"grades": [
			2,
			5,
			6,
			7
		],
		"hp": 144
	},
	"cscroll0": {
		"type": "cscroll",
		"skin": "cscroll0",
		"grade": 0,
		"name": "Compound Scroll",
		"explanation": "Scroll to combine 3 accessories. Things get challenging after +1. If the combination fails, the item is lost.",
		"s": 9999,
		"g": 6400
	},
	"cscroll1": {
		"type": "cscroll",
		"skin": "cscroll1",
		"grade": 1,
		"name": "High Compound Scroll",
		"explanation": "Scroll to combine 3 high grade accessories. If the combination fails, the item is lost.",
		"s": 9999,
		"g": 240000
	},
	"cscroll2": {
		"type": "cscroll",
		"skin": "cscroll2",
		"grade": 2,
		"name": "Rare Compound Scroll",
		"explanation": "Scroll to combine 3 rare accessories. If the combination fails, the item is lost.",
		"s": 9999,
		"g": 9200000
	},
	"cscroll3": {
		"type": "cscroll",
		"skin": "cscroll3",
		"grade": 3,
		"name": "Legendary Compound Scroll",
		"explanation": "A mysterious compound scroll, you can feel that it's very powerful. If the combination fails, the item is lost.",
		"a": true,
		"s": 9999,
		"markup": 20,
		"g": 1840000000
	},
	"scroll0": {
		"type": "uscroll",
		"skin": "scroll0",
		"grade": 0,
		"name": "Upgrade Scroll",
		"explanation": "Scroll to upgrade a weapon or armor. If the upgrade fails, the item is lost.",
		"s": 9999,
		"g": 1000
	},
	"scroll1": {
		"type": "uscroll",
		"skin": "scroll1",
		"grade": 1,
		"name": "High Upgrade Scroll",
		"explanation": "Scroll to upgrade a high grade weapon or armor. If the upgrade fails, the item is lost.",
		"s": 9999,
		"g": 40000
	},
	"scroll2": {
		"type": "uscroll",
		"skin": "scroll2",
		"grade": 2,
		"name": "Rare Upgrade Scroll",
		"explanation": "Scroll to upgrade a rare weapon or armor. If the upgrade fails, the item is lost.",
		"s": 9999,
		"g": 1600000
	},
	"scroll3": {
		"type": "uscroll",
		"skin": "scroll3",
		"grade": 3,
		"name": "Legendary Upgrade Scroll",
		"explanation": "A mysterious upgrade scroll, you can feel that it's very powerful. If the upgrade fails, the item is lost.",
		"a": true,
		"s": 9999,
		"g": 480000000,
		"markup": 10
	},
	"scroll4": {
		"type": "uscroll",
		"skin": "scroll4",
		"grade": 3.6,
		"name": "Ultimate Upgrade Scroll",
		"explanation": "A scroll passed down from ancient times. Long believed to be extinct. Powers beyond imagination.",
		"a": true,
		"s": 9999,
		"g": 640000000,
		"exclusive": true
	},
	"strscroll": {
		"type": "pscroll",
		"skin": "strscroll",
		"name": "Strength Scroll",
		"explanation": "Adds Damage and Throw Range to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"damage": 1,
			"throw_range": 3
		}
	},
	"intscroll": {
		"type": "pscroll",
		"skin": "intscroll",
		"name": "Intelligence Scroll",
		"explanation": "Adds Damage and MP to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"damage": 1,
			"mp": 15
		}
	},
	"dexscroll": {
		"type": "pscroll",
		"skin": "dexscroll",
		"name": "Dexterity Scroll",
		"explanation": "Adds Attacks/Sec and Crit to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"attacks_per_second": 0.0015625,
			"base_crit": 0.2
		}
	},
	"vitscroll": {
		"type": "pscroll",
		"skin": "vitscroll",
		"name": "Vitality Scroll",
		"explanation": "Adds HP to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"hp": 48
		}
	},
	"forscroll": {
		"type": "pscroll",
		"skin": "forscroll",
		"name": "Fortitude Scroll",
		"explanation": "Adds PvP Damage Reduction to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"pvp_damage_reduction": 4.761904761904767
		}
	},
	"evasionscroll": {
		"type": "pscroll",
		"skin": "evasionscroll",
		"name": "Evasion Scroll",
		"explanation": "Adds Evasion to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"evasion": 0.325
		}
	},
	"reflectionscroll": {
		"type": "pscroll",
		"skin": "reflectionscroll",
		"name": "Reflection Scroll",
		"explanation": "Adds Reflection to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"reflection": 0.15
		}
	},
	"goldscroll": {
		"type": "pscroll",
		"skin": "goldscroll",
		"name": "Gold Scroll",
		"explanation": "Adds Gold bonus to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"gold": 0.5
		}
	},
	"luckscroll": {
		"type": "pscroll",
		"skin": "luckscroll",
		"name": "Luck Scroll",
		"explanation": "Adds Luck to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"luck": 1
		}
	},
	"xpscroll": {
		"type": "pscroll",
		"skin": "xpscroll",
		"name": "XP Scroll",
		"explanation": "Adds XP bonus to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"xp": 0.5
		}
	},
	"armorscroll": {
		"type": "pscroll",
		"skin": "armorscroll",
		"name": "Armor Scroll",
		"explanation": "Adds Armor to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"armor": 2.25
		}
	},
	"resistancescroll": {
		"type": "pscroll",
		"skin": "resistancescroll",
		"name": "Resistance Scroll",
		"explanation": "Adds Resistance to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"resistance": 2.25
		}
	},
	"speedscroll": {
		"type": "pscroll",
		"skin": "speedscroll",
		"name": "Speed Scroll",
		"explanation": "Adds Speed to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"speed": 0.325
		}
	},
	"lifestealscroll": {
		"type": "pscroll",
		"skin": "lifestealscroll",
		"name": "Lifesteal Scroll",
		"explanation": "Adds Lifesteal to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"lifesteal": 0.15
		}
	},
	"manastealscroll": {
		"type": "pscroll",
		"skin": "manastealscroll",
		"name": "Manasteal Scroll",
		"explanation": "Adds Manasteal to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"manasteal": 0.04
		}
	},
	"rpiercingscroll": {
		"type": "pscroll",
		"skin": "rpiercingscroll",
		"name": "Resistance Piercing Scroll",
		"explanation": "Adds Resistance Piercing to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"rpiercing": 2.25
		}
	},
	"apiercingscroll": {
		"type": "pscroll",
		"skin": "apiercingscroll",
		"name": "Armor Piercing Scroll",
		"explanation": "Adds Armor Piercing to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"apiercing": 2.25
		}
	},
	"critscroll": {
		"type": "pscroll",
		"skin": "critscroll",
		"name": "Critical Hit Scroll",
		"explanation": "Adds Critical Hit to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"crit": 0.125
		}
	},
	"dreturnscroll": {
		"type": "pscroll",
		"skin": "dreturnscroll",
		"name": "Damage Return Scroll",
		"explanation": "Adds Damage Return to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"dreturn": 0.5
		}
	},
	"frequencyscroll": {
		"type": "pscroll",
		"skin": "frequencyscroll",
		"name": "Attack Speed Scroll",
		"explanation": "Adds Attacks/Sec to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"attacks_per_second": 0.00325
		}
	},
	"mpcostscroll": {
		"type": "pscroll",
		"skin": "mpcostscroll",
		"name": "MP Cost Reduction Scroll",
		"explanation": "Adds MP Cost Reduction to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"mp_cost": -0.6
		}
	},
	"outputscroll": {
		"type": "pscroll",
		"skin": "outputscroll",
		"name": "Output Increase Scroll",
		"explanation": "Adds Damage Output to eligible armor.",
		"s": 9999,
		"g": 8000,
		"scroll_value": 1,
		"scroll_effects": {
			"output": 0.175
		}
	},
	"offering": {
		"type": "offering",
		"skin": "shade_offering",
		"name": "Primordial Essence",
		"explanation": "The essence contained within can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"s": 100,
		"a": true,
		"grade": 2,
		"g": 27420000
	},
	"offeringp": {
		"type": "offering",
		"skin": "offeringp",
		"name": "Primling",
		"explanation": "A tiny cute essence that can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"s": 1000,
		"a": true,
		"grade": 1,
		"g": 480000
	},
	"offeringx": {
		"type": "offering",
		"skin": "offeringx",
		"name": "Primordial X",
		"explanation": "The most powerful essence that can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"s": 10,
		"a": true,
		"grade": 3,
		"g": 242064000
	},
	"cosmo0": {
		"type": "cosmetics",
		"skin": "cosmo0",
		"cash": 289,
		"g": 289,
		"name": "New Armor",
		"explanation": "Give this to NPC Haila to receive a new look. Heads-up! It's random, you may or may-not like it. [Work in progress - PRICE/DROPS MIGHT CHANGE!]",
		"quest": "cx",
		"s": 9999,
		"e": 1
	},
	"cosmo1": {
		"type": "cosmetics",
		"skin": "cosmo1",
		"cash": 459,
		"g": 459,
		"name": "New Make-up",
		"explanation": "Give this to NPC Haila to receive a new make-up. Heads-up! It's random, you may or may-not like it. [Work in progress - Not functional yet.]",
		"s": 9999,
		"quest": "cx"
	},
	"cosmo2": {
		"type": "cosmetics",
		"skin": "cosmo2",
		"cash": 129,
		"g": 129,
		"name": "New Hairdo",
		"explanation": "Give this to NPC Haila to receive a new hairdo. Heads-up! It's random, you may or may-not like it. [Work in progress - PRICE/DROPS MIGHT CHANGE!]",
		"s": 9999,
		"e": 1,
		"quest": "cx"
	},
	"cosmo3": {
		"type": "cosmetics",
		"skin": "cosmo3",
		"cash": 399,
		"g": 399,
		"name": "New Hat",
		"explanation": "Give this to NPC Haila to receive a new hat. Heads-up! It's random, you may or may-not like it. [Work in progress - PRICE/DROPS MIGHT CHANGE!]",
		"s": 9999,
		"e": 1,
		"quest": "cx"
	},
	"cosmo4": {
		"type": "cosmetics",
		"skin": "cosmo4",
		"cash": 1399,
		"g": 1399,
		"name": "New Accessory",
		"explanation": "Give this to NPC Haila to receive a unique accessory. Heads-up! It's random, you may or may-not like it. [Work in progress - Not functional yet.]",
		"s": 9999,
		"quest": "cx"
	},
	"stoneofxp": {
		"type": "stone",
		"skin": "stoneofxp",
		"skin_a": "stoneofxp_a",
		"g": 100000000,
		"name": "Stone of Wisdom",
		"days": 30,
		"explanation": "Increases experience gain by 50%. Needs to be activated. Can be morphed into other stones.",
		"ignore": true
	},
	"stoneofgold": {
		"type": "stone",
		"skin": "stoneofgold",
		"skin_a": "stoneofgold",
		"g": 100000000,
		"name": "Stone of Riches",
		"days": 30,
		"explanation": "Helps you find up to 40% more gold from monsters.",
		"ignore": true
	},
	"stoneofluck": {
		"type": "stone",
		"skin": "stoneofluck",
		"skin_a": "stoneofluck",
		"g": 100000000,
		"name": "Stone of Luck",
		"days": 30,
		"explanation": "Increases your chances to loot something from a monster by 20%.",
		"ignore": true
	},
	"xptome": {
		"type": "tome",
		"skin": "xptome",
		"reward": 2,
		"name": "Tome of Protection",
		"explanation": "Legacy item with no effect on skill progression or death sickness. It is not consumed.",
		"s": 9999,
		"g": 3200000
	},
	"licence": {
		"type": "licence",
		"skin": "licence",
		"name": "Licence to Kill",
		"explanation": "With this licence, you gain a unique immunity for 7 minutes. No one can bother you for having too many comrades in this realm!",
		"g": 25000000,
		"s": 9999
	},
	"xpbooster": {
		"type": "booster",
		"skin": "xpbooster",
		"skin_a": "xpbooster_a",
		"gain": "xp",
		"xp": 20,
		"compound": {
			"xp": 12
		},
		"grades": [
			0,
			10,
			6,
			7
		],
		"g": 79840000,
		"name": "XP Booster",
		"days": 30,
		"explanation": "Increases experience gain. Needs to be activated. Can be shifted into other boosters."
	},
	"luckbooster": {
		"type": "booster",
		"skin": "luckbooster",
		"skin_a": "luckbooster_a",
		"gain": "luck",
		"luck": 20,
		"compound": {
			"luck": 8
		},
		"grades": [
			0,
			10,
			6,
			7
		],
		"g": 79840000,
		"name": "Luck Booster",
		"days": 30,
		"explanation": "Increases your chances of looting something from a monster.",
		"legacy": {
			"luck": 15
		}
	},
	"goldbooster": {
		"type": "booster",
		"skin": "goldbooster",
		"skin_a": "goldbooster_a",
		"gain": "gold",
		"gold": 20,
		"compound": {
			"gold": 8
		},
		"grades": [
			0,
			10,
			6,
			7
		],
		"g": 79840000,
		"name": "Gold Booster",
		"days": 30,
		"explanation": "Boosts gold loot from chests.",
		"legacy": {
			"gold": 10
		}
	},
	"networkcard": {
		"s": 9999,
		"type": "material",
		"skin": "networkcard",
		"g": 24000000,
		"name": "Network Card",
		"explanation": "A critical component that is able to interact with the fabric of our universe. Possibly quantum technology."
	},
	"qubics": {
		"type": "qubics",
		"skin": "qubics",
		"name": "Qubics",
		"explanation": "Unique bio-electronic components, it's almost like they are alive. Can yield unexpected results if you introduce them to other materials!",
		"s": 9999,
		"a": true,
		"g": 5120000
	},
	"gem0": {
		"type": "gem",
		"skin": "gem0",
		"name": "Raw Emerald",
		"explanation": "A very rare gem. Can be exchanged for random treasures.",
		"g": 240000,
		"e": 1,
		"s": 9999,
		"a": true
	},
	"gem1": {
		"type": "gem",
		"skin": "gem1",
		"name": "Tiny Ruby",
		"explanation": "A hard to find gem. Can be exchanged for random treasures.",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": 2
	},
	"gem2": {
		"type": "gem",
		"skin": "gem2",
		"name": "Raw Diamond",
		"explanation": "A precious gem. Can be exchanged for random treasures.",
		"g": 360000,
		"s": 9999,
		"a": 2
	},
	"gem3": {
		"type": "gem",
		"skin": "gem3",
		"name": "Raw Colourful Diamond",
		"explanation": "A hard to find gem. Can be exchanged for random treasures.",
		"g": 4800000,
		"s": 9999,
		"a": 2
	},
	"candypop": {
		"type": "elixir",
		"skin": "candypop",
		"skin_a": "candypop",
		"name": "Candy Pop",
		"luck": 12,
		"duration": 1,
		"g": 120,
		"e": 10,
		"eat": true,
		"s": 9999,
		"explanation": "You can eat it. Gift it. Exchange 10 of them at Xyn for a small reward.",
		"damage": 6,
		"hp": 480,
		"mp": 90,
		"attacks_per_second": 0.0015
	},
	"candy0": {
		"type": "gem",
		"skin": "candy0",
		"name": "Rare Candy",
		"explanation": "A rare candy! Can be exchanged for random treasures.",
		"g": 240000,
		"e": 1,
		"s": 9999,
		"a": 2
	},
	"candy1": {
		"type": "gem",
		"skin": "candy1",
		"name": "Candy",
		"explanation": "Candy! Can be exchanged for random treasures.",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": 2
	},
	"candy0v2": {
		"type": "gem",
		"skin": "candy0",
		"name": "Rare Candy [h2]",
		"explanation": "A rare candy. Xyn in New Town could give you something exciting in exchange!",
		"g": 12000,
		"e": 1,
		"s": 9999,
		"ignore": true
	},
	"candy1v2": {
		"type": "gem",
		"skin": "candy1",
		"name": "Candy [h2]",
		"explanation": "A delicious candy. Xyn in New Town could give you something in exchange!",
		"g": 2400,
		"e": 1,
		"s": 9999,
		"ignore": true
	},
	"candy0v3": {
		"type": "gem",
		"skin": "candy0",
		"name": "Rare Candy",
		"explanation": "A rare candy. Xyn in New Town could give you something exciting in exchange!",
		"g": 12000,
		"e": 1,
		"s": 9999,
		"ignore": true
	},
	"candy1v3": {
		"type": "gem",
		"skin": "candy1",
		"name": "Candy",
		"explanation": "A delicious candy. Xyn in New Town could give you something in exchange!",
		"g": 2400,
		"e": 1,
		"s": 9999,
		"ignore": true
	},
	"bugbountybox": {
		"type": "box",
		"skin": "bugbountybox",
		"name": "Bug Bounty Box",
		"explanation": "Rewarded for assisting in the hunt against the bugs.",
		"g": 120000,
		"event": true,
		"a": 2,
		"s": 9999,
		"e": 1
	},
	"apologybox": {
		"type": "box",
		"skin": "apologybox",
		"name": "Apology Box",
		"explanation": "This box represents an official apology. Sorry.",
		"g": 120000,
		"event": true,
		"ignore": true,
		"a": 2,
		"s": 9999,
		"e": 1
	},
	"weaponbox": {
		"type": "box",
		"skin": "weaponbox",
		"name": "Weapon Box",
		"explanation": "Can be exchanged for a random, rare weapon.",
		"g": 320000,
		"e": 1,
		"a": true,
		"s": 9999
	},
	"armorbox": {
		"type": "box",
		"skin": "armorbox",
		"name": "Armor Box",
		"explanation": "Can be exchanged for a random, rare armor.",
		"g": 120000,
		"e": 1,
		"a": true,
		"s": 9999
	},
	"jewellerybox": {
		"type": "box",
		"skin": "chest3",
		"name": "Jewellery Box",
		"explanation": "Can be exchanged for a random acessory.",
		"ignore": true,
		"g": 80000,
		"e": 1,
		"a": true,
		"s": 9999
	},
	"mistletoe": {
		"type": "gem",
		"skin": "mistletoe",
		"name": "Mistletoe",
		"explanation": "Maybe someone could give you a kiss in exchange...",
		"g": 20000,
		"e": 1,
		"a": true,
		"s": 9999
	},
	"candycane": {
		"type": "gem",
		"skin": "candycane",
		"name": "Candy Cane",
		"explanation": "The old man in Winterland was looking for sweets.",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true
	},
	"gift0": {
		"type": "gem",
		"skin": "gift0",
		"name": "Rare Gift",
		"explanation": "A Rare Gift to celebrate our Anniversary!",
		"g": 2400,
		"e": 1,
		"s": 9999,
		"a": true
	},
	"gift1": {
		"type": "gem",
		"skin": "gift1",
		"name": "Gift",
		"explanation": "A Gift to celebrate our Anniversary!",
		"g": 100,
		"e": 1,
		"s": 9999,
		"a": 2
	},
	"redenvelope": {
		"type": "gem",
		"skin": "redenvelope",
		"name": "Red Envelope",
		"explanation": "Congratulations and prosperity",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true,
		"event": true
	},
	"redenvelopev2": {
		"type": "gem",
		"skin": "redenvelopev2",
		"name": "Red Envelope",
		"explanation": "Congratulations and prosperity",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true,
		"event": true
	},
	"redenvelopev3": {
		"type": "gem",
		"skin": "redenvelopev3",
		"name": "Red Envelope",
		"explanation": "Congratulations and prosperity",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true,
		"event": true
	},
	"redenvelopev4": {
		"type": "gem",
		"skin": "redenvelopev4",
		"name": "Red Envelope",
		"explanation": "Congratulations and prosperity",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true,
		"event": true
	},
	"greenenvelope": {
		"type": "gem",
		"skin": "greenenvelope",
		"name": "Green Envelope",
		"explanation": "Congratulations and prosperity",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true,
		"event": true
	},
	"brownenvelope": {
		"type": "gem",
		"skin": "brownenvelope",
		"name": "Brown Envelope",
		"explanation": "Congratulations and prosperity",
		"g": 24000,
		"e": 1,
		"s": 9999,
		"a": true,
		"event": true
	},
	"essenceoffrost": {
		"type": "material",
		"skin": "essenceoffrost",
		"name": "Essence of Frost",
		"explanation": "It's like an ice storm in a bottle",
		"s": 9999,
		"g": 40000
	},
	"essenceoffire": {
		"type": "material",
		"skin": "essenceoffire",
		"name": "Essence of Fire",
		"explanation": "So fierce, so mesmerizing",
		"s": 9999,
		"g": 40000
	},
	"essenceofether": {
		"type": "material",
		"skin": "essenceofether",
		"name": "Ethereal Essence",
		"explanation": "A ghostly essence, maybe it could allow you to shift from this world momentarily",
		"s": 9999,
		"g": 40000
	},
	"essenceofnature": {
		"type": "material",
		"skin": "essenceofnature",
		"name": "Essence of Nature",
		"explanation": "Earthly energy, waiting to spring",
		"s": 9999,
		"g": 5000
	},
	"essenceoflife": {
		"type": "material",
		"skin": "essenceoflife",
		"name": "Essence of Life",
		"explanation": "Full of life, literally.",
		"s": 9999,
		"g": 1
	},
	"essenceofgreed": {
		"type": "material",
		"skin": "essenceofgreed",
		"name": "Essence of Greed",
		"explanation": "A peculiar material.",
		"s": 9999,
		"g": 13441344
	},
	"emptyjar": {
		"type": "jar",
		"skin": "emptyjar",
		"name": "Empty Jar",
		"explanation": "Always nice to have some empty jars lying around, you never know when you'll need one!",
		"s": 9999,
		"g": 1
	},
	"cxjar": {
		"type": "jar",
		"skin": "cxjar",
		"name": "CX Jar",
		"explanation": "An appearance liquified and stored inside a jar.",
		"exclusive": true,
		"s": 9999,
		"g": 1
	},
	"emotionjar": {
		"type": "jar",
		"skin": "emotionjar",
		"name": "Emotion Jar",
		"explanation": "An emotion liquified and stored inside a jar.",
		"exclusive": true,
		"s": 9999,
		"g": 1
	},
	"bottleofxp": {
		"type": "xp",
		"skin": "bottleofxp",
		"name": "Bottle of XP",
		"explanation": "Legacy item with no effect on skill progression. It is not consumed.",
		"s": 20,
		"g": 12000000
	},
	"nheart": {
		"type": "material",
		"skin": "nheart",
		"name": "Heartwood Core",
		"explanation": "An ancient source of life. A small piece of a magnificent being that spanned life across our realm eons ago.",
		"s": 9999,
		"g": 12000000
	},
	"ledger": {
		"type": "misc",
		"skin": "ledger",
		"name": "Ledger",
		"explanation": "Every decent merchant needs one!",
		"ignore": true,
		"g": 12000
	},
	"storagebox": {
		"type": "misc",
		"skin": "storagebox",
		"name": "Storage Box",
		"ignore": true,
		"explanation": "It's a nifty little box",
		"s": 9999,
		"g": 9000
	},
	"mysterybox": {
		"type": "misc",
		"skin": "mysterybox",
		"name": "Mystery Box",
		"explanation": "It looks super cool, but you have no idea what to do with it! Exchange now or wait? No idea.",
		"g": 12000000,
		"s": 9999,
		"e": 1
	},
	"troll": {
		"type": "misc",
		"skin": "troll",
		"name": "T-Shirt Roll",
		"explanation": "A random T-Shirt!",
		"g": 12000,
		"e": 1,
		"s": 9999
	},
	"brownegg": {
		"type": "material",
		"skin": "brownegg",
		"name": "Brown Egg",
		"s": 100,
		"g": 1000
	},
	"whiteegg": {
		"type": "material",
		"skin": "whiteegg",
		"name": "White Egg",
		"s": 2000,
		"g": 5,
		"throw": true,
		"action": "THROW!",
		"onclick": "socket.emit('throw',{num:locate_item('whiteegg'),x:character.real_x,y:character.real_y}); push_deferred('throw')"
	},
	"gslime": {
		"type": "material",
		"skin": "gslime",
		"name": "Slime Core",
		"s": 9999,
		"g": 20
	},
	"crabclaw": {
		"type": "material",
		"skin": "crabclaw",
		"name": "Crab Claw",
		"s": 9999,
		"g": 120
	},
	"beewings": {
		"type": "material",
		"skin": "beewings",
		"name": "Bee Wings",
		"s": 9999,
		"g": 25
	},
	"pleather": {
		"type": "material",
		"skin": "pleather",
		"name": "Porcupine Leather",
		"s": 9999,
		"g": 400
	},
	"spores": {
		"type": "material",
		"skin": "spores",
		"name": "Spores",
		"s": 9999,
		"g": 120
	},
	"lotusf": {
		"type": "material",
		"skin": "lotusf",
		"name": "Lotus Flower",
		"s": 9999,
		"g": 12000
	},
	"frogt": {
		"type": "material",
		"skin": "frogt",
		"name": "Frog Tongue",
		"s": 9999,
		"g": 3
	},
	"snakefang": {
		"type": "material",
		"skin": "snakefang",
		"name": "Snake Fang",
		"s": 9999,
		"g": 1200
	},
	"rattail": {
		"type": "material",
		"skin": "rattail",
		"name": "Rat Tail",
		"s": 9999,
		"g": 2
	},
	"ascale": {
		"type": "material",
		"skin": "ascale",
		"name": "Armadillo Scale",
		"s": 9999,
		"g": 500
	},
	"ink": {
		"type": "material",
		"skin": "ink",
		"name": "Ink",
		"s": 9999,
		"g": 5000
	},
	"ijx": {
		"type": "material",
		"skin": "ijx",
		"name": "Irradium",
		"s": 9999,
		"g": 360000
	},
	"smush": {
		"type": "material",
		"skin": "smush",
		"name": "Small Mushroom",
		"s": 9999,
		"g": 87
	},
	"carrot": {
		"type": "material",
		"skin": "carrot",
		"name": "Carrot",
		"s": 9999,
		"g": 4
	},
	"bfur": {
		"type": "material",
		"skin": "bfur",
		"name": "Bee Fur",
		"s": 9999,
		"g": 5
	},
	"bandages": {
		"type": "material",
		"skin": "bandages",
		"name": "Bandages",
		"s": 9999,
		"g": 26
	},
	"cocoon": {
		"type": "material",
		"skin": "cocoon",
		"name": "Cocoon",
		"s": 9999,
		"g": 200
	},
	"tshell": {
		"type": "material",
		"skin": "tshell",
		"name": "Turtle Shell",
		"s": 9999,
		"g": 1200
	},
	"dstones": {
		"type": "material",
		"skin": "dstones",
		"name": "Digestive Stones",
		"s": 9999,
		"g": 90
	},
	"bwing": {
		"type": "material",
		"skin": "bwing",
		"name": "Bat Wing",
		"s": 9999,
		"g": 120
	},
	"bfang": {
		"type": "material",
		"skin": "bfang",
		"name": "Bat Fang",
		"s": 9999,
		"g": 24000
	},
	"sstinger": {
		"type": "material",
		"skin": "sstinger",
		"name": "Scorpion Stinger",
		"s": 9999,
		"g": 4000
	},
	"svenom": {
		"type": "material",
		"skin": "svenom",
		"name": "Scorpion Venom",
		"s": 9999,
		"g": 12000
	},
	"pstem": {
		"type": "material",
		"skin": "pstem",
		"name": "Pumpkin Stem",
		"s": 9999,
		"g": 5
	},
	"watercore": {
		"type": "material",
		"skin": "watercore",
		"name": "Water Core",
		"s": 9999,
		"g": 800000
	},
	"ectoplasm": {
		"type": "material",
		"skin": "ectoplasm",
		"name": "Ectoplasm",
		"s": 9999,
		"g": 60000
	},
	"rfur": {
		"type": "material",
		"skin": "rfur",
		"name": "Rat Fur",
		"s": 9999,
		"g": 40
	},
	"cshell": {
		"type": "material",
		"skin": "cshell",
		"name": "Crab Shell",
		"s": 9999,
		"g": 32000
	},
	"bcandle": {
		"type": "material",
		"skin": "bcandle",
		"name": "Burning Candle",
		"s": 9999,
		"g": 420000
	},
	"lspores": {
		"type": "material",
		"skin": "lspores",
		"name": "Large Spores",
		"s": 9999,
		"g": 160
	},
	"trinkets": {
		"type": "material",
		"skin": "trinkets",
		"name": "Trinkets",
		"s": 9999,
		"g": 200000
	},
	"rfangs": {
		"type": "material",
		"skin": "rfangs",
		"name": "Rat Fangs",
		"s": 9999,
		"g": 12000
	},
	"btusk": {
		"type": "material",
		"skin": "btusk",
		"name": "Boar Tusk",
		"s": 9999,
		"g": 50000
	},
	"drapes": {
		"type": "material",
		"skin": "drapes",
		"name": "Drapes",
		"s": 9999,
		"g": 480
	},
	"stand0": {
		"type": "stand",
		"skin": "stand0",
		"stand": "stand0",
		"name": "Merchant Stand",
		"explanation": "You can become a merchant using this item.",
		"g": 40000
	},
	"stand1": {
		"type": "stand",
		"skin": "stand1",
		"stand": "stand1",
		"name": "Merchant Stand [Sell+Buy]",
		"explanation": "You can become a merchant using this item.",
		"ignore": true,
		"g": 400000
	},
	"tracker": {
		"type": "tracker",
		"skin": "tracker",
		"name": "Tracktrix",
		"explanation": "A tool that tracks all your experiences and encounters in Adventure Land so you can learn from them and grow as an adventurer!",
		"special": true,
		"g": 12,
		"acolor": "#B969CE",
		"action": "INTERFACE!",
		"onclick": "socket.emit('tracker')"
	},
	"computer": {
		"type": "computer",
		"skin": "ancientcomputer",
		"name": "Ancient Computer",
		"special": true,
		"stand": "cstand",
		"explanation": "Networks you to NPCs and extends the CODE capabilities.",
		"g": 64000000
	},
	"supercomputer": {
		"type": "computer",
		"skin": "ancientcomputer",
		"name": "Super Computer",
		"special": true,
		"stand": "cstand",
		"explanation": "Networks you to NPCs, extends the CODE capabilities and tracks your encounters.",
		"g": 64000000
	},
	"stick": {
		"type": "misc",
		"skin": "stick",
		"g": 299999,
		"name": "Stick",
		"explanation": "...",
		"a": true,
		"upgrade": {},
		"grades": [
			4,
			7,
			10,
			12
		]
	},
	"coal": {
		"type": "misc",
		"skin": "coal",
		"g": 10,
		"name": "Coal",
		"explanation": "...",
		"a": true,
		"compound": {}
	},
	"glitch": {
		"type": "misc",
		"skin": "glitch",
		"g": 10000,
		"name": "A Glitch",
		"explanation": "Huh?! ??!",
		"ignore": true,
		"event": true,
		"a": true,
		"e": 1
	},
	"5bucks": {
		"type": "misc",
		"skin": "5bucks",
		"g": 5,
		"name": "Old Paper Money",
		"explanation": "It's not gold. Must be worthless.",
		"s": 9999,
		"rare": true,
		"e": 1
	},
	"confetti": {
		"type": "throw",
		"skin": "confetti",
		"g": 20,
		"name": "Pack of Confetti",
		"explanation": "To celebrate good times",
		"s": 9999,
		"throw": true,
		"action": "THROW!",
		"onclick": "socket.emit('throw',{num:locate_item('confetti'),x:character.real_x,y:character.real_y}); push_deferred('throw')"
	},
	"firecrackers": {
		"type": "throw",
		"skin": "firecrackers",
		"g": 20,
		"name": "Firecracker",
		"explanation": "Scary but harmless",
		"s": 9999,
		"throw": true,
		"action": "THROW!",
		"onclick": "socket.emit('throw',{num:locate_item('firecrackers'),x:character.real_x,y:character.real_y}); push_deferred('throw')"
	},
	"smoke": {
		"type": "throw",
		"skin": "smoke",
		"g": 20,
		"name": "Pouch of Poof",
		"explanation": "A pyrotechnic pouch, developed for those who want to feel like a rogue.",
		"s": 100,
		"throw": true,
		"action": "THROW!",
		"onclick": "socket.emit('throw',{num:locate_item('smoke'),x:character.real_x,y:character.real_y}); push_deferred('throw')"
	},
	"snowball": {
		"type": "throw",
		"skin": "snowball",
		"g": 1,
		"name": "Snowball",
		"explanation": "Be careful not to hit someone in the ear!",
		"s": 200
	},
	"figurine": {
		"type": "spawner",
		"skin": "figurine",
		"spawn": "terracota",
		"name": "Terracota Army Figurine",
		"ignore": true,
		"note": "Summons an ancient soldier to fight for you",
		"action": "BREAK!",
		"s": 9999,
		"g": 40000
	},
	"pvptoken": {
		"type": "token",
		"skin": "pvptoken",
		"name": "PVP Token",
		"explanation": "A token representing valour in battles. Collect them from PVP events and exchange them for treasures!",
		"s": 9999,
		"g": 24000
	},
	"funtoken": {
		"type": "token",
		"skin": "funtoken",
		"name": "Fun Token",
		"explanation": "A token representing fun with friends. Collect them from Daily events and exchange them for treasures!",
		"s": 9999,
		"g": 12000
	},
	"monstertoken": {
		"type": "token",
		"skin": "monstertoken",
		"name": "Monster Token",
		"explanation": "A token representing the hunt. You made Adventure Land a safer place for all. Be proud!",
		"npc": "monsterhunter",
		"s": 9999,
		"g": 12000
	},
	"friendtoken": {
		"type": "token",
		"skin": "friendtoken",
		"name": "Friend Token",
		"explanation": "A token representing friendship. Awarded each time a friend joins the adventure!",
		"s": 9999,
		"g": 36000
	},
	"emptyheart": {
		"type": "material",
		"skin": "emptyheart",
		"name": "Empty Heart",
		"explanation": "A cold empty stone heart",
		"s": 9999,
		"g": 12000,
		"event": true
	},
	"fieldgen0": {
		"type": "spawner",
		"skin": "fieldgen0",
		"spawn": "fieldgen0",
		"name": "Dampening Field Generator",
		"explanation": "Summon a robot generating a dampening field that prevents teleportation of any kind!",
		"g": 2000000
	},
	"seashell": {
		"type": "quest",
		"skin": "seashell",
		"name": "Seashell",
		"explanation": "A beautiful seashell.",
		"g": 800,
		"e": 20,
		"s": 9999,
		"quest": "seashell"
	},
	"leather": {
		"type": "quest",
		"skin": "leather",
		"name": "Leather",
		"explanation": "A Leather piece.",
		"g": 3000,
		"e": 40,
		"s": 9999,
		"quest": "leather"
	},
	"gemfragment": {
		"type": "quest",
		"skin": "gemfragment",
		"name": "Gem Fragment",
		"explanation": "Beautiful, yet broken. Would be extremely valuable if they were whole.",
		"g": 32000,
		"e": 50,
		"s": 9999,
		"quest": "gemfragment"
	},
	"ornament": {
		"type": "quest",
		"skin": "ornament",
		"name": "Xmas Ornament",
		"explanation": "A beautiful ornament. A bunch of these could decorate the trees of Winterland.",
		"g": 3000,
		"e": 20,
		"s": 9999
	},
	"lostearring": {
		"type": "earring",
		"skin": "lostearring",
		"name": "Gold Earring",
		"explanation": "Looks valuable",
		"g": 360000,
		"grades": [
			0,
			2,
			6,
			7
		],
		"e": 1,
		"edge": -2,
		"a": true,
		"compound": {},
		"quest": "lostearring"
	},
	"stonekey": {
		"type": "dungeon_key",
		"skin": "stonekey",
		"name": "The Stone Key",
		"opens": "therush",
		"g": 50000,
		"explanation": "A stone key, imbued with magical energy.",
		"s": 50
	},
	"cryptkey": {
		"type": "dungeon_key",
		"skin": "cryptkey",
		"name": "The Crypt Key",
		"opens": "crypt",
		"g": 50000,
		"explanation": "A key, imbued with magical energy.",
		"s": 50
	},
	"frozenkey": {
		"type": "dungeon_key",
		"skin": "frozenkey",
		"name": "The Frozen Cave Key",
		"opens": "winter_instance",
		"g": 50000,
		"explanation": "A key, imbued with magical energy.",
		"s": 50
	},
	"tombkey": {
		"type": "dungeon_key",
		"skin": "tombkey",
		"name": "The Tomb Key",
		"opens": "tomb",
		"g": 50000,
		"explanation": "A key, imbued with magical energy.",
		"s": 50
	},
	"spiderkey": {
		"type": "dungeon_key",
		"skin": "spiderkey",
		"name": "The Spider Key",
		"opens": "spider_instance",
		"g": 50000,
		"explanation": "A key, imbued with magical energy.",
		"s": 50
	},
	"bkey": {
		"type": "bank_key",
		"skin": "bkey",
		"name": "The Bank Key",
		"unlocks": "bank_b",
		"g": 5000000,
		"s": 50,
		"explanation": "Key to the bank's basement",
		"action": "UNLOCK",
		"onclick": "socket.emit('activate',{num:locate_item('bkey')})"
	},
	"ukey": {
		"type": "bank_key",
		"skin": "ukey",
		"name": "The Bank Key",
		"unlocks": "bank_u",
		"s": 50,
		"g": 50000000,
		"explanation": "Key to the bank's underground",
		"action": "UNLOCK",
		"onclick": "socket.emit('activate',{num:locate_item('ukey')})"
	},
	"dkey": {
		"type": "bank_key",
		"skin": "dkey",
		"name": "Diamond Key",
		"s": 50,
		"g": 72000000,
		"explanation": "A key that unlocks any teller!",
		"action": "UNLOCK",
		"onclick": "socket.emit('activate',{num:locate_item('dkey')})"
	},
	"x0": {
		"type": "quest",
		"skin": "x0",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x1": {
		"type": "quest",
		"skin": "x1",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x2": {
		"type": "quest",
		"skin": "x2",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x3": {
		"type": "quest",
		"skin": "x3",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x4": {
		"type": "quest",
		"skin": "x4",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x5": {
		"type": "quest",
		"skin": "x5",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x6": {
		"type": "quest",
		"skin": "x6",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x7": {
		"type": "quest",
		"skin": "x7",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"x8": {
		"type": "quest",
		"skin": "x8",
		"name": "Quantum Piece",
		"g": 4000,
		"s": 9999,
		"a": true,
		"event": true,
		"explanation": "A unique component of a curious puzzle"
	},
	"xbox": {
		"type": "quest",
		"skin": "xbox",
		"name": "Xmas Box",
		"g": 1000000,
		"e": 1,
		"s": 9999,
		"a": true,
		"explanation": "Finally... They all came together. A unique gift lies within this box. Take it to Xyn to be unlocked."
	},
	"egg0": {
		"type": "quest",
		"skin": "egg0",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg1": {
		"type": "quest",
		"skin": "egg1",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg2": {
		"type": "quest",
		"skin": "egg2",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg3": {
		"type": "quest",
		"skin": "egg3",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg4": {
		"type": "quest",
		"skin": "egg4",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg5": {
		"type": "quest",
		"skin": "egg5",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg6": {
		"type": "quest",
		"skin": "egg6",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg7": {
		"type": "quest",
		"skin": "egg7",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"egg8": {
		"type": "quest",
		"skin": "egg8",
		"name": "Easter Egg",
		"g": 4000,
		"s": 9999,
		"explanation": "A uniquely painted Egg!"
	},
	"goldenegg": {
		"type": "quest",
		"skin": "goldenegg",
		"name": "Golden Egg",
		"g": 60000,
		"e": 1,
		"event": true,
		"s": 9999,
		"a": true,
		"explanation": "Nope, it's not painted, an actual golden egg!"
	},
	"basketofeggs": {
		"type": "quest",
		"skin": "basketofeggs",
		"name": "Basket of Easter Eggs",
		"g": 20000,
		"e": 1,
		"s": 9999,
		"explanation": "A basket full of unique easter eggs. You can probably exchange this for a cool reward."
	},
	"frozenstone": {
		"type": "activator",
		"skin": "frozenstone",
		"name": "Frozen Stone",
		"g": 20000,
		"s": 9999,
		"explanation": "It's strangely not cold, must be a magical artifact.",
		"action": "SHAKE",
		"onclick": "socket.emit('activate',{num:locate_item('frozenstone')})"
	},
	"orbg": {
		"type": "orb",
		"skin": "orbg",
		"compound": {
			"damage": 2,
			"throw_range": 3,
			"mp": 15,
			"attacks_per_second": 0.0018125,
			"base_crit": 0.2
		},
		"name": "Orb of Beginnings",
		"g": 60000,
		"grades": [
			4,
			6,
			6,
			7
		],
		"damage": 4,
		"throw_range": 6,
		"mp": 30,
		"attacks_per_second": 0.003625,
		"base_crit": 0.4
	},
	"tigerstone": {
		"set": "tiger",
		"type": "orb",
		"skin": "tigerstone",
		"armor": 30,
		"speed": 1,
		"compound": {
			"damage": 1.5,
			"throw_range": 3,
			"hp": 192,
			"mp": 7.5,
			"attacks_per_second": 0.0016875000000000002,
			"base_crit": 0.2
		},
		"name": "Tiger Stone",
		"g": 600000,
		"grades": [
			0,
			1,
			6,
			7
		],
		"damage": 3,
		"throw_range": 6,
		"hp": 480,
		"mp": 15,
		"attacks_per_second": 0.0033750000000000004,
		"base_crit": 0.4
	},
	"vorb": {
		"set": "vampires",
		"type": "orb",
		"skin": "vorb",
		"courage": 1,
		"pcourage": 1,
		"compound": {
			"courage": 1
		},
		"name": "Vampiric Canine Teeth",
		"g": 12000000,
		"grades": [
			0,
			0,
			6,
			7
		]
	},
	"orbofvit": {
		"type": "orb",
		"skin": "orbofvit",
		"compound": {
			"hp": 192
		},
		"name": "Orb of Vitality",
		"g": 240000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"edge": -2,
		"hp": 480
	},
	"orbofint": {
		"type": "orb",
		"skin": "orbofint",
		"compound": {
			"damage": 3,
			"mp": 45,
			"attacks_per_second": 0.00075
		},
		"name": "Orb of Intelligence",
		"g": 240000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"edge": -2,
		"damage": 4,
		"mp": 60,
		"attacks_per_second": 0.001
	},
	"orbofstr": {
		"type": "orb",
		"skin": "orbofstr",
		"compound": {
			"damage": 3,
			"throw_range": 9
		},
		"name": "Orb of Strength",
		"g": 240000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"edge": -2,
		"damage": 4,
		"throw_range": 12
	},
	"orbofdex": {
		"type": "orb",
		"skin": "orbofdex",
		"compound": {
			"attacks_per_second": 0.0046875,
			"base_crit": 0.6
		},
		"name": "Orb of Dexterity",
		"g": 240000,
		"grades": [
			1,
			4,
			6,
			7
		],
		"edge": -2,
		"attacks_per_second": 0.00625,
		"base_crit": 0.8
	},
	"orboffire": {
		"type": "orb",
		"skin": "orboffire",
		"firesistance": 15,
		"compound": {
			"firesistance": 5
		},
		"name": "Orb of Fire",
		"g": 60000,
		"grades": [
			0,
			3,
			6,
			7
		],
		"edge": -2
	},
	"orboffrost": {
		"type": "orb",
		"skin": "orboffrost",
		"fzresistance": 15,
		"compound": {
			"fzresistance": 5
		},
		"name": "Orb of Frost",
		"g": 60000,
		"grades": [
			0,
			3,
			6,
			7
		],
		"edge": -2
	},
	"orbofplague": {
		"type": "orb",
		"skin": "orbofplague",
		"pnresistance": 15,
		"compound": {
			"pnresistance": 5
		},
		"name": "Orb of Plague",
		"g": 60000,
		"grades": [
			0,
			3,
			6,
			7
		],
		"edge": -2
	},
	"orbofresolve": {
		"type": "orb",
		"skin": "orbofresolve",
		"phresistance": 15,
		"compound": {
			"phresistance": 5
		},
		"name": "Orb of Resolve",
		"g": 60000,
		"grades": [
			0,
			3,
			6,
			7
		],
		"edge": -2
	},
	"orba": {
		"type": "orb",
		"skin": "orba",
		"firesistance": 15,
		"fzresistance": 15,
		"pnresistance": 15,
		"phresistance": 15,
		"compound": {
			"firesistance": 5,
			"fzresistance": 5,
			"pnresistance": 5,
			"phresistance": 5
		},
		"name": "Orb of Adventures",
		"g": 240000,
		"grades": [
			0,
			2,
			6,
			7
		],
		"edge": -2
	},
	"orboftemporal": {
		"set": "holidays",
		"type": "orb",
		"skin": "orboftemporal",
		"ability": "temporalsurge",
		"evasion": 5,
		"compound": {
			"evasion": 4
		},
		"name": "Orb of Temporal Forces",
		"g": 1200000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true
	},
	"orbofsc": {
		"set": "holidays",
		"type": "orb",
		"skin": "orbofsc",
		"mp": 230,
		"ability": "secondchance",
		"attr0": 1,
		"compound": {
			"mp": 130,
			"attr0": 1,
			"damage": 3,
			"throw_range": 3,
			"hp": 48,
			"attacks_per_second": 0.0020625,
			"base_crit": 0.2
		},
		"name": "Orb of Second Chances",
		"g": 120000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true,
		"damage": 4,
		"throw_range": 6,
		"hp": 96,
		"attacks_per_second": 0.003625,
		"base_crit": 0.4
	},
	"charmer": {
		"type": "orb",
		"skin": "charmer",
		"name": "Charmer",
		"ability": "charm",
		"attr0": 1,
		"compound": {
			"attr0": 1,
			"hp": 480
		},
		"g": 120000,
		"grades": [
			0,
			3,
			6,
			7
		],
		"event": true,
		"hp": 480
	},
	"rabbitsfoot": {
		"type": "orb",
		"skin": "rabbitsfoot",
		"luck": 10,
		"compound": {
			"luck": 5
		},
		"name": "Rabbit's Foot",
		"g": 120000,
		"grades": [
			0,
			0,
			6,
			7
		],
		"a": true,
		"explanation": "Taken from a rabbit who lived a long and happy life, after the natural death occurred, with pre-consent"
	},
	"talkingskull": {
		"type": "orb",
		"skin": "talkingskull",
		"xp": 5,
		"compound": {
			"xp": 5
		},
		"name": "Yorick the Talking Skull",
		"explanation": "Endless wisdom",
		"g": 96000,
		"grades": [
			1,
			2,
			6,
			7
		],
		"a": true
	},
	"jacko": {
		"type": "orb",
		"skin": "jacko",
		"rpiercing": 20,
		"compound": {
			"rpiercing": 15
		},
		"name": "Jack-o Lantern",
		"ability": "scare",
		"g": 96000,
		"grades": [
			2,
			4,
			6,
			7
		],
		"a": true,
		"cx": {
			"scale": 0.5
		}
	},
	"ftrinket": {
		"type": "orb",
		"skin": "ftrinket",
		"armor": 5,
		"speed": 0.5,
		"compound": {
			"armor": 5,
			"speed": 1,
			"hp": 144
		},
		"name": "Trinket of Faith",
		"explanation": "Good things come to those who wait",
		"g": 96000,
		"grades": [
			1,
			3,
			6,
			7
		],
		"a": true,
		"damage": 4,
		"throw_range": 6,
		"hp": 96,
		"mp": 30,
		"attacks_per_second": 0.003625,
		"base_crit": 0.4
	},
	"eggnog": {
		"type": "elixir",
		"skin": "eggnog",
		"hp": 1200,
		"evasion": 2.5,
		"duration": 48,
		"name": "Eggnog",
		"explanation": "Fills your heart with warmth and joy.",
		"s": 9999,
		"g": 6000,
		"skin_a": "eggnog"
	},
	"vblood": {
		"set": "vampires",
		"type": "elixir",
		"skin": "vblood",
		"lifesteal": 20,
		"duration": 1,
		"name": "Vampire's Blood",
		"explanation": "Just a tiny sip",
		"s": 9999,
		"g": 240000,
		"withdrawal": "withdrawal",
		"skin_a": "vblood"
	},
	"gum": {
		"type": "elixir",
		"skin": "gum",
		"hp": 40,
		"reflection": 0.2,
		"duration": 120,
		"name": "Gum",
		"explanation": "Nice flavour",
		"s": 9999,
		"eat": true,
		"g": 100,
		"skin_a": "gum"
	},
	"hotchocolate": {
		"type": "elixir",
		"skin": "hotchocolate",
		"armor": 30,
		"resistance": 30,
		"duration": 1,
		"name": "Hot Chocolate",
		"explanation": "Fills your heart with warmth.",
		"s": 9999,
		"g": 6000,
		"skin_a": "hotchocolate",
		"hp": 1440
	},
	"pumpkinspice": {
		"type": "elixir",
		"skin": "pumpkinspice",
		"mp": -400,
		"crit": 5,
		"reflection": 2,
		"duration": 8,
		"name": "Pumpkin Spice Latte",
		"explanation": "Produced in bulk during the Halloween season. WARNING: The pumpkin comes from a non-vegetable source",
		"s": 9999,
		"g": 200,
		"skin_a": "pumpkinspice"
	},
	"cake": {
		"type": "elixir",
		"skin": "cake",
		"hp": 2400,
		"speed": -30,
		"duration": 6,
		"name": "Piece of Cake",
		"explanation": "Delicious.",
		"s": 9999,
		"eat": true,
		"g": 100,
		"skin_a": "cake"
	},
	"greenbomb": {
		"type": "elixir",
		"skin": "greenbomb",
		"crit": 10,
		"speed": 30,
		"resistance": -800,
		"duration": 0.002,
		"name": "Green Bomb",
		"explanation": "It's a candy with very questionable ingredients, might be addictive.",
		"a": true,
		"s": 9999,
		"eat": true,
		"withdrawal": "withdrawal",
		"g": 10000,
		"skin_a": "greenbomb",
		"damage": 50,
		"throw_range": 150,
		"attacks_per_second": 0.1875,
		"base_crit": 24
	},
	"swirlipop": {
		"type": "elixir",
		"skin": "swirlipop",
		"evasion": 90,
		"resistance": -300,
		"duration": 0.008,
		"name": "Swirlipop",
		"explanation": "A dizzying candy, has some benefits.",
		"a": true,
		"s": 9999,
		"eat": true,
		"withdrawal": "withdrawal",
		"g": 10000,
		"skin_a": "swirlipop",
		"damage": -40,
		"mp": -600,
		"attacks_per_second": -0.01
	},
	"xshot": {
		"type": "elixir",
		"skin": "xshot",
		"duration": 1e-12,
		"name": "X-Shot",
		"explanation": "Increases your luck in gambling a hundredfold! Warning: Some establishments might screen you before taking a bet. Can be detected in your blood for 12 hours",
		"s": 40,
		"g": 1,
		"withdrawal": "xshotted",
		"skin_a": "xshot"
	},
	"espresso": {
		"type": "elixir",
		"skin": "espresso",
		"speed": 24,
		"duration": 0.0005,
		"name": "Espresso",
		"s": 9999,
		"g": 12000,
		"skin_a": "espresso"
	},
	"whiskey": {
		"type": "elixir",
		"skin": "whiskey",
		"speed": -12,
		"miss": 50,
		"apiercing": 500,
		"duration": 0.1,
		"name": "Whiskey On The Rocks",
		"s": 9999,
		"g": 120000,
		"skin_a": "whiskey"
	},
	"wine": {
		"type": "elixir",
		"skin": "wine",
		"speed": -12,
		"miss": 32,
		"duration": 0.1,
		"name": "Red Wine",
		"s": 9999,
		"g": 40000,
		"skin_a": "wine",
		"hp": 1536
	},
	"ale": {
		"type": "elixir",
		"skin": "ale",
		"speed": -6,
		"miss": 20,
		"duration": 0.05,
		"name": "Ale",
		"s": 9999,
		"g": 24000,
		"skin_a": "ale",
		"damage": 24,
		"throw_range": 72
	},
	"pico": {
		"type": "elixir",
		"skin": "pico",
		"miss": 15,
		"crit": 20,
		"rpiercing": 100,
		"duration": 0.05,
		"name": "Pixel Colada",
		"s": 9999,
		"g": 150000,
		"skin_a": "pico"
	},
	"blue": {
		"type": "elixir",
		"skin": "blue",
		"miss": 24,
		"evasion": 50,
		"duration": 0.05,
		"name": "Blue Horizon",
		"s": 9999,
		"g": 150000,
		"skin_a": "blue"
	},
	"bunnyelixir": {
		"type": "elixir",
		"skin": "bunnyelixir",
		"hp": 1120,
		"mp": 300,
		"speed": 12,
		"duration": 2,
		"name": "Bunny Energy Drink",
		"explanation": "Ingredients: Rabbit sweat, bubble gum flavour",
		"s": 9999,
		"g": 6000,
		"skin_a": "bunnyelixir",
		"attacks_per_second": 0.00625,
		"base_crit": 0.8
	},
	"elixirvit0": {
		"type": "elixir",
		"skin": "elixirvit0",
		"duration": 12,
		"name": "Elixir of Vitality",
		"s": 9999,
		"g": 6000,
		"skin_a": "elixirvit0",
		"hp": 384
	},
	"elixirvit1": {
		"type": "elixir",
		"skin": "elixirvit1",
		"duration": 24,
		"name": "Elixir of Greater Vitality",
		"s": 9999,
		"g": 20000,
		"skin_a": "elixirvit1",
		"hp": 576
	},
	"elixirvit2": {
		"type": "elixir",
		"skin": "elixirvit2",
		"duration": 48,
		"name": "Elixir of Extreme Vitality",
		"s": 9999,
		"g": 120000,
		"a": true,
		"skin_a": "elixirvit2",
		"hp": 864
	},
	"elixirstr0": {
		"type": "elixir",
		"skin": "elixirstr0",
		"duration": 12,
		"name": "Elixir of Strength",
		"s": 9999,
		"g": 6000,
		"skin_a": "elixirstr0",
		"damage": 6,
		"throw_range": 18
	},
	"elixirstr1": {
		"type": "elixir",
		"skin": "elixirstr1",
		"duration": 24,
		"name": "Elixir of Greater Strength",
		"s": 9999,
		"g": 20000,
		"skin_a": "elixirstr1",
		"damage": 8,
		"throw_range": 24
	},
	"elixirstr2": {
		"type": "elixir",
		"skin": "elixirstr2",
		"duration": 48,
		"name": "Elixir of Extreme Strength",
		"s": 9999,
		"g": 120000,
		"a": true,
		"skin_a": "elixirstr2",
		"damage": 12,
		"throw_range": 36
	},
	"elixirdex0": {
		"type": "elixir",
		"skin": "elixirdex0",
		"duration": 12,
		"name": "Elixir of Dexterity",
		"s": 9999,
		"g": 6000,
		"skin_a": "elixirdex0",
		"attacks_per_second": 0.009375,
		"base_crit": 1.2
	},
	"elixirdex1": {
		"type": "elixir",
		"skin": "elixirdex1",
		"duration": 24,
		"name": "Elixir of Greater Dexterity",
		"s": 9999,
		"g": 20000,
		"skin_a": "elixirdex1",
		"attacks_per_second": 0.0125,
		"base_crit": 1.6
	},
	"elixirdex2": {
		"type": "elixir",
		"skin": "elixirdex2",
		"duration": 48,
		"name": "Elixir of Extreme Dexterity",
		"s": 9999,
		"g": 120000,
		"a": true,
		"skin_a": "elixirdex2",
		"attacks_per_second": 0.01875,
		"base_crit": 2.4
	},
	"elixirint0": {
		"type": "elixir",
		"skin": "elixirint0",
		"duration": 12,
		"name": "Elixir of Intelligence",
		"s": 9999,
		"g": 6000,
		"skin_a": "elixirint0",
		"damage": 6,
		"mp": 90,
		"attacks_per_second": 0.0015
	},
	"elixirint1": {
		"type": "elixir",
		"skin": "elixirint1",
		"duration": 24,
		"name": "Elixir of Greater Intelligence",
		"s": 9999,
		"g": 20000,
		"skin_a": "elixirint1",
		"damage": 8,
		"mp": 120,
		"attacks_per_second": 0.002
	},
	"elixirint2": {
		"type": "elixir",
		"skin": "elixirint2",
		"duration": 48,
		"name": "Elixir of Extreme Intelligence",
		"s": 9999,
		"g": 120000,
		"a": true,
		"skin_a": "elixirint2",
		"damage": 12,
		"mp": 180,
		"attacks_per_second": 0.003
	},
	"elixirluck": {
		"type": "elixir",
		"skin": "elixirluck",
		"luck": 16,
		"duration": 12,
		"name": "Liquid Luck",
		"s": 9999,
		"g": 240000,
		"a": true,
		"skin_a": "elixirluck"
	},
	"elixirfires": {
		"type": "elixir",
		"skin": "elixirfires",
		"firesistance": 30,
		"duration": 2,
		"name": "Elixir of Fire Resistance",
		"s": 40,
		"g": 240000,
		"a": true,
		"skin_a": "elixirfires"
	},
	"elixirfzres": {
		"type": "elixir",
		"skin": "elixirfzres",
		"fzresistance": 30,
		"duration": 2,
		"name": "Elixir of Freeze Resistance",
		"s": 40,
		"g": 240000,
		"a": true,
		"skin_a": "elixirfzres"
	},
	"elixirpnres": {
		"type": "elixir",
		"skin": "elixirpnres",
		"pnresistance": 30,
		"duration": 2,
		"name": "Elixir of Poison Resistance",
		"s": 40,
		"g": 240000,
		"a": true,
		"skin_a": "elixirpnres"
	},
	"poison": {
		"type": "skill_item",
		"name": "Poison Sack",
		"skin": "poison",
		"explanation": "An organic poison sack, can be used to coat weapons or arrows.",
		"s": 9999,
		"g": 1000
	},
	"shadowstone": {
		"type": "skill_item",
		"name": "Shadow Stone",
		"skin": "shadowstone",
		"explanation": "A stone piece with curious properties, allows the bearer to shift to a parallel reality.",
		"s": 9999,
		"g": 800
	},
	"mbones": {
		"type": "material",
		"name": "Bones",
		"skin": "mbones",
		"explanation": "Scattered, ugly bones.",
		"s": 9999,
		"g": 16
	},
	"cscale": {
		"type": "material",
		"name": "Croc Scale",
		"skin": "cscale",
		"explanation": "A very hard scale, can be sewn onto armors.",
		"s": 9999,
		"g": 200
	},
	"snakeoil": {
		"type": "pot",
		"name": "Snake Oil",
		"skin": "snakeoil",
		"gives": [
			[
				"hp",
				-100
			]
		],
		"debuff": true,
		"rare": true,
		"s": 9999,
		"g": 200
	},
	"feather0": {
		"type": "material",
		"name": "Magical Feather",
		"skin": "feather0",
		"explanation": "Holding this, you understand how those huge birds can fly, it's not a normal feather!",
		"s": 9999,
		"g": 800
	},
	"feather1": {
		"type": "material",
		"name": "Harpy Feather",
		"skin": "feather1",
		"explanation": "Holding this, you understand how those huge harpies can fly, it's not a normal feather!",
		"s": 9999,
		"g": 800
	},
	"bronzeingot": {
		"type": "material",
		"name": "Bronze Ingot",
		"skin": "bronzeingot",
		"explanation": "Solid Bronze",
		"offering": 0.1,
		"s": 100,
		"g": 40000
	},
	"goldingot": {
		"type": "material",
		"name": "Gold Ingot",
		"skin": "goldingot",
		"explanation": "Solid Gold",
		"offering": 1.1,
		"s": 100,
		"g": 2000000
	},
	"platinumingot": {
		"type": "material",
		"name": "Platinum Ingot",
		"skin": "platinumingot",
		"explanation": "Solid Platinum",
		"offering": 2,
		"s": 100,
		"g": 40000000
	},
	"bronzenugget": {
		"type": "material",
		"name": "Bronze Nugget",
		"skin": "bronzenugget",
		"explanation": "Ideal for crafting",
		"s": 1000,
		"g": 3200
	},
	"goldnugget": {
		"type": "material",
		"name": "Gold Nugget",
		"skin": "goldnugget",
		"explanation": "Ideal for crafting",
		"offering": 0,
		"s": 1000,
		"g": 120000
	},
	"platinumnugget": {
		"type": "material",
		"name": "Platinum Nugget",
		"skin": "platinumnugget",
		"explanation": "Ideal for crafting",
		"offering": 1,
		"s": 1000,
		"g": 5200000
	},
	"electronics": {
		"type": "material",
		"name": "Electronics",
		"skin": "electronics",
		"explanation": "Various random electronic components",
		"s": 9999,
		"g": 7
	},
	"spidersilk": {
		"type": "material",
		"name": "Spider Silk",
		"skin": "spidersilk",
		"explanation": "A durable yet sticky material",
		"s": 9999,
		"g": 300
	},
	"flute": {
		"type": "flute",
		"skin": "flute",
		"name": "Flute",
		"explanation": "The sound of each flute is unique and mesmerizing. Your pets will easily recognize the sound of yours and come to your call.",
		"g": 200000000
	},
	"puppyer": {
		"type": "petlicence",
		"skin": "puppyer",
		"name": "Licence to Adopt a Puppy",
		"explanation": "Lets you adopt a puppy once they are ready. You'll have to wait a bit until they are ready to be adopted tho!",
		"g": 10000,
		"s": 9999
	},
	"chrysalis0": {
		"type": "chrysalis",
		"skin": "goldenegg",
		"name": "Dragold's Chrysalis",
		"ignore": true,
		"monster": "dragold",
		"g": 40000,
		"grade": 0,
		"a": true
	},
	"puppy1": {
		"type": "chrysalis",
		"skin": "egg2",
		"name": "Egg",
		"ignore": true,
		"monster": "puppy1",
		"explanation": "A vibrant egg, its inhabitant seems eager to get out.",
		"g": 40000,
		"grade": 0,
		"a": true
	},
	"kitty1": {
		"type": "chrysalis",
		"skin": "egg1",
		"name": "Egg",
		"monster": "kitty1",
		"ignore": true,
		"explanation": "A vibrant egg, its inhabitant seems eager to get out.",
		"g": 40000,
		"grade": 0,
		"a": true
	},
	"monsterbox": {
		"type": "container",
		"ignore": true,
		"skin": "armorbox",
		"name": "Monster Box",
		"explanation": "A magical pet world inside a box.",
		"g": 120000,
		"grade": 0
	},
	"vhelmet": {
		"set": "vampires",
		"tier": 3,
		"type": "helmet",
		"skin": "vgloves",
		"scroll": true,
		"upgrade": {
			"armor": 6,
			"resistance": 6
		},
		"name": "Vampiric Hood",
		"g": 340000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "medium",
		"placeholder_art": true,
		"placeholder_asset": "vgloves",
		"explanation": "Placeholder artwork: uses the existing vgloves asset.",
		"hp": 934,
		"mp": 124,
		"armor": 26,
		"resistance": 8
	},
	"vpants": {
		"set": "vampires",
		"tier": 3,
		"type": "pants",
		"skin": "vattire",
		"scroll": true,
		"upgrade": {
			"armor": 6,
			"hp": 325,
			"lifesteal": 0.2,
			"resistance": 6
		},
		"name": "Vampiric Pants",
		"g": 4800000,
		"grades": [
			0,
			0,
			9,
			10
		],
		"armor_weight": "medium",
		"placeholder_art": true,
		"placeholder_asset": "vattire",
		"explanation": "Placeholder artwork: uses the existing vattire asset.",
		"hp": 1556,
		"mp": 206,
		"armor": 43,
		"resistance": 14
	},
	"mpalhelmet": {
		"class": [
			"warrior"
		],
		"set": "mpaladin",
		"tier": 2.625,
		"type": "helmet",
		"skin": "mwhelmet",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Helmet of the Hunter Paladin",
		"explanation": "Placeholder artwork: uses the existing mwhelmet asset.",
		"g": 64000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"protection": true,
		"armor_weight": "heavy",
		"placeholder_art": true,
		"placeholder_asset": "mwhelmet",
		"hp": 650,
		"mp": 17,
		"armor": 28,
		"resistance": 14
	},
	"mpalarmor": {
		"class": [
			"warrior"
		],
		"set": "mpaladin",
		"tier": 2.625,
		"type": "chest",
		"skin": "mwarmor",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Armor of the Hunter Paladin",
		"explanation": "Placeholder artwork: uses the existing mwarmor asset.",
		"g": 96000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"placeholder_art": true,
		"placeholder_asset": "mwarmor",
		"hp": 2192,
		"mp": 38,
		"armor": 59,
		"resistance": 31
	},
	"mpalpants": {
		"class": [
			"warrior"
		],
		"set": "mpaladin",
		"tier": 2.625,
		"type": "pants",
		"skin": "mwpants",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Underarmor of the Hunter Paladin",
		"explanation": "Placeholder artwork: uses the existing mwpants asset.",
		"g": 128000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"placeholder_art": true,
		"placeholder_asset": "mwpants",
		"hp": 1077,
		"mp": 31,
		"armor": 48,
		"resistance": 28
	},
	"mpalgloves": {
		"class": [
			"warrior"
		],
		"set": "mpaladin",
		"tier": 2.625,
		"type": "gloves",
		"skin": "mwgloves",
		"scroll": true,
		"upgrade": {
			"armor": 7.5,
			"resistance": 7.5
		},
		"name": "Gloves of the Hunter Paladin",
		"explanation": "Placeholder artwork: uses the existing mwgloves asset.",
		"g": 68000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"placeholder_art": true,
		"placeholder_asset": "mwgloves",
		"hp": 427,
		"mp": 14,
		"armor": 17,
		"resistance": 10
	},
	"mpalboots": {
		"class": [
			"warrior"
		],
		"set": "mpaladin",
		"tier": 2.625,
		"type": "shoes",
		"skin": "mwboots",
		"scroll": true,
		"upgrade": {
			"speed": 1.03125,
			"armor": 7.5,
			"resistance": 3.75
		},
		"name": "Boots of the Hunter Paladin",
		"explanation": "Placeholder artwork: uses the existing mwboots asset.",
		"g": 240000,
		"grades": [
			0,
			5,
			10,
			12
		],
		"armor_weight": "heavy",
		"placeholder_art": true,
		"placeholder_asset": "mwboots",
		"hp": 427,
		"mp": 14,
		"armor": 21,
		"resistance": 10
	}
};

var sets={
	"basic": {
		"2": {
			"hp": 1,
			"mp": 1,
			"armor": 1,
			"resistance": 1
		},
		"3": {
			"hp": 1,
			"mp": 1,
			"armor": 1,
			"resistance": 1
		},
		"4": {
			"hp": 1,
			"mp": 1,
			"armor": 1,
			"resistance": 1
		},
		"5": {
			"hp": 1,
			"mp": 1,
			"armor": 1,
			"resistance": 1
		},
		"name": "Basic Armor",
		"items": [
			"helmet",
			"coat",
			"pants",
			"gloves",
			"shoes"
		],
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"helmet"
			],
			"chest": [
				"coat"
			],
			"pants": [
				"pants"
			],
			"gloves": [
				"gloves"
			],
			"shoes": [
				"shoes"
			]
		},
		"armor_progression": {
			"shared_tier": 1,
			"role": "progression",
			"anchor": true
		}
	},
	"tiger": {
		"1": {
			"hp": 1091,
			"mp": 189,
			"armor": 40,
			"resistance": 31,
			"speed": 1,
			"evasion": 1
		},
		"name": "Tigers'",
		"items": [
			"tigerhelmet",
			"tigershield",
			"tigercape",
			"tigerstone"
		],
		"weight": "heavy",
		"bonus_items": {
			"helmet": [
				"tigerhelmet"
			]
		}
	},
	"vampires": {
		"2": {
			"hp": 186,
			"mp": 28,
			"armor": 6,
			"resistance": 2,
			"lifesteal": 1
		},
		"3": {
			"hp": 279,
			"mp": 37,
			"armor": 8,
			"resistance": 3
		},
		"4": {
			"hp": 373,
			"mp": 47,
			"armor": 9,
			"resistance": 3
		},
		"5": {
			"hp": 559,
			"mp": 74,
			"armor": 15,
			"resistance": 5,
			"manasteal": 1
		},
		"name": "Vampires",
		"items": [
			"mcape",
			"vgloves",
			"vboots",
			"vattire",
			"vcape",
			"vorb",
			"vhammer",
			"vdagger",
			"vstaff",
			"vsword",
			"vblood",
			"vring",
			"vhelmet",
			"vpants"
		],
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"vhelmet"
			],
			"chest": [
				"mcape",
				"vattire"
			],
			"pants": [
				"vpants"
			],
			"gloves": [
				"vgloves"
			],
			"shoes": [
				"vboots"
			]
		},
		"armor_progression": {
			"shared_tier": 6,
			"role": "progression",
			"anchor": true
		}
	},
	"mpx": {
		"1": {
			"hp": 259,
			"mp": 160,
			"armor": 24,
			"resistance": 24,
			"mp_reduction": 1,
			"manasteal": 1
		},
		"name": "MP X",
		"items": [
			"mpxbelt",
			"mpxgloves",
			"mpxamulet"
		],
		"weight": "light",
		"bonus_items": {
			"gloves": [
				"mpxgloves"
			]
		}
	},
	"fury": {
		"2": {
			"hp": 1091,
			"mp": 189,
			"armor": 40,
			"resistance": 31,
			"attacks_per_second": 0.01,
			"apiercing": 1
		},
		"name": "Rage and Fury",
		"items": [
			"suckerpunch",
			"fury",
			"fallen"
		],
		"weight": "heavy",
		"bonus_items": {
			"helmet": [
				"fury"
			],
			"pants": [
				"fallen"
			]
		}
	},
	"legends": {
		"3": {
			"hp": 427,
			"mp": 85,
			"armor": 38,
			"resistance": 22,
			"dreturn": 1,
			"reflection": 1
		},
		"name": "The Legends",
		"items": [
			"warpvest",
			"starkillers",
			"powerglove",
			"goldenpowerglove"
		],
		"weight": "heavy",
		"bonus_items": {
			"chest": [
				"warpvest"
			],
			"pants": [
				"starkillers"
			],
			"gloves": [
				"powerglove",
				"goldenpowerglove"
			]
		}
	},
	"swift": {
		"2": {
			"hp": 226,
			"mp": 49,
			"armor": 18,
			"resistance": 16,
			"attacks_per_second": 0.01,
			"evasion": 1
		},
		"name": "Swift Judgement",
		"items": [
			"wingedboots",
			"fierygloves"
		],
		"weight": "medium",
		"bonus_items": {
			"gloves": [
				"fierygloves"
			],
			"shoes": [
				"wingedboots"
			]
		}
	},
	"holidays": {
		"2": {
			"hp": 6,
			"mp": 3,
			"fzresistance": 1
		},
		"3": {
			"hp": 8,
			"mp": 5,
			"armor": 1
		},
		"4": {
			"hp": 10,
			"mp": 6,
			"armor": 1,
			"resistance": 1
		},
		"5": {
			"hp": 17,
			"mp": 9,
			"armor": 1,
			"resistance": 1,
			"stresistance": 1
		},
		"name": "Holiday Spirit",
		"items": [
			"xmashat",
			"xmassweater",
			"xmasshoes",
			"xmaspants",
			"mittens",
			"supermittens",
			"santasbelt",
			"ornamentstaff",
			"candycanesword",
			"merry",
			"orbofsc",
			"mearring",
			"xmace",
			"ringhs",
			"sweaterhs",
			"wbookhs",
			"orboftemporal"
		],
		"explanation": "Every month is December with this set!",
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"xmashat"
			],
			"chest": [
				"xmassweater",
				"sweaterhs"
			],
			"pants": [
				"xmaspants"
			],
			"gloves": [
				"mittens",
				"supermittens"
			],
			"shoes": [
				"xmasshoes"
			]
		}
	},
	"wanderers": {
		"2": {
			"hp": 13,
			"mp": 7,
			"speed": 1
		},
		"3": {
			"hp": 17,
			"mp": 11,
			"armor": 2
		},
		"4": {
			"hp": 22,
			"mp": 13,
			"armor": 2,
			"resistance": 2
		},
		"5": {
			"hp": 37,
			"mp": 20,
			"armor": 2,
			"resistance": 2,
			"range": 1
		},
		"name": "Wanderer's Set",
		"items": [
			"wcap",
			"wattire",
			"wbreeches",
			"wgloves",
			"wshoes"
		],
		"explanation": "Wanderer was a curious adventurer. Traveling from place to place. The items he left over make up a very lucky set when they are combined.",
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"wcap"
			],
			"chest": [
				"wattire"
			],
			"pants": [
				"wbreeches"
			],
			"gloves": [
				"wgloves"
			],
			"shoes": [
				"wshoes"
			]
		},
		"armor_progression": {
			"shared_tier": 2,
			"role": "progression",
			"anchor": true
		}
	},
	"wt3": {
		"2": {
			"hp": 33,
			"mp": 8,
			"armor": 5,
			"resistance": 3,
			"pnresistance": 1
		},
		"3": {
			"hp": 43,
			"mp": 12,
			"armor": 7,
			"resistance": 4
		},
		"4": {
			"hp": 55,
			"mp": 14,
			"armor": 8,
			"resistance": 4
		},
		"5": {
			"hp": 152,
			"mp": 24,
			"armor": 13,
			"resistance": 8,
			"stresistance": 1
		},
		"name": "Heavy Armor",
		"items": [
			"hhelmet",
			"harmor",
			"hboots",
			"hgloves",
			"hpants"
		],
		"weight": "heavy",
		"bonus_items": {
			"helmet": [
				"hhelmet"
			],
			"chest": [
				"harmor"
			],
			"pants": [
				"hpants"
			],
			"gloves": [
				"hgloves"
			],
			"shoes": [
				"hboots"
			]
		},
		"armor_progression": {
			"shared_tier": 4,
			"role": "progression",
			"anchor": true
		}
	},
	"wt4": {
		"2": {
			"hp": 50,
			"mp": 13,
			"armor": 6,
			"resistance": 3,
			"reflection": 1
		},
		"3": {
			"hp": 66,
			"mp": 17,
			"armor": 8,
			"resistance": 4
		},
		"4": {
			"hp": 131,
			"mp": 21,
			"armor": 9,
			"resistance": 6
		},
		"5": {
			"hp": 180,
			"mp": 34,
			"armor": 15,
			"resistance": 9,
			"firesistance": 1
		},
		"name": "Darkforge Armor",
		"items": [
			"xhelmet",
			"xarmor",
			"xboots",
			"xgloves",
			"xpants"
		],
		"weight": "heavy",
		"bonus_items": {
			"helmet": [
				"xhelmet"
			],
			"chest": [
				"xarmor"
			],
			"pants": [
				"xpants"
			],
			"gloves": [
				"xgloves"
			],
			"shoes": [
				"xboots"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "progression",
			"anchor": true
		}
	},
	"rugged": {
		"2": {
			"hp": 11,
			"mp": 5,
			"armor": 3,
			"resistance": 2,
			"pnresistance": 1
		},
		"3": {
			"hp": 15,
			"mp": 6,
			"armor": 4,
			"resistance": 3
		},
		"4": {
			"hp": 19,
			"mp": 8,
			"armor": 4,
			"resistance": 3
		},
		"5": {
			"hp": 79,
			"mp": 12,
			"armor": 7,
			"resistance": 6,
			"phresistance": 1
		},
		"name": "Rugged Set",
		"items": [
			"helmet1",
			"coat1",
			"shoes1",
			"gloves1",
			"pants1"
		],
		"explanation": "Just the right amount of protection for the agile wearer",
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"helmet1"
			],
			"chest": [
				"coat1"
			],
			"pants": [
				"pants1"
			],
			"gloves": [
				"gloves1"
			],
			"shoes": [
				"shoes1"
			]
		},
		"armor_progression": {
			"shared_tier": 3,
			"role": "progression",
			"anchor": true
		}
	},
	"mwarrior": {
		"2": {
			"hp": 149,
			"mp": 4,
			"armor": 7,
			"resistance": 4,
			"crit": 1
		},
		"3": {
			"hp": 186,
			"mp": 7,
			"armor": 7,
			"resistance": 4
		},
		"4": {
			"hp": 242,
			"mp": 7,
			"armor": 10,
			"resistance": 7
		},
		"5": {
			"hp": 390,
			"mp": 10,
			"armor": 17,
			"resistance": 10,
			"apiercing": 1
		},
		"name": "Monster Hunter Warrior",
		"items": [
			"mwhelmet",
			"mwarmor",
			"mwgloves",
			"mwpants",
			"mwboots"
		],
		"explanation": "A set for a noble warrior who serves our realm!",
		"weight": "heavy",
		"bonus_items": {
			"helmet": [
				"mwhelmet"
			],
			"chest": [
				"mwarmor"
			],
			"pants": [
				"mwpants"
			],
			"gloves": [
				"mwgloves"
			],
			"shoes": [
				"mwboots"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	},
	"mmage": {
		"2": {
			"hp": 103,
			"mp": 24,
			"armor": 4,
			"resistance": 4,
			"rpiercing": 1
		},
		"3": {
			"hp": 141,
			"mp": 33,
			"armor": 5,
			"resistance": 5
		},
		"4": {
			"hp": 381,
			"mp": 41,
			"armor": 6,
			"resistance": 6
		},
		"5": {
			"hp": 483,
			"mp": 66,
			"armor": 9,
			"resistance": 9,
			"crit": 1
		},
		"name": "Monster Hunter Mage",
		"items": [
			"mmhat",
			"mmarmor",
			"mmgloves",
			"mmpants",
			"mmshoes"
		],
		"explanation": "A set for a noble mage who serves our realm!",
		"weight": "light",
		"bonus_items": {
			"helmet": [
				"mmhat"
			],
			"chest": [
				"mmarmor"
			],
			"pants": [
				"mmpants"
			],
			"gloves": [
				"mmgloves"
			],
			"shoes": [
				"mmshoes"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	},
	"mpriest": {
		"2": {
			"hp": 103,
			"mp": 24,
			"armor": 4,
			"resistance": 4,
			"mp_reduction": 1
		},
		"3": {
			"hp": 141,
			"mp": 33,
			"armor": 5,
			"resistance": 5
		},
		"4": {
			"hp": 381,
			"mp": 41,
			"armor": 6,
			"resistance": 6
		},
		"5": {
			"hp": 483,
			"mp": 66,
			"armor": 9,
			"resistance": 9,
			"stresistance": 1
		},
		"name": "Monster Hunter Priest",
		"items": [
			"mphat",
			"mparmor",
			"mpgloves",
			"mppants",
			"mpshoes"
		],
		"explanation": "A set for a noble priest who serves our realm!",
		"weight": "light",
		"bonus_items": {
			"helmet": [
				"mphat"
			],
			"chest": [
				"mparmor"
			],
			"pants": [
				"mppants"
			],
			"gloves": [
				"mpgloves"
			],
			"shoes": [
				"mpshoes"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	},
	"mranger": {
		"2": {
			"hp": 175,
			"mp": 16,
			"armor": 5,
			"resistance": 4,
			"range": 1
		},
		"3": {
			"hp": 210,
			"mp": 21,
			"armor": 7,
			"resistance": 5
		},
		"4": {
			"hp": 314,
			"mp": 26,
			"armor": 8,
			"resistance": 6
		},
		"5": {
			"hp": 420,
			"mp": 42,
			"armor": 13,
			"resistance": 10,
			"apiercing": 1
		},
		"name": "Monster Hunter Ranger",
		"items": [
			"mrnhat",
			"mrnarmor",
			"mrngloves",
			"mrnpants",
			"mrnboots"
		],
		"explanation": "A set for a noble ranger who serves our realm!",
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"mrnhat"
			],
			"chest": [
				"mrnarmor"
			],
			"pants": [
				"mrnpants"
			],
			"gloves": [
				"mrngloves"
			],
			"shoes": [
				"mrnboots"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	},
	"mrogue": {
		"2": {
			"hp": 175,
			"mp": 16,
			"armor": 5,
			"resistance": 4,
			"evasion": 1
		},
		"3": {
			"hp": 210,
			"mp": 21,
			"armor": 7,
			"resistance": 5
		},
		"4": {
			"hp": 314,
			"mp": 26,
			"armor": 8,
			"resistance": 6
		},
		"5": {
			"hp": 420,
			"mp": 42,
			"armor": 13,
			"resistance": 10,
			"crit": 1
		},
		"name": "Monster Hunter Rogue",
		"items": [
			"mrhood",
			"mrarmor",
			"mrgloves",
			"mrpants",
			"mrboots"
		],
		"explanation": "A set for a noble rogue who serves our realm!",
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"mrhood"
			],
			"chest": [
				"mrarmor"
			],
			"pants": [
				"mrpants"
			],
			"gloves": [
				"mrgloves"
			],
			"shoes": [
				"mrboots"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	},
	"mmerchant": {
		"2": {
			"hp": 175,
			"mp": 16,
			"armor": 5,
			"resistance": 4,
			"dreturn": 1
		},
		"3": {
			"hp": 210,
			"mp": 21,
			"armor": 7,
			"resistance": 5
		},
		"4": {
			"hp": 314,
			"mp": 26,
			"armor": 8,
			"resistance": 6
		},
		"5": {
			"hp": 420,
			"mp": 42,
			"armor": 13,
			"resistance": 10,
			"speed": 1
		},
		"name": "Monster Hunter Merchant",
		"items": [
			"mchat",
			"mcarmor",
			"mcgloves",
			"mcpants",
			"mcboots"
		],
		"explanation": "A set for a noble merchant who has some friends that serve our realm!",
		"weight": "medium",
		"bonus_items": {
			"helmet": [
				"mchat"
			],
			"chest": [
				"mcarmor"
			],
			"pants": [
				"mcpants"
			],
			"gloves": [
				"mcgloves"
			],
			"shoes": [
				"mcboots"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	},
	"bunny": {
		"3": {
			"hp": 246,
			"mp": 148,
			"armor": 22,
			"resistance": 22,
			"speed": 1,
			"reflection": 1
		},
		"name": "Bunny Set",
		"items": [
			"eears",
			"ecape",
			"epyjamas",
			"eslippers",
			"pinkie",
			"carrotsword"
		],
		"explanation": "An Easter / Bunny themed set!",
		"weight": "light",
		"bonus_items": {
			"helmet": [
				"eears"
			],
			"chest": [
				"epyjamas"
			],
			"shoes": [
				"eslippers"
			]
		}
	},
	"mpaladin": {
		"2": {
			"hp": 149,
			"mp": 4,
			"armor": 7,
			"resistance": 4,
			"lifesteal": 1
		},
		"3": {
			"hp": 186,
			"mp": 7,
			"armor": 7,
			"resistance": 4
		},
		"4": {
			"hp": 242,
			"mp": 7,
			"armor": 10,
			"resistance": 7
		},
		"5": {
			"hp": 390,
			"mp": 10,
			"armor": 17,
			"resistance": 10,
			"stresistance": 1
		},
		"name": "Monster Hunter Paladin",
		"items": [
			"mpalhelmet",
			"mpalarmor",
			"mpalpants",
			"mpalgloves",
			"mpalboots"
		],
		"weight": "heavy",
		"bonus_items": {
			"helmet": [
				"mpalhelmet"
			],
			"chest": [
				"mpalarmor"
			],
			"pants": [
				"mpalpants"
			],
			"gloves": [
				"mpalgloves"
			],
			"shoes": [
				"mpalboots"
			]
		},
		"armor_progression": {
			"shared_tier": 5,
			"role": "hunter_sidegrade",
			"anchor": false
		}
	}
};

var weapon_progression_rank_by_legacy_rank={1:1,2:2,3:2,4:3,5:3,6:4,7:4,8:5,9:5,10:6,11:7};
var weapon_progression_requirements=[1,20,40,60,80,90,99];
var weapon_progression_anchor_ids={blade:true,mace:true,staff:true,wbook0:true,bow:true,claw:true,fsword:true,ololipop:true,firestaff:true,wbook3:true,hbow:true,stinger:true,swifty:true,glolipop:true,froststaff:true,wbook5:true,merry:true,fclaw:true,sword:true,pmaceofthedead:true,arcstaff:true,wbook6:true,crossbow:true,firestars:true,bataxe:true,xmace:true,vstaff:true,wbook8:true,t3bow:true,rapier:true,scythe:true,vhammer:true,wblade:true,wbook9:true,weaver:true,vdagger:true,vsword:true,lmace:true,pinkie:true,wbookhs:true,gbow:true,dragondagger:true};
// The normal rank-four Mage route needs a non-seasonal weapon. Art temporarily reuses the base Staff.
items.arcstaff={type:"weapon",wtype:"staff",tier:2,skin:"staff",placeholder_art:true,placeholder_asset:"staff",name:"Arcane Staff",explanation:"A rank-four Mage progression weapon. Placeholder artwork reuses the Staff.",g:120000,grades:[0,2,10,12],range:20,damage_type:"magical",damage:254,attacks_per_second:.6496,upgrade:{range:3.5,damage:57,attacks_per_second:0},progression:{historical_rank:null,shared_rank:7,role:"progression",requirement:60,reference_level:36,target_dps:165,anchor:true}};
for(var weapon_progression_item_id in items){
	var weapon_progression_item=items[weapon_progression_item_id];
	if(!weapon_progression_item.progression || (!weapon_progression_item.wtype && weapon_progression_item_id.indexOf("wbook")!==0) || !weapon_progression_rank_by_legacy_rank[weapon_progression_item.progression.shared_rank]) continue;
	var weapon_progression_rank=weapon_progression_rank_by_legacy_rank[weapon_progression_item.progression.shared_rank];
	weapon_progression_item.progression.shared_rank=weapon_progression_rank;
	weapon_progression_item.progression.requirement=weapon_progression_requirements[weapon_progression_rank-1];
	weapon_progression_item.progression.anchor=!!weapon_progression_anchor_ids[weapon_progression_item_id];
	if(weapon_progression_item.progression.anchor) weapon_progression_item.progression.role="progression";
}

// Oozing Terror remains an optional health-sacrificing staff sidegrade, not a safe unlock route.
items.daggerofthedead.progression.role="sidegrade";
items.ornamentstaff.progression.role="sidegrade";
items.oozingterror.progression.role="sidegrade";
items.oozingterror.progression.next_tier_hunt_eligible=false;
items.oozingterror.progression.next_tier_hunt_reason="health_penalty_sidegrade";

// These narrowly raise only attack growth where a lower-rank curve overtook the next rank at the same enhancement.
// These correct rank crossings and the approved staff/bow progression parity.
var weapon_progression_upgrade_damage_corrections={staff:22.5422190578985,slimestaff:15,vsword:150,maceofthedead:25,vhammer:61,harbringer:21,ornamentstaff:57,staffofthedead:45,sparkstaff:65,pinkie:154,weaver:312,dragondagger:219};
for(var weapon_progression_weapon_id in weapon_progression_upgrade_damage_corrections)
	items[weapon_progression_weapon_id].upgrade.damage=weapon_progression_upgrade_damage_corrections[weapon_progression_weapon_id];

items.mhspear={type:"weapon",wtype:"spear",tier:2,skin:"spear",placeholder_art:true,placeholder_asset:"spear",hunter_only:true,name:"Hunter's Spear",explanation:"A Monster Hunter sidegrade. Placeholder artwork reuses the Spear.",g:960000,grades:[0,2,10,12],range:9,damage_type:"physical",damage:266,attacks_per_second:.875,upgrade:{range:1,damage:180,attacks_per_second:0},progression:{historical_rank:null,shared_rank:5,role:"hunter_sidegrade",requirement:80,reference_level:56,target_dps:232.75,anchor:false},requirements:[{skill:"warrior",level:80}]};
items.mhhammer={type:"weapon",wtype:"hammer",tier:2,skin:"hammer",placeholder_art:true,placeholder_asset:"hammer",hunter_only:true,name:"Hunter's Hammer",explanation:"A Monster Hunter sidegrade. Placeholder artwork reuses the Hammer.",g:960000,grades:[0,2,10,12],range:7,damage_type:"physical",damage:190,attacks_per_second:1.1,upgrade:{range:1,damage:70,attacks_per_second:0},progression:{historical_rank:null,shared_rank:5,role:"hunter_sidegrade",requirement:80,reference_level:56,target_dps:209,anchor:false},requirements:[{skill:"paladin",level:80}]};
items.mhwand={type:"weapon",wtype:"wand",tier:2,skin:"wand",placeholder_art:true,placeholder_asset:"wand",hunter_only:true,name:"Hunter's Wand",explanation:"A Monster Hunter sidegrade. Placeholder artwork reuses the Wand.",g:960000,grades:[0,2,10,12],range:50,damage_type:"magical",damage:280,attacks_per_second:.915,upgrade:{range:2,damage:120,attacks_per_second:0},progression:{historical_rank:null,shared_rank:5,role:"hunter_sidegrade",requirement:80,reference_level:56,target_dps:256.2,anchor:false},requirements:[{skill:"mage",level:80}]};
items.mhbook={type:"weapon",wtype:"book",tier:2,skin:"wbook0",placeholder_art:true,placeholder_asset:"wbook0",hunter_only:true,name:"Hunter's Codex",explanation:"A Monster Hunter sidegrade. Placeholder artwork reuses the Book of Knowledge.",g:960000,grades:[0,2,10,12],damage_type:"magical",projectile:"pmagic",damage:524,attacks_per_second:.4,mp:240,upgrade:{damage:232,mp:20,attacks_per_second:0},progression:{historical_rank:null,shared_rank:5,role:"hunter_sidegrade",requirement:80,reference_level:56,target_dps:209.6,anchor:false},requirements:[{skill:"priest",level:80}]};
items.mhcrossbow={type:"weapon",wtype:"crossbow",tier:2,skin:"crossbow",placeholder_art:true,placeholder_asset:"crossbow",hunter_only:true,name:"Hunter's Crossbow",explanation:"A Monster Hunter sidegrade. Placeholder artwork reuses the Crossbow.",g:960000,grades:[0,2,10,12],range:36,damage_type:"physical",damage:200,attacks_per_second:1.28,upgrade:{range:4,damage:147,attacks_per_second:0},progression:{historical_rank:null,shared_rank:5,role:"hunter_sidegrade",requirement:80,reference_level:56,target_dps:256,anchor:false},requirements:[{skill:"ranger",level:80}]};
items.mhdagger={type:"weapon",wtype:"dagger",tier:2,skin:"dagger",placeholder_art:true,placeholder_asset:"dagger",hunter_only:true,name:"Hunter's Dagger",explanation:"A Monster Hunter sidegrade. Placeholder artwork reuses the Dagger.",g:960000,grades:[0,2,10,12],range:7,damage_type:"physical",damage:220,attacks_per_second:1.164,upgrade:{range:1,damage:168,attacks_per_second:0},progression:{historical_rank:null,shared_rank:5,role:"hunter_sidegrade",requirement:80,reference_level:56,target_dps:256.08,anchor:false},requirements:[{skill:"rogue",level:80}]};

if(typeof smithing_weapon_chain==="undefined"&&typeof module!=="undefined") var smithing_weapon_chain=require("./smithing").smithing_weapon_chain;
if(typeof smithing==="undefined"&&typeof module!=="undefined") var smithing=require("./smithing").smithing;
if(typeof smithing_weapon_chain==="undefined"&&typeof smithing!=="undefined") var smithing_weapon_chain=smithing.weapons;
for(var smithing_weapon_index=0;smithing_weapon_index<smithing_weapon_chain.length;smithing_weapon_index++){
	var smithing_weapon=smithing_weapon_chain[smithing_weapon_index];
	var smithing_anchor=items[smithing_weapon.anchor];
	var smithing_tier=smithing.tiers.filter(function(tier){return tier.id===smithing_weapon.tier_id;})[0];
	var smithing_upgrade={};
	for(var smithing_upgrade_key in smithing_anchor.upgrade)
		if(smithing_upgrade_key==="damage"||smithing_upgrade_key==="range"||smithing_upgrade_key==="attacks_per_second") smithing_upgrade[smithing_upgrade_key]=smithing_anchor.upgrade[smithing_upgrade_key];
	items[smithing_weapon.output]={type:"weapon",wtype:smithing_weapon.class_id==="book"?"book":smithing_anchor.wtype,tier:smithing_anchor.tier,skin:"smithing_"+smithing_weapon.tier_id+"_"+smithing_weapon.class_id,name:smithing_weapon.name,g:smithing_anchor.g,grades:smithing_anchor.grades,damage_type:smithing_anchor.damage_type,damage:smithing_anchor.damage,attacks_per_second:smithing_anchor.attacks_per_second,upgrade:smithing_upgrade,exclusive:true,progression:{historical_rank:null,shared_rank:smithing_tier.index+2,role:"smithing",requirement:smithing_weapon.requirement,reference_level:[15,30,45,60,75,90][smithing_tier.index],target_dps:smithing_anchor.damage*smithing_anchor.attacks_per_second,anchor:false,next_tier_hunt_eligible:false,next_tier_hunt_reason:"smithing_progression"}};
	if(smithing_anchor.range!==undefined) items[smithing_weapon.output].range=smithing_anchor.range;
}
for(var smithing_scrap_tier_index=0;smithing_scrap_tier_index<smithing.tiers.length;smithing_scrap_tier_index++){
	var smithing_scrap_tier=smithing.tiers[smithing_scrap_tier_index];
	items[smithing_scrap_tier.scrap]={type:"material",skin:"smithing_"+smithing_scrap_tier.id+"_scrap",name:smithing_scrap_tier.name+" Bar Scrap",s:9999,g:smithing_scrap_tier.scrap_g,exclusive:true};
}

if(typeof finalize_equipment_requirements=="function") finalize_equipment_requirements(items,item_requirements);

if(typeof module!=="undefined") module.exports={items:items,sets:sets};
