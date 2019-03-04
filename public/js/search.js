window.addEventListener('load', function() {
	
	B.noTouching = false;
	B.nodeLimitArray = [];
	B.queryStrings = [];

	B.currentChain = -1;
	B.chains = [];

	B.noMorePaths = false;
	B.isAnimating = true;
	
	B.loader = document.getElementById('loader');
	B.fade(B.loader, 'out', 'none');

	// ** animate nodes on load ** //
	const nodes = document.getElementsByClassName('node');

	function fadeNode(index) {
		const node = nodes[index];
		B.fade(node, 'in', 'flex', () => {
			if (index < B.chains[B.currentChain].length - 1) {
				fadeNode(++index);
			} else {
				B.isAnimating = false;
				checkTip();
			}
		});
	}
	fadeNode(0);

	function checkTip() {
		if (!localStorage.getItem('def-tip')) {
			// B.report('Tip:', 'You can tap any word to see its definition.');
			document.getElementById('tooltips').classList.replace('closed', 'open');
			localStorage.setItem('def-tip', true);
		} else {
			document.getElementById('tooltips').remove();
		}
	}
});