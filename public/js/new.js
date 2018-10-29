window.addEventListener('load', function() {
	
	function getNewPath(ev) {
		ev.stopPropagation();
		
		if (B.tooltips) 
			$('#report').trigger('click');

		if (!B.noMorePaths) {
			B.fade(B.loader, 'in', false);
			makeNewPath();
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
	for (let i = 0; i < dots.length; i++) {
		dots[i].addEventListener('click', switchChain);
	}

	function makeNewPath() {
		let nodelimit;
		if (B.chains.length < 10) {
			do {
				nodelimit = B.getRandomInt(2,20);
			} while (B.nodelimitArray.indexOf(nodelimit) != -1);
			//nodelimit = 2; // break it for testing
			B.nodelimitArray.push(nodelimit);
			
			const synonymlevel = 10;  // should synonym level be randomized?
			B.queryStrings.push(B.chain.start + nodelimit + B.chain.end + synonymlevel);

			$.ajax({
				url: '/search/add',
				type: 'get',
				dataType:'json',
				data: {
					s: B.chain.start,
					e: B.chain.end,
					sl: synonymlevel,
					nl: nodelimit
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

						B.chains.push(obj.data.chain);
						B.currentChain++;

						const chain = document.createElement("div");
						chain.classList.add('chain');
						chain.id = "chain-" + B.currentChain;
						
						const nodes = document.createElement("div");
						nodes.classList.add('nodes');
						chain.append(nodes);
						
						const startNode = document.createElement("div");
						startNode.classList.add('node');

						const startWord = document.createElement('div');
						startWord.classList.add('word');
						startWord.textContent = B.chains[B.currentChain][0].word;
						
						startNode.appendChild(startWord);
						nodes.append(startNode);
						setTimeout(() => {
							startNode.classList.add('fade-in');
						}, B.fadeDur);

						const endNode = document.createElement("div");
						endNode.classList.add('node');

						const endWord = document.createElement('div');
						endWord.classList.add('word');
						const idx = B.chains[B.currentChain].length - 1;
						endWord.textContent = B.chains[B.currentChain][idx].word;

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
						document.getElementById('chain-dots').classList.add('slide-up');
						setChainDepth();

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