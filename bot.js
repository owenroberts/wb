// get random db entry or 
	// db.chains.aggregate([ { $sample: { size: 1 }  } ])
	// db.chains.updateOne( { "queryString" : "untenable10fear10" }, { $set: { tweeted: true } } )
	// db.chains.aggregate( [ { $match: { tweeted: null } }, { $sample: { size: 1 } }] ).forEach(function(doc) { print(doc.queryString); });
// generate random search
	// get two random words from wordnet
	// no bad words -- test regular search too
	// add tweeted to document
// create an image
	// how??
// post to twitter .... fuck me
	// really wish i made this in python ...

const ChainDb = require('./db').ChainDb;
const fs = require('fs');
const { createCanvas } = require('canvas')


function coinFlip() {
	return Math.random() > 0.5;
}

let db;

const WordBridgeBot = function(appDB, callback) {
	if (appDB) {
		db = appDB;
	} else {
		const mongoUri = 
			process.env.DB_URI ||
			'mongodb://localhost:27017/bridge';
		db = new ChainDb(mongoUri, function() {
			callback();
			db.addTweeted('test10cluster10', function(err) { console.log(err) } );
		});

	}
};

WordBridgeBot.prototype.update = function() {

	// get random db
	// console.log(db.addTweeted);
	db.getCollection((err, chain_collection) => {
		if (err) return console.log(err);
		chain_collection.aggregate([{ $match: { tweeted: null }}, { $sample: { size: 1 } }], (err, cursor) => {
			if (err) return console.log(err);
			cursor.get((err, results) => {
				if (err) return console.log(err);

				if (results.length > 0) {
					makeImage(results[0]);
					// console.log('queryString', results[0].queryString);
					// console.log(chain_collection.findOne);
					// console.log(db);
					console.log('bot', results[0].queryString)
					// db.addSearchTime(results[0].queryString, function(err) { console.log(err) });
					// db.addTweeted(results[0].queryString, function(err) { console.log(err) } );
					// db.addTweeted(results[0].queryString, err => console.log(err));
					// const tweetDate = new Date();
					// const q = { queryString: results[0].queryString };
					// chain_collection.updateOne(
					// 		{ queryString: results[0].queryString }, 
					// 		{ $set: { tweeted: tweetDate }}, 
					// 		function(err, response) {
					// 	console.log(err, response);
					// });
				} else {
					// generate soemthing else
					console.log('no results');
				}
				process.exit();
			});
		});
	});
};

function makeImage(chain) {
	
	let x = 40;
	let sy = 40;
	let y = 40;

	const width = 400;
	const height = sy * 3 + y * (chain.chain.length);

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);

	ctx.font = 'bold 30px Arial';
	ctx.fillStyle = '#000000';


	ctx.fillText(chain.start, x, sy + y);
	ctx.fillText(chain.end, x, sy + y * (chain.chain.length - 1));

	ctx.font = '30px Arial';
	for (let i = 1; i < chain.chain.length - 2; i++) {
		y += 40;
		ctx.fillText(chain.chain[i].word, x, sy + y);
	}

	ctx.font = '20px Arial';
	let wb = 'wordbridge.link';
	let w = ctx.measureText(wb).width;
	ctx.fillText(wb, width / 2 - w / 2, height - sy / 2);

	const buffer = canvas.toBuffer('image/png');
	fs.writeFileSync(`./bot_tests/${chain.start}-${chain.end}.png`, buffer);

}

exports.WordBridgeBot = WordBridgeBot;