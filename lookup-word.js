var program = require('commander');
program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);
var thesaurus = require("thesaurus");
var word = program.args[0];
var reg = /^[a-z]+$/;
var syns = thesaurus.find(word);
syns.forEach(function(syn) {
	if (reg.test(syn)) console.log(syn);
})
