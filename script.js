// Demo page: nothing here has a real destination, so clicks report that in a toast.
document.addEventListener('DOMContentLoaded', function () {
	let node, timer;

	function toast(message) {
		if (!node) {
			node = document.createElement('div');
			node.className = 'toast';
			node.setAttribute('role', 'status');
			node.setAttribute('aria-live', 'polite');
		}
		// Dismissing detaches the node without clearing this reference, so re-attach it
		// rather than trusting that it is still in the document.
		if (!node.isConnected) document.body.appendChild(node);
		node.textContent = message;
		clearTimeout(timer);
		timer = setTimeout(() => node.remove(), 2600);
	}

	document.addEventListener('keydown', e => {
		if (e.key === 'Escape' && node) {
			clearTimeout(timer);
			node.remove();
		}
	});

	document.querySelectorAll('.bar-links a, .ghost-link').forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			toast(`"${this.textContent.trim()}" is a demo link, it goes nowhere.`);
		});
	});

	document.querySelectorAll('.pill-ink, .press').forEach(button => {
		button.addEventListener('click', function (e) {
			e.preventDefault();
			toast('Sign up is a demo, nothing was sent.');
		});
	});

	document.querySelector('.wordmark')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.scrollTo({ top: 0 });
	});

	const bar = document.querySelector('.bar');
	addEventListener('scroll', () => bar.classList.toggle('compact', scrollY > 80), { passive: true });

	const reveal = document.querySelectorAll('[data-reveal]');

	if ('IntersectionObserver' in window && reveal.length) {
		const seen = new IntersectionObserver((entries, obs) => {
			entries.forEach(entry => {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('in');
				obs.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -12% 0px' });

		// The hiding class goes on only once the observer exists, so a script failure
		// anywhere above this line leaves the content visible instead of blank.
		document.documentElement.classList.add('js');
		reveal.forEach(el => seen.observe(el));
	}
});
