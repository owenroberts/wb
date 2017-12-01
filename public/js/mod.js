$(document).ready(function() {

	// ** swipe left on nodes ** //
	//-  taking about "modified" bool here, not sure what it should do
	$( 'body' ).on( "swipeleft", ".node", function() {
		if (!noTouching) chooseNode(this, 1, "-=300");	
	});
	$( 'body' ).on( "swiperight", ".node", function() {
		if (!noTouching) chooseNode(this, 0, "+=300");	
	});

	function chooseNode(elem, dir, animProp) {
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
			$(alt).animate({ opacity: 1 }, fadeDur);
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

		var chainIndex = $(elem).index();
		var pathParent = $(elem).parent().parent().attr('id');
		var nodes = $('#' + pathParent + ' .node-wrap:gt('+elem.index()+')');
		var node = $(elem).find('.thenode').text();

		$(nodes).animate({
			opacity: 0.3
		}, fadeDur/2);

		var allsynonyms = [data.start];

		for (var i = 0; i < chainIndex; i++) {
			for (var j = 0; j < data.chain[i].synonyms.length; j++) {
				allsynonyms.push(data.chain[i].synonyms[j].word);
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
				nl: 10 - elem.index(),
				as: allsynonyms
			},
			success: function(obj) {
				if (obj.errormsg) {
					var err = 'We couldn\'t find a chain between "' + alt + '" and "' + end + '".';
					var option = "Try swiping back to the previous synonym, or forward to the next.";
					reportError(err, option);
					$('.node:contains("'+alt+'")').addClass('mod-error');
					noTouching = false;
					$('.ldrimg').remove();
				} else {
					var new_data = obj.data;
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

					for (var i = 1; i < new_data.chain.length - 1; i++) {
						var newnodedad = $('<div>')
							.addClass('node-wrap');
						newnodedad.css({width: 3000})
						
						var inners = $('<div>')
							.addClass('inner-nodes');

						let index = i > new_data.chain.length/2 ? 1 : -1;
						let syns = new_data.chain[i + index].synonyms;
						let nodeOffset = -1;
						for (let h = 0; h < syns.length; h++) {
							let newsynnode = $('<div>')
								.addClass('node')
								.text(syns[h].word);
							if (syns[h].word != new_data.chain[i].word) {
								newsynnode.addClass('alternate');
							} else {
								newsynnode.addClass('thenode');
								nodeOffset = h;
							}
							inners.append(newsynnode);
						}
						inners.css({left: -nodeOffset * 300});
						newnodedad.append(inners);
						newnodedad.insertBefore('#' + pathParent + ' .node-wrap:last-child()');
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