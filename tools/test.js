var thesaurus = require("thesaurus");
var program = require('commander');
var chain = require('./../chain');
var now = require('performance-now');

program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);

var query = {
	start: 'party', // program.args[0],
	end: 'avocado',  // program.args[1],
	nodeLimit: 9,
	synonymLevel: 10
};
let start = now();
chain.makeChain(query, ['party', 'avocado', 'green',
     'greenish',
     'chromatic',
     'party',
     'unripe',
     'unripened',
     'immature',
     'unaged',
     'ill',
     'sick',
     'fleeceable'], function(err, data) {
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

