window.addEventListener('load', function() {
	// ** share stuff **
	const shareBtn = document.getElementById('share-btn');
	const shareMenu = document.getElementById('share');
	const shareDek = document.getElementById('share-dek');
	const shareItems = document.getElementsByClassName('share-item');

	// if (!navigator.permissions) {
	// 	document.getElementById('link').style.display = 'none';
	// }

	shareDek.textContent = `“${B.startWord}” & “${B.endWord}”`;

	shareBtn.addEventListener('click', function() {
		B.fade(shareMenu, 'in', 'block');
	});

	shareMenu.addEventListener('click', function() {
		B.fade(shareMenu, 'out', 'none');
	});

	for (let i = 0; i < shareItems.length; i++) {
		shareItems[i].addEventListener('click', function() {
			const id = this.id;
			const start = B.chains[B.currentChain][0].word
			const end = B.chains[B.currentChain][B.chains[B.currentChain].length - 1].word;
			const title = "Word Bridge: " + start + " ... " + end;
			const link = `${location.origin}/bridge?qs=${B.queryStrings[B.currentChain]}`;
			const url = encodeURIComponent(link);

			function share() {
				switch(id) {
					case 'link':
						/* copy to clipboard */
						const el = document.createElement('textarea');
						el.value = link;
						document.body.appendChild(el);
						el.select();
						document.execCommand('copy');
						document.body.removeChild(el);

						B.report('Share', 'Copied URL');
						// B.report('Share Error', 'Unable to copy URL');
						
						
						break;
					case 'email':
						window.open("mailto:?body=" + title + " -- " + url + "&subject= word bridge", "_blank")
						break;
					case 'tw':
						window.open("https://twitter.com/intent/tweet?text=" + title + " " + url, "_blank");
						break;
					case 'fb':
						window.open("http://www.facebook.com/sharer.php?u=" + title + " " + url, "_blank");
					break;
				}
			}

			if (B.queryStrings[B.currentChain].includes('-')) {
				fetch('/save', {  method: 'POST',
					headers: {'Content-Type': 'application/json'},
 					body: JSON.stringify({
						qs: B.queryStrings[B.currentChain],
						chain: JSON.stringify(B.chains[B.currentChain]),
						s: B.startWord,
						e: B.endWord,
						sl: B.queryStrings[B.currentChain].split(/[a-z\\-]+/)[1],
						nl: B.queryStrings[B.currentChain].split(/[a-z\\-]+/)[2]
					})
				}).then(response => { 
					share(); 
				}).catch(error => { 
					console.log('error', error); 
				});
			} else {
				share();
			}
		});
	}
});