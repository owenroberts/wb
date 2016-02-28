var express = require('express')
   /* ,   sass = require('node-sass')*/
    ,   path = require('path')
    ,   favicon = require('serve-favicon')
    ,   logger = require('morgan')
    ,   bodyParser = require('body-parser')
    ,   wordnet = require('wordnet')
    ,   NodeCache = require( "node-cache")
    ,   PathProvider = require('./pathprovider').PathProvider
    ,   chain = require('./chain')
    ,   def = require('./def');

var app = express();
var cache = new NodeCache();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/*app.use(
    sass.middleware({
        src: __dirname + '/public', //where the sass files are 
        dest: __dirname + '/public', //where css should go
        debug: true // obvious
    })
);*/

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
    getPath(req, function(result) {
        if (result.error) {
            if (req.get('Referrer').indexOf('?') === -1) 
                res.redirect(req.get('Referrer')+'?err='+result.error);
             else 
                res.redirect(req.get('Referrer')+'&err='+result.error);
        } else res.render('search', { data: result });
    });
});

app.get('/search/add', function(req, res) {
    getPath(req, function(result) {
        if (result.error)
            res.json({
                errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
            });
        else res.json({ data: result });
    });
});

app.get('/search/modified', function(req, res) {
    getPath(req, function(result) {
        if (result.error) res.json({ errormsg: result.error });
        else res.json({ data: result });
    });
});

app.get('/def', function(req, res){
    def.getDef(req.query.word, req.query.syn, function(err, result) {
        if (err) res.json({ errormsg: err });
        else res.json({ data: result });
    });
});

var getPath = function(request, callback) {
    var allsynonyms;
    if (request.query.allsynonyms) allsynonyms = request.query.allsynonyms;
    else allsynonyms = [request.query.start];
    var string = request.query.start + request.query.nodelimit + request.query.end + request.query.synonymlevel;
    string.replace(/ /g, ""); // gets rid of any spaces that might throw error, probably better way to do this
    string = string.toLowerCase();
    var query = {
        queryString: string,
        start: request.query.start,
        end: request.query.end,
        nodelimit: request.query.nodelimit,
        synonymlevel: request.query.synonymlevel,
        searches: [{ip:request.connection.remoteAddress, date: new Date()}]
    };
    var cacheSearch = cache.get(query.queryString);
    if (cacheSearch == undefined) {
        pathprovider.get(query.queryString, function(err, result) {
            if (err) console.log(err);
            else {
                if (result == null) {
                    chain.makeChain(query, allsynonyms, function(err, data) {
                        if (err) query.error = err;
                        else query.path = data.path;
                        pathprovider.save(query, function(err) { console.log(err); });
                        cache.set(query.queryString, query);
                        callback(query);
                    });
                } else {
                    pathprovider.addSearchTime(query, function(err) { console.log(err) } );
                    cache.set(query.queryString, result);
                    callback(result);
                }
            }
        });
    } else {
        callback(cacheSearch);
    }
};

function getRandomInt(min, max) {
    return Math.floor(Math.random()* ( max - min + 1) + min);
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
var mongoUri = process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'localhost';
var pathprovider = new PathProvider(mongoUri);
    
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