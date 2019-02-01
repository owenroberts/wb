window.addEventListener('load', function() {

	B.modIsOpen = false;

	/* new syn */
	B.newSyn = e => {
		const node = e.parentNode.parentNode;
		const wordSpan = node.children[0].children[0];
		const index = +node.dataset.index;
		const syndex = +node.dataset.syndex;
		const len = B.chains[B.currentChain][index].alts.length;

		const word = node.dataset.word;
		const dir = e.classList[0];
		let newSyndex = syndex + (dir == 'prev' ? -1 : 1);
		if (newSyndex == -1)
			newSyndex = len - 1;
		else if (newSyndex == len)
			newSyndex = 0;

		const syn = B.chains[B.currentChain][index].alts[newSyndex]; /* should be like window.Chain */
			
		wordSpan.classList.add('fade-out');
		setTimeout(() => {
			wordSpan.classList.replace('fade-out', 'fade-in');
			wordSpan.textContent = syn;
			node.dataset.syndex = newSyndex;
			node.dataset.word = syn;
		}, B.fadeDur);
	};

	// ** modify chain ** //
	B.modifyChain = e => {

		const node = e.parentNode.parentNode;
		const index = +node.dataset.index;
		const nodes = node.parentNode.children;
		const alt = node.dataset.word;

		console.log(  )

		if (alt == B.chains[B.currentChain][index].word) {
			B.report("Error", "This synonym is already in the chain.  Try the next or previous synonym.");
		} else {
			/* get all syns for new chain algorithm */
			var usedSynonyms = [B.startWord, alt, B.endWord];
			/* index, index + 1, should include current alt? */
			for (let i = 0; i < index; i++) {
				if (B.chains[B.currentChain][i].alts) {
					for (var j = 0; j < B.chains[B.currentChain][i].alts.length; j++) {
						usedSynonyms.push(B.chains[B.currentChain][i].alts[j]);
					}
				}
			}

			const url = `/chain?s=${alt}&e=${B.endWord}&sl=10&nl=${10 - index}&as=${usedSynonyms}`;

			fetch(url)
				.then(response => { return response.json() })
				.then(obj => {
					if (obj.errormsg) {
						const err = `We couldn't find a chain between "${alt}" and "${B.endWord}".`;
						const option = "Try the previous or next synonym.";
						B.report("Error", `${err}<br><br>${option}`);
						B.noTouching = false;
					} else {
						B.closeModOptions(e, true);
						B.queryStrings[B.currentChain] += '-' + obj.data.queryString;
						B.chains[B.currentChain][index].word = alt;
						B.chains[B.currentChain].splice(index + 1, B.chains[B.currentChain].length - 1);
						obj.data.chain.slice(1).map(o => {
							B.chains[B.currentChain].push(o) 
						});

						const waitTime = nodes.length * B.fadeDur/2;
						setTimeout(() => {
							noTouching = false;
						}, waitTime + B.fadeDur);

						/* remove old nodes */
						(function fadeOutNode() {
							const n = nodes[nodes.length - 2];
							n.classList.replace('fade-grey', 'fade-out');
							n.addEventListener('transitionend', () => { 
								n.remove();
								if (nodes.length - 2 == index) {
									fadeInNode(index + 1); /* add new nodes */
								} else {
									fadeOutNode();
								}
							});
						}());

						function fadeInNode(index) {
							const n = B.makeNode(index);
							node.parentNode.insertBefore(n, node.parentNode.lastElementChild);
							B.fade(n, 'in', 'flex', () => {
								if (index < B.chains[B.currentChain].length - 2) {
									fadeInNode(++index);
								} else {
									B.modIsOpen = false;
								}
							});
						}
					}
				});
		}
	};

	B.openModOptions = e => {
		if (!B.modIsOpen && !B.isAnimating) {
			e.style.display = 'none';
			e.previousElementSibling.style.display = 'inline-block';
			B.modIsOpen = true;
			document.getElementsByClassName('nodes')[B.currentChain].classList.add('mod-disabled'); // nodes
			B.newSyn(e.parentNode.children[1].children[3]); // next syn
			/* hide other nodes */
			for (let i = +e.parentNode.dataset.index + 1; i < e.parentNode.parentNode.children.length - 1; i++) {
				e.parentNode.parentNode.children[i].classList.replace('fade-in', 'fade-grey');
			}
		}
	};
	
	B.closeModOptions = (e, isMod) => {
		const node = e.parentNode.parentNode;
		const index = +node.dataset.index;
		e.parentNode.style.display = 'none';
		e.parentNode.nextElementSibling.style.display = 'inline-block';	
		document.getElementsByClassName('nodes')[B.currentChain].classList.remove('mod-disabled'); // nodes

		if (!isMod) {
			/* change original word back */
			node.dataset.word = node.children[0].children[0].textContent = B.chains[B.currentChain][index].word;
			B.modIsOpen = false;
			/* show other nodes */
			const nodes = node.parentNode.children;
			for (let i = index + 1; i < nodes.length - 1; i++) {
				nodes[i].classList.replace('fade-grey', 'fade-in');
			}
		}
	};
});