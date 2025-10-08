// Simple click handlers for navigation links
document.addEventListener('DOMContentLoaded', function () {
	// Handle navigation links
	const navLinks = document.querySelectorAll('.links a');
	navLinks.forEach((link, index) => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			const linkName = this.textContent;
			alert(`You clicked: ${linkName}\nThis is just a template link!`);
		});
	});

	// Handle sign up buttons
	const signUpButtons = document.querySelectorAll('.sign-up, .sign-up-btn');
	signUpButtons.forEach(button => {
		button.addEventListener('click', function (e) {
			e.preventDefault();
			alert('Sign Up clicked!\nThis would take you to a registration page.');
		});
	});

	// Handle logo click
	const logo = document.querySelector('.logo');
	if (logo) {
		logo.addEventListener('click', function (e) {
			e.preventDefault();
			alert('Home link clicked!\nThis would refresh the page or go to homepage.');
		});
	}
});
