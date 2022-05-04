var thesaurus = require("thesaurus");
var program = require('commander');
var chain = require('./../chain');
var n = require('./../new.js');
var now = require('performance-now');

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

let start = now();
let usedWords = [program.args[0].toLowerCase(), program.args[1].toLowerCase()];
chain.makeChain(query, usedWords, (err, data) => {
	console.log("time", now() - start);
	if (err) console.log(err);
	else {
		console.log(data.map(n => n.word).join(' > '));
	}
});

start = now();
n.getChain(query, usedWords, (err, data) => {
	console.log("time", now() - start);
	if (err) console.log(err);
	else {
		console.log(data.map(n => n.word).join(' > '));
	}
});

