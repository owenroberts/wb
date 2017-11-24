(function($) {
     $.fn.doubleTap = function(doubleTapCallback) {
         return this.each(function(){
			var elm = this;
			var lastTap = 0;
			$(elm).bind('vmousedown', function (e) {
                                var now = (new Date()).valueOf();
				var diff = (now - lastTap);
                                lastTap = now ;
                                if (diff < 250) {
		                    if($.isFunction( doubleTapCallback ))
		                    {
		                       doubleTapCallback.call(elm);
		                    }
                                }      
			});
         });
    }
})(jQuery);

$('a').on('click', function(ev) {
	ev.preventDefault();
	window.location = this.href;
});

function getRandomInt(min, max) {
	return Math.floor(Math.random()* ( max - min + 1) + min);
}

// http://wordnet.princeton.edu/wordnet/man/wndb.5WN.html#sect3
const parts = { "n":"noun", "v":"verb", "a":"adjective", "s":"adjective", "r":"adverb" };


function reportError(err, option) {
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

const fadeDur = 500;

// ** fade in ui ** //
$('.fadein').animate({
	opacity: 1
}, fadeDur*2);


// ** animate nodes on load ** //
$('.path:first-child .nodes').each( function() {
	var nodes = $('.node-dad');
	for (var i = 0; i < nodes.length; i++) {
		var showNode = function(num) {
			setTimeout( function() {
				$(nodes[num]).fadeIn(fadeDur);
			}, num*fadeDur);
		}(i);
	}
});
$('.path:gt(1) .node-dad').css({display:'block'});

// ** move nodes to "thenode" //
$('.inner-nodes').each( function() {
	var i = $(this).find('.thenode').index();
	$(this).animate({
		left: -300 * i
	}, fadeDur);
});

