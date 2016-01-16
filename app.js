var express = require('express')
    ,   sass = require('node-sass')
    ,   path = require('path')
    ,   favicon = require('serve-favicon')
    ,   logger = require('morgan')
    ,   bodyParser = require('body-parser')
    ,   wordnet = require('wordnet')
    ,   NodeCache = require( "node-cache")
    ,   PathProvider = require('./pathprovider').PathProvider
    ,   chain = require('./chain');

var app = express();
var cache = new NodeCache();

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

var getQueryString = function(query) {
    var string = query.start + query.nodelimit + query.end + query.synonymlevel;
    string.replace(/ /g, ""); // gets rid of any spaces that might throw error, probably better way to do this
    string = string.toLowerCase();
    return string;
}

app.get('/search', function(req, res) {
    var queryString = getQueryString(req.query);
    var cacheSearch = cache.get(queryString);
    if (cacheSearch == undefined) {
        pathprovider.get(queryString, function(err, result) {
            if (err) console.log(err);
            else {
                if (result == null) {
                    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, [req.query.start], function(err, data) {
                        if (err) {
                            var path = {
                                queryString: queryString,
                                error: err,
                                searches: [new Date()]
                            };  
                            pathprovider.save(path, function(err) { console.log(err); });
                            cache.set(queryString, path);
                            if (req.get('Referrer').indexOf('?') === -1) res.redirect(req.get('Referrer')+'?err='+err);
                            else res.redirect(req.get('Referrer')+'&err='+err);     
                        } else {
                            var path = {
                                queryString: queryString,
                                path: data.path,
                                nodelimit: data.nodelimit,
                                synonymlevel: req.query.synonymlevel,
                                start: req.query.start,
                                end: req.query.end,
                                searches: [new Date()]
                            };
                            pathprovider.save(path, function(err) { console.log(err); });
                            cache.set(queryString, path);
                            res.render('search', { data: path });
                        }
                    });
                } else {

                    pathprovider.addSearchTime(queryString, function(err) { console.log(err) } );
                    cache.set(queryString, result);
                    res.render('search', { data: result });
                }
            }
        });
    } else if (cacheSearch.error) {
        pathprovider.addSearchTime(queryString, function(err) { console.log(err) } );
        if (req.get('Referrer').indexOf('?') === -1){
            res.redirect(req.get('Referrer') + '?err=' + cacheSearch.err);
        } else {
            res.redirect(req.get('Referrer') + '&err=' + cacheSearch.err); 
        }
    } else {
        console.log('wtf ' + queryString);
        pathprovider.addSearchTime(queryString, function(err) { console.log(err) } );
        res.render('search', { data: cacheSearch });
    }
});

app.get('/search/add', function(req, res) {
    var queryString = getQueryString(req.query);
    var cacheSearch = cache.get(queryString);

    if (cacheSearch == undefined) {
        pathprovider.get(queryString, function(err, result) {
            if (err) console.log(err);
            else {
                if (result == null) {
                    chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, [req.query.start], function(err, data) {
                        if (err) {
                            var path = {
                                queryString: queryString,
                                error: err,
                                searches: [new Date()]
                            };  
                            pathprovider.save(path, function(err) { console.log(err); });
                            cache.set(queryString, path);
                            res.json({
                                errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
                            });
                        } else {
                            var path = {
                                queryString: queryString,
                                path: data.path,
                                nodelimit: data.nodelimit,
                                synonymlevel: req.query.synonymlevel,
                                start: req.query.start,
                                end: req.query.end,
                                searches: [new Date()]
                            };
                            pathprovider.save(path, function(err) { console.log(err); });
                            cache.set(queryString, path);
                            res.json({  path: path.path });
                        }
                    });
                } else {
                    pathprovider.addSearchTime(queryString, function(err) { console.log(err) } );
                    cache.set(queryString, result);
                    res.render('search', { path: result.path });
                }

            }
        });
    } else if (cacheSearch.error) {
        res.json({
            errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
        });
    } else {
        res.json({ path: cacheSearch.data.path });
    }
});

app.get('/search/modified', function(req, res) {
    var queryString = getQueryString(req.query);
    var cacheSearch = cache.get(queryString);
    if (cacheSearch == undefined) {
        chain.makeChain(req.query.start, req.query.end, req.query.nodelimit, req.query.synonymlevel, req.query.allsynonyms, function(err, data) {
            if (err) {
                cache.set(queryString, { error: err });
                res.json({ errormsg: err });
            } else {
                cache.set(queryString, {
                    queryString: queryString,
                    path: data,
                    nodelimit: req.query.nodelimit,
                    synonymlevel: req.query.synonymlevel
                });
                res.json({ path: data.path });
            }
        });
    } else if (cacheSearch.error != undefined) {
        res.json({ errormsg: cacheSearch.error });
    } else {
        res.json({ path: cacheSearch.path });
    }
});


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