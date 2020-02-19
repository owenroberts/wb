window.addEventListener('load', function() {

	let modIsOpen = false;
	let editIsOpen = false;

	/* new syn */
	B.newSyn = elem => {
		const node = elem.parentNode.parentNode;
		const wordSpan = node.children[0].children[0];
		const index = +node.dataset.index;
		const syndex = +node.dataset.syndex;
		const len = B.chains[B.currentChain][index].alts.length;

		const word = node.dataset.word;
		const dir = elem.classList[0];
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

	/** modify chain **/
	B.modifyChain = elem => {

		const node = elem.parentNode.parentNode;
		const index = +node.dataset.index;
		const nodes = node.parentNode.children;
		const alt = node.dataset.word;


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
						B.closeModOptions(elem, true);
						B.queryStrings[B.currentChain] += '-' + obj.data.queryString;
						B.chains[B.currentChain][index].word = alt;
						B.chains[B.currentChain].splice(index + 1, B.chains[B.currentChain].length - 1);
						obj.data.chain.slice(1).map(o => {
							B.chains[B.currentChain].push(o) 
						});

						if (index + 1 < nodes.length - 1) fadeOutNode();
						else fadeInNode(index + 1);

						function fadeOutNode() {
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
						}

						function fadeInNode(index) {
							const n = B.makeNode(index, true);
							node.parentNode.insertBefore(n, node.parentNode.lastElementChild);
							B.fade(n, 'in', 'flex', () => {
								if (index < B.chains[B.currentChain].length - 2) {
									fadeInNode(++index);
								} else {
									modIsOpen = false;
									noTouching = false;
								}
							});
						}
					}
				});
		}
	};

	B.openModOptions = elem => {
		if (!modIsOpen && !B.isAnimating) {
			elem.style.display = 'none';
			elem.previousElementSibling.style.display = 'inline-block';
			modIsOpen = true;
			document.getElementsByClassName('nodes')[B.currentChain].classList.add('mod-disabled'); // nodes
			B.newSyn(elem.parentNode.children[1].children[3]); // next syn

			/* focus next button */
			elem.previousElementSibling.children[3].focus();
		

			/* hide other nodes */
			for (let i = +elem.parentNode.dataset.index + 1; i < elem.parentNode.parentNode.children.length - 1; i++) {
				elem.parentNode.parentNode.children[i].classList.replace('fade-in', 'fade-grey');
			}
		}
	};
	
	B.closeModOptions = (elem, isMod) => {
		const node = elem.parentNode.parentNode; /* the main node derived from the mod close btn */
		const index = +node.dataset.index;
		elem.parentNode.style.display = 'none';
		elem.parentNode.nextElementSibling.style.display = 'inline-block';	
		document.getElementsByClassName('nodes')[B.currentChain].classList.remove('mod-disabled'); // nodes

		if (!isMod) {
			/* change original word back */
			node.dataset.word = node.children[0].children[0].textContent = B.chains[B.currentChain][index].word;
			modIsOpen = false;
			/* show other nodes */
			const nodes = node.parentNode.children;
			for (let i = index + 1; i < nodes.length - 1; i++) {
				nodes[i].classList.replace('fade-grey', 'fade-in');
			}
		}
	};

	B.closeMod = function() {
		/* crap hack to close any open mod options while switching chains */
		if (modIsOpen) {
			modIsOpen = false;
			Array.from(document.getElementsByClassName('mod-options'))
				.filter(elem => elem.style.display == 'inline-block')
				.forEach(elem => B.closeModOptions(elem.children[0], false));
		}

		if (editIsOpen) {
			editOpen = false;
			Array.from(document.getElementsByClassName('mod-open')).forEach(el => {
				el.classList.remove('edit');
			});
		}
	};

	/* edit options */
	const editBtn = document.getElementById('edit-bridge-btn');
	editBtn.addEventListener('click', toggleEdit);
	editBtn.addEventListener('tap', toggleEdit);

	function toggleEdit() {

		Array.from(document.getElementsByClassName('mod-open')).forEach(el => {
			/* check that it's the visible chain*/
			if (el.parentNode.parentNode.parentNode.classList.contains('current')) {
				if (editIsOpen) B.closeMod();
				else el.classList.add('edit');
			}
		});
		editIsOpen = !editIsOpen;
	}
});