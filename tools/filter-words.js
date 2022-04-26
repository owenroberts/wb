/* filter words from word list */
const fs = require('fs');

const file = fs.readFileSync('./public/3esl.txt');
const words = file.toString().split(/\r?\n/);
const bf = fs.readFileSync('./public/badwords.txt');
const badWords = bf.toString().split(/\r?\n/);
const filtered = words.filter(w => w.match(/^[a-z]+$/) && !badWords.includes(w));
fs.writeFileSync('./public/3esl-filtered.txt', filtered.join('\n'));
process.exit();