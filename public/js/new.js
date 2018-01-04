$(document).ready(function() {
	
	function getNewPath(ev) {
		ev.stopPropagation();
		
		if (window.tooltips) 
			$('#report').trigger('click');

		if (!noMorePaths) {
			$('#newpathloader').fadeIn(fadeDur);
			/* $('.plus').removeClass('rotate'); */
			makeNewPath();
		} else {
			report("The algorithm is not able to generate more results based on the current parameters.");
		}
	}

	/* switching paths */
	var setPathDots = function(next) {
		$('.path-dot').css({color:'lightgray'});
		$('.path-dot:nth-child('+(currentChain+1)+')').css({color:'black'});
		if (next) setZIndex();
		$('#paths').animate({
			//left: -window.innerWidth * currentChain
		}, fadeDur, function() {
			if (!next) setZIndex();
		});	
	}

	var setZIndex = function() {
		const paths = $('#paths').children();
		paths.css({zIndex:1, opacity:0});
		$(paths[currentChain]).css({zIndex:2, opacity: 1});
	}

	var switchPath = function() {
		let n = false;
		if (currentChain < $(this).index()) n = true;
		currentChain = $(this).index();
		setPathDots(n);
	};

	var nextPath = function() {
		if (currentChain < chainCount) {
			currentChain++;
			setPathDots(true);
		}
	};

	var prevPath = function() {
		if (currentChain > 0) {
			currentChain--;
			setPathDots(false);
		}
	};

	$('.path-dot').on('click', switchPath);
	$( ".path-dots" ).on( "swipeleft", nextPath);
	$( ".path-dots" ).on( "swiperight", prevPath);

	// ** plus button for new paths ** //
	function makeNewPath() {
		let nodelimit;
		if (chainCount < 10) {
			do {
				nodelimit = getRandomInt(2,20);
			} while (nodelimitArray.indexOf(nodelimit) != -1);
			//nodelimit = 2; // break it for testing
			nodelimitArray.push(nodelimit);
			
			const synonymlevel = 10;  // should synonym level be randomized?
			qstrings.push(data.start + nodelimit + data.end + synonymlevel);

			$.ajax({
				url: '/search/add',
				type: 'get',
				dataType:'json',
				data: {
					s: data.start,
					e: data.end,
					sl: synonymlevel,
					nl: nodelimit
				},
				success: function(obj) {
					$('#newpathloader').fadeOut(fadeDur);
					if (obj.errormsg) {
						if (nodelimitArray.length < 9) {
							makeNewPath();
						} else {
							noMorePaths = true;
							report("The algorithm is not able to generate more results based on the current parameters.");
						}
					} else {
						const new_data = obj.data;
						
						/* need so save new chain data somewhere */
						/* $('.plus').addClass('rotate'); */
						
						currentChain++;
						chainCount++;

						const newdot = $('<div>')
							.attr({id:"p-" + currentChain})
							.addClass('path-dot');
						$('.dots').append(newdot);
						$('.path-dot').css({color:'lightgray'});
						newdot.css({color:'black'});

						newpath = document.createElement("div");
						newpath.classList.add('path');
						newpath.id = "path-" + currentChain;
						
						const nodes = document.createElement("div");
						nodes.classList.add('nodes');
						newpath.append(nodes);
						
						const startNode = document.createElement("div");
						startNode.classList.add('node-wrap')
						startNode.textContent = new_data.chain[0].word;
						nodes.append(startNode);
						
						for (let i = 1; i < new_data.chain.length - 1; i++) {
							const newnodedad = document.createElement("div");
							newnodedad.classList.add('node-wrap');
							newnodedad.dataset.index = i;
							nodes.append(newnodedad);

							setTimeout( function() {
								$(newnodedad).fadeIn(fadeDur);
							}, i * fadeDur);

							let newsynnode = document.createElement("div")
							newsynnode.classList.add('node');
							newsynnode.dataset.index = i;
							newsynnode.textContent = new_data.chain[i].word;
							newsynnode.dataset.syndex = new_data.chain[i].syndex;
							
							newnodedad.appendChild(newsynnode);
						}
						const endNode = document.createElement("div");
						endNode.classList.add('node-wrap')
						endNode.textContent = new_data.chain[new_data.chain.length - 1].word;
						nodes.append(endNode);
						$('#paths').append(newpath);

						
						$('.path-dots').slideDown(fadeDur);
						setPathDots(true);
					}
					$('.node').draggable(window.dragParams); 
				}
			});
		} else {
			$('#newpathloader').fadeOut(fadeDur/2);
			report('You have reached the maximum number of paths.');
		}				
	}
	$('.plus').on('click', getNewPath);
});