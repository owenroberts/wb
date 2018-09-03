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

	B.makeNode = function(index, parent) {
		const node = document.createElement("div");
		node.classList.add('node');
		node.dataset.index = index;
		node.dataset.word = B.data.chains[B.currentChain][index].word;
		node.dataset.syndex = B.data.chains[B.currentChain][index].syndex;

		const word = document.createElement('div');
		word.textContent = B.data.chains[B.currentChain][index].word;
		word.classList.add('word');

		const defBtn = document.createElement('div');
		defBtn.textContent = 'd';
		defBtn.classList.add('def');
		defBtn.addEventListener('click', B.getDef);

		const prevBtn = document.createElement('div');
		prevBtn.textContent = ' < ';
		prevBtn.classList.add('prev');
		prevBtn.addEventListener('click', function(ev) {
			B.newSyn(this, 'prev');
		});
		if (B.data.chains[B.currentChain][index].syndex > 0)
			prevBtn.classList.add('exists');

		const nextBtn = document.createElement('div');
		nextBtn.textContent = ' > ';
		nextBtn.classList.add('next');
		if (B.data.chains[B.currentChain][index].syndex < B.data.chains[B.currentChain][index].alts.length)
			nextBtn.classList.add('exists');
		nextBtn.addEventListener('click', function(ev) {
			B.newSyn(this, 'next');
		});

		const modBtn = document.createElement('div');
		modBtn.textContent = 'm';
		modBtn.classList.add('mod-btn');
		modBtn.addEventListener('click', B.modifyChain);

		node.appendChild(word);
		node.appendChild(defBtn);
		node.appendChild(prevBtn);
		node.appendChild(nextBtn);
		node.appendChild(modBtn);

		parent.insertBefore(node, parent.lastElementChild);

		setTimeout(() => {
			node.classList.add('fade-in');
		}, index * B.fadeDur);
	};
});