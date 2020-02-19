window.addEventListener('load', function() {

	B.getDef = function() {
		B.fade(B.loader, 'in', 'block');
		const node = event.currentTarget.parentNode.parentNode;
		const word = node.dataset.word;
		const index = +node.dataset.index;
		
		// 0 of undefined
		let synonym;
		if (index == 0 || index == B.chains[B.currentChain].length - 2) {
			synonym = B.chains[B.currentChain][index + 1].word;
		} else {
			synonym = B.chains[B.currentChain][index - 1].word;
		}

		const url = `/def?word=${word}&synonym=${synonym}`;
		
		fetch(url)
			.then(response => { return response.json(); })
			.then(result => {
				const title = `Definition for the word “${word}”`;
				const sub = `used as a synonym of “${synonym}”`;
				let msg = "";
				const len = Math.min(result.data.length, 10);
				for (let i = 0; i < len; i++) {
					msg += `<strong>${B.pos[result.data[i].pos]}</strong>`;
					msg += '<br>';
					msg += result.data[i].def;
					msg += '<br><br>';
				}
				B.report(title, msg, sub);
			});
	};
});