var thesaurus = require("thesaurus");
var program = require('commander');
var chain = require('./../chain');
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
chain.makeChain(query, [program.args[0].toLowerCase(), program.args[1].toLowerCase()], function(err, data) {
	if (err) console.log(err);
	else {
		console.log("time", now() - start);
		// console.log(data);
		let index = 0;
		for (const word in data) {
			console.log(index, data[word].word);
			index++;
		}
	}
});

