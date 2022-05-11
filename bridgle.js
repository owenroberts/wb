/*
	bridgle game,
	manually connecting synonyms
*/

const lev = require('fast-levenshtein');
const thesaurus = require('thesaurus');
const fs = require('fs');
var chain = require('./new');

const bf = fs.readFileSync('./public/badwords.txt');
const badWords = bf.toString().split(/\r?\n/);

const Bridgle = function(db) {
	this.db = db;
}

function getSyns(word, filter) {
	filter = filter ? filter : [];
	return thesaurus.find(word)
		.filter(s => lev.get(word, s) > 1)
		.filter(s => !filter.includes(s))
		.filter(s => s.match(/^[a-z]+$/))
		.filter(s => s !== word)
		// .filter(s => !s.includes(word) && !word.includes(s))
		.filter(s => s.substring(0, s.length - 1) !== word)
		.filter(s => word.substring(0, word.length - 1) !== s)
		.filter(s => !badWords.includes(s))
		.slice(0, 12); // limit to 12 results
}

Bridgle.prototype.getData = async function(queryString) {
	let chain;
	const collection = this.db.db.collection('chains');

	if (queryString) {
		chain = await collection.findOne({ queryString: queryString });
	} else {
		const doc = await collection.aggregate([{ $match: { error: null }}, { $sample: { size: 1 } }]).toArray();
		chain = doc[0];
	}

	if (chain) {
		const { start, end, queryString } = chain;
		// random words like bot? -- make sure not the same word
		let startSynonyms = getSyns(start);
		let startSynSyns = {};
		let noSyns = []; // filter out syns with no syns
		startSynonyms.forEach(syn => {
			let syns = getSyns(syn, [start]);
			/*
				filter out syns with no syns ...
				in filter this becomes infinite loop
			*/
			if (syns.length > 0) {
				startSynSyns[syn] = syns;
			} else {
				noSyns.push(syn);
			}
		});
		startSynonyms = startSynonyms.filter(s => !noSyns.includes(s));
		const endSyonyms = getSyns(end);

		// what if end has no syns (this won't happen if chain already exists)

		return { start: start, end: end, startSynonyms: startSynonyms, endSyonyms: endSyonyms, startSynSyns: startSynSyns, queryString: queryString };
	} else {
		return { errmsg: 'Could not find a bridge.' };
	}
};

Bridgle.prototype.getSelection = function(word, usedWords) {
	let synonyms = getSyns(word, usedWords);
	let synonymSynonyms = {};
	const noSyns = []; // filter out syns with no syns

	synonyms.forEach(syn => {
		let syns = getSyns(syn, usedWords);
		// filter no syns
		if (syns.length > 0) {
			synonymSynonyms[syn] = syns;
		} else {
			noSyns.push(syn);
		}
	});
	synonyms = synonyms.filter(s => !noSyns.includes(s));

	if (synonyms.length === 0) return { error: 'There are no synonyms available.' };
	else return { synonyms: synonyms, synonymSynonyms: synonymSynonyms };
};

Bridgle.prototype.getHint = function(synonyms, endWord, usedWords, algoType, nodeLimit) {
	synonyms = synonyms.split(',');
	usedWords = usedWords.split(',');
	
	let count = 0;
	let len = 100;
	let syn = '';

	for (let i = 0; i < synonyms.length; i++) {
		let query = {
			start: synonyms[i],
			end: endWord,
			nodeLimit: nodeLimit,
			synonymLevel: 10
		};
		let c = chain.makeChain(query, usedWords, algoType);
		if (!c.error) {
			if (algoType === 'chainCount') {
				if (c.chainCount > count) {
					syn = synonyms[i];
					count = c.chainCount;
				}
			} else {
				if (c.length < len) {
					syn = synonyms[i];
					len = c.length;
					console.log(c.length, c.map(n => n.word));
				}
			}
		}
	}
	let data = this.getSelection(syn, usedWords);
	return { ...data, selection: syn };
};


exports.Bridgle = Bridgle;
