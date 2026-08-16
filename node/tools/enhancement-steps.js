"use strict";

const UPGRADE_STEP_WEIGHTS = Object.freeze([0, 1, 1, 1, 1, 1, 1, 1.25, 1.5, 2, 3, 1.25, 1.25]);
const COMPOUND_STEP_WEIGHTS = Object.freeze([0, 1, 1, 1, 1, 1.25, 1.5, 2, 3, 3, 3]);

function enhancementStepWeight(kind, level) {
	const weights = kind === "upgrade" ? UPGRADE_STEP_WEIGHTS : kind === "compound" ? COMPOUND_STEP_WEIGHTS : null;
	return weights && Number.isInteger(level) && level >= 0 && level < weights.length ? weights[level] : 0;
}

function cumulativeEnhancementWeight(kind, level) {
	let total = 0;
	for (let current = 1; current <= level; current += 1) total += enhancementStepWeight(kind, current);
	return total;
}

module.exports = {
	COMPOUND_STEP_WEIGHTS,
	UPGRADE_STEP_WEIGHTS,
	cumulativeEnhancementWeight,
	enhancementStepWeight,
};
