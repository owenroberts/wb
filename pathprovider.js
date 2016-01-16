var mongodb = require('mongodb')
	,	MongoClient = require('mongodb').MongoClient
	,	Db = require('mongodb').Db
	,	Connection = require('mongodb').Connection
	,	Server = require('mongodb').Server;

PathProvider = function(uri) {

	var that = this;
  	mongodb.MongoClient.connect(uri, { server: { auto_reconnect: true } }, function (error, database) {
    	if (error) console.log(error);
    	that.db = database;
  	});

  	/*
	this.db = new Db('synopaths', new Server('localhost', 27017, {safe:false}, {auto_reconnect:true}, {}));
	this.db.open(function(){});
	*/
}

PathProvider.prototype.save = function(path, callback) {
	this.getCollection(function(err, path_collection) {
		if (err) callback(err);
		else {
			path_collection.findOne({ queryString:path.queryString }, function(err, result) {
				if (err) console.log(err);
				else if (result == null) {
					path_collection.insert(path, function(err) {
						if (err) console.log(err);
					});
				} else {
					path_collection.update(
						{ queryString:path.queryString }, 
						{ $push: { searches: new Date() } }
					);
				}
			});
		}
	})
};

PathProvider.prototype.get = function(queryString, callback) {
	this.getCollection(function(err, path_collection) {
		if (err) callback(err);
		else {
			path_collection.findOne({queryString:queryString}, function(err, result) {
				if (err) callback(err);
				else callback(null, result);
			});
		}
	});
};

PathProvider.prototype.addSearchTime = function(queryString, callback) {
	this.getCollection( function(err, path_collection) {
		if (err) callback(err);
		else {
			path_collection.update(
				{ queryString:queryString },
				{ $push: { searches: new Date() } }
			);
		}
	});
};

PathProvider.prototype.getCollection = function(callback) {
  this.db.collection('paths', function(err, book_collection) {
    if(err) callback(err);
    else callback(null, book_collection);
  });
};

exports.PathProvider = PathProvider;