window.addEventListener('load', function() {

	const playButton = document.getElementById('play-button');
	playButton.addEventListener('click', start);

	const startOverButton = document.getElementById('start-over');
	startOverButton.addEventListener('click', startOver);

	const input = document.getElementById('bridgle-input');
	const nodes = document.getElementById('nodes');
	const endNodes = document.getElementById('end-nodes');
	const synonyms = document.getElementById('synonyms');
	const choices = document.getElementsByClassName('synonym');
	
	const instructions = document.getElementById('synonym-instructions');
	const choose = document.getElementById('choose');

	const nextButton = document.getElementById('next-button');
	nextButton.addEventListener('click', next);

	const prevButton = document.getElementById('prev-button');
	prevButton.addEventListener('click', prev);

	const selectButton = document.getElementById('select-button');
	selectButton.addEventListener('click', select);

	document.addEventListener('keydown', ev => {
		if (ev.which === 39) next();
		if (ev.which === 37) prev();
	})

	const nextSynonyms = document.getElementById('next-synonyms');
	const endGame = document.getElementById('end-game');
	const shareBridgle = document.getElementById('share-bridgle');
	const seeBridgeButton = document.getElementById('see-bridge');
	seeBridgeButton.addEventListener('click', seeBridge);

	const hintButton = document.getElementById('hint-button');
	hintButton.addEventListener('click', getHint);

	let currentChoiceIndex = 0;
	let chain = [B.start];
	addNextSynonyms();

	function seeBridge() {
		B.report('Go to bridge?', 'This will reveal one path that connects the bridge, but others are possible.  Click to go to bridge.', undefined, 
			[{
				text: "Okay",
				callback: () => {
					location.href = seeBridgeButton.dataset.url;
				}
			}]
		);
	}

	function startOver() {

		endGame.style.display = 'none';

		input.style.display = 'flex';
		synonyms.style.display = 'flex';
		instructions.style.display = 'block';
		nextSynonyms.style.display = 'block';
		endNodes.style.display = 'flex';

		chain = [B.start];
		synonyms.innerHTML = '';
		choose.textContent = `Choose a synonym of "${B.start}".`;
		
		// remove nodes
		while (nodes.children.length > 1) {
			nodes.removeChild(nodes.lastChild);
		}

		// recreate original selections
		B.startSynonyms.forEach(syn => {
			const synonym = addSynonym(syn, B.start);
			synonyms.appendChild(synonym);
		});

		// reset selection
		currentChoiceIndex = 0;
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[0].dataset.word}`;

		// add syn syns
		B.synonymSynonyms = { ...B.startSynSyns };
		addNextSynonyms();
	}

	function start() {
		// remove intro
		playButton.style.display = 'none';
		document.getElementById('game-instructions').style.display = 'none';
		document.getElementById('remove-first-node').remove();

		nodes.appendChild(addNode(B.start + ' → ', B.start));
		endNodes.appendChild(addNode('→ ' + B.end, B.end));

		input.style.display = 'flex';
		synonyms.style.display = 'flex';
		instructions.style.display = 'block';
		nextSynonyms.style.display = 'block';
		
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[0].dataset.word}`;
	}

	function next() {
		choices[currentChoiceIndex].classList.remove('selected');
		currentChoiceIndex++;
		if (currentChoiceIndex >= choices.length) currentChoiceIndex = 0;
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[currentChoiceIndex].dataset.word}`;
		addNextSynonyms();
	}

	function prev() {
		choices[currentChoiceIndex].classList.remove('selected');
		currentChoiceIndex--;
		if (currentChoiceIndex < 0) currentChoiceIndex = choices.length - 1;;
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[currentChoiceIndex].dataset.word}`;
		addNextSynonyms();
	}

	function winGame() {
		// hide a bunch of stuff
		input.style.display = 'none';
		synonyms.style.display = 'none';
		instructions.style.display = 'none';
		nextSynonyms.style.display = 'none';
		endNodes.style.display = 'none';

		nodes.appendChild(addNode(B.end, B.end));

		// show share menu
		endGame.style.display = 'block';

		// save to db -- use separate collection? bridgles?

		// save some stats, number of restarts, length of bridge

		// fix start over
	}

	function select() {
		
		let selection = choices[currentChoiceIndex].dataset.word;

		// check if it is a match
		if (B.matches.includes(selection)) {
			nodes.appendChild(addSelection(selection + ' → '));
			winGame();
			return;
		}
		
		// get syns
		const url = `/bridgle-selection?word=${selection}&end=${B.end}&used=${chain}`;
		fetch(url)
			.then(response => { return response.json(); })
			.then(result => {
				updateSelection(selection, result);
			});

		// use chain to check if it's possible?
	}

	function updateSelection(selection, result) {
		synonyms.innerHTML = '';
		startOverButton.style.display = 'inline-block';
		chain.push(selection);
		nodes.appendChild(addSelection(selection + ' → '));

		choose.textContent = `Choose a synonym of "${selection}".`;

		if (result.error) {
			B.report('Uh oh!', 'This bridge cannot be completed. Click Okay to start over.', undefined, [{ text: "Okay", callback: startOver }]);
			return;
		}

		result.synonyms.forEach(syn => {
			const synonym = addSynonym(syn, selection);
			synonyms.appendChild(synonym);
		});

		currentChoiceIndex = 0;
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[0].dataset.word}`;
		B.synonymSynonyms = { ...result.synonymSynonyms };
		addNextSynonyms();
	}

	function getHint() {
		B.report('Are you sure you want a hint?', 'This will select a synonym for you.', undefined, 
			[{
				text: `Reveal synonyms of ${B.end}`,
				callback: function() {
					document.getElementById('end-synonyms').style.display = 'block';
				}
			},
			{
				text: "Select synonym with shortest bridge",
				callback: function() {
					hintCallback('breadthFirst');
				}
			},
			{
				text: "Select synonym with most bridges",
				callback: function() {
					hintCallback('chainCount');
				}
			}]
		);

		function hintCallback(algo) {
			B.fade(B.loader, 'in', 'block');
			const synonyms = Array.from(choices).map(e => e.dataset.word);
			const url = `/bridgle-hint?synonyms=${synonyms}&end=${B.end}&used=${chain}&algo=${algo}&nodeLimit=${10 - chain.length}`;
			fetch(url)
				.then(response => { return response.json(); })
				.then(result => {
					if (B.matches.includes(result.selection)) {
						nodes.appendChild(addSelection(result.selection + ' → '));
						B.fade(B.loader, 'out', 'none');
						winGame();
						return;
					}

					updateSelection(result.selection, result);
					B.fade(B.loader, 'out', 'none');
				});
		}
	}

	function addSynonym(word, selection) {
		const button = B.createElem('button', ['word', 'big-btn', 'synonym'], word);
		button.dataset.word = word;
		button.dataset.synonym = selection;
		button.onclick = function() {
			B.getDef(button);
		};
		return button;
	}

	function addSelection(text) {
		const node = B.createElem('div', ['node', 'selection']);
		const word = B.createElem('div', ['word'], text);
		node.appendChild(word);
		return node;
	}

	function addNode(text, word) {
		const node = B.createElem('button', ['node']);
		const w = B.createElem('div', ['word'], text);
		w.dataset.word = word;
		w.dataset.synonym = '$';
		w.onclick = function() {
			B.getDef(w);
		};
		node.appendChild(w);
		return node;
	}

	function addNextSynonyms() {
		nextSynonyms.innerHTML = '';
		let selection = choices[currentChoiceIndex].dataset.word;
		nextSynonyms.innerHTML += `synonyms of <strong>${selection}</strong>: `;
		const nextSyns = B.synonymSynonyms[selection];
		nextSyns.forEach((syn, i) => {
			let nextSyn = addSynonym(syn , selection);
			nextSyn.classList.remove('big-btn');
			nextSyn.classList.remove('synonym');
			nextSynonyms.appendChild(nextSyn);
			if (i < nextSyns.length - 1) {
				let span = document.createElement('span');
				span.textContent = ', ';
				nextSynonyms.appendChild(span);
			}
		});
	}
});