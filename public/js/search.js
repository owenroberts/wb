window.addEventListener('load', function() {

	B.debug = true;
	B.fadeDur = B.debug ? 100 : 500;
	B.noTouching = false;
	B.nodelimitArray = [+B.data.nodelimit];
	B.queryStrings = [];
	B.queryStrings.push(B.data.queryString);

	B.currentChain = 0;
	B.data.chains = [];
	B.data.chains[B.currentChain] = B.data.chain;

	B.noMorePaths = false;
	
	B.loader = document.getElementById('loader');
	B.fade(B.loader, 'out', true);

	

	

	if (B.data.error) 
		B.report(B.data.error);

	// ** animate nodes on load ** //
	const nodes = document.getElementsByClassName('node');
	for (let i = 0; i < nodes.length; i++) {
		setTimeout(() => {
			nodes[i].classList.add('fade-in');
		}, i * B.fadeDur)
	}

	const homeBtn = document.getElementById('home');
	homeBtn.addEventListener('click', function() {
		B.report(
			"Heads up — going home will clear your current paths.",
			"Go Home",
			() => { location.href = "/"; }
		);
	});

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
			const title = "SynoMapp: " + B.data.start + " ... " + B.data.end;
			const link = location.href.split("?")[0] + "?s=" + B.data.start + "&e=" + B.data.end + "&nl=" + B.queryStrings[B.chainCount].split(B.data.start)[1].split(B.data.end)[0] + "&sl=" + B.queryStrings[B.chainCount].split(B.data.start)[1].split(B.data.end)[1];
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