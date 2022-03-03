// okay! now make a worker and try heroku scheduler?

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
const badWords = fs.readFileSync('./public/badwords.txt').toString('UTF8').split('\n');

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
	return array[Math.floor(Math.random() * array.length)];
}

const mongoUri = 
// test
	// process.env.DB_URI ||
	// 'mongodb://localhost:27017/';

const db = new ChainDb(mongoUri, 'bridge', startBot);
const debug = process.env.NODE_ENV === 'development';

function startBot() {
	if (coinFlip()) {
		generateSearch();
	} else {
		getSearchFromDatabase()
	}
}

async function getSearchFromDatabase() {
	const collection = db.db.collection('chains');

	simplePipeline(db.db, function () {
		db.client.close();
	});

	async function simplePipeline(db) {
		const doc =  await collection.aggregate([{ $match: { tweeted: null }}, { $sample: { size: 1 } }]).toArray();
		if (doc.length > 0) {
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

async function generateSearch() {

	// get two random words
	
	await wordnet.init();
	let list = await wordnet.list();
	let startWord, endWord;

	function getWord() {
		let w = choice(list);
		while (badWords.includes[w] || w === startWord || w === endWord || 
				thesaurus.find(w).length === 0 || w.includes(' ') || w.includes('-')) {
			w = choice(list);
		}
		return w;
	}

	startWord = getWord();
	endWord = getWord();

	let qs = `${startWord}10${endWord}10`;
	db.get(qs, function(err, result){
		if (err) console.log(err);
		else if (!result) {
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
					makeTweet(q);
					// process.exit();
				});
			});
		}
	});
}

function makeTweet(chain) {
	if (chain.error) {
		console.log('make tweet error', chain.queryString, chain.error);
		if (debug) process.exit();
		else generateSearch(); // try again
	} else {
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

		const url = `https://www.wordbridge.link/bridge?s=${chain.start}&e=${chain.end}&nl=10&sl=10`;
		const message = `${chain.start} → ${chain.end}: ${url}`;
		const alt = 'word bridge: ' + chain.chain.map(node => node.word).join(' -> ');
		// fs.writeFileSync(`./bot_tests/${chain.start}-${chain.end}.png`, buffer);
		// console.log('finna tweet', message);

		const buffer = canvas.toBuffer('image/jpeg');
		const buff = new Buffer.from(buffer);
		const base64 = buff.toString('base64')
		
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
							else {
								if (process.env.NODE_ENV === 'development') process.exit();
							}
						});
					}
				});
			}
		});
	}
}