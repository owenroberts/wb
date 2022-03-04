window.addEventListener('load', function() {
	
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

				// show disabled mod
				document.getElementsByClassName('nodes')[B.currentChain].classList.remove('mod-disabled');
			}
		});
	}
	if (!B.isBridgle) fadeNode(0);
});