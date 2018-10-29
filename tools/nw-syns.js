var program = require('commander');
var Wordnet = require('node-wordnet');

var wordnet = new Wordnet();

program
    .version('0.0.1')
    .usage('<word>')
    .parse(process.argv);

var word = program.args[0];
var syn = program.args[1];

if (!word) {
    program.help();
}
var synonyms = [];
wordnet.lookup(word, function(results){
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        for (var h = 0; h < result.synonyms.length; h++) {
            synonyms.push(result.synonyms[h]);
        }
        for (var j = 0; j < result.ptrs.length; j++) {
            var ptr = result.ptrs[j] 
            if (ptr.pointerSymbol == "@") {
                wordnet.get(ptr.synsetOffset, ptr.pos, function(res) {
                    //console.log(res.synonyms);
                    for (var k = 0; k < res.synonyms.length; k++) {
                        //console.log(res.synonyms[k]);
                        synonyms.push(res.synonyms[k]); 
                    }
                });
            }
        }
    }
    var syns = [];
    for (var m = 0; m < synonyms.length; m++) {
        if (syns.indexOf(synonyms[m]) == -1) {
            syns.push(synonyms[m]);
        }
    }
    console.log(syns);
});




/*@
#p
;c
~
+*/

/*wordnet.lookupAsync("node").then(function(nodeResults) {
  return wordnet.lookupAsync("test").then(function(testResults){
    return [nodeResults, testResults];
  });
}).then(function(allResults){
  console.log("node " + allResults[0].length);
  console.log("test " + allResults[1].length);
}).catch(function(error){
  console.log(error);
});*/

/*wordnet.lookup("node", function(nodeResults) {
  console.log("node " + nodeResults.length);
  wordnet.lookup("test", function(testResults){
    console.log("test " + testResults.length);
  });
});*/
/*
wordnet.findSense("node#n#3", function(data) {
  console.log(data);
});*/

/*wordnet.lookup(word, function(results) {
    console.log(results.length);
    for (var i = 0; i < results.length; i++) {
    	var result = results[i];       
       	console.log(word + "#" + result.pos + "#" + Number(i+1));
        //console.log(result.synsetOffset);
        console.log(result.synonyms);
        //console.log(result.ptrs);
    }
});
*/
