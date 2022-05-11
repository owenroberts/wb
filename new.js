/* 
	creates a chain from two words
	responds with chain data or errors states

	thesaurus based on MyThes, 
	generated from wordnet.princeton.edu, 
	http://www.danielnaber.de/wn2ooo/ 

	lev is slow but useful for eliminating similar words ... 
*/
const thesaurus = require('thesaurus');
const lev = require('fast-levenshtein');

const nonAlphaFilterRegex = /^[a-z]+$/; /* eliminate words with non-alpha chars */
const attemptLimit = 1000000;
let synonymLevel = 10;

function getSynonyms(word, filter) {
	const synonyms = [];
	const temp = thesaurus.find(word);
	for (let i = 0; i < temp.length; i++) {
		if (synonyms.length > synonymLevel) return synonyms;
		if (!nonAlphaFilterRegex.test(temp[i])) continue;
		if (lev.get(word, temp[i]) <= 1) continue;
		if (filter.includes(temp[i])) continue;
		// test lev on all filter words ?? -- too perfy
		synonyms.push(temp[i]); // ??
	}
	return synonyms;
}

function makeChain(query, usedWords, whichAlgo) {

	const startWord = query.start.toLowerCase();
	const endWord = query.end.toLowerCase();
	synonymLevel = query.synonymLevel; // cut list of synonyms for each word off at this limit
	const nodeLimit = query.nodeLimit;
	
	const terminals = getSynonyms(endWord, []); // these are the ending words for the algo
	const terminalsLength = terminals.length;
	const startSynonyms = getSynonyms(startWord, usedWords); 

	let attemptCount = 0; // track attempts for analytics

	/* test for missing words, words not in db */
	if (!startWord || !endWord) return { error: "Please enter two search words." };
	if (startWord === endWord) return { error: "Please enter different words." };
	
	if (!nonAlphaFilterRegex.test(startWord) || !nonAlphaFilterRegex.test(endWord)) {
		return { error: "Please enter single words with no spaces or special characters." };
	}
	
	if (terminals.length == 0) {
		return { error: "The second word has no viable synonyms." };
	}

	if (startSynonyms.length == 0) {
		return { error: "The first word has no viable synonyms." };
	}

	let chainCount = 0;
	if (whichAlgo === 'chainCount') {
		depthFirst([startWord], usedWords.slice(), true);
		return { chainCount: chainCount };
	}

	let chain = whichAlgo === 'breadthFirst' ?
		breadthFirst(startSynonyms.map(s => [startWord, s])) :
		depthFirst([startWord], usedWords.slice());
		
	if (chain) {
		return returnChain(chain);
	} else {
		return { error: 'A bridge could not be made with the current parameters. }' };
	}

	/* 
		main algo function, recursively builds a chain
	*/
	function depthFirst(chain, usedWords, countChains) {
		
		const chainClone = chain.slice(); // clone chain
		const usedClone = usedWords.slice();
		const synonyms = getSynonyms(chainClone[chainClone.length - 1], usedClone);
		const len = synonyms.length;
		
		for (let i = 0; i < len; i++) {
			usedClone.push(synonyms[i]);
		}
		
		for (let i = 0; i < len; i++) {
			attemptCount++;
			// console.log(chainClone.lenth);
			if (terminals.includes(synonyms[i])) {
				if (countChains) {
					// console.log(chainCount);
					chainCount++;
				} else {
					chainClone.push(synonyms[i]);
					return chainClone;	
				}
			}

			// here's the recursive part, start a new chain with each synonym
			if (chainClone.length < nodeLimit) {
				const newClone = chainClone.slice();
				newClone.push(synonyms[i]);
				let b = depthFirst(newClone, usedClone, countChains); // perf test
				if (b) return b;
			}
		}

		if (attemptCount > attemptLimit) {
			return { error: `Your search was aborted after ${attemptCount} attempts.` };
		}
	}

	function breadthFirst(chains) {
		// chains is a list of started chains [[start, syn], [start, syn]] etc
		let nextSynonyms = []; // collect all synonyms that come after this level
		for (let i = 0, len = chains.length; i < len; i++) {
				let chain = chains[i].slice();
				let end = chain[chain.length - 1];
				for (let j = 0; j < terminalsLength; j++) {
					if (end === terminals[j]) {
						chain.push(terminals[j]);
						return chain; // this is the chain
					}
				}
				let syns = getSynonyms(end, chain);
				if (end === 'low') console.log(end, 'syns: ', syns.join(', '));
				for (let j = 0, l = syns.length; j < l; j++) {
					let newChain = chain.slice();
					newChain.push(syns[j]);
					nextSynonyms.push(newChain);
				}
		}
		let b = breadthFirst(nextSynonyms);
		if (b) return b;

		if (attemptCount > attemptLimit) {
			return { error: `Your search was aborted after ${attemptCount} attempts.` };
		}
	}

	function returnChain(chain) {
		const data = [{ word: startWord }];
		for (let i = 1; i < chain.length - 1; i++) {
			const alts = getSynonyms(chain[i - 1], chain.slice(0, i - 1));
			const syndex = 
			data[i] = { 
				word: chain[i],
				alts: alts,
				syndex: alts.indexOf(chain[i])
			};
		}
		data.push({ word: endWord });
		return data;
	}
}

exports.makeChain = makeChain;