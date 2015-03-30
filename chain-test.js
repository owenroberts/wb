var thesaurus = require("thesaurus");
var program = require('commander');
program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);

var start = program.args[0];
var end = program.args[1];

var allsynomyms = [start];
var allpaths = [];
var reg = /^[a-z]+$/;
var nodelimit = program.args[2];
var synonymlevel = program.args[3];


var findSynonyms = function(word, path, runagain) {
	
	
	var wordPath = path;
	wordPath.push(word);

	//console.log(wordPath);

	var tmp = thesaurus.find(word);
	var synonyms = [];
	for (var i = 0; i < tmp.length; i++) {
		//console.log(tmp[i]);
		if (reg.test(tmp[i]) 
			&& allsynomyms.indexOf(tmp[i]) == -1 
			&& allsynomyms.indexOf(tmp[i]+"s") == -1
			&& synonyms.length < 10 ) {
			synonyms.push(tmp[i]);
			allsynomyms.push(tmp[i]);
		}
	}
	if (synonyms.length > synonymlevel) {
		synonyms.splice(synonymlevel, synonyms.length - synonymlevel);
	}
	for (var i = 0; i < synonyms.length; i++) {
		if (synonyms[i] == end) {
			//console.log("got it");
			//wordPath.push(end);
			allpaths.push(wordPath);
		}
	}

	for (var i = 0; i < synonyms.length; i++) {
		//console.log(word, i, synonyms[i], wordPath.length);
		if (runagain && wordPath.length < nodelimit) {
			var newpath = wordPath.slice(0);
			findSynonyms(synonyms[i], newpath, true);
		}
	}

}

findSynonyms(start, [], true);
console.log(allpaths.length);
console.log(allpaths[0]);

function shortestPath() {
	if (allpaths.length > 0) {
		console.log(allpaths.length);
		console	.log(allpaths[0]);
	} else {
		allsynomyms = [start];
		nodelimit++;
		findSynonyms(start, [], true);
		shortestPath();
	}
}

//shortestPath();

