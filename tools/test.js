var thesaurus = require("thesaurus");
var program = require('commander');
var chain = require('./chain');
var now = require('performance-now');

program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);

var query = {
	start: program.args[0],
	end: program.args[1],
	nodelimit: 10,
	synonymlevel: 10
};
let start = now();
chain.makeChain(query, [program.args[0], program.args[1]], function(err, data) {
	if (err) query.error = err;
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

