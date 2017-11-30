$('a').on('click', function(ev) {
	ev.preventDefault();
	window.location = this.href;
});

function getRandomInt(min, max) {
	return Math.floor(Math.random()* ( max - min + 1) + min);
}

// http://wordnet.princeton.edu/wordnet/man/wndb.5WN.html#sect3
const parts = { "n":"noun", "v":"verb", "a":"adjective", "s":"adjective", "r":"adverb" };