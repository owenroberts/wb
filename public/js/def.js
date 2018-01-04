$(document).ready(function() {
	// ** get def ** 
	function loadDef(ev, elem) {
		ev.preventDefault();
		const word = elem.textContent.trim();
		const index = +elem.dataset.index;
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
	$('body').on('dblclick','.node', function(ev) { loadDef(ev, this); });
	$('body').on('doubletap','.node', function(ev) { loadDef(ev, this); });
});