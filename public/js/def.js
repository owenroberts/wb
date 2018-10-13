window.addEventListener('load', function() {

	B.getDef = function() {
		B.fade(B.loader, 'in', false);
		const node = this;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		const synonym = index > 0 ? B.data.chains[B.currentChain][index - 1].word : B.data.chains[B.currentChain][index + 1].word;
		
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
				msg += "<strong>" + word + "</strong><br><br>";
				const len = Math.min(result.data.length, 10);
				for (let i = 0; i < len; i++) {
					msg += B.pos[result.data[i].pos];
					msg += '<br>';
					msg += result.data[i].def;
					msg += '<br><br>';
				}
				B.report(msg);
			},
		});
	};

	const defBtns = document.getElementsByClassName('def');
	for (let i = 0; i < defBtns.length; i++) {
		defBtns[i].addEventListener('click', B.getDef);
	}
});