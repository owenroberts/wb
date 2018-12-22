window.addEventListener('load', function() {
	// ** share stuff **
	const shareBtn = document.getElementById('share-btn');
	const shareMenu = document.getElementById('share-menu');
	const shareItems = document.getElementsByClassName('share-item');

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
			const title = "Bridge: " + start + " ... " + end;
			const link = `${location.origin}/search?qs=${B.queryStrings[B.currentChain]}`;
			const url = encodeURIComponent(link);

			function share() {
				switch(id) {
					case 'link':
						navigator.permissions.query({name: "clipboard-write"}).then(result => {
								if (result.state == "granted" || result.state == "prompt") {
									navigator.clipboard.writeText(link)
										.then(() => { B.report('Copied URL'); })
										.catch(error => { console.log(error); B.report('Unable to copy URL') });
								}
						});
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
				$.ajax({
					url: '/save',
					type: 'post',
					dataType:'json',
					data: {
						qs: B.queryStrings[B.currentChain],
						chain: JSON.stringify(B.chains[B.currentChain]),
						s: B.startWord,
						e: B.endWord,
						sl: B.queryStrings[B.currentChain].split(/[a-z\\-]+/)[1],
						nl: B.queryStrings[B.currentChain].split(/[a-z\\-]+/)[2]
					}, /* just gets the first one ... */
					success: function(obj) {
						// console.log('success', obj);
						/* wait until saved to share */
						share();
					},
					error: function(err) {
						console.log('err', err);
					}
				});
			} else {
				share();
			}
		});
	}
});