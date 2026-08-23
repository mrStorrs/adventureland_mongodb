"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
	isCharacterStartBlocked,
	releaseCharacterStartReservation,
	recoverTrappedCharacterPosition,
} = require("../game/character_start");

test("a failed character initialization releases only its own start reservation", () => {
	const reservation = { server: "SR_USI", online: true, info: { secret: "attempt-a" } };
	assert.equal(releaseCharacterStartReservation(reservation, { serverId: "SR_USI", secret: "attempt-a" }), true);
	assert.deepEqual(reservation, { server: "", online: false, info: { secret: "attempt-a" } });

	const replacement = { server: "SR_USI", online: true, info: { secret: "attempt-b" } };
	assert.equal(releaseCharacterStartReservation(replacement, { serverId: "SR_USI", secret: "attempt-a" }), false);
	assert.deepEqual(replacement, { server: "SR_USI", online: true, info: { secret: "attempt-b" } });

	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	assert.match(server, /await release_failed_character_start\(data\.character, socket\.observer_secret\);/);
});

test("a restart can reclaim this server's stale reservation without permitting a live duplicate", () => {
	const now = Date.UTC(2026, 7, 20, 17, 30, 0);
	const sameServer = { server: "SR_USHARNESS", last_sync: new Date(now - 60_000) };
	assert.equal(isCharacterStartBlocked(sameServer, { serverId: "SR_USHARNESS", now, locallyActive: false }), true);
	assert.equal(isCharacterStartBlocked(sameServer, { serverId: "SR_USHARNESS", now, locallyActive: true }), true);
	assert.equal(
		isCharacterStartBlocked(
			{ server: "SR_USHARNESS", last_sync: new Date(now - 121 * 60_000) },
			{ serverId: "SR_USHARNESS", now, locallyActive: false },
		),
		false,
	);

	const otherServer = { server: "SR_EUI", last_sync: new Date(now - 60_000) };
	assert.equal(isCharacterStartBlocked(otherServer, { serverId: "SR_USHARNESS", now, locallyActive: false }), true);
	assert.equal(
		isCharacterStartBlocked(
			{ server: "SR_EUI", last_sync: new Date(now - 121 * 60_000) },
			{ serverId: "SR_USHARNESS", now, locallyActive: false },
		),
		false,
	);
	assert.equal(
		isCharacterStartBlocked({ server: "SR_USHARNESS", last_sync: "invalid" }, { serverId: "SR_USHARNESS", now }),
		true,
	);
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	assert.match(server, /isCharacterStartBlocked\(R\.entity, \{\s*serverId: server_id,\s*locallyActive: has_live_character_session\(A\[0\]\.character\)/);
});

test("a trapped character starts again at a walkable spawn", () => {
	const maps = { tunnel: { spawns: [[0, -16, 3]] } };
	const trapped = {
		map: "tunnel",
		x: -256,
		y: -96,
		base: { h: 8, v: 7, vn: 2 },
	};
	const blocked = () => false;
	const walkableAtSpawn = ({ x, y }) => x === 0 && y === -16;

	assert.deepEqual(recoverTrappedCharacterPosition(trapped, { maps, canMove: blocked }), null);
	assert.deepEqual(recoverTrappedCharacterPosition(trapped, { maps, canMove: walkableAtSpawn }), { x: 0, y: -16 });
	assert.equal(
		recoverTrappedCharacterPosition({ ...trapped, x: 0, y: -16 }, { maps, canMove: walkableAtSpawn }),
		null,
	);
	const server = fs.readFileSync(path.resolve(__dirname, "../server.js"), "utf8");
	assert.match(
		server,
		/player\.base = dbase;\s*var recoveredPosition = recoverTrappedCharacterPosition\(player, \{ maps: G\.maps, canMove: can_move \}\)/,
	);
});
