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

const ChainDb = function(uri, dbName, callback) {
	this.isConnected = false;
	const self = this;
	const options = { useNewUrlParser: true, useUnifiedTopology: true };
	MongoClient.connect(uri, options, function (err, client) {
		if (err) return console.log(err);
		self.isConnected = true;
		self.client = client;
		self.db = client.db(dbName);
		if (callback) callback();
	});
}

ChainDb.prototype.save = function(chain, callback) {

	let collection = this.db.collection('chains');
	collection.findOne({ queryString: chain.queryString}, (err, result) => {
		if (err) return callback(err);
		if (result === null) {
			collection.insertOne(chain, err => {
				if (err) return callback(err);
				callback(null);
			});
		} else {
			collection.updateOne(
				{ queryString: chain.queryString }, 
				{ $push: { searches: chain.searches } },
				(err, result) => {
					if (err) return callback(err);
					else callback(null);
				});
		}
	});
};

ChainDb.prototype.get = function(queryString, callback) {
	let collection = this.db.collection('chains');
	collection.findOne({ queryString: queryString}, (err, result) => {
		if (err) return callback(err);
		callback(null, result);
	});
};

ChainDb.prototype.addSearchTime = function(queryString, callback) {
	let collection = this.db.collection('chains');
	const search = { date: new Date()};
	collection.updateOne(
		{ queryString: queryString },
		{ $push: { searches: search } },
		(err) => {
			if (err) callback(err);
			else callback(null);
		}
	);
};

exports.ChainDb = ChainDb;