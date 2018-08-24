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
		for (let i = index + 1; i < nodes.length; i++) {
			/* maybe do all these as css classes */
			$(nodes[i]).animate({
				opacity: 0.3
			}, fadeDur/2);
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
		const nodes = elem.parentNode.parentNode.children;
		const alt = node.dataset.word;

		/* hide other nodes */
		for (let i = index + 1; i < nodes.length; i++) {
			/* maybe do all these as css classes */
			$(nodes[i]).animate({
				opacity: 0.3
			}, fadeDur/2);
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
					var err = 'We couldn\'t find a chain between "' + alt + '" and "' + data.end + '".';
					var option = "Try swiping back to the previous synonym, or forward to the next.";
					report(err + "<br><br>" + option);
					elem.classList.add("mod-error", "node");
					noTouching = false;
					$('.ldrimg').remove();
				} else {
					const newData = obj.data;
					/* modify main chain data */
					for (var i = index + 1; i < data.chain.length; i++) {
						data.chain[i] = newData.chain[i - index];
					}

					for (let i = index; i < nodes.length; i++) {
						$(nodes[i]).animate({
							opacity: 1
						}, fadeDur/2);
					}

					const waitTime = nodes.length * fadeDur/2;
					setTimeout(function() {
						noTouching = false;
					}, waitTime + fadeDur);
					setTimeout(function() {
						$('.ldrimg').remove();
					}, waitTime);

					/* remove old nodes */
					for (let i = index + 1; i < nodes.length - 1; i++) {
						let n = i;
						$(nodes[i]).fadeOut((nodes.length - i) * fadeDur/2, function(n) {
							this.remove();
						});
					}

					/* add new nodes */
					for (let i = 1; i < newData.chain.length - 1; i++) {
						const newnodedad = document.createElement("div")
						newnodedad.classList.add('node-wrap');

						const newsynnode = document.createElement("div")
						newsynnode.classList.add('node');
						newsynnode.dataset.index = index + i;
						newsynnode.textContent = newData.chain[i].word;
						newsynnode.dataset.syndex = newData.chain[i].syndex;
						
						newnodedad.appendChild(newsynnode);
						elem.parentNode.parentNode.insertBefore(newnodedad, elem.parentNode.parentNode.lastChild);
						
						$(newnodedad).delay(i * fadeDur/2 + waitTime + fadeDur/2).fadeIn(fadeDur);
					}
					
				}
			}
		});
	}
});