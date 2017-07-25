const natural = require('natural');
const wordnet = new natural.WordNet();

function getDef(word, callback) {
	wordnet.lookup(word, function(results){
		callback(null, results);
	})
}

exports.getDef = getDef;