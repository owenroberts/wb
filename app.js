var express = require('express'),
    sass = require('node-sass'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    routes = require('./routes/index'),
    wordnet = require('wordnet'),
    chain = require('./chain');

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
  console.log('MEMORY:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
  chain.makeChain(req.body.start, req.body.end, req.body.nodelimit, req.body.synonymlevel, function(err, data) {
    if (err) {
      res.render('index', {
        errormsg: err
      });
    } else {
      res.render('lookup', {
        title: data.start + " - " + data.end,
        start: data.start,
        path: data.path,
        end: data.end
      });
    }
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
