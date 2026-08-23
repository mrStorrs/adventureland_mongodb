"use strict";

const escapeOffsets = [
	[-24, -24],
	[0, -24],
	[24, -24],
	[-24, 0],
	[24, 0],
	[-24, 24],
	[0, 24],
	[24, 24],
];

const START_RESERVATION_TTL_MS = 120 * 60 * 1000;

function isCharacterStartBlocked(character, { serverId, now = Date.now(), locallyActive = false }) {
	if (locallyActive) return true;
	if (!character?.server) return false;
	const lastSync = new Date(character.last_sync).getTime();
	return !Number.isFinite(lastSync) || now - lastSync < START_RESERVATION_TTL_MS;
}

function releaseCharacterStartReservation(character, { serverId, secret }) {
	if (!character || character.server !== serverId || character.info?.secret !== secret) return false;
	character.online = false;
	character.server = "";
	return true;
}

function hasCharacterMovementExit(character, canMove) {
	return escapeOffsets.some(([x, y]) =>
		canMove({
			map: character.map,
			x: character.x,
			y: character.y,
			going_x: character.x + x,
			going_y: character.y + y,
			base: character.base,
		}),
	);
}

function recoverTrappedCharacterPosition(character, { maps, canMove }) {
	if (!character || !maps?.[character.map] || hasCharacterMovementExit(character, canMove)) return null;
	const spawn = maps[character.map].spawns?.[0];
	if (!Array.isArray(spawn) || !Number.isFinite(spawn[0]) || !Number.isFinite(spawn[1])) return null;
	const recovered = { ...character, x: spawn[0], y: spawn[1] };
	if (!hasCharacterMovementExit(recovered, canMove)) return null;
	return { x: recovered.x, y: recovered.y };
}

module.exports = { isCharacterStartBlocked, releaseCharacterStartReservation, recoverTrappedCharacterPosition };
