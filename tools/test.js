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

// chain.makeChain(query, usedWords, (err, data) => {
// 	console.log("chain time", (now() - start));
// 	if (err) console.log(err);
// 	else {
// 		console.log(data.map(n => n.word).join(' > '));
// 	}
// });

start = now();
let chain1 = n.makeChain(query, usedWords);
console.log("n time", now() - start);
console.log(chain1.map(n => n.word).join(' > '));

start = now();
let chain2 = n.makeChain(query, [...usedWords, chain1[1].word]);
console.log("n time", now() - start);
console.log(chain2.map(n => n.word).join(' > '));

// n.makeChain(query, usedWords, (err, data) => {
// 	console.log(err)
// 	console.log("n time", now() - start);
// 	if (err) console.log(err);
// 	else {
// 		console.log(data.map(n => n.word).join(' > '));
// 	}
// });
