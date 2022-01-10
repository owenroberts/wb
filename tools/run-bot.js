const WordBridgeBot = require('../bot').WordBridgeBot;
const bot = new WordBridgeBot(null, test);

function test() {
	bot.update();
}