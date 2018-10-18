const express = require('express')
	,	path = require('path')
	,	favicon = require('serve-favicon')
	,	logger = require('morgan')
	,	bodyParser = require('body-parser')
	,	wordnet = require('wordnet')
	,	NodeCache = require('node-cache')
	,	PathProvider = require('./pathprovider').PathProvider
	,	chain = require('./chain')
	,	def = require('./def')
	,	url = require('url')
	,	handlebars = require('express-handlebars')
	;

const app = express();
const cache = new NodeCache();
const tips = true;
const cachedTips = cache.get("tips");
if (!cachedTips) {
	cache.set("tips", tips);
}

const hbs = handlebars.create({
	defaultLayout: "main",
	helpers: {
		json: function(content) {
			return JSON.stringify(content);
		},
		lessThan: function(n1, n2, options) {
			if (n1 < n2) 
				return options.fn(this);
			else 
				return options.inverse(this);
		}
	}
});

// view engine setup
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	let err;
	if (req.query.err instanceof Array) 
		err = req.query.err[req.query.err.length - 1];
	else 
		err = req.query.err;
	res.render('index', {
		errmsg: err
	});
});

app.get('/search', function(req, res) {
	makeChain(req, function(result) { /* loadChain for production, makeChain to skip db/cache */
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
				tips: cache.get("tips")
			});
		}
	});
});

app.get('/resettips', function(req, res) {
	cache.set("tips", true);
	res.json({ data: "success" });
});

app.get('/tips', function(req, res) {
	cache.set("tips", false);
	res.json({ data: "success" });
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
	let allsynonyms;
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
	var host = server.address().host || 'localhost';
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