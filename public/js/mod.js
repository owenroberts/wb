$(document).ready(function() {

	/* new syn */
	function newSyn(ev, elem, dir) {

		const node = elem.parentNode;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		const syndex = +node.dataset.syndex;
		const newSyndex = syndex + (dir == 'prev' ? -1 : 1);
		const syn = window.data.chain[index].alts[newSyndex]; /* should be like window.Chain */
		const len = window.data.chain[index].alts.length;
		node.children[0].textContent = syn;
		node.dataset.syndex = newSyndex;
		node.dataset.word = syn;

	
		/* slightly wack way of hiding/showing next/prev buttons
			these look awful */
		if (syndex == 0 && newSyndex > 0) {
			elem.previousElementSibling.classList.add('exists');
		} else if (syndex == 1 && newSyndex == 0) {
			elem.classList.remove('exists');
		} else if (newSyndex == len - 2) {
			elem.classList.remove('exists');
		} else if (syndex == len - 2 && newSyndex == syndex - 1) {
			elem.nextElementSibling.classList.add('exists');
		}

		/* hide other nodes */
		const nodes = elem.parentNode.parentNode.children;
		for (let i = index + 1; i < nodes.length - 1; i++) {
			/* maybe do all these as css classes */
			nodes[i].classList.replace('fade-in', 'fade-grey');
		}
	}

	const prevBtns = document.getElementsByClassName('prev');
	for (let i = 0; i < prevBtns.length; i++) {
		prevBtns[i].addEventListener('click', function(ev) {
			newSyn(ev, this, 'prev');
		});
	}

	const nextBtns = document.getElementsByClassName('next');
	for (let i = 0; i < nextBtns.length; i++) {
		nextBtns[i].addEventListener('click', function(ev) {
			newSyn(ev, this, 'next');
		});
	}

	const modBtns = document.getElementsByClassName('mod-btn');
	for (let i = 0; i < nextBtns.length; i++) {
		modBtns[i].addEventListener('click', function(ev) {
			modifyChain(this);
		});
	}

	/* tap ? */

	// ** modify chain ** //
	function modifyChain(elem) {

		const node = elem.parentNode;
		const index = +node.dataset.index;
		const nodes = document.getElementsByClassName('node'); // elem.parentNode.parentNode.children;
		const alt = node.dataset.word;

		/* grey out other nodes */
		for (let i = index + 1; i < nodes.length - 1; i++) {
			nodes[i].classList.add('fade-grey');
		}

		/* get all syns for new chain algorithm */
		var allsynonyms = [data.start];
		for (let i = 0; i < index; i++) {
			if (data.chain[i].alts) {
				for (var j = 0; j < data.chain[i].alts.length; j++) {
					allsynonyms.push(data.chain[i].alts[j]);
				}
			}
		}

		$.ajax({
			url: '/search/modified',
			type: 'get',
			dataType:'json',
			data: {
				s: alt,
				e: data.end,
				sl: 10,
				nl: 10 - index,
				as: allsynonyms
			},
			success: function(obj) {
				if (obj.errormsg) {
					/* report error */
					const err = 'We couldn\'t find a chain between "' + alt + '" and "' + data.end + '".';
					const option = "Try swiping back to the previous synonym, or forward to the next.";
					report(err + "<br><br>" + option);
					/*node.classList.add("mod-error");*/
					noTouching = false;
					$('.ldrimg').remove();
				} else {
					const newData = obj.data;
					
					/* modify main chain data */
					for (let i = index + 1; i < data.chain.length; i++) {
						data.chain[i] = newData.chain[i - index];
					}

					const waitTime = nodes.length * fadeDur/2;
					setTimeout(() => {
						noTouching = false;
					}, waitTime + fadeDur);
					setTimeout(() => {
						$('.ldrimg').remove();
					}, waitTime);

					/* remove old nodes */
					const len = nodes.length - index - 2;
					for (let i = 0; i < len; i++) {
						nodes[index + 1].classList.replace('fade-grey', 'fade-out');
						setTimeout(() => {
							nodes[index + 1].remove();
						}, fadeDur);
					}

					/* add new nodes */
					for (let i = 1; i < newData.chain.length - 1; i++) {
						const node = document.createElement("div")
						node.classList.add('node');
						node.dataset.index = index + i;
						node.dataset.word = newData.chain[i].word;
						node.dataset.syndex = newData.chain[i].syndex

						const word = document.createElement('div');
						word.textContent = newData.chain[i].word;
						word.classList.add('word');
						
						const defBtn = document.createElement('div');
						defBtn.textContent = 'd';
						defBtn.classList.add('def');

						const prevBtn = document.createElement('div');
						prevBtn.textContent = ' < ';
						prevBtn.classList.add('prev');
						prevBtn.addEventListener('click', function(ev) {
							newSyn(ev, this, 'prev');
						});
						if (newData.chain[i].syndex > 0)
							prevBtn.classList.add('exists');

						const nextBtn = document.createElement('div');
						nextBtn.textContent = ' > ';
						nextBtn.classList.add('prev');
						if (newData.chain[i].syndex < newData.chain[i].alts.length)
							nextBtn.classList.add('exists');
						nextBtn.addEventListener('click', function(ev) {
							newSyn(ev, this, 'next');
						});

						const modBtn = document.createElement('div');
						modBtn.textContent = 'm';
						modBtn.classList.add('mod-btn');
						modBtn.addEventListener('click', function(ev) {
							modifyChain(this);
						});

						node.appendChild(word);
						node.appendChild(defBtn);
						node.appendChild(prevBtn);
						node.appendChild(nextBtn);
						node.appendChild(modBtn);

						const parent = elem.parentNode.parentNode;
						parent.insertBefore(node, parent.lastElementChild);

						
						setTimeout(() => {
							node.classList.add('fade-in');
						}, i * fadeDur)
					}
					
				}
			}
		});
	}
});