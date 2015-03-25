var express = require('express'),
    sass = require('node-sass'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    routes = require('./routes/index'),
    wordnet = require('wordnet'),
    thesaurus = require("thesaurus");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  sass.middleware({
    src: __dirname + '/public', //where the sass files are 
    dest: __dirname + '/public', //where css should go
    debug: true // obvious
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.render('index');
});
app.post('/lookup', function(req, res) {
  var start = req.body.start;
  var end = req.body.end;

  var allsynomyms = [start];
  var allpaths = [];
  var reg = /^[a-z]+$/;
  var nodelimit = req.body.nodelimit;
  var synonymlevel = req.body.synonymlevel;

  var findSynonyms = function(word, path, runagain) {
    
    var wordPath = path;
    wordPath.push(word);

    var tmp = thesaurus.find(word);
    var synonyms = [];
    for (var i = 0; i < tmp.length; i++) {
      //console.log(tmp[i]);
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
        //console.log("got it");
        //wordPath.push(end);
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

  findSynonyms(start, [], true);
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

  res.render('lookup', {
    start:req.body.start,
    path: allpaths[0],
    end:req.body.end
  });
});

var server = app.listen(3000, function() {
    var host = server.address().host;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});
    



// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
