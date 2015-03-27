var thesaurus = require("thesaurus");

var makeChain = function(startWord, endWord, limit, level, callback) {
  var start = startWord;
  var end = endWord;
  var reg = /^[a-z]+$/;

  var allsynomyms = [start];
  var allpaths = [];
  var nodelimit = limit;
  var nodenumber = 0;
  var synonymlevel = level;
  var data = {};
  data.start = start;
  data.end = end;

  var findSynonyms = function(word, path, runagain) {
    
    var wordPath = path;
    wordPath.push(word);

    var tmp = thesaurus.find(word);
    var synonyms = [];
    for (var i = 0; i < tmp.length; i++) {
      if (reg.test(tmp[i]) 
        && allsynomyms.indexOf(tmp[i]) == -1 
        && allsynomyms.indexOf(tmp[i]+"s") == -1
        && synonyms.length < 10 ) {
        synonyms.push(tmp[i]);
        allsynomyms.push(tmp[i]);
      }
    }
    for (var i = 0; i < synonyms.length; i++) {
      if (synonyms[i] == end) {
        allpaths.push(wordPath);
      }
    }

    for (var i = 0; i < synonyms.length; i++) {
      //console.log(word, i, synonyms[i], wordPath.length);
      if (runagain && wordPath.length < nodenumber) {
        var newpath = wordPath.slice(0);
        findSynonyms(synonyms[i], newpath, true);
      }
    }
  }

  function shortestPath() {
    if (allpaths.length > 0) {
      data.path = allpaths[0];
      callback(null, data);
    } else {
      allsynomyms = [start];
      if (nodenumber < nodelimit) nodenumber++;
      findSynonyms(start, [], true);
      shortestPath();
    }
  }

  if (reg.test(start) && reg.test(end)) {
    if (thesaurus.find(start).length > 0) {
      if (thesaurus.find(end).length > 0) {
        shortestPath();
      } else {
        callback("Your second word was not found.");
      }
    } else {
      callback("Your first word was not found.");
    }
  } else {
    callback("Please input single words with all lower case letters.");
  }

}

exports.makeChain = makeChain;