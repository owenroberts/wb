const express = require('express')
	,	path = require('path')
	,	favicon = require('serve-favicon')
	,	logger = require('morgan')
	,	bodyParser = require('body-parser')
	,	wordnet = require('wordnet')
	,	NodeCache = require( "node-cache")
	,	PathProvider = require('./pathprovider').PathProvider
	,	chain = require('./chain')
	,	def = require('./def')
	,	url = require('url')
	,	pug = require('pug')
	;

var app = express();
var cache = new NodeCache();
cache.set("tooltips", false);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	var err;
	if (req.query.err instanceof Array) 
		err = req.query.err[req.query.err.length - 1];
	else err = req.query.err;
	res.render('index', {
		errmsg: err
	});
});

app.get('/search', function(req, res) {
	/* loadChain for production, makeChain to skip db/cache */
	makeChain(req, function(result) {
		if (result.error) {
			res.redirect(url.format({
				pathname: req.get('Referrer').split("?")[0],
				query: {
					"err": result.error
				}
			}));
		} else {
			res.render('search', { 
				data: result,
				tooltips: cache.get("tooltips")
			});
		}
	});
});

app.get('/search/add', function(req, res) {
	/* loadChain for production, makeChain to skip db/cache */
	makeChain(req, function(result) {
		if (result.error)
			res.json({
				errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
			});
		else res.json({ data: result });
	});
});

app.get('/search/modified', function(req, res) {
	/* don't load bc could have duplicate synonyms
		maybe still save? */ 
	makeChain(req, function(result) {
		if (result.error) res.json({ errormsg: result.error });
		else res.json({ data: result });
	});
});

app.get('/def', function(req,res) {
	def.getDef(req.query.word, req.query.synonym, function(err, result) {
		if (err) console.log(err);
		else res.json({ data: result });
	})
});

function loadChain(request, callback) {
	var queryString = makeQueryString(request);
	var cacheSearch = cache.get(queryString);
	if (cacheSearch == undefined) {
		pathprovider.get(queryString, function(err, result) {
			if (err) console.log(err);
			else {
				if (result == null) {
					makeChain(request, callback);
				} else {
				 	pathprovider.addSearchTime(queryString, function(err) { console.log(err) } );
				 	cache.set(queryString, result);
				 	callback(result);
				}
			}
		});
	} else {
		callback(cacheSearch);
	}
}

function makeChain(request, callback) {
	var allsynonyms;
	if (request.query.as) 
		allsynonyms = request.query.as;
	else 
		allsynonyms = [request.query.s];
	var query = {
		queryString: makeQueryString(request),
		start: request.query.s.replace(/ /g, ""),
		end: request.query.e.replace(/ /g, ""),
		nodelimit: request.query.nl,
		synonymlevel: request.query.sl,
		searches: [{loc:"tk", date: new Date()}]
	};
	chain.makeChain(query, allsynonyms, function(err, chain) {
		//console.log(data);
		if (err) query.error = err;
		else query.chain = chain; 
		/* this is removing all the extra data for some reason? 
			should combine search data with weighting data? */
		pathprovider.save(query, function(err) { console.log(err); });
		cache.set(query.queryString, query);
		callback(query);
	});
}

function makeQueryString(request) {
	let startWord = request.query.s;
	let endWord = request.query.e;
	if (!startWord) {
		let words = endWord.split(" ");
		if (words[0].length > 0 && words[1].length > 0) {
			startWord = words[0];
			endWord = words[1];
		}
	} else if (!endWord) {
		let words = startWord.split(" ");
		if (words[0].length > 0 && words[1].length > 0) {
			startWord = words[0];
			endWord = words[1];
		}
	}
	var string = startWord + request.query.nl + endWord + request.query.sl;
	string = string.toLowerCase().replace(/ /g, ""); // remove spaces 
	return string;
}

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