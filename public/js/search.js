$(document).ready( function() {
	
	// ** blogal variables ** //
	window.debug = true;
	window.fadeDur = debug ? 10 : 500;
	window.noMorePaths = false;
	window.noTouching = false;

	window.reportError = function(err, option) {
		$('#error').fadeIn();
		$('#error .msg').scrollTop(0);
		$('.sorry').html(err);
		$('.errormsg').html(option);
		$('body').css({overflow:"hidden"});
		$('#error .ok').on('click', function() {
			$('#error').fadeOut();
			$('body').css({overflow:"auto"});
		});
		$('#error').on('click', function() {
			$('#error').fadeOut();
			$('body').css({overflow:"auto"});
		});
	}

	if (data.error) 
		reportError(data.error);

	let w = window.innerWidth;
	let chainCount = 0;
	let qstrings = [];
	qstrings.push(data.queryString);
	let currentChainIndex = chainCount;

	let nodelimitArray = [+data.nodelimit];
	
	

	// ** inner nodes, matching container width ** //
	const nodedads = $('.node-wrap');
	for (var i = 1; i < nodedads.length - 1; i++) {
		const dad = nodedads[i];
		const inner = $(dad).find('.inner-nodes');
		let innerWidth = 0;
		const nodes = $(inner).find('.node');
		for (var h = 0; h < nodes.length; h++) {
			innerWidth += $(nodes[h]).innerWidth();
		}
		$(inner).css({width:innerWidth});
		$(dad).css({width:innerWidth + 48});
	}

	// ** fade in ui ** //
	$('.fadein').animate({
		opacity: 1
	}, fadeDur*2);

	// ** move nodes to "thenode" //
	$('.inner-nodes').each( function() {
		var i = $(this).find('.thenode').index();
		$(this).animate({
			left: -300 * i
		}, fadeDur);
	});

	// ** animate nodes on load ** //
	$('.path:first-child .nodes').each( function() {
		for (var i = 0; i < nodedads.length; i++) {
			var showNode = function(num) {
				setTimeout( function() {
					$(nodedads[num]).fadeIn(fadeDur);
				}, num*fadeDur);
			}(i);
		}
	});
	$('.path:gt(1) .node-dad').css({display:'block'});


	// ** share stuff **
	$('.share').on('click', function() {
		$('.sharemenu').fadeIn(fadeDur);
	});
	$('.sharemenu').on('click', function() {
		$(this).fadeOut(fadeDur);
	});
	$('.sh').on('click', function() {
		var wh = this.className.split(" ")[1];
		var b = "SynoMapp: " + data.start + " ... " + data.end;
		var l = location.href.split("?")[0] + "?s=" + data.start + "&e=" + data.end + "&nl=" + qstrings[chainCount].split(data.start)[1].split(data.end)[0] + "&sl=" + qstrings[chainCount].split(data.start)[1].split(data.end)[1];
		var c = encodeURIComponent(l);
		switch (wh) {
			case "email":
				window.location.href = "mailto:?body=" + b + " -- " + c + "&subject= + b";
			break;
			case "tw":
				window.location = "https://twitter.com/intent/tweet?text=" + b + " " + c;
			break;
			case "fb":
				window.location = "http://www.facebook.com/sharer.php?u=" + b + " " + c;
			break;
		}
	});

	// ** new path stuff **
	function getNewPath(ev) {
		ev.stopPropagation();
		if (!noMorePaths) {
			$('#newpath').fadeIn(fadeDur);
			$('.plus').removeClass('rotate');
			makeNewPath();
		} else {
			reportError("The algorithm is not able to generate more results based on the current parameters.");
		}
	}

	// ** plus button for new paths ** //
	function makeNewPath() {
		var nodelimit;
		if (chainCount < 10) {
			do {
				nodelimit = getRandomInt(2,20);
			} while (nodelimitArray.indexOf(nodelimit) != -1);
			//nodelimit = 2; // break it for testing
			nodelimitArray.push(nodelimit);
			
			var synonymlevel = 10;  // should synonym level be randomized?
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
					$('#newpath').fadeOut(fadeDur);
					if (obj.errormsg) {
						if (nodelimitArray.length < 9) {
							makeNewPath();
						} else {
							noMorePaths = true;
							reportError("The algorithm is not able to generate more results based on the current parameters.");
						}
					} else {
						var data = obj.data;
						$('.plus').addClass('rotate');
						currentChainIndex++;
						chainCount++;
						var newdot = $('<div>')
							.attr({id:"p-"+currentChainIndex})
							.addClass('path-dot');
						$('.dots').append(newdot);
						$('.path-dot').css({color:'lightgray'});
						newdot.css({color:'black'});

						var newpath = $('<div>')
							.attr({id:"path-"+currentChainIndex})
							.addClass('path')
							.css({left:currentChainIndex*w});
						var newnodes = $('<div>')
							.addClass('nodes');
						newpath.append(newnodes);
						var startnodedad = $('<div>')
							.addClass('node-wrap')
							.text(data.start);
						newnodes.append(startnodedad);
						for (var i = 0; i < data.path.length; i++) {
							var node = data.path[i];
							var anewnodedad = $('<div>')
								.addClass('node-wrap');
							var innerwidth = 0;
							newnodes.append(anewnodedad);
							var innernodes = $('<div>')
								.addClass('inner-nodes');
							anewnodedad.append(innernodes);
							if (node.alternates) {
								for (var h = 0; h < node.alternates.length; h++) {
									innerwidth += w;
									var alt = node.alternates[h];
									if (alt == node.node) {
										var thenode = $('<div>')
											.addClass('node thenode')
											.text(alt);
									} else {
										var thenode = $('<div>')
											.addClass('node alternate')
											.text(alt);
									}
									innernodes.append(thenode);
								}
							}
							innernodes.css({width:innerwidth});
							anewnodedad.css({width:innerwidth + 48});
						}
						var endnodedad = $('<div>')
							.addClass('node-wrap')
							.text(data.end);
						newnodes.append(endnodedad);
						$('#paths').append(newpath);
						newpath.find('.nodes').each( function() {
							var nodes = $(this).find('.node-wrap');
							for (var i = 0; i < nodes.length; i++) {
								var showNode = function(num) {
									setTimeout( function() {
										$(nodes[num]).fadeIn(fadeDur);
									}, num*fadeDur);
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
								left: -currentChainIndex * w
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
	$('.plus').on('click',  getNewPath);
	

	// ** animate path switching  ** //
	var setPathDots = function(next) {
		$('.path-dot').css({color:'lightgray'});
		$('.path-dot:nth-child('+(currentChainIndex+1)+')').css({color:'black'});
		if (next) setZIndex();
		$('#paths').animate({
			left: -w * currentChainIndex
		}, fadeDur, function() {
			if (!next) setZIndex();
		});	
	}
	var setZIndex = function() {
		var paths = $('#paths').children();
		paths.css({zIndex:1});
		$(paths[currentChainIndex]).css({zIndex:9});
	}

	var switchPath = function() {
		var n = false;
		if (currentChainIndex < $(this).index()) n = true;
		currentChainIndex = $(this).index();
		setPathDots(n);
	};

	var nextPath = function() {
		if (currentChainIndex < chainCount) {
			currentChainIndex++;
			setPathDots(true);
		}
	};

	var prevPath = function() {
		if (currentChainIndex > 0) {
			currentChainIndex--;
			setPathDots(false);
		}
	};

	$('.path-dot').on('click', switchPath);
	$( ".path-dots" ).on( "swipeleft", nextPath);
	$('.rightarrow').on('click', nextPath);
	$( ".path-dots" ).on( "swiperight", prevPath);
	$('.leftarrow').on('click', prevPath);
});