// "s" Stackable
// "e" Exchangable
// "a" Announce + High Grade
// "a" 2 - Announce Within the Map
var items={
	"test":{
		"type":"test",
		"skin":"test",
		"ignore":true,
		"name":"Test",
		"explanation":"An item to test item looks, just set the 'skin' property.",
		"g":1,
	},
	"test2":{
		"type":"orb",
		"skin":"shells",
		"ignore":true,
		"name":"Test",
		"for":120,
		"manasteal":2,
		"critdamage":60,
		//"luck":9999999999,
		"explanation":"An item to test properties!",
		"g":1,
	},
	"test_orb":{
		"type":"orb",
		"skin":"test_orb",
		"name":"Orb of Testing",
		//"manasteal":0.25,
		//"fzresistance":20,
		//"firesistance":20,
		//"mp_reduction":20,
		//"ability":"restore_mp",
		"ability":"poison",
		"attr0":50,
		//"attr0":8,
		"compound":{
		},
		"grades":[0,0],
		"g":1,
	},
	"placeholder":{
		"type":"placeholder",
		"skin":"placeholder",
		"ignore":true,
		"name":"Placeholder",
		"g":1,
	},
	"placeholder_m":{
		"type":"placeholder",
		"skin":"placeholder_m",
		"ignore":true,
		"name":"Placeholder",
		"g":1,
	},
	"stealthcape":{
		"type":"cape",
		"skin":"stealthcape",
		"resistance":42,
		"stat":3,
		"name":"Stealth Cape",
		"upgrade":{
			"resistance":1,
			"stat":0.30,
		},
		"explanation":"Thanks to its stealth capabilities, no one can track your endeavours any more.",
		"grades":[0,4],
		"g":2000000,
	},
	"cape":{
		"type":"cape",
		"skin":"cape0",
		"armor":10,
		"resistance":8,
		"stat":4,
		"name":"Cape",
		"upgrade":{
			"armor":2,
			"resistance":1,
			"stat":0.10,
		},
		"grades":[0,8],
		"g":20000,
	},
	"horsecape":{
		"type":"cape",
		"skin":"horsecape",
		"armor":10,
		"stat":5,
		"speed":1,
		"name":"Horse Leather Cape",
		"upgrade":{
			"armor":2,
			"resistance":2,
			"stat":0.10,
			"speed":0.1,
		},
		"grades":[0,5],
		"g":1600000,
	},
	"horsecapeg":{
		"type":"cape",
		"skin":"horsecapeg",
		"armor":10,
		"gold":3,
		"stat":5,
		"speed":1,
		"name":"Horse Leather Cape",
		"upgrade":{
			"armor":2,
			"resistance":2,
			"stat":0.10,
			"speed":0.1,
			"gold":0.5,
		},
		"grades":[0,0],
		"g":1600000,
	},
	"fcape":{
		"type":"cape",
		"skin":"fcape",
		"armor":10,
		"resistance":8,
		"firesistance":4,
		"stat":6,
		"name":"Fiery Cape",
		"upgrade":{
			"armor":2,
			"resistance":2,
			"stat":0.10,
			"firesistance":4,
		},
		"grades":[0,0],
		"g":16000000,
	},
	"ecape":{
		"set":"bunny",
		"type":"cape",
		"skin":"ecape",
		"armor":10,
		"resistance":8,
		"stat":5,
		"cuteness":20,
		"name":"Fluffy Blanket",
		"upgrade":{
			"cuteness":3,
			"armor":2,
			"resistance":1,
			"stat":0.10,
		},
		"grades":[0,7],
		"g":20000,
	},
	"gcape":{
		"type":"cape",
		"skin":"gcape",
		"resistance":8,
		"stat":4,
		"pnresistance":5,
		"evasion":1,
		"reflection":1,
		"speed":-2,
		"name":"Grinch's Cape",
		"upgrade":{
			"resistance":4,
			"pnresistance":1,
			"stat":0.10,
		},
		"grades":[0,7],
		"g":8008,
	},
	"angelwings":{
		"type":"cape",
		"skin":"angelwings",
		"resistance":8,
		"stat":3,
		"speed":1,
		"evasion":1,
		"name":"Angel Wings",
		"upgrade":{
			"resistance":1,
			"evasion":0.2,
			"speed":0.2,
			"stat":0.10,
		},
		"grades":[0,6],
		"g":120000,
		"a":true,
		"action":"FLAP",
		"onclick":"socket.emit('activate',{slot:$(this).data('id')})"
	},
	"tigercape":{
		"set":"tiger",
		"type":"cape",
		"skin":"tigercape",
		"armor":18,
		"resistance":12,
		"speed":1,
		"str":1,
		"dex":1,
		"stat":4,
		"name":"Cape of the Tiger",
		"upgrade":{
			"armor":3,
			"resistance":2,
			"stat":0.10,
		},
		"grades":[0,4],
		"a":true,
		"g":2400000,
	},
	"bcape":{
		"type":"cape",
		"skin":"cape1",
		"armor":18,
		"resistance":12,
		"stat":5,
		"name":"Well-Crafted Cape",
		"upgrade":{
			"armor":3,
			"resistance":2,
			"stat":0.10,
		},
		"grades":[0,4],
		"a":true,
		"g":2400000,
	},
}

