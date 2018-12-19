window.addEventListener('load', function() {

	B.debug = false; // true;
	B.fadeDur = B.debug ? 100 : 300;
	B.isAnimating =

	B.getRandomInt = (min, max) => {
		return Math.floor(Math.random()* ( max - min + 1) + min);
	};

	// http://wordnet.princeton.edu/wordnet/man/wndb.5WN.html#sect3
	B.pos = { "n":"noun", "v":"verb", "a":"adjective", "s":"adjective", "r":"adverb" };

	B.fade = (e, status, display, end) => {
		const [addClass, removeClass] = status == 'in' ? ['fade-in', 'fade-out'] : ['fade-out', 'fade-in'];
		if (status == 'in') {
			e.style.display = display;
		}

		setTimeout(() => {
			if (e.classList.contains(removeClass))
				e.classList.replace(removeClass, addClass);
			else
				e.classList.add(addClass);
			e.addEventListener('transitionend', end);
			e.addEventListener('transitionend', () => {
				e.removeEventListener('transitionend', end);
			});

		}, 1); // hacky anim/display fix
		
		if (status == 'out')
			setTimeout(() => { e.style.display = display; }, B.fadeDur);
	};

	B.btnAnim = elem => {
		elem.classList.add('active');
		setTimeout(() => {
			elem.classList.remove('active');
		}, 300);
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
			// const image = document.createElement('embed');
			image.src = img;
			elem.appendChild(image);
		}
		return elem;
	}

	B.makeNode = function(index, parent) {
		const node = B.createElem('div', ['node', 'fade', 'hidden', 'display-none']);
		node.dataset.index = index;
		node.dataset.word = B.chains[B.currentChain][index].word;
		node.dataset.syndex = B.chains[B.currentChain][index].syndex;

		const wordSpan = B.createElem('span', ['fade', 'visible'], B.chains[B.currentChain][index].word);
		const word = B.createElem('div', ['word']);
		wordSpan.addEventListener('click', B.getDef);
		word.appendChild(wordSpan);

		const modOptions = B.createElem('div', ['mod-options']);

		const modClose = B.createElem('div', ['mod-close'], undefined, '/img/mod-close.svg');
		modClose.addEventListener('click', ev => {
			B.closeModOptions(ev.currentTarget, false);
			B.btnAnim(modClose);
		});

		const modBtn = B.createElem('div', ['mod-btn'], undefined, '/img/mod-down-arrow.svg');
		modBtn.addEventListener('click', ev => {
			B.modifyChain(ev)
			B.btnAnim(modBtn);
		});

		const prevBtn = B.createElem('div', ['prev'], undefined, '/img/mod-left-arrow.svg');
		prevBtn.addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'prev');
			B.btnAnim(prevBtn);
		});

		const nextBtn = B.createElem('div', ['next'], undefined, '/img/mod-right-arrow.svg');
		nextBtn.addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'next');
			B.btnAnim(nextBtn);
		});

		modOptions.appendChild(modClose);
		modOptions.appendChild(modBtn);
		modOptions.appendChild(prevBtn);
		modOptions.appendChild(nextBtn);

		const modOpen = B.createElem('div', ['mod-open']);
		modOpen.addEventListener('click', ev => {
			if (!B.modIsOpen) {
				B.openModOptions(ev.currentTarget);
				B.btnAnim(modOpen);
			}
		});
		
		const openImg = new Image();
		openImg.src = '/img/mod-open.svg';
		openImg.classList.add('active');

		const disabledImg = new Image();
		disabledImg.src = '/img/mod-open-disabled.svg';
		disabledImg.classList.add('disabled');

		modOpen.appendChild(openImg);
		modOpen.appendChild(disabledImg);

		node.appendChild(word);
		node.appendChild(modOptions);
		node.appendChild(modOpen)

		return node;
		// parent.insertBefore(node, parent.lastElementChild);

		// setTimeout(() => {
		// 	B.fade(node, 'in', 'flex');
		// }, index * B.fadeDur);
	};

	B.resultUI = function() {
		document.getElementById('search').style.display = 'none';
		document.getElementById('share-dek').textContent = `${B.startWord} -> ${B.endWord}`;
		B.fade(document.getElementById('plus'), 'in', 'inline-block');
		document.getElementById('title').style.display = 'none';
		document.getElementById('about-btn').style.display = 'none';
		document.getElementById('home-btn').style.display = 'block';
		document.getElementById('share-btn').style.display = 'block';
	};

	B.homeUI = function() {
		document.getElementById('title').style.display = 'block';
		document.getElementById('about-btn').style.display = 'block';
	};
});