var express = require('express'),
    sass = require('node-sass'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    routes = require('./routes/index'),
    wordnet = require('wordnet'),
    NodeCache = require( "node-cache" )
    chain = require('./chain');

var app = express();


// cache stuff
var appCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

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

app.get('/search', function(req, res) {
  var cacheString = req.query.start + req.query.end + req.query.nodelimit + req.query.synonymlevel;
  var cachedSearch = appCache.get(cacheString);
  if (cachedSearch == undefined) {
    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, function(err, data) {
      if (err) {
        appCache.set(cacheString, {
          err: err
        });
        res.render('index', {
          errormsg: err
        });
      } else {
        appCache.set( cacheString, {
          data:data,
          nodelimit: req.query.nodelimit,
          synonymlevel: req.query.synonymlevel
        });
        res.render('search', {
          nodelimit: req.query.nodelimit,
          synonymlevel: req.query.synonymlevel,
          start:data.path[0].node,
          end:data.path[data.path.length - 1].node,
          title: data.path[0].node + " - " + data.path[data.path.length - 1].node,
          path: data.path
        });
      }
    });
  } else if (cachedSearch.err != undefined) {
    res.render('index', {
      errormsg: cachedSearch.err
    });
  }
  else {
    res.render('search', {
      nodelimit: cachedSearch.nodelimit,
      synonymlevel: cachedSearch.synonymlevel,
      start: cachedSearch.data.path[0].node,
      end: cachedSearch.data.path[cachedSearch.data.path.length - 1].node,
      title: cachedSearch.data.path[0].node + " - " + cachedSearch.data.path[cachedSearch.data.path.length - 1].node,
      path: cachedSearch.data.path
    });
  }
  
});

app.get('/search/modified', function(req, res) {
  var cacheString = req.query.start + req.query.end + req.query.nodelimit + req.query.synonymlevel;
  var cacheSearch = appCache.get(cacheString);
  if (cacheSearch == undefined) {
    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, function(err, data) {
      if (err) {
        appCache.set(cacheString, {
          err: err
        });
        res.json({
          errormsg: err
        });
      } else {
        appCache.set(cacheString, {
          data: data,
          nodelimit: req.query.nodelimit,
          synonymlevel: req.query.synonymlevel
        });
        res.json({
          path: data.path
        });
      }
    });
  } else if (cacheSearch.err != undefined) {
    res.json({
      errormsg: cacheSearch.err
    });
  } else {
    res.json({
      path: cacheSearch.data.path
    });
  }
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
