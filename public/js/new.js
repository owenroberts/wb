$(document).ready(function() {
	
	function getNewPath(ev) {
		ev.stopPropagation();
		if (!noMorePaths) {
			$('#newpathloader').fadeIn(fadeDur);
			/* $('.plus').removeClass('rotate'); */
			makeNewPath();
		} else {
			reportError("The algorithm is not able to generate more results based on the current parameters.");
		}
	}

	/* switching paths */
	var setPathDots = function(next) {
		$('.path-dot').css({color:'lightgray'});
		$('.path-dot:nth-child('+(currentChain+1)+')').css({color:'black'});
		if (next) setZIndex();
		$('#paths').animate({
			left: -window.innerWidth * currentChain
		}, fadeDur, function() {
			if (!next) setZIndex();
		});	
	}

	var setZIndex = function() {
		const paths = $('#paths').children();
		paths.css({zIndex:1});
		$(paths[currentChain]).css({zIndex:9});
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
	$('.rightarrow').on('click', nextPath);
	$( ".path-dots" ).on( "swiperight", prevPath);
	$('.leftarrow').on('click', prevPath);

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
							reportError("The algorithm is not able to generate more results based on the current parameters.");
						}
					} else {
						const new_data = obj.data;
						/* $('.plus').addClass('rotate'); */
						currentChain++;
						chainCount++;

						const newdot = $('<div>')
							.attr({id:"p-" + currentChain})
							.addClass('path-dot');
						$('.dots').append(newdot);
						$('.path-dot').css({color:'lightgray'});
						newdot.css({color:'black'});

						const newpath = $('<div>')
							.attr({id:"path-" + currentChain})
							.addClass('path')
							.css({left: currentChain * window.innerWidth});
						
						const newnodes = $('<div>')
							.addClass('nodes');
						newpath.append(newnodes);
						
						const startnodedad = $('<div>')
							.addClass('node-wrap')
							.text(new_data.start);
						newnodes.append(startnodedad);
						
						for (let i = 1; i < new_data.chain.length - 1; i++) {
							const node = new_data.chain[i];
							const anewnodedad = $('<div>')
								.addClass('node-wrap');
							let innerwidth = 0;
							newnodes.append(anewnodedad);
							const innernodes = $('<div>')
								.addClass('inner-nodes');
							anewnodedad.append(innernodes);

							//console.log(i, (i > new_data.chain.length/2 ? 1 : -1))
							let index = i > new_data.chain.length/2 ? 1 : -1;
							let syns = new_data.chain[i + index].synonyms;
							let nodeOffset = -1;
							for (var h = 0; h < syns.length; h++) {
								innerwidth += window.innerWidth;
								let newsynnode = $('<div>')
									.addClass('node')
									.text(syns[h].word);
								if (syns[h].word != new_data.chain[i].word) {
									newsynnode.addClass('alternate');
								} else {
									newsynnode.addClass('thenode');
									nodeOffset = h;
								}
								innernodes.append(newsynnode);
							}
							innernodes.css({left: -nodeOffset * 300});
							innernodes.css({width:innerwidth});
							anewnodedad.css({width:innerwidth + 48});
						}
						var endnodedad = $('<div>')
							.addClass('node-wrap')
							.text(new_data.end);
						newnodes.append(endnodedad);
						$('#paths').append(newpath);
						newpath.find('.nodes').each( function() {
							var nodes = $(this).find('.node-wrap');
							for (var i = 0; i < nodes.length; i++) {
								var showNode = function(num) {
									setTimeout( function() {
										$(nodes[num]).fadeIn(fadeDur);
									}, num * fadeDur);
								}(i);
							}
						});


						newpath.find('.inner-nodes').each( function() {
							var i = $(this).find('.thenode').index();
							$(this).animate({
								left: -300 * i
							}, fadeDur);
						});

						
						$('.path-dots').slideDown(fadeDur, function() {
							$('#paths').animate({
								left: -currentChain * window.innerWidth
							}, fadeDur);
						});

						setPathDots(true);
					}
				}
			});
		} else {
			$('#newpath').fadeOut(fadeDur/2);
			reportError('You have reached the maximum number of paths.');
		}				
	}
	$('.plus').on('click', getNewPath);

});