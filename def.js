const natural = require('natural');
const wordnet = new natural.WordNet();

function getDef(word, synonym, callback) {
	wordnet.lookup(word, function(results) {
		var data = [];
		console.log(synonym);
		for (let i = 0; i < results.length; i++) {
			if (results[i].synonyms.indexOf(synonym) != -1) {
				data.push(results[i]);
			}
		}
		if (data.length > 0) 
			callback(null, data);
		else
			callback(null, results);
	})
}

exports.getDef = getDef;