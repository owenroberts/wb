var thesaurus = require("thesaurus");
var program = require('commander');
var chain = require('./chain');


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

chain.makeChain(query, [program.args[0]], function(err, data) {
	if (err) query.error = err;
	else {
		console.log(data);
	}
});

