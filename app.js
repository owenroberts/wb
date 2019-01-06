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

const hbs = handlebars.create({
	defaultLayout: "main",
	partialsDir: __dirname + '/views/partials/',
	helpers: { json: function(content) { return JSON.stringify(content); } }
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
			res.render('search', {
				data: result
			});
	});
});

app.get('/chain', function(req, res) {
	loadChain(req, function(result) { /* loadChain for production, makeChain to skip db/cache */
		if (result.error) res.json({ errormsg: result.error });
		else res.json({ data: result });
	});
});

app.post('/save', function(req, res) {
	db.save({
		queryString: req.body.qs,
		chain: JSON.parse(req.body.chain),
		start: req.body.s,
		end: req.body.e,
		nodeLimit: req.body.nl,
		synonymLevel: req.body.sl,
		searches: [{ date: new Date() }] /* location? */
	}, function(err) {
		if (err != undefined) console.log('err', err);
		else res.json({ msg: 'success' });
	});
});


app.get('/def', function(req,res) {
	def.getDef(req.query.word, req.query.synonym, function(err, result) {
		if (err) console.log(err);
		else res.json({ data: result });
	})
});

function loadChain(req, callback) {
	var queryString = req.query.qs || makeQueryString(req.query);
	var cacheSearch = cache.get(queryString);
	if (cacheSearch == undefined) {
		db.get(queryString, function(err, result) {
			if (err) console.log(err);
			else {
				if (result == null) {
					if (!req.query.s) {
						req.query.s = queryString.split(/[0-9]+/)[0];
						req.query.e = queryString.split(/[0-9]+/)[1];
						req.query.nl = queryString.split(/[a-z]+/)[1];
						req.query.sl = queryString.split(/[a-z]+/)[2];
					} /* if db is fucked up, what about hyphen searches ... */
					makeChain(req.query, callback);
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

function makeChain(query, callback) {
	let syns = query.as ? query.as.split(',') : [query.s, query.e];
	var query = {
		queryString: makeQueryString(query),
		start: query.s.replace(/ /g, ""),
		end: query.e.replace(/ /g, ""),
		nodeLimit: query.nl,
		synonymLevel: query.sl,
		searches: [{ date: new Date() }] /* location? */
	};
	chain.makeChain(query, syns, function(err, chain) {
		if (err) query.error = err;
		else query.chain = chain;
		db.save(query, function(err) { 
			if (err) console.log(err);
		});
		cache.set(query.queryString, query);
		callback(query);
	});
}

function makeQueryString(query) {
	let startWord = query.s;
	let endWord = query.e;
	var string = startWord + query.nl + endWord + query.sl;
	string = string.toLowerCase().replace(/ /g, ""); // remove spaces 
	return string;
}

var server = app.listen(3000, function() {
	var host = server.address().host || 'localhost';
	var port = server.address().port;
	console.log('word bridge listening at http://%s:%s', host, port);
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