$(document).ready( function() {
	
	// ** blogal variables ** //
	window.debug = true;
	window.fadeDur = debug ? 10 : 500;
	window.noMorePaths = false;
	window.noTouching = false;
	window.chainCount = 0;
	window.nodelimitArray = [+data.nodelimit];
	window.currentChain = 0;
	window.qstrings = [];
	qstrings.push(data.queryString);


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
				window.open("mailto:?body=" + b + " -- " + c + "&subject= + b", "_blank")
			break;
			case "tw":
				window.open("https://twitter.com/intent/tweet?text=" + b + " " + c, "_blank");
			break;
			case "fb":
				window.open("http://www.facebook.com/sharer.php?u=" + b + " " + c, "_blank");
			break;
		}
	});
	
});