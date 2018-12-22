window.addEventListener('load', function() {
	const bridge = document.getElementById('bridge');
	const endWordInput = document.getElementById('end-word');
	const startWordInput = document.getElementById('start-word');
	function inputKeys() {
		if (startWordInput.value.length > 0 && endWordInput.value.length > 0) {
			bridge.classList.add('active');
		} else {
			console.log('remove')
			bridge.classList.remove('active');
		}
	}
	endWordInput.addEventListener('keyup', inputKeys);
	startWordInput.addEventListener('keyup', inputKeys);

	/* about */
	const about = document.getElementById('about');
	const aboutBtn = document.getElementById('about-btn');
	aboutBtn.addEventListener('click', ev => {
		B.fade(about, 'in', 'block'); 
	});
	about.addEventListener('click', () => {
		B.fade(about, 'out', 'none');
	});
});