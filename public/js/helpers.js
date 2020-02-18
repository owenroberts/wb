window.addEventListener('load', function() {

	B.debug = false;
	B.fadeDur = B.debug ? 100 : 300;
	B.isAnimating = false;

	B.getRandomInt = (min, max) => {
		return Math.floor(Math.random()* ( max - min + 1) + min);
	};

	// http://wordnet.princeton.edu/wordnet/man/wndb.5WN.html#sect3
	B.pos = { "n":"noun", "v":"verb", "a":"adjective", "s":"adjective", "r":"adverb" };

	B.fade = (elem, status, display, end) => {

		if (end) {
			// e.addEventListener('transitionend', end);
			// e.addEventListener('transitionend', () => {
			// 	e.removeEventListener('transitionend', end);
			// }); // this fails sometimes
			setTimeout(end, B.fadeDur);
		}

		const [addClass, removeClass] = status == 'in' ? ['fade-in', 'fade-out'] : ['fade-out', 'fade-in'];

		if (status == 'in') elem.style.display = display;

		setTimeout(() => {
			if (elem.classList.contains(removeClass))
				elem.classList.replace(removeClass, addClass);
			else
				elem.classList.add(addClass);
		}, 5); // hacky anim/display fix
		
		if (status == 'out') setTimeout(() => { elem.style.display = display; }, B.fadeDur);
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
	const fakeTab = document.getElementById('fake-tab');
	let prevActive;

	B.report = function(title, msg, ok, callback, dismissBack) {
		B.fade(reportDiv, 'in', 'block', () => {
			if (B.loader) B.fade(B.loader, 'out', 'none');
		});

		prevActive = document.activeElement;		
		fakeTab.focus();

		reportDiv.scrollTop = 0;
		reportMsg.scrollTop = 0;
		reportTxt.innerHTML = msg;
		reportTitle.innerHTML = title;

		addEventListener('keydown', ev => {
			if (ev.which == 27 || ev.key == 'Escape') B.dismissReport();
		});
	};

	B.dismissReport = function(ev, callback) {
		prevActive.focus();
		B.fade(reportDiv, 'out', 'none');
		document.body.style.overflow = 'auto';	
		if (callback) callback();
		reportDiv.removeEventListener('click', B.dismissReport);
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

	B.makeNode = function(index, editMode) {
		const node = B.createElem('div', ['node', 'fade', 'hidden', 'display-none']);
		node.dataset.index = index;
		node.dataset.word = B.chains[B.currentChain][index].word;
		node.dataset.syndex = B.chains[B.currentChain][index].syndex;

		const wordSpan = B.createElem('button', ['fade', 'visible'], B.chains[B.currentChain][index].word);
		const word = B.createElem('div', ['word']);
		wordSpan.addEventListener('click', () => {
			B.getDef(wordSpan);
		});
		word.appendChild(wordSpan);

		const modOptions = B.createElem('div', ['mod-options']);

		const modClose = B.createElem('button', ['mod-close'], undefined, '/img/mod-close.svg');
		modClose.addEventListener('click', ev => {
			B.closeModOptions(ev.currentTarget, false);
			B.btnAnim(modClose);
		});

		const modBtn = B.createElem('button', ['mod-btn'], undefined, '/img/mod-down-arrow.svg');
		modBtn.addEventListener('click', ev => {
			B.modifyChain(ev.currentTarget);
			B.btnAnim(modBtn);
		});

		const prevBtn = B.createElem('button', ['prev'], undefined, '/img/mod-left-arrow.svg');
		prevBtn.addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'prev');
			B.btnAnim(prevBtn);
		});

		const nextBtn = B.createElem('button', ['next'], undefined, '/img/mod-right-arrow.svg');
		nextBtn.addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'next');
			B.btnAnim(nextBtn);
		});

		modOptions.appendChild(modClose);
		modOptions.appendChild(modBtn);
		modOptions.appendChild(prevBtn);
		modOptions.appendChild(nextBtn);

		const modOpen = B.createElem('button', ['mod-open']);
		modOpen.addEventListener('click', ev => {
			if (!B.modIsOpen) {
				B.openModOptions(ev.currentTarget);
				B.btnAnim(modOpen);
			}
		});
		if (editMode) modOpen.classList.add('edit');
		
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
	};

	/* testing keyboard users */
	document.addEventListener('keydown', ev => {
		if (ev.which == 9) document.body.classList.add('keyboard');
	});

	document.addEventListener('mousedown', ev => {
		document.body.classList.remove('keyboard');
	});
});