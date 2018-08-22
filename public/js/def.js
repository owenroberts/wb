$(document).ready(function() {
	// ** get def ** 
	function loadDef(ev, elem) {
		$('#newpathloader').fadeIn(fadeDur);
		ev.preventDefault();
		const node = elem.parentNode;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		const synonym = window.data.chain[index-1].word;
		
		$.ajax({
			url: '/def',
			type: 'get',
			dataType:'json',
			data: {
				word: word,
				synonym: synonym
			},
			success: function(result) {
				$('#newpathloader').fadeOut(fadeDur);
				var msg = "";
				msg += "<strong>" + word + "</strong><br><br>"
				for (let i = 0; i < result.data.length; i++) {
					msg += parts[result.data[i].pos];
					msg += '<br>';
					msg += result.data[i].def;
					msg += '<br><br>';
				}
				report(msg);
			},
		});
	}

	/* def events */
	$('.def').on('click', function(ev) { loadDef(ev, this); });
	$('.def').on('tap', function(ev) { loadDef(ev, this); });
	$('body').on('tap','.def', function(ev) { loadDef(ev, this); });
	$('body').on('click','.def', function(ev) { loadDef(ev, this); });
});