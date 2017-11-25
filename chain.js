var thesaurus = require('thesaurus');

function makeChain(query, allSynonyms, callback) {
	var startWord = query.start.toLowerCase();
	var endWord = query.end.toLowerCase();
	var reg = /^[a-z]+$/;

	const nodeNumberLimit = 20; // no chains more than this number of nodes
	var currentNodeNumber = query.nodelimit; // try to get under this first
	var foundChain = false;
	const synonymLevel = query.synonymlevel;

	var data = {};
	var attemptedChains = [];
	var attemptCount = 0;

	function getSynonyms(word, allSynsCopy) {
		var tempSyns = thesaurus.find(word);
		var synonyms = [];
		for (let i = 0; i < tempSyns.length; i++) {
			let syn = tempSyns[i];
			if (reg.test(syn)
				&& allSynsCopy.indexOf(syn) == -1
				&& allSynsCopy.indexOf(syn+"s") == -1
				&& synonyms.length < 10) {
				synonyms.push({
					word: syn,
					weight: i + 1
				});
			}
		}
		return synonyms;
	}

	function buildChain(startChain, endChain, allSynsCopy) {
		var startIndex = startChain.length-1;
		var endIndex = endChain.length-1;
		allSynsCopy.push(startChain[startIndex].word);
		allSynsCopy.push(endChain[endIndex].word);
		var allSynsCopyCopy = allSynsCopy.slice(0);
		
		if (startChain[startIndex].synonyms === undefined) {
			startChain[startIndex].synonyms = getSynonyms(startChain[startIndex].word, allSynsCopyCopy);
			for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
				allSynsCopy.push( startChain[startIndex].synonyms[i].word );
			}
		}

		if (endChain[endIndex].synonyms === undefined) {
			endChain[endIndex].synonyms = getSynonyms(endChain[endIndex].word, allSynsCopyCopy);
			for (let i = 0; i < endChain[endIndex].synonyms.length; i++) {
				allSynsCopy.push( endChain[endIndex].synonyms[i].word );
			}
		}

		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			let startCopy = startChain.slice(0);
			let startSyn = startChain[startIndex].synonyms[i];
			startCopy.push(startSyn);
			for (let j = 0; j < endChain[endIndex].synonyms.length; j++) {
				let endSyn = endChain[endIndex].synonyms[j];
				if (startSyn.word == endSyn.word && !foundChain) {
					foundChain = true;
					for (let h = endChain.length-1; h >= 0; h--) {
						startCopy.push( endChain[h] );
					}
					sendData(startCopy);
				} else if (startChain.length + endChain.length < currentNodeNumber - 1 && !foundChain) {
					let endCopy = endChain.slice(0);
					endCopy.push(endSyn);
					buildChain(startCopy, endCopy, allSynsCopy.slice(0));
				} else if (startChain.length + endChain.length >= currentNodeNumber && !foundChain) {
					attemptCount++;
				}
			}
		}
		
	}

	function sendData(chain) {
		let weight = 0;
		for (let i = 0; i < chain.length; i++) {
			weight += chain[i].weight;
		}
		data.avgWeight = weight/chain.length;
		data.chain = chain;
		data.nodelimit = currentNodeNumber;
		data.synonymlevel = synonymLevel;
		data.weight = weight;
		data.attempts = attemptedChains;
		data.count = attemptCount;
		callback(null, data);
	}

	function getShortestChain() {
		if (currentNodeNumber < nodeNumberLimit) {
			currentNodeNumber++;
			if (!foundChain) {
				buildChain(
					[{word:startWord, weight:0}], 
					[{word:endWord, weight:0}], 
					allSynonyms.slice(0)
				);
				getShortestChain();
			}
		} else {
			callback("Your search has exceeded the capacity of the algorithm.  Please try a new search.");
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
		buildChain(
			[{word:startWord, weight:0}], 
			[{word:endWord, weight:0}], 
			allSynonyms.slice(0)
		);
		getShortestChain();
	}
}

exports.makeChain = makeChain;