window.addEventListener('load', function() {

	B.debug = false; // true;
	B.fadeDur = B.debug ? 100 : 300;
	B.isAnimating = false;

	B.getRandomInt = (min, max) => {
		return Math.floor(Math.random()* ( max - min + 1) + min);
	};

	// http://wordnet.princeton.edu/wordnet/man/wndb.5WN.html#sect3
	B.pos = { "n":"noun", "v":"verb", "a":"adjective", "s":"adjective", "r":"adverb" };

	B.fade = (e, status, display, end) => {

		if (end) {
			// e.addEventListener('transitionend', end);
			// e.addEventListener('transitionend', () => {
			// 	e.removeEventListener('transitionend', end);
			// }); // this fails sometimes
			setTimeout(end, B.fadeDur);
		}

		const [addClass, removeClass] = status == 'in' ? ['fade-in', 'fade-out'] : ['fade-out', 'fade-in'];

		if (status == 'in') e.style.display = display;

		setTimeout(() => {
			if (e.classList.contains(removeClass))
				e.classList.replace(removeClass, addClass);
			else
				e.classList.add(addClass);
		}, 5); // hacky anim/display fix
		
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
	const reportTitle = document.getElementById('report-title');
	const reportTxt = document.getElementById('report-txt');
	const reportBtn = document.getElementById('report-btn');

	B.report = function(title, msg, ok, callback, dismissBack) {
		B.fade(reportDiv, 'in', 'block');
		reportDiv.scrollTop = 0;
		reportMsg.scrollTop = 0;
		reportTxt.innerHTML = msg;
		reportTitle.textContent = title;
		if (ok) {
			reportBtn.style.display = 'block';
			reportBtn.textContent = ok;
			reportBtn.addEventListener('click', callback);
		} else {
			reportBtn.style.display = 'none';
		}
		function dismissReport() {
			B.fade(reportDiv, 'out', 'none');
			document.body.style.overflow = 'auto';	
			if (dismissBack)
				dismissBack();
			reportDiv.removeEventListener('click', dismissReport);
		}
		reportDiv.addEventListener('click', dismissReport);
		addEventListener('keydown', ev => {
			if (ev.which == 27 || ev.key == 'Escape') dismissReport()
		});
	};

	B.createElem = function(tag, classes, text, img) {
		const elem = document.createElement(tag);
		classes.forEach(c => {
			elem.classList.add(c);
		});
		if (text) elem.textContent = text;
		if (img) {
			const image = new Image();
			image.src = img;
			elem.appendChild(image);
		}
		return elem;
	};

	B.makeNode = function(index, parent) {
		const node = B.createElem('div', ['node', 'fade', 'hidden', 'display-none']);
		node.dataset.index = index;
		node.dataset.word = B.chains[B.currentChain][index].word;
		node.dataset.syndex = B.chains[B.currentChain][index].syndex;

		const wordSpan = B.createElem('span', ['fade', 'visible'], B.chains[B.currentChain][index].word);
		const word = B.createElem('div', ['word']);
		wordSpan.addEventListener('click', () => {
			B.getDef(wordSpan);
		});
		word.appendChild(wordSpan);

		const modOptions = B.createElem('div', ['mod-options']);

		const modClose = B.createElem('div', ['mod-close'], undefined, '/img/mod-close.svg');
		modClose.addEventListener('click', ev => {
			B.closeModOptions(ev.currentTarget, false);
			B.btnAnim(modClose);
		});

		const modBtn = B.createElem('div', ['mod-btn'], undefined, '/img/mod-down-arrow.svg');
		modBtn.addEventListener('click', ev => {
			B.modifyChain(ev.currentTarget);
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

	const dismissBtns = document.getElementsByClassName('dismiss');
	for (const btn of dismissBtns) {
		btn.addEventListener('touchstart', event => {
			const elem = event.currentTarget;
			elem.classList.add('active');
			elem.addEventListener('transitionend', () => {
				elem.classList.remove('active');
			});
		});
	}
});