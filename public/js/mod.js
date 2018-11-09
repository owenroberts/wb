window.addEventListener('load', function() {

	/* new syn */
	B.newSyn = function(elem, dir) {

		const node = elem.parentNode.parentNode;
		const index = +node.dataset.index;
		const syndex = +node.dataset.syndex;
		const len = B.chains[B.currentChain][index].alts.length;

		const word = node.dataset.word;
		let newSyndex = syndex + (dir == 'prev' ? -1 : 1);
		if (newSyndex == -1)
			newSyndex = len - 1;
		else if (newSyndex == len)
			newSyndex = 0;

		const syn = B.chains[B.currentChain][index].alts[newSyndex]; /* should be like window.Chain */
		node.children[0].textContent = syn;
		node.dataset.syndex = newSyndex;
		node.dataset.word = syn;
		
		/* hide other nodes */
		const nodes = node.parentNode.children;
		for (let i = index + 1; i < nodes.length - 1; i++) {
			nodes[i].classList.replace('fade-in', 'fade-grey');
		}
	}

	const prevBtns = document.getElementsByClassName('prev');
	for (let i = 0; i < prevBtns.length; i++) {
		prevBtns[i].addEventListener('click', ev => {
			B.newSyn(ev.currentTarget, 'prev');
		});
	}

	const nextBtns = document.getElementsByClassName('next');
	for (let i = 0; i < nextBtns.length; i++) {
		nextBtns[i].addEventListener('click', function() {
			B.newSyn(this, 'next');
		});
	}

	// ** modify chain ** //
	B.modifyChain = ev => {

		B.closeModOptions(ev.currentTarget);

		const node = ev.currentTarget.parentNode.parentNode;
		const index = +node.dataset.index;
		const nodes = node.parentNode.children;
		const alt = node.dataset.word;

		/* get all syns for new chain algorithm */
		var usedSynonyms = [B.startWord];
		// console.log(index);
		for (let i = 0; i < index + 1; i++) {
			if (B.chains[B.currentChain][i].alts) {
				for (var j = 0; j < B.chains[B.currentChain][i].alts.length; j++) {
					usedSynonyms.push(B.chains[B.currentChain][i].alts[j]);
				}
			}
		}

		$.ajax({
			url: '/chain',
			type: 'get',
			dataType:'json',
			data: {
				s: alt,
				e: B.endWord,
				sl: 10,
				nl: 10 - index,
				as: usedSynonyms
			},
			success: function(obj) {
				if (obj.errormsg) {
					/* report error */
					const err = 'We couldn\'t find a chain between "' + alt + '" and "' + B.chain.end + '".';
					const option = "Try swiping back to the previous synonym, or forward to the next.";
					B.report(err + "<br><br>" + option);
					/*node.classList.add("mod-error");*/ // something to remove node?
					B.noTouching = false;
				} else {
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
					const len = nodes.length - index - 2;
					for (let i = 0; i < len; i++) {
						nodes[index + 1].classList.replace('fade-grey', 'fade-out');
						setTimeout(() => {
							nodes[index + 1].remove();
						}, B.fadeDur);
					}

					/* add new nodes */
					for (let i = index + 1; i < B.chains[B.currentChain].length - 1; i++) {
						B.makeNode(i, node.parentNode);
					}
				}
			}
		});
	}

	const modBtns = document.getElementsByClassName('mod-btn');
	for (let i = 0; i < nextBtns.length; i++) {
		modBtns[i].addEventListener('click', B.modifyChain);
	}

	B.openModOptions = e => {
		if (!modIsOpen) {
			e.style.display = 'none';
			e.previousElementSibling.style.display = 'inline-block';
			modIsOpen = true;
			document.getElementsByClassName('nodes')[B.currentChain].classList.add('mod-disabled'); // nodes
		}
	};
	
	B.closeModOptions = e => {
		e.parentNode.style.display = 'none';
		e.parentNode.nextElementSibling.style.display = 'inline-block';	
		modIsOpen = false;
		document.getElementsByClassName('nodes')[B.currentChain].classList.remove('mod-disabled'); // nodes		
	};

	const openMods = document.getElementsByClassName('mod-open');
	Array.from(openMods).forEach(function(openMod) {
		openMod.addEventListener('click', ev => {
			B.openModOptions(ev.currentTarget);
		});
	});

	let modIsOpen = false;
	const closeMods = document.getElementsByClassName('mod-close');
	Array.from(closeMods).forEach(function(closeMod) {
		closeMod.addEventListener('click', ev => {
			B.closeModOptions(ev.currentTarget);
		});
	});
});