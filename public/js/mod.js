$(document).ready(function() {

	/* drag nodes to modify chain */
	window.dragParams = {
		axis: 'x',
		distance: 1,
		containment: [-100, 0, 100, 0], /* 100 is hardcoded prob needs to be updated */
		start: function(event, ui) {
			/* get prev and next synonym from word in prev word synonyms */
			const word = this.textContent;
			const syndex = +this.dataset.syndex; // synonym level of word
			const index = +this.dataset.index; // index in chain
			const alts = data.chain[index].alts;
			
			/* if not there just x for now */
			const left = syndex > 0 ? alts[syndex - 1] : "x";
			const right = syndex < alts.length - 1 ? alts[syndex + 1] : "x";

			/* add left and right words below the node */
			const leftWord = document.createElement("div");
			leftWord.classList.add("alt", "left");
			leftWord.textContent = left;
			leftWord.dataset.syndex = syndex - 1;
			leftWord.dataset.index = index;
			this.parentNode.insertBefore(leftWord, this);

			const rightWord = document.createElement("div");
			rightWord.classList.add("alt", "right");
			rightWord.textContent = right;
			rightWord.dataset.syndex = syndex + 1;
			rightWord.dataset.index = index;
			this.parentNode.appendChild(rightWord);
		},
		drag: function(event, ui) {
			/* measure amount of drag, if its past the word, modify, change bg color at 3/4 */
			const offset = this.offsetLeft;
			this.offset = offset; /* save offset for stop function */
			if (offset > 0) {
				const left = this.previousSibling;
				if (offset > left.clientWidth * 3/4 && left.textContent != "x") {
					left.classList.add("active");
				} else {
					left.classList.remove("active");
				}
			} else {
				const right = this.nextSibling;
				if (Math.abs(offset) > right.clientWidth * 3/4 && right.textContent != "x") {
					right.classList.add("active");
				} else {
					right.classList.remove("active");
				}
			}
		},
		stop: function(event, ui) {
			/* remove the dragged node, made the new node the main node, search for new chain */
			const left = this.previousSibling;
			const right = this.nextSibling;
			if (this.offset > 0) {
				if (this.offset > left.clientWidth * 3/4 && left.textContent != "x") {
					left.classList.add("node");
					left.classList.remove("alt", "left", "active");
					right.remove();					
					modifyChain(left, left.textContent, this.textContent, this.dataset.index);
					this.remove();
				} 
			} else {
				if (Math.abs(this.offset) > right.clientWidth * 3/4 && right.textContent != "x") {
					right.classList.add("node");
					right.classList.remove("alt", "right", "active");
					left.remove();
					this.remove();
					modifyChain(right, right.textContent, this.textContent, this.dataset.index);
				}
			}
			$(this.parentNode).find('.alt').remove();
		},
		revert: function(event, ui) {
			const offset = this[0].offsetLeft;
			$(this).data("uiDraggable").originalPosition = {
                top : 0,
                left : 0
            };
            // return boolean
            return !event;
		}
	}
	$('.node').draggable(dragParams);

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