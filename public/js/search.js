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
	$('#newpathloader').fadeOut(fadeDur);

	window.report = function(msg, ok, callback) {
		$('#report').fadeIn();
		$('#report .msg').scrollTop(0);
		$('#report .text').html(msg);
		if (ok) {
			$('.btn').css("display", "block");
			$('.btn').html(ok);
			$('.btn').on('click', callback);
		} else {
			$('.btn').css("display", "none");
		}
		$('#report').on('click', function() {
			$('header').removeClass("tip");
			$('#report').fadeOut();
			$('body').css({overflow:"auto"});
		});
	}

	if (data.error) 
		report(data.error);

	// ** fade in ui ** //
	$('.fadein').animate({
		opacity: 1
	}, fadeDur*2);

	// ** animate nodes on load ** //
	const nodedads = $('.node-wrap');
	$('.path:first-child .nodes').each( function() {
		for (let i = 0; i < nodedads.length; i++) {
			var showNode = function(num) {
				setTimeout( function() {
					$(nodedads[num]).fadeIn(fadeDur);
					if (num == nodedads.length - 1) {
						if (tooltips) {
							$('header').addClass("tip");
							report( "Make more paths between your words " + data.start + " & " + data.end)
						}
					}
				}, num*fadeDur);
			}(i);
		}
	});
	$('.path:gt(1) .node-dad').css({display:'block'});

	/* home */
	$('.home').on('click', function() {
		report(
			"Heads up—going home will clear your current paths.",
			"Go Home",
			() => { location.href = "/"; }
		);
	});

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