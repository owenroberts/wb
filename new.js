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

function getSynonyms(word, filter) {
	const synonyms = [];
	const temp = thesaurus.find(word);
	for (let i = 0; i < temp.length; i++) {
		if (synonyms.length > 10) return synonyms;
		if (!nonAlphaFilterRegex.test(temp[i])) continue;
		if (lev.get(word, temp[i]) <= 1) continue;
		if (filter.includes(temp[i])) continue;
		// test lev on all filter words ?? -- too perfy
		synonyms.push(temp[i]); // ??
	}
	return synonyms;
}

function makeChain(query, usedWords, callback) {

	const startWord = query.start.toLowerCase();
	const endWord = query.end.toLowerCase();
	const synonymLevel = query.synonymLevel; // cut list of synonyms for each word off at this limit
	const nodeLimit = query.nodeLimit;
	
	let foundChain = false; // end all chains when one is found
	let attemptCount = 0; // track attempts for analytics
	let terminals = getSynonyms(endWord, []); // these are the ending words for the algo

	/* test for missing words, words not in db */
	if (!startWord || !endWord) return { error: "Please enter two search words." };
	if (startWord === endWord) return { error: "Please enter different words." };
	
	if (!nonAlphaFilterRegex.test(startWord) || !nonAlphaFilterRegex.test(endWord)) {
		return { error: "Please enter single words with no spaces or special characters." };
	}
	
	if (terminals.length == 0) {
		return { error: "The second word has no viable synonyms." };
	}

	if (getSynonyms(startWord, usedWords).length == 0) {
		return { error: "The first word has no viable synonyms." };
	}

	let chain = build([startWord], usedWords.slice()); // copy of usedWords -- perf test here
	if (chain) {
		return returnChain(chain);
	} else {
		return { error: 'A bridge could not be made with the current parameters. }' };
	}

	/* 
		main algo function, recursively builds a chain
	*/
	function build(chain, usedWords) {
		
		const chainClone = chain.slice(); // clone chain
		const usedClone = usedWords.slice();
		const synonyms = getSynonyms(chainClone[chainClone.length - 1], usedClone);
		const len = synonyms.length;
		
		for (let i = 0; i < len; i++) {
			usedClone.push(synonyms[i]);
		}
		
		for (let i = 0; i < len; i++) {
			attemptCount++;
			if (terminals.includes(synonyms[i])) {
				foundChain = true;
				chainClone.push(synonyms[i]);
				return chainClone;
			}

			// here's the recursive part, start a new chain with each synonym
			if (chainClone.length < nodeLimit) {
				const newClone = chainClone.slice();
				newClone.push(synonyms[i]);
				let b = build(newClone, usedClone); // perf test
				if (b) return b;
			}
		}


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