var thesaurus = require("thesaurus");

var makeChain = function(query, _synonyms, callback) {
	var start = query.start.toLowerCase();
	var end = query.end.toLowerCase();
	var reg = /^[a-z]+$/;

	var allpaths = [];
	var nodelimit = 20;
	var nodenumber = +query.nodelimit;
	var synonymlevel = +query.synonymlevel;
	
	var data = {};

	var attempts = 0;

	var buildPath = function(word, path, runagain, _allsyns) {
		
		var wordPath = path;
		var allsyns = _allsyns;
		allsyns.push(word);
		var tmp = thesaurus.find(word);
		var synonyms = [];
		for (var i = 0; i < tmp.length; i++) {
			if (reg.test(tmp[i]) 
				&& allsyns.indexOf(tmp[i]) == -1 
				&& allsyns.indexOf(tmp[i]+"s") == -1
				&& synonyms.length < 10 ) {
				synonyms.push(tmp[i]);
				allsyns.push(tmp[i]);
			}
		}

		if (synonyms.length > synonymlevel) {
			synonyms.splice(synonymlevel, synonyms.length - synonymlevel);
		}

		wordPath.push({
			node:word,
			synonyms:synonyms
		});

		for (var i = 0; i < synonyms.length; i++) {
			if (synonyms[i] == end) {
			  allpaths.push(wordPath);
			} else if (allpaths < 1) {
				// console.log(wordPath.length, nodenumber);
				if (runagain && wordPath.length < nodenumber) {
					var newpath = wordPath.slice(0);
					buildPath(synonyms[i], newpath, true, allsyns);
				} else {
					attempts++;
					// console.log("attempts " + attempts);
					if (attempts >= 10000) {
						callback("Youre search has exceeded the capacity of the algorithm.  Please try a new search.");
					}
				}
			}
		}
	}

	function sendData(newpath) {
		var finalpath = [];
		for (var i = 1; i < newpath.length; i++) {
			finalpath[i - 1] = {};
			finalpath[i - 1].node = newpath[i].node;
			finalpath[i - 1].alternates = newpath[i-1].synonyms;
		}
		data.path = finalpath;
		data.nodelimit = nodenumber;
		callback(null, data);
	}

	function getShortestPath() {
		if (allpaths.length > 0) {
			sendData(allpaths[0]);
		} else {
			if (nodenumber < nodelimit) {
				nodenumber++;
				buildPath(start, [], true, [start]);
				getShortestPath();
			} else {
				if (nodelimit == 20 && synonymlevel == 20) 
					callback("Your search has exceeded the capacity of the algorithm.  Please try a new search.");
				else
					callback("Your search was not able to be performed with the current parameters.");
			}
		}
	}

	if (start && end) {
		if (reg.test(start) && reg.test(end)) {
			if (start != end) {
				if (thesaurus.find(start).length > 0) {
					if (thesaurus.find(end).length > 0) {
						buildPath(start, [], true, [start]);
						getShortestPath();
					} else {
						callback("The second word was not found.");
					}
				} else {
					callback("The first word was not found.");
				}
			} else {
				callback("Please enter different words.");
			}
		} else {
			callback("Please enter single words with no spaces or dashes.");
		}
	} else {
		callback("Please enter two search words.");
	}
}
exports.makeChain = makeChain;