var armor={
	"fury":{
		"set":"fury",
		"tier":1.5,
		"type":"helmet",
		"class":["rogue","warrior","ranger","paladin"],
		"skin":"fury",
		"scroll":true,
		//"evasion":1,
		"dex":2,
		"crit":6,
		"apiercing":20,
		"upgrade":{
			"crit":0.5,
			"apiercing":10,
		},
		"legacy":{
			"class":null,
			"set":null,
		},
		"name":"Band of Fury",
		"grades":[0,0],
		"g":6400000,
		"a":true,
	},
	"tigerhelmet":{
		"set":"tiger",
		"tier":2,
		"type":"helmet",
		"skin":"tigerhelmet",
		"scroll":true,
		"crit":0.5,
		"speed":2,
		"rogue":{
			"crit":2,
			"upgrade":{
				"crit":0.25,
			}
		},
		"upgrade":{
		},
		"name":"Helmet of the Tiger",
		"grades":[0,6],
		"g":640000,
		"a":true,
	},
	"mageshood":{
		"tier":2,
		"type":"helmet",
		"class":["mage"],
		"skin":"mageshood",
		"scroll":true,
		"crit":0.5,
		"upgrade":{
			"rpiercing":10,
		},
		"name":"Mage's Hood",
		"grades":[0,8],
		"g":640000,
		"a":true,
		"ignore":true,
	},
	"rednose":{
		"type":"helmet",
		"skin":"rednose",
		"scroll":true,
		"range":3,
		"cuteness":9,
		"compound":{
			"range":4,
			"cuteness":3,
		},
		"name":"Rudolph's Red Nose",
		"grades":[2,4],
		"g":32000,
		"a":true,
	},
	"helmet":{
		//"set":"base",
		"tier":1,
		"type":"helmet",
		"skin":"helmet",
		"scroll":true,
		"upgrade":{
		},
		"name":"Helmet",
		"g":3200,
	},
	"cyber":{
		"dex":2,
		"str":2,
		"int":6,
		"pnresistance":4,
		"mcourage":1,
		"pcourage":1,
		"tier":3,
		"type":"helmet",
		"skin":"cyber",
		"scroll":true,
		"upgrade":{
		},
		"name":"Cybernetic Implants",
		"g":320000,
	},
	"wcap":{
		"set":"wanderers",
		"tier":1,
		"type":"helmet",
		"skin":"wcap",
		"hp":120,
		"scroll":true,
		"upgrade":{
		},
		"name":"Wanderer's Cap",
		"g":6400,
	},
	"xmashat":{
		"set":"holidays",
		"tier":1.5,
		"type":"helmet",
		"skin":"xmashat",
		"scroll":true,
		"vit":2,
		"upgrade":{
		},
		"name":"Xmas Hat",
		"xcx":["hat100"],
		"g":13200,
		"a":true,
	},
	"ghatb":{
		"type":"helmet",
		"skin":"ghatb",
		"hat":"hat114",
		"vit":24,
		"name":"Hat of Generosity",
		"explanation":"If you put on this hat, you can run item giveaways!",
		"g":128000,
	},
	"ghatp":{
		"type":"helmet",
		"skin":"ghatp",
		"hat":"hat115",
		"vit":24,
		"name":"Hat of Generosity",
		"explanation":"If you put on this hat, you can run item giveaways!",
		"g":128000,
	},
	"helmet1":{
		"set":"rugged",	
		"tier":2,
		"type":"helmet",
		"skin":"helmet1",
		"scroll":true,
		"upgrade":{
		},
		"name":"Rugged Helmet",
		"g":32000,
		"a":2,
	},
	"mwhelmet":{
		"class":["warrior"],
		"set":"mwarrior",
		"tier":2.625,
		"type":"helmet",
		"skin":"mwhelmet",
		"scroll":true,
		"upgrade":{
		},
		"name":"Helmet of the Hunter Warrior",
		"explanation":"You served our realm well",
		"g":64000,
	},
	"mmhat":{
		"rpiercing":40,
		"class":["mage"],
		"set":"mmage",
		"tier":2.125,
		"type":"helmet",
		"skin":"mmhat",
		"scroll":true,
		"upgrade":{
		},
		"name":"Hat of the Hunter Mage",
		"explanation":"You served our realm well",
		"g":64000,
	},
	"mphat":{
		"class":["priest"],
		"set":"mpriest",
		"tier":2.125,
		"type":"helmet",
		"skin":"mphat",
		"scroll":true,
		"upgrade":{
		},
		"name":"Hat of the Hunter Priest",
		"explanation":"You served our realm well",
		"g":64000,
	},
	"mrnhat":{
		"class":["ranger"],
		"set":"mranger",
		"tier":2.25,
		"type":"helmet",
		"skin":"mrnhat",
		"scroll":true,
		"upgrade":{
		},
		"name":"Hat of the Hunter Ranger",
		"explanation":"You served our realm well",
		"g":64000,
	},
	"mrhood":{
		"evasion":5,
		"class":["rogue"],
		"set":"mrogue",
		"tier":2.25,
		"type":"helmet",
		"skin":"mrhood",
		"scroll":true,
		"upgrade":{
		},
		"name":"Hood of the Hunter Rogue",
		"explanation":"You served our realm well",
		"g":64000,
	},
	"mchat":{
		"class":["merchant"],
		"set":"mmerchant",
		"tier":2.25,
		"type":"helmet",
		"skin":"mchat",
		"scroll":true,
		"upgrade":{
		},
		"name":"Hat of the Hunter Merchant",
		"explanation":"Your comrades served our realm well",
		"g":64000,
	},
	"partyhat":{
		"tier":1,
		"type":"helmet",
		"skin":"partyhat",
		"scroll":true,
		"upgrade":{
			"str":0.2,
			"int":0.2,
			"dex":0.2,
			"vit":0.1,
		},
		"name":"Party Hat",
		"g":12000,
		"a":2,
	},
	"phelmet":{
		"tier":2,
		"extra_stat":0,
		"type":"helmet",
		"skin":"phelmet",
		"scroll":true,
		"reflection":1,
		"upgrade":{
			"reflection":0.4,
		},
		"name":"Pumpkin Head",
		"g":72000,
		"a":2,
		"grades":[0,7],
	},
	"gphelmet":{
		"tier":2,
		"extra_stat":0,
		"type":"helmet",
		"skin":"gphelmet",
		"scroll":true,
		"luck":-4,
		"reflection":1,
		"lifesteal":2,
		"crit":0.5,
		"rpiercing":10,
		"upgrade":{
			"reflection":0.4,
			"crit":0.1,
		},
		"name":"Green Pumpkin Head",
		"g":32000,
		"a":2,
		"grades":[0,0],
	},
	"bunnyears":{
		"tier":2,
		"type":"helmet",
		"skin":"bunnyears",
		"scroll":true,
		"cuteness":12,
		"vit":4,
		"evasion":1,
		"upgrade":{
			"cuteness":2,
			"evasion":0.20,
		},
		"name":"Legacy Bunny Ears",
		"g":32000,
		"a":2,
		"grades":[4,8],
	},
	"eears":{
		"set":"bunny",
		"tier":1.5,
		"type":"helmet",
		"skin":"eears",
		"scroll":true,
		"cuteness":12,
		"vit":2,
		"evasion":1,
		"upgrade":{
			"cuteness":2,
			"evasion":0.20,
		},
		"name":"Bunny Ears",
		"g":32000,
		"a":2,
		"grades":[6,9],
	},
	"hhelmet":{
		"set":"wt3",
		"tier":3,
		"type":"helmet",
		"skin":"hhelmet",
		"scroll":true,
		"upgrade":{
		},
		"name":"Heavy Helmet",
		"g":320000,
		"a":2,
	},
	"xhelmet":{
		"set":"wt4",
		"tier":4,
		"type":"helmet",
		"skin":"xhelmet",
		"xscroll":true,
		"scroll":true,
		"upgrade":{
		},
		"name":"Darkforge Helmet",
		"g":3200000,
		"a":2,
	},
	"spikedhelmet":{
		"tier":0,
		"type":"helmet",
		"skin":"spikedhelmet",
		"armor":35,
		"dreturn":2,
		"stat":4,
		"scroll":true,
		"upgrade":{
			"armor":7.75,
			"dreturn":1,
			"stat":1,
		},
		"grades":[0,0,8,10],
		"name":"Spiked Helmet",
		"g":3200000,
		"a":2,
	},
	"luckyt":{
		//"set":"base",
		"type":"chest",
		"skin":"luckyt",
		"resistance":20,
		"luck":7,
		"xp":5,
		"scroll":true,
		"upgrade":{
			"resistance":10,
			"luck":1.75,
			"xp":1,
		},
		"grades":[0,0,0],
		"name":"Lucky T-Shirt",
		"g":120000,
	},
	"tshirt0":{
		"type":"chest",
		"skin":"tshirt0",
		"int":5,
		"upgrade":{
			"int":1.25,
		},
		"name":"T-Shirt (Int)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt1":{
		"type":"chest",
		"skin":"tshirt1",
		"dex":5,
		"upgrade":{
			"dex":1.25,
		},
		"name":"T-Shirt (Dex)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt2":{
		"type":"chest",
		"skin":"tshirt2",
		"str":5,
		"upgrade":{
			"str":1.25,
		},
		"name":"T-Shirt (Str)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt3":{
		"type":"chest",
		"skin":"tshirt3",
		"xp":2,
		"upgrade":{
			"xp":0.75,
		},
		"name":"T-Shirt (XP)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt4":{
		"type":"chest",
		"skin":"tshirt4",
		"speed":3,
		"upgrade":{
			"speed":0.5,
		},
		"name":"T-Shirt (Speed)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt88":{
		"type":"chest",
		"skin":"tshirt88",
		"speed":3,
		"luck":12,
		"xp":5,
		"dex":5,
		"str":5,
		"int":5,
		"upgrade":{
			"int":1,
			"str":1,
			"dex":1,
		},
		"name":"T-Shirt (Lucky)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt6":{
		"type":"chest",
		"skin":"tshirt6",
		"rpiercing":30,
		"upgrade":{
			"rpiercing":5,
		},
		"name":"T-Shirt (Res. Piercing)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt7":{
		"type":"chest",
		"skin":"tshirt7",
		"apiercing":30,
		"upgrade":{
			"apiercing":5,
		},
		"name":"T-Shirt (Armor Piercing)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt8":{
		"type":"chest",
		"skin":"tshirt8",
		"mp_cost":-5,
		"upgrade":{
			"mp_cost":-2,
		},
		"name":"T-Shirt (Attack MP Cost)",
		"grades":[0,6],
		"g":120,
	},
	"tshirt9":{
		"type":"chest",
		"skin":"tshirt9",
		"manasteal":1,
		"upgrade":{
			"manasteal":0.1,
		},
		"name":"T-Shirt (Manasteal)",
		"grades":[0,6],
		"g":120,
	},
	"coat":{
		//"set":"base",
		"tier":1,
		"type":"chest",
		"skin":"coat",
		"scroll":true,
		"upgrade":{
		},
		"name":"Coat",
		"g":6000,
	},
	"wattire":{
		"set":"wanderers",
		"tier":1,
		"type":"chest",
		"skin":"wattire",
		"mp":80,
		"scroll":true,
		"upgrade":{
		},
		"name":"Wanderer's Attire",
		"g":12000,
	},
	"xmassweater":{
		"set":"holidays",
		"tier":1.5,
		"type":"chest",
		"skin":"xmassweater",
		"evasion":0.5,
		"scroll":true,
		"upgrade":{
			"evasion":0.25,
		},
		"explanation":"Such a beautiful vest. But for some reason, every time you wear this, people seem to avoid you.",
		"name":"Xmas Sweater",
		"g":16000,
		"a":true,
	},
	"sweaterhs":{
		"set":"holidays",
		"tier":2.5,
		"vit":12,
		"speed":-1,
		"mp":240,
		"type":"chest",
		"skin":"sweaterhs",
		"scroll":true,
		"upgrade":{

		},
		"name":"Super Sweater",
		"g":160000,
		"a":true,
	},
	"coat1":{
		"set":"rugged",
		"tier":2,
		"type":"chest",
		"skin":"coat1",
		"scroll":true,
		"upgrade":{
		},
		"name":"Rugged Coat",
		"g":48000,
		"a":2,
	},
	"mwarmor":{
		"class":["warrior"],
		"set":"mwarrior",
		"tier":2.625,
		"type":"chest",
		"skin":"mwarmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Armor of the Hunter Warrior",
		"explanation":"You served our realm well",
		"g":96000,
	},
	"mmarmor":{
		"class":["mage"],
		"set":"mmage",
		"tier":2.125,
		"type":"chest",
		"skin":"mmarmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Armor of the Hunter Mage",
		"explanation":"You served our realm well",
		"g":96000,
	},
	"mparmor":{
		"class":["priest"],
		"set":"mpriest",
		"tier":2.125,
		"type":"chest",
		"skin":"mparmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Armor of the Hunter Priest",
		"explanation":"You served our realm well",
		"g":96000,
	},
	"mrnarmor":{
		"frequency":1,
		"class":["ranger"],
		"set":"mranger",
		"tier":2.25,
		"type":"chest",
		"skin":"mrnarmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Armor of the Hunter Ranger",
		"explanation":"You served our realm well",
		"g":96000,
	},
	"mrarmor":{
		"class":["rogue"],
		"set":"mrogue",
		"tier":2.25,
		"type":"chest",
		"skin":"mrarmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Armor of the Hunter Rogue",
		"explanation":"You served our realm well",
		"g":96000,
	},
	"mcarmor":{
		"class":["merchant"],
		"set":"mmerchant",
		"tier":2.25,
		"type":"chest",
		"skin":"mcarmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Armor of the Hunter Merchant",
		"explanation":"Your comrades served our realm well",
		"g":96000,
	},
	"harmor":{
		"set":"wt3",
		"tier":3,
		"type":"chest",
		"skin":"harmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Heavy Armor",
		"g":480000,
		"a":2,
	},
	"cdragon":{
		"type":"chest",
		"skin":"dragonarmor",
		"armor":40,
		"resistance":32,
		"str":10,
		"int":10,
		"dex":10,
		"vit":2,
		"apiercing":16,
		"rpiercing":16,
		"dreturn":3,
		"name":"Dragon Armor",
		"g":8900000,
		"a":2,
		"grades":[0,0],
	},
	"oxhelmet":{
		"type":"helmet",
		"skin":"oxhelmet",
		"armor":55,
		"resistance":12,
		"str":10,
		"int":10,
		"dex":10,
		"vit":2,
		"output":1,
		"firesistance":3,
		"name":"OX Helmet",
		"g":8900000,
		"a":2,
		"grades":[0,0],
	},
	"xarmor":{
		"set":"wt4",
		"tier":4,
		"type":"chest",
		"skin":"xarmor",
		"scroll":true,
		"upgrade":{
		},
		"name":"Darkforge Armor",
		"g":4800000,
		"a":2,
	},
	"mcape":{
		"set":"vampires",
		"tier":2,
		"type":"chest",
		"skin":"mcape",
		"scroll":true,
		"hp":160,
		"lifesteal":1,
		//"manaburn":10,
		"upgrade":{
			"lifesteal":0.2,
			//"manaburn":2,
			"hp":30,
		},
		"name":"Dracul's Attire",
		"g":480000,
		"a":2,
		"grades":[0,6],
	},
	"vattire":{
		"set":"vampires",
		"tier":3,
		"type":"chest",
		"skin":"vattire",
		"scroll":true,
		"hp":1600,
		"lifesteal":2,
		//"manaburn":10,
		"upgrade":{
			"lifesteal":0.2,
			//"manaburn":2,
			"hp":300,
		},
		"name":"Spike's Attire",
		"g":4800000,
	},
	"warpvest":{
		"set":"legends",
		"tier":3,
		"extra_stat":0,
		"type":"chest",
		"skin":"warpvest",
		"scroll":true,
		//"manaburn":10,
		"upgrade":{
			"int":0.64,
			"str":0.64,
			"dex":0.64,
			"vit":0.64,
			"for":1,
		},
		"name":"Warp Vest",
		"explanation":"Warps space-time. Ancient Computer unlocks only a fraction of its capabilities. Needs to be recharged in order to initiate a jump.",
		"ability":"warp",
		"charge":1,
		"g":36400000,
		"a":2,
		"edge":5,
		"grades":[0,0,6,10],
	},
	"pyjamas":{
		"tier":2,
		"type":"chest",
		"skin":"pyjamas",
		"scroll":true,
		"hp":400,
		"charisma":-5,
		//"manaburn":10,
		"upgrade":{
			"hp":50,
		},
		"name":"Legacy Pyjamas",
		"g":480000,
		"a":2,
		"grades":[4,8],
		"explanation":"Comfortable."
	},
	"epyjamas":{
		"set":"bunny",
		"tier":1.5,
		"type":"chest",
		"skin":"epyjamas",
		"scroll":true,
		"hp":400,
		"charisma":-5,
		//"manaburn":10,
		"upgrade":{
			"hp":50,
		},
		"name":"Pyjamas",
		"g":48000,
		"a":2,
		"grades":[5,8],
		"explanation":"Comfortable."
	},
	"pants":{
		//"set":"base",
		"tier":1,
		"type":"pants",
		"skin":"pants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants",
		"g":7800,
	},
	"fallen":{
		"set":"fury",
		"tier":1.5,
		"type":"pants",
		"class":["rogue","warrior"],
		"skin":"fallen",
		"scroll":true,
		"dex":4,
		"crit":2,
		"frequency":6,
		"speed":3,
		"upgrade":{
			"crit":0.5,
		},
		"name":"Pants of the Fallen Master",
		"grades":[0,0,8,10],
		"g":6400000,
		"a":true,
	},
	"wbreeches":{
		"set":"wanderers",
		"tier":1,
		"type":"pants",
		"skin":"wbreeches",
		"speed":1,
		"scroll":true,
		"upgrade":{
		},
		"name":"Wanderer's Breeches",
		"g":15600,
	},
	"xmaspants":{
		"set":"holidays",
		"tier":1.5,
		"type":"pants",
		"skin":"xmaspants",
		"vit":2,
		"scroll":true,
		"upgrade":{
		},
		"name":"Xmas Pants",
		"g":17800,
		"a":true,
	},
	"pants1":{
		"set":"rugged",
		"tier":2,
		"type":"pants",
		"skin":"pants1",
		"scroll":true,
		"upgrade":{
		},
		"name":"Rugged Pants",
		"g":78000,
		"a":2,
	},
	"mwpants":{
		"class":["warrior"],
		"set":"mwarrior",
		"tier":2.625,
		"type":"pants",
		"skin":"mwpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Underarmor of the Hunter Warrior",
		"explanation":"You served our realm well",
		"g":128000,
	},
	"mmpants":{
		"class":["mage"],
		"set":"mmage",
		"tier":2.125,
		"type":"pants",
		"skin":"mmpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants of the Hunter Mage",
		"explanation":"You served our realm well",
		"g":128000,
	},
	"mmpants":{
		"class":["mage"],
		"set":"mmage",
		"tier":2.125,
		"type":"pants",
		"skin":"mmpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants of the Hunter Mage",
		"explanation":"You served our realm well",
		"g":128000,
	},
	"mppants":{
		"class":["priest"],
		"set":"mpriest",
		"tier":2.125,
		"type":"pants",
		"skin":"mppants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants of the Hunter Priest",
		"explanation":"You served our realm well",
		"g":128000,
	},
	"mrnpants":{
		"class":["ranger"],
		"set":"mranger",
		"tier":2.25,
		"type":"pants",
		"skin":"mrnpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants of the Hunter Ranger",
		"explanation":"You served our realm well",
		"g":128000,
	},
	"mrpants":{
		"class":["rogue"],
		"set":"mrogue",
		"tier":2.25,
		"type":"pants",
		"skin":"mrpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants of the Hunter Rogue",
		"explanation":"You served our realm well",
		"g":128000,
	},
	"mcpants":{
		"class":["merchant"],
		"set":"mmerchant",
		"tier":2.25,
		"type":"pants",
		"skin":"mcpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Pants of the Hunter Merchant",
		"explanation":"Your comrades served our realm well",
		"g":128000,
	},
	"starkillers":{
		"set":"legends",
		"class":["mage","priest"],
		"tier":3,
		"extra_stat":0,
		"type":"pants",
		"skin":"starkillers",
		"rpiercing":80,
		"crit":2,
		"vit":10,
		"scroll":true,
		"upgrade":{
			"rpiercing":5,
			"crit":0.2,
		},
		"legacy":{
			"class":null,
			"set":null,
		},
		"name":"Star Killer's Pants",
		"g":7800000,
		"a":2,
	},
	"hpants":{
		"set":"wt3",
		"tier":3,
		"type":"pants",
		"skin":"hpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Heavy Underarmor",
		"g":780000,
		"a":2,
	},
	"frankypants":{
		"tier":3,
		"type":"pants",
		"skin":"frankypants",
		"vit":6,
		"speed":1,
		"scroll":true,
		"upgrade":{
		},
		"name":"Franky Pants",
		"g":780000,
		"a":2,
	},
	"xpants":{
		"set":"wt4",
		"tier":4,
		"type":"pants",
		"skin":"xpants",
		"scroll":true,
		"upgrade":{
		},
		"name":"Darkforge Underarmor",
		"g":7800000,
		"a":2,
	},
	"shoes":{
		//"set":"base",
		"tier":1,
		"type":"shoes",
		"skin":"shoes",
		"scroll":true,
		"upgrade":{
		},
		"name":"Shoes",
		"g":12100,
	},
	"wshoes":{
		"set":"wanderers",
		"tier":1,
		"type":"shoes",
		"skin":"wshoes",
		"scroll":true,
		"upgrade":{
		},
		"name":"Wanderer's Shoes",
		"g":24200,
	},
	"iceskates":{
		"tier":2,
		"type":"shoes",
		"skin":"iceskates",
		"scroll":true,
		"speed":-10,
		"winterland":{
			"speed":25,
			"upgrade":{
				"speed":1,
			},
		},
		"upgrade":{
			"speed":1,
		},
		"name":"Ice Skates",
		"g":920000,
	},
	"snowboots":{
		"tier":2,
		"type":"shoes",
		"skin":"snowboots",
		"scroll":true,
		"fzresistance":10,
		"upgrade":{
			"fzresistance":1,
		},
		"name":"Snow Boots",
		"g":720000,
	},
	"eslippers":{
		"set":"bunny",
		"tier":1.5,
		"type":"shoes",
		"skin":"eslippers",
		"scroll":true,
		"cuteness":24,
		"upgrade":{
			"cuteness":2,
		},
		"grades":[7,9],
		"name":"Fluffy Slippers",
		"g":24200,
	},
	"wingedboots":{
		"set":"swift",
		"tier":1.5,
		"type":"shoes",
		"skin":"wingedboots",
		"frequency":3,
		"speed":8,
		"resistance":20,
		"scroll":true,
		"upgrade":{
			"frequency":0.625,
			"speed":1,
		},
		"name":"Winged Boots",
		"g":150000,
		"credit":"Pluet",
	},
	"xmasshoes":{
		"set":"holidays",
		"tier":1.5,
		"type":"shoes",
		"skin":"xmasshoes",
		"vit":2,
		"scroll":true,
		"upgrade":{
		},
		"name":"Xmas Shoes",
		"g":36000,
		"a":true,
	},
	"shoes1":{
		"set":"rugged",
		"tier":2,
		"type":"shoes",
		"skin":"shoes1",
		"scroll":true,
		"upgrade":{
		},
		"name":"Rugged Shoes",
		"g":120000,
		"a":2,
	},
	"mwboots":{
		"class":["warrior"],
		"set":"mwarrior",
		"tier":2.625,
		"type":"shoes",
		"skin":"mwboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Boots of the Hunter Warrior",
		"explanation":"You served our realm well",
		"g":240000,
	},
	"mmshoes":{
		"class":["mage"],
		"set":"mmage",
		"tier":2.125,
		"type":"shoes",
		"skin":"mmshoes",
		"scroll":true,
		"upgrade":{
		},
		"name":"Shoes of the Hunter Mage",
		"explanation":"You served our realm well",
		"g":240000,
	},
	"mpshoes":{
		"class":["priest"],
		"set":"mpriest",
		"tier":2.125,
		"type":"shoes",
		"skin":"mpshoes",
		"scroll":true,
		"upgrade":{
		},
		"name":"Shoes of the Hunter Priest",
		"explanation":"You served our realm well",
		"g":240000,
	},
	"mrnboots":{
		"class":["ranger"],
		"set":"mranger",
		"tier":2.25,
		"type":"shoes",
		"skin":"mrnboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Boots of the Hunter Ranger",
		"explanation":"You served our realm well",
		"g":240000,
	},
	"mrboots":{
		"class":["rogue"],
		"set":"mrogue",
		"tier":2.25,
		"type":"shoes",
		"skin":"mrboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Boots of the Hunter Rogue",
		"explanation":"You served our realm well",
		"g":240000,
	},
	"mcboots":{
		"for":8,
		"class":["merchant"],
		"set":"mmerchant",
		"tier":2.75,
		"type":"shoes",
		"skin":"mcboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Boots of the Hunter Merchant",
		"explanation":"Your comrades served our realm well",
		"g":240000,
	},
	"hboots":{
		"set":"wt3",
		"tier":3,
		"type":"shoes",
		"skin":"hboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Heavy Boots",
		"g":1240000,
		"a":2,
	},
	"xboots":{
		"set":"wt4",
		"tier":4,
		"type":"shoes",
		"skin":"xboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Darkforge Boots",
		"g":12400000,
		"a":2,
	},
	"gloves":{
		//"set":"base",
		"tier":1,
		"type":"gloves",
		"skin":"gloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves",
		"g":3400,
	},
	"vgloves":{
		"set":"vampires",
		"int":3,
		"str":3,
		"fzresistance":4,
		"tier":3,
		"type":"gloves",
		"skin":"vgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Vampiric Gloves",
		"g":340000,
	},
	"vboots":{
		"set":"vampires",
		"dex":3,
		"str":3,
		"firesistance":8,
		"tier":3,
		"type":"shoes",
		"skin":"vboots",
		"scroll":true,
		"upgrade":{
		},
		"name":"Vampiric Boots",
		"g":340000,
	},
	"vcape":{
		"set":"vampires",
		"tier":4,
		"type":"cape",
		"skin":"vcape",
		"scroll":true,
		"upgrade":{
		},
		"name":"Vampiric Cape",
		"g":340000,
	},
	"fierygloves":{
		"set":"swift",
		"tier":1.5,
		"type":"gloves",
		"skin":"fierygloves",
		"scroll":true,
		"frequency":2,
		"upgrade":{
			"frequency":0.125,
		},
		"grades":[0,7],
		"name":"Fiery Gloves",
		"g":144000,
	},
	"wgloves":{
		"set":"wanderers",
		"tier":1,
		"type":"gloves",
		"skin":"wgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Wanderer's Gloves",
		"g":6800,
	},
	"mittens":{
		"set":"holidays",
		"tier":1.5,
		"type":"gloves",
		"skin":"mittens",
		"apiercing":20,
		"rpiercing":20,
		"scroll":true,
		"upgrade":{
			"apiercing":2,
			"rpiercing":2,
		},
		"name":"Mittens",
		"explanation":"Cute but deadly.",
		"g":34000,
		"a":true,
	},
	"supermittens":{
		"set":"holidays",
		"tier":2,
		"extra_stat":0,
		"type":"gloves",
		"skin":"supermittens",
		"apiercing":32,
		"rpiercing":32,
		"frequency":2,
		"scroll":true,
		"upgrade":{
			"apiercing":3,
			"rpiercing":3,
			"frequency":0.2,
		},
		"name":"Super Mittens",
		"explanation":"Swift and lethal!",
		"g":340000,
		"a":true,
		"grades":[0,0],
	},
	"powerglove":{
		"set":"legends",
		"tier":2,
		"extra_stat":0,
		"type":"gloves",
		"skin":"powerglove",
		"apiercing":16,
		"rpiercing":16,
		"frequency":2,
		"scroll":true,
		"upgrade":{
			"apiercing":2,
			"rpiercing":2,
			"frequency":0.2,
		},
		"ability":"power",
		"charge":120,
		"name":"Power Glove",
		"g":1600000,
		"a":true,
		"grades":[0,0],
	},
	"goldenpowerglove":{
		"set":"legends",
		"tier":4,
		"extra_stat":1,
		"type":"gloves",
		"skin":"goldenpowerglove",
		"apiercing":64,
		"rpiercing":64,
		"stat":6,
		"frequency":5,
		"scroll":true,
		"upgrade":{
			"apiercing":4,
			"rpiercing":4,
			"frequency":0.2,
		},
		"ability":"xpower",
		"charge":90,
		"name":"Golden Power Glove",
		"g":16000000,
		"a":true,
		"grades":[0,0],
	},
	"handofmidas":{
		"tier":3.5,
		"type":"gloves",
		"skin":"goldglove",
		"speed":-20,
		"gold":10,
		"upgrade":{
			"gold":1,
		},
		"name":"Hand of Midas",
		"explanation":"You can feel the thirst for gold move through your veins.",
		"grades":[0,0],
		"g":800000,
		"a":true,
	},
	"poker":{
		"tier":1.5,
		"type":"gloves",
		"skin":"poker",
		"crit":0.5,
		"ability":"poke",
		"scroll":true,
		"upgrade":{
		},
		"name":"Poker",
		"explanation":"Pokey pokey!",
		//"action":"POKE!",
		//"onclick":"socket.emit('poke',{name:(ctarget||character).name})",
		"g":16000,
		"a":true,
	},
	"gloves1":{
		"set":"rugged",
		"tier":2,
		"type":"gloves",
		"skin":"gloves1",
		"scroll":true,
		"upgrade":{
		},
		"name":"Rugged Gloves",
		"g":34000,
		"a":2,
	},
	"mpxgloves":{
		"set":"mpx",
		"tier":2,
		"type":"gloves",
		"skin":"mpxgloves",
		"ability":"restore_mp",
		"attr0":2,
		"scroll":true,
		"upgrade":{
			"attr0":0.5,
		},
		"name":"Mana Gloves",
		"explanation":"The powers of this glove grow fivefold against humanoids!",
		"grades":[0,0,9],
		"g":34000000,
	},
	"mwgloves":{
		"crit":1,
		"class":["warrior"],
		"set":"mwarrior",
		"tier":2.625,
		"type":"gloves",
		"skin":"mwgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves of the Hunter Warrior",
		"explanation":"You served our realm well",
		"g":68000,
	},
	"mmgloves":{
		"class":["mage"],
		"set":"mmage",
		"tier":2.125,
		"type":"gloves",
		"skin":"mmgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves of the Hunter Mage",
		"explanation":"You served our realm well",
		"g":68000,
	},
	"mpgloves":{
		"output":5,
		"class":["priest"],
		"set":"mpriest",
		"tier":2.125,
		"type":"gloves",
		"skin":"mpgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves of the Hunter Priest",
		"explanation":"You served our realm well",
		"g":68000,
	},
	"mrngloves":{
		"class":["ranger"],
		"set":"mranger",
		"tier":2.25,
		"type":"gloves",
		"skin":"mrngloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves of the Hunter Ranger",
		"explanation":"You served our realm well",
		"g":68000,
	},
	"mrgloves":{
		"class":["rogue"],
		"set":"mrogue",
		"tier":2.25,
		"type":"gloves",
		"skin":"mrgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves of the Hunter Rogue",
		"explanation":"You served our realm well",
		"g":68000,
	},
	"mcgloves":{
		"gold":5,
		"class":["merchant"],
		"set":"mmerchant",
		"tier":2.25,
		"type":"gloves",
		"skin":"mcgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Gloves of the Hunter Merchant",
		"explanation":"Your comrades served our realm well",
		"g":68000,
	},
	"hgloves":{
		"set":"wt3",
		"tier":3,
		"type":"gloves",
		"skin":"hgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Heavy Gloves",
		"g":340000,
		"a":2,
	},
	"xgloves":{
		"set":"wt4",
		"tier":4,
		"type":"gloves",
		"skin":"xgloves",
		"scroll":true,
		"upgrade":{
		},
		"name":"Darkforge Gloves",
		"g":3400000,
		"a":2,
	}
}
for(var name in armor){
	//import logging; logging.info(name)
	var current=armor[name];
	if(!current["tier"]) continue;
	var tier=current["tier"];
	var ftier=Math.floor(tier);
	var ctier=Math.ceil(tier);
	//var armor_gains=[0,1.25,2.5,4.25,5.5];
	//var res_gains=[0,1.25,2.5,4.25,5.5];
	var armor_gains=[0,0.5,2.5,5.5,7.5];
	var res_gains=[0,0.5,2.5,5.5,7.5];
	var xtier=([0.5,0.5,2,3.4,4.5,6][ftier]+[0.5,0.5,2,4,5,6][ctier]+tier)/3.0;
	//if(!current["edge"] && tier>1) current["edge"]=(tier-1)*2;
	if(tier<=1.25 && !("grades" in current)) current["grades"]=[7,9];
	else if(tier<=1.5 && !("grades" in current)) current["grades"]=[4,8];
	else if(tier<=2.4 && !("grades" in current)) current["grades"]=[0,7];
	else if(tier<=2.75 && !("grades" in current)) current["grades"]=[0,5];
	else if(!("grades" in current)) current["grades"]=[0,0];
	if(current["grades"].length==2){
		current["grades"].push(10); current["grades"].push(12);
		if(tier>=4){
			current["grades"][2]=8;
			current["grades"][3]=10;
		}else if(tier>=3){
			current["grades"][2]=9;
			current["grades"][3]=10;
		}
	}
	if(current["scroll"]){
		if(!current["stat"]){
			current["stat"]=1;
		}
		current["upgrade"]["stat"]=1;
		if((current["extra_stat"]===undefined?-1:current["extra_stat"])==-1 && tier>=2){
			current["extra_stat"]=Math.min(ftier,4)-1;
			current["stat"]+=Math.min(ftier,4)-1;
		}
	}
	if(current["type"]=="chest"){
		current["armor"]=xtier*12;
		current["resistance"]=xtier*8;
	}
	if(current["type"]=="helmet"){
		current["armor"]=xtier*7;
		current["resistance"]=xtier*8;
		if(current["resistance"]>=15){
			current["protection"]=true;
		}
	}
	if(current["type"]=="pants"){
		current["armor"]=xtier*10;
		current["resistance"]=xtier*6;
	}
	if(current["type"]=="shoes"){
		current["armor"]=xtier*4;
		if(!current["speed"]){
			current["speed"]=Math.round(4+tier*1);
			current["upgrade"]["speed"]=0.375+tier/4.0;
		}
	}
	if(current["type"]=="gloves"){
		current["armor"]=xtier*8;
		current["resistance"]=xtier*4;
	}
	if(current["resistance"]){
		current["upgrade"]["resistance"]=(res_gains[Math.floor(tier)]+res_gains[Math.ceil(tier)])/2.0;
	}
	if(current["armor"]){
		current["upgrade"]["armor"]=(armor_gains[Math.floor(tier)]+armor_gains[Math.ceil(tier)])/2.0;
	}
	if(current["type"]=="shoes" && tier>2){
		current["resistance"]=tier*2;
		current["upgrade"]["resistance"]=(res_gains[Math.floor(tier)]+res_gains[Math.ceil(tier)])/4.0;
	}
	if(current["armor"]) current["armor"]=Math.ceil(current["armor"]);
	if(current["resistance"]) current["resistance"]=Math.ceil(current["resistance"]);
}

//for(var i=0;i<42;i++) if(player.items[i] && player.items[i].level) player.items[i].level=8

var accessories={
	"amuletofm":{
		"type":"amulet",
		"skin":"amuletofm",
		"evasion":2,
		"reflection":0.5,
		"manasteal":0.5,
		"crit":2,
		"int":6,
		"str":4,
		"dex":3,
		"hp":400,
		"armor":10,
		"dreturn":1,
		"compound":{
			"evasion":2,
			"crit":1,
			"dreturn":0.75,
			"int":1,
			"str":1,
			"dex":1,
			"hp":120,
			"armor":2,
		},
		"name":"Amulet of Mystery",
		"grades":[0,0],
		"g":6400000,
		"a":true,
	},
	"northstar":{
		"type":"amulet",
		"skin":"northstar",
		"xp":10,
		"compound":{
			"xp":5,
		},
		"name":"The North Star",
		"grades":[0,0],
		"g":64000000,
		"a":true,
	},
	"bfangamulet":{
		"type":"amulet",
		"skin":"bfangamulet",
		"lifesteal":2,
		"critdamage":4,
		"apiercing":20,
		"compound":{
			"lifesteal":1,
			"critdamage":4,
			"apiercing":20,
		},
		"name":"Ghastly Bat Fang",
		"grades":[0,0],
		"g":6400000,
		"a":true,
	},
	"mpxamulet":{
		"set":"mpx",
		"type":"amulet",
		"skin":"mpxamulet",
		"mp_cost":-5,
		"mp_reduction":12,
		"compound":{
			"mp_cost":-2,
			"mp_reduction":2,
		},
		"name":"Amulet of MP",
		"grades":[0,0],
		"g":56000000,
		"a":true,
	},
	"suckerpunch":{
		"set":"fury",
		"type":"ring",
		"skin":"suckerpunch",
		"crit":2,
		"apiercing":20,
		"lifesteal":2,
		"compound":{
			"apiercing":20,
			"crit":1,
			"lifesteal":1,
		},
		"name":"Sucker Punch",
		"g":3200000,
		"grades":[0,0],
		"a":true,
	},
	"vring":{
		"set":"vampires",
		"type":"ring",
		"skin":"vring",
		"str":12,
		"dreturn":9,
		"lifesteal":6,
		"vit":6,
		"armor":10,
		"pnresistance":4,
		"courage":1,
		"compound":{
			"str":4,
		},
		"name":"Vampiring",
		"g":4200000,
		"grades":[0,0],
		"a":true,
	},
	"trigger":{
		"type":"ring",
		"skin":"trigger",
		"stun":1.5,
		"str":6,
		"apiercing":10,
		"compound":{
			"stun":0.75,
			"str":2,
			"apiercing":2,
		},
		"name":"The Trigger",
		"g":6400000,
		"grades":[0,0,1,3],
		"a":true,
	},
	"zapper":{
		"type":"ring",
		"skin":"zapper",
		"rpiercing":10,
		"int":10,
		"str":5,
		"resistance":30,
		"compound":{
			"int":3,
			"rpiercing":4,
		},
		"name":"The Zapper",
		"ability":"zapperzap",
		"g":6400000,
		"grades":[0,0,1,3],
		"a":true,
	},
	// "supermagicalring":{
	// 	"type":"ring",
	// 	"skin":"supermagicalring",
	// 	"armor":20,
	// 	"compound":{
	// 		"armor":6,
	// 		"dreturn":0.125,
	// 	},
	// 	"name":"Ring of Armor",
	// 	"g":1200000,
	// 	"a":true,
	// },
	"goldring":{
		"type":"ring",
		"skin":"goldenring",
		"gold":4,
		"compound":{
			"gold":2,
		},
		"name":"Ring of Gold",
		"grades":[0,2],
		"g":28000000,
		"a":true,
	},
	"armorring":{
		"type":"ring",
		"skin":"armorring",
		"armor":24,
		"compound":{
			"armor":9,
			"dreturn":0.250,
		},
		"name":"Ring of Armor",
		"grades":[1,4],
		"g":180000,
		"a":true,
	},
	"resistancering":{
		"type":"ring",
		"skin":"resistancering",
		"resistance":24,
		"compound":{
			"resistance":9,
			"reflection":0.125,
		},
		"name":"Ring of Resistance",
		"grades":[1,4],
		"g":180000,
		"a":true,
	},
	"ringofluck":{
		"type":"ring",
		"skin":"ringofluck",
		"luck":10,
		"compound":{
			"luck":5,
		},
		"name":"Ring of Luck",
		"g":6400000,
		"grades":[0,0],
		"a":true,
	},
	"ringhs":{
		"set":"holidays",
		"type":"ring",
		"skin":"ringhs",
		"luck":8,
		"str":4,
		"int":4,
		"dex":4,
		"vit":10,
		"ability":"secondchance",
		"attr0":3,
		"compound":{
			"luck":3,
			"vit":5,
		},
		"name":"Ring of Holidays",
		"g":6400000,
		"grades":[0,0],
		"a":true,
	},
	"molesteeth":{
		"type":"earring",
		"skin":"molesteeth",
		"apiercing":15,
		"compound":{
			"apiercing":15,
		},
		"name":"Mole's Teeth",
		"g":500000,
		"grades":[0,1],
		"a":true,
	},
	"mearring":{
		"set":"holidays",
		"type":"earring",
		"skin":"mearring",
		"luck":8,
		"compound":{
			"luck":4,
		},
		"name":"Mistletoe Earring",
		"g":12000000,
		"grades":[0,0],
		"a":true,
	},
	"tristone":{
		"type":"ring",
		"skin":"tristone",
		"skin_a":"tristone_a",
		"apiercing":5,
		"rpiercing":5,
		"int":1,
		"str":1,
		"dex":1,
		"vit":1,
		"compound":{
			"apiercing":5,
			"rpiercing":5,
			"int":1,
			"str":1,
			"dex":1,
			"vit":1,
		},
		"name":"Legacy Tri-Stone",
		"ignore":true,
		"g":50000,
		"grades":[1,4],
		"action":"ACTIVATE!",
		"onclick":"socket.emit('activate',{slot:$(this).data('id')})"
	},
	"ctristone":{
		"type":"ring",
		"skin":"tristone",
		"apiercing":5,
		"rpiercing":5,
		"int":1,
		"str":1,
		"dex":1,
		"vit":1,
		"compound":{
			"apiercing":5,
			"rpiercing":5,
			"int":1,
			"str":1,
			"dex":1,
			"vit":1,
		},
		"name":"Tri-Stone",
		"g":50000,
		"grades":[1,4],
	},
	"darktristone":{
		"type":"ring",
		"skin":"darktristone",
		"skin_a":"darktristone_a",
		"apiercing":5,
		"rpiercing":5,
		"int":1,
		"str":1,
		"dex":1,
		"vit":1,
		"evasion":3,
		"compound":{
			"apiercing":5,
			"rpiercing":5,
			"int":1,
			"str":1,
			"dex":1,
			"vit":1,
		},
		"name":"Legacy Dark Tri-Stone",
		"ignore":true,
		"g":50000,
		"grades":[1,4],
		"action":"ACTIVATE!",
		"onclick":"socket.emit('activate',{slot:$(this).data('id')})"
	},
	"cdarktristone":{
		"type":"ring",
		"skin":"darktristone",
		"apiercing":5,
		"rpiercing":5,
		"int":1,
		"str":1,
		"dex":1,
		"vit":1,
		"evasion":3,
		"compound":{
			"apiercing":5,
			"rpiercing":5,
			"int":1,
			"str":1,
			"dex":1,
			"vit":1,
		},
		"name":"Dark Tri-Stone",
		"g":50000,
		"grades":[1,4],
	},
	"skullamulet":{
		"type":"amulet",
		"skin":"skullamulet",
		"hp":200,
		"armor":10,
		"for":4,
		"str":1,
		"int":1,
		"dex":1,
		"compound":{
			"armor":5,
			"for":1,
			"hp":320,
			"str":1,
			"int":1,
			"dex":1,
		},
		"name":"Skull Amulet",
		"grades":[2,4],
		"g":30000,
		"a":true,
	},
	"spookyamulet":{
		"type":"amulet",
		"skin":"spookyamulet",
		"name":"Amulet of Spooks",
		"reflection":2,
		"evasion":5,
		"xp":2,
		"gold":2,
		"luck":2,
		"compound":{
			"reflection":0.25,
			"evasion":0.625,
			"xp":0.25,
			"gold":0.25,
			"luck":0.25,
		},
		"grades":[0,3],
		"g":320000,
		"a":true,
	},
	"hpamulet":{
		"type":"amulet",
		"skin":"hpamulet",
		"hp":200,
		"compound":{
			"hp":240,
		},
		"name":"Amulet of HP",
		"g":20000,
	},
	"snring":{
		"type":"amulet",
		"skin":"snring",
		"str":14,
		"dex":2,
		"armor":20,
		"compound":{
			"str":2,
			"dex":1,
			"armor":5,
		},
		"name":"Stompy's Nose Ring",
		"g":2400000,
		"grades":[0,0],
	},
	"sanguine":{
		"type":"amulet",
		"skin":"sanguine",
		"dex":5,
		"int":5,
		"str":5,
		"attr0":2,
		"hp":1200,
		"aura":"sanguine",
		"compound":{
			"attr0":0.5,
			"str":1,
			"int":1,
			"dex":1,
			"hp":300,
		},
		"name":"Sanguine Amulet",
		"grades":[0,0],
		"g":32000000,
	},
	"dexamulet":{
		"type":"amulet",
		"skin":"dexamulet",
		"dex":4,
		"compound":{
			"dex":3,
		},
		"name":"Amulet of Dexterity",
		"g":30000,
	},
	"stramulet":{
		"type":"amulet",
		"skin":"stramulet",
		"str":4,
		"compound":{
			"str":3,
		},
		"name":"Amulet of Strength",
		"g":30000,
	},
	"intamulet":{
		"type":"amulet",
		"skin":"intamulet",
		"int":4,
		"compound":{
			"int":3,
		},
		"name":"Amulet of Intelligence",
		"g":30000,
	},
	"t2stramulet":{
		"type":"amulet",
		"skin":"t2stramulet",
		"str":6,
		"resistance":30,
		"compound":{
			"str":3,
			"resistance":20,
		},
		"name":"Amulet of the Eager Warrior",
		"g":160000,
		"edge":-1,
		"grades":[0,2],
	},
	"t2intamulet":{
		"type":"amulet",
		"skin":"t2intamulet",
		"int":6,
		"armor":30,
		"compound":{
			"int":3,
			"armor":20,
		},
		"name":"Amulet of the Fierce Mage",
		"g":160000,
		"edge":-1,
		"grades":[0,2],
	},
	"t2dexamulet":{
		"type":"amulet",
		"skin":"t2dexamulet",
		"dex":6,
		"vit":5,
		"compound":{
			"dex":3,
			"vit":3,
		},
		"name":"Amulet of the Stubborn Ranger",
		"g":160000,
		"edge":-1,
		"grades":[0,2],
	},
	"warmscarf":{
		"type":"amulet",
		"skin":"warmscarf",
		"armor":10,
		"resistance":10,
		"int":2,
		"str":2,
		"dex":2,
		"apiercing":5,
		"rpiercing":5,
		"upgrade":{
			"apiercing":1.25,
			"rpiercing":1.25,
		},
		"name":"Warm Scarf",
		"explanation":"Stylish and deadly!",
		"g":20000,
		"a":true,
		"grades":[7,9],
	},
	"hpbelt":{
		"type":"belt",
		"skin":"hpbelt",
		"hp":160,
		"compound":{
			"hp":240,
		},
		"name":"Belt of HP",
		"g":20000,
	},
	"mpxbelt":{
		"set":"mpx",
		"type":"belt",
		"skin":"mpxbelt",
		"mp_cost":-5,
		"mp_reduction":10,
		"compound":{
			"mp_cost":-1,
			"mp_reduction":5,
		},
		"name":"Belt of MP Reduction",
		"grades":[0,0],
		"g":1200000,
	},
	"lbelt":{
		"type":"belt",
		"skin":"lbelt",
		"speed":1,
		"armor":15,
		"compound":{
			"speed":1.10,
			"armor":5,
		},
		"name":"Belt",
		"explanation":"A belt that can actually hold your pants in place!",
		"g":40000,
	},
	"strbelt":{
		"type":"belt",
		"skin":"strbelt",
		"str":4,
		"compound":{
			"str":3,
		},
		"name":"Belt of Strength",
		"g":50000,
		"grades":[2,5],
	},
	"mbelt":{
		"type":"belt",
		"skin":"mbelt",
		"int":8,
		"dex":8,
		"speed":1,
		"armor":15,
		"compound":{
			"speed":1.10,
			"armor":10,
		},
		"a":true,
		"name":"Well-Crafted Belt",
		"g":640000,
		"grades":[0,1],
	},
	"sbelt":{
		"type":"belt",
		"skin":"sbelt",
		"for":12,
		"int":8,
		"dex":8,
		"str":8,
		"resistance":15,
		"armor":15,
		"compound":{
			"int":2,
			"dex":2,
			"str":2,
			"resistance":10,
			"armor":10,
		},
		"a":true,
		"name":"Belt of Hallowed Trials",
		"g":640000,
		"grades":[0,1],
	},
	"santasbelt":{
		"set":"holidays",
		"type":"belt",
		"skin":"santasbelt",
		"evasion":4,
		"dex":3,
		"compound":{
			"dex":2,
		},
		"a":true,
		"name":"Santa's Belt",
		"g":640000,
		"grades":[0,3],
	},
	"dexbelt":{
		"type":"belt",
		"skin":"dexbelt",
		"dex":4,
		"compound":{
			"dex":3,
		},
		"name":"Belt of Dexterity",
		"g":50000,
		"grades":[2,5],
	},
	"intbelt":{
		"type":"belt",
		"skin":"intbelt",
		"int":4,
		"compound":{
			"int":3,
		},
		"name":"Belt of Intelligence",
		"g":50000,
		"grades":[2,5],
	},
	"ringsj":{
		"type":"ring",
		"skin":"ring",
		"int":1,
		"str":1,
		"dex":1,
		"resistance":5,
		"compound":{
			"int":1,
			"str":1,
			"dex":1,
			"resistance":5,
		},
		"name":"Ring of Small Joys",
		"g":24000,
	},
	"solitaire":{
		"type":"ring",
		"skin":"solitaire",
		"bling":10,
		"compound":{
			"bling":30,
		},
		"name":"Solitaire Ring",
		"explanation":"The diamond is mesmerizing",
		"g":1200000,
		"grades":[0,0],
		"event":true,
	},
	"vitring":{
		"type":"ring",
		"skin":"vitring",
		"vit":2,
		"compound":{
			"vit":2,
		},
		"name":"Ring of Vitality",
		"g":24000,
	},
	"strring":{
		"type":"ring",
		"skin":"strring",
		"str":2,
		"compound":{
			"str":2,
		},
		"name":"Ring of Strength",
		"g":24000,
	},
	"intring":{
		"type":"ring",
		"skin":"intring",
		"int":2,
		"compound":{
			"int":2,
		},
		"name":"Ring of Intelligence",
		"g":24000,
	},
	"dexring":{
		"type":"ring",
		"skin":"dexring",
		"dex":2,
		"compound":{
			"dex":2,
		},
		"name":"Ring of Dexterity",
		"g":24000,
	},
	"cring":{
		"type":"ring",
		"skin":"cring",
		"dex":4,
		"int":4,
		"compound":{
			"dex":2,
			"int":2,
		},
		"edge":-2,
		"name":"Ring of The Crypt",
		"g":240000,
		"grades":[0,4],
	},
	"cearring":{
		"type":"earring",
		"skin":"cearring",
		"str":5,
		"int":5,
		"compound":{
			"str":2,
			"int":2,
		},
		"edge":-2,
		"name":"Earring of The Crypt",
		"g":380000,
		"grades":[0,4],
	},
	"intearring":{
		"type":"earring",
		"skin":"intearring",
		"int":3,
		"compound":{
			"int":2,
		},
		"name":"Earring of Intelligence",
		"g":38000,
		"grades":[2,5],
	},
	"strearring":{
		"type":"earring",
		"skin":"strearring",
		"str":3,
		"compound":{
			"str":2,
		},
		"name":"Earring of Strength",
		"g":38000,
		"grades":[2,5],
	},
	"dexearring":{
		"type":"earring",
		"skin":"dexearring",
		"dex":3,
		"compound":{
			"dex":2,
		},
		"name":"Earring of Dexterity",
		"g":38000,
		"grades":[2,5],
	},
	"dexearringx":{
		"type":"earring",
		"skin":"dexearringx",
		"dex":6,
		"luck":2,
		"speed":1,
		"compound":{
			"dex":2,
			"luck":2,
		},
		"name":"Enchanted Earring",
		"g":38000,
		"grades":[0,2],
	},
	"vitearring":{
		"type":"earring",
		"skin":"vitearring",
		"vit":3,
		"compound":{
			"vit":2,
		},
		"name":"Earring of Vitality",
		"g":38000,
		"grades":[2,5],
	},
}

for(var name in accessories){
	var current=accessories[name];
	if(!("grades" in current)) current["grades"]=[3,5];
}

//Ring of Mage PVP: 30 Armor, 10 Res. Piercing, 120HP
//Ring of Warrior PVP: 20 Res, 10 Armor, 10 Armor. Piercing

var weapons={
	"claw":{
		"type":"weapon",
		"wtype":"fist",
		"tier":1,
		"skin":"claw",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Claw",
		"g":7200,
	},
	"cclaw":{
		"type":"weapon",
		"wtype":"fist",
		"tier":1.5,
		"skin":"cclaw",
		"apiercing":20,
		"damage_type":"physical",
		"upgrade":{
			"apiercing":4,
		},
		"name":"Crab Claw",
		"g":9600,
	},
	"throwingstars":{
		"type":"weapon",
		"wtype":"stars",
		"tier":1,
		"skin":"throwingstars",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Throwing Stars",
		"g":72000,
	},
	"snowflakes":{
		"type":"weapon",
		"wtype":"stars",
		"tier":2,
		"ability":"freeze",
		"attr0":1,
		"skin":"snowflakes",
		"skin_r":"snowflakes_r",
		"damage_type":"physical",
		"upgrade":{
			"attr0":1,
		},
		"name":"Snowflakes",
		"g":92000,
	},
	"firestars":{
		"type":"weapon",
		"wtype":"stars",
		"tier":2.5,
		"skin":"firestars",
		"skin_r":"firestars_r",
		"damage_type":"physical",
		"ability":"burn",
		"attr0":1.5,
		"upgrade":{
			"attr0":0.5,
		},
		"name":"Fiery Throwing Stars",
		"g":290000,
	},
	"fclaw":{
		"type":"weapon",
		"wtype":"fist",
		"tier":2,
		"skin":"fclaw",
		"skin_r":"fclaw_r",
		"damage_type":"physical",
		"ability":"freeze",
		"attr0":0.2,
		"int":8,
		"upgrade":{
			"attr0":0.1,
		},
		"name":"Frozen Claw",
		"g":72000,
		"a":true,
		"grades":[0,7],
	},
	"pclaw":{
		"type":"weapon",
		"wtype":"fist",
		"tier":2.4,
		"skin":"pclaw",
		"damage_type":"physical",
		"ability":"poison",
		"attr0":1,
		"pnresistance":2,
		"upgrade":{
			"attr0":0.5,
			"pnresistance":1,
		},
		"name":"Poison Claw",
		"g":72000,
		"a":true,
		"grades":[0,7],
	},
	"stinger":{
		"type":"weapon",
		"wtype":"dagger",
		"tier":1.4,
		"str":12,
		"skin":"stinger",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Stinger",
		"g":16000,
		"cx":{"accent":"#96783E"},
	},
	"dagger":{
		"type":"weapon",
		"wtype":"dagger",
		"tier":2,
		"skin":"dagger",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Dagger",
		"g":167000,
		"a":true,
		"cx":{"accent":"#3B9A5C"},
	},
	"daggerofthedead":{
		"type":"weapon",
		"wtype":"dagger",
		"tier":2.4,
		"skin":"daggerofthedead",
		"vit":-6,
		"speed":-2,
		"apiercing":20,
		"str":20,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Dagger of the Dead",
		"explanation":"A deadly weapon",
		"g":224000,
		"a":true,
		"grades":[0,6],
		"cx":{"accent":"#D87F0E"},
	},
	"dragondagger":{
		"type":"weapon",
		"wtype":"dagger",
		"tier":3,
		"skin":"dragondagger",
		"range":4,
		"armor":40,
		"str":20,
		"damage_type":"physical",
		"upgrade":{
			"armor":4,
		},
		"name":"Dragon Dagger",
		"g":2400000,
		"a":true,
		"grades":[0,0],
		"explanation":"Majestic",
		"cx":{"accent":"#D19FDA"},
	},
	"hdagger":{
		"type":"weapon",
		"wtype":"dagger",
		"tier":3,
		"class":["rogue"],
		"skin":"hdagger",
		"firesistance":15,
		"range":4,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Dagger of Hallowing",
		"g":2400000,
		"a":true,
		"grades":[0,0],
		"cx":{"accent":"#847ADA"},
	},
	"dartgun":{
		"type":"weapon",
		"wtype":"dartgun",
		"tier":3,
		"skin":"dartgun",
		"damage_type":"physical",
		"upgrade":{
		},
		"projectile": "dartgun",
		"name":"Golden Dart Gun",
		"explanation":"Don't let the looks fool you. It's a solid weapon with most components forged from gold. The barrel and trigger mechanism is a platinum alloy. Can shoot anything that fits its barrel, like actual gold.",
		"g":20000000,
		"grades":[0,0],
		"cx":{
			"scale":0.5,
			"extension":true,
		},
	},
	"rod":{
		"type":"tool",
		"wtype":"rod",
		"tier":1,
		"skin":"rod",
		"name":"Fishing Rod",
		"breaks":1,
		"g":2000,
		"upgrade":{
			"breaks":-0.064,
		},
	},
	"pickaxe":{
		"type":"tool",
		"wtype":"pickaxe",
		"tier":1,
		"skin":"pickaxe",
		"name":"Pickaxe",
		"breaks":1,
		"g":2000,
		"upgrade":{
			"breaks":-0.064,
		},
	},
	"bow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"bow",
		"tier":1,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Bow",
		"g":16000,
		"cx":{"accent":"#AF2131"},
	},
	"pouchbow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"pouchbow",
		"tier":0.2,
		"explosion":10,
		"mp_reduction":-10,
		"projectile":"pouch",
		"damage_type":"physical",
		"upgrade":{
			"explosion":2,
		},
		"name":"Poucher",
		"g":24000,
		"cx":{"accent":"#9D7B1B"},
	},
	"weaver":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"weaver",
		"tier":1.75,
		"ability":"weave",
		"attr0":4,
		"attr1":1,
		"damage_type":"physical",
		"upgrade":{
			"attr0":2,
			"attr1":0.2,
		},
		"name":"Bow of the Weaver",
		"g":36000,
		"cx":{"accent":"#AF2131"},
	},
	"crossbow":{
		"type":"weapon",
		"wtype":"crossbow",
		"skin":"crossbow",
		"tier":2,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Crossbow",
		"g":480000,
		"projectile":"crossbowarrow",
	},
	"hbow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"hbow",
		"tier":1.5,
		"range":20,
		"apiercing":40,
		"damage_type":"physical",
		"upgrade":{
			"apiercing":5
		},
		"name":"Hunting Bow",
		"g":16000,
		"cx":{"accent":"#8B7FD6"},
	},
	"merry":{
		"set":"holidays",
		"type":"weapon",
		"wtype":"bow",
		"skin":"merry",
		"ability":"secondchance",
		"attr0":10,
		"tier":1.5,
		"damage_type":"physical",
		"upgrade":{
			"attr0":2,
		},
		"name":"Bow of The Merry Ranger",
		"g":124000,
		"grades":[0,8],
		"cx":{"accent":"#289E4D"},
	},
	"cupid":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"cupid",
		"projectile":"cupid",
		"tier":2.5,
		"range":-20,
		"vit":10,
		"damage_type":"heal",
		"upgrade":{
			"vit":2,
		},
		"grades":[0,6],
		"name":"Cupid's Bow",
		"g":90000,
		"a":true,
		"event":true,
		"cx":{
			"accent":"#DB2A86",
			//"large":true,
		}
	},
	"firebow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"firebow",
		"skin_r":"firebow_r",
		"projectile":"firearrow",
		"tier":2,
		"range":-20,
		"damage_type":"physical",
		"ability":"burn",
		"attr0":2,
		"upgrade":{
			"attr0":0.5,
		},
		"name":"Fire Bow",
		"explanation":"Rains fire upon the enemy",
		"g":178000,
		"grades":[0,8],
		"a":true,
		"cx":{"accent":"#E34C25"},
		//"cx":{"accent":"#D3001E"},
	},
	"frostbow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"frostbow",
		"skin_r":"frostbow_r",
		"projectile":"frostarrow",
		"tier":2,
		"damage_type":"physical",
		"ability":"freeze",
		"attr0":2,
		"upgrade":{
			"attr0":0.5,
		},
		"name":"Frost Bow",
		"explanation":"Let your enemy feel the cold",
		"g":78000,
		"grades":[0,7],
		"a":true,
		"cx":{"accent":"#2D9DE5"},
	}, 
	"t2bow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"t2bow",
		"tier":2,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Well-Crafted Bow",
		"explanation":"Crafted with the finest of materials",
		"g":78000,
		"grades":[0,7],
		"a":true,
		"cx":{"accent":"#CD3F3B"},
	},
	"harpybow":{
		"type":"weapon",
		"wtype":"bow",
		"tier":3,
		"speed":2,
		"evasion":5,
		"skin":"harpybow",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Harpy Bow",
		"explanation":"A bow decorated with exclusive Harpy feathers!",
		"g":780000,
		"a":true,
		"cx":{"accent":"#DE6F22"},
	},
	"t3bow":{
		"type":"weapon",
		"wtype":"bow",
		"tier":3,
		"skin":"t3bow",
		"damage_type":"physical",
		"critdamage":12,
		"upgrade":{
		},
		"name":"Artisan's Bow",
		"explanation":"Crafted by the finest of bowmasters",
		"g":780000,
		"a":true,
		"cx":{"accent":"#DE6F22"},
	},
	"bowofthedead":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"bowofthedead",
		"tier":2.4,
		"crit":1,
		"str":20,
		"vit":-2,
		"speed":-12,
		"range":-10,
		"damage_type":"physical",
		"upgrade":{
			"crit":0.2,
		},
		"name":"Bow of the Dead",
		"explanation":"A weapon of death",
		"g":228000,
		"a":true,
		"cx":{"accent":"#D87F0E"},
	},
	"gbow":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"gbow",
		"projectile":"garrow",
		"tier":2.5,
		"str":3,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Bow of the Feared Ranger",
		"g":3200000,
		"grades":[0,0],
		"a":true,
		"cx":{
			"accent":"#DF6915",
			//"lightborder":true,
			"border":1,
		},
	},
	"bow4":{
		"type":"weapon",
		"wtype":"bow",
		"skin":"bow4",
		"tier":4,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"T4 Bow",
		"g":16000,
		"ignore":true,
		"cx":{"accent":"#E4B81D"},
	},
	"spear":{
		"type":"weapon",
		"wtype":"spear",
		"tier":1.25,
		"skin":"spear",
		"apiercing":10,
		"damage_type":"physical",
		"upgrade":{
			"apiercing":5,
		},
		"name":"Spear",
		"g":72000,
		"a":2,
		"grades":[3,8],
		"cx":{"accent":"#AE4731"},
	},
	"spearofthedead":{
		"type":"weapon",
		"wtype":"spear",
		"tier":2.4,
		"skin":"spearofthedead",
		"str":8,
		"for":3,
		"apiercing":12,
		"damage_type":"physical",
		"upgrade":{
			"apiercing":5,
		},
		"name":"Spear of the Dead",
		"explanation":"A deadly weapon",
		"g":724000,
		"a":true,
		"cx":{"accent":"#D87F0E"},
	},
	"scythe":{
		"type":"weapon",
		"wtype":"scythe",
		"tier":3,
		"skin":"scythe",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Skeletor's Scythe",
		"g":8600000,
		"cx":{"accent":"#5AAEED"},
	},
	"blade":{
		"type":"weapon",
		"wtype":"short_sword",
		"tier":1,
		"skin":"blade",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Blade",
		"g":8400,
	},
	"sword":{
		"type":"weapon",
		"wtype":"short_sword",
		"tier":2.5,
		"skin":"sword",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Short Sword",
		"g":48000,
		"cx":{"accent":"#CC5A10"},
	},
	"swifty":{
		"type":"weapon",
		"wtype":"sword",
		"tier":1.75,
		"dex":12,
		"skin":"swifty",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Swifty",
		"g":48000,
		"cx":{"accent":"#CC54B2"},
	},
	"fsword":{
		"type":"weapon",
		"wtype":"short_sword",
		"tier":2,
		"skin":"fsword",
		"skin_r":"fsword_r",
		"damage_type":"physical",
		"ability":"freeze",
		"attr0":0.2,
		"int":8,
		"upgrade":{
			"attr0":0.1,
		},
		"name":"Frozen Sword",
		"g":72000,
	},
	"rapier":{
		"type":"weapon",
		"wtype":"rapier",
		"tier":2,
		"skin":"rapier",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Rapier",
		"g":84000,
		"cx":{
			"scale":0.75,
			//"small":true,
			"large":true,
		},
		"cx":{"accent":"#5085B0"},
	},
	"basher":{
		"type":"weapon",
		"wtype":"basher",
		"tier":2,
		"skin":"basher",
		"damage_type":"physical",
		"armor":20,
		"stun":0.5,
		//"attr0":0.5, #probability
		//"attr1":1, #duration
		//"ability":"bash",
		"upgrade":{
			"stun":0.5,
			//"attr0":0.4,
			//"attr1":0.2,
			"armor":4,
			"speed":1,
		},
		"name":"Basher",
		"g":72000,
		"a":true,
		"grades":[0,7],
		"cx":{"accent":"#5085B0"},
	},
	"bataxe":{
		"type":"weapon",
		"wtype":"axe",
		"tier":2.25,
		"skin":"bataxe",
		"damage_type":"physical",
		"reflection":4,
		"upgrade":{
		},
		"name":"Ghastly Battle Axe",
		"g":124000,
		"a":true,
		"grades":[0,6],
		"delia":"Now you see me, now you see the floor",
		"cx":{
			"accent":"#DF6915",
			"lightborder":true,
		},
	},
	"axe3":{
		"type":"weapon",
		"wtype":"axe",
		"tier":3,
		"skin":"axe3",
		"damage_type":"physical",
		"reflection":4,
		"upgrade":{
		},
		"name":"T3 Axe",
		"g":124000,
		"a":true,
		"cx":{
			"accent":"#DF6915",
			"lightborder":true,
		},
		"ignore":true,
	},
	"fireblade":{
		"type":"weapon",
		"wtype":"short_sword",
		"tier":2,
		"skin":"fireblade",
		"skin_r":"fireblade_r",
		"damage_type":"physical",
		"ability":"burn",
		"attr0":1.5,
		"upgrade":{
			"attr0":0.5,
		},
		"name":"Fiery Blade",
		"g":96000,
		"a":true,
		"grades":[0,8],
		//"cx":{"accent":"#D3001E"},
		"cx":{"accent":"#E34C25"},
	},
	"swordofthedead":{
		"type":"weapon",
		"wtype":"short_sword",
		"tier":2.5,
		"skin":"swordofthedead",
		"damage_type":"physical",
		"resistance":20,
		"attack":2,
		"str":10,
		"vit":-12,
		"upgrade":{
			"resistance":2.5,
		},
		"name":"Sword of the Dead",
		"g":224000,
		"a":true,
		"cx":{"accent":"#D87F0E"},
	},
	"woodensword":{
		"type":"weapon",
		"wtype":"sword",
		"tier":2,
		"skin":"woodensword",
		"damage_type":"physical",
		"dex":20,
		"upgrade":{
			"dex":2,
		},
		"name":"Wooden Sword",
		"g":224000,
		"a":true,
		"cx":{"accent":"#155E0C"},
	},
	"heartwood":{
		"type":"weapon",
		"wtype":"sword",
		"tier":3.5,
		"skin":"heartwood",
		"damage_type":"physical",
		"ability":"tangle",
		"dex":20,
		"speed":4,
		"upgrade":{
			"dex":4,
		},
		"name":"Heartwood",
		"explanation":"One with nature",
		"g":18700000,
		"a":true,
		"cx":{"accent":"#155E0C"},
	},
	"glolipop":{
		"type":"weapon",
		"wtype":"mace",
		"tier":0,
		"dex":24,
		"explosion":20,
		"skin":"glolipop",
		"ability":"sugarrush",
		"attr0": 0.25,
		"damage_type":"physical",
		"upgrade":{
			"explosion":2,
		},
		"name":"Lolipop Mace",
		"g":16000,
		"cx":{"accent":"#64B553"},
	},
	"ololipop":{
		"type":"weapon",
		"wtype":"mace",
		"tier":0,
		"str":24,
		"explosion":20,
		"skin":"ololipop",
		"damage_type":"physical",
		"ability":"sugarrush",
		"attr0": 0.25,
		"upgrade":{
			"explosion":2,
		},
		"name":"Lolipop Mace",
		"g":16000,
		"cx":{"accent":"#DB763B"},
	},
	"mace":{
		"type":"weapon",
		"wtype":"mace",
		"tier":1,
		"skin":"mace",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Mace",
		"g":3700,
		"cx":{"accent":"#AF2131"},
	},
	"xmace":{
		"set":"holidays",
		"type":"weapon",
		"wtype":"mace",
		"tier":2.25,
		"stun":2,
		"skin":"xmace",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Merry Mace",
		"g":37000,
		"cx":{"accent":"#AF2131"},
	},
	"wbasher":{
		"type":"weapon",
		"wtype":"basher",
		"tier":1,
		"skin":"wbasher",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Wooden Basher",
		"g":4900,
		"cx":{"accent":"#AF2131"},
	},
	"hammer":{
		"type":"weapon",
		"wtype":"mace",
		"tier":3,
		"skin":"hammer",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Hammer",
		"g":960000,
		"cx":{"accent":"#7A44A2"},
	},
	"vhammer":{
		"set":"vampires",
		"type":"weapon",
		"wtype":"mace",
		"tier":3,
		"lifesteal":3,
		"explosion":10,
		"skin":"vhammer",
		"damage_type":"physical",
		"upgrade":{
			"explosion":2,
		},
		"name":"Vampiric Hammer",
		"g":9600000,
		"cx":{"accent":"#B91A6A"},
	},
	"vstaff":{
		"set":"vampires",
		"type":"weapon",
		"wtype":"staff",
		"tier":3.25,
		"speed":8,
		"armor":120,
		"skin":"vstaff",
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Vampiric Staff",
		"g":9600000,
		"cx":{"accent":"#B91A6A"},
	},
	"vdagger":{
		"set":"vampires",
		"type":"weapon",
		"wtype":"dagger",
		"tier":3.25,
		"lifesteal":5,
		"skin":"vdagger",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Vampiric Dagger",
		"g":9600000,
		"cx":{"accent":"#B91A6A"},
	},
	"vsword":{
		"set":"vampires",
		"type":"weapon",
		"wtype":"sword",
		"tier":3.25,
		"lifesteal":5,
		"speed":1,
		"skin":"vsword",
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Vampiric Sword",
		"g":9600000,
		"cx":{"accent":"#B91A6A"},
	},
	"maceofthedead":{
		"type":"weapon",
		"tier":2.4,
		"wtype":"mace",
		"skin":"maceofthedead",
		"str":6,
		"speed":-3,
		"vit":-8,
		"damage_type":"physical",
		"upgrade":{
		},
		"name":"Mace of the Dead",
		"g":224000,
		"a":true,
		"cx":{"accent":"#D87F0E"},
	},
	"pmaceofthedead":{
		"type":"weapon",
		"tier":3,
		"wtype":"pmace",
		"skin":"pmaceofthedead",
		"str":20,
		"speed":-3,
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Hand of the Dead",
		"g":824000,
		"a":true,
		"cx":{"accent":"#D87F0E"},
	},
	"carrotsword":{
		"set":"bunny",
		"type":"weapon",
		"wtype":"short_sword",
		"tier":2,
		"skin":"carrotsword",
		"skin_c":"carrotsword_c",
		"range":-4,
		"dex":12,
		"charisma":-20,
		"damage_type":"physical",
		"upgrade":{
			"range":-0.25,
		},
		"name":"Carrot Sword",
		"g":92000,
		"a":true,
		"grades":[0,7],
		"cx":{
			"accent":"#E9711A",
			//"scale":0.75,
		},
	},
	"candycanesword":{
		"set":"holidays",
		"type":"weapon",
		"wtype":"short_sword",
		"tier":2,
		"range":-2,
		"skin":"candycanesword",
		"damage_type":"physical",
		"ability":"sugarrush",
		"attr0": 0.25,
		"upgrade":{
			"range":-0.5,
		},
		"name":"Candy Cane Sword",
		"g":72000,
		"a":true,
		"grades":[0,8],
	},
	"pinkie":{
		"set":"bunny",
		"type":"weapon",
		"wtype":"wand",
		"tier":1.75,
		"skin":"pinkie",
		"skin_r":"pinkie_r",
		"charisma":-100,
		"speed":2,
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Pink Wand",
		"grades":[0,7],
		"g":124000,
		"cx":{
			"accent":"#DF33EC",
			"scale":0.5,
			"extension":true,
		},
		"projectile":"pinky",
	},
	"wand":{
		"type":"weapon",
		"wtype":"wand",
		"tier":1,
		"skin":"wand",
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Wand",
		"g":48600,
		"cx":{
			"accent":"#EA6238",
			"scale":0.5,
			"extension":true,
		},
		"projectile":"wandy",
	},
	"broom":{
		"type":"weapon",
		"wtype":"staff",
		"tier":0,
		"speed":2,
		"evasion":5,
		"skin":"broom",
		"damage_type":"magical",
		"upgrade":{
			"speed":1,
			"evasion":1,
		},
		"name":"Broom",
		"g":128,
		"cx":{"accent":"#7B68A5"},
	},
	"staff":{
		"type":"weapon",
		"wtype":"staff",
		"tier":1,
		"skin":"staff",
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Staff",
		"g":12400,
		"cx":{"accent":"#AF2131"},
	},
	"gstaff":{
		"type":"weapon",
		"wtype":"great_staff",
		"projectile":"bigmagic",
		"tier":3,
		"blast":40,
		"skin":"blaster",
		"damage_type":"magical",
		"upgrade":{
			"blast":5,
		},
		"name":"Blaster",
		"explanation":"[Warning] Highly volatile - might lose its power suddenly!",
		"g":1240000,
		"cx":{"accent":"#AF2131"},
	},
	"sparkstaff":{
		"type":"weapon",
		"wtype":"great_staff",
		"projectile":"magic",
		"tier":2.5,
		"blast":30,
		"skin":"sparkstaff",
		"damage_type":"magical",
		"upgrade":{
			"blast":5,
		},
		"name":"Spark Staff",
		"g":224000,
		"grades":[0,5],
		"cx":{"accent":"#201DAD"},
	},
	"staff2":{
		"type":"weapon",
		"wtype":"staff",
		"tier":2,
		"skin":"staff",
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"T2 Staff",
		"g":12400,
		"cx":{"accent":"#AF2131"},
		"ignore":true,
	},
	"staff3":{
		"type":"weapon",
		"wtype":"staff",
		"tier":3,
		"skin":"staff",
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"T3 Staff",
		"g":12400,
		"cx":{"accent":"#AF2131"},
		"ignore":true,
	},
	"staff4":{
		"type":"weapon",
		"wtype":"staff",
		"tier":4,
		"skin":"staff",
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"T4 Staff",
		"g":12400,
		"cx":{"accent":"#AF2131"},
		"ignore":true,
	},
	"slimestaff":{
		"class":["priest"],
		"type":"weapon",
		"wtype":"staff",
		"tier":1.5,
		"skin":"slimestaff",
		"dex":5,
		"speed":-5,
		"damage_type":"magical",
		"upgrade":{
			"dex":2,
		},
		"name":"Slime Staff",
		"g":16400,
		"cx":{"accent":"#48A763"},
	},
	"mushroomstaff":{
		"class":["mage"],
		"type":"weapon",
		"wtype":"staff",
		"tier":1.25,
		"skin":"mushroomstaff",
		"rpiercing":40,
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Mushroom Staff",
		"g":16400,
		"cx":{"accent":"#D34C57"},
	},
	"firestaff":{
		"type":"weapon",
		"wtype":"staff",
		"tier":2,
		"skin":"firestaff",
		"skin_r":"firestaff_r",
		"projectile": "fireball",
		"damage_type":"magical",
		"ability":"burn",
		"attr0":2,
		"upgrade":{
			"attr0":0.5,
		},
		"name":"Fiery Staff",
		"g":189000,
		"a":true,
		"grades":[0,8],
		"cx":{"accent":"#D3001E"},
	},
	"ornamentstaff":{
		"set":"holidays",
		"type":"weapon",
		"wtype":"staff",
		"tier":2,
		"skin":"ornamentstaff",
		"mp_cost":-40,
		"awesomeness":99,
		"damage_type":"magical",
		"upgrade":{
			"awesomeness":0.1,
		},
		"name":"Ornament Staff",
		"g":120000,
		"a":true,
		"grades":[0,7],
		"cx":{"accent":"#0B5818"},
	},
	"staffofthedead":{
		"type":"weapon",
		"wtype":"staff",
		"tier":2.5,
		"skin":"staffofthedead",
		"str":32,
		"speed":-6,
		"damage_type":"magical",
		"upgrade":{
		},
		"name":"Staff of the Dead",
		"g":224000,
		"a":true,
		"grades":[0,6],
		"cx":{"accent":"#D87F0E"},
	},
	"froststaff":{
		"type":"weapon",
		"wtype":"staff",
		"tier":2,
		"skin":"froststaff",
		"skin_r":"froststaff_r",
		"projectile":"frostball",
		"damage_type":"magical",
		"int":2,
		"ability":"freeze",
		"attr0":4,
		"upgrade":{
			"int":0.2,
			"attr0":1.25,
		},
		"name":"Frost Staff",
		"g":289000,
		"a":true,
		"grades":[0,8],
	},
	"oozingterror":{
		"type":"weapon",
		"wtype":"staff",
		"tier":2.75,
		"skin":"oozingterror",
		"projectile_test":"acid",
		"projectile":"magic_purple",
		"reflection":1,
		"vit":-30,
		"int":20,
		"damage_type":"magical",
		"ability":"poison",
		"attr0":1.5,
		"upgrade":{
			"reflection":0.25,
			"int":1,
			"attr0":1,
		},
		"name":"Oozing Terror",
		"g":289000,
		"a":true,
		"grades":[0,5],
		"explanation":"It drains the life energy of the user",
		"nopo":"Mutates the brain to maximize its potential, sapping the user's life in the process.",
		"cx":{"accent":"#745DD6"},
	},
	"harbringer":{
		"type":"weapon",
		"wtype":"staff",
		"tier":2.75,
		"skin":"harbringer",
		"skin_r":"harbringer_r",
		"projectile":"magic_divine",
		"rpiercing":10,
		"damage_type":"magical",
		"upgrade":{
			"rpiercing":5,
		},
		"name":"Harbringer",
		"g":289000,
		"a":true,
		"grades":[0,5],
		"explanation":"Pure, unfiltered power!",
		"trex":"This staff is a relic of a past age long forgotten. Thought to be forged by the God of Lighting. Those who have seen this staff claim it radiates powerful energy. Though this staff is only wielded by few, it is feared by all.",
	},
	"wblade":{
		"type":"weapon",
		"wtype":"wblade",
		"tier":4,
		"skin":"wblade",
		"rpiercing":40,
		"evasion":10,
		"damage_type":"magical",
		"upgrade":{
			"evasion":1,
			"rpiercing":16,
		},
		"name":"Ethereal Blade of Destiny",
		"g":48900000,
		"a":true,
		"exclusive":true,
		"grades":[0,0],
		"projectile":"wmomentum",
	},
	"pmace":{
		"type":"weapon",
		"wtype":"pmace",
		"tier":2,
		"skin":"hammer",
		"class":["priest"],
		"int":8,
		"dex":4,
		"speed":-2,
		"damage_type":"physical",
		"upgrade":{
			"int":2,
			"dex":1,
		},
		"name":"Paladin's Hammer",
		"g":89000,
		"a":true,
		"grades":[0,8],
	},
	"lmace":{
		"type":"weapon",
		"wtype":"pmace",
		"tier":3,
		"skin":"lmace",
		"int":8,
		"str":6,
		"luck":6,
		"class":["priest"],
		"damage_type":"magical",
		"upgrade":{
			"int":2,
			"str":1,
		},
		"name":"Lunar Mace",
		"explanation":"Majestic",
		"g":890000,
		"a":true,
		"grades":[0,0],
	},
}

