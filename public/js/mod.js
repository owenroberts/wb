$(document).ready(function() {

	// ** swipe left on nodes ** //
	//-  taking about "modified" bool here, not sure what it should do
	$('.node').draggable({
		axis: 'x',
		distance: 1,
		containment: [-100, 0, 100, 0],
		start: function(event, ui) {
			const word = this.textContent;
			const i = +this.dataset.index;
			const offset = +this.parentNode.dataset.index > (data.chain.length/2) ? 1 : -1;
			const index = +this.parentNode.dataset.index + offset;
			const syns = data.chain[index].synonyms;
			const left = i > 0 ? syns[i-1].word : "x";
			const right = i < syns.length - 1 ? syns[i+1].word : "x";

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
			const offset = this.offsetLeft;
			this.offset = offset;
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
			const left = this.previousSibling;
			const right = this.nextSibling;
			if (this.offset > 0) {
				if (this.offset > left.clientWidth * 3/4 && left.textContent != "x") {
					left.classList.add("node");
					left.classList.remove("alt", "left", "active");
					right.remove();
					this.remove();
					modifyChain(left, left.textContent);
				} 
			} else {
				if (Math.abs(this.offset) > right.clientWidth * 3/4 && right.textContent != "x") {
					right.classList.add("node");
					right.classList.remove("alt", "left", "active");
					left.remove();
					this.remove();
					modifyChain(right, right.textContent);
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
	});

	// ** modify chain ** //
	function modifyChain(elem, alt) {
		var nodeIndex = +elem.dataset.index;
		var chainIndex = +elem.parentNode.dataset.index;
		var nodes = elem.parentNode.parentNode.children;
		//var node = $(elem).find('.thenode').text();
		for (let i = chainIndex; i < nodes.length; i++) {
			/* maybe do all these as css classes */
			$(nodes[i]).animate({
				opacity: 0.3
			}, fadeDur/2);
		}

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
					var err = 'We couldn\'t find a chain between "' + alt + '" and "' + data.end + '".';
					var option = "Try swiping back to the previous synonym, or forward to the next.";
					report(err + "<br><br>" + option);
					elem.classList.add('mod-error');
					noTouching = false;
					$('.ldrimg').remove();
				} else {
					var new_data = obj.data;
					for (let i = chainIndex; i < nodes.length; i++) {
						$(nodes[i]).animate({
							opacity: 1
						}, fadeDur/2);
					}

					var waitTime = nodes.length * fadeDur/2;
					setTimeout(function() {
							noTouching = false;
					}, waitTime + fadeDur);

					for (var i = chainIndex + 1; i < nodes.length - 1; i++) {
						var n = i;
						$(nodes[i]).fadeOut((nodes.length - i) * fadeDur/2, function(n) {
							this.remove();
						});
					}
					for (var i = 1; i < new_data.chain.length - 1; i++) {
						var newnodedad = document.createElement("div")
						newnodedad.classList.add('node-wrap');
						let index = i > new_data.chain.length/2 ? 1 : -1;
						let syns = new_data.chain[i + index].synonyms;
						for (let h = 0; h < syns.length; h++) {
							if (syns[h].word == new_data.chain[i].word) {
								let newsynnode = document.createElement("div")
								newsynnode.classList.add('node', 'thenode', 'draggable');
								//newsynnode.draggable();
								newsynnode.textContent = syns[h].word;
								newnodedad.appendChild(newsynnode);
							}
						}
						elem.parentNode.parentNode.insertBefore(newnodedad, elem.parentNode.parentNode.lastChild);
						$(newnodedad).delay(i * fadeDur/2 + waitTime + fadeDur/2).fadeIn(fadeDur);
					}
					setTimeout(function() {
						$('.ldrimg').remove();
					}, waitTime);
				}
				
			}
		});
	}
});