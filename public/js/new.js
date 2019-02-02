window.addEventListener('load', function() {
	
	function getNewPath(ev) {
		ev.stopPropagation();
		plusBtn.children[0].classList.add('active');
		setTimeout(() => {
			plusBtn.children[0].classList.remove('active');
		}, 800);
		if (!B.noMorePaths) {
			B.fade(B.loader, 'in', 'block');
			B.newChain();
		} else {
			B.report("The algorithm is not able to generate more results based on the current parameters.");
		}
	}

	function setChainDepth() {
		/* crap hack to close any open mod options while switching chains */
		Array.from(document.getElementsByClassName('mod-options')).filter(e => e.style.display == 'inline-block').forEach(e => B.closeModOptions(e.children[0], false));

		for (let i = 0; i < dots.length; i++) {
			if (i == B.currentChain) {
				dots[i].classList.add('current');
				chains[i].classList.add('current');
			} else {
				if (dots[i].classList.contains('current'))
					dots[i].classList.remove('current');
				if (chains[i].classList.contains('current'))
					chains[i].classList.remove('current');
			}
		}

		if (B.currentChain == 0) {
			nextChainBtn.classList.add('clickable');
			prevChainBtn.classList.remove('clickable');
		} 
		if (B.currentChain > 0 && B.currentChain < B.chains.length) {
			prevChainBtn.classList.add('clickable');
			nextChainBtn.classList.add('clickable');
		}
		if (B.currentChain == B.chains.length - 1) {
			nextChainBtn.classList.remove('clickable');
		} 
	}

	B.showChain = index => {
		if (index < B.chains.length && B.currentChain != index && index >= 0) {
			B.currentChain = index;
			setChainDepth();
		}
	}

	const nextChainBtn = document.getElementById('next-chain');
	const prevChainBtn = document.getElementById('prev-chain');
	const dots = document.getElementsByClassName('chain-dot');
	const chains = document.getElementsByClassName('chain');

	nextChainBtn.addEventListener('click', () => {
		if (B.currentChain + 1 < B.chains.length && !B.isAnimating) {
			B.currentChain = B.currentChain + 1;
			setChainDepth();
			B.btnAnim(nextChainBtn);
		}
	});
	prevChainBtn.addEventListener('click', () => {
		if (B.currentChain > 0 && !B.isAnimating) {
			B.currentChain = B.currentChain - 1;
			setChainDepth();
			B.btnAnim(prevChainBtn);
		}
	});

	B.makeChain = data => {

		B.isAnimating = true;
		setTimeout(() => {
			B.isAnimating = false;
		}, B.fadeDur * data.chain.length);

		B.queryStrings.push(data.queryString);
		B.chains.push(data.chain);
		B.currentChain++;

		const chain = B.createElem('div', ['chain', 'fade', 'visible']);
		// chain.style.left = B.currentChain * window.innerWidth + 'px';
		chain.id = "chain-" + B.currentChain;
		
		const nodes = document.createElement("div");
		nodes.classList.add('nodes');
		chain.append(nodes);
		
		const startNode = B.createElem('div', ['node', 'fade', 'hidden']);
		startNode.dataset.word = B.startWord;
		startNode.dataset.index = 0;
		const startWord = B.createElem('div', ['word']);
		const startWordSpan = B.createElem('span', [], B.startWord);
		startWordSpan.addEventListener('click', B.getDef);
		
		startWord.appendChild(startWordSpan);
		startNode.appendChild(startWord);
		nodes.append(startNode);

		const endNode = B.createElem('div', ['node', 'fade', 'hidden']);
		endNode.dataset.word = B.endWord;
		endNode.dataset.index = B.chains[B.currentChain].length - 1;
		const endWord =  B.createElem('div', ['word']);
		const endWordSpan = B.createElem('span', [], B.endWord);
		endWordSpan.addEventListener('click', B.getDef);

		endWord.appendChild(endWordSpan);
		endNode.appendChild(endWord);
		nodes.append(endNode);
		
		document.getElementById('chains').appendChild(chain);

		B.fade(startNode, 'in', 'flex', () => {
			fadeNode(1);
		});

		function fadeNode(index) {
			const node = B.makeNode(index);
			nodes.insertBefore(node, nodes.lastElementChild);
			B.fade(node, 'in', 'flex', () => {
				if (index < B.chains[B.currentChain].length - 2) {
					fadeNode(++index);
				} else {
					endNode.classList.add('fade-in');
				}
			});
		}
		
		const dot = document.createElement('div');
		dot.dataset.index = B.currentChain;
		dot.classList.add('chain-dot');
		dot.addEventListener('click', ev => {
			B.showChain(ev.currentTarget.dataset.index);
		});
		document.getElementById('dots').appendChild(dot);

		if (B.chains.length > 1)
			document.getElementById('chain-nav').classList.add('slide-up');
		setChainDepth();
	};

	B.newChain = (params, callback) => {
		if (B.chains.length < 10) {
			let nodeLimit, synonymLevel, startWord, endWord;
			if (params) {
				startWord = params.start;
				endWord = params.end;
				nodeLimit = params.nl;
				synonymLevel = params.sl;
			} else {
				startWord = B.startWord;
				endWord = B.endWord;
				do {
					nodeLimit = B.getRandomInt(2,20);
				} while (B.nodeLimitArray.indexOf(nodeLimit) != -1);
				synonymLevel = 10;  // should synonym level be randomized?

			}
			B.nodeLimitArray.push(nodeLimit);

			B.fade(B.loader, 'in', 'none');

			const url = `/chain?s=${startWord}&e=${endWord}&sl=${synonymLevel}&nl=${nodeLimit}`;
			fetch(url)
				.then(response => { return response.json(); })
				.then(obj => {
					B.fade(B.loader, 'in', 'block');
					if (obj.errormsg) {
						if (B.nodeLimitArray.length < 9) {
							B.newChain(params, callback);
						} else {
							B.noMorePaths = true;
							B.fade(B.loader, 'out', 'none');
							B.report(obj.errormsg);
						}
					} else {
						if (callback)
							callback();
						B.makeChain(obj.data);
						B.fade(B.loader, 'out', 'none');
					}
				});
		} else {
			B.fade(B.loader, 'out', 'none');
			B.report('You have reached the maximum number of chains.');
		}				
	}

	const plusBtn = document.getElementById('plus');
	plusBtn.addEventListener('tap', getNewPath);
	plusBtn.addEventListener('click', getNewPath);
});