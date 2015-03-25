var thesaurus = require("thesaurus");

var makeChain = function(startWord, endWord, limit, level, callback) {
  var start = startWord;
  var end = endWord;

  var allsynomyms = [start];
  var allpaths = [];
  var reg = /^[a-z]+$/;
  var nodelimit = limit;
  var synonymlevel = level;

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
      if (runagain && wordPath.length < nodelimit) {
        var newpath = wordPath.slice(0);
        findSynonyms(synonyms[i], newpath, true);
      }
    }
  }

  function shortestPath() {
    if (allpaths.length > 0) {
      console.log(allpaths.length);
      console .log(allpaths[0]);
    } else {
      allsynomyms = [start];
      nodelimit++;
      findSynonyms(start, [], true);
      shortestPath();
    }
  }
  shortestPath();

  var data = {};
  data.start = start;
  data.end = end;
  data.path = allpaths[0];

  callback(data);
}

exports.makeChain = makeChain;