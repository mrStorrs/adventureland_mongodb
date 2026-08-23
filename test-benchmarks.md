# Test Benchmarks

This file records measured local run times for the project's test commands.
The recommended timeout is `max(last run time × 2, 30s)`.

| Command | Last Run Time | Last Updated | Recommended Timeout | Notes |
|---|---:|---|---:|---|
| `node --test node/tests/character-start-reservation.test.js node/tests/socket-cleanup-contract.test.js` | 0.05s | 2026-08-23 | 30s | Plan 01 contracts |
| `node --test node/tests/regional-xp-policy.test.js node/tests/public-contract.test.js node/tests/browser-mining-contract.test.js node/tests/mining-domain.test.js node/tests/mining-runtime.test.js node/tests/combat-xp-pacing.test.js` | 1.13s | 2026-08-23 | 30s | Plan 02 contracts after Vigil remediation |
| `node --test node/tests/smithing-domain.test.js node/tests/smithing-runtime.test.js` | 0.15s | 2026-08-23 | 30s | Plan 03 contracts after Vigil remediation |
| `node --test node/tests/*.test.js` | 26.39s | 2026-08-23 | 53s | 279 passed; 2 repository-configuration skips |
