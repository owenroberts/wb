window.addEventListener('load', function() {

	B.getRandomInt = function(min, max) {
		return Math.floor(Math.random()* ( max - min + 1) + min);
	}

	// http://wordnet.princeton.edu/wordnet/man/wndb.5WN.html#sect3
	B.pos = { "n":"noun", "v":"verb", "a":"adjective", "s":"adjective", "r":"adverb" };

	B.fade = function(elem, status, displayNone) {
		const [addClass, removeClass] = status == 'in' ? ['fade-in', 'fade-out'] : ['fade-out', 'fade-in'];
		if (status == 'in')
			elem.style.display = 'block';
		if (elem.classList.contains(removeClass))
			elem.classList.replace(removeClass, addClass);
		else
			elem.classList.add(addClass);
		if (displayNone)
			setTimeout(() => { elem.style.display = 'none'; }, B.fadeDur);
	};
});