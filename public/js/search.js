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
	bridge.addEventListener('click', ev => {
		B.fade(ldr, 'in');
		const params = {
			start: document.getElementById('start-word').value,
			end: document.getElementById('end-word').value,
			nl: 10,
			sl: 10
		};
		B.makeNewPath(params, () => {
			B.fade(search, 'out', true);
			B.fade(ldr, 'out', true);
		});
	});

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
	const shareBtn = document.getElementById('share');
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
			const title = "Bridge: " + B.chain.start + " ... " + B.chain.end;
			const link = `${location.origin}/search?qs=${B.queryStrings[B.currentChain]}`;
			if (B.queryStrings[B.currentChain].includes('-')) {
				$.ajax({
					url: '/save',
					type: 'post',
					dataType:'json',
					data: {
						qs: B.queryStrings[B.currentChain],
						chain: JSON.stringify(B.chains[B.currentChain]),
						s: B.chain.start,
						e: B.chain.end,
						sl: 10,
						nl: 10 /* this is not right ... */
					},
					success: function(obj) {
						console.log(obj);
					},
					error: function(err) {
						console.log('err', err);
					}
				});
			}
			
			const url = encodeURIComponent(link);
			switch(this.id) {
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
		});
	}
});