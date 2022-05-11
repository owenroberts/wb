var thesaurus = require("thesaurus");
var program = require('commander');
var chain = require('./../chain');
var n = require('./../new.js');
var now = require('performance-now');
const lev = require('fast-levenshtein');

program
	.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);

var query = {
	start: program.args[0],
	end: program.args[1],
	nodeLimit: 10,
	synonymLevel: 10
};

let usedWords = [program.args[0].toLowerCase(), program.args[1].toLowerCase()];

let start = now();

let chain1 = n.makeChain(query, usedWords);
console.log("n time", now() - start);
console.log(chain1.map(n => n.word).join(' > '));

let syns = chain1[1].alts;
let count = 0;
let syn = '';

for (let i = 0; i < syns.length; i++) {
	let q = {
		start: syns[i],
		end: query.end,
		nodeLimit: 10,
		synonymLevel: 10
	};
	let b = n.makeChain(q, [...usedWords], 'chainCount');

	if (!b.error) {
		if (b.chainCount > count) {
			syn = syns[i];
			count = b.chainCount;
		}
	}
}

console.log(syn);

