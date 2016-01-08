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
var appCache = new NodeCache();

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
  var err;
  if (req.query.err instanceof Array) err = req.query.err[req.query.err.length - 1];
  else err = req.query.err;
  res.render('index', {
    errmsg: err
  });
});

app.get('/search', function(req, res) {

  var everypath = [];

  if (req.query.oldpath) {
    if (req.query.oldpath instanceof Array) {
      for (var i = 0; i < req.query.oldpath.length; i++) {
        everypath.push(appCache.get(req.query.oldpath[i]));
      } 
    } else {
      everypath.push(appCache.get(req.query.oldpath));
    }
  }

  var cacheString = req.query.start + req.query.nodelimit + req.query.end  + req.query.synonymlevel;
  cacheString.replace(/ /g, ""); // gets rid of any spaces that might throw error, probably better way to do this

  var cachedSearch = appCache.get(cacheString);
  
  if (cachedSearch == undefined) {
  
    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, [req.query.start], function(err, data) {
      if (err) {
        var cacheString = req.query.start + req.query.nodelimit + req.query.end  + req.query.synonymlevel;
        appCache.set(cacheString, {
          err: err
        });
        if (everypath.length > 0) err = "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again.";
        var ref = req.get('Referrer').split("&err")[0]; // splits off old errors
        res.redirect(ref+'&err='+err); 
      
      } else {  
        var cacheString = req.query.start + data.nodelimit + req.query.end  + req.query.synonymlevel;

        var newpath = {
          path: data.path,
          nodelimit: data.nodelimit,
          synonymlevel: req.query.synonymlevel,
          start: req.query.start,
          end: req.query.end,
          cname: cacheString
        };
        appCache.set(cacheString, newpath);
        res.render('search', {
          data: everypath.concat(newpath),
          errmsg: req.query.err
        });
      }
    });
  } else if (cachedSearch.err != undefined) {
    
    res.redirect(req.get('Referrer') + '&err=' + cachedSearch.err); 
  } else {
    res.render('search', {
      data: everypath.concat(cachedSearch),
      errmsg: req.query.err
    });
  }
});

app.get('/search/add', function(req, res) {
  var cacheString = req.query.start + req.query.nodelimit + req.query.end  + req.query.synonymlevel;  
  var cacheSearch = appCache.get(cacheString);
  if (cacheSearch == undefined) {
    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, [req.query.start], function(err, data) {
      if (err) {
        console.log("error:" + err);
        appCache.set(cacheString, {
          err: err
        });
        res.json({
          errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
        });
      } else {
        console.log("data: " + data);
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
      errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
    });
  } else {
    res.json({
      path: cacheSearch.data.path
    });
  }
});

app.get('/search/modified', function(req, res) {
  var cacheString = req.query.start + req.query.nodelimit + req.query.end  + req.query.synonymlevel;
  var cacheSearch = appCache.get(cacheString);
  if (cacheSearch == undefined) {
    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, req.query.allsynonyms, function(err, data) {
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


var getRandRange = function(min, max) {
  return Math.floor(Math.random() * (max -min + 1)) + min;
}

function objToString (obj) {
    var str = '';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str += p + '::' + obj[p] + '\n';
        }
    }
    return str;
}


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
