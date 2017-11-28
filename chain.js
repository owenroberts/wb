var thesaurus = require("thesaurus");

var makeChain = function(query, allSynonyms, callback) {
	var startWord = query.start.toLowerCase();
	var endWord = query.end.toLowerCase();
	console.log(startWord, endWord);
	var reg = /^[a-z]+$/;

	const nodeNumberLimit = 20; // no chains more than this number of nodes
	var currentNodeNumber = +query.nodelimit; // try to get under this first
	const synonymLevel = +query.synonymlevel;
	var foundChain = false;

	var attempts = 0;
	
	function buildChain(chain, allSynsCopy) {
		var index = chain.length - 1;
		allSynsCopy.push(chain[index].word);
		var tempSyns = thesaurus.find(chain[index].word);
		var synonyms = [];
		for (var i = 0; i < tempSyns.length; i++) {
			if (reg.test(tempSyns[i]) 
				&& allSynsCopy.indexOf(tempSyns[i]) == -1 
				&& allSynsCopy.indexOf(tempSyns[i]+"s") == -1
				&& synonyms.length < 10 ) {
				synonyms.push({
					word:tempSyns[i]
				});
				allSynsCopy.push(tempSyns[i]);
			}
		}

		chain[index].synonyms = synonyms;

		for (var i = 0; i < synonyms.length; i++) {
			if (synonyms[i].word == endWord) {
			 	chain.push(synonyms[i]);
			 	foundChain = true;
			 	sendData(chain);
			} else if (!foundChain){
				attempts++;
				// 200000 attempts seems like a lot but how many will this break?
				if (attempts > 200000) {
					callback("Your search was not able to be performed with the current parameters.");
					foundChain = true;
				}
				if (chain.length < currentNodeNumber) {
					var newChain = chain.slice(0);
					newChain.push(synonyms[i]);
					buildChain(newChain, allSynsCopy.slice(0));
				}
			}
		}
	}

	function sendData(chain) {
		var data = {};
		var result = [];
		for (let i = 1; i < chain.length - 1; i++) {
			result[i - 1] = {};
			result[i - 1].node = chain[i].word;
			result[i - 1].alternates = []
			for (let j = 0; j < chain[i-1].synonyms.length; j++)
				result[i - 1].alternates.push( chain[i-1].synonyms[j].word );
		}
		data.chain = result;
		data.nodelimit = currentNodeNumber;
		callback(null, data);
	}

	function getShortestChain() {
		if (currentNodeNumber < nodeNumberLimit) {
			currentNodeNumber++;
			if (!foundChain) {
				buildChain([{word:startWord, weight:0}], allSynonyms.slice(0));
				getShortestChain();
			}
		} else {
			callback("Your search was not able to be performed with the current parameters.");
		}
	}

	if (!startWord || !endWord) {
		callback("Please enter two search words.");
	} else if (!reg.test(startWord) || !reg.test(endWord)) {
		callback("Please enter single words with no spaces or dashes.");
	} else if (startWord == endWord) {
		callback("Please enter different words.")
	} else if (thesaurus.find(startWord).length == 0) {
		callback("The first word was not found.");
	} else if (thesaurus.find(endWord).length == 0) {
		callback("The second word was not found.");
	} else {
		buildChain([{word:startWord}], allSynonyms.slice(0));
		getShortestChain();
	}

}
exports.makeChain = makeChain;