import { newTemplate } from '/shared/request.js';

const form = document.getElementById('processForm');
form.addEventListener('submit', async (event) => {
	event.preventDefault();

	const formData = new FormData(form);
	const data = { ...newTemplate(), ...Object.fromEntries(formData.entries()) };

	data.whitelist = data.whitelist.split('|').map(item => item.trim());
	data.blacklist = data.blacklist.split('|').map(item => item.trim());

	try {
		form.style.display = "none";
		const response = await fetch("/api/process", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});
	} catch (ex) {

	} finally {
		form.style.display = "block";
	}
});