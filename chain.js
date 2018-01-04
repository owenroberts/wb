const thesaurus = require('thesaurus');

function makeChain(query, allSynonyms, callback) {
	const startWord = query.start.toLowerCase();
	const endWord = query.end.toLowerCase();
	const reg = /^[a-z]+$/; /* eliminate words with non-alpha chars */

	const nodeNumberLimit = 20; // no chains more than this number of nodes
	const synonymLevel = query.synonymlevel;
	let currentNodeNumber = query.nodelimit; // try to get under this first
	let foundChain = false;

	function getSynonyms(word, allSynsCopy) {
		let tempSyns = thesaurus.find(word);
		let synonyms = [];
		for (let i = 0; i < tempSyns.length; i++) {
			let syn = tempSyns[i];
			if (reg.test(syn)
				&& allSynsCopy.indexOf(syn) == -1
				&& allSynsCopy.indexOf(syn+"s") == -1
				&& synonyms.length < 10) {
				synonyms.push({
					word: syn
				}); // tried making this just array but it hurts performance ???? 
			}
		}
		return synonyms;
	}

	function buildChain(startChain, endChain, allSyns) {
		let startIndex = startChain.length - 1;
		let endIndex = endChain.length - 1;
		let allSynsCopy = allSyns.slice(0);
		allSynsCopy.push(startChain[startIndex].word);
		allSynsCopy.push(endChain[endIndex].word);
		
		if (startChain[startIndex].synonyms === undefined) {
			startChain[startIndex].synonyms = getSynonyms(startChain[startIndex].word, allSynsCopy);
		}
		if (endChain[endIndex].synonyms === undefined) {
			endChain[endIndex].synonyms = getSynonyms(endChain[endIndex].word, allSynsCopy);
		}
		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			allSynsCopy.push( startChain[startIndex].synonyms[i].word );
		}
		for (let i = 0; i < endChain[endIndex].synonyms.length; i++) {
			allSynsCopy.push( endChain[endIndex].synonyms[i].word );
		}

		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			let startCopy =  startChain.slice(0);
			let startSyn = startChain[startIndex].synonyms[i];
			startCopy.push(startSyn);
			for (let j = 0; j < endChain[endIndex].synonyms.length; j++) {
				let endSyn = endChain[endIndex].synonyms[j];
				// attemptCount++;
				if (startSyn.word == endSyn.word && !foundChain) {
					foundChain = true;
					for (let h = endChain.length-1; h >= 0; h--) {
						startCopy.push( endChain[h] );
					}

					/* prepare the data for front end */
					const chain = [];
					chain[0] = { word: startWord };
					chain[startCopy.length - 1] = { word: endWord };
					let nextIndex = -1;
					for (let h = 1; h < startCopy.length - 1; h++) {
						chain[h] = {};
						chain[h].word = startCopy[h].word;
						chain[h].alts = [];
						const alts = startCopy[h + (h > (startCopy.length)/2 ? 1 : -1)].synonyms;
						for (let j = 0; j < alts.length; j++) {
							// syndex is the synonym level
							if (alts[j].word == chain[h].word) {
								chain[h].syndex = j;
							}
							chain[h].alts.push(alts[j].word);
						}
					}
					//console.log(chain);
					callback(null, chain);
				} else if (startChain.length + endChain.length < currentNodeNumber - 1 && !foundChain) {
					let endCopy = endChain.slice(0);
					endCopy.push(endSyn);
					buildChain(startCopy, endCopy, allSynsCopy);
				}
			}
		}
	}

	function getShortestChain() {
		if (currentNodeNumber < nodeNumberLimit) {
			currentNodeNumber++;
			if (!foundChain) {
				buildChain(
					[{word:startWord}], 
					[{word:endWord}], 
					allSynonyms.slice(0)
				);
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
		buildChain(
			[{word:startWord}], 
			[{word:endWord}], 
			allSynonyms.slice(0)
		);
		getShortestChain(); 
		/* should be called by build Chain at ending condition.... 
			but this didn't work for some reason? */
	}

}
exports.makeChain = makeChain;