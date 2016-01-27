var wordnet = require('wordnet');

var getDef = function(word, syn, callback) {
    var data = {};
    wordnet.lookup(word, function(err, definitions) {
        if (err) {
            callback("defjs " + err);
            return;
        }
        definitions.forEach(function(definition) {

            function printWord(definition) {
          
                for (var i = 0; i < definition.meta.words.length; i++) {
                    if (definition.meta.words[i].word == syn) {
                        data.pos = definition.meta.synsetType;
                        data.def = definition.glossary;
                        break;
                    }
                }
                
                for (var p = 0; p < definition.meta.pointers.length; p++) {
                    var pointer =  definition.meta.pointers[p];
                    for (var w = 0; w < pointer.data.meta.words.length; w++) {
                        if (pointer.data.meta.words[w].word == syn) {
                            data.pos = definition.meta.synsetType;
                            data.def = definition.glossary;
                            break;
                        }
                    }
                }   
            }
            printWord(definition);
        });
        if (!data.pos) callback("No definition available");
        else callback(null, data);
    });
    
}

exports.getDef = getDef;