const express = require('express')
	,	path = require('path')
	,	favicon = require('serve-favicon')
	,	logger = require('morgan')
	,	bodyParser = require('body-parser')
	,	wordnet = require('wordnet')
	,	NodeCache = require('node-cache')
	,	ChainDb = require('./db').ChainDb
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
	loadChain(req, function(result) { /* loadChain for production, makeChain to skip db/cache */
		if (result.error)
			res.render('index', {
				errmsg: result.error
			});
		else
			res.render('index', {
				data: result
			});
	});
});

app.get('/chain', function(req, res) {
	loadChain(req, function(result) { /* loadChain for production, makeChain to skip db/cache */
		if (result.error)
			res.json({
				errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
			});
		else res.json({ data: result });
	});
});

app.post('/save', function(req, res) {
	db.save({
		queryString: req.body.qs,
		chain: JSON.parse(req.body.chain),
		start: req.body.s,
		end: req.body.e,
		nodelimit: req.body.nl,
		synonymlevel: req.body.sl,
		searches: [{ date: new Date() }] /* location? */
	}, function(err) {
		if (err) console.log('err', err);
		else res.send("success"); 
	});
});

app.get('/mod', function(req, res) {
	loadChain(req, function(result) { 
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

function loadChain(req, callback) {
	var queryString = req.query.qs || makeQueryString(req);
	var cacheSearch = cache.get(queryString);
	if (cacheSearch == undefined) {
		db.get(queryString, function(err, result) {
			if (err) console.log(err);
			else {
				if (result == null) {
					makeChain(req, callback);
				} else {
				 	db.addSearchTime(queryString, function(err) { console.log(err) } );
				 	cache.set(queryString, result);
				 	callback(result);
				}
			}
		});
	} else {
		callback(cacheSearch);
	}
}

function makeChain(req, callback) {
	let allsynonyms;
	if (req.query.as) 
		allsynonyms = req.query.as;
	else 
		allsynonyms = [req.query.s];
	var query = {
		queryString: makeQueryString(req),
		start: req.query.s.replace(/ /g, ""),
		end: req.query.e.replace(/ /g, ""),
		nodelimit: req.query.nl,
		synonymlevel: req.query.sl,
		searches: [{ date: new Date() }] /* location? */
	};
	chain.makeChain(query, allsynonyms, function(err, chain) {
		if (err) query.error = err;
		else query.chain = chain;

		/* this is removing all the extra data for some reason? 
			should combine search data with weighting data? */
		db.save(query, function(err) { 
			if (err) console.log(err);
		});
		cache.set(query.queryString, query);
		callback(query);
	});
}

function makeQueryString(req) {
	let startWord = req.query.s;
	let endWord = req.query.e;
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
	var string = startWord + req.query.nl + endWord + req.query.sl;
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
const db = new ChainDb(mongoUri);
    
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