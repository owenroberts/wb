$(document).ready(function() {

	/* new syn */
	function newSyn(ev, elem, dir) {

		const node = elem.parentNode;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		const syndex = +node.dataset.syndex;
		const newSyndex = syndex + (dir == 'prev' ? -1 : 1)
		const syn = window.data.chain[index].alts[newSyndex]; /* should be like window.Chain */
		node.children[0].textContent = syn;
		node.dataset.syndex = newSyndex;

		/*
			much more to fix
		*/

		/* hide other nodes */
		const nodes = elem.parentNode.parentNode.children;
		for (let i = index + 1; i < nodes.length; i++) {
			/* maybe do all these as css classes */
			$(nodes[i]).animate({
				opacity: 0.3
			}, fadeDur/2);
		}
		

		

	}
	$('.prev').on('click', function(ev) { newSyn(ev, this, 'prev'); });
	$('.prev').on('tap', function(ev) { newSyn(ev, this, 'prev'); });
	$('.next').on('click', function(ev) { newSyn(ev, this, 'next'); });
	$('.next').on('tap', function(ev) { newSyn(ev, this, 'next'); });


	// ** modify chain ** //
	function modifyChain(elem, alt, word, prevIndex) {

		var nodeIndex = +elem.dataset.index;
		var chainIndex = +elem.dataset.index;
		var nodes = elem.parentNode.parentNode.children;

		/* hide other nodes */
		for (let i = chainIndex; i < nodes.length; i++) {
			/* maybe do all these as css classes */
			$(nodes[i]).animate({
				opacity: 0.3
			}, fadeDur/2);
		}

		/* get all syns for new chain algorithm */
		var allsynonyms = [data.start];
		for (let i = 0; i < chainIndex; i++) {
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
				nl: 10 - chainIndex,
				as: allsynonyms
			},
			success: function(obj) {
				if (obj.errormsg) {
					/* report error */
					var err = 'We couldn\'t find a chain between "' + alt + '" and "' + data.end + '".';
					var option = "Try swiping back to the previous synonym, or forward to the next.";
					report(err + "<br><br>" + option);
					/* set node back to original */
						//elem.textContent = word;
						//elem.dataset.index = prevIndex;
					/* don't need word or prevIndex if not setting back to original */
					elem.classList.add("mod-error", "node");
					noTouching = false;
					$('.ldrimg').remove();
				} else {
					const new_data = obj.data;
					/* modify main chain data */
					for (var i = chainIndex + 1; i < data.chain.length; i++) {
						data.chain[i] = new_data.chain[i - chainIndex];
					}

					for (let i = chainIndex; i < nodes.length; i++) {
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
					for (let i = chainIndex + 1; i < nodes.length - 1; i++) {
						let n = i;
						$(nodes[i]).fadeOut((nodes.length - i) * fadeDur/2, function(n) {
							this.remove();
						});
					}

					/* add new nodes */
					for (let i = 1; i < new_data.chain.length - 1; i++) {
						const newnodedad = document.createElement("div")
						newnodedad.classList.add('node-wrap');

						const newsynnode = document.createElement("div")
						newsynnode.classList.add('node');
						newsynnode.dataset.index = chainIndex + i;
						newsynnode.textContent = new_data.chain[i].word;
						newsynnode.dataset.syndex = new_data.chain[i].syndex;
						
						newnodedad.appendChild(newsynnode);
						elem.parentNode.parentNode.insertBefore(newnodedad, elem.parentNode.parentNode.lastChild);
						
						$(newnodedad).delay(i * fadeDur/2 + waitTime + fadeDur/2).fadeIn(fadeDur);
					}
					
				}
				/* make new nodes draggable */
				$('.node').draggable(dragParams); 
			}
		});
	}
});