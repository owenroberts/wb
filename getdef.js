var program = require('commander');
var wordnet = require('wordnet');

program
  .version('0.0.1')
  .usage('<word>')
  .parse(process.argv);

var word = program.args[0];
var syn = program.args[1];

if (!word) {
  program.help();
}

wordnet.lookup(word, function(err, definitions) {
    if (err) {
        console.log('An error occured: %s', err);
        return;
    }
    
    console.log(word);
    console.log("defs " + definitions.length);
    //console.log(definitions);
    
    definitions.forEach(function(definition) {


        function printWord(definition) {


            console.log(definition.meta);

            for (var i = 0; i < definition.meta.words.length; i++) {
                if (definition.meta.words[i].word == syn) {
                    //console.log(definition.meta.synsetType);
                    //console.log(definition.glossary);
                    //break;
                }
            }
            
            for (var p = 0; p < definition.meta.pointers.length; p++) {
                var pointer =  definition.meta.pointers[p];

                //console.log(pointer.data.meta.words);

                for (var w = 0; w < pointer.data.meta.words.length; w++) {
                    if (pointer.data.meta.words[w].word == syn) {
                        //console.log(definition.meta.synsetType);
                        //console.log(definition.glossary);
                        //break;
                    }
                }
            }

        }
        printWord(definition);
    });
});