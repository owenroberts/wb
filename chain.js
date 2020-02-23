const thesaurus = require('thesaurus'); /* based on wordnet.princeton.edu */

function makeChain(query, allSynonyms, callback) {
	const startWord = query.start.toLowerCase();
	const endWord = query.end.toLowerCase();
	console.log(startWord, endWord, allSynonyms);
	const reg = /^[a-z]+$/; /* eliminate words with non-alpha chars */

	const nodeNumberLimit = 20; // no chains more than this number of nodes
	const synonymLevel = query.synonymLevel; // cut list of synonyms for each word off at this limit
	let currentNodeNumber = query.nodeLimit; // this is original node limit, up to nodeNumberLimit
	let foundChain = false;
	let attemptCount = 0;

	/* test for missing words, words not in db */
	if (!startWord || !endWord) {
		callback("Please enter two search words.");
	} else if (!reg.test(startWord) || !reg.test(endWord)) {
		callback("Please enter single words with no spaces or special characters.");
	} else if (startWord == endWord) {
		callback("Please enter different words.");
	} else if (getSynonyms(startWord, []).length == 0) {
		callback("The first word was not found.");
	} else if (getSynonyms(endWord, []).length == 0) {
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
				if (!foundChain) getChain();
			}
		} else {
			callback(`Your search was not able to be performed with the current parameters. ${attemptCount} attempts.`);
		}
	}

	/* get synonyms of word up to synonym limit 
		except synonyms already used */
	function getSynonyms(word, allSynsCopy) {
		const tempSyns = thesaurus.find(word);
		const synonyms = [];
		for (let i = 0; i < tempSyns.length; i++) {
			const syn = tempSyns[i];
			if (reg.test(syn)
				&& allSynsCopy.indexOf(syn) == -1
				&& allSynsCopy.indexOf(syn + "s") == -1
				&& synonyms.length < 10) {
				synonyms.push({ word: syn }); // tried as array but hurts performance not sure why 
			}
		}
		// if (word == 'time') {
		// 	console.log(word, synonyms, allSynsCopy);
		// }
		return synonyms;
	}

	/* recursively builds chains one node at a time 
		uses one chain starting with start and one with end
		advances each one at a time until meets in the middle */
	function buildChain(startChain, endChain, allSyns) {

		const startIndex = startChain.length - 1;
		const endIndex = endChain.length - 1;
		let allSynsCopy = allSyns.slice(0);
		
		// get synonyms of last word in start chain 
		startChain[startIndex].synonyms = getSynonyms(startChain[startIndex].word, allSynsCopy);

		// add new syns to all syns
		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			allSynsCopy.push(startChain[startIndex].synonyms[i].word);
		}

		// test each new syn again the syns of last word in end chain
		for (let i = 0; i < startChain[startIndex].synonyms.length; i++) {
			const startCopy = startChain.slice(0); // object values will be refs, won't push new ones
			const startSyn = startChain[startIndex].synonyms[i];
			startCopy.push(startSyn);
			
			// endchain already has syns bc it was previous start chain
			for (let j = 0; j < endChain[endIndex].synonyms.length; j++) {
				const endSyn = endChain[endIndex].synonyms[j];
				attemptCount++;
				if (startSyn.word == endSyn.word && !foundChain) {
					foundChain = true;

					// if chain is found, add endchain to start chain in reverse order
					for (let k = endChain.length - 1; k >= 0; k--) {
						startCopy.push( endChain[k] );
					}

					// format data for front end
					const chain = [];
					chain[0] = { word: startWord };
					chain[startCopy.length - 1] = { word: endWord };
					let nextIndex = -1;
					for (let k = 1; k < startCopy.length - 1; k++) {
						chain[k] = {};
						chain[k].word = startCopy[k].word;
						chain[k].alts = [];  // save synonym alternatives for swapping syns
						const alts = startCopy[k + (k > startCopy.length - 2 ? 1 : -1)].synonyms;
						for (let l = 0; l < alts.length; l++) {
							// syndex is the synonym "level", index in syn list
							if (alts[l].word == chain[k].word) chain[k].syndex = l;
							chain[k].alts.push(alts[l].word);
						}
					}
					callback(null, chain); // send data back to app.js
					return;
				} 
			}
			// if chain hasn't been found keep building chains
			if (startCopy.length + endChain.length < currentNodeNumber && !foundChain) {
				buildChain(startCopy, endChain, allSynsCopy); /* fastest ?*/
			}
			/* current version no longer swaps start and end
				start just builds to end syns
				better performance, perhaps because fewer for loops per attempt? */
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