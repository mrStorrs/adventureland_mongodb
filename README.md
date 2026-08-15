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
legacy item tiers. Nineteen named armor themes are complete five-slot sets
(helmet, chest, pants, gloves, and shoes) with Heavy, Medium, or Light weight
identity. Weights are universally wearable and provide different stat
tradeoffs; each theme has cumulative armor-only bonuses at two, three, four,
and five equipped pieces. Weapons, offhands, capes, accessories, and orbs may
keep a theme for presentation but do not increment an armor-set bonus. The
Monster Hunter Paladin theme is included, and 25 newly filled armor slots are
marked as placeholder artwork until dedicated art is available.

Standalone armor and capes are independent sidegrades. Combat offhands
(shields, quivers, sources, and miscellaneous hand items) use acquisition
ranked base values and grouped highest-compatible-skill requirements; legal
one-hand, dual-wield, two-hand, and offhand layouts are checked together so an
easier option cannot strictly dominate a harder one. Jewelry and orbs remain
outside this rebalance, and non-weapon enhancement growth is preserved.

The server and Guide evaluate grouped requirements such as “Highest Warrior or
Paladin Lv. 50” consistently. Existing stored items need no migration or
respec; the reviewed requirement is enforced on a future equip or re-equip.

## Weapon progression

The visible combat catalog contains 83 weapons: the 75 retained acquisition
decisions plus eight permanent Priest book placeholders (`wbook2` through
`wbook9`). Warrior, Paladin, Mage, Priest, Ranger, and Rogue each expose the
same eleven shared ranks with skill requirements from level 1 through 99.
Historical acquisition ranks compress monotonically into those shared ranks;
the easiest item at an occupied rank is the progression anchor and additional
items are labeled sidegrades. Acquisition route and effort remain independent
of the regenerated numeric fields.

Weapon Base DPS is calculated from the neutral full sheet at the rank's pinned
reference level. The lowest valid level-1 starter sheet and the highest valid
level-70 Warrior retained-mainhand sheet are the endpoints, with geometric
interpolation between them and deterministic integer quantization. Class,
armor, cape, compatible offhand, and frozen accessory contributions are part of
that sheet; active abilities, rotations, buffs, mitigation, and random rolls
are excluded. Enhancement levels do not change a weapon's rank, and retained
identity, cadence, range, projectile, special effects, and non-attack
enhancement fields remain intact. Effective range uses the profile base plus
the item's additive range exactly once.

The eight Priest placeholders are visible permanent magical books normalized to
the existing `book`/`pmagic` contract and reuse existing book assets. The Guide
shows each weapon's shared rank, historical rank, progression role, reference
level, Hit Damage, Attacks / Sec, and Base DPS; it does not present historical
acquisition rank as current power.

In the in-game Guide → Items view, visible weapons are grouped under Warrior,
Paladin, Mage, Priest, Ranger, and Rogue in combat-profile order. Each group is
sorted by the existing level-0 Base DPS calculation, with item ID as the
deterministic tie-breaker; ignored items remain hidden and the other item
categories keep their existing layout and detail actions.

The parity runner and checked-in fixtures expose current assigned requirements
alongside immutable historical DPS/TTK comparisons. Historical family and
handoff checks are retained as diagnostics, not release gates. Existing item
instances remain equipped through the normal equipment-refresh path; a future
equip or re-equip enforces the assigned requirement, with no migration or
respec step. To inspect the deterministic diagnostic chart locally:

```sh
node tools/weapon-progression-parity.js --format=markdown
```

The checked-in equipment fixtures also cover all 129 monster definitions and
canonical loadouts. Outgoing time-to-defeat rows are diagnostics; incoming
ordinary-solo survival remains a hard 0.80–1.20 ratio against its pinned
reference. Monster definitions and progression-time data are not rewritten by
this balance pass. The former XP/time benchmark is archived under
`node/tests/obsolete/` and is excluded from the default test suite, so its
duration output is historical rather than a current release authority.

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

For the protocol-3 local release, run the deterministic progression contract
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
