const natural = require('natural');
const wordnet = new natural.WordNet();
const program = require('commander');
program
	.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);

const thesaurus = require("thesaurus");
const word = program.args[0];

console.log('from thesaurus', thesaurus.find(word));
const lemmas = [];


wordnet.lookup(word, results => {
	console.log('from nltk', results.flatMap(r => r.synonyms));
	// console.log(results.flatMap(r => r.ptrs));
	const pointers = results.flatMap(r => r.ptrs).filter(ptr => '@&~'.includes(ptr.pointerSymbol)); // hypernym or hyponym, similar to
	// console.log(pointers);
	
	pointers.forEach((p, i) => {
		wordnet.get(p.synsetOffset, p.pos, result => {
			lemmas.push(result.lemma);
			if (lemmas.length === pointers.length) {
				console.log('lemmas', lemmas);
			}
		});
		
	});
});


