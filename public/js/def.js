$(document).ready(function() {
	// ** get def ** 
	function loadDef(e, word) {
		e.preventDefault();
		var parent;
		var synonym;
		if (word == data.end) {
			parent = e.currentTarget;
		} else if (word == data.start) {
			synonym = null;
		} else {
			parent = e.currentTarget.parentNode.parentNode;
		}
		var i = $(parent).index();			
		if (i == 1) {
			synonym = data.start;
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
				msg += word + "<br><br>"
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
	$('body').on('dblclick','.node', function(e) { loadDef(e, this.innerHTML); });
	$('body').on('tap','.node', function(e) { loadDef(e, this.innerHTML); });
});