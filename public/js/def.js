window.addEventListener('load', function() {

	function loadDef(ev, elem) {
		B.fade(B.loader, 'in', false);
		ev.preventDefault();
		const node = elem.parentNode;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		const synonym = B.data.chain[index-1].word;
		
		$.ajax({
			url: '/def',
			type: 'get',
			dataType:'json',
			data: {
				word: word,
				synonym: synonym
			},
			success: function(result) {
				B.fade(B.loader, 'out', true);
				var msg = "";
				msg += "<strong>" + word + "</strong><br><br>"
				for (let i = 0; i < result.data.length; i++) {
					msg += B.pos[result.data[i].pos];
					msg += '<br>';
					msg += result.data[i].def;
					msg += '<br><br>';
				}
				B.report(msg);
			},
		});
	}

	/* def events */
	$('.def').on('click', function(ev) { loadDef(ev, this); });
	$('.def').on('tap', function(ev) { loadDef(ev, this); });
	$('body').on('tap','.def', function(ev) { loadDef(ev, this); });
	$('body').on('click','.def', function(ev) { loadDef(ev, this); });
});