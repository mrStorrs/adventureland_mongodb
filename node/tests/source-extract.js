"use strict";

function extractSourceBlock(source, declaration) {
	const start = source.indexOf(declaration);
	if (start === -1) throw new Error(`Missing ${declaration}`);
	const openingBrace = source.indexOf("{", start);
	if (openingBrace === -1) throw new Error(`Missing block for ${declaration}`);
	let depth = 0;
	for (let index = openingBrace; index < source.length; index += 1) {
		if (source[index] === "{") depth += 1;
		if (source[index] === "}") depth -= 1;
		if (depth === 0) return source.slice(start, index + 1);
	}
	throw new Error(`Unterminated ${declaration}`);
}

function extractFunctionBody(source, declaration) {
	const block = extractSourceBlock(source, declaration);
	return block.slice(block.indexOf("{") + 1, -1);
}

module.exports = { extractFunctionBody, extractSourceBlock };
