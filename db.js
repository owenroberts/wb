var mongodb = require('mongodb')
	,	MongoClient = require('mongodb').MongoClient
	,	Db = require('mongodb').Db
	,	Connection = require('mongodb').Connection
	,	Server = require('mongodb').Server
	;

/*
	chains saved based on query strings
	start word - node limit - end word - synonym limit
	test10end10
	or modified searches, add mods
	test10end10-example7cool10
	include chain w synonym alternatives
	search time
*/

ChainDb = function(uri) {
	if (uri == "localhost") {
		this.db = new Db('bridge', new Server('localhost', 27017, {safe:false}, {auto_reconnect:true}, {}));
		this.db.open(function(){});
	} else {
		var that = this;
  		mongodb.MongoClient.connect(uri, { server: { auto_reconnect: true } }, function (error, database) {
    		if (error) console.log(error);
    		that.db = database;
  		});
	}
}

ChainDb.prototype.save = function(chain, callback) {
	this.getCollection(function(err, chain_collection) {
		if (err) callback(err);
		else {
			chain_collection.findOne({ queryString: chain.queryString }, function(err, result) {
				if (err) console.log(err);
				else if (result == null) {
					chain_collection.insert(chain, function(err) {
						if (err) console.log(err);
						else callback();
					});
				} else {
					chain_collection.update(
						{ queryString: chain.queryString }, 
						{ $push: { searches: chain.searches } }
					, function(err, result) {
						if (err) console.log(err);
						else callback(null);
					});
				}
			});
		}
	})
};

ChainDb.prototype.get = function(queryString, callback) {
	this.getCollection(function(err, chain_collection) {
		if (err) callback(err);
		else {
			chain_collection.findOne({ queryString: queryString}, function(err, result) {
				if (err) callback(err);
				else callback(null, result);
			});
		}
	});
};

ChainDb.prototype.addSearchTime = function(queryString, callback) {
	this.getCollection(function(err, chain_collection) {
		if (err) callback(err);
		else {
			// add location ?
			var search = { date: new Date()};
			chain_collection.update(
				{ queryString: queryString },
				{ $push: { searches: search } }
			);
		}
	});
};

ChainDb.prototype.getCollection = function(callback) {
	this.db.collection('chains', function(err, chain_collection) {
		if (err) callback(err);
		else callback(null, chain_collection);
	});
};

exports.ChainDb = ChainDb;