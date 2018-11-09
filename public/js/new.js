window.addEventListener('load', function() {
	
	function getNewPath(ev) {
		ev.stopPropagation();
		if (!B.noMorePaths) {
			B.fade(B.loader, 'in', false);
			B.newChain();
		} else {
			B.report("The algorithm is not able to generate more results based on the current parameters.");
		}
	}

	function setChainDepth() {
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

	function switchChain() {
		const c = + this.dataset.index;
		if (B.currentChain != c) {
			B.currentChain = c;
			setChainDepth();
		}
	}

	function nextChain() {
		if (B.currentChain < B.chains.length - 1) {
			B.currentChain++;
			setChainDepth();
		}
	}

	function prevChain() {
		if (B.currentChain > 0) {
			B.currentChain--;
			setChainDepth();
		}
	}

	const nextChainBtn = document.getElementById('next-chain');
	const prevChainBtn = document.getElementById('prev-chain');
	const dots = document.getElementsByClassName('chain-dot');
	const chains = document.getElementsByClassName('chain');

	nextChainBtn.addEventListener('click', nextChain);
	prevChainBtn.addEventListener('click', prevChain);

	B.makeChain = (data) => {
		B.chains.push(data.chain);
		B.currentChain++;

		B.startWord = B.chains[B.currentChain][0].word;
		B.endWord = B.chains[B.currentChain][B.chains[B.currentChain].length - 1].word;

		const chain = document.createElement("div");
		chain.classList.add('chain');
		chain.id = "chain-" + B.currentChain;
		
		const nodes = document.createElement("div");
		nodes.classList.add('nodes');
		chain.append(nodes);
		
		const startNode = B.createElem('div', ['node']);
		startNode.dataset.word = B.startWord;
		startNode.dataset.index = 0;
		const startWord =  B.createElem('div', ['word']);
		const startWordSpan = B.createElem('span', [], B.startWord);
		startWordSpan.addEventListener('click', B.getDef);
		
		startWord.appendChild(startWordSpan);
		startNode.appendChild(startWord);
		nodes.append(startNode);
		setTimeout(() => {
			startNode.classList.add('fade-in');
		}, B.fadeDur);

		const endNode = B.createElem('div', ['node']);
		endNode.dataset.word = B.endWord;
		endNode.dataset.index = B.chains[B.currentChain].length - 1;
		const endWord =  B.createElem('div', ['word']);
		const endWordSpan = B.createElem('span', [], B.endWord);
		endWordSpan.addEventListener('click', B.getDef);

		endWord.appendChild(endWordSpan);
		endNode.appendChild(endWord);
		setTimeout(() => {
			endNode.classList.add('fade-in');
		}, B.fadeDur);
		nodes.append(endNode);

		for (let i = 1; i < B.chains[B.currentChain].length - 1; i++) {
			B.makeNode(i, nodes);
		}
		
		document.getElementById('chains').appendChild(chain);
		
		const dot = document.createElement('div');
		dot.dataset.index = B.currentChain;
		dot.classList.add('chain-dot');
		dot.addEventListener('click', switchChain);
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
			B.queryStrings.push(`${startWord}${nodeLimit}${endWord}${synonymLevel}`);
			$.ajax({
				url: '/chain',
				type: 'get',
				dataType:'json',
				data: {
					s: startWord,
					e: endWord,
					sl: synonymLevel,
					nl: nodeLimit
				},
				success: function(obj) {
					B.fade(B.loader, 'in', false);
					if (obj.errormsg) {
						if (B.nodelimitArray.length < 9) {
							makeNewPath();
						} else {
							B.noMorePaths = true;
							report("The algorithm is not able to generate more results based on the current parameters.");
						}
					} else {
						if (callback)
							callback();
						B.makeChain(obj.data);
						B.fade(B.loader, 'out', true);
					}
				}
			});
		} else {
			B.fade(B.loader, 'out', true);
			B.report('You have reached the maximum number of chains.');
		}				
	}

	const plusBtn = document.getElementById('plus');
	plusBtn.addEventListener('click', getNewPath);
});