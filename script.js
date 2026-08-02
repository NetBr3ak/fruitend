// Demo page: nav/CTA links have no real destination, so clicks show an alert instead.
document.addEventListener('DOMContentLoaded', function () {
	document.querySelectorAll('.links a').forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			alert(`You clicked: ${this.textContent}\nThis is just a template link!`);
		});
	});

	document.querySelectorAll('.sign-up, .sign-up-btn').forEach(button => {
		button.addEventListener('click', function (e) {
			e.preventDefault();
			alert('Sign Up clicked!\nThis would take you to a registration page.');
		});
	});

	document.querySelector('.logo')?.addEventListener('click', function (e) {
		e.preventDefault();
		alert('Home link clicked!\nThis would refresh the page or go to homepage.');
	});
});
