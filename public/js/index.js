window.addEventListener('load', function() {
	const bridge = document.getElementById('bridge');
	const endWordInput = document.getElementById('end-word');
	const startWordInput = document.getElementById('start-word');
	function inputKeys() {
		if (startWordInput.value.length > 0)
			startWordInput.classList.remove('error')
		if (endWordInput.value.length > 0)
			endWordInput.classList.remove('error')
	}
	endWordInput.addEventListener('keyup', inputKeys);
	startWordInput.addEventListener('keyup', inputKeys);


	function submit() {
		if (startWordInput.value.length == 0)
			startWordInput.classList.add('error');
		if (endWordInput.value.length == 0)
			endWordInput.classList.add('error');
		if (startWordInput.value.length > 0 &&
			endWordInput.value.length > 0)
			document.getElementById('form').submit();
	}
	bridge.addEventListener('click', submit);
	bridge.addEventListener('keyup', ev => {
		if (ev.which == 13) submit();
	});

	/* about */
	const about = document.getElementById('about');
	const aboutBtn = document.getElementById('about-btn');
	aboutBtn.addEventListener('click', aboutIn);
	aboutBtn.addEventListener('keyup', ev => {
		if (ev.which == 13) aboutIn();
	});

	document.addEventListener('keyup', ev => {
		if (ev.which == 27) B.aboutOut();
	})

	function aboutIn() {
		B.fade(about, 'in', 'block'); 
	}

	B.aboutOut = function() {
		B.fade(about, 'out', 'none');
	};
});