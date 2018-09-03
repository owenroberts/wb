window.addEventListener('load', function() {

	/* new syn */
	B.newSyn = function(elem, dir) {

		const node = elem.parentNode;
		const index = +node.dataset.index;
		const syndex = +node.dataset.syndex;
		const len = B.data.chains[B.currentChain][index].alts.length;

		/* first check to see there is another alt */
		if (syndex != 0 && dir == 'prev' ||
			syndex != len - 1 && dir == 'next') {

			const word = node.dataset.word;
			const newSyndex = syndex + (dir == 'prev' ? -1 : 1);
			const syn = B.data.chains[B.currentChain][index].alts[newSyndex]; /* should be like window.Chain */
			node.children[0].textContent = syn;
			node.dataset.syndex = newSyndex;
			node.dataset.word = syn;
			
		
			/* slightly wack way of hiding/showing next/prev buttons
				these look awful */
			if (syndex == 0 && newSyndex > 0) {
				elem.previousElementSibling.classList.add('exists');
			} else if (syndex == 1 && newSyndex == 0) {
				elem.classList.remove('exists');
			} else if (newSyndex == len - 1) {
				elem.classList.remove('exists');
			} else if (syndex == len - 1 && newSyndex == syndex - 1) {
				elem.nextElementSibling.classList.add('exists');
			}
	
			/* hide other nodes */
			const nodes = elem.parentNode.parentNode.children;
			for (let i = index + 1; i < nodes.length - 1; i++) {
				nodes[i].classList.replace('fade-in', 'fade-grey');
			}
		}
	}

	const prevBtns = document.getElementsByClassName('prev');
	for (let i = 0; i < prevBtns.length; i++) {
		prevBtns[i].addEventListener('click', function() {
			B.newSyn(this, 'prev');
		});
	}

	const nextBtns = document.getElementsByClassName('next');
	for (let i = 0; i < nextBtns.length; i++) {
		nextBtns[i].addEventListener('click', function() {
			B.newSyn(this, 'next');
		});
	}

	// ** modify chain ** //
	B.modifyChain = function() {

		const elem = this;
		const node = elem.parentNode;
		const index = +node.dataset.index;
		const nodes = elem.parentNode.parentNode.children;
		const alt = node.dataset.word;

		/* get all syns for new chain algorithm */
		var usedSynonyms = [B.data.start];
		// console.log(index);
		for (let i = 0; i < index + 1; i++) {
			if (B.data.chains[B.currentChain][i].alts) {
				for (var j = 0; j < B.data.chains[B.currentChain][i].alts.length; j++) {
					usedSynonyms.push(B.data.chains[B.currentChain][i].alts[j]);
				}
			}
		}
		// console.log(usedSynonyms);

		$.ajax({
			url: '/search/modified',
			type: 'get',
			dataType:'json',
			data: {
				s: alt,
				e: B.data.end,
				sl: 10,
				nl: 10 - index,
				as: usedSynonyms
			},
			success: function(obj) {
				if (obj.errormsg) {
					/* report error */
					const err = 'We couldn\'t find a chain between "' + alt + '" and "' + B.data.end + '".';
					const option = "Try swiping back to the previous synonym, or forward to the next.";
					B.report(err + "<br><br>" + option);
					/*node.classList.add("mod-error");*/ // something to remove node?
					B.noTouching = false;
				} else {

					B.data.chains[B.currentChain][index].word = alt;
					B.data.chains[B.currentChain].splice(index + 1, B.data.chains[B.currentChain].length - 1);
					obj.data.chain.slice(1).map(o => {
						B.data.chains[B.currentChain].push(o) 
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
					for (let i = index + 1; i < B.data.chains[B.currentChain].length - 1; i++) {
						B.makeNode(i, elem.parentNode.parentNode);
					}
				}
			}
		});
	}

	const modBtns = document.getElementsByClassName('mod-btn');
	for (let i = 0; i < nextBtns.length; i++) {
		modBtns[i].addEventListener('click', B.modifyChain);
	}
});