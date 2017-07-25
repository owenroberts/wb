var program = require('commander');
var def = require('./def');

program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);

var word = program.args[0];

if (!word) {
  program.help();
}

def.getDef(word, function(results) {
	console.log(results);
});
