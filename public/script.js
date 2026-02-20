import { newRequest, validateRequest } from '/shared/request.js';

const form = document.getElementById('processForm');

function loadData(req) {
	for (const key in req) {
		if (req.hasOwnProperty(key)) {
			const field = form.querySelector(`[name="${key}"]`);
			if (Array.isArray(req[key])) {
				field.value = req[key].join("|");
			} else {
				field.value = req[key];
			}
		}
	}
}

loadData(newRequest());

form.addEventListener('submit', async (event) => {
	event.preventDefault();

	const formData = new FormData(form);
	const data = validateRequest({ ...Object.fromEntries(formData.entries()) });

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