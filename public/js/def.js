window.addEventListener('load', function() {

	B.getDef = function() {
		B.fade(B.loader, 'in', 'block');
		const node = this.parentNode.parentNode;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		// 0 of undefined
		const synonym = index > 0 ? B.chains[B.currentChain][index - 1].word : B.chains[B.currentChain][index + 1].word;

		const url = `/def?word=${word}&synonym=${synonym}`;
		
		fetch(url)
			.then(response => { return response.json(); })
			.then(result => {
				B.fade(B.loader, 'out', 'none');
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
			});
	};
});