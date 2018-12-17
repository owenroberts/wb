window.addEventListener('load', function() {
	
	B.noTouching = false;
	B.nodeLimitArray = [];
	B.queryStrings = [];

	B.currentChain = -1;
	B.chains = [];

	B.noMorePaths = false;
	
	B.loader = document.getElementById('loader');
	B.fade(B.loader, 'out', true);

	/* get initial search */
	const bridge = document.getElementById('bridge');
	const search = document.getElementById('search');
	const ldr = document.getElementById('ldr');
	const endWordInput = document.getElementById('end-word');
	const startWordInput = document.getElementById('start-word');
	bridge.addEventListener('click', loadFirstChain);
	endWordInput.addEventListener('keydown', ev => {
		if (ev.which == 13) 
			loadFirstChain();
		else {
			if (startWordInput.value.length > 0) {
				bridge.classList.add('active');
			}
		}
	});

	function loadFirstChain() {
		// B.fade(ldr, 'in');

		let startWord = startWordInput.value;
		let endWord = endWordInput.value;

		if (!startWord) {
			if (endWord.includes(" ")) {
				let words = endWord.split(" ");
				if (words[0].length > 0 && words[1].length > 0) {
					startWord = words[0];
					endWord = words[1];
				}
			}
		} else if (!endWord) {
			if (startWord.includes(" ")) {
				let words = startWord.split(" ");
				if (words[0].length > 0 && words[1].length > 0) {
					startWord = words[0];
					endWord = words[1];
				}
			}
		}

		if (startWord && endWord) {
			B.resultUI();
			const params = {
				start: startWord,
				end: endWord,
				nl: 10,
				sl: 10
			};
			B.newChain(params, () => {
				B.fade(search, 'out', true);
				// B.fade(ldr, 'out', true);
			});
			document.getElementById('share-dek').textContent = `${params.start} -> ${params.end}`;
			B.fade(document.getElementById('plus'), 'in', false);
		} else {
			B.report("Please enter two words.");
		}
	}

	/* about */
	const about = document.getElementById('about');
	const aboutBtn = document.getElementById('about-btn');
	aboutBtn.addEventListener('click', ev => {
		B.fade(about, 'in', false); /* not fading ? */
	});
	about.addEventListener('click', () => {
		B.fade(about, 'out', true);
	});

	// ** animate nodes on load ** //
	const nodes = document.getElementsByClassName('node');
	for (let i = 0; i < nodes.length; i++) {
		setTimeout(() => {
			nodes[i].classList.add('fade-in');
		}, i * B.fadeDur)
	}

	// ** share stuff **
	const shareBtn = document.getElementById('share-btn');
	const shareMenu = document.getElementById('share-menu');
	const shareItems = document.getElementsByClassName('share-item');

	shareBtn.addEventListener('click', function() {
		B.fade(shareMenu, 'in', false);
	});

	shareMenu.addEventListener('click', function() {
		B.fade(shareMenu, 'out', true);
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
						location.href = link;
						break;
					case 'email':
						window.open("mailto:?body=" + title + " -- " + url + "&subject= + b", "_blank")
						break;
					case "tw":
						window.open("https://twitter.com/intent/tweet?text=" + title + " " + url, "_blank");
						break;
					case "fb":
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