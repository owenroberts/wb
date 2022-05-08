const ChainDb = require('./db').ChainDb;
const fs = require('fs');
const { createCanvas } = require('canvas');
const natural = require('natural');
const wordnet = require('wordnet');
const thesaurus = require('thesaurus');
const chain = require('./chain');
const Twit = require('twit');
const dotenv = require('dotenv');

const result = dotenv.config();
// const badWords = fs.readFileSync('./public/badwords.txt').toString('UTF8').split('\n');

let envs; // https://newbedev.com/node-js-environment-variables-and-heroku-deployment
if (!('error' in result)) {
	envs = result.parsed;
} else {
	envs = {};
	// _.each(process.env, (value, key) => envs[key] = value);
	for (const k in process.env) {
		envs[k] = process.env[k];
	}
}

const T = new Twit({
	consumer_key:         envs.API_KEY, // API_KEY
	consumer_secret:      envs.API_SECRET, // API_SECRET
	access_token:         envs.ACCESS_TOKEN, // ACCESS_TOKEN
	access_token_secret:  envs.ACCESS_SECRET, // ACCESS_SECRET
	timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

function coinFlip() {
	return Math.random() > 0.5;
}

function choice(array) {
	return array[Math.floor(Math.random() * (array.length - 1))];
}

const mongoUri = 
	process.env.DB_URI ||
	'mongodb://localhost:27017/';

const db = new ChainDb(mongoUri, 'bridge', startBot);
const debug = process.env.NODE_ENV === 'development';

function startBot() {
	if (false && coinFlip()) {
		generateSearch();
	} else {
		getSearchFromDatabase();
	}
}

async function getSearchFromDatabase() {
	console.log('get search from db');
	const collection = db.db.collection('chains');

	simplePipeline(db.db, function () {
		db.client.close();
	});

	async function simplePipeline(db) {
		// add error null
		const doc =  await collection.aggregate([
				// $match: { tweeted: null }}, 
				{ $match: { error: null, tweeted: null }},
				{ $sample: { size: 1 }}
			])
			.toArray();
		if (doc.length > 0) {
			console.log('doc', doc[0])
			makeTweet(doc[0]);
			collection.updateOne(
				{ queryString: doc[0].queryString },
				{ $set: { tweeted: new Date() }},
				(err) => {
					if (err) console.log(err);
					// process.exit();
				}
			);
		} else {
			generateSearch();
		}
	}
}

function generateSearch() {
	console.log('generate search')
	
	let startWord, endWord;
	const list = fs.readFileSync('./public/3esl-filtered.txt')
		.toString('UTF8').split('\n');
		// .filter(w => !badWords.includes(w)); bad words prefiltered in 3esl

	function getWord() {
		let word = choice(list);
		// check simple issues first
		if (word === startWord || thesaurus.find(word).length === 0) {
			return getWord();
		}
		return word;
	}

	startWord = getWord();
	endWord = getWord();

	let qs = `${startWord}10${endWord}10`;
	db.get(qs, function(err, result){
		if (err) console.log(err);
		else if (!result) {
			const query = {
				queryString: qs,
				start: startWord,
				end: endWord,
				nodeLimit: 10,
				synonymLevel: 10,
				searches: [{ date: new Date() }]
			};
			chain.makeChain(query, [startWord, endWord], (err, chain) => {
				// try again if error .... ?
				if (err) {
					query.error = err;
				} else {
					query.chain = chain;
					query.tweeted = new Date();
				}
				db.save(query, err => {
					if (err) console.log(err);
					if (query.error) {
						if (debug) process.exit();
						generateSearch(); // try again
					} else {
						makeTweet(query);
					}
				});
			});
		}
	});
}

function makeTweet(chain) {

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

	ctx.font = 'bold 20px Arial';
	let wb = '@wordbridge_link';
	let w = ctx.measureText(wb).width;
	ctx.fillText(wb, x, height - sy);

	console.log(chain.start);

	const url = `https://www.wordbridge.link/bridge?s=${chain.start}&e=${chain.end}&nl=10&sl=10`;
	const message = `${chain.start} → ${chain.end}: ${url}`;
	const alt = 'word bridge: ' + chain.chain.map(node => node.word).join(' -> ');

	console.log(url);

	const buffer = canvas.toBuffer('image/jpeg');
	const buff = new Buffer.from(buffer);
	const base64 = buff.toString('base64');
	
	// first we must post the media to Twitter
	T.post('media/upload', { media_data: base64 }, function (err, data, response) {
		if (err) console.log(err);
		else {
			// now we can assign alt text to the media, for use by screen readers and
			// other text-based presentations and interpreters
			const mediaIdStr = data.media_id_string
			const altText = alt;
			const meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

			T.post('media/metadata/create', meta_params, function (err, data, response) {
				if (err) console.log(err);
				else {
					// now we can reference the media and post a tweet (media will attach to the tweet)
					const params = { status: message, media_ids: [mediaIdStr] }
					T.post('statuses/update', params, function (err, data, response) {
						if (err) console.log(err);
						process.exit();
					});
				}
			});
		}
	});
}