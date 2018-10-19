window.addEventListener('load', function() {

	B.debug = true;
	B.fadeDur = B.debug ? 100 : 500;

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

	const reportDiv = document.getElementById('report');
	const reportMsg = document.getElementById('report-msg');
	const reportTxt = document.getElementById('report-txt');
	const reportBtn = document.getElementById('report-btn');

	B.report = function(msg, ok, callback, dismissBack) {
		B.fade(reportDiv, 'in', false);
		reportDiv.scrollTop = 0;
		reportMsg.scrollTop = 0;
		reportTxt.innerHTML = msg;
		if (ok) {
			reportBtn.style.display = 'block';
			reportBtn.textContent = ok;
			reportBtn.addEventListener('click', callback);
		} else {
			reportBtn.style.display = 'none';
		}
		function dismissReport() {
			B.fade(reportDiv, 'out', true);
			document.body.style.overflow = 'auto';	
			if (dismissBack)
				dismissback();
			reportDiv.removeEventListener('click', dismissReport);
		}
		reportDiv.addEventListener('click', dismissReport);
	};


	B.createElem = function(tag, classes, text, img) {
		const elem = document.createElement(tag);
		if (classes) {
			classes.forEach(function(c) {
				elem.classList.add(c);
			});
		}
		if (text) {
			elem.textContent = text;
		}
		if (img) {
			const image = new Image();
			image.src = img;
			elem.appendChild(image);
		}
		return elem;
	}

	B.makeNode = function(index, parent) {
		const node = B.createElem('div', ['node']);
		node.dataset.index = index;
		node.dataset.word = B.chains[B.currentChain][index].word;
		node.dataset.syndex = B.chains[B.currentChain][index].syndex;

		const word = B.createElem('div', ['word', 'def'], B.chains[B.currentChain][index].word);
		word.addEventListener('click', B.getDef);

		const modOptions = B.createElem('div', ['mod-options']);

		const modClose = B.createElem('div', ['mod-close'], undefined, '/img/mod-close.svg');
		modClose.addEventListener('click', ev => {
			B.closeModOptions(ev.currentTarget)
		});

		const modBtn = B.createElem('div', ['mod-btn'], undefined, '/img/mod-down-arrow.svg');
		modBtn.addEventListener('click', B.modifyChain);

		const prevBtn = B.createElem('div', ['prev'], undefined, '/img/mod-left-arrow.svg');
		prevBtn.addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'prev');
		});

		const nextBtn = B.createElem('div', ['next'], undefined, '/img/mod-right-arrow.svg');
		nextBtn.addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'next');
		});

		modOptions.appendChild(modClose);
		modOptions.appendChild(modBtn);
		modOptions.appendChild(prevBtn);
		modOptions.appendChild(nextBtn);

		const modOpen = B.createElem('div', ['mod-open']);
		modOpen.addEventListener('click', ev => {
			B.openModOptions(ev.currentTarget);
		});
		
		const openImg = new Image();
		openImg.src = '/img/Arrow-Right.svg';
		openImg.classList.add('active');

		const disabledImg = new Image();
		disabledImg.src = '/img/Arrow-Right-Disabled.svg';
		disabledImg.classList.add('disabled');

		modOpen.appendChild(openImg);
		modOpen.appendChild(disabledImg);

		node.appendChild(word);
		node.appendChild(modOptions);
		node.appendChild(modOpen)

		parent.insertBefore(node, parent.lastElementChild);

		setTimeout(() => {
			node.classList.add('fade-in');
		}, index * B.fadeDur);
	};
});