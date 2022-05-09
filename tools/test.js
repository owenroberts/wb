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
n.makeChain(query, usedWords, (err, data) => {
	console.log("n time", now() - start);
	if (err) console.log(err);
	else {
		// console.log(data.map(n => n.word).join(' > '));
		data.forEach(chain => {
			console.log(chain.map(n => n.word).join(' > '));
		});
	}
});