for(var name in weapons){
	var current=weapons[name]; var tier=(current["tier"]!==undefined?current["tier"]:1);
	if(!("upgrade" in current)) continue;
	if(!("grades" in current)){
		if(tier<1) current["grades"]=[8,9];
		else if(tier<=1) current["grades"]=[7,9];
		else if(tier<=1.5) current["grades"]=[5,8];
		else if(tier<=1.75) current["grades"]=[4,7];
		else if(tier<=2) current["grades"]=[0,7];
		else if(tier<=2.25) current["grades"]=[0,6];
		else if(tier<=2.4) current["grades"]=[0,5];
		else if(tier<=2.5) current["grades"]=[0,4];
		else if(tier<=2.75) current["grades"]=[0,3];
		else current["grades"]=[0,0];
	}
	if(current["grades"].length==2){
		current["grades"].push(10);
		current["grades"].push(12);
		if(tier>=4){
			current["grades"][2]=8;
			current["grades"][3]=10;
		}else if(tier>=3){
			current["grades"][2]=9;
			current["grades"][3]=10;
		}
		//else if(tier>=2){
		//	current["grades"][2]=10;
		//	current["grades"][3]=11;
		//}
	}
	var originals=[(current["range"]||0),(current["upgrade"]["range"]||0),(current["attack"]||0),(current["upgrade"]["attack"]||0)];
	if(current["wtype"]=="rod" || current["wtype"]=="pickaxe") continue;
	if(["short_sword","rapier","spear","sword","axe","scythe","great_sword","basher","fist","dagger","stars","dartgun","mace","bow","staff","great_staff","wblade","pmace","crossbow","wand"].indexOf(current["wtype"])==-1){
		console.log("CONVERT WTYPE: "+current["wtype"]+" for "+name);
		continue;
	}
	if(current["wtype"]=="short_sword"){
		current["range"]=5+(tier-1)*2;
		current["upgrade"]["range"]=1.5;
		current["attack"]=15+(tier-1)*6;
		current["upgrade"]["attack"]=4+(tier-1)*0.5;
	}
	if(current["wtype"]=="rapier"){
		current["range"]=5+(tier-1)*2;
		current["upgrade"]["range"]=1.5;
		current["attack"]=10+(tier-1)*5;
		current["upgrade"]["attack"]=2+(tier-1)*0.5;
	}
	if(current["wtype"]=="spear"){
		current["range"]=15+(tier-1)*2;
		current["upgrade"]["range"]=2;
		current["attack"]=15+(tier-1)*5;
		current["upgrade"]["attack"]=4.25+(tier-1)*0.7;
	}
	if(current["wtype"]=="fist"){
		current["range"]=5+(tier-1)*1;
		current["upgrade"]["range"]=1.5;
		current["attack"]=10+(tier-1)*4;
		current["upgrade"]["attack"]=3+(tier-1)*1;
	}
	if(current["wtype"]=="dagger"){
		current["range"]=5+(tier-1)*1;
		current["upgrade"]["range"]=2;
		current["attack"]=12+(tier-1)*5;
		current["upgrade"]["attack"]=3+(tier-1)*1;
	}
	if(current["wtype"]=="stars"){
		current["range"]=50+(tier-1)*10;
		current["upgrade"]["range"]=4+(tier-1)*1;
		current["attack"]=5+(tier-1)*2;
		current["upgrade"]["attack"]=2.5+(tier-1)*0.8;
	}
	if(current["wtype"]=="dartgun"){
		current["range"]=30+(tier-1)*10;
		current["upgrade"]["range"]=20;
		current["attack"]=10;
		current["upgrade"]["attack"]=5+(tier-1)*2.5;
	}
	if(current["wtype"]=="sword"){
		current["range"]=5+(tier-1)*3;
		current["upgrade"]["range"]=1.5;
		current["attack"]=15+(tier-1)*5;
		current["upgrade"]["attack"]=4+(tier-1)*1;
	}
	if(current["wtype"]=="axe" || current["wtype"]=="basher" || current["wtype"]=="great_sword" || current["wtype"]=="scythe"){ //Like 2X Sword
		current["range"]=5+(tier-1)*3;
		current["upgrade"]["range"]=1;
		current["attack"]=30+(tier-1)*9;
		current["upgrade"]["attack"]=7+(tier-1)*2.5;
		if(current["wtype"]=="great_sword"){
			current["attack"]+=4;
			current["upgrade"]["attack"]-=0.5;
		}
		if(current["wtype"]=="basher"){
			current["range"]-=2;
			current["attack"]-=4;
			current["upgrade"]["attack"]-=0.5;
		}
		if(current["wtype"]=="scythe"){
			current["range"]+=2;
		}
	}
	if(current["wtype"]=="mace"){
		current["range"]=5+(tier-1)*1;
		current["upgrade"]["range"]=1;
		current["attack"]=20+(tier-1)*6;
		current["upgrade"]["attack"]=4+(tier-1)*1.1;
	}
	if(current["wtype"]=="bow"){ //Bows are underperforming compared to Dual-Wield
		current["range"]=55+(tier-1)*10;
		current["upgrade"]["range"]=4+current["range"]*4.0/60;
		current["attack"]=(20+(tier-1)*6)*1.25; //Increase base attack by 25% 11/12/23
		current["upgrade"]["attack"]=(4+(tier-1)*0.8)*1.25; //Increase upgrade scaling by 25% 11/12/23
		current["projectile"]=(current["projectile"]||"arrow");
	}
	if(current["wtype"]=="staff"){
		current["range"]=50+(tier-1)*6;
		current["upgrade"]["range"]=3+(tier-1)*0.5;
		current["attack"]=25+(tier-1)*10;
		current["upgrade"]["attack"]=5+(tier-1)*0.5;
	}
	if(current["wtype"]=="great_staff"){
		current["range"]=70+(tier-1)*8;
		current["upgrade"]["range"]=3+(tier-1)*1;
		current["attack"]=35+(tier-1)*16;
		current["upgrade"]["attack"]=6+(tier-1)*1;
	}
	if(current["wtype"]=="wblade"){
		current["range"]=12+(tier-1)*6;
		current["upgrade"]["range"]=2;
		current["attack"]=24+(tier-1)*8;
		current["upgrade"]["attack"]=5+(tier-1)*1;
	}
	if(current["wtype"]=="pmace"){
		current["range"]=5+(tier-1)*5;
		current["upgrade"]["range"]=4+(tier-1)*1;
		current["attack"]=20+(tier-1)*5;
		current["upgrade"]["attack"]=5+(tier-1)*1;
	}
	if(current["wtype"]=="crossbow"){ //Like 1.4X Bow's
		current["range"]=85+(tier-1)*16;
		current["upgrade"]["range"]=4+current["range"]*4.0/60;
		current["attack"]=(30+(tier-1)*7)*1.25; //Match the Bow changes 11/12/23
		current["upgrade"]["attack"]=(5.5+(tier-1)*0.8)*1.25; //Match the Bow Changes 11/12/23
		current["projectile"]=(current["projectile"]||"arrow");
	}
	if(current["wtype"]=="wand"){
		current["range"]=30+(tier-1)*5;
		current["upgrade"]["range"]=4+current["range"]*4.0/60;
		current["attack"]=16+(tier-1)*5;
		current["upgrade"]["attack"]=3+(tier-1)*0.6;
	}
	current["range"]+=originals[0]; current["upgrade"]["range"]+=originals[1]; current["attack"]+=originals[2]; current["upgrade"]["attack"]+=originals[3];
}

