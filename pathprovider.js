var mongodb = require('mongodb')
	,	MongoClient = require('mongodb').MongoClient
	,	Db = require('mongodb').Db
	,	Connection = require('mongodb').Connection
	,	Server = require('mongodb').Server
	;

PathProvider = function(uri) {
	if (uri == "localhost") {
		this.db = new Db('synopaths', new Server('localhost', 27017, {safe:false}, {auto_reconnect:true}, {}));
		this.db.open(function(){});
	} else {
		var that = this;
  		mongodb.MongoClient.connect(uri, { server: { auto_reconnect: true } }, function (error, database) {
    		if (error) console.log(error);
    		that.db = database;
  		});
	}
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
						{ $push: { searches: path.searches } }
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

PathProvider.prototype.addSearchTime = function(query, callback) {
	this.getCollection( function(err, path_collection) {
		if (err) callback(err);
		else {
			path_collection.update(
				{ queryString:query.queryString },
				{ $push: { searches: query.searches[0] } }
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