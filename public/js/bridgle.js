window.addEventListener('load', function() {

	const playButton = document.getElementById('play-button');
	playButton.addEventListener('click', startBridgle);

	const input = document.getElementById('input');
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

	let currentChoiceIndex = 0;
	const chain = [B.start];
	console.log('matches', B.matches);

	function startBridgle() {
		// remove intro
		playButton.style.display = 'none';
		document.getElementById('game-instructions').style.display = 'none';
		document.getElementById('remove-first-node').remove();

		nodes.appendChild(addNode(B.start + ' → '));
		endNodes.appendChild(addNode('→ ' + B.end));

		input.style.display = 'flex';
		synonyms.style.display = 'flex';
		instructions.style.display = 'block';

		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[0].dataset.word}`;
	}

	function next() {
		choices[currentChoiceIndex].classList.remove('selected');
		currentChoiceIndex++;
		if (currentChoiceIndex >= choices.length) currentChoiceIndex = 0;
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[currentChoiceIndex].dataset.word}`;
	}

	function prev() {
		choices[currentChoiceIndex].classList.remove('selected');
		currentChoiceIndex--;
		if (currentChoiceIndex < 0) currentChoiceIndex = choices.length - 1;;
		choices[currentChoiceIndex].classList.add('selected');
		selectButton.textContent = `select ${choices[currentChoiceIndex].dataset.word}`;
	}

	function select() {
		
		let selection = choices[currentChoiceIndex].dataset.word;
		
		// check if it is a match
		if (B.matches.includes(selection)) {
			console.log('you win!');
			return;
		}

		synonyms.innerHTML = '';
		// get syns
		const url = `/bridgle-selection?word=${selection}&end=${B.end}&used=${chain}`;
		fetch(url)
			.then(response => { return response.json(); })
			.then(result => {
				console.log(result);

				chain.push(selection);
				nodes.appendChild(addSelection(selection + ' → '));

				choose.textContent = `Choose a synonym of "${selection}".`;

				if (result.synonyms.length === 0) {
					console.log('no syns fuck');
					return;
				}

				result.synonyms.forEach(syn => {
					const synonym = addSynonym(syn, selection);
					synonyms.appendChild(synonym);
				});

				currentChoiceIndex = 0;
				choices[currentChoiceIndex].classList.add('selected');
				selectButton.textContent = `select ${choices[0].dataset.word}`;

			});

		// use chain to check if it's possible?

		
	}

	function addSynonym(text, selection) {
		const button = B.createElem('button', ['word', 'big-btn', 'synonym'], text);
		button.dataset.word = text;
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

	function addNode(text) {
		const node = B.createElem('div', ['node']);
		const word = B.createElem('div', ['word'], text);
		node.appendChild(word);
		return node;
	}
});