var offhands={
	"shield":{
		"type":"shield",
		"tier":2,
		"skin":"shield",
		"armor":60,
		"resistance":20,
		"upgrade":{
			"armor":12.5,
			"resistance":7.5,
		},
		"name":"Shield",
		"g":24000,
		"grades":[4,8],
	},
	"tigershield":{
		"set":"tiger",
		"type":"shield",
		"tier":2.5,
		"speed":2,
		"skin":"tigershield",
		"armor":80,
		"resistance":30,
		"upgrade":{
			"armor":13.5,
			"resistance":8.5,
		},
		"name":"Shield of the Tiger",
		"g":240000,
		"grades":[0,6],
	},
	"xshield":{
		"type":"shield",
		"tier":3,
		"skin":"xshield",
		"resistance":24,
		"evasion":4,
		"int":4,
		"dex":6,
		"str":8,
		"crit":1,
		"speed":5,
		"xp":8,
		"upgrade":{
			"resistance":6,
			"str":1,
		},
		"name":"Shield X",
		"explanation":"A metallurgical failure but a magical marvel",
		"g":1200000,
		"grades":[0,0],
		"cx":{"accent":"#4D828F"},
	},
	"mshield":{
		"type":"shield",
		"tier":3,
		"skin":"mshield",
		"armor":20,
		"luck":8,
		"stat":5,
		"upgrade":{
			"luck":1,
			"stat":1.25,
			"armor":5,
		},
		"name":"Shield M",
		"g":1200000,
		"grades":[0,0],
		"cx":{"accent":"#E90010"},
	},
	"exoarm":{
		"type":"misc_offhand",
		"tier":3,
		"skin":"exoarm",
		"int":20,
		"str":24,
		"armor":80,
		"compound":{
			"int":6,
			"str":6,
		},
		"name":"Exoskeletal Arm",
		"explanation":"It does more than just enhance your natural movements, almost like it has a mind of its own.",
		"g":48000000,
		"grades":[0,0],
		"cx":{
		}
	},
	"lantern":{
		"type":"misc_offhand",
		"tier":3,
		"skin":"lantern",
		"resistance":120,
		"evasion":10,
		"compound":{
			"resistance":10,
			"evasion":5,
		},
		"name":"The Lantern",
		"explanation":"Forged from a naturally vibrating metal",
		"g":480000,
		"grades":[0,0],
		"cx":{
			"scale":0.5,
			//"extension":true,
		}
	},
	"sshield":{
		"type":"shield",
		"tier":2,
		"skin":"sshield",
		"armor":60,
		"resistance":20,
		"dreturn":3,
		"upgrade":{
			"dreturn":1.5,
			"armor":10,
			"resistance":7,
		},
		"name":"Spiked Shield",
		"g":24000,
		"grades":[4,8],
	},
	"wshield":{
		"type":"shield",
		"tier":1,
		"skin":"wshield",
		"armor":40,
		"resistance":15,
		"stat":2,
		"upgrade":{
			"armor":8,
			"resistance":5,
		},
		"name":"Wooden Shield",
		"g":4800,
		"grades":[7,9],
		"cx":{"accent":"#3D923A"},
	},
	"wbook0":{
		"type":"source",
		"tier":1,
		"skin":"wbook0",
		"int":6,
		"compound":{
			"int":5,
		},
		"name":"Book of Knowledge",
		"g":12000,
		"grades":[4,5],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook2":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbook0",
		"tier":1,
		"skin":"wbook0",
		"int":6,
		"compound":{
			"int":5,
		},
		"name":"Primer of Insight",
		"explanation":"A practical primer for an advancing Priest. Placeholder artwork reuses the Book of Knowledge.",
		"g":12000,
		"grades":[4,5],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook3":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbook0",
		"tier":1,
		"skin":"wbook0",
		"int":6,
		"compound":{
			"int":5,
		},
		"name":"Manual of Insight",
		"explanation":"A practical manual for an advancing Priest. Placeholder artwork reuses the Book of Knowledge.",
		"g":12000,
		"grades":[4,5],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook4":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbook1",
		"tier":1,
		"skin":"wbook1",
		"int":6,
		"compound":{
			"int":5,
		},
		"name":"Tome of Insight",
		"explanation":"A practical tome for an advancing Priest. Placeholder artwork reuses the Book of Secrets.",
		"g":12000,
		"grades":[4,5],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook1":{
		"type":"source",
		"tier":2,
		"skin":"wbook1",
		"int":16,
		"reflection":2,
		"vit":6,
		"compound":{
			"int":5,
			"reflection":1,
			"vit":2,
		},
		"name":"Book of Secrets",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook5":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbook1",
		"tier":2,
		"skin":"wbook1",
		"int":16,
		"compound":{
			"int":5,
		},
		"name":"Codex of Insight",
		"explanation":"An advanced codex for an experienced Priest. Placeholder artwork reuses the Book of Secrets.",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook6":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbookhs",
		"tier":2,
		"skin":"wbookhs",
		"int":16,
		"compound":{
			"int":5,
		},
		"name":"Grimoire of Insight",
		"explanation":"A masterwork grimoire for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook7":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbookhs",
		"tier":2,
		"skin":"wbookhs",
		"int":16,
		"compound":{
			"int":5,
		},
		"name":"Lexicon of Insight",
		"explanation":"A masterwork lexicon for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook8":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbookhs",
		"tier":2,
		"skin":"wbookhs",
		"int":16,
		"compound":{
			"int":5,
		},
		"name":"Archive of Insight",
		"explanation":"A masterwork archive for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbook9":{
		"type":"source",
		"placeholder_art":true,
		"placeholder_asset":"wbookhs",
		"tier":2,
		"skin":"wbookhs",
		"int":16,
		"compound":{
			"int":5,
		},
		"name":"Scripture of Insight",
		"explanation":"A masterwork scripture for an experienced Priest. Placeholder artwork reuses the Book of Cheer.",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"wbookhs":{
		"set":"holidays",
		"type":"source",
		"tier":2,
		"skin":"wbookhs",
		"dex":16,
		"vit":16,
		"resistance":120,
		"compound":{
			"dex":6,
			"vit":6,
			"resistance":30,
		},
		"name":"Book of Cheer",
		"g":960000,
		"grades":[0,2],
		"cx":{
			"scale":0.5,
			"extension":true,
		}
	},
	"quiver":{
		"type":"quiver",
		"tier":1,
		"skin":"quiver",
		"dex":2,
		"range":20,
		"armor":10,
		"upgrade":{
			"dex":1,
			"armor":2,
			"range":3.5,
		},
		"name":"Quiver",
		"g":24000,
		"grades":[3,7],
	},
	"t2quiver":{
		"type":"quiver",
		"tier":2,
		"skin":"t2quiver",
		"dex":9,
		"range":20,
		"armor":12,
		"evasion":1,
		"upgrade":{
			"dex":1.5,
			"armor":3,
			"range":3.5,
		},
		"name":"Agile Quiver",
		"g":960000,
		"grades":[0,4],
		"a":true,
	},
	"alloyquiver":{
		"type":"quiver",
		"tier":2,
		"skin":"alloyquiver",
		"dex":2,
		"explosion":2,
		"range":20,
		"armor":15,
		"resistance":12,
		"upgrade":{
			"explosion":1.5,
			"dex":1.25,
			"armor":3.5,
			"resistance":3,
			"range":3.5,
		},
		"name":"Alloy Quiver",
		"g":112000,
		"grades":[0,5],
		"a":true,
	},
}

var collectables={
	"brownegg":{
		"type":"material",
		"skin":"brownegg",
		"name":"Brown Egg",
		"s":100,
		"g":1000,
	},
	"whiteegg":{
		"type":"material",
		"skin":"whiteegg",
		"name":"White Egg",
		"s":2000,
		"g":5,
		"throw":true,
		"action":"THROW!",
		"onclick":"socket.emit('throw',{num:locate_item('whiteegg'),x:character.real_x,y:character.real_y}); push_deferred('throw')",
	},
	"gslime":{
		"type":"material",
		"skin":"gslime",
		"name":"Slime Core",
		"s":true,
		"g":20,
	},
	"crabclaw":{
		"type":"material",
		"skin":"crabclaw",
		"name":"Crab Claw",
		"s":true,
		"g":120,
	},
	"beewings":{
		"type":"material",
		"skin":"beewings",
		"name":"Bee Wings",
		"s":true,
		"g":25,
	},
	"pleather":{
		"type":"material",
		"skin":"pleather",
		"name":"Porcupine Leather",
		"s":true,
		"g":400,
	},
	"spores":{
		"type":"material",
		"skin":"spores",
		"name":"Spores",
		"s":true,
		"g":120,
	},
	"lotusf":{
		"type":"material",
		"skin":"lotusf",
		"name":"Lotus Flower",
		"s":true,
		"g":12000,
	},
	"frogt":{
		"type":"material",
		"skin":"frogt",
		"name":"Frog Tongue",
		"s":true,
		"g":3,
	},
	"snakefang":{
		"type":"material",
		"skin":"snakefang",
		"name":"Snake Fang",
		"s":true,
		"g":1200,
	},
	"rattail":{
		"type":"material",
		"skin":"rattail",
		"name":"Rat Tail",
		"s":true,
		"g":2,
	},
	"ascale":{
		"type":"material",
		"skin":"ascale",
		"name":"Armadillo Scale",
		"s":true,
		"g":500,
	},
	"ink":{
		"type":"material",
		"skin":"ink",
		"name":"Ink",
		"s":true,
		"g":5000,
	},
	"ijx":{
		"type":"material",
		"skin":"ijx",
		"name":"Irradium",
		"s":true,
		"g":360000,
	},
	"smush":{
		"type":"material",
		"skin":"smush",
		"name":"Small Mushroom",
		"s":true,
		"g":87,
	},
	"carrot":{
		"type":"material",
		"skin":"carrot",
		"name":"Carrot",
		"s":true,
		"g":4,
	},
	"bfur":{
		"type":"material",
		"skin":"bfur",
		"name":"Bee Fur",
		"s":true,
		"g":5,
	},
	"bandages":{
		"type":"material",
		"skin":"bandages",
		"name":"Bandages",
		"s":true,
		"g":26,
	},
	"cocoon":{
		"type":"material",
		"skin":"cocoon",
		"name":"Cocoon",
		"s":true,
		"g":200,
	},
	"tshell":{
		"type":"material",
		"skin":"tshell",
		"name":"Turtle Shell",
		"s":true,
		"g":1200,
	},
	"dstones":{
		"type":"material",
		"skin":"dstones",
		"name":"Digestive Stones",
		"s":true,
		"g":90,
	},
	"bwing":{
		"type":"material",
		"skin":"bwing",
		"name":"Bat Wing",
		"s":true,
		"g":120,
	},
	"bfang":{
		"type":"material",
		"skin":"bfang",
		"name":"Bat Fang",
		"s":true,
		"g":24000,
	},
	"sstinger":{
		"type":"material",
		"skin":"sstinger",
		"name":"Scorpion Stinger",
		"s":true,
		"g":4000,
	},
	"svenom":{
		"type":"material",
		"skin":"svenom",
		"name":"Scorpion Venom",
		"s":true,
		"g":12000,
	},
	"pstem":{
		"type":"material",
		"skin":"pstem",
		"name":"Pumpkin Stem",
		"s":true,
		"g":5,
	},
	"watercore":{
		"type":"material",
		"skin":"watercore",
		"name":"Water Core",
		"s":true,
		"g":800000,
	},
	"ectoplasm":{
		"type":"material",
		"skin":"ectoplasm",
		"name":"Ectoplasm",
		"s":true,
		"g":60000,
	},
	"rfur":{
		"type":"material",
		"skin":"rfur",
		"name":"Rat Fur",
		"s":true,
		"g":40,
	},
	"cshell":{
		"type":"material",
		"skin":"cshell",
		"name":"Crab Shell",
		"s":true,
		"g":32000,
	},
	"bcandle":{
		"type":"material",
		"skin":"bcandle",
		"name":"Burning Candle",
		"s":true,
		"g":420000,
	},
	"lspores":{
		"type":"material",
		"skin":"lspores",
		"name":"Large Spores",
		"s":true,
		"g":160,
	},
	"trinkets":{
		"type":"material",
		"skin":"trinkets",
		"name":"Trinkets",
		"s":true,
		"g":200000,
	},
	"rfangs":{
		"type":"material",
		"skin":"rfangs",
		"name":"Rat Fangs",
		"s":true,
		"g":12000,
	},
	"btusk":{
		"type":"material",
		"skin":"btusk",
		"name":"Boar Tusk",
		"s":true,
		"g":50000,
	},
	"drapes":{
		"type":"material",
		"skin":"drapes",
		"name":"Drapes",
		"s":true,
		"g":480,
	},
}

var materials={
	"essenceoffrost":{
		"type":"material",
		"skin":"essenceoffrost",
		"name":"Essence of Frost",
		"explanation":"It's like an ice storm in a bottle",
		"s":true,
		"g":40000,
	},
	"essenceoffire":{
		"type":"material",
		"skin":"essenceoffire",
		"name":"Essence of Fire",
		"explanation":"So fierce, so mesmerizing",
		"s":true,
		"g":40000,
	},
	"essenceofether":{
		"type":"material",
		"skin":"essenceofether",
		"name":"Ethereal Essence",
		"explanation":"A ghostly essence, maybe it could allow you to shift from this world momentarily",
		"s":true,
		"g":40000,
	},
	"essenceofnature":{
		"type":"material",
		"skin":"essenceofnature",
		"name":"Essence of Nature",
		"explanation":"Earthly energy, waiting to spring",
		"s":true,
		"g":5000,
	},
	"essenceoflife":{
		"type":"material",
		"skin":"essenceoflife",
		"name":"Essence of Life",
		"explanation":"Full of life, literally.",
		"s":true,
		"g":1,
	},
	"essenceofgreed":{
		"type":"material",
		"skin":"essenceofgreed",
		"name":"Essence of Greed",
		"explanation":"A peculiar material.",
		"s":true,
		"g":13441344,
	},
	"emptyjar":{
		"type":"jar",
		"skin":"emptyjar",
		"name":"Empty Jar",
		"explanation":"Always nice to have some empty jars lying around, you never know when you'll need one!",
		"s":true,
		"g":1,
	},
	"cxjar":{
		"type":"jar",
		"skin":"cxjar",
		"name":"CX Jar",
		"explanation":"An appearance liquified and stored inside a jar.",
		"exclusive":true,
		"s":true,
		"g":1,
	},
	"emotionjar":{
		"type":"jar",
		"skin":"emotionjar",
		"name":"Emotion Jar",
		"explanation":"An emotion liquified and stored inside a jar.",
		"exclusive":true,
		"s":true,
		"g":1,
	},
	"bottleofxp":{
		"type":"xp",
		"skin":"bottleofxp",
		"name":"Bottle of XP",
		"explanation":"Legacy item with no effect on skill progression. It is not consumed.",
		"s":20,
		"g":12000000,
	},
	"nheart":{
		"type":"material",
		"skin":"nheart",
		"name":"Heartwood Core",
		"explanation":"An ancient source of life. A small piece of a magnificent being that spanned life across our realm eons ago.",
		"s":true,
		"g":12000000,
	},
	"ledger":{
		"type":"misc",
		"skin":"ledger",
		"name":"Ledger",
		"explanation":"Every decent merchant needs one!",
		"ignore":true,
		"g":12000,
	},
	"storagebox":{
		"type":"misc",
		"skin":"storagebox",
		"name":"Storage Box",
		"ignore":true,
		"explanation":"It's a nifty little box",
		"s":true,
		"g":9000,
	},
	"mysterybox":{
		"type":"misc",
		"skin":"mysterybox",
		"name":"Mystery Box",
		"explanation":"It looks super cool, but you have no idea what to do with it! Exchange now or wait? No idea.",
		"g":12000000,
		"s":true,
		"e":1,
	},
	"troll":{
		"type":"misc",
		"skin":"troll",
		"name":"T-Shirt Roll",
		"explanation":"A random T-Shirt!",
		"g":12000,
		"e":1,
		"s":true,
	},
}

var pots={
	"hpot0":{
		"type":"pot",
		"skin":"hpot0",
		"gives":[["hp",200]],
		"name":"HP Potion",
		"cooldown":2000,
		"s":true,
		"g":20,
	},
	"mpot0":{
		"type":"pot",
		"skin":"mpot0",
		"gives":[["mp",300]],
		"name":"MP Potion",
		"cooldown":2000,
		"s":true,
		"g":20,
	},
	"hpot1":{
		"type":"pot",
		"skin":"hpot1",
		"gives":[["hp",400]],
		"name":"HP Potion",
		"cooldown":2000,
		"s":true,
		"g":100,
	},
	"mpot1":{
		"type":"pot",
		"skin":"mpot1",
		"gives":[["mp",500]],
		"name":"MP Potion",
		"cooldown":2000,
		"s":true,
		"g":100,
	},
	"hpotx":{
		"type":"pot",
		"skin":"hpotx",
		"gives":[["hp",10000]],
		"name":"Super HP Potion",
		"cooldown":2000,
		"s":true,
		"g":20000,
	},
	"mpotx":{
		"type":"pot",
		"skin":"mpotx",
		"gives":[["mp",10000]],
		"name":"Super MP Potion",
		"cooldown":2000,
		"s":true,
		"g":20000,
	},
}

var scrolls={
	"cscroll0":{
		"type":"cscroll",
		"skin":"cscroll0",
		"grade":0,
		"name":"Compound Scroll",
		"explanation":"Scroll to combine 3 accessories. Things get challenging after +1. If the combination fails, the item is lost.",
		"s":true,
		"g":6400,
	},
	"cscroll1":{
		"type":"cscroll",
		"skin":"cscroll1",
		"grade":1,
		"name":"High Compound Scroll",
		"explanation":"Scroll to combine 3 high grade accessories. If the combination fails, the item is lost.",
		"s":true,
		"g":240000,
	},
	"cscroll2":{
		"type":"cscroll",
		"skin":"cscroll2",
		"grade":2,
		"name":"Rare Compound Scroll",
		"explanation":"Scroll to combine 3 rare accessories. If the combination fails, the item is lost.",
		"s":true,
		"g":9200000,
	},
	"cscroll3":{
		"type":"cscroll",
		"skin":"cscroll3",
		"grade":3,
		"name":"Legendary Compound Scroll",
		"explanation":"A mysterious compound scroll, you can feel that it's very powerful. If the combination fails, the item is lost.",
		"a":true,
		"s":true,
		"markup":20,
		"g":1840000000,
	},
	"scroll0":{
		"type":"uscroll",
		"skin":"scroll0",
		"grade":0,
		"name":"Upgrade Scroll",
		"explanation":"Scroll to upgrade a weapon or armor. If the upgrade fails, the item is lost.",
		"s":true,
		"g":1000,
	},
	"scroll1":{
		"type":"uscroll",
		"skin":"scroll1",
		"grade":1,
		"name":"High Upgrade Scroll",
		"explanation":"Scroll to upgrade a high grade weapon or armor. If the upgrade fails, the item is lost.",
		"s":true,
		"g":40000,
	},
	"scroll2":{
		"type":"uscroll",
		"skin":"scroll2",
		"grade":2,
		"name":"Rare Upgrade Scroll",
		"explanation":"Scroll to upgrade a rare weapon or armor. If the upgrade fails, the item is lost.",
		"s":true,
		"g":1600000,
	},
	"scroll3":{
		"type":"uscroll",
		"skin":"scroll3",
		"grade":3,
		"name":"Legendary Upgrade Scroll",
		"explanation":"A mysterious upgrade scroll, you can feel that it's very powerful. If the upgrade fails, the item is lost.",
		"a":true,
		"s":true,
		"g":480000000,
		"markup":10,
	},
	"scroll4":{
		"type":"uscroll",
		"skin":"scroll4",
		"grade":3.6, //must be synced in server.js/'upgrade'
		"name":"Ultimate Upgrade Scroll",
		"explanation":"A scroll passed down from ancient times. Long believed to be extinct. Powers beyond imagination.",
		"a":true,
		"s":true,
		"g":640000000,
		"exclusive":true,
	},
	"strscroll":{
		"type":"pscroll",
		"skin":"strscroll",
		"stat":"str",
		"name":"Strength Scroll",
		"explanation":"Adds Stength to an armor with a Stat attribute.",
		"multiplier":1,
		"s":true,
		"g":8000,
	},
	"intscroll":{
		"type":"pscroll",
		"skin":"intscroll",
		"stat":"int",
		"name":"Intelligence Scroll",
		"explanation":"Adds Intelligence to an armor with a Stat attribute.",
		"multiplier":1,
		"s":true,
		"g":8000,
	},
	"dexscroll":{
		"type":"pscroll",
		"skin":"dexscroll",
		"stat":"dex",
		"name":"Dexterity Scroll",
		"explanation":"Adds Dexterity to an armor with a Stat attribute.",
		"multiplier":1,
		"s":true,
		"g":8000,
	},
	"vitscroll":{
		"type":"pscroll",
		"skin":"vitscroll",
		"stat":"vit",
		"name":"Vitality Scroll",
		"explanation":"Adds Vitality to an armor with a Stat attribute.",
		"multiplier":1,
		"s":true,
		"g":8000,
	},
	"forscroll":{
		"type":"pscroll",
		"skin":"forscroll",
		"stat":"for",
		"name":"Fortitude Scroll",
		"explanation":"Adds Fortitude to an armor with a Stat attribute.",
		"multiplier":1,
		"s":true,
		"g":8000,
	},
	"evasionscroll":{
		"type":"pscroll",
		"skin":"evasionscroll",
		"stat":"evasion",
		"name":"Evasion Scroll",
		"explanation":"Adds Evasion to an armor with a Special Stat attribute.",
		"multiplier":0.325,
		"s":true,
		"g":8000,
	},
	"reflectionscroll":{
		"type":"pscroll",
		"skin":"reflectionscroll",
		"stat":"reflection",
		"name":"Reflection Scroll",
		"explanation":"Adds Reflection to an armor with a Stat attribute.",
		"multiplier":0.15,
		"s":true,
		"g":8000,
	},
	"goldscroll":{
		"type":"pscroll",
		"skin":"goldscroll",
		"stat":"gold",
		"name":"Gold Scroll",
		"explanation":"Adds Gold bonus to an armor with a Stat attribute.",
		"multiplier":0.5,
		"s":true,
		"g":8000,
	},
	"luckscroll":{
		"type":"pscroll",
		"skin":"luckscroll",
		"stat":"luck",
		"name":"Luck Scroll",
		"explanation":"Adds Luck to an armor with a Stat attribute.",
		"multiplier":1,
		"s":true,
		"g":8000,
	},
	"xpscroll":{
		"type":"pscroll",
		"skin":"xpscroll",
		"stat":"xp",
		"name":"XP Scroll",
		"explanation":"Adds XP bonus to an armor with a Stat attribute.",
		"multiplier":0.5,
		"s":true,
		"g":8000,
	},
	"armorscroll":{
		"type":"pscroll",
		"skin":"armorscroll",
		"stat":"armor",
		"name":"Armor Scroll",
		"explanation":"Adds Armor to an armor with a Stat attribute.",
		"multiplier":2.25,
		"s":true,
		"g":8000,
	},
	"resistancescroll":{
		"type":"pscroll",
		"skin":"resistancescroll",
		"stat":"resistance",
		"name":"Resistance Scroll",
		"explanation":"Adds Resistance to an armor with a Stat attribute.",
		"multiplier":2.25,
		"s":true,
		"g":8000,
	},
	"speedscroll":{
		"type":"pscroll",
		"skin":"speedscroll",
		"stat":"speed",
		"name":"Speed Scroll",
		"explanation":"Adds Speed to an armor with a Stat attribute.",
		"multiplier":0.325,
		"s":true,
		"g":8000,
	},
	"lifestealscroll":{
		"type":"pscroll",
		"skin":"lifestealscroll",
		"stat":"lifesteal",
		"name":"Lifesteal Scroll",
		"explanation":"Adds Lifesteal to an armor with a Stat attribute.",
		"multiplier":0.15,
		"s":true,
		"g":8000,
	},
	"manastealscroll":{
		"type":"pscroll",
		"skin":"manastealscroll",
		"stat":"manasteal",
		"name":"Manasteal Scroll",
		"explanation":"Adds Manasteal to an armor with a Stat attribute.",
		"multiplier":0.040,
		"s":true,
		"g":8000,
	},
	"rpiercingscroll":{
		"type":"pscroll",
		"skin":"rpiercingscroll",
		"stat":"rpiercing",
		"name":"Resistance Piercing Scroll",
		"explanation":"Adds Resistance Piercing to an armor with a Stat attribute.",
		"multiplier":2.25,
		"s":true,
		"g":8000,
	},
	"apiercingscroll":{
		"type":"pscroll",
		"skin":"apiercingscroll",
		"stat":"apiercing",
		"name":"Armor Piercing Scroll",
		"explanation":"Adds Armor Piercing to an armor with a Stat attribute.",
		"multiplier":2.25,
		"s":true,
		"g":8000,
	},
	"critscroll":{
		"type":"pscroll",
		"skin":"critscroll",
		"stat":"crit",
		"name":"Critical Hit Scroll",
		"explanation":"Adds Critical Hit to an armor with a Stat attribute.",
		"multiplier":0.125,
		"s":true,
		"g":8000,
	},
	"dreturnscroll":{
		"type":"pscroll",
		"skin":"dreturnscroll",
		"stat":"dreturn",
		"name":"Damage Return Scroll",
		"explanation":"Adds Damage Return to an armor with a Stat attribute.",
		"multiplier":0.5,
		"s":true,
		"g":8000,
	},
	"frequencyscroll":{
		"type":"pscroll",
		"skin":"frequencyscroll",
		"stat":"frequency",
		"name":"Attack Speed Scroll",
		"explanation":"Adds Attack Speed to an armor with a Stat attribute.",
		"multiplier":0.325,
		"s":true,
		"g":8000,
	},
	"mpcostscroll":{
		"type":"pscroll",
		"skin":"mpcostscroll",
		"stat":"mp_cost",
		"name":"MP Cost Reduction Scroll",
		"explanation":"Adds MP Cost Reduction to an armor with a Stat attribute.",
		"multiplier":0.6,
		"s":true,
		"g":8000,
	},
	"outputscroll":{
		"type":"pscroll",
		"skin":"outputscroll",
		"stat":"output",
		"name":"Output Increase Scroll",
		"explanation":"Adds Output Increase to an armor with a Stat attribute.",
		"multiplier":0.175,
		"s":true,
		"g":8000,
	},
}

var premiums={
	"offering":{
		"type":"offering",
		"skin":"shade_offering",
		"name":"Primordial Essence",
		//"explanation":"The essence contained within the shard can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"explanation":"The essence contained within can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"s":100,
		"a":true,
		"grade":2,
		"g":27420000,//16720000,
		//"e":1,
	},
	"offeringp":{
		"type":"offering",
		"skin":"offeringp",
		"name":"Primling",
		//"explanation":"The essence contained within the shard can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"explanation":"A tiny cute essence that can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"s":1000,
		"a":true,
		"grade":1,
		"g":480000,
		//"ignore":true,
		//"e":1,
	},
	"offeringx":{
		"type":"offering",
		"skin":"offeringx",
		"name":"Primordial X",
		//"explanation":"The essence contained within the shard can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"explanation":"The most powerful essence that can be transferred to items during upgrades and compounds. Significantly increases the chance to succeed.",
		"s":10,
		"a":true,
		"grade":3,
		"g":242064000,
		//"ignore":true,
		//"e":1,
	},
	"cosmo0":{
		"type":"cosmetics",
		"skin":"cosmo0",
		"cash":289, //89
		"g":10000000,
		"name":"New Armor",
		"explanation":"Give this to NPC Haila to receive a new look. Heads-up! It's random, you may or may-not like it. [Work in progress - PRICE/DROPS MIGHT CHANGE!]",
		"quest":"cx",
		"s":true,
		"e":1,
		"quest":"cx",
	},
	"cosmo1":{
		"type":"cosmetics",
		"skin":"cosmo1",
		"cash":459, //149
		"g":10000000,
		"name":"New Make-up",
		"explanation":"Give this to NPC Haila to receive a new make-up. Heads-up! It's random, you may or may-not like it. [Work in progress - Not functional yet.]",
		"s":true,
		//"e":1,
		"quest":"cx",
	},
	"cosmo2":{
		"type":"cosmetics",
		"skin":"cosmo2",
		"cash":129,
		"g":10000000,
		"name":"New Hairdo",
		"explanation":"Give this to NPC Haila to receive a new hairdo. Heads-up! It's random, you may or may-not like it. [Work in progress - PRICE/DROPS MIGHT CHANGE!]",
		"s":true,
		"e":1,
		"quest":"cx",
	},
	"cosmo3":{
		"type":"cosmetics",
		"skin":"cosmo3",
		"cash":399, //99
		"g":10000000,
		"name":"New Hat",
		"explanation":"Give this to NPC Haila to receive a new hat. Heads-up! It's random, you may or may-not like it. [Work in progress - PRICE/DROPS MIGHT CHANGE!]",
		"s":true,
		"e":1,
		"quest":"cx",
	},
	"cosmo4":{
		"type":"cosmetics",
		"skin":"cosmo4",
		"cash":1399, //399
		"g":10000000,
		"name":"New Accessory",
		"explanation":"Give this to NPC Haila to receive a unique accessory. Heads-up! It's random, you may or may-not like it. [Work in progress - Not functional yet.]",
		"s":true,
		//"e":1,
		"quest":"cx",
	},
	"stoneofxp":{
		"type":"stone",
		"skin":"stoneofxp",
		"skin_a":"stoneofxp_a",
		//"gain":"xp",
		"g":100000000, //These were 1200 originally [17/01/18]
		"name":"Stone of Wisdom",
		"days":30,
		"explanation":"Increases experience gain by 50%. Needs to be activated. Can be morphed into other stones.",
		//"e":1,
		"ignore":true,
	},
	"stoneofgold":{
		"type":"stone",
		"skin":"stoneofgold",
		"skin_a":"stoneofgold",
		//"gain":"gold",
		"g":100000000,
		"name":"Stone of Riches",
		"days":30,
		"explanation":"Helps you find up to 40% more gold from monsters.",
		"ignore":true,
	},
	"stoneofluck":{
		"type":"stone",
		"skin":"stoneofluck",
		"skin_a":"stoneofluck",
		//"gain":"luck",
		"g":100000000,
		"name":"Stone of Luck",
		"days":30,
		"explanation":"Increases your chances to loot something from a monster by 20%.",
		"ignore":true,
	},
	// "tokenofcode":{
	// 	"type":"token",
	// 	"skin":"tokenofcode",
	// 	"minutes":240,
	// 	"cash":5,
	// 	"name":"Token of Code",
	// 	"explanation":"Gives your character 240 minutes of additional CODE. This is a ~4 months old prototype people, but yeah, I'm considering limiting the free CODE hours to 8 or 12 hours a day. Might leave it unlimited too, undecided.",
	// 	"s":true,
	// },
	"xptome":{
		"type":"tome",
		"skin":"xptome",
		"reward":2,
		"name":"Tome of Protection",
		"explanation":"Legacy item with no effect on skill progression or death sickness. It is not consumed.",
		"s":true,
		"g":3200000,
	},
	"licence":{
		"type":"licence",
		"skin":"licence",
		//"gain":"luck",
		"name":"Licence to Kill",
		"explanation":"With this licence, you gain a unique immunity for 7 minutes. No one can bother you for having too many comrades in this realm!",
		"g":25000000,
		"s":true,
	},
	"xpbooster":{
		"type":"booster",
		"skin":"xpbooster",
		"skin_a":"xpbooster_a",
		"gain":"xp",
		"xp":20,
		"compound":{
			"xp":12,
		},
		"grades":[0,10],
		"g":79840000,
		"name":"XP Booster",
		"days":30,
		"explanation":"Increases experience gain. Needs to be activated. Can be shifted into other boosters.",
	},
	"luckbooster":{
		"type":"booster",
		"skin":"luckbooster",
		"skin_a":"luckbooster_a",
		"gain":"luck",
		"luck":20,
		"compound":{
			"luck":8,
		},
		"grades":[0,10],
		"g":79840000,
		"name":"Luck Booster",
		"days":30,
		"explanation":"Increases your chances of looting something from a monster.",
		"legacy":{
			"luck":15,
		}
	},
	"goldbooster":{
		"type":"booster",
		"skin":"goldbooster",
		"skin_a":"goldbooster_a",
		"gain":"gold",
		"gold":20,
		"compound":{
			"gold":8,
		},
		"grades":[0,10],
		"g":79840000,
		"name":"Gold Booster",
		"days":30,
		"explanation":"Boosts gold loot from chests.",
		"legacy":{
			"gold":10,
		}
	},
	"networkcard":{
		"s":true,
		"type":"material",
		"skin":"networkcard",
		"g":24000000,
		"name":"Network Card",
		"explanation":"A critical component that is able to interact with the fabric of our universe. Possibly quantum technology.",
	},
	"qubics":{
		"type":"qubics",
		"skin":"qubics",
		"name":"Qubics",
		"explanation":"Unique bio-electronic components, it's almost like they are alive. Can yield unexpected results if you introduce them to other materials!",
		"s":true,
		"a":true,
		"g":5120000,
	},
}

var gems={
	"gem0":{
		"type":"gem",
		"skin":"gem0",
		"name":"Raw Emerald",
		"explanation":"A very rare gem. Can be exchanged for random treasures.",
		"g":240000,
		"e":1,
		"s":true,
		"a":true,
	},
	"gem1":{
		"type":"gem",
		"skin":"gem1",
		"name":"Tiny Ruby",
		"explanation":"A hard to find gem. Can be exchanged for random treasures.",
		"g":24000,
		"e":1,
		"s":true,
		"a":2,
	},
	"gem2":{
		"type":"gem",
		"skin":"gem2",
		"name":"Raw Diamond",
		"explanation":"A precious gem. Can be exchanged for random treasures.",
		"g":360000,
		//"e":1,
		"s":true,
		"a":2,
	},
	"gem3":{
		"type":"gem",
		"skin":"gem3",
		"name":"Raw Colourful Diamond",
		"explanation":"A hard to find gem. Can be exchanged for random treasures.",
		"g":4800000,
		//"e":1,
		"s":true,
		"a":2,
	},
	"candypop":{
		"type":"elixir",
		"skin":"candypop",
		"skin_a":"candypop",
		"name":"Candy Pop",
		"luck":12,
		"vit":10,
		"int":6,
		"duration":1,
		"g":120,
		"e":10,
		"eat":true,
		"s":true,
		"explanation":"You can eat it. Gift it. Exchange 10 of them at Xyn for a small reward.",
	},
	"candy0":{
		"type":"gem",
		"skin":"candy0",
		"name":"Rare Candy",
		"explanation":"A rare candy! Can be exchanged for random treasures.",
		"g":240000,
		"e":1,
		"s":true,
		"a":2,
		//"event":true,
	},
	"candy1":{
		"type":"gem",
		"skin":"candy1",
		"name":"Candy",
		"explanation":"Candy! Can be exchanged for random treasures.",
		"g":24000,
		"e":1,
		"s":true,
		"a":2,
	},
	"candy0v2":{
		"type":"gem",
		"skin":"candy0",
		"name":"Rare Candy [h2]",
		"explanation":"A rare candy. Xyn in New Town could give you something exciting in exchange!",
		"g":12000,
		"e":1,
		"s":true,
		//"a":2,
		"ignore":true,
	},
	"candy1v2":{
		"type":"gem",
		"skin":"candy1",
		"name":"Candy [h2]",
		"explanation":"A delicious candy. Xyn in New Town could give you something in exchange!",
		"g":2400,
		"e":1,
		"s":true,
		//"a":2,
		"ignore":true,
	},
	"candy0v3":{
		"type":"gem",
		"skin":"candy0",
		"name":"Rare Candy",
		"explanation":"A rare candy. Xyn in New Town could give you something exciting in exchange!",
		"g":12000,
		"e":1,
		"s":true,
		"ignore":true,
		//"a":2,
		//"event":true,
	},
	"candy1v3":{
		"type":"gem",
		"skin":"candy1",
		"name":"Candy",
		"explanation":"A delicious candy. Xyn in New Town could give you something in exchange!",
		"g":2400,
		"e":1,
		"s":true,
		"ignore":true,
		//"a":2,
	},
	"bugbountybox":{
		"type":"box",
		"skin":"bugbountybox",//"chest0",
		"name":"Bug Bounty Box",
		"explanation":"Rewarded for assisting in the hunt against the bugs.",
		"g":120000,
		"event":true,
		"a":2,
		"s":true,
		"e":1,
	},
	"apologybox":{
		"type":"box",
		"skin":"apologybox",//"chest0",
		"name":"Apology Box",
		"explanation":"This box represents an official apology. Sorry.",
		"g":120000,
		"event":true,
		"ignore":true,
		"a":2,
		"s":true,
		"e":1,
	},
	"weaponbox":{
		"type":"box",
		"skin":"weaponbox",//"chest1",
		"name":"Weapon Box",
		"explanation":"Can be exchanged for a random, rare weapon.",
		//"cash":320,
		"g":320000,
		"e":1,
		"a":true,
		"s":true,
	},
	"armorbox":{
		"type":"box",
		"skin":"armorbox",//"chest0",
		"name":"Armor Box",
		"explanation":"Can be exchanged for a random, rare armor.",
		//"cash":120,
		"g":120000,
		"e":1,
		"a":true,
		"s":true,
	},
	"jewellerybox":{
		"type":"box",
		"skin":"chest3",
		"name":"Jewellery Box",
		"explanation":"Can be exchanged for a random acessory.",
		//"cash":2320,
		"ignore":true,
		"g":80000,
		"e":1,
		"a":true,
		"s":true,
	},
	"mistletoe":{
		"type":"gem",
		"skin":"mistletoe",
		"name":"Mistletoe",
		"explanation":"Maybe someone could give you a kiss in exchange...",
		//"cash":2320,
		"g":20000,
		"e":1,
		"a":true,
		"s":true,
		//"event":true,
		//"quest":"mistletoe", #xmas
	},
	"candycane":{
		"type":"gem",
		"skin":"candycane",
		"name":"Candy Cane",
		"explanation":"The old man in Winterland was looking for sweets.",
		"g":24000,
		"e":1, 
		"s":true,
		"a":true,
		//"event":true,
		//"quest":"candycane", #xmas
	},
	"gift0":{
		"type":"gem",
		"skin":"gift0",
		"name":"Rare Gift",
		"explanation":"A Rare Gift to celebrate our Anniversary!",
		"g":2400,
		"e":1,
		"s":true,
		"a":true,
	},
	"gift1":{
		"type":"gem",
		"skin":"gift1",
		"name":"Gift",
		"explanation":"A Gift to celebrate our Anniversary!",
		"g":100,
		"e":1,
		"s":true,
		"a":2,
	},
	"redenvelope":{
		"type":"gem",
		"skin":"redenvelope",
		"name":"Red Envelope",
		"explanation":"Congratulations and prosperity",
		"g":24000,
		"e":1,
		"s":true,
		"a":true,
		"event":true,
	},
	"redenvelopev2":{
		"type":"gem",
		"skin":"redenvelopev2",
		"name":"Red Envelope",
		"explanation":"Congratulations and prosperity",
		"g":24000,
		"e":1,
		"s":true,
		"a":true,
		"event":true,
	},
	"redenvelopev3":{
		"type":"gem",
		"skin":"redenvelopev3",
		"name":"Red Envelope",
		"explanation":"Congratulations and prosperity",
		"g":24000,
		"e":1,
		"s":true,
		"a":true,
		"event":true,
	},
	"redenvelopev4":{
		"type":"gem",
		"skin":"redenvelopev4",
		"name":"Red Envelope",
		"explanation":"Congratulations and prosperity",
		"g":24000,
		"e":1,
		"s":true,
		"a":true,
		"event":true,
	},
	"greenenvelope":{
		"type":"gem",
		"skin":"greenenvelope",
		"name":"Green Envelope",
		"explanation":"Congratulations and prosperity",
		"g":24000,
		"e":1,
		"s":true,
		"a":true,
		"event":true,
	},
	"brownenvelope":{
		"type":"gem",
		"skin":"brownenvelope",
		"name":"Brown Envelope",
		"explanation":"Congratulations and prosperity",
		"g":24000,
		"e":1,
		"s":true,
		"a":true,
		"event":true,
	},
	// "greenenvelopev2":{
	// 	"type":"gem",
	// 	"skin":"greenenvelope",
	// 	"name":"Green Envelope",
	// 	"explanation":"Congratulations and prosperity",
	// 	"g":24000,
	// 	"e":1,
	// 	"s":true,
	// 	"a":true,
	// 	"event":true,
	// },
}

var misc={
	"stand0":{
		"type":"stand",
		"skin":"stand0",
		"stand":"stand0",
		"name":"Merchant Stand",
		"explanation":"You can become a merchant using this item.",
		//"cash":2320,
		"g":40000,
	},
	"stand1":{
		"type":"stand",
		"skin":"stand1",
		"stand":"stand1",
		"name":"Merchant Stand [Sell+Buy]",
		"explanation":"You can become a merchant using this item.",
		"ignore":true,
		//"cash":2320,
		"g":400000,
	},
	"tracker":{
		"type":"tracker",
		"skin":"tracker",
		"name":"Tracktrix",
		"explanation":"A tool that tracks all your experiences and encounters in Adventure Land so you can learn from them and grow as an adventurer!",
		//"ignore":true,
		"special":true,
		"g":12,
		"acolor":"#B969CE",
		"action":"INTERFACE!",
		"onclick":"socket.emit('tracker')",
	},
	"computer":{
		"type":"computer",
		"skin":"ancientcomputer",
		//"cash":1600,
		"name":"Ancient Computer",
		"special":true,
		"stand":"cstand", //currently hardcoded at get_trade_slots
		"explanation":"Networks you to NPCs and extends the CODE capabilities.",
		"g":64000000,
	},
	"supercomputer":{
		"type":"computer",
		"skin":"ancientcomputer",
		//"cash":1600,
		"name":"Super Computer",
		"special":true,
		"stand":"cstand", //currently hardcoded at get_trade_slots
		"explanation":"Networks you to NPCs, extends the CODE capabilities and tracks your encounters.",
		"g":64000000,
	},
	"stick":{
		"type":"misc",
		"skin":"stick",
		"g":299999,
		"name":"Stick",
		"explanation":"...",
		"a":true,
		"upgrade":{
		
		},
		"grades":[4,7],
	},
	"coal":{
		"type":"misc",
		"skin":"coal",
		"g":10,
		"name":"Coal",
		"explanation":"...",
		"a":true,
		"compound":{
		
		}
	},
	"glitch":{
		"type":"misc",
		"skin":"glitch",
		"g":10000,
		"name":"A Glitch",
		"explanation":"Huh?! ??!",
		"ignore":true,
		"event":true,
		"a":true,
		"e":1,
	},
	"5bucks":{
		"type":"misc",
		"skin":"5bucks",
		"g":5,
		"name":"Old Paper Money",
		"explanation":"It's not gold. Must be worthless.",
		"s":true,
		"rare":true,
		"e":1,
	},
	"confetti":{
		"type":"throw",
		"skin":"confetti",
		"g":20,
		"name":"Pack of Confetti",
		"explanation":"To celebrate good times",
		"s":true,
		"throw":true,
		"action":"THROW!",
		"onclick":"socket.emit('throw',{num:locate_item('confetti'),x:character.real_x,y:character.real_y}); push_deferred('throw')",
	},
	"firecrackers":{
		"type":"throw",
		"skin":"firecrackers",
		"g":20,
		"name":"Firecracker",
		"explanation":"Scary but harmless",
		"s":true,
		"throw":true,
		"action":"THROW!",
		"onclick":"socket.emit('throw',{num:locate_item('firecrackers'),x:character.real_x,y:character.real_y}); push_deferred('throw')",
	},
	"smoke":{
		"type":"throw",
		"skin":"smoke",
		"g":20,
		"name":"Pouch of Poof",
		"explanation":"A pyrotechnic pouch, developed for those who want to feel like a rogue.",
		"s":100,
		"throw":true,
		"action":"THROW!",
		"onclick":"socket.emit('throw',{num:locate_item('smoke'),x:character.real_x,y:character.real_y}); push_deferred('throw')",
	},
	"snowball":{
		"type":"throw",
		"skin":"snowball",
		"g":1,
		"name":"Snowball",
		"explanation":"Be careful not to hit someone in the ear!",
		"s":200,
	},
	"figurine":{
		"type":"spawner",
		"skin":"figurine",
		"spawn":"terracota",
		"name":"Terracota Army Figurine",
		"ignore":true,
		"note":"Summons an ancient soldier to fight for you",
		"action":"BREAK!",
		"s":true,
		"g":40000,
	},
	"pvptoken":{
		"type":"token",
		"skin":"pvptoken",
		"name":"PVP Token",
		"explanation":"A token representing valour in battles. Collect them from PVP events and exchange them for treasures!",
		"s":true,
		"g":24000,
	},
	"funtoken":{
		"type":"token",
		"skin":"funtoken",
		"name":"Fun Token",
		"explanation":"A token representing fun with friends. Collect them from Daily events and exchange them for treasures!",
		"s":true,
		"g":12000,
	},
	"monstertoken":{
		"type":"token",
		"skin":"monstertoken",
		"name":"Monster Token",
		"explanation":"A token representing the hunt. You made Adventure Land a safer place for all. Be proud!",
		"npc":"monsterhunter",
		"s":true,
		"g":12000,
	},
	"friendtoken":{
		"type":"token",
		"skin":"friendtoken",
		"name":"Friend Token",
		"explanation":"A token representing friendship. Awarded each time a friend joins the adventure!",
		"s":true,
		"g":36000,
	},
	"emptyheart":{
		"type":"material",
		"skin":"emptyheart",
		"name":"Empty Heart",
		"explanation":"A cold empty stone heart",
		"s":true,
		"g":12000,
		"event":true,
	},
	"fieldgen0":{
		"type":"spawner",
		"skin":"fieldgen0",
		"spawn":"fieldgen0",
		"name":"Dampening Field Generator",
		"explanation":"Summon a robot generating a dampening field that prevents teleportation of any kind!",
		"g":2000000,
	},
}

var quest={
	"seashell":{
		"type":"quest",
		"skin":"seashell",
		"name":"Seashell",
		"explanation":"A beautiful seashell.",
		"g":800,
		"e":20,
		"s":true,
		"quest":"seashell",
	},
	"leather":{
		"type":"quest",
		"skin":"leather",
		"name":"Leather",
		"explanation":"A Leather piece.",
		"g":3000,
		"e":40,
		"s":true,
		"quest":"leather",
	},
	"gemfragment":{
		"type":"quest",
		"skin":"gemfragment",
		"name":"Gem Fragment",
		"explanation":"Beautiful, yet broken. Would be extremely valuable if they were whole.",
		"g":32000,
		"e":50,
		"s":true,
		"quest":"gemfragment",
	},
	"ornament":{
		"type":"quest",
		"skin":"ornament",
		"name":"Xmas Ornament",
		"explanation":"A beautiful ornament. A bunch of these could decorate the trees of Winterland.",
		"g":3000,
		"e":20,
		"s":true,
		//"quest":"ornament", #xmas
	},
	"lostearring":{
		"type":"earring",
		"skin":"lostearring",
		"name":"Gold Earring",
		"explanation":"Looks valuable",
		"g":360000,
		"grades":[0,2],
		"e":1,
		"edge":-2,
		"a":true,
		"compound":{},
		"quest":"lostearring",
	},
	"stonekey":{
		"type":"dungeon_key",
		"skin":"stonekey",
		"name":"The Stone Key",
		"opens":"therush",
		//"ignore":true,
		"g":50000,
		"explanation":"A stone key, imbued with magical energy.",
		"s":50,
	},
	"cryptkey":{
		"type":"dungeon_key",
		"skin":"cryptkey",
		"name":"The Crypt Key",
		"opens":"crypt",
		//"ignore":true,
		"g":50000,
		"explanation":"A key, imbued with magical energy.",
		"s":50,
	},
	"frozenkey":{
		"type":"dungeon_key",
		"skin":"frozenkey",
		"name":"The Frozen Cave Key",
		"opens":"winter_instance",
		//"ignore":true,
		"g":50000,
		"explanation":"A key, imbued with magical energy.",
		"s":50,
	},
	"tombkey":{
		"type":"dungeon_key",
		"skin":"tombkey",
		"name":"The Tomb Key",
		"opens":"tomb",
		//"ignore":true,
		"g":50000,
		"explanation":"A key, imbued with magical energy.",
		"s":50,
	},
	"spiderkey":{
		"type":"dungeon_key",
		"skin":"spiderkey",
		"name":"The Spider Key",
		"opens":"spider_instance",
		//"ignore":true,
		"g":50000,
		"explanation":"A key, imbued with magical energy.",
		"s":50,
	},
	"bkey":{
		"type":"bank_key",
		"skin":"bkey",
		"name":"The Bank Key",
		"unlocks":"bank_b",
		//"ignore":true,
		"g":5000000,
		"s":50,
		"explanation":"Key to the bank's basement",
		"action":"UNLOCK",
		"onclick":"socket.emit('activate',{num:locate_item('bkey')})",
	},
	"ukey":{
		"type":"bank_key",
		"skin":"ukey",
		"name":"The Bank Key",
		"unlocks":"bank_u",
		//"ignore":true,
		"s":50,
		"g":50000000,
		"explanation":"Key to the bank's underground",
		"action":"UNLOCK",
		"onclick":"socket.emit('activate',{num:locate_item('ukey')})",
	},
	"dkey":{
		"type":"bank_key",
		"skin":"dkey",
		"name":"Diamond Key",
		//"ignore":true,
		"s":50,
		"g":72000000,
		"explanation":"A key that unlocks any teller!",
		"action":"UNLOCK",
		"onclick":"socket.emit('activate',{num:locate_item('dkey')})",
	},
	"x0":{
		"type":"quest",
		"skin":"x0",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x1":{
		"type":"quest",
		"skin":"x1",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x2":{
		"type":"quest",
		"skin":"x2",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x3":{
		"type":"quest",
		"skin":"x3",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x4":{
		"type":"quest",
		"skin":"x4",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x5":{
		"type":"quest",
		"skin":"x5",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x6":{
		"type":"quest",
		"skin":"x6",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x7":{
		"type":"quest",
		"skin":"x7",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"x8":{
		"type":"quest",
		"skin":"x8",
		"name":"Quantum Piece",
		"g":4000,
		"s":true,
		"a":true,
		"event":true,
		"explanation":"A unique component of a curious puzzle",
	},
	"xbox":{
		"type":"quest",
		"skin":"xbox",
		"name":"Xmas Box",
		"g":1000000,
		"e":1,
		"s":true,
		"a":true,
		"explanation":"Finally... They all came together. A unique gift lies within this box. Take it to Xyn to be unlocked.",
	},
	"egg0":{
		"type":"quest",
		"skin":"egg0",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg1":{
		"type":"quest",
		"skin":"egg1",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg2":{
		"type":"quest",
		"skin":"egg2",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg3":{
		"type":"quest",
		"skin":"egg3",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg4":{
		"type":"quest",
		"skin":"egg4",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg5":{
		"type":"quest",
		"skin":"egg5",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg6":{
		"type":"quest",
		"skin":"egg6",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg7":{
		"type":"quest",
		"skin":"egg7",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"egg8":{
		"type":"quest",
		"skin":"egg8",
		"name":"Easter Egg",
		"g":4000,
		"s":true,
		"explanation":"A uniquely painted Egg!",
	},
	"goldenegg":{
		"type":"quest",
		"skin":"goldenegg",
		"name":"Golden Egg",
		"g":60000,
		"e":1,
		"event":true,
		"s":true,
		"a":true,
		"explanation":"Nope, it's not painted, an actual golden egg!",
	},
	"basketofeggs":{
		"type":"quest",
		"skin":"basketofeggs",
		"name":"Basket of Easter Eggs",
		"g":20000,
		"e":1,
		"s":true,
		//"a":true,
		"explanation":"A basket full of unique easter eggs. You can probably exchange this for a cool reward.",
	},
	"frozenstone":{
		"type":"activator",
		"skin":"frozenstone",
		"name":"Frozen Stone",
		"g":20000,
		"s":true,
		//"a":true,
		"explanation":"It's strangely not cold, must be a magical artifact.",
		"action":"SHAKE",
		"onclick":"socket.emit('activate',{num:locate_item('frozenstone')})",
	},
}

var pets={
	"flute":{
		"type":"flute",
		"skin":"flute",
		"name":"Flute",
		"explanation":"The sound of each flute is unique and mesmerizing. Your pets will easily recognize the sound of yours and come to your call.",
		"g":200000000,
	},
	"puppyer":{
		"type":"petlicence",
		"skin":"puppyer",
		//"gain":"luck",
		"name":"Licence to Adopt a Puppy",
		"explanation":"Lets you adopt a puppy once they are ready. You'll have to wait a bit until they are ready to be adopted tho!",
		"g":10000,
		"s":true,
	},
	"chrysalis0":{
		"type":"chrysalis",
		"skin":"goldenegg",
		"name":"Dragold's Chrysalis",
		"ignore":true,
		"monster":"dragold",
		//"explanation":"",
		"g":40000,
		"grade":0,
		"a":true,
	},
	"puppy1":{
		"type":"chrysalis",
		"skin":"egg2",
		"name":"Egg",
		"ignore":true,
		"monster":"puppy1",
		"explanation":"A vibrant egg, its inhabitant seems eager to get out.",
		"g":40000,
		"grade":0,
		"a":true,
	},
	"kitty1":{
		"type":"chrysalis",
		"skin":"egg1",
		"name":"Egg",
		"monster":"kitty1",
		"ignore":true,
		"explanation":"A vibrant egg, its inhabitant seems eager to get out.",
		"g":40000,
		"grade":0,
		"a":true,
	},
	"monsterbox":{
		"type":"container",
		"ignore":true,
		"skin":"armorbox",
		"name":"Monster Box",
		"explanation":"A magical pet world inside a box.",
		"g":120000,
		"grade":0,
	},
}

var orbs={
	"orbg":{
		"type":"orb",
		"skin":"orbg",
		"str":2,
		"int":2,
		"dex":2,
		"compound":{
			"str":1,
			"int":1,
			"dex":1,
		},
		"name":"Orb of Beginnings",
		"g":60000,
		"grades":[4,6],
	},
	"tigerstone":{
		"set":"tiger",
		"type":"orb",
		"skin":"tigerstone",
		"vit":10,
		"armor":30,
		"str":2,
		"int":1,
		"dex":2,
		"speed":1,
		"compound":{
			"vit":4,
			"str":1,
			"int":0.5,
			"dex":1,
		},
		"name":"Tiger Stone",
		"g":600000,
		"grades":[0,1],
	},
	"vorb":{
		"set":"vampires",
		"type":"orb",
		"skin":"vorb",
		"courage":1,
		"pcourage":1,
		"compound":{
			"courage":1,
		},
		"name":"Vampiric Canine Teeth",
		"g":12000000,
		"grades":[0,0],
	},
	"orbofvit":{
		"type":"orb",
		"skin":"orbofvit",
		"vit":10,
		"compound":{
			"vit":4,
		},
		"name":"Orb of Vitality",
		"g":240000,
		"grades":[1,4],
		"edge":-2,
	},
	"orbofint":{
		"type":"orb",
		"skin":"orbofint",
		"int":4,
		"compound":{
			"int":3,
		},
		"name":"Orb of Intelligence",
		"g":240000,
		"grades":[1,4],
		"edge":-2,
	},
	"orbofstr":{
		"type":"orb",
		"skin":"orbofstr",
		"str":4,
		"compound":{
			"str":3,
		},
		"name":"Orb of Strength",
		"g":240000,
		"grades":[1,4],
		"edge":-2,
	},
	"orbofdex":{
		"type":"orb",
		"skin":"orbofdex",
		"dex":4,
		"compound":{
			"dex":3,
		},
		"name":"Orb of Dexterity",
		"g":240000,
		"grades":[1,4],
		"edge":-2,
	},
	"orboffire":{
		"type":"orb",
		"skin":"orboffire",
		"firesistance":15,
		"compound":{
			"firesistance":5,
		},
		"name":"Orb of Fire",
		"g":60000,
		"grades":[0,3],
		"edge":-2,
	},
	"orboffrost":{
		"type":"orb",
		"skin":"orboffrost",
		"fzresistance":15,
		"compound":{
			"fzresistance":5,
		},
		"name":"Orb of Frost",
		"g":60000,
		"grades":[0,3],
		"edge":-2,
	},
	"orbofplague":{
		"type":"orb",
		"skin":"orbofplague",
		"pnresistance":15,
		"compound":{
			"pnresistance":5,
		},
		"name":"Orb of Plague",
		"g":60000,
		"grades":[0,3],
		"edge":-2,
	},
	"orbofresolve":{
		"type":"orb",
		"skin":"orbofresolve",
		"phresistance":15,
		"compound":{
			"phresistance":5,
		},
		"name":"Orb of Resolve",
		"g":60000,
		"grades":[0,3],
		"edge":-2,
	},
	"orba":{
		"type":"orb",
		"skin":"orba",
		"firesistance":15,
		"fzresistance":15,
		"pnresistance":15,
		"phresistance":15,
		"compound":{
			"firesistance":5,
			"fzresistance":5,
			"pnresistance":5,
			"phresistance":5,
		},
		"name":"Orb of Adventures",
		"g":240000,
		"grades":[0,2],
		"edge":-2,
	},
	"orboftemporal":{
		"set":"holidays",
		"type":"orb",
		"skin":"orboftemporal",
		"ability":"temporalsurge",
		"evasion":5,
		"compound":{
			"evasion":4,
		},
		"name":"Orb of Temporal Forces",
		"g":1200000,
		"grades":[0,0],
		"a":true,
	},
	"orbofsc":{
		"set":"holidays",
		"type":"orb",
		"skin":"orbofsc",
		"mp":200,
		"ability":"secondchance",
		"attr0":1,
		"vit":2,
		"str":2,
		"int":2,
		"dex":2,
		"compound":{
			"mp":100,
			"attr0":1,
			"vit":1,
			"str":1,
			"int":2,
			"dex":1,
		},
		"name":"Orb of Second Chances",
		"g":120000,
		"grades":[0,0],
		"a":true,
	},
	"charmer":{
		"type":"orb",
		"skin":"charmer",
		"name":"Charmer",
		"vit":10,
		"ability":"charm",
		"attr0":1,
		"compound":{
			"vit":10,
			"attr0":1,
		},
		"g":120000,
		"grades":[0,3],
		"event":true,
	},
	"rabbitsfoot":{
		"type":"orb",
		"skin":"rabbitsfoot",
		"luck":10,
		"compound":{
			"luck":5,
		},
		"name":"Rabbit's Foot",
		"g":120000,
		"grades":[0,0],
		"a":true,
		"explanation":"Taken from a rabbit who lived a long and happy life, after the natural death occurred, with pre-consent",
	},
	"talkingskull":{
		"type":"orb",
		"skin":"talkingskull",
		"xp":5,
		"compound":{
			"xp":5,
		},
		"name":"Yorick the Talking Skull",
		"explanation":"Endless wisdom",
		"g":96000,
		"grades":[1,2],
		"a":true,
	},
	"jacko":{
		"type":"orb",
		"skin":"jacko",
		"rpiercing":20,
		"compound":{
			"rpiercing":15,
		},
		"name":"Jack-o Lantern",
		//"explanation":"Before the halloween event comes to an end, the Jack-o shall receive it's true power!",
		"ability":"scare",
		"g":96000,
		"grades":[2,4],
		"a":true,
		"cx":{
			"scale":0.5,
			//"extension":true,
		}
	},
	"ftrinket":{
		"type":"orb",
		"skin":"ftrinket",
		"vit":2,
		"str":2,
		"int":2,
		"dex":2,
		"armor":5,
		"speed":0.5,
		"compound":{
			"armor":5,
			"vit":3,
			"speed":1,
		},
		"name":"Trinket of Faith",
		"explanation":"Good things come to those who wait",
		"g":96000,
		"grades":[1,3],
		"a":true,
	},
}

//Orb of Vitality: 120 +120
//Orb of Armor: 40 +20
//Orb of Res.: 40 +20
//Orb of Int.: 6 +4
//Orb of Str.: 6 +4
//Orb of Dex.: 6 +4
//Orb of Swift.: 1% Evasion + Speed+3 | 2%/+1
//Orb of Refl.: 1% Reflection + 4 Dex | 2% Reflection + 2 Dex
//Orb of Rage.: 1% Crit + 30 A.Piercing + 30 R.Piercing || 1% Crit + 10 + 10
//Orb of Lifesteal: 2% Lifesteal + 120HP | 1% + 60HP

var elixirs={
	"eggnog":{
		"type":"elixir",
		"skin":"eggnog",
		"hp":1200,
		"evasion":2.5,
		//"armor":-40,
		//"resistance":-60,
		"duration":48,
		"name":"Eggnog",
		"explanation":"Fills your heart with warmth and joy.",
		"s":true,
		"g":6000,
	},
	"vblood":{
		"set":"vampires",
		"type":"elixir",
		"skin":"vblood",
		"lifesteal":20,
		//"armor":-40,
		//"resistance":-60,
		"duration":1,
		"name":"Vampire's Blood",
		"explanation":"Just a tiny sip",
		"s":true,
		"g":240000,
		"withdrawal":"withdrawal",
	},
	"gum":{
		"type":"elixir",
		"skin":"gum",
		"hp":40,
		"reflection":0.2,
		"duration":120,
		"name":"Gum",
		"explanation":"Nice flavour",
		"s":true,
		"eat":true,
		"g":100,
	},
	"hotchocolate":{
		"type":"elixir",
		"skin":"hotchocolate",
		"vit":30,
		"armor":30,
		"resistance":30,
		"duration":1,
		"name":"Hot Chocolate",
		"explanation":"Fills your heart with warmth.",
		"s":true,
		"g":6000,
	},
	"pumpkinspice":{
		"type":"elixir",
		"skin":"pumpkinspice",
		"mp":-400,
		"crit":5,
		"reflection":2,
		"duration":8,
		"name":"Pumpkin Spice Latte",
		"explanation":"Produced in bulk during the Halloween season. WARNING: The pumpkin comes from a non-vegetable source",
		"s":true,
		"g":200,
	},
	"cake":{
		"type":"elixir",
		"skin":"cake",
		"hp":2400,
		"speed":-30,
		"duration":6,
		"name":"Piece of Cake",
		"explanation":"Delicious.",//" [Note from Wizard: I forgot to buy the Cake. Have this placeholder for now instead :]",
		"s":true,
		"eat":true,
		"g":100,
	},
	"greenbomb":{
		"type":"elixir",
		"skin":"greenbomb",
		"dex":120,
		"str":50,
		"crit":10,
		"speed":30,
		"resistance":-800,
		"duration":0.002,
		"name":"Green Bomb",
		"explanation":"It's a candy with very questionable ingredients, might be addictive.",
		"a":true,
		"s":true,
		"eat":true,
		"withdrawal":"withdrawal",
		"g":10000,
	},
	"swirlipop":{
		"type":"elixir",
		"skin":"swirlipop",
		"evasion":90,
		"resistance":-300,
		"int":-40,
		"duration":0.008,
		"name":"Swirlipop",
		"explanation":"A dizzying candy, has some benefits.",
		"a":true,
		"s":true,
		"eat":true,
		"withdrawal":"withdrawal",
		"g":10000,
	},
	"xshot":{
		"type":"elixir",
		"skin":"xshot",
		"duration":0.000000000001,
		"name":"X-Shot",
		"explanation":"Increases your luck in gambling a hundredfold! Warning: Some establishments might screen you before taking a bet. Can be detected in your blood for 12 hours",
		"s":40,
		"g":1,
		"withdrawal":"xshotted",
	},
	"espresso":{
		"type":"elixir",
		"skin":"espresso",
		"speed":24,
		"duration":0.0005,
		"name":"Espresso",
		"s":true,
		"g":12000,
	},
	"whiskey":{
		"type":"elixir",
		"skin":"whiskey",
		"speed":-12,
		"miss":50,
		"apiercing":500,
		"duration":0.1,
		"name":"Whiskey On The Rocks",
		"s":true,
		"g":120000,
	},
	"wine":{
		"type":"elixir",
		"skin":"wine",
		"speed":-12,
		"miss":32,
		"vit":32,
		"duration":0.1,
		"name":"Red Wine",
		"s":true,
		"g":40000,
	},
	"ale":{
		"type":"elixir",
		"skin":"ale",
		"speed":-6,
		"miss":20,
		"str":24,
		"duration":0.05,
		"name":"Ale",
		"s":true,
		"g":24000,
	},
	"pico":{
		"type":"elixir",
		"skin":"pico",
		"miss":15,
		"crit":20,
		"rpiercing":100,
		"duration":0.05,
		"name":"Pixel Colada",
		"s":true,
		"g":150000,
	},
	"blue":{
		"type":"elixir",
		"skin":"blue",
		"miss":24,
		"evasion":50,
		"duration":0.05,
		"name":"Blue Horizon",
		"s":true,
		"g":150000,
	},
	"bunnyelixir":{
		"type":"elixir",
		"skin":"bunnyelixir",
		"hp":400,
		"dex":4,
		"vit":15,
		"mp":300,
		"speed":12,
		//"armor":-40,
		//"resistance":-60,
		"duration":2,
		"name":"Bunny Energy Drink",
		"explanation":"Ingredients: Rabbit sweat, bubble gum flavour",
		"s":true,
		"g":6000,
	},
	"elixirvit0":{
		"type":"elixir",
		"skin":"elixirvit0",
		"vit":8,
		"duration":12,
		"name":"Elixir of Vitality",
		"s":true,
		"g":6000,
	},
	"elixirvit1":{
		"type":"elixir",
		"skin":"elixirvit1",
		"vit":12,
		"duration":24,
		"name":"Elixir of Greater Vitality",
		"s":true,
		"g":20000,
	},
	"elixirvit2":{
		"type":"elixir",
		"skin":"elixirvit2",
		"vit":18,
		"duration":48,
		"name":"Elixir of Extreme Vitality",
		"s":true,
		"g":120000,
		"a":true,
	},
	"elixirstr0":{
		"type":"elixir",
		"skin":"elixirstr0",
		"str":6,
		"duration":12,
		"name":"Elixir of Strength",
		"s":true,
		"g":6000,
	},
	"elixirstr1":{
		"type":"elixir",
		"skin":"elixirstr1",
		"str":8,
		"duration":24,
		"name":"Elixir of Greater Strength",
		"s":true,
		"g":20000,
	},
	"elixirstr2":{
		"type":"elixir",
		"skin":"elixirstr2",
		"str":12,
		"duration":48,
		"name":"Elixir of Extreme Strength",
		"s":true,
		"g":120000,
		"a":true,
	},
	"elixirdex0":{
		"type":"elixir",
		"skin":"elixirdex0",
		"dex":6,
		"duration":12,
		"name":"Elixir of Dexterity",
		"s":true,
		"g":6000,
	},
	"elixirdex1":{
		"type":"elixir",
		"skin":"elixirdex1",
		"dex":8,
		"duration":24,
		"name":"Elixir of Greater Dexterity",
		"s":true,
		"g":20000,
	},
	"elixirdex2":{
		"type":"elixir",
		"skin":"elixirdex2",
		"dex":12,
		"duration":48,
		"name":"Elixir of Extreme Dexterity",
		"s":true,
		"g":120000,
		"a":true,
	},
	"elixirint0":{
		"type":"elixir",
		"skin":"elixirint0",
		"int":6,
		"duration":12,
		"name":"Elixir of Intelligence",
		"s":true,
		"g":6000,
	},
	"elixirint1":{
		"type":"elixir",
		"skin":"elixirint1",
		"int":8,
		"duration":24,
		"name":"Elixir of Greater Intelligence",
		"s":true,
		"g":20000,
	},
	"elixirint2":{
		"type":"elixir",
		"skin":"elixirint2",
		"int":12,
		"duration":48,
		"name":"Elixir of Extreme Intelligence",
		"s":true,
		"g":120000,
		"a":true,
	},
	"elixirluck":{
		"type":"elixir",
		"skin":"elixirluck",
		"luck":16,
		"duration":12,
		"name":"Liquid Luck",
		"s":true,
		"g":240000,
		"a":true,
	},
	"elixirfires":{
		"type":"elixir",
		"skin":"elixirfires",
		"firesistance":30,
		"duration":2,
		"name":"Elixir of Fire Resistance",
		"s":40,
		"g":240000,
		"a":true,
	},
	"elixirfzres":{
		"type":"elixir",
		"skin":"elixirfzres",
		"fzresistance":30,
		"duration":2,
		"name":"Elixir of Freeze Resistance",
		"s":40,
		"g":240000,
		"a":true,
	},
	"elixirpnres":{
		"type":"elixir",
		"skin":"elixirpnres",
		"pnresistance":30,
		"duration":2,
		"name":"Elixir of Poison Resistance",
		"s":40,
		"g":240000,
		"a":true,
	},
}

for(var name in elixirs){
	elixirs[name]["skin_a"]=elixirs[name]["skin"];
}

var skill_items={
	"poison":{
		"type":"skill_item",
		"name":"Poison Sack",
		"skin":"poison",
		"explanation":"An organic poison sack, can be used to coat weapons or arrows.",
		"s":true,
		"g":1000,
	},
	"shadowstone":{
		"type":"skill_item",
		"name":"Shadow Stone",
		"skin":"shadowstone",
		"explanation":"A stone piece with curious properties, allows the bearer to shift to a parallel reality.",
		"s":true,
		"g":800,
	}
}

var crafting_items={
	"mbones":{
		"type":"material",
		"name":"Bones",
		"skin":"mbones",
		"explanation":"Scattered, ugly bones.",
		"s":true,
		"g":16,
	},
	"cscale":{
		"type":"material",
		"name":"Croc Scale",
		"skin":"cscale",
		"explanation":"A very hard scale, can be sewn onto armors.",
		"s":true,
		"g":200,
	},
	"snakeoil":{
		"type":"pot",
		"name":"Snake Oil",
		"skin":"snakeoil",
		"gives":[["hp",-100]],
		//"explanation":"?",
		"debuff":true,
		"rare":true,
		"s":true,
		"g":200,
	},
	"feather0":{
		"type":"material",
		"name":"Magical Feather",
		"skin":"feather0",
		"explanation":"Holding this, you understand how those huge birds can fly, it's not a normal feather!",
		"s":true,
		"g":800,
	},
	"feather1":{
		"type":"material",
		"name":"Harpy Feather",
		"skin":"feather1",
		"explanation":"Holding this, you understand how those huge harpies can fly, it's not a normal feather!",
		"s":true,
		"g":800,
	},
	"bronzeingot":{
		"type":"material",
		"name":"Bronze Ingot",
		"skin":"bronzeingot",
		"explanation":"Solid Bronze",
		"offering":0.1,
		"s":100,
		"g":40000,
	},
	"goldingot":{
		"type":"material",
		"name":"Gold Ingot",
		"skin":"goldingot",
		"explanation":"Solid Gold",
		"offering":1.1,
		"s":100,
		"g":2000000,
	},
	"platinumingot":{
		"type":"material",
		"name":"Platinum Ingot",
		"skin":"platinumingot",
		"explanation":"Solid Platinum",
		"offering":2,
		"s":100,
		"g":40000000,
	},
	"bronzenugget":{
		"type":"material",
		"name":"Bronze Nugget",
		"skin":"bronzenugget",
		"explanation":"Ideal for crafting",
		"s":1000,
		"g":3200,
	},
	"goldnugget":{
		"type":"material",
		"name":"Gold Nugget",
		"skin":"goldnugget",
		"explanation":"Ideal for crafting",
		"offering":0,
		"s":1000,
		"g":120000,
	},
	"platinumnugget":{
		"type":"material",
		"name":"Platinum Nugget",
		"skin":"platinumnugget",
		"explanation":"Ideal for crafting",
		"offering":1,
		"s":1000,
		"g":5200000, //5.2 so it gets announced [21/08/18]
	},
	"electronics":{
		"type":"material",
		"name":"Electronics",
		"skin":"electronics",
		"explanation":"Various random electronic components",
		"s":true,
		"g":7,
	},
	"spidersilk":{
		"type":"material",
		"name":"Spider Silk",
		"skin":"spidersilk",
		"explanation":"A durable yet sticky material",
		"s":true,
		"g":300,
	}
}

var sets={
	"tiger":{
		"name":"Tigers'",
		"items":["tigerhelmet","tigershield","tigercape","tigerstone"],
		"1":{

		},
		"2":{
			"vit":1,
		},
		"3":{
			"str":5,
			"int":5,
			"dex":5,
		},
		"4":{
			"speed":3,
		}
	},
	"vampires":{
		"name":"Vampires",
		"items":["mcape","vgloves","vboots","vattire","vcape","vorb","vhammer","vdagger","vstaff","vsword","vblood","vring"],
		"1":{

		},
		"2":{
			"vit":10,
		},
		"3":{
			"lifesteal":1,
		},
	},
	"mpx":{
		"name":"MP X",
		"items":["mpxbelt","mpxgloves","mpxamulet"],
		"1":{

		},
		"2":{
			"mp":100,
		},
		"3":{
			"mp":500,
			"speed":1,
			"rpiercing":20,
		},
	},
	"fury":{
		"name":"Rage and Fury",
		"items":["suckerpunch","suckerpunch","fury","fallen"],
		"1":{

		},
		"2":{
			"str":1,
		},
		"3":{
			"dex":2,
		},
		"4":{
			"apiercing":32,
		},
	},
	"legends":{
		"name":"The Legends",
		"items":["warpvest","starkillers","powerglove","goldenpowerglove"],
		"1":{
		},
		"2":{
		},
		"3":{
			"for":10,
		},
		"4":{
			"for":2,
		},
	},
	"swift":{
		"name":"Swift Judgement",
		"items":["wingedboots","fierygloves"],
		"1":{
		},
		"2":{
			"dex":1,
		},
	},
	"holidays":{
		"name":"Holiday Spirit",
		"items":["xmashat","xmassweater","xmasshoes","xmaspants","mittens","supermittens","santasbelt","ornamentstaff","candycanesword","merry","orbofsc","mearring","xmace","ringhs","sweaterhs","wbookhs","orboftemporal"],
		"explanation":"Every month is December with this set!",
		"1":{
		},
		"2":{
			"dex":1,
		},
		"3":{
			"vit":1,
		},
		"4":{
			"luck":6,
		},
		"5":{

		},
		6:{
		
		},
		"7":{
		
		}
	},
	"wanderers":{
		"name":"Wanderer's Set",
		"items":["wcap","wattire","wbreeches","wgloves","wshoes"],
		"explanation":"Wanderer was a curious adventurer. Traveling from place to place. The items he left over make up a very lucky set when they are combined.",
		"1":{
		},
		"2":{
			"hp":200,
		},
		"3":{
			"mp":100,
		},
		"4":{
			"gold":10,
		},
		"5":{
			"luck":16,
			//"apiercing":40,
		}
	},
	"wt3":{
		"name":"Heavy Armor",
		"items":["hhelmet","harmor","hboots","hgloves","hpants"],
		"1":{
			"for":2,
		},
		"2":{
			"for":4,
		},
		"3":{
			"for":6,
		},
		"4":{
			"for":10,
		},
		"5":{
			"for":16,
		}
	},
	"wt4":{
		"name":"Darkforge Armor",
		"items":["xhelmet","xarmor","xboots","xgloves","xpants"],
		"1":{
			"for":3,
		},
		"2":{
			"for":5,
		},
		"3":{
			"for":7,
		},
		"4":{
			"for":15,
		},
		"5":{
			"for":22,
		}
	},
	"rugged":{
		"name":"Rugged Set",
		"items":["helmet1","coat1","shoes1","gloves1","pants1"],
		"explanation":"Just the right amount of protection for the agile wearer",
		"1":{
		},
		"2":{
			"str":1,
			"dex":1,
			"int":1,
		},
		"3":{
			"armor":20,
			"resistance":20,
			"range":2,
		},
		"4":{
			"for":8,
		},
		"5":{
			"speed":4,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"mwarrior":{
		"name":"Monster Hunter Warrior",
		"items":["mwhelmet","mwarmor","mwgloves","mwpants","mwboots"],
		"explanation":"A set for a noble warrior who serves our realm!",
		"1":{
		},
		"2":{
			"str":2,
		},
		"3":{
			"speed":1,
			"str":3,
		},
		"4":{
			"apiercing":40,
		},
		"5":{
			"crit":5,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"mmage":{
		"name":"Monster Hunter Mage",
		"items":["mmhat","mmarmor","mmgloves","mmpants","mmshoes"],
		"explanation":"A set for a noble mage who serves our realm!",
		"1":{
		},
		"2":{
			"int":2,
		},
		"3":{
			"speed":2,
			"int":3,
		},
		"4":{
			"rpiercing":40,
		},
		"5":{
			"crit":2,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"mpriest":{
		"name":"Monster Hunter Priest",
		"items":["mphat","mparmor","mpgloves","mppants","mpshoes"],
		"explanation":"A set for a noble priest who serves our realm!",
		"1":{
		},
		"2":{
			"int":3,
		},
		"3":{
			"speed":2,
			"int":3,
		},
		"4":{
			"rpiercing":120,
		},
		"5":{
			"mp":2000,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"mranger":{
		"name":"Monster Hunter Ranger",
		"items":["mrnhat","mrnarmor","mrngloves","mrnpants","mrnboots"],
		"explanation":"A set for a noble ranger who serves our realm!",
		"1":{
		},
		"2":{
			"dex":3,
		},
		"3":{
			"speed":2,
			"dex":3,
		},
		"4":{
			"apiercing":60,
		},
		"5":{
			"resistance":100,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"mrogue":{
		"name":"Monster Hunter Rogue",
		"items":["mrhood","mrarmor","mrgloves","mrpants","mrboots"],
		"explanation":"A set for a noble rogue who serves our realm!",
		"1":{
		},
		"2":{
			"dex":6,
		},
		"3":{
			"speed":3,
			"dex":4,
		},
		"4":{
			"apiercing":80,
		},
		"5":{
			"crit":5,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"mmerchant":{
		"name":"Monster Hunter Merchant",
		"items":["mchat","mcarmor","mcgloves","mcpants","mcboots"],
		"explanation":"A set for a noble merchant who has some friends that serve our realm!",
		"1":{
		},
		"2":{
			"vit":6,
			"courage":1,
			"mcourage":1,
			"pcourage":1,
		},
		"3":{
			"speed":2,
			"vit":8,
			"str":3,
		},
		"4":{
			"evasion":6,
		},
		"5":{
			"for":32,
			"courage":2,
			"mcourage":2,
			"pcourage":2,
			"phresistance":25,
			"stresistance":20,
		}
	},
	"bunny":{
		"name":"Bunny Set",
		"items":["eears","ecape","epyjamas","eslippers","pinkie","carrotsword"],
		"explanation":"An Easter / Bunny themed set!",
		"1":{},
		"2":{
			"luck":5,
		},
		"3":{
			"vit":3,
		},
		"4":{
			"speed":2,
		},
		"5":{
			"vit":2,
			"cuteness":50,
		},
		"6":{
			"vit":2,
		},
	},
	// "base":{
	// 	"name":"Base Items",
	// 	"items":["helmet","coat","pants","gloves","shoes"],
	// 	1:{
	// 		"int":10,
	// 	},
	// 	2:{
	// 		"str":10,
	// 	},
	// 	3:{
	// 		"dex":10,
	// 	},
	// 	4:{
	// 		"vit":10,
	// 	},
	// 	5:{
	// 		"evasion":10,
	// 		#"apiercing":40,
	// 	}
	// }
}

for(var wid in weapons){
	var weapon=weapons[wid];
	if(["dagger","fist","stars"].indexOf(weapon["wtype"]||"")!=-1){
		weapon["cx"]=weapon["cx"]||{};
		weapon["cx"]["scale"]=0.5;
		//weapon["cx"]["small"]=true;
		weapon["cx"]["extension"]=true;
	}
	if(["axe","basher"].indexOf(weapon["wtype"]||"")!=-1){
		weapon["cx"]=weapon["cx"]||{};
		weapon["cx"]["large"]=true;
	}
}

var sub_dicts=[pots,armor,weapons,offhands,accessories,scrolls,premiums,gems,materials,collectables,misc,quest,orbs,elixirs,skill_items,crafting_items,pets];
for(var i=0;i<sub_dicts.length;i++){
	for(var key in sub_dicts[i]){
		items[key]=sub_dicts[i][key];
	}
}

for(var iid in items){
	if(items[iid]["grades"] && items[iid]["grades"].length==2){
		items[iid]["grades"].push(10);
	}
	if(items[iid]["grades"] && items[iid]["grades"].length==3){
		items[iid]["grades"].push(12);
	}
	if(items[iid]["compound"] && items[iid]["grades"]){
		items[iid]["grades"][2]=Math.min(6,items[iid]["grades"][2]);
		items[iid]["grades"][3]=Math.min(7,items[iid]["grades"][3]);
	}
	if(items[iid]["s"]===true){
		items[iid]["s"]=9999;
	}
}

for(var name in items){
	var current=items[name];
	if(current.cash) current.g=current.cash*multipliers["shells_to_gold"];
	if(!current.g){
		console.error(name+" doesn't have g!");
		current.g=1;
	}
}

// Starter fixtures are target totals. Keep the source catalog deterministic
// even when the legacy weapon generator above changes its tier defaults.
Object.assign(items.blade, { attack: 12, str: 36 });
Object.assign(items.mace, { attack: 12, str: 28, int: 30 });
Object.assign(items.staff, { attack: 15, int: 40 });
Object.assign(items.wbook0, { attack: 11, int: 34 });
Object.assign(items.bow, { attack: 12, str: 39 });
Object.assign(items.claw, { attack: 11, str: 30 });

// Shared-rank weapon publication generated from the reviewed equipment-balance fixture.
// This is the sole final transform for weapon attack, owned base core stats,
// frozen cadence, and enhancement attack growth; all other fields remain authored.
var weapon_progression = {
  "basher": {
    "attack": 21,
    "frequency": 39.565,
    "str": 3,
    "int": 0,
    "dex": 75,
    "upgrade": {
      "attack": 1.60897435897
    },
    "progression": {
      "historical_rank": 8,
      "shared_rank": 8,
      "role": "progression",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 167,
      "attacks_per_second": 0.87375,
      "base_dps": 145.91625,
      "selected_effort": 54772.507506
    }
  },
  "bataxe": {
    "attack": 37,
    "frequency": 31.8795,
    "str": 1,
    "int": 0,
    "dex": 37,
    "upgrade": {
      "attack": 6.9612208589
    },
    "progression": {
      "historical_rank": 12,
      "shared_rank": 9,
      "role": "progression",
      "requirement": 80,
      "reference_level": 56,
      "target_dps": 212.681370629,
      "full_sheet_hit_damage": 241,
      "attacks_per_second": 0.8825,
      "base_dps": 212.6825,
      "selected_effort": 2362614.88927
    }
  },
  "blade": {
    "attack": 27,
    "frequency": 0.737,
    "str": 0,
    "int": 0,
    "dex": 9,
    "upgrade": {
      "attack": 2.04552
    },
    "progression": {
      "historical_rank": 1,
      "shared_rank": 1,
      "role": "progression",
      "requirement": 1,
      "reference_level": 1,
      "target_dps": 10.4366986063,
      "full_sheet_hit_damage": 18,
      "attacks_per_second": 0.5803125,
      "base_dps": 10.445625,
      "selected_effort": 0
    }
  },
  "bow": {
    "attack": 117,
    "frequency": 1.118,
    "str": 0,
    "int": 0,
    "dex": 62,
    "upgrade": {
      "attack": 10.99098
    },
    "progression": {
      "historical_rank": 1,
      "shared_rank": 1,
      "role": "progression",
      "requirement": 1,
      "reference_level": 1,
      "target_dps": 10.4366986063,
      "full_sheet_hit_damage": 18,
      "attacks_per_second": 0.5803125,
      "base_dps": 10.445625,
      "selected_effort": 0
    }
  },
  "bowofthedead": {
    "attack": 73,
    "frequency": 50.77075,
    "str": 0,
    "int": 0,
    "dex": 125,
    "upgrade": {
      "attack": 17.6405569828
    },
    "progression": {
      "historical_rank": 8,
      "shared_rank": 6,
      "role": "progression",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 55,
      "attacks_per_second": 1.24864864865,
      "base_dps": 68.6756756757,
      "selected_effort": 13648.4955503
    }
  },
  "broom": {
    "attack": 62,
    "frequency": 1.5759999999999996,
    "str": 0,
    "int": 5,
    "dex": 0,
    "upgrade": {
      "attack": 0.684721003135
    },
    "progression": {
      "historical_rank": 11,
      "shared_rank": 8,
      "role": "progression",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 372,
      "attacks_per_second": 0.3922,
      "base_dps": 145.8984,
      "selected_effort": 147234.916666
    }
  },
  "candycanesword": {
    "attack": 16,
    "frequency": 25.152,
    "str": 2,
    "int": 0,
    "dex": 67,
    "upgrade": {
      "attack": 1.87104930468
    },
    "progression": {
      "historical_rank": 5,
      "shared_rank": 4,
      "role": "progression",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 35,
      "attacks_per_second": 0.9234375,
      "base_dps": 32.3203125,
      "selected_effort": 5033.67092033
    }
  },
  "carrotsword": {
    "attack": 21,
    "frequency": 26.7145,
    "str": 2,
    "int": 0,
    "dex": 25,
    "upgrade": {
      "attack": 1.8137254902
    },
    "progression": {
      "historical_rank": 8,
      "shared_rank": 6,
      "role": "progression",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 77,
      "attacks_per_second": 0.891875,
      "base_dps": 68.674375,
      "selected_effort": 39120.7360545
    }
  },
  "cclaw": {
    "attack": 78,
    "frequency": 15.4525,
    "str": 0,
    "int": 0,
    "dex": 46,
    "upgrade": {
      "attack": 10.219625
    },
    "progression": {
      "historical_rank": 2,
      "shared_rank": 2,
      "role": "progression",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 20,
      "attacks_per_second": 0.7609375,
      "base_dps": 15.21875,
      "selected_effort": 362.099525106
    }
  },
  "claw": {
    "attack": 88,
    "frequency": 0.8,
    "str": 0,
    "int": 0,
    "dex": 32,
    "upgrade": {
      "attack": 6.53465346535
    },
    "progression": {
      "historical_rank": 1,
      "shared_rank": 1,
      "role": "progression",
      "requirement": 1,
      "reference_level": 1,
      "target_dps": 10.4366986063,
      "full_sheet_hit_damage": 18,
      "attacks_per_second": 0.5803125,
      "base_dps": 10.445625,
      "selected_effort": 0
    }
  },
  "crossbow": {
    "attack": 228,
    "frequency": 31.158,
    "str": 0,
    "int": 0,
    "dex": 3,
    "upgrade": {
      "attack": 18.2503962264
    },
    "progression": {
      "historical_rank": 9,
      "shared_rank": 7,
      "role": "progression",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 182,
      "attacks_per_second": 0.55,
      "base_dps": 100.1,
      "selected_effort": 273862.53753
    }
  },
  "cupid": {
    "attack": 109,
    "frequency": 50.77075,
    "str": 0,
    "int": 0,
    "dex": 29,
    "upgrade": {
      "attack": 21.7232045455
    },
    "progression": {
      "historical_rank": 10,
      "shared_rank": 7,
      "role": "sidegrade",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 87,
      "attacks_per_second": 1.150625,
      "base_dps": 100.104375,
      "selected_effort": 391175.229927
    }
  },
  "dagger": {
    "attack": 81,
    "frequency": 30.714,
    "str": 0,
    "int": 0,
    "dex": 95,
    "upgrade": {
      "attack": 12.8037857143
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 6,
      "role": "sidegrade",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 65,
      "attacks_per_second": 1.05648648649,
      "base_dps": 68.6716216216,
      "selected_effort": 54772.507506
    }
  },
  "daggerofthedead": {
    "attack": 60,
    "frequency": 50.19875,
    "str": 0,
    "int": 0,
    "dex": 14,
    "upgrade": {
      "attack": 25.58015625
    },
    "progression": {
      "historical_rank": 5,
      "shared_rank": 5,
      "role": "progression",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 42,
      "attacks_per_second": 1.121875,
      "base_dps": 47.11875,
      "selected_effort": 13253.4955503
    }
  },
  "dartgun": {
    "attack": 102,
    "frequency": 75.09658108108108,
    "str": 3,
    "int": 0,
    "dex": 87,
    "upgrade": {
      "attack": 31.4816471735
    },
    "progression": {
      "historical_rank": 14,
      "shared_rank": 10,
      "role": "sidegrade",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 199,
      "attacks_per_second": 1.55783783784,
      "base_dps": 310.00972973,
      "selected_effort": 5847629.2595
    }
  },
  "dragondagger": {
    "attack": 79,
    "frequency": 74.27158108108108,
    "str": 0,
    "int": 0,
    "dex": 116,
    "upgrade": {
      "attack": 7.83937777778
    },
    "progression": {
      "historical_rank": 11,
      "shared_rank": 11,
      "role": "progression",
      "requirement": 99,
      "reference_level": 70,
      "target_dps": 451.877822784,
      "full_sheet_hit_damage": 273,
      "attacks_per_second": 1.65513513514,
      "base_dps": 451.851891892,
      "selected_effort": 700465416.306
    }
  },
  "fclaw": {
    "attack": 57,
    "frequency": 31.222,
    "str": 0,
    "int": 0,
    "dex": 31,
    "upgrade": {
      "attack": 11.3641225714
    },
    "progression": {
      "historical_rank": 4,
      "shared_rank": 4,
      "role": "progression",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 34,
      "attacks_per_second": 0.950625,
      "base_dps": 32.32125,
      "selected_effort": 4358.35314159
    }
  },
  "fireblade": {
    "attack": 12,
    "frequency": 25.152,
    "str": 0,
    "int": 0,
    "dex": 23,
    "upgrade": {
      "attack": 1.44155844156
    },
    "progression": {
      "historical_rank": 3,
      "shared_rank": 2,
      "role": "sidegrade",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 18,
      "attacks_per_second": 0.8453125,
      "base_dps": 15.215625,
      "selected_effort": 1424.93979882
    }
  },
  "firebow": {
    "attack": 87,
    "frequency": 31.158,
    "str": 0,
    "int": 0,
    "dex": 59,
    "upgrade": {
      "attack": 29.276978304
    },
    "progression": {
      "historical_rank": 3,
      "shared_rank": 2,
      "role": "sidegrade",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 17,
      "attacks_per_second": 0.894375,
      "base_dps": 15.204375,
      "selected_effort": 1424.93979882
    }
  },
  "firestaff": {
    "attack": 16,
    "frequency": 28.83704071499502,
    "str": 0,
    "int": 1,
    "dex": 0,
    "upgrade": {
      "attack": 3.97655677656
    },
    "progression": {
      "historical_rank": 4,
      "shared_rank": 3,
      "role": "progression",
      "requirement": 20,
      "reference_level": 15,
      "target_dps": 22.1745450922,
      "full_sheet_hit_damage": 34,
      "attacks_per_second": 0.65344,
      "base_dps": 22.21696,
      "selected_effort": 1424.93979882
    }
  },
  "firestars": {
    "attack": 235,
    "frequency": 50.19875,
    "str": 0,
    "int": 0,
    "dex": 131,
    "upgrade": {
      "attack": 42.857390625
    },
    "progression": {
      "historical_rank": 7,
      "shared_rank": 7,
      "role": "progression",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 67,
      "attacks_per_second": 1.49405405405,
      "base_dps": 100.101621622,
      "selected_effort": 57253.3457055
    }
  },
  "frostbow": {
    "attack": 83,
    "frequency": 31.158,
    "str": 0,
    "int": 0,
    "dex": 6,
    "upgrade": {
      "attack": 10.8765227165
    },
    "progression": {
      "historical_rank": 7,
      "shared_rank": 5,
      "role": "sidegrade",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 54,
      "attacks_per_second": 0.8725,
      "base_dps": 47.115,
      "selected_effort": 6620.86304571
    }
  },
  "froststaff": {
    "attack": 19,
    "frequency": 28.962490566037747,
    "str": 0,
    "int": 13,
    "dex": 0,
    "upgrade": {
      "attack": 2.22764285714
    },
    "progression": {
      "historical_rank": 7,
      "shared_rank": 5,
      "role": "progression",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 71,
      "attacks_per_second": 0.664,
      "base_dps": 47.144,
      "selected_effort": 4358.35314159
    }
  },
  "fsword": {
    "attack": 13,
    "frequency": 25.66,
    "str": 0,
    "int": 0,
    "dex": 66,
    "upgrade": {
      "attack": 1.49837662338
    },
    "progression": {
      "historical_rank": 4,
      "shared_rank": 3,
      "role": "progression",
      "requirement": 20,
      "reference_level": 15,
      "target_dps": 22.1745450922,
      "full_sheet_hit_damage": 24,
      "attacks_per_second": 0.9240625,
      "base_dps": 22.1775,
      "selected_effort": 4358.35314159
    }
  },
  "gbow": {
    "attack": 138,
    "frequency": 50.77075,
    "str": 1,
    "int": 0,
    "dex": 186,
    "upgrade": {
      "attack": 11.9308117045
    },
    "progression": {
      "historical_rank": 15,
      "shared_rank": 11,
      "role": "progression",
      "requirement": 99,
      "reference_level": 70,
      "target_dps": 451.877822784,
      "full_sheet_hit_damage": 311,
      "attacks_per_second": 1.45297297297,
      "base_dps": 451.874594595,
      "selected_effort": 54489049.6002
    }
  },
  "glolipop": {
    "attack": 16,
    "frequency": 3.65175,
    "str": 4,
    "int": 0,
    "dex": 70,
    "upgrade": {
      "attack": 0.900027210884
    },
    "progression": {
      "historical_rank": 5,
      "shared_rank": 5,
      "role": "progression",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 77,
      "attacks_per_second": 0.611875,
      "base_dps": 47.114375,
      "selected_effort": 10196.5759824
    }
  },
  "gstaff": {
    "attack": 32,
    "frequency": 64.23990584737365,
    "str": 0,
    "int": 46,
    "dex": 0,
    "upgrade": {
      "attack": 2.48965980435
    },
    "progression": {
      "historical_rank": 15,
      "shared_rank": 10,
      "role": "sidegrade",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 317,
      "attacks_per_second": 0.97811,
      "base_dps": 310.06087,
      "selected_effort": 2755353024.59
    }
  },
  "hammer": {
    "attack": 13,
    "frequency": 59.574,
    "str": 4,
    "int": 1,
    "dex": 15,
    "upgrade": {
      "attack": 3.88974235105
    },
    "progression": {
      "historical_rank": 7,
      "shared_rank": 7,
      "role": "progression",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 91,
      "attacks_per_second": 1.1,
      "base_dps": 100.1,
      "selected_effort": 18285.8369099
    }
  },
  "harbringer": {
    "attack": 5,
    "frequency": 54.39558254833913,
    "str": 0,
    "int": 88,
    "dex": 0,
    "upgrade": {
      "attack": 2.46773709484
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 4,
      "role": "sidegrade",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 34,
      "attacks_per_second": 0.95052,
      "base_dps": 32.31768,
      "selected_effort": 3809.54935622
    }
  },
  "harpybow": {
    "attack": 112,
    "frequency": 75.09658108108108,
    "str": 0,
    "int": 0,
    "dex": 6,
    "upgrade": {
      "attack": 29.9962733668
    },
    "progression": {
      "historical_rank": 11,
      "shared_rank": 8,
      "role": "progression",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 106,
      "attacks_per_second": 1.3765625,
      "base_dps": 145.915625,
      "selected_effort": 545705.09304
    }
  },
  "hbow": {
    "attack": 95,
    "frequency": 15.8335,
    "str": 0,
    "int": 0,
    "dex": 65,
    "upgrade": {
      "attack": 11.2180864
    },
    "progression": {
      "historical_rank": 4,
      "shared_rank": 3,
      "role": "progression",
      "requirement": 20,
      "reference_level": 15,
      "target_dps": 22.1745450922,
      "full_sheet_hit_damage": 29,
      "attacks_per_second": 0.7646875,
      "base_dps": 22.1759375,
      "selected_effort": 1969.28097259
    }
  },
  "hdagger": {
    "attack": 102,
    "frequency": 74.27158108108108,
    "str": 2,
    "int": 0,
    "dex": 59,
    "upgrade": {
      "attack": 18.9308076923
    },
    "progression": {
      "historical_rank": 10,
      "shared_rank": 10,
      "role": "sidegrade",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 199,
      "attacks_per_second": 1.55783783784,
      "base_dps": 310.00972973,
      "selected_effort": 5225270.29459
    }
  },
  "heartwood": {
    "attack": 30,
    "frequency": 51.892,
    "str": 11,
    "int": 0,
    "dex": 72,
    "upgrade": {
      "attack": 5.70681818182
    },
    "progression": {
      "historical_rank": 14,
      "shared_rank": 10,
      "role": "sidegrade",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 249,
      "attacks_per_second": 1.245,
      "base_dps": 310.005,
      "selected_effort": 2728603202.81
    }
  },
  "lmace": {
    "attack": 30,
    "frequency": 60.082,
    "str": 3,
    "int": 0,
    "dex": 15,
    "upgrade": {
      "attack": 5.82562628942
    },
    "progression": {
      "historical_rank": 11,
      "shared_rank": 11,
      "role": "progression",
      "requirement": 99,
      "reference_level": 70,
      "target_dps": 451.877822784,
      "full_sheet_hit_damage": 400,
      "attacks_per_second": 1.1296875,
      "base_dps": 451.875,
      "selected_effort": 44328862.2444
    }
  },
  "mace": {
    "attack": 19,
    "frequency": 1.308,
    "str": 0,
    "int": 0,
    "dex": 20,
    "upgrade": {
      "attack": 1.42711111111
    },
    "progression": {
      "historical_rank": 1,
      "shared_rank": 1,
      "role": "progression",
      "requirement": 1,
      "reference_level": 1,
      "target_dps": 10.4366986063,
      "full_sheet_hit_damage": 21,
      "attacks_per_second": 0.4975,
      "base_dps": 10.4475,
      "selected_effort": 0
    }
  },
  "maceofthedead": {
    "attack": 12,
    "frequency": 42.617,
    "str": 6,
    "int": 1,
    "dex": 100,
    "upgrade": {
      "attack": 2.65793478261
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 6,
      "role": "progression",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 65,
      "attacks_per_second": 1.0565625,
      "base_dps": 68.6765625,
      "selected_effort": 14689.3288836
    }
  },
  "merry": {
    "attack": 86,
    "frequency": 15.8335,
    "str": 0,
    "int": 0,
    "dex": 91,
    "upgrade": {
      "attack": 6.41118707071
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 5,
      "role": "progression",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 56,
      "attacks_per_second": 0.841351351351,
      "base_dps": 47.1156756757,
      "selected_effort": 5943.28703703
    }
  },
  "mushroomstaff": {
    "attack": 12,
    "frequency": 7.912192938836399,
    "str": 0,
    "int": 70,
    "dex": 0,
    "upgrade": {
      "attack": 0.839833727611
    },
    "progression": {
      "historical_rank": 5,
      "shared_rank": 4,
      "role": "progression",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 71,
      "attacks_per_second": 0.45537,
      "base_dps": 32.33127,
      "selected_effort": 3285.98054529
    }
  },
  "ololipop": {
    "attack": 17,
    "frequency": 1.308,
    "str": 0,
    "int": 0,
    "dex": 17,
    "upgrade": {
      "attack": 1.25672727273
    },
    "progression": {
      "historical_rank": 3,
      "shared_rank": 3,
      "role": "progression",
      "requirement": 20,
      "reference_level": 15,
      "target_dps": 22.1745450922,
      "full_sheet_hit_damage": 45,
      "attacks_per_second": 0.4928125,
      "base_dps": 22.1765625,
      "selected_effort": 5225.27029459
    }
  },
  "oozingterror": {
    "attack": 10,
    "frequency": 55.65495785820524,
    "str": 0,
    "int": 99,
    "dex": 0,
    "upgrade": {
      "attack": 1.93382352941
    },
    "progression": {
      "historical_rank": 10,
      "shared_rank": 7,
      "role": "progression",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 100,
      "attacks_per_second": 1.001,
      "base_dps": 100.1,
      "selected_effort": 48695.9578214
    }
  },
  "ornamentstaff": {
    "attack": 16,
    "frequency": 28.83704071499502,
    "str": 0,
    "int": 33,
    "dex": 0,
    "upgrade": {
      "attack": 2.04060150376
    },
    "progression": {
      "historical_rank": 8,
      "shared_rank": 6,
      "role": "progression",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 101,
      "attacks_per_second": 0.68032,
      "base_dps": 68.71232,
      "selected_effort": 5033.67092033
    }
  },
  "pclaw": {
    "attack": 110,
    "frequency": 50.19875,
    "str": 0,
    "int": 0,
    "dex": 147,
    "upgrade": {
      "attack": 17.5355057927
    },
    "progression": {
      "historical_rank": 8,
      "shared_rank": 8,
      "role": "progression",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 110,
      "attacks_per_second": 1.32648648649,
      "base_dps": 145.913513514,
      "selected_effort": 62043.3070945
    }
  },
  "pinkie": {
    "attack": 24,
    "frequency": 21.48166915052161,
    "str": 0,
    "int": 84,
    "dex": 0,
    "upgrade": {
      "attack": 0.30881850176
    },
    "progression": {
      "historical_rank": 16,
      "shared_rank": 11,
      "role": "progression",
      "requirement": 99,
      "reference_level": 70,
      "target_dps": 451.877822784,
      "full_sheet_hit_damage": 341,
      "attacks_per_second": 1.32472,
      "base_dps": 451.72952,
      "selected_effort": 8939157232.81
    }
  },
  "pmace": {
    "attack": 13,
    "frequency": 28.073,
    "str": 0,
    "int": 0,
    "dex": 42,
    "upgrade": {
      "attack": 5.73227946916
    },
    "progression": {
      "historical_rank": 4,
      "shared_rank": 4,
      "role": "progression",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 40,
      "attacks_per_second": 0.808125,
      "base_dps": 32.325,
      "selected_effort": 6030.4101292
    }
  },
  "pmaceofthedead": {
    "attack": 13,
    "frequency": 59.574,
    "str": 4,
    "int": 1,
    "dex": 15,
    "upgrade": {
      "attack": 10.5770981087
    },
    "progression": {
      "historical_rank": 7,
      "shared_rank": 7,
      "role": "sidegrade",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 91,
      "attacks_per_second": 1.1,
      "base_dps": 100.1,
      "selected_effort": 18878.9056795
    }
  },
  "pouchbow": {
    "attack": 101,
    "frequency": 1.118,
    "str": 0,
    "int": 0,
    "dex": 14,
    "upgrade": {
      "attack": 4.37711932773
    },
    "progression": {
      "historical_rank": 5,
      "shared_rank": 4,
      "role": "progression",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 56,
      "attacks_per_second": 0.5771875,
      "base_dps": 32.3225,
      "selected_effort": 2500
    }
  },
  "rapier": {
    "attack": 69,
    "frequency": 30.714,
    "str": 0,
    "int": 0,
    "dex": 115,
    "upgrade": {
      "attack": 6.17317177914
    },
    "progression": {
      "historical_rank": 9,
      "shared_rank": 9,
      "role": "progression",
      "requirement": 80,
      "reference_level": 56,
      "target_dps": 212.681370629,
      "full_sheet_hit_damage": 114,
      "attacks_per_second": 1.86567567568,
      "base_dps": 212.687027027,
      "selected_effort": 547725.075063
    }
  },
  "scythe": {
    "attack": 35,
    "frequency": 55.197,
    "str": 10,
    "int": 0,
    "dex": 35,
    "upgrade": {
      "attack": 16.8570764681
    },
    "progression": {
      "historical_rank": 13,
      "shared_rank": 10,
      "role": "progression",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 280,
      "attacks_per_second": 1.1071875,
      "base_dps": 310.0125,
      "selected_effort": 32430087.2093
    }
  },
  "slimestaff": {
    "attack": 10,
    "frequency": 15.671302186878721,
    "str": 0,
    "int": 23,
    "dex": 0,
    "upgrade": {
      "attack": 2.0756
    },
    "progression": {
      "historical_rank": 3,
      "shared_rank": 2,
      "role": "sidegrade",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 29,
      "attacks_per_second": 0.524535,
      "base_dps": 15.211515,
      "selected_effort": 789.697581691
    }
  },
  "snowflakes": {
    "attack": 211,
    "frequency": 30.714,
    "str": 0,
    "int": 0,
    "dex": 67,
    "upgrade": {
      "attack": 21.3443157895
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 6,
      "role": "sidegrade",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 56,
      "attacks_per_second": 1.22621621622,
      "base_dps": 68.6681081081,
      "selected_effort": 56757.5824774
    }
  },
  "sparkstaff": {
    "attack": 26,
    "frequency": 45.18042162698415,
    "str": 0,
    "int": 34,
    "dex": 0,
    "upgrade": {
      "attack": 2.959125
    },
    "progression": {
      "historical_rank": 12,
      "shared_rank": 8,
      "role": "sidegrade",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 194,
      "attacks_per_second": 0.75215,
      "base_dps": 145.9171,
      "selected_effort": 1301924.40666
    }
  },
  "spear": {
    "attack": 15,
    "frequency": 6.352,
    "str": 0,
    "int": 0,
    "dex": 27,
    "upgrade": {
      "attack": 1.53511159499
    },
    "progression": {
      "historical_rank": 2,
      "shared_rank": 2,
      "role": "progression",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 23,
      "attacks_per_second": 0.6615625,
      "base_dps": 15.2159375,
      "selected_effort": 152.381974249
    }
  },
  "spearofthedead": {
    "attack": 14,
    "frequency": 39.13975,
    "str": 3,
    "int": 0,
    "dex": 26,
    "upgrade": {
      "attack": 2.34903784404
    },
    "progression": {
      "historical_rank": 7,
      "shared_rank": 5,
      "role": "sidegrade",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 47,
      "attacks_per_second": 1.0025,
      "base_dps": 47.1175,
      "selected_effort": 25649.3730748
    }
  },
  "staff": {
    "attack": 6,
    "frequency": 1.5759999999999996,
    "str": 0,
    "int": 71,
    "dex": 0,
    "upgrade": {
      "attack": 0.676368
    },
    "progression": {
      "historical_rank": 1,
      "shared_rank": 1,
      "role": "progression",
      "requirement": 1,
      "reference_level": 1,
      "target_dps": 10.4366986063,
      "full_sheet_hit_damage": 27,
      "attacks_per_second": 0.38665,
      "base_dps": 10.43955,
      "selected_effort": 0
    }
  },
  "staffofthedead": {
    "attack": 11,
    "frequency": 45.101535218253986,
    "str": 0,
    "int": 53,
    "dex": 0,
    "upgrade": {
      "attack": 2.23644604037
    },
    "progression": {
      "historical_rank": 9,
      "shared_rank": 6,
      "role": "sidegrade",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 80,
      "attacks_per_second": 0.8584,
      "base_dps": 68.672,
      "selected_effort": 13648.4955503
    }
  },
  "stinger": {
    "attack": 87,
    "frequency": 15.4525,
    "str": 0,
    "int": 0,
    "dex": 25,
    "upgrade": {
      "attack": 11.7476851852
    },
    "progression": {
      "historical_rank": 3,
      "shared_rank": 3,
      "role": "progression",
      "requirement": 20,
      "reference_level": 15,
      "target_dps": 22.1745450922,
      "full_sheet_hit_damage": 30,
      "attacks_per_second": 0.7390625,
      "base_dps": 22.171875,
      "selected_effort": 972.08266329
    }
  },
  "swifty": {
    "attack": 17,
    "frequency": 20.114,
    "str": 3,
    "int": 0,
    "dex": 35,
    "upgrade": {
      "attack": 2.86686390533
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 5,
      "role": "progression",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 57,
      "attacks_per_second": 0.8265625,
      "base_dps": 47.1140625,
      "selected_effort": 8355.31708972
    }
  },
  "sword": {
    "attack": 20,
    "frequency": 39.13975,
    "str": 1,
    "int": 0,
    "dex": 13,
    "upgrade": {
      "attack": 2.68734243697
    },
    "progression": {
      "historical_rank": 9,
      "shared_rank": 7,
      "role": "progression",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 100,
      "attacks_per_second": 1.0009375,
      "base_dps": 100.09375,
      "selected_effort": 54772.507506
    }
  },
  "swordofthedead": {
    "attack": 20,
    "frequency": 39.13975,
    "str": 1,
    "int": 0,
    "dex": 13,
    "upgrade": {
      "attack": 2.73520992366
    },
    "progression": {
      "historical_rank": 10,
      "shared_rank": 7,
      "role": "sidegrade",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 100,
      "attacks_per_second": 1.0009375,
      "base_dps": 100.09375,
      "selected_effort": 67621.0030563
    }
  },
  "t2bow": {
    "attack": 87,
    "frequency": 31.158,
    "str": 0,
    "int": 0,
    "dex": 59,
    "upgrade": {
      "attack": 41.1193515506
    },
    "progression": {
      "historical_rank": 2,
      "shared_rank": 2,
      "role": "progression",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 17,
      "attacks_per_second": 0.894375,
      "base_dps": 15.204375,
      "selected_effort": 152.381974249
    }
  },
  "t3bow": {
    "attack": 83,
    "frequency": 75.09658108108108,
    "str": 1,
    "int": 0,
    "dex": 103,
    "upgrade": {
      "attack": 22.11823425
    },
    "progression": {
      "historical_rank": 12,
      "shared_rank": 9,
      "role": "progression",
      "requirement": 80,
      "reference_level": 56,
      "target_dps": 212.681370629,
      "full_sheet_hit_damage": 137,
      "attacks_per_second": 1.55243243243,
      "base_dps": 212.683243243,
      "selected_effort": 1369312.68762
    }
  },
  "throwingstars": {
    "attack": 299,
    "frequency": 0.8,
    "str": 0,
    "int": 0,
    "dex": 19,
    "upgrade": {
      "attack": 8.78722570533
    },
    "progression": {
      "historical_rank": 6,
      "shared_rank": 6,
      "role": "progression",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 80,
      "attacks_per_second": 0.8584375,
      "base_dps": 68.675,
      "selected_effort": 54495.0725733
    }
  },
  "vdagger": {
    "attack": 102,
    "frequency": 77.58332432432432,
    "str": 2,
    "int": 0,
    "dex": 22,
    "upgrade": {
      "attack": 37.2263213115
    },
    "progression": {
      "historical_rank": 10,
      "shared_rank": 10,
      "role": "progression",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 199,
      "attacks_per_second": 1.55783783784,
      "base_dps": 310.00972973,
      "selected_effort": 5075823.91936
    }
  },
  "vhammer": {
    "attack": 21,
    "frequency": 59.574,
    "str": 7,
    "int": 0,
    "dex": 171,
    "upgrade": {
      "attack": 1.19437098255
    },
    "progression": {
      "historical_rank": 10,
      "shared_rank": 10,
      "role": "progression",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 235,
      "attacks_per_second": 1.31918918919,
      "base_dps": 310.009459459,
      "selected_effort": 4859508.60562
    }
  },
  "vstaff": {
    "attack": 24,
    "frequency": 66.86653465346537,
    "str": 0,
    "int": 30,
    "dex": 0,
    "upgrade": {
      "attack": 7.16579595506
    },
    "progression": {
      "historical_rank": 13,
      "shared_rank": 9,
      "role": "progression",
      "requirement": 80,
      "reference_level": 56,
      "target_dps": 212.681370629,
      "full_sheet_hit_damage": 193,
      "attacks_per_second": 1.10211,
      "base_dps": 212.70723,
      "selected_effort": 6659755.80498
    }
  },
  "vsword": {
    "attack": 35,
    "frequency": 56.42325,
    "str": 9,
    "int": 0,
    "dex": 82,
    "upgrade": {
      "attack": 3.22456521739
    },
    "progression": {
      "historical_rank": 15,
      "shared_rank": 11,
      "role": "progression",
      "requirement": 99,
      "reference_level": 70,
      "target_dps": 451.877822784,
      "full_sheet_hit_damage": 341,
      "attacks_per_second": 1.32513513514,
      "base_dps": 451.871081081,
      "selected_effort": 8955060372.72
    }
  },
  "wand": {
    "attack": 3,
    "frequency": 1.2480000000000047,
    "str": 0,
    "int": 69,
    "dex": 0,
    "upgrade": {
      "attack": 0.50093877551
    },
    "progression": {
      "historical_rank": 2,
      "shared_rank": 2,
      "role": "progression",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 15,
      "attacks_per_second": 1.00944,
      "base_dps": 15.1416,
      "selected_effort": 405
    }
  },
  "wbasher": {
    "attack": 12,
    "frequency": 13.308,
    "str": 1,
    "int": 1,
    "dex": 76,
    "upgrade": {
      "attack": 1.49179487179
    },
    "progression": {
      "historical_rank": 2,
      "shared_rank": 2,
      "role": "progression",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 26,
      "attacks_per_second": 0.585,
      "base_dps": 15.21,
      "selected_effort": 40.8333333333
    }
  },
  "wblade": {
    "attack": 32,
    "frequency": 68.27382673267327,
    "str": 0,
    "int": 21,
    "dex": 0,
    "upgrade": {
      "attack": 7.5957979798
    },
    "progression": {
      "historical_rank": 14,
      "shared_rank": 10,
      "role": "progression",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 277,
      "attacks_per_second": 1.119095,
      "base_dps": 309.989315,
      "selected_effort": 765950302.1
    }
  },
  "wbook0": {
    "attack": 16,
    "frequency": 1.9549303828940823,
    "str": 0,
    "int": 1,
    "dex": 0,
    "compound": {
      "attack": 0.645161290323
    },
    "progression": {
      "historical_rank": 1,
      "shared_rank": 1,
      "role": "progression",
      "requirement": 1,
      "reference_level": 1,
      "target_dps": 10.4366986063,
      "full_sheet_hit_damage": 28,
      "attacks_per_second": 0.37407,
      "base_dps": 10.47396,
      "selected_effort": 0
    }
  },
  "wbook1": {
    "attack": 6,
    "frequency": 29.84511320754717,
    "str": 0,
    "int": 108,
    "dex": 0,
    "compound": {
      "attack": 0.132352941176
    },
    "progression": {
      "historical_rank": 2,
      "shared_rank": 6,
      "role": "progression",
      "requirement": 50,
      "reference_level": 36,
      "target_dps": 68.6739589893,
      "full_sheet_hit_damage": 96,
      "attacks_per_second": 0.715325,
      "base_dps": 68.6712,
      "selected_effort": 54896.7249634
    }
  },
  "wbook2": {
    "attack": 8,
    "int": 30,
    "compound": {
      "attack": 0.322580645161
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 2,
      "role": "progression",
      "requirement": 10,
      "reference_level": 8,
      "target_dps": 15.2127921125,
      "full_sheet_hit_damage": 42,
      "attacks_per_second": 0.36155,
      "base_dps": 15.1851,
      "selected_effort": 10000
    }
  },
  "wbook3": {
    "attack": 18,
    "int": 0,
    "compound": {
      "attack": 0.725806451613
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 3,
      "role": "progression",
      "requirement": 20,
      "reference_level": 15,
      "target_dps": 22.1745450922,
      "full_sheet_hit_damage": 62,
      "attacks_per_second": 0.357525,
      "base_dps": 22.16655,
      "selected_effort": 20000
    }
  },
  "wbook4": {
    "attack": 11,
    "int": 52,
    "compound": {
      "attack": 0.443548387097
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 4,
      "role": "progression",
      "requirement": 30,
      "reference_level": 22,
      "target_dps": 32.3221698165,
      "full_sheet_hit_damage": 88,
      "attacks_per_second": 0.3675,
      "base_dps": 32.34,
      "selected_effort": 40000
    }
  },
  "wbook5": {
    "attack": 9,
    "int": 110,
    "compound": {
      "attack": 0.362903225806
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 5,
      "role": "progression",
      "requirement": 40,
      "reference_level": 29,
      "target_dps": 47.1136006311,
      "full_sheet_hit_damage": 124,
      "attacks_per_second": 0.3801,
      "base_dps": 47.1324,
      "selected_effort": 50000
    }
  },
  "wbook6": {
    "attack": 33,
    "int": 2,
    "compound": {
      "attack": 1.33064516129
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 7,
      "role": "progression",
      "requirement": 60,
      "reference_level": 42,
      "target_dps": 100.100874909,
      "full_sheet_hit_damage": 272,
      "attacks_per_second": 0.368025,
      "base_dps": 100.1028,
      "selected_effort": 125000
    }
  },
  "wbook7": {
    "attack": 29,
    "int": 51,
    "compound": {
      "attack": 1.16935483871
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 8,
      "role": "progression",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 385,
      "attacks_per_second": 0.37905,
      "base_dps": 145.93425,
      "selected_effort": 275000
    }
  },
  "wbook8": {
    "attack": 28,
    "int": 106,
    "compound": {
      "attack": 1.12903225806
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 9,
      "role": "progression",
      "requirement": 80,
      "reference_level": 56,
      "target_dps": 212.681370629,
      "full_sheet_hit_damage": 542,
      "attacks_per_second": 0.39235,
      "base_dps": 212.6537,
      "selected_effort": 600000
    }
  },
  "wbook9": {
    "attack": 46,
    "int": 60,
    "compound": {
      "attack": 1.85483870968
    },
    "str": 0,
    "dex": 0,
    "progression": {
      "historical_rank": null,
      "shared_rank": 10,
      "role": "progression",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 799,
      "attacks_per_second": 0.387975,
      "base_dps": 309.992025,
      "selected_effort": 1300000
    }
  },
  "wbookhs": {
    "attack": 10,
    "frequency": 168.3,
    "str": 0,
    "int": 64,
    "dex": 0,
    "compound": {
      "attack": 1.5
    },
    "progression": {
      "historical_rank": 3,
      "shared_rank": 11,
      "role": "progression",
      "requirement": 99,
      "reference_level": 70,
      "target_dps": 451.877822784,
      "full_sheet_hit_damage": 198,
      "attacks_per_second": 2.28172,
      "base_dps": 451.78056,
      "selected_effort": 2783467.40761
    }
  },
  "weaver": {
    "attack": 137,
    "frequency": 23.46375,
    "str": 3,
    "int": 0,
    "dex": 201,
    "upgrade": {
      "attack": 6.2562321753
    },
    "progression": {
      "historical_rank": 13,
      "shared_rank": 10,
      "role": "progression",
      "requirement": 90,
      "reference_level": 63,
      "target_dps": 310.00966873,
      "full_sheet_hit_damage": 267,
      "attacks_per_second": 1.16108108108,
      "base_dps": 310.008648649,
      "selected_effort": 1566256.20152
    }
  },
  "woodensword": {
    "attack": 23,
    "frequency": 27.9645,
    "str": 4,
    "int": 0,
    "dex": 146,
    "upgrade": {
      "attack": 3.14340094062
    },
    "progression": {
      "historical_rank": 11,
      "shared_rank": 8,
      "role": "progression",
      "requirement": 70,
      "reference_level": 49,
      "target_dps": 145.909531137,
      "full_sheet_hit_damage": 135,
      "attacks_per_second": 1.08081081081,
      "base_dps": 145.909459459,
      "selected_effort": 646580.656062
    }
  },
  "xmace": {
    "attack": 24,
    "frequency": 34.932,
    "str": 5,
    "int": 0,
    "dex": 65,
    "upgrade": {
      "attack": 1.11547474747
    },
    "progression": {
      "historical_rank": 9,
      "shared_rank": 9,
      "role": "progression",
      "requirement": 80,
      "reference_level": 56,
      "target_dps": 212.681370629,
      "full_sheet_hit_damage": 228,
      "attacks_per_second": 0.9328125,
      "base_dps": 212.68125,
      "selected_effort": 782331.387756
    }
  },
  "axe3": {
    "attack": 396.6666666666667,
    "frequency": 55.197,
    "str": 18,
    "int": 18,
    "dex": 18,
    "upgrade": {
      "range": 1,
      "attack": 85.75555555555556,
      "frequency": 0,
      "str": 0,
      "int": 0,
      "dex": 0
    }
  },
  "bow4": {
    "attack": 514.294,
    "frequency": 80.34794594594595,
    "str": 20,
    "int": 20,
    "dex": 20,
    "upgrade": {
      "range": 9.666666666666668,
      "attack": 79.237554,
      "frequency": 0,
      "str": 0,
      "int": 0,
      "dex": 0
    }
  },
  "staff2": {
    "attack": 228.57142857142858,
    "frequency": 28.83704071499502,
    "str": 10,
    "int": 14,
    "dex": 11,
    "upgrade": {
      "range": 3.5,
      "attack": 29.07857142857143,
      "frequency": 0,
      "str": 0,
      "int": 0,
      "dex": 0
    }
  },
  "staff3": {
    "attack": 483.0361111111111,
    "frequency": 64.1500743310208,
    "str": 18,
    "int": 18,
    "dex": 18,
    "upgrade": {
      "range": 4,
      "attack": 59.477238888888884,
      "frequency": 0,
      "str": 0,
      "int": 0,
      "dex": 0
    }
  },
  "staff4": {
    "attack": 1059.219,
    "frequency": 68.27382673267327,
    "str": 20,
    "int": 20,
    "dex": 20,
    "upgrade": {
      "range": 4.5,
      "attack": 118.9544475,
      "frequency": 0,
      "str": 0,
      "int": 0,
      "dex": 0
    }
  }
};
var weapon_progression_base_fields=["attack","frequency","str","int","dex"];
for(var progression_weapon_id in weapon_progression){
	var progression_weapon=items[progression_weapon_id];
	if(!progression_weapon || (progression_weapon.type!="weapon" && progression_weapon.type!="source"))
		throw new Error("Missing shared-rank weapon publication: "+progression_weapon_id);
	var progression_values=weapon_progression[progression_weapon_id];
	for(var progression_field_index=0;progression_field_index<weapon_progression_base_fields.length;progression_field_index++){
		var progression_field=weapon_progression_base_fields[progression_field_index];
		if(Object.prototype.hasOwnProperty.call(progression_values,progression_field))
			progression_weapon[progression_field]=progression_values[progression_field];
		else delete progression_weapon[progression_field];
	}
	if(progression_values.progression) progression_weapon.progression=progression_values.progression;
	else delete progression_weapon.progression;
	var progression_enhancement_kind=progression_values.compound ? "compound" : "upgrade";
	if(!progression_weapon[progression_enhancement_kind]) progression_weapon[progression_enhancement_kind]={};
	progression_weapon[progression_enhancement_kind].attack=progression_values[progression_enhancement_kind].attack;
}

// Acquisition-ranked base offhand publication. Nested enhancement
// objects and raw range fields remain authored on the item definitions above.
var base_offhand_progression={
	"wshield": {"armor":40,"resistance":15,"stat":2},
	"shield": {"armor":60,"resistance":20},
	"sshield": {"armor":60,"resistance":20,"dreturn":3},
	"mshield": {"armor":20,"stat":5},
	"xshield": {"str":8,"dex":6,"int":4,"resistance":24,"crit":1,"speed":5,"evasion":4},
	"quiver": {"dex":2,"armor":10},
	"t2quiver": {"dex":9,"armor":12,"evasion":1},
	"alloyquiver": {"dex":2,"armor":15,"resistance":12,"explosion":2},
	"lantern": {"resistance":120,"evasion":10},
	"exoarm": {"str":24,"int":20,"armor":80},
	"tigershield": {"armor":48,"resistance":17,"speed":2}
};
var base_offhand_owned_fields=["str","dex","int","vit","hp","mp","armor","resistance","stat","crit","frequency","speed","apiercing","rpiercing","lifesteal","manasteal","evasion","reflection","dreturn","mp_reduction","pnresistance","firesistance","fzresistance","phresistance","stresistance","explosion"];
for(var base_offhand_id in base_offhand_progression){
	var base_offhand_item=items[base_offhand_id];
	if(!base_offhand_item) throw new Error("Missing reviewed base offhand publication: "+base_offhand_id);
	for(var base_offhand_field_index=0;base_offhand_field_index<base_offhand_owned_fields.length;base_offhand_field_index++)
		delete base_offhand_item[base_offhand_owned_fields[base_offhand_field_index]];
	Object.assign(base_offhand_item,base_offhand_progression[base_offhand_id]);
}
var equipment_placeholder_items={
	"tigerarmor":{source:"tigerhelmet",type:"chest",name:"Armor of the Tiger",set:"tiger",weight:"heavy"},
	"tigerpants":{source:"tigerhelmet",type:"pants",name:"Pants of the Tiger",set:"tiger",weight:"heavy"},
	"tigergloves":{source:"tigerhelmet",type:"gloves",name:"Gloves of the Tiger",set:"tiger",weight:"heavy"},
	"tigerboots":{source:"tigerhelmet",type:"shoes",name:"Boots of the Tiger",set:"tiger",weight:"heavy"},
	"vhelmet":{source:"vgloves",type:"helmet",name:"Vampiric Hood",set:"vampires",weight:"medium"},
	"vpants":{source:"vattire",type:"pants",name:"Vampiric Pants",set:"vampires",weight:"medium"},
	"mpxhelmet":{source:"mpxgloves",type:"helmet",name:"Mana Hood",set:"mpx",weight:"light"},
	"mpxarmor":{source:"mpxgloves",type:"chest",name:"Mana Robe",set:"mpx",weight:"light"},
	"mpxpants":{source:"mpxgloves",type:"pants",name:"Mana Pants",set:"mpx",weight:"light"},
	"mpxboots":{source:"mpxgloves",type:"shoes",name:"Mana Boots",set:"mpx",weight:"light"},
	"furyarmor":{source:"fury",type:"chest",name:"Armor of Fury",set:"fury",weight:"heavy"},
	"furygloves":{source:"fury",type:"gloves",name:"Gloves of Fury",set:"fury",weight:"heavy"},
	"furyboots":{source:"fury",type:"shoes",name:"Boots of Fury",set:"fury",weight:"heavy"},
	"legendhelmet":{source:"warpvest",type:"helmet",name:"Legendary Visor",set:"legends",weight:"heavy"},
	"legendboots":{source:"warpvest",type:"shoes",name:"Legendary Boots",set:"legends",weight:"heavy"},
	"swifthelmet":{source:"wingedboots",type:"helmet",name:"Helm of Swift Judgement",set:"swift",weight:"medium"},
	"swiftarmor":{source:"wingedboots",type:"chest",name:"Armor of Swift Judgement",set:"swift",weight:"medium"},
	"swiftpants":{source:"wingedboots",type:"pants",name:"Pants of Swift Judgement",set:"swift",weight:"medium"},
	"epants":{source:"epyjamas",type:"pants",name:"Fluffy Pants",set:"bunny",weight:"light"},
	"egloves":{source:"epyjamas",type:"gloves",name:"Fluffy Gloves",set:"bunny",weight:"light"},
	"mpalhelmet":{source:"mwhelmet",type:"helmet",name:"Helmet of the Hunter Paladin",set:"mpaladin",weight:"heavy"},
	"mpalarmor":{source:"mwarmor",type:"chest",name:"Armor of the Hunter Paladin",set:"mpaladin",weight:"heavy"},
	"mpalpants":{source:"mwpants",type:"pants",name:"Underarmor of the Hunter Paladin",set:"mpaladin",weight:"heavy"},
	"mpalgloves":{source:"mwgloves",type:"gloves",name:"Gloves of the Hunter Paladin",set:"mpaladin",weight:"heavy"},
	"mpalboots":{source:"mwboots",type:"shoes",name:"Boots of the Hunter Paladin",set:"mpaladin",weight:"heavy"}
};
for(var equipment_placeholder_id in equipment_placeholder_items){
	var equipment_placeholder=equipment_placeholder_items[equipment_placeholder_id];
	if(!items[equipment_placeholder.source]) throw new Error("Missing placeholder source: "+equipment_placeholder.source);
	var equipment_placeholder_item=JSON.parse(JSON.stringify(items[equipment_placeholder.source]));
	equipment_placeholder_item.type=equipment_placeholder.type;
	equipment_placeholder_item.name=equipment_placeholder.name;
	equipment_placeholder_item.set=equipment_placeholder.set;
	equipment_placeholder_item.armor_weight=equipment_placeholder.weight;
	equipment_placeholder_item.placeholder_art=true;
	equipment_placeholder_item.placeholder_asset=equipment_placeholder.source;
	equipment_placeholder_item.explanation="Placeholder artwork: uses the existing "+equipment_placeholder.source+" asset.";
	items[equipment_placeholder_id]=equipment_placeholder_item;
}

var equipment_set_slots={
	"tiger":{helmet:["tigerhelmet"],chest:["tigerarmor"],pants:["tigerpants"],gloves:["tigergloves"],shoes:["tigerboots"]},
	"vampires":{helmet:["vhelmet"],chest:["mcape","vattire"],pants:["vpants"],gloves:["vgloves"],shoes:["vboots"]},
	"mpx":{helmet:["mpxhelmet"],chest:["mpxarmor"],pants:["mpxpants"],gloves:["mpxgloves"],shoes:["mpxboots"]},
	"fury":{helmet:["fury"],chest:["furyarmor"],pants:["fallen"],gloves:["furygloves"],shoes:["furyboots"]},
	"legends":{helmet:["legendhelmet"],chest:["warpvest"],pants:["starkillers"],gloves:["powerglove","goldenpowerglove"],shoes:["legendboots"]},
	"swift":{helmet:["swifthelmet"],chest:["swiftarmor"],pants:["swiftpants"],gloves:["fierygloves"],shoes:["wingedboots"]},
	"holidays":{helmet:["xmashat"],chest:["xmassweater","sweaterhs"],pants:["xmaspants"],gloves:["mittens","supermittens"],shoes:["xmasshoes"]},
	"wanderers":{helmet:["wcap"],chest:["wattire"],pants:["wbreeches"],gloves:["wgloves"],shoes:["wshoes"]},
	"wt3":{helmet:["hhelmet"],chest:["harmor"],pants:["hpants"],gloves:["hgloves"],shoes:["hboots"]},
	"wt4":{helmet:["xhelmet"],chest:["xarmor"],pants:["xpants"],gloves:["xgloves"],shoes:["xboots"]},
	"rugged":{helmet:["helmet1"],chest:["coat1"],pants:["pants1"],gloves:["gloves1"],shoes:["shoes1"]},
	"mwarrior":{helmet:["mwhelmet"],chest:["mwarmor"],pants:["mwpants"],gloves:["mwgloves"],shoes:["mwboots"]},
	"mmage":{helmet:["mmhat"],chest:["mmarmor"],pants:["mmpants"],gloves:["mmgloves"],shoes:["mmshoes"]},
	"mpriest":{helmet:["mphat"],chest:["mparmor"],pants:["mppants"],gloves:["mpgloves"],shoes:["mpshoes"]},
	"mranger":{helmet:["mrnhat"],chest:["mrnarmor"],pants:["mrnpants"],gloves:["mrngloves"],shoes:["mrnboots"]},
	"mrogue":{helmet:["mrhood"],chest:["mrarmor"],pants:["mrpants"],gloves:["mrgloves"],shoes:["mrboots"]},
	"mmerchant":{helmet:["mchat"],chest:["mcarmor"],pants:["mcpants"],gloves:["mcgloves"],shoes:["mcboots"]},
	"bunny":{helmet:["eears"],chest:["epyjamas"],pants:["epants"],gloves:["egloves"],shoes:["eslippers"]},
	"mpaladin":{helmet:["mpalhelmet"],chest:["mpalarmor"],pants:["mpalpants"],gloves:["mpalgloves"],shoes:["mpalboots"]}
};
var equipment_set_weights={tiger:"heavy",vampires:"medium",mpx:"light",fury:"heavy",legends:"heavy",swift:"medium",holidays:"medium",wanderers:"medium",wt3:"heavy",wt4:"heavy",rugged:"medium",mwarrior:"heavy",mmage:"light",mpriest:"light",mranger:"medium",mrogue:"medium",mmerchant:"medium",bunny:"light",mpaladin:"heavy"};
var equipment_armor_weight_ids={
	heavy:["fallen","fury","gphelmet","harmor","hboots","hgloves","hhelmet","hpants","mwarmor","mwboots","mwgloves","mwhelmet","mwpants","oxhelmet","phelmet","spikedhelmet","tigerhelmet","xarmor","xboots","xgloves","xhelmet","xpants","tigercape","tigerarmor","tigerpants","tigergloves","tigerboots","furyarmor","furygloves","furyboots","warpvest","starkillers","powerglove","goldenpowerglove","legendhelmet","legendboots","mpalhelmet","mpalarmor","mpalpants","mpalgloves","mpalboots"],
	medium:["bcape","cape","coat","coat1","fcape","gloves","gloves1","helmet","helmet1","horsecape","horsecapeg","mchat","mcape","mcarmor","mcboots","mcgloves","mcpants","mrarmor","mrboots","mrgloves","mrhood","mrnarmor","mrnboots","mrngloves","mrnhat","mrnpants","mrpants","pants","pants1","shoes","shoes1","stealthcape","swiftarmor","swifthelmet","swiftpants","vattire","vboots","vcape","vgloves","vhelmet","vpants","wattire","wcap","wbreeches","wgloves","wingedboots","wshoes","xmasshoes","xmashat","xmassweater","xmaspants","sweaterhs","mittens","supermittens","fierygloves"],
	light:["angelwings","bunnyears","cdragon","cyber","eears","ecape","egloves","epants","epyjamas","eslippers","frankypants","gcape","ghatb","ghatp","handofmidas","iceskates","luckyt","mageshood","mmarmor","mmhat","mmgloves","mmshoes","mmpants","mparmor","mphat","mpgloves","mpxarmor","mpxboots","mpxgloves","mpxhelmet","mpxpants","mpshoes","mppants","partyhat","poker","pyjamas","rednose","snowboots","tshirt0","tshirt1","tshirt2","tshirt3","tshirt4","tshirt6","tshirt7","tshirt8","tshirt88","tshirt9"]
};
for(var equipment_weight in equipment_armor_weight_ids) equipment_armor_weight_ids[equipment_weight].forEach(function(equipment_item_id){
	if(!items[equipment_item_id]) throw new Error("Missing weighted armor item: "+equipment_item_id);
	items[equipment_item_id].armor_weight=equipment_weight;
});
for(var equipment_set_id in equipment_set_slots){
	var equipment_set=sets[equipment_set_id];
	if(!equipment_set){
		equipment_set={name:"Monster Hunter Paladin",items:[]};
		sets[equipment_set_id]=equipment_set;
	}
	var equipment_thresholds={};
	[2,3,4,5].forEach(function(equipment_threshold){equipment_thresholds[equipment_threshold]=JSON.parse(JSON.stringify(equipment_set[equipment_threshold]||{}));});
	Object.keys(equipment_set).forEach(function(equipment_key){if(/^\d+$/.test(equipment_key)) delete equipment_set[equipment_key];});
	[2,3,4,5].forEach(function(equipment_threshold){equipment_set[equipment_threshold]=equipment_thresholds[equipment_threshold];});
	equipment_set.weight=equipment_set_weights[equipment_set_id];
	equipment_set.bonus_items=JSON.parse(JSON.stringify(equipment_set_slots[equipment_set_id]));
	equipment_set.items=Array.from(new Set((equipment_set.items||[]).concat(Object.values(equipment_set.bonus_items).flat())));
}

// Apply reviewed base rows after legacy generation so obsolete base power cannot leak through.
var base_nonweapon_progression={
	"angelwings": {
		"str": 1,
		"dex": 1,
		"int": 4,
		"vit": 1,
		"hp": 100,
		"mp": 75,
		"armor": 5,
		"resistance": 8
	},
	"bcape": {
		"str": 1,
		"dex": 6,
		"int": 1,
		"vit": 1,
		"hp": 93,
		"mp": 36,
		"armor": 14,
		"resistance": 11
	},
	"cape": {
		"dex": 3,
		"vit": 1,
		"hp": 84,
		"mp": 40,
		"armor": 4,
		"resistance": 4
	},
	"cdragon": {},
	"coat": {
		"str": 5,
		"dex": 25,
		"int": 5,
		"vit": 11,
		"hp": 835,
		"mp": 157,
		"armor": 40,
		"resistance": 44
	},
	"coat1": {
		"str": 1,
		"dex": 7,
		"int": 1,
		"vit": 1,
		"hp": 102,
		"mp": 41,
		"armor": 24,
		"resistance": 19
	},
	"cyber": {
		"str": 6,
		"dex": 4,
		"int": 22,
		"vit": 6,
		"hp": 604,
		"mp": 384,
		"armor": 24,
		"resistance": 24
	},
	"ecape": {},
	"eears": {
		"dex": 7,
		"vit": 1,
		"hp": 100,
		"mp": 98,
		"armor": 15,
		"resistance": 15
	},
	"egloves": {
		"dex": 5,
		"vit": 1,
		"hp": 67,
		"mp": 66,
		"armor": 10,
		"resistance": 10
	},
	"epants": {
		"dex": 11,
		"vit": 2,
		"hp": 166,
		"mp": 164,
		"armor": 24,
		"resistance": 24
	},
	"epyjamas": {
		"dex": 14,
		"vit": 3,
		"hp": 200,
		"mp": 197,
		"armor": 29,
		"resistance": 29
	},
	"eslippers": {
		"dex": 5,
		"vit": 1,
		"hp": 66,
		"mp": 65,
		"armor": 10,
		"resistance": 10
	},
	"fallen": {
		"str": 25,
		"dex": 2,
		"int": 5,
		"vit": 6,
		"hp": 892,
		"mp": 210,
		"armor": 44,
		"resistance": 34
	},
	"fcape": {},
	"fierygloves": {
		"str": 1,
		"dex": 3,
		"int": 1,
		"vit": 1,
		"hp": 58,
		"mp": 22,
		"armor": 8,
		"resistance": 7
	},
	"frankypants": {},
	"fury": {
		"str": 15,
		"dex": 2,
		"int": 3,
		"vit": 4,
		"hp": 536,
		"mp": 126,
		"armor": 27,
		"resistance": 20
	},
	"furyarmor": {
		"str": 30,
		"dex": 3,
		"int": 5,
		"vit": 8,
		"hp": 1071,
		"mp": 253,
		"armor": 53,
		"resistance": 41
	},
	"furyboots": {
		"str": 10,
		"dex": 1,
		"int": 2,
		"vit": 3,
		"hp": 357,
		"mp": 84,
		"armor": 18,
		"resistance": 14
	},
	"furygloves": {
		"str": 10,
		"dex": 1,
		"int": 2,
		"vit": 3,
		"hp": 357,
		"mp": 84,
		"armor": 18,
		"resistance": 13
	},
	"gcape": {},
	"gloves": {
		"str": 1,
		"dex": 6,
		"int": 1,
		"vit": 1,
		"hp": 93,
		"mp": 36,
		"armor": 14,
		"resistance": 11
	},
	"gloves1": {
		"dex": 2,
		"int": 1,
		"vit": 1,
		"hp": 34,
		"mp": 14,
		"armor": 8,
		"resistance": 7
	},
	"goldenpowerglove": {
		"str": 5,
		"dex": 1,
		"int": 1,
		"vit": 1,
		"hp": 147,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"gphelmet": {
		"str": 22,
		"dex": 3,
		"int": 6,
		"vit": 6,
		"hp": 847,
		"mp": 198,
		"armor": 34,
		"resistance": 26
	},
	"handofmidas": {
		"dex": 3,
		"vit": 1,
		"hp": 74,
		"mp": 58,
		"armor": 7,
		"resistance": 7
	},
	"harmor": {
		"str": 7,
		"dex": 1,
		"int": 1,
		"vit": 2,
		"hp": 222,
		"mp": 59,
		"armor": 33,
		"resistance": 19
	},
	"hboots": {
		"str": 3,
		"int": 1,
		"vit": 1,
		"hp": 74,
		"mp": 20,
		"armor": 11,
		"resistance": 7
	},
	"helmet": {
		"dex": 3,
		"vit": 1,
		"hp": 97,
		"mp": 47,
		"armor": 6,
		"resistance": 4
	},
	"helmet1": {
		"str": 1,
		"dex": 3,
		"int": 1,
		"vit": 1,
		"hp": 51,
		"mp": 21,
		"armor": 12,
		"resistance": 10
	},
	"hgloves": {
		"str": 2,
		"hp": 74,
		"mp": 20,
		"armor": 11,
		"resistance": 6
	},
	"hhelmet": {
		"str": 4,
		"int": 1,
		"vit": 1,
		"hp": 111,
		"mp": 29,
		"armor": 16,
		"resistance": 10
	},
	"horsecape": {},
	"horsecapeg": {},
	"hpants": {
		"str": 6,
		"dex": 1,
		"int": 1,
		"vit": 1,
		"hp": 185,
		"mp": 49,
		"armor": 27,
		"resistance": 16
	},
	"iceskates": {},
	"legendboots": {
		"str": 4,
		"int": 1,
		"vit": 1,
		"hp": 147,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"legendhelmet": {
		"str": 7,
		"dex": 1,
		"int": 1,
		"vit": 1,
		"hp": 221,
		"mp": 57,
		"armor": 25,
		"resistance": 15
	},
	"luckyt": {
		"str": 12,
		"dex": 8,
		"int": 44,
		"vit": 13,
		"hp": 1207,
		"mp": 768,
		"armor": 49,
		"resistance": 49
	},
	"mcape": {
		"str": 11,
		"dex": 35,
		"int": 10,
		"vit": 14,
		"hp": 1222,
		"mp": 248,
		"armor": 51,
		"resistance": 17
	},
	"mcarmor": {
		"str": 4,
		"dex": 19,
		"int": 4,
		"vit": 9,
		"hp": 647,
		"mp": 119,
		"armor": 37,
		"resistance": 28
	},
	"mcboots": {
		"str": 1,
		"dex": 7,
		"int": 1,
		"vit": 3,
		"hp": 216,
		"mp": 40,
		"armor": 12,
		"resistance": 9
	},
	"mcgloves": {
		"str": 1,
		"dex": 6,
		"int": 1,
		"vit": 3,
		"hp": 216,
		"mp": 40,
		"armor": 12,
		"resistance": 9
	},
	"mchat": {
		"str": 2,
		"dex": 10,
		"int": 2,
		"vit": 4,
		"hp": 323,
		"mp": 60,
		"armor": 19,
		"resistance": 14
	},
	"mcpants": {
		"str": 4,
		"dex": 16,
		"int": 3,
		"vit": 7,
		"hp": 539,
		"mp": 99,
		"armor": 31,
		"resistance": 23
	},
	"mittens": {
		"dex": 1,
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"mmarmor": {
		"str": 2,
		"dex": 2,
		"int": 11,
		"vit": 3,
		"hp": 217,
		"mp": 214,
		"armor": 32,
		"resistance": 32
	},
	"mmgloves": {
		"str": 1,
		"dex": 1,
		"int": 4,
		"vit": 1,
		"hp": 72,
		"mp": 71,
		"armor": 11,
		"resistance": 11
	},
	"mmhat": {
		"str": 1,
		"dex": 1,
		"int": 6,
		"vit": 2,
		"hp": 109,
		"mp": 107,
		"armor": 16,
		"resistance": 16
	},
	"mmpants": {
		"str": 1,
		"dex": 1,
		"int": 9,
		"vit": 2,
		"hp": 181,
		"mp": 178,
		"armor": 26,
		"resistance": 26
	},
	"mmshoes": {
		"int": 4,
		"vit": 1,
		"hp": 72,
		"mp": 71,
		"armor": 10,
		"resistance": 11
	},
	"mpalarmor": {
		"str": 3,
		"vit": 1,
		"hp": 70,
		"mp": 11,
		"armor": 17,
		"resistance": 9
	},
	"mpalboots": {
		"str": 1,
		"hp": 23,
		"mp": 4,
		"armor": 6,
		"resistance": 3
	},
	"mpalgloves": {
		"str": 1,
		"hp": 23,
		"mp": 4,
		"armor": 5,
		"resistance": 3
	},
	"mpalhelmet": {
		"str": 2,
		"hp": 35,
		"mp": 5,
		"armor": 8,
		"resistance": 4
	},
	"mpalpants": {
		"str": 2,
		"hp": 58,
		"mp": 9,
		"armor": 14,
		"resistance": 8
	},
	"mparmor": {
		"str": 2,
		"dex": 2,
		"int": 11,
		"vit": 3,
		"hp": 217,
		"mp": 214,
		"armor": 32,
		"resistance": 32
	},
	"mpgloves": {
		"str": 1,
		"dex": 1,
		"int": 4,
		"vit": 1,
		"hp": 72,
		"mp": 71,
		"armor": 11,
		"resistance": 11
	},
	"mphat": {
		"str": 1,
		"dex": 1,
		"int": 6,
		"vit": 2,
		"hp": 109,
		"mp": 107,
		"armor": 16,
		"resistance": 16
	},
	"mppants": {
		"str": 1,
		"dex": 1,
		"int": 9,
		"vit": 2,
		"hp": 181,
		"mp": 178,
		"armor": 26,
		"resistance": 26
	},
	"mpshoes": {
		"int": 4,
		"vit": 1,
		"hp": 72,
		"mp": 71,
		"armor": 10,
		"resistance": 11
	},
	"mpxarmor": {
		"str": 2,
		"dex": 2,
		"int": 11,
		"vit": 3,
		"hp": 217,
		"mp": 214,
		"armor": 32,
		"resistance": 32
	},
	"mpxboots": {
		"str": 1,
		"dex": 1,
		"int": 4,
		"vit": 1,
		"hp": 72,
		"mp": 71,
		"armor": 11,
		"resistance": 11
	},
	"mpxgloves": {
		"int": 4,
		"vit": 1,
		"hp": 72,
		"mp": 71,
		"armor": 10,
		"resistance": 11
	},
	"mpxhelmet": {
		"str": 1,
		"dex": 1,
		"int": 6,
		"vit": 2,
		"hp": 109,
		"mp": 107,
		"armor": 16,
		"resistance": 16
	},
	"mpxpants": {
		"str": 1,
		"dex": 1,
		"int": 9,
		"vit": 2,
		"hp": 181,
		"mp": 178,
		"armor": 26,
		"resistance": 26
	},
	"mrarmor": {
		"str": 4,
		"dex": 19,
		"int": 4,
		"vit": 9,
		"hp": 647,
		"mp": 119,
		"armor": 37,
		"resistance": 28
	},
	"mrboots": {
		"str": 1,
		"dex": 7,
		"int": 1,
		"vit": 3,
		"hp": 216,
		"mp": 40,
		"armor": 12,
		"resistance": 9
	},
	"mrgloves": {
		"str": 1,
		"dex": 6,
		"int": 1,
		"vit": 3,
		"hp": 216,
		"mp": 40,
		"armor": 12,
		"resistance": 9
	},
	"mrhood": {
		"str": 2,
		"dex": 10,
		"int": 2,
		"vit": 4,
		"hp": 323,
		"mp": 60,
		"armor": 19,
		"resistance": 14
	},
	"mrnarmor": {
		"str": 4,
		"dex": 19,
		"int": 4,
		"vit": 9,
		"hp": 647,
		"mp": 119,
		"armor": 37,
		"resistance": 28
	},
	"mrnboots": {
		"str": 1,
		"dex": 7,
		"int": 1,
		"vit": 3,
		"hp": 216,
		"mp": 40,
		"armor": 12,
		"resistance": 9
	},
	"mrngloves": {
		"str": 1,
		"dex": 6,
		"int": 1,
		"vit": 3,
		"hp": 216,
		"mp": 40,
		"armor": 12,
		"resistance": 9
	},
	"mrnhat": {
		"str": 2,
		"dex": 10,
		"int": 2,
		"vit": 4,
		"hp": 323,
		"mp": 60,
		"armor": 19,
		"resistance": 14
	},
	"mrnpants": {
		"str": 4,
		"dex": 16,
		"int": 3,
		"vit": 7,
		"hp": 539,
		"mp": 99,
		"armor": 31,
		"resistance": 23
	},
	"mrpants": {
		"str": 4,
		"dex": 16,
		"int": 3,
		"vit": 7,
		"hp": 539,
		"mp": 99,
		"armor": 31,
		"resistance": 23
	},
	"mwarmor": {
		"str": 3,
		"vit": 1,
		"hp": 70,
		"mp": 11,
		"armor": 17,
		"resistance": 9
	},
	"mwboots": {
		"str": 1,
		"hp": 23,
		"mp": 4,
		"armor": 6,
		"resistance": 3
	},
	"mwgloves": {
		"str": 1,
		"hp": 23,
		"mp": 4,
		"armor": 5,
		"resistance": 3
	},
	"mwhelmet": {
		"str": 2,
		"hp": 35,
		"mp": 5,
		"armor": 8,
		"resistance": 4
	},
	"mwpants": {
		"str": 2,
		"hp": 58,
		"mp": 9,
		"armor": 14,
		"resistance": 8
	},
	"oxhelmet": {},
	"pants": {
		"str": 11,
		"dex": 37,
		"int": 11,
		"vit": 14,
		"hp": 1273,
		"mp": 258,
		"armor": 53,
		"resistance": 17
	},
	"pants1": {
		"str": 1,
		"dex": 6,
		"int": 1,
		"vit": 1,
		"hp": 85,
		"mp": 34,
		"armor": 20,
		"resistance": 16
	},
	"partyhat": {},
	"phelmet": {},
	"powerglove": {
		"str": 5,
		"dex": 1,
		"int": 1,
		"vit": 1,
		"hp": 147,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"rednose": {},
	"shoes": {
		"dex": 2,
		"hp": 64,
		"mp": 31,
		"armor": 4,
		"resistance": 3
	},
	"shoes1": {
		"dex": 2,
		"hp": 34,
		"mp": 14,
		"armor": 8,
		"resistance": 6
	},
	"snowboots": {},
	"spikedhelmet": {
		"str": 7,
		"dex": 1,
		"int": 1,
		"vit": 2,
		"hp": 246,
		"mp": 66,
		"armor": 27,
		"resistance": 16
	},
	"starkillers": {
		"str": 11,
		"dex": 1,
		"int": 2,
		"vit": 3,
		"hp": 368,
		"mp": 95,
		"armor": 42,
		"resistance": 25
	},
	"stealthcape": {
		"str": 2,
		"dex": 8,
		"int": 2,
		"vit": 4,
		"hp": 278,
		"mp": 52,
		"armor": 13,
		"resistance": 15
	},
	"supermittens": {
		"dex": 1,
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"sweaterhs": {
		"dex": 1,
		"hp": 55,
		"mp": 31,
		"armor": 4,
		"resistance": 3
	},
	"swiftarmor": {
		"str": 2,
		"dex": 10,
		"int": 2,
		"vit": 2,
		"hp": 173,
		"mp": 65,
		"armor": 25,
		"resistance": 22
	},
	"swifthelmet": {
		"str": 1,
		"dex": 5,
		"int": 1,
		"vit": 1,
		"hp": 86,
		"mp": 32,
		"armor": 12,
		"resistance": 11
	},
	"swiftpants": {
		"str": 1,
		"dex": 8,
		"int": 1,
		"vit": 2,
		"hp": 144,
		"mp": 54,
		"armor": 21,
		"resistance": 18
	},
	"tigerarmor": {
		"str": 30,
		"dex": 3,
		"int": 5,
		"vit": 8,
		"hp": 1071,
		"mp": 253,
		"armor": 53,
		"resistance": 41
	},
	"tigerboots": {
		"str": 10,
		"dex": 1,
		"int": 2,
		"vit": 3,
		"hp": 357,
		"mp": 84,
		"armor": 18,
		"resistance": 14
	},
	"tigercape": {},
	"tigergloves": {
		"str": 10,
		"dex": 1,
		"int": 2,
		"vit": 3,
		"hp": 357,
		"mp": 84,
		"armor": 18,
		"resistance": 13
	},
	"tigerhelmet": {
		"str": 15,
		"dex": 2,
		"int": 3,
		"vit": 4,
		"hp": 536,
		"mp": 126,
		"armor": 27,
		"resistance": 20
	},
	"tigerpants": {
		"str": 25,
		"dex": 2,
		"int": 5,
		"vit": 6,
		"hp": 892,
		"mp": 210,
		"armor": 44,
		"resistance": 34
	},
	"tshirt0": {
		"str": 1,
		"dex": 1,
		"int": 8,
		"vit": 2,
		"hp": 99,
		"mp": 136,
		"armor": 1,
		"resistance": 8
	},
	"tshirt1": {
		"str": 1,
		"dex": 1,
		"int": 8,
		"vit": 2,
		"hp": 99,
		"mp": 136,
		"armor": 1,
		"resistance": 8
	},
	"tshirt2": {
		"str": 1,
		"dex": 1,
		"int": 8,
		"vit": 2,
		"hp": 99,
		"mp": 136,
		"armor": 1,
		"resistance": 8
	},
	"tshirt3": {
		"str": 2,
		"dex": 2,
		"int": 8,
		"vit": 3,
		"hp": 221,
		"mp": 174,
		"armor": 21,
		"resistance": 20
	},
	"tshirt4": {
		"str": 2,
		"dex": 2,
		"int": 11,
		"vit": 4,
		"hp": 300,
		"mp": 226,
		"armor": 16,
		"resistance": 23
	},
	"tshirt6": {
		"str": 2,
		"dex": 2,
		"int": 15,
		"vit": 4,
		"hp": 294,
		"mp": 285,
		"armor": 40,
		"resistance": 41
	},
	"tshirt7": {
		"str": 2,
		"dex": 2,
		"int": 15,
		"vit": 4,
		"hp": 294,
		"mp": 285,
		"armor": 40,
		"resistance": 41
	},
	"tshirt8": {
		"str": 4,
		"dex": 4,
		"int": 25,
		"vit": 7,
		"hp": 581,
		"mp": 461,
		"armor": 32,
		"resistance": 59
	},
	"tshirt88": {
		"str": 6,
		"dex": 6,
		"int": 34,
		"vit": 10,
		"hp": 851,
		"mp": 603,
		"armor": 34,
		"resistance": 67
	},
	"tshirt9": {
		"str": 4,
		"dex": 4,
		"int": 25,
		"vit": 7,
		"hp": 581,
		"mp": 461,
		"armor": 32,
		"resistance": 59
	},
	"vattire": {
		"str": 11,
		"dex": 35,
		"int": 10,
		"vit": 14,
		"hp": 1222,
		"mp": 248,
		"armor": 51,
		"resistance": 17
	},
	"vboots": {
		"str": 4,
		"dex": 12,
		"int": 4,
		"vit": 5,
		"hp": 408,
		"mp": 83,
		"armor": 17,
		"resistance": 6
	},
	"vcape": {
		"str": 4,
		"dex": 15,
		"int": 4,
		"vit": 6,
		"hp": 509,
		"mp": 103,
		"armor": 21,
		"resistance": 7
	},
	"vgloves": {
		"str": 3,
		"dex": 12,
		"int": 3,
		"vit": 4,
		"hp": 407,
		"mp": 82,
		"armor": 17,
		"resistance": 5
	},
	"vhelmet": {
		"str": 5,
		"dex": 18,
		"int": 5,
		"vit": 7,
		"hp": 611,
		"mp": 124,
		"armor": 26,
		"resistance": 8
	},
	"vpants": {
		"str": 9,
		"dex": 29,
		"int": 9,
		"vit": 11,
		"hp": 1019,
		"mp": 206,
		"armor": 43,
		"resistance": 14
	},
	"warpvest": {
		"str": 13,
		"dex": 1,
		"int": 3,
		"vit": 3,
		"hp": 441,
		"mp": 113,
		"armor": 50,
		"resistance": 29
	},
	"wattire": {
		"dex": 1,
		"hp": 55,
		"mp": 31,
		"armor": 4,
		"resistance": 3
	},
	"wbreeches": {
		"dex": 1,
		"hp": 46,
		"mp": 26,
		"armor": 4,
		"resistance": 2
	},
	"wcap": {
		"dex": 1,
		"hp": 27,
		"mp": 15,
		"armor": 2,
		"resistance": 1
	},
	"wgloves": {
		"dex": 1,
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"wingedboots": {
		"dex": 3,
		"int": 1,
		"vit": 1,
		"hp": 58,
		"mp": 22,
		"armor": 8,
		"resistance": 7
	},
	"wshoes": {
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"xarmor": {
		"str": 13,
		"dex": 1,
		"int": 3,
		"vit": 3,
		"hp": 441,
		"mp": 113,
		"armor": 50,
		"resistance": 29
	},
	"xboots": {
		"str": 5,
		"dex": 1,
		"int": 1,
		"vit": 1,
		"hp": 147,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"xgloves": {
		"str": 4,
		"int": 1,
		"vit": 1,
		"hp": 147,
		"mp": 38,
		"armor": 17,
		"resistance": 10
	},
	"xhelmet": {
		"str": 7,
		"dex": 1,
		"int": 1,
		"vit": 1,
		"hp": 221,
		"mp": 57,
		"armor": 25,
		"resistance": 15
	},
	"xmashat": {
		"dex": 1,
		"hp": 27,
		"mp": 15,
		"armor": 2,
		"resistance": 1
	},
	"xmaspants": {
		"dex": 1,
		"hp": 46,
		"mp": 26,
		"armor": 4,
		"resistance": 2
	},
	"xmasshoes": {
		"hp": 18,
		"mp": 10,
		"armor": 1,
		"resistance": 1
	},
	"xmassweater": {
		"dex": 1,
		"hp": 55,
		"mp": 31,
		"armor": 4,
		"resistance": 3
	},
	"xpants": {
		"str": 11,
		"dex": 1,
		"int": 2,
		"vit": 3,
		"hp": 368,
		"mp": 95,
		"armor": 42,
		"resistance": 25
	}
};
var base_nonweapon_base_fields=["str","dex","int","vit","hp","mp","armor","resistance","crit","frequency","speed","range","apiercing","rpiercing","lifesteal","manasteal","evasion","reflection","dreturn","mp_reduction","pnresistance","firesistance","fzresistance","phresistance","stresistance","for","stat","extra_stat"];
for(var base_nonweapon_id in base_nonweapon_progression){
	var base_nonweapon_item=items[base_nonweapon_id];
	if(!base_nonweapon_item) throw new Error("Missing reviewed non-weapon item: "+base_nonweapon_id);
	base_nonweapon_base_fields.forEach(function(base_nonweapon_field){delete base_nonweapon_item[base_nonweapon_field];});
	Object.assign(base_nonweapon_item,base_nonweapon_progression[base_nonweapon_id]);
}
var armor_set_incremental_bonuses={
	"bunny": {
		"2": {
			"dex": 1,
			"hp": 23,
			"mp": 22,
			"armor": 3,
			"resistance": 3,
			"speed": 1
		},
		"3": {
			"dex": 2,
			"hp": 30,
			"mp": 30,
			"armor": 4,
			"resistance": 4
		},
		"4": {
			"dex": 3,
			"vit": 1,
			"hp": 37,
			"mp": 37,
			"armor": 6,
			"resistance": 6
		},
		"5": {
			"dex": 4,
			"vit": 1,
			"hp": 60,
			"mp": 59,
			"armor": 9,
			"resistance": 9,
			"reflection": 1
		}
	},
	"fury": {
		"2": {
			"str": 3,
			"vit": 1,
			"hp": 120,
			"mp": 28,
			"armor": 6,
			"resistance": 5,
			"frequency": 1
		},
		"3": {
			"str": 5,
			"int": 1,
			"vit": 1,
			"hp": 161,
			"mp": 38,
			"armor": 8,
			"resistance": 6
		},
		"4": {
			"str": 6,
			"dex": 1,
			"int": 1,
			"vit": 2,
			"hp": 201,
			"mp": 47,
			"armor": 10,
			"resistance": 8
		},
		"5": {
			"str": 9,
			"dex": 1,
			"int": 2,
			"vit": 2,
			"hp": 321,
			"mp": 76,
			"armor": 16,
			"resistance": 12,
			"apiercing": 1
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
			"dex": 1,
			"hp": 17,
			"mp": 9,
			"armor": 1,
			"resistance": 1,
			"stresistance": 1
		}
	},
	"legends": {
		"2": {
			"str": 2,
			"hp": 50,
			"mp": 13,
			"armor": 6,
			"resistance": 3,
			"dreturn": 1
		},
		"3": {
			"str": 2,
			"hp": 66,
			"mp": 17,
			"armor": 8,
			"resistance": 4
		},
		"4": {
			"str": 2,
			"int": 1,
			"vit": 1,
			"hp": 83,
			"mp": 21,
			"armor": 9,
			"resistance": 6
		},
		"5": {
			"str": 4,
			"dex": 1,
			"int": 1,
			"vit": 1,
			"hp": 132,
			"mp": 34,
			"armor": 15,
			"resistance": 9,
			"reflection": 1
		}
	},
	"mmage": {
		"2": {
			"int": 1,
			"hp": 24,
			"mp": 24,
			"armor": 4,
			"resistance": 4,
			"rpiercing": 1
		},
		"3": {
			"int": 2,
			"hp": 33,
			"mp": 32,
			"armor": 5,
			"resistance": 5
		},
		"4": {
			"int": 2,
			"vit": 1,
			"hp": 41,
			"mp": 40,
			"armor": 6,
			"resistance": 6
		},
		"5": {
			"str": 1,
			"dex": 1,
			"int": 4,
			"vit": 1,
			"hp": 65,
			"mp": 64,
			"armor": 9,
			"resistance": 9,
			"crit": 1
		}
	},
	"mmerchant": {
		"2": {
			"dex": 2,
			"vit": 1,
			"hp": 73,
			"mp": 14,
			"armor": 4,
			"resistance": 3,
			"dreturn": 1
		},
		"3": {
			"str": 1,
			"dex": 3,
			"int": 1,
			"vit": 1,
			"hp": 97,
			"mp": 18,
			"armor": 6,
			"resistance": 4
		},
		"4": {
			"str": 1,
			"dex": 4,
			"int": 1,
			"vit": 2,
			"hp": 121,
			"mp": 22,
			"armor": 7,
			"resistance": 5
		},
		"5": {
			"str": 1,
			"dex": 6,
			"int": 1,
			"vit": 2,
			"hp": 194,
			"mp": 36,
			"armor": 11,
			"resistance": 9,
			"speed": 1
		}
	},
	"mpaladin": {
		"2": {
			"hp": 8,
			"mp": 1,
			"armor": 2,
			"resistance": 1,
			"lifesteal": 1
		},
		"3": {
			"hp": 10,
			"mp": 2,
			"armor": 2,
			"resistance": 1
		},
		"4": {
			"str": 1,
			"hp": 13,
			"mp": 2,
			"armor": 3,
			"resistance": 2
		},
		"5": {
			"str": 1,
			"hp": 21,
			"mp": 3,
			"armor": 5,
			"resistance": 3,
			"stresistance": 1
		}
	},
	"mpriest": {
		"2": {
			"int": 1,
			"hp": 24,
			"mp": 24,
			"armor": 4,
			"resistance": 4,
			"mp_reduction": 1
		},
		"3": {
			"int": 2,
			"hp": 33,
			"mp": 32,
			"armor": 5,
			"resistance": 5
		},
		"4": {
			"int": 2,
			"vit": 1,
			"hp": 41,
			"mp": 40,
			"armor": 6,
			"resistance": 6
		},
		"5": {
			"str": 1,
			"dex": 1,
			"int": 4,
			"vit": 1,
			"hp": 65,
			"mp": 64,
			"armor": 9,
			"resistance": 9,
			"stresistance": 1
		}
	},
	"mpx": {
		"2": {
			"int": 1,
			"hp": 24,
			"mp": 24,
			"armor": 4,
			"resistance": 4,
			"mp_reduction": 1
		},
		"3": {
			"int": 2,
			"hp": 33,
			"mp": 32,
			"armor": 5,
			"resistance": 5
		},
		"4": {
			"int": 2,
			"vit": 1,
			"hp": 41,
			"mp": 40,
			"armor": 6,
			"resistance": 6
		},
		"5": {
			"str": 1,
			"dex": 1,
			"int": 4,
			"vit": 1,
			"hp": 65,
			"mp": 64,
			"armor": 9,
			"resistance": 9,
			"manasteal": 1
		}
	},
	"mranger": {
		"2": {
			"dex": 2,
			"vit": 1,
			"hp": 73,
			"mp": 14,
			"armor": 4,
			"resistance": 3,
			"range": 1
		},
		"3": {
			"str": 1,
			"dex": 3,
			"int": 1,
			"vit": 1,
			"hp": 97,
			"mp": 18,
			"armor": 6,
			"resistance": 4
		},
		"4": {
			"str": 1,
			"dex": 4,
			"int": 1,
			"vit": 2,
			"hp": 121,
			"mp": 22,
			"armor": 7,
			"resistance": 5
		},
		"5": {
			"str": 1,
			"dex": 6,
			"int": 1,
			"vit": 2,
			"hp": 194,
			"mp": 36,
			"armor": 11,
			"resistance": 9,
			"apiercing": 1
		}
	},
	"mrogue": {
		"2": {
			"dex": 2,
			"vit": 1,
			"hp": 73,
			"mp": 14,
			"armor": 4,
			"resistance": 3,
			"evasion": 1
		},
		"3": {
			"str": 1,
			"dex": 3,
			"int": 1,
			"vit": 1,
			"hp": 97,
			"mp": 18,
			"armor": 6,
			"resistance": 4
		},
		"4": {
			"str": 1,
			"dex": 4,
			"int": 1,
			"vit": 2,
			"hp": 121,
			"mp": 22,
			"armor": 7,
			"resistance": 5
		},
		"5": {
			"str": 1,
			"dex": 6,
			"int": 1,
			"vit": 2,
			"hp": 194,
			"mp": 36,
			"armor": 11,
			"resistance": 9,
			"crit": 1
		}
	},
	"mwarrior": {
		"2": {
			"hp": 8,
			"mp": 1,
			"armor": 2,
			"resistance": 1,
			"crit": 1
		},
		"3": {
			"hp": 10,
			"mp": 2,
			"armor": 2,
			"resistance": 1
		},
		"4": {
			"str": 1,
			"hp": 13,
			"mp": 2,
			"armor": 3,
			"resistance": 2
		},
		"5": {
			"str": 1,
			"hp": 21,
			"mp": 3,
			"armor": 5,
			"resistance": 3,
			"apiercing": 1
		}
	},
	"rugged": {
		"2": {
			"dex": 1,
			"hp": 11,
			"mp": 5,
			"armor": 3,
			"resistance": 2,
			"pnresistance": 1
		},
		"3": {
			"dex": 1,
			"hp": 15,
			"mp": 6,
			"armor": 4,
			"resistance": 3
		},
		"4": {
			"dex": 1,
			"hp": 19,
			"mp": 8,
			"armor": 4,
			"resistance": 3
		},
		"5": {
			"str": 1,
			"dex": 2,
			"int": 1,
			"vit": 1,
			"hp": 31,
			"mp": 12,
			"armor": 7,
			"resistance": 6,
			"phresistance": 1
		}
	},
	"swift": {
		"2": {
			"dex": 1,
			"hp": 20,
			"mp": 7,
			"armor": 3,
			"resistance": 2,
			"frequency": 1
		},
		"3": {
			"dex": 1,
			"hp": 26,
			"mp": 10,
			"armor": 4,
			"resistance": 3
		},
		"4": {
			"dex": 2,
			"vit": 1,
			"hp": 32,
			"mp": 12,
			"armor": 4,
			"resistance": 4
		},
		"5": {
			"str": 1,
			"dex": 3,
			"int": 1,
			"vit": 1,
			"hp": 52,
			"mp": 20,
			"armor": 7,
			"resistance": 7,
			"evasion": 1
		}
	},
	"tiger": {
		"2": {
			"str": 3,
			"vit": 1,
			"hp": 120,
			"mp": 28,
			"armor": 6,
			"resistance": 5,
			"speed": 1
		},
		"3": {
			"str": 5,
			"int": 1,
			"vit": 1,
			"hp": 161,
			"mp": 38,
			"armor": 8,
			"resistance": 6
		},
		"4": {
			"str": 6,
			"dex": 1,
			"int": 1,
			"vit": 2,
			"hp": 201,
			"mp": 47,
			"armor": 10,
			"resistance": 8
		},
		"5": {
			"str": 9,
			"dex": 1,
			"int": 2,
			"vit": 2,
			"hp": 321,
			"mp": 76,
			"armor": 16,
			"resistance": 12,
			"evasion": 1
		}
	},
	"vampires": {
		"2": {
			"str": 1,
			"dex": 4,
			"int": 1,
			"vit": 1,
			"hp": 138,
			"mp": 28,
			"armor": 6,
			"resistance": 2,
			"lifesteal": 1
		},
		"3": {
			"str": 2,
			"dex": 5,
			"int": 2,
			"vit": 2,
			"hp": 183,
			"mp": 37,
			"armor": 8,
			"resistance": 3
		},
		"4": {
			"str": 2,
			"dex": 7,
			"int": 2,
			"vit": 3,
			"hp": 229,
			"mp": 47,
			"armor": 9,
			"resistance": 3
		},
		"5": {
			"str": 3,
			"dex": 10,
			"int": 3,
			"vit": 4,
			"hp": 367,
			"mp": 74,
			"armor": 15,
			"resistance": 5,
			"manasteal": 1
		}
	},
	"wanderers": {
		"2": {
			"hp": 6,
			"mp": 3,
			"speed": 1
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
			"dex": 1,
			"hp": 17,
			"mp": 9,
			"armor": 1,
			"resistance": 1,
			"range": 1
		}
	},
	"wt3": {
		"2": {
			"str": 1,
			"hp": 25,
			"mp": 6,
			"armor": 4,
			"resistance": 2,
			"pnresistance": 1
		},
		"3": {
			"str": 1,
			"hp": 33,
			"mp": 9,
			"armor": 5,
			"resistance": 3
		},
		"4": {
			"str": 1,
			"hp": 42,
			"mp": 11,
			"armor": 6,
			"resistance": 3
		},
		"5": {
			"str": 2,
			"int": 1,
			"vit": 1,
			"hp": 67,
			"mp": 18,
			"armor": 10,
			"resistance": 6,
			"stresistance": 1
		}
	},
	"wt4": {
		"2": {
			"str": 2,
			"hp": 50,
			"mp": 13,
			"armor": 6,
			"resistance": 3,
			"reflection": 1
		},
		"3": {
			"str": 2,
			"hp": 66,
			"mp": 17,
			"armor": 8,
			"resistance": 4
		},
		"4": {
			"str": 2,
			"int": 1,
			"vit": 1,
			"hp": 83,
			"mp": 21,
			"armor": 9,
			"resistance": 6
		},
		"5": {
			"str": 4,
			"dex": 1,
			"int": 1,
			"vit": 1,
			"hp": 132,
			"mp": 34,
			"armor": 15,
			"resistance": 9,
			"firesistance": 1
		}
	}
};
for(var armor_set_incremental_id in armor_set_incremental_bonuses){
	var armor_set_incremental_set=sets[armor_set_incremental_id];
	if(!armor_set_incremental_set) throw new Error("Missing reviewed armor set: "+armor_set_incremental_id);
	[2,3,4,5].forEach(function(armor_set_incremental_threshold){
		armor_set_incremental_set[armor_set_incremental_threshold]=armor_set_incremental_bonuses[armor_set_incremental_id][armor_set_incremental_threshold];
	});
}
if(typeof finalize_equipment_requirements=="function") finalize_equipment_requirements(items,sets,item_requirements,equipment_set_requirement_levels,equipment_standalone_unlocks);

if(typeof module!=="undefined") module.exports={items:items,sets:sets};
