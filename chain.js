const thesaurus = require('thesaurus');

function makeChain(query, allSynonyms, callback) {
	const startWord = query.start.toLowerCase();
	const endWord = query.end.toLowerCase();
	const reg = /^[a-z]+$/; /* eliminate words with non-alpha chars */

	const nodeNumberLimit = 20; // no chains more than this number of nodes
	const synonymLevel = query.synonymLevel;
	let currentNodeNumber = query.nodeLimit; // try to get under this first
	let foundChain = false;
	let attemptCount = 0;

	if (!startWord || !endWord) {
		callback("Please enter two search words.");
	} else if (!reg.test(startWord) || !reg.test(endWord)) {
		callback("Please enter single words with no spaces or special characters.");
	} else if (startWord == endWord) {
		callback("Please enter different words.");
	} else if (thesaurus.find(startWord).length == 0) {
		callback("The first word was not found.");
	} else if (thesaurus.find(endWord).length == 0) {
		callback("The second word was not found.");
	} else {
		getChain(); 
	}

	function getChain() {
		if (currentNodeNumber < nodeNumberLimit) {
			currentNodeNumber++; // for next chain
			if (!foundChain) {
				buildChain(
					[{word:startWord}], 
					[{ word:endWord, synonyms: getSynonyms(endWord, allSynonyms.slice(0)) }], 
					allSynonyms.slice(0)
				);
				if (!foundChain) {
					console.log( 'still going',  attemptCount );
					getChain();
				}
			}
		} else {
			callback(`Your search was not able to be performed with the current parameters. ${attemptCount} attempts.`);
		}
	}

	function getSynonyms(word, allSynsCopy) {
		const tempSyns = thesaurus.find(word);
		const synonyms = [];
		for (let i = 0; i < tempSyns.length; i++) {
			const syn = tempSyns[i];
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

		const startIndex = startChain.length - 1;
		const endIndex = endChain.length - 1;
		const allSynsCopy = allSyns.slice(0);
		
		startChain[startIndex].synonyms = getSynonyms(startChain[startIndex].word, allSynsCopy);

		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			allSynsCopy.push(startChain[startIndex].synonyms[i].word);
		}

		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			const startCopy =  startChain.slice(0); // object values will be refs, won't push new ones
			const startSyn = startChain[startIndex].synonyms[i];
			startCopy.push(startSyn);
			
			for (let j = 0; j < endChain[endIndex].synonyms.length; j++) {
				const endSyn = endChain[endIndex].synonyms[j];
				attemptCount++;
				// console.log('attempt', attemptCount);
				if (startSyn.word == endSyn.word && !foundChain) {
					foundChain = true;
					for (let k = endChain.length-1; k >= 0; k--) {
						startCopy.push( endChain[k] );
					}

					/* prepare the data for front end */
					const chain = [];
					chain[0] = { word: startWord };
					chain[startCopy.length - 1] = { word: endWord };
					let nextIndex = -1;
					for (let k = 1; k < startCopy.length - 1; k++) {
						chain[k] = {};
						chain[k].word = startCopy[k].word;
						chain[k].alts = [];
						const alts = startCopy[k + (k > startCopy.length - 2 ? 1 : -1)].synonyms;
						for (let l = 0; l < alts.length; l++) {
							if (alts[l].word == chain[k].word) {
								chain[k].syndex = l;
							} // syndex is the synonym level
							chain[k].alts.push(alts[l].word);
						}
					}
					// console.log(chain); /* the first working chain */
					callback(null, chain);
					return;
				} 
			}
			//  console.log('word', startChain[startIndex].word, 'len', startCopy.length + endChain.length, 'nn', currentNodeNumber)
			// might need an attempt limit re: green -> avocado, mod chromatic to party
			
			if (startCopy.length + endChain.length < currentNodeNumber && !foundChain) {
				buildChain(startCopy, endChain, allSynsCopy); /* fastest ?*/
			}
		}
		if (attemptCount > 1000000) {
			if (!foundChain) {
				callback(`Your search was aborted after ${attemptCount} attempts.`);
				foundChain = true;
			}
			return;
		}
	}
}
exports.makeChain = makeChain;