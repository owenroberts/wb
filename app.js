var express = require('express')
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
	;

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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	var err;
	console.log(req.query.err);
	if (req.query.err instanceof Array) 
		err = req.query.err[req.query.err.length - 1];
	else err = req.query.err;
	res.render('index', {
		errmsg: err
	});
});

app.get('/search', function(req, res) {
	getChain(req, function(result) {		
		if (result.error) {
			res.redirect(url.format({
				pathname: req.get('Referrer'),
				query: {
					"err":result.error
				}
			}));
		} else {
			res.render('search', { data: result });
		}
	});
});

app.get('/search/add', function(req, res) {
	getChain(req, function(result) {
		if (result.error)
			res.json({
				errormsg: "This randomly generated path was unable to be performed by the algorithm.  Please try the add path button again."
			});
		else res.json({ data: result });
	});
});

app.get('/search/modified', function(req, res) {
	getChain(req, function(result) {
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

function getChain(request, callback) {
	var allsynonyms;
	if (request.query.as) 
		allsynonyms = request.query.as;
	else 
		allsynonyms = [request.query.s];
	var string = request.query.s + request.query.nl + request.query.e + request.query.sl;
	string = string.toLowerCase().replace(/ /g, "");
	var query = {
		queryString: string,
		start: request.query.s.replace(/ /g, ""),
		end: request.query.e.replace(/ /g, ""),
		nodelimit: request.query.nl,
		synonymlevel: request.query.sl,
		searches: [{loc:"def", date: new Date()}]
	};
	var cacheSearch = cache.get(query.queryString);
	if (cacheSearch == undefined) {
		pathprovider.get(query.queryString, function(err, result) {
			if (err) console.log(err);
			else {
				if (result == null) {
					chain.makeChain(query, allsynonyms, function(err, data) {
					    if (err) query.error = err;
					    else query.path = data.chain;
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