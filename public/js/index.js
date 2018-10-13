window.addEventListener('load', function() {
	let termsEntered = [false, false];

	const about = document.getElementById('about');
	const aboutBtn = document.getElementById('aboutBtn');
	aboutBtn.addEventListener('click', ev => {
		B.fade(about, 'in', false); /* not fading ? */
	});
	about.addEventListener('click', () => {
		B.fade(about, 'out', true);
	});

	/* reset tooltips button ? $.ajax  url: '/resettips', */

	function submitQuery() {
		B.fade(document.getElementById('ldr'), 'in');
		setTimeout(() => {
			document.getElementById('search').submit();
		}, b.fadeDur);
		/* fade out search bars? */
	}
});