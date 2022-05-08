const express = require('express'),	
	path = require('path'),	
	favicon = require('serve-favicon'),	
	logger = require('morgan'),	
	bodyParser = require('body-parser'),	
	wordnet = require('wordnet'),	
	NodeCache = require('node-cache'),	
	ChainDb = require('./db').ChainDb,	
	chain = require('./chain'),	
	def = require('./def'),	
	url = require('url'),	
	handlebars = require('express-handlebars'),
	lev = require('fast-levenshtein'),
	thesaurus = require('thesaurus');

const app = express();
const cache = new NodeCache();

const hbs = handlebars.create({
	defaultLayout: "main",
	partialsDir: __dirname + '/views/partials/',
	helpers: { 
		json: content => { return JSON.stringify(content); }
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
	let err = req.query.err instanceof Array ?
		req.query.err[req.query.err.length - 1] :
		req.query.err;
	res.render('index', {
		errmsg: err
	});
});

/* legacy url handler */
app.get('/search', function(req, res) {
	if (req.query.qs) res.redirect('/bridge?qs=' + req.query.qs);
	else res.redirect('/bridge?qs=' + makeQueryString(req.query));
});

/* renders main bridge page */
app.get('/bridge', function(req, res) {
	console.log('get', req.query);
	/* loadChain w req for production, makeChain w req.query to skip db/cache */
	loadChain(req, function(result) {
		if (result.error) res.render('index', { errmsg: result.error });
		else res.render('bridge', { data: result });
	});
});

/* json request for mod chain, new chain */
app.get('/chain', function(req, res) {
	loadChain(req, function(result) { 
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
	}, err => {
		if (err !== undefined) console.log('err', err);
		else res.json({ msg: 'success' });
	});
});

app.get('/def', function(req,res) {
	def.getDef(req.query.word, req.query.synonym, (err, result) => {
		if (err) console.log(err);
		else res.json({ data: result });
	});
});

app.get('/bridgle', async function(req, res) {
	const collection = db.db.collection('chains');
	const doc = await collection.aggregate([{ $match: { error: null }}, { $sample: { size: 1 } }]).toArray();

	const { start, end, queryString } = doc[0];
	// random words like bot? -- make sure not the same word
	const startSynonyms = getSyns(start);
	const startSynSyns = {};
	startSynonyms.forEach(syn => {
		startSynSyns[syn] = getSyns(syn);
	});
	const endSyonyms = getSyns(end);

	if (doc.length > 0) {
		res.render('bridgle', { start: start, end: end, startSynonyms: startSynonyms, endSyonyms: endSyonyms, startSynSyns: startSynSyns, queryString: queryString });
	} else {
		res.render('index', { errmsg: 'Could not find a bridge.' });
	}
});

app.get('/bridgle-selection', function(req, res) {
	let usedSynonyms = [req.query.word, req.query.end, ...req.query.used.split(',')];
	let synonyms = getSyns(req.query.word, usedSynonyms);
	let synonymSynonyms = {};
	synonyms.forEach(syn => {
		synonymSynonyms[syn] = getSyns(syn, usedSynonyms);
	})
	res.json({ synonyms: synonyms, synonymSynonyms: synonymSynonyms });
});

function getSyns(word, filter) {
	filter = filter ? filter : [];
	return thesaurus.find(word)
		.filter(s => lev.get(word, s) > 1)
		.filter(s => !filter.includes(s))
		.filter(s => s.match(/^[a-z]+$/))
		.filter(s => s !== word)
		.filter(s => !s.includes(word) && !word.includes(s))
		.filter(s => s.substring(0, s.length - 1) !== word)
		.filter(s => word.substring(0, word.length - 1) !== s)
		.slice(0, 12); // limit to 12 results
}

function loadChain(req, callback) {
	if (!req.query.s) {
		console.log('** no start ** ');
		console.trace()
		console.log(req)
	}
	console.log('load', req.query);
	const queryString = req.query.qs || makeQueryString(req.query);
	console.log('qs', queryString);
	const cacheSearch = cache.get(queryString);
	if (cacheSearch) callback(cacheSearch);
	else if (!db.isConnected) makeChain(req.query, callback);
	else {
		db.get(queryString, (err, result) => {
			if (err) console.log(err);
			else if (result === null) {
				if (!req.query.s) {
					req.query.s = queryString.split(/[0-9]+/)[0];
					req.query.e = queryString.split(/[0-9]+/)[1];
					req.query.nl = queryString.split(/[a-z]+/)[1];
					req.query.sl = queryString.split(/[a-z]+/)[2];
				} /* if db is fucked up, what about hyphen searches ... */
				console.log('make', req.query);
				makeChain(req.query, callback);
			} else {
				console.log('add', queryString);
			 	db.addSearchTime(queryString, err => { if (err) console.log(err) });
			 	cache.set(queryString, result);
			 	callback(result);
			}
		});
	}
}

function makeChain(_query, callback) {
	let syns = _query.as ? _query.as.split(',') : [_query.s, _query.e];
	syns = syns.map(syn => syn.toLowerCase());

	const query = {
		queryString: makeQueryString(_query),
		start: _query.s.replace(/ /g, "").toLowerCase(),
		end: _query.e.replace(/ /g, "").toLowerCase(),
		nodeLimit: _query.nl,
		synonymLevel: _query.sl,
		searches: [{ date: new Date() }] /* location? */
	};

	chain.makeChain(query, syns, (err, chain) => {
		if (err) query.error = err;
		else query.chain = chain;
		if (db.isConnected) {
			db.save(query, (err) => { 
				if (err) console.log(err);
			});
		}
		cache.set(query.queryString, query);
		callback(query);
	});
}

function makeQueryString(query) {
	let string = query.s + query.nl + query.e + query.sl;
	string = string.toLowerCase().replace(/ /g, ""); // remove spaces 
	return string;
}

const server = app.listen(3000, function() {
	const host = server.address().host || 'localhost';
	const port = server.address().port;
	console.log('word bridge listening at http://%s:%s', host, port);
});

const mongoUri = 
	process.env.DB_URI ||
	'mongodb://localhost:27017/';
const collection = 'bridge'; // check this online ... 

const db = new ChainDb(mongoUri, collection);
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