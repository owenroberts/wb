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
const { createCanvas } = require('canvas');
const natural = require('natural');
// const wordnet = new natural.WordNet();
const wordnet = require('wordnet');
const thesaurus = require('thesaurus');
const chain = require('./chain')

function coinFlip() {
	return Math.random() > 0.5;
}

function choice(array) {
	return array[Math.floor(Math.random() * array.length)];
}

let db;

const WordBridgeBot = function(appDB, callback) {
	if (appDB) {
		db = appDB;
	} else {
		const mongoUri = 
			process.env.DB_URI ||
			'mongodb://localhost:27017/';
		db = new ChainDb(mongoUri, 'bridge', function() {
			callback();
		});
	}
};

WordBridgeBot.prototype.update = async function() {

	const collection = db.db.collection('chains');

	simplePipeline(db.db, function () {
		db.client.close();
	});

	async function simplePipeline(db) {
		const doc =  await collection.aggregate([{ $match: { tweeted: null }}, { $sample: { size: 1 } }]).toArray();
		if (doc.length > 0) {
			makeImage(doc[0]);
			collection.updateOne(
				{ queryString: doc[0].queryString }, 
				{ $set: { tweeted: new Date() }},
				(err) => {
					if (err) return console.log(err);
					process.exit();
				}
			);
		} else {
			generateSearch();
		}
	}
};

async function generateSearch() {

	// get two random words
	const badWords = fs.readFileSync('./public/badwords.txt').toString('UTF8').split('\n');
	await wordnet.init();
	let list = await wordnet.list();
	let startWord, endWord;

	function getWord() {
		let w = choice(list);
		while (	badWords.includes[w] || w === startWord || w === endWord || 
				thesaurus.find(w).length === 0 || w.includes(' ') || w.includes('-')) {
			w = choice(list);
		}
		return w;
	}

	startWord = getWord();
	endWord = getWord();

	let qs = `${startWord}10${endWord}10`;
	db.get(qs, function(err, result){
		if (err) return console.log(err);
		if (!result) {
			const q = {
				queryString: qs,
				start: startWord,
				end: endWord,
				nodeLimit: 10,
				synonymLevel: 10,
				searches: []
			};
			chain.makeChain(q, [], (err, chain) => {
				// try again if error .... ?
				if (err) q.error = err;
				else q.chain = chain;
				q.tweeted = new Date();
				db.save(q, err => {
					if (err) console.log(err);
					makeImage(q);
					process.exit();
				});
			});
		}
	});
}

function makeImage(chain) {
	if (chain.error) return console.log('error', chain.error);

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