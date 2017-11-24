$(document).ready( function() {
	// ** blogal variables ** //
	const debug = false;
	const fadeDur = debug ? 10 : 500;

	if (pathData.error) 
		reportError(pathData.error);

	var w = window.innerWidth;
	var pathNum = 0;
	var qstrings = [];
	var currentPathNum = pathNum;

	qstrings.push(pathData.queryString);
	if (pathData.error) reportError(pathData.error);
	const start = pathData.start;
	const end = pathData.end;
	var nodelimitArray = [+pathData.nodelimit];
	
	var noMorePaths = false;
	var noTouching = false;

	// ** inner nodes, matching container width ** //
	var nodedads = $('.node-dad');
	for (var i = 1; i < nodedads.length - 1; i++) {
		var inner = $(this).find('.inner-nodes');
		var innerwidth = 0;
		var nodes = $(inner).find('.node');
		for (var h = 0; h < nodes.length; h++) {
			innerwidth += $(nodes[h]).innerWidth();
		}
		$(inner).css({width:innerwidth});
		$(nodedads[i]).css({width:innerwidth + 48});
	}

	// ** get def ** 
	function loadDef(e, word) {
		e.preventDefault();
		var parent;
		var synonym;
		if (word == end) {
			parent = e.currentTarget;
		} else if (word == start) {
			synonym = null;
		} else {
			parent = e.currentTarget.parentNode.parentNode;
		}
		var i = $(parent).index();			
		if (i == 1) {
			synonym = start;
		} else {
			var prev = parent.previousSibling;
			synonym = $(prev).find('.thenode').text();
		}
		
		$.ajax({
			url: '/def',
			type: 'get',
			dataType:'json',
			data: {
				word: word,
				synonym: synonym
			},
			success: function(result) {
				var msg = "";
				for (let i = 0; i < result.data.length; i++) {
					msg += parts[result.data[i].pos];
					msg += '<br>';
					msg += result.data[i].def;
					msg += '<br><br>';
				}
				reportError(word, msg);
			},
		});
	}

	/* def events */
	$('body').on('dblclick','.node', function(e) { loadDef(e, this.innerHTML); });
	$('node').doubleTap(function(e) { loadDef(e, this.innerHTML); });

	// ** share stuff **
	$('.share').on('click', function() {
		$('.sharemenu').fadeIn(fadeDur);
	});
	$('.sharemenu').on('click', function() {
		$(this).fadeOut(fadeDur);
	});
	$('.sh').on('click', function() {
		var wh = this.className.split(" ")[1];
		var b = "SynoMapp: " + start + " ... " + end;
		var l = location.href.split("?")[0] + "?s=" + start + "&e=" + end + "&nl=" + qstrings[pathNum].split(start)[1].split(end)[0] + "&sl=" + qstrings[pathNum].split(start)[1].split(end)[1];
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
		if (pathNum < 10) {
			do {
				nodelimit = getRandomInt(2,20);
			} while (nodelimitArray.indexOf(nodelimit) != -1);
			//nodelimit = 2; // break it for testing
			nodelimitArray.push(nodelimit);
			
			var synonymlevel = 10;  // should synonym level be randomized?
			qstrings.push(start+nodelimit+end+synonymlevel);

			$.ajax({
				url: '/search/add',
				type: 'get',
				dataType:'json',
				data: {
					s: start,
					e: end,
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
						currentPathNum++;
						pathNum++;
						var newdot = $('<div>')
							.attr({id:"p-"+currentPathNum})
							.addClass('path-dot');
						$('.dots').append(newdot);
						$('.path-dot').css({color:'lightgray'});
						newdot.css({color:'black'});

						var newpath = $('<div>')
							.attr({id:"path-"+currentPathNum})
							.addClass('path')
							.css({left:currentPathNum*w});
						var newnodes = $('<div>')
							.addClass('nodes');
						newpath.append(newnodes);
						var startnodedad = $('<div>')
							.addClass('node-dad')
							.text(start);
						newnodes.append(startnodedad);
						for (var i = 0; i < data.path.length; i++) {
							var node = data.path[i];
							var anewnodedad = $('<div>')
								.addClass('node-dad');
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
							.addClass('node-dad')
							.text(end);
						newnodes.append(endnodedad);
						$('#paths').append(newpath);
						newpath.find('.nodes').each( function() {
							var nodes = $(this).find('.node-dad');
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
								left: -currentPathNum * w
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
		$('.path-dot:nth-child('+(currentPathNum+1)+')').css({color:'black'});
		if (next) setZIndex();
		$('#paths').animate({
			left: -w * currentPathNum
		}, fadeDur, function() {
			if (!next) setZIndex();
		});	
	}
	var setZIndex = function() {
		var paths = $('#paths').children();
		paths.css({zIndex:1});
		$(paths[currentPathNum]).css({zIndex:9});
	}

	var switchPath = function() {
		var n = false;
		if (currentPathNum < $(this).index()) n = true;
		currentPathNum = $(this).index();
		setPathDots(n);
	};

	var nextPath = function() {
		if (currentPathNum < pathNum) {
			currentPathNum++;
			setPathDots(true);
		}
	};

	var prevPath = function() {
		if (currentPathNum > 0) {
			currentPathNum--;
			setPathDots(false);
		}
	};

	$('.path-dot').on('click', switchPath);
	$( ".path-dots" ).on( "swipeleft", nextPath);
	$('.rightarrow').on('click', nextPath);
	$( ".path-dots" ).on( "swiperight", prevPath);
	$('.leftarrow').on('click', prevPath);

	// ** swipe left on nodes ** //
	//-  taking about "modified" bool here, not sure what it should do
	$( 'body' ).on( "swipeleft", ".node", function() {
		if (!noTouching) animateNodes(this, 1, "-=300");	
	});
	$( 'body' ).on( "swiperight", ".node", function() {
		if (!noTouching) animateNodes(this, 0, "+=300");	
	});

	function animateNodes(elem, dir, animProp) {
		noTouching = true;

		var parent = $(elem).parent();
		var grandparent = $(parent).parent();

		var ldrimg = $('<img>');
		$(ldrimg).attr("src", "/img/loader.svg")
			.addClass('ldrimg')
			.css({width:"24px", position:"absolute", left: (window.innerWidth - 60)+ "px", marginTop:"12px"});
		$(grandparent).prepend(ldrimg);
		
		var alt = dir ? $(elem).next() : $(elem).prev();
		if (alt[0]) {
			$(elem).animate({ opacity: 0 }, fadeDur);
			$(alt).animate({  opacity: 1 }, fadeDur);
			$(parent).animate({ left: animProp }, fadeDur);
			modifyChain($(grandparent), $(alt)[0].innerText);
		} else {
			$(elem).addClass('animated shake');
			setTimeout(function() {
				$(elem).removeClass('animated-half shake');
			}, fadeDur);
			noTouching = false;
			$('.ldrimg').remove();
		}	
	}	
	
	// ** modify chain ** //
	function modifyChain(elem, alt) {

		var pathIndex = $(elem).index();
		var pathParent = $(elem).parent().parent().attr('id');
		var nodes = $('#' + pathParent + ' .node-dad:gt('+elem.index()+')');
		var node = $(elem).find('.thenode').text();

		$(nodes).animate({
			opacity: 0.3
		}, fadeDur/2);

		var allsynonyms = [start];

		for (var i = 0; i < pathIndex; i++) {
			allsynonyms = allsynonyms.concat(pathData.path[i].alternates);
		}

		$.ajax({
			url: '/search/modified',
			type: 'get',
			dataType:'json',
			data: {
				s: alt,
				e: end,
				sl: 10,
				nl: 10 - elem.index(),
				as: allsynonyms
			},
			success: function(obj) {
				if (obj.errormsg) {
					var err = 'We couldn\'t find a path between "' + alt + '" and "' + end + '".';
					var option = "Try swiping back to the previous synonym, or forward to the next.";
					reportError(err, option);
					$('.node:contains("'+alt+'")').addClass('mod-error');
					noTouching = false;
					$('.ldrimg').remove();
				} else {
					var data = obj.data;
					$(nodes).animate({
						opacity: 1
					}, fadeDur/2);

					var waitTime = nodes.length * fadeDur/2;
					setTimeout(function() {
							noTouching = false;
					}, waitTime + fadeDur);

					for (var i = 0; i < nodes.length - 1; i++) {
						var n = i;
						$(nodes[i]).fadeOut((nodes.length - i) * fadeDur/2, function(n) {
							this.remove();
						});
					}

					for (var i = 0; i < data.path.length; i ++) {
						var newnodedad = $('<div>')
							.addClass('node-dad');
						
						var inners = $('<div>')
							.addClass('inner-nodes');

						var newnode = $('<div>')
							.addClass('node')
							.text(data.path[i].node);

						inners.append(newnode);
						for (var h = 0; h < data.path[i].alternates.length; h++) {
							if (data.path[i].alternates[h] != data.path[i].node) {
								var newsynnode = $('<div>')
									.addClass('node')
									.addClass('alternate')
									.text(data.path[i].alternates[h]);
									inners.append(newsynnode);
							}
						}
						newnodedad.append(inners);
						newnodedad.insertBefore('#' + pathParent + ' .node-dad:last-child()');
						newnodedad.delay(i * fadeDur/2 + waitTime + fadeDur/2).fadeIn(fadeDur);
					}
					setTimeout(function() {
						$('.ldrimg').remove();
					}, waitTime);
				}
				
			}
		});
	}
});