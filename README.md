# Adventure Land - The Code MMORPG (MongoDB Edition)

https://adventure.land

A full Node.js + MongoDB port of [Adventure Land](https://github.com/kaansoral/adventureland), originally built on Python 2 / Google App Engine / Datastore. This version replaces all of that with Express, Socket.IO, and MongoDB.

**Please consider supporting Adventure Land on Patreon: https://www.patreon.com/AdventureLand**

## Repositories

This project is split across three repositories:

| Repository | Description |
|---|---|
| [adventureland_mongodb](https://github.com/kaansoral/adventureland_mongodb) | Main game — Express backend, game server, client assets |
| [common_engine](https://github.com/kaansoral/common_engine) | Shared engine — Express init, MongoDB transactions, request handling, admin tools |
| [adventureland_secretsandconfig](https://github.com/kaansoral/adventureland_secretsandconfig) | Config template — keys, options, server definitions (all values randomized/empty) |

## Quick Start

### 1. Clone all three repositories

```sh
# Main game
git clone https://github.com/kaansoral/adventureland_mongodb.git adventureland

# Shared engine (symlinked as adventureland/common)
git clone https://github.com/kaansoral/common_engine.git common

# Config template (symlinked as adventureland/secretsandconfig)
git clone https://github.com/kaansoral/adventureland_secretsandconfig.git secretsandconfig
```

### 2. Create symlinks

```sh
cd adventureland
ln -s ../common common
ln -s ../secretsandconfig secretsandconfig
```

### 3. Install dependencies

```sh
# Main backend
npm install

# Game server
cd node
npm install
cd ..
```

### 4. Set up MongoDB

Install MongoDB locally or use a hosted instance. The default config in `secretsandconfig/keys.js` points to `127.0.0.1:27017` with no auth — this works out of the box with a default local MongoDB install.

If your MongoDB requires authentication or TLS, edit `secretsandconfig/keys.js`:

```js
mongodb_ip: "your-server-ip",
mongodb_port: "27017",
mongodb_user: "your-user",
mongodb_password: "your-password",
mongodb_name: "adventureland",
mongodb_tls: true,                                          // set to true if using TLS
mongodb_ca_file: path.resolve(__dirname, "your-ca.crt"),    // place your CA cert in secretsandconfig/
```

### 5. Configure keys

Open `secretsandconfig/keys.js`. The keys auto-generate random values on each startup, which is fine for local development. For production, set fixed values:

- **`ACCESS_MASTER`** — Admin access key (used for server eval/render, admin tools)
- **`SERVER_MASTER`** — Server-to-server authentication
- **`BOT_MASTER`** — Bot authentication key
- **Stripe keys** — Only needed if you want payments
- **Steam/Discord/Apple keys** — Only needed for those platform integrations
- **Amazon SES** — Only needed for sending emails (verification, password reset)

### 6. Add a hosts entry (optional)

```sh
# Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows)
127.0.0.1       adventure.test
```

Then update `secretsandconfig/options.js`:
```js
base_url: "http://adventure.test",
```

Or just use `http://localhost` — the default config works without any hosts entry.

### 7. Start the backend

```sh
node main.js
```

The backend starts on port **8090** (configurable in `secretsandconfig/options.js`). Visit http://localhost:8090

At startup, the world preflight validates the required map documents, recovery
seed hash, and world indexes. Unrecognized legacy application collections are
reported in the classification diagnostics but do not, by themselves, prevent
the backend from starting.

### 8. Start the game server

```sh
cd node
node server.js local
```

The argument is a key from `servers` in `secretsandconfig/options.js`. The default `local` server runs on port **7192**.

## Character stat model

The character calculator keeps the existing player fields and weapon profiles,
but separates stat ownership by output type:

| Stat | Derived role |
|---|---|
| **STR** | Physical damage for melee and ranged physical weapons. It no longer adds derived HP, armor, or movement speed. |
| **DEX** | Crit chance and physical attack cadence. It does not add physical damage, movement speed, or accuracy. |
| **INT** | Magical damage and healing, `+15` max MP per point, and a capped magical cadence bonus. It no longer adds resistance or universal attack speed. |
| **VIT** | `+48` max HP per point. |
| **FOR** | Existing Fortitude damage reduction, supplied by equipment and effects. |

Physical profiles use the existing DEX frequency curve. Magical profiles apply an
INT cadence bonus capped at 20%; ability cooldown definitions are unchanged.
Total crit combines a diminishing DEX contribution (capped at 80%), raw gear
crit (capped at 20%), and temporary effects, with a hard 100% cap. Critical
damage and healing use the existing multiplier and `data.crit` display marker.
The direct `miss`, `evasion`, and `avoidance` checks remain unchanged; there is
no accuracy stat. Derived values are recomputed during the normal login and
equipment-refresh paths, so existing item instances do not require a database
reset or manual respec.

## Acquisition-ranked equipment

Base combat equipment now follows the reviewed acquisition frontier instead of
legacy item tiers. Twenty named armor themes are published with Heavy, Medium,
or Light weight identity. Thirteen sets carry six-tier armor progression
metadata: Basic (tier 1), Wanderer's (tier 2), Rugged (tier 3), Heavy (tier 4),
Darkforge and seven Monster Hunter sidegrades (tier 5), and Vampires (tier 6).
This metadata is for balance and Guide presentation only; it does not add equip
gates. Tiered themes and Holiday Spirit retain five-slot cumulative armor
bonuses. The six reduced themes preserve their existing completion payload at
their genuine size: Tiger and MP X use one slot, Fury and Swift use two, and
Legends and Bunny use three. Weapons, offhands, capes, accessories, and orbs
may keep a theme for presentation but do not increment an armor-set bonus. The
Monster Hunter Paladin theme is included. The 18 non-tier placeholder armor
definitions retired by this pass are not replaced; seven retained Vampire and
Monster Hunter Paladin armor slots remain marked as placeholder artwork.

Standalone armor, capes, and combat offhands (shields, quivers, sources, and
miscellaneous hand items) are independent sidegrades. Every equippable
nonweapon item—including armor, jewelry, orbs, offhands, capes, and tools—is
ungated and carries an explicit empty requirement list. Weapons retain their
class and level requirements; legal one-hand, dual-wield, two-hand, and offhand
layouts are checked together so an easier weapon option cannot strictly
dominate a harder one. Rebalanced armor and set properties contribute no
offensive `STR`, `DEX`, or `INT` at base or supported enhancement states; the
removed vanilla offensive contribution is compensated exclusively through
Plan 04-owned weapon numeric fields. Combat and item-property formulas remain
unchanged.

Existing stored items need no migration or respec. Weapon requirements are
enforced on a future equip or re-equip, while nonweapon equipment remains
available at every character level.

The Guide shows `Armor Tier N/6` on tiered armor item and set views and renders
only populated bonus slots and defined milestone rows, including reduced sets.

## Weapon progression

The visible progression catalog contains 90 combat weapons: 84 baseline
weapon/source entries plus six rank-5 Hunter-only sidegrades. Warrior, Paladin,
Mage, Priest, Ranger, and Rogue each expose the same seven shared ranks with
skill requirements at levels 1, 20, 40, 60, 80, 90, and 99.
Historical acquisition ranks compress monotonically into those shared ranks;
the easiest item at an occupied rank is the progression anchor and additional
items are labeled sidegrades. Acquisition route and effort remain independent
of the regenerated numeric fields.

Weapon Base DPS is calculated from the neutral full sheet at the rank's pinned
reference level. Every combat class has exactly seven ranks. Warrior's `+0`
full-sheet targets follow one geometric line from 50 DPS at rank 1 to 450 DPS at
rank 7 (`50 * 9^((rank - 1) / 6)`); Paladin and Priest target `0.90×` the
corresponding Warrior value, while Ranger, Rogue, and Mage target `1.10×` it.
The class, armor, cape, compatible offhand, and frozen-accessory context remains
in the sheet oracle, but rebalanced armor contributes no offensive `STR`, `DEX`,
or `INT`; compensation is exclusively in Plan 04-owned weapon base/core and
attack-growth fields. Active abilities, rotations, buffs, mitigation, and
random rolls are excluded.

Rank power is measured at `(+0,+0)`. The base state and the fully enhanced
`(+12 upgrade,+10 compound)` state are hard publication gates for every class
and rank. All other supported upgrade/compound combinations are fully
evidenced diagnostics: each records its target, actual sheet result, signed and
absolute error, and contribution data, and must remain finite, positive, and
monotonic along both enhancement axes. Intermediate states do not have to hit
their targets exactly or provide an independent target bracket. Enhancement
levels do not change a weapon's rank; retained identity, cadence, range,
projectile, special effects, and non-attack enhancement fields remain intact.
Effective range uses the profile base plus the item's additive range exactly
once.

All eleven Priest books (`wbook0`, `wbook1`, `wbook2`–`wbook9`, and `wbookhs`)
are visible magical `book`/`pmagic` weapons that use the game's upgrade/enchant
path through `+12` and have no `compound` object. Eight are placeholders that
reuse existing book assets; their non-attack enhancement fields remain intact.
The Guide shows each weapon's shared rank, historical rank, progression role,
reference level, Hit Damage, Attacks / Sec, and Base DPS; it does not present
historical acquisition rank as current power. The shared-rank display uses the
published seven-rank scale.

In the in-game Guide → Items view, visible weapons are grouped under Warrior,
Paladin, Mage, Priest, Ranger, and Rogue in combat-profile order. Each group is
sorted by the existing level-0 Base DPS calculation, with item ID as the
deterministic tie-breaker; ignored items remain hidden and the other item
categories keep their existing layout and detail actions. Guide → Monsters is
grouped into the published Tier 1–7 sections (plus Unassigned when needed), and
each monster detail view shows its progression tier, eligibility, and supported
mechanics or ineligibility reason.

The parity runner and checked-in fixtures expose current assigned requirements
alongside immutable historical DPS/TTK comparisons. Historical family and
handoff checks are retained as diagnostics, not release gates. Existing item
instances remain equipped through the normal equipment-refresh path; a future
equip or re-equip enforces the assigned requirement, with no migration or
respec step. To inspect the deterministic diagnostic chart locally:

```sh
node tools/weapon-progression-parity.js --format=markdown
```

The checked-in equipment fixtures cover all 129 source monster definitions; the
combat matrix evaluates the 119 attackable rows and its canonical loadouts.
Outgoing time-to-defeat rows are diagnostics; incoming ordinary-solo survival
remains a hard 0.80–1.20 ratio against its pinned reference. Monster
definitions and progression-time data are not rewritten by this balance pass.
The former XP/time benchmark is archived under
`node/tests/obsolete/` and is excluded from the default test suite, so its
duration output is historical rather than a current release authority.

Generated equipment evidence is stored as deterministic one-line JSON so its
full data remains reproducible without overwhelming code review with formatting
lines. GitHub marks these payloads as generated; this README carries their
human-reviewable scale summary:

| Evidence | Reviewable scale |
|---|---:|
| Weapon acquisition and enhancement | 90 weapons; 42 class/rank rows; 1,170 enhancement states |
| Vanilla equipment baseline | 420 role/level rows; 129 monsters; 1,573 Warrior enhancement states |
| Armor and sets | 20 sets; 13 tiered sets across six tiers; 7 non-tiered themes |
| Weapon and offhand loadouts | 7 ranks; 1,170 weapon states; 811 legal layouts |
| Combat matrix | 36 canonical loadouts × 119 attackable monsters = 4,284 rows |

Armor balance evidence is generated from the same cumulative set-threshold
publication helper used by the server. From the `node/` directory, verify the
checked-in evidence with:

```sh
node tools/direct-equipment-authority.js --fixture=armor-set-balance.json --verify
node tools/equipment-balance.js --verify
```

The authority enumerates legal complete-set variants at `+0` through `+12`
and fails closed on tier-ordering, reduced-set, or retirement-contract drift.

### Monster Hunter progression

The Monster Token shop has one optional rank-5 Hunter sidegrade for each combat
class. These upgradeable weapons use placeholder art and retain the existing
PvP/signature routes:

| Class | Weapon |
|---|---|
| Warrior | Hunter's Spear (`mhspear`) |
| Paladin | Hunter's Hammer (`mhhammer`) |
| Mage | Hunter's Wand (`mhwand`) |
| Priest | Hunter's Codex (`mhbook`) |
| Ranger | Hunter's Crossbow (`mhcrossbow`) |
| Rogue | Hunter's Dagger (`mhdagger`) |

All six cost **1,944 Monster Tokens** and Monster Tokens are their only
acquisition source. The price is derived from the ordinary rank-5 copy effort
and tier-5 hunt effort, rather than being hand-tuned.

Monster Hunt assignment is authoritative to the equipped ranked combat weapon.
At enhancement `+0` through `+3`, a weapon unlocks hunts through its current
rank; at `+4` or higher it unlocks the next tier, with assignments capped at
tier 6. The server chooses the highest available live `hunter_eligible`
permanent ordinary monster and falls back to lower tiers when needed. Targeted,
concurrently hunted, event, boss, keyed, scripted, unsupported, and other
ineligible monsters are excluded from new assignments. Normal completion awards
tier 1–6 quantities `1, 1, 2, 3, 4, 5`; Hardcore preserves the existing 100×
multiplier. Older in-progress hunt records are resolved from their server-owned
monster ID, so no migration is required.

## Combat skill progression

Warrior, Paladin, Mage, Priest, Ranger, and Rogue share one generated combat
XP curve. It is calibrated from the existing monster XP rewards and Warrior's
base solo route; XP bonuses, party share, and server multipliers are not part of
the baseline. A 10% XP buffer allows for normal farming downtime. The curve
aligns the shared weapon gates to these cumulative active-play targets:

| Skill level | Cumulative active time |
|---:|---:|
| 20 | 72 hours |
| 40 | 336 hours |
| 60 | 1,008 hours |
| 80 | 2,190 hours |
| 90 | 4,380 hours |
| 99 | 8,760 hours |

The final stretch uses eligible permanent ordinary Tier-6 monsters. Merchant
keeps its existing quadratic XP curve and 900,000,000 cap. On first load after
the curve rollout, persisted combat XP is retained and its displayed level is
reclassified; no database reset or respec is required. Verify the checked-in
calibration evidence from the `node/` directory with:

```sh
node tools/combat-xp-pacing.js --verify
```

## Default server monster rewards

The game server derives its reward multiplier from
`options.default_server_key`. The server started with that key receives **2×**
normal monster item-drop odds and chest gold (including extra gold); every other
server key uses **1×**. The multiplier is applied by the normal monster drop
path and does not change XP, Monster Hunt token quantities, or the dedicated
Hardcore/PvP reward paths.

## Merchant enhancement progression

Every completed upgrade awards 200 Merchant skill XP, and every completed
compound awards 600 Merchant skill XP. Rewards apply to every character class
and to both successful and failed outcomes; rejected or unresolved requests do
not award XP. Enhancement rewards have no hourly action-rate cap and follow the
shared skill progression cap at Merchant level 99.

## Seeding Game Data

The database needs map data and game entities to function. You have two options:

### Option A: Import from the RDBMS dump (recommended)

The original AppEngine development database is available at:
https://github.com/kaansoral/adventureland-appserver/blob/main/storage/db.rdbms

This SQLite file contains users, characters, maps, and all game data from the development server.

Use the migration scripts in `agentic/` to import this data into MongoDB:

```sh
# Set up Python environment
cd agentic
python3 -m venv .venv
source .venv/bin/activate
pip install pymongo

# Run the RDBMS migration (reads db.rdbms, writes to MongoDB)
python _migrate_rdbms.py
```

See `agentic/` for additional fix scripts that handle ID prefixing, repeated fields, and other migration edge cases. The scripts are documented in `CLAUDE.md`.

### Option B: Start fresh

The game will create entities as needed. You can sign up for a new account through the web UI. You'll need to populate map data for the game server to function — the BFS precomputation (`node/precompute_bfs.js`) depends on map geometry being in the database.

For the protocol-4 local release, run the deterministic progression contract
scan from the umbrella repository. It checks the semantic progression
vocabulary without changing the local database. The read-only publication,
world, and map-seed tools are separate checks for plans that explicitly call
for them. Existing class-based consumers are not supported after the
skill/ability contract cutover.

## Project Structure

```
adventureland/
  main.js                  # Express backend (port 8090)
  api.js                   # API endpoints (REF pattern)
  adventure_functions.js   # Game functions (auth, characters, servers, etc.)
  models.js                # MongoDB model definitions
  crons.js                 # Scheduled tasks
  filters.js               # Nunjucks template filters
  node/
    server.js              # Game server (Socket.IO)
    server_functions.js    # Game logic
    precompute_bfs.js      # BFS pathfinding precomputation
    precomputed_map_data.js # Generated BFS data
  design/                  # Game data (items, monsters, maps, skills, etc.)
  htmls/                   # Nunjucks templates
  js/                      # Client-side JavaScript
  css/                     # Stylesheets
  images/                  # Game art and tilesets
  sounds/                  # Sound effects and music
  agentic/                 # Migration and data fix scripts
  common -> ../common      # Symlink to common_engine
  secretsandconfig -> ...  # Symlink to your config
```

## Making Yourself Admin

With `Local: true` and `unsecure_admin: true` in options.js, visit:

```
http://localhost:8090/admin/make/user/admin
```

While logged in. This sets `user.admin = true` on your account, giving access to `/admin/executor` and `/admin/renderer`.

With `Local: true` and `unsecure_admin: true`, all users are treated as admin automatically. This only works from localhost connections.

## Contributing

PRs are welcome! Please keep them **small and focused** — one fix or one feature per PR. Large PRs that touch many unrelated things are hard to review and likely to be rejected. If you're planning something big, open an issue or discuss it on Discord first.

## Discussion

Use the **#development** channel on Discord for questions and collaboration: https://discord.gg/hz25Kz9FsH

## Code Formatting

This project uses [Prettier](https://prettier.io/) for the game server (`node/` folder). If you use VSCode, install the recommended extensions — formatting happens automatically on save.

## License

[AdventureLandOnlyUse](LICENSE) — free for commercial use with attribution. See the license file for full terms.
