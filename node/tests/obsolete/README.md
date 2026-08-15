# Obsolete progression-time benchmark

`progression-benchmark.obsolete.js` preserves the former vanilla XP/time test suite for historical reference. It is deliberately named outside the `*.test.js` discovery pattern and is not an equipment-balance or release authority.

The archived expectations assume the former equipment catalog, single-skill requirement clauses, and reviewed vanilla loadouts. They cannot evaluate the current grouped `any_skill` requirements or eleven-rank full-sheet equipment model.

Do not rename this file into the active test pattern or use its duration outputs as current acceptance criteria. Current equipment authorities are:

- `../fixtures/weapon-acquisition-ranking.json` for acquisition ranks, endpoint evidence, and weapon solutions;
- `../fixtures/weapon-loadout-balance.json` for rank bands, enhancement states, offhands, and legal-layout domination;
- `../fixtures/equipment-combat-matrix.json` for complete monster/loadout diagnostics and survival gates.

`../../tools/progression-benchmark.js` and its route/target fixtures remain byte-preserved because current tooling still imports its generic catalog-loading and stable-serialization helpers. Its XP/time route simulation and reviewed duration targets are obsolete. A future progression-time benchmark requires new legal routes, grouped-requirement semantics, and a separately reviewed output oracle.
