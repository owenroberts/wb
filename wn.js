var program = require('commander');
var Wordnet = require('node-wordnet');

var wordnet = new Wordnet();

program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);

var word = program.args[0];
var syn = program.args[1];

if (!word) {
  program.help();
}

wordnet.lookup(word, function(results) {
    for (var i = 0; i < results.length; i++) {
    	var result = results[i];
        console.log("--");
        //console.log(result);
       	//console.log(result.pos);
        console.log(result.lemma);
        console.log(result.synonyms);
        //console.log(result.gloss.split(";")[0]);

        if (result.lemma == syn) {
        	console.log("l " + result.pos);
        	console.log("l " + result.gloss.split(";")[0]);
        	break;
        } else if (result.synonyms.indexOf(syn) != -1) {
        	console.log("s " + result.gloss.split(";")[0]);
        } else {
        	result.ptrs.forEach(function(ptr) {
	        	wordnet.get(ptr.synsetOffset, ptr.pos, function(data) {
	        		if (data.synonyms.indexOf(syn) != -1) {
	        			console.log("p " + result.lemma);
	        			console.log("p " + result.pos);
	        			console.log("p " + result.gloss.split(";")[0]);
	        		} else {
	        			//console.log(data.synonyms);
	        		}
	        	});
	        });
        }
    }
});