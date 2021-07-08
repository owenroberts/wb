const mongodb = require('mongodb')
	,	MongoClient = require('mongodb').MongoClient
	,	Db = require('mongodb').Db
	,	Connection = require('mongodb').Connection
	,	Server = require('mongodb').Server
	,	assert = require('assert')
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

ChainDb = function(uri, callback) {
	this.isConnected = false;
	const self = this;
	const options = { useNewUrlParser: true, useUnifiedTopology: true };
	MongoClient.connect(uri, options, function (err, client) {
		if (err) console.log(err);
		else {
			self.isConnected = true;
			self.db = client.db();
		}
	});
}

ChainDb.prototype.save = function(chain, callback) {
	this.getCollection(function(err, chain_collection) {
		if (err) callback(err);
		else {
			chain_collection.findOne({ queryString: chain.queryString }, function(err, result) {
				if (err) console.log(err);
				else if (result == null) {
					chain_collection.insertOne(chain, function(err) {
						if (err) console.log(err);
						else callback();
					});
				} else {
					chain_collection.updateOne(
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
			chain_collection.updateOne(
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