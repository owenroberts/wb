$(document).ready(function() {

	/* drag nodes to modify chain */
	const dragParams = {
		axis: 'x',
		distance: 1,
		containment: [-100, 0, 100, 0], /* 100 is hardcoded prob needs to be updated */
		start: function(event, ui) {
			/* get prev and next synonym from word in prev word synonyms */
			const word = this.textContent;
			const i = +this.dataset.index;
			const offset = +this.parentNode.dataset.index > (data.chain.length/2) ? 1 : -1; /* flip middle of chain */
			const index = +this.parentNode.dataset.index + offset;
			const syns = data.chain[index].synonyms;

			/* if not there just x for now */
			const left = i > 0 ? syns[i-1].word : "x";
			const right = i < syns.length - 1 ? syns[i+1].word : "x";

			/* add left and right words below the node */
			const leftWord = document.createElement("div");
			leftWord.classList.add("alt", "left");
			leftWord.textContent = left;
			this.parentNode.insertBefore(leftWord, this);

			const rightWord = document.createElement("div");
			rightWord.classList.add("alt", "right");
			rightWord.textContent = right;
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
		var chainIndex = +elem.parentNode.dataset.index;
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
		for (let i = 0; i < chainIndex - 1; i++) {
			if (data.chain[i].synonyms) {
				for (var j = 0; j < data.chain[i].synonyms.length; j++) {
					allsynonyms.push(data.chain[i].synonyms[j].word);
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
					elem.textContent = word;
					elem.dataset.index = prevIndex;
					noTouching = false;
					$('.ldrimg').remove();
					for (let i = chainIndex; i < nodes.length; i++) {
						$(nodes[i]).animate({
							opacity: 1
						}, fadeDur/2);
					}
				} else {
					const new_data = obj.data;
					/* modify main chain data */
					for (var i = chainIndex; i < data.chain.length; i++) {
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
						newnodedad.dataset.index = chainIndex + i;
						const index = i > new_data.chain.length/2 ? 1 : -1;
						const syns = new_data.chain[i + index].synonyms;


						let newsynnode = document.createElement("div")
						newsynnode.classList.add('node');
						for (let h = 0; h < syns.length; h++) {
							if (syns[h].word == new_data.chain[i].word) 
								newsynnode.dataset.index = h;
						}
						newsynnode.textContent = new_data.chain[i].word;
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