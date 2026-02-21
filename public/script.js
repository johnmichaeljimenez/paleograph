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
	data.dryRun = form.elements.dryRun.checked;

	console.log(data);

	try {
		form.style.display = "none";
		const response = await fetch("/api/process", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});

		if (response.ok) {
			const jsonResponse = await response.json();
			console.log(jsonResponse);

			const fileList = document.getElementById("fileList");
			fileList.innerHTML = "";
			jsonResponse.report.fileList.forEach(file => {
				const li = document.createElement("li");
				li.textContent = file;
				fileList.appendChild(li);
			});

			if (!data.dryRun) {
				const blob = new Blob([jsonResponse.report.content], { type: 'text/plain;charset=utf-8' });
				const url = URL.createObjectURL(blob);

				const a = document.createElement('a');
				a.href = url;
				a.download = jsonResponse.fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} else {
			console.error('Error downloading the file');
		}
	} catch (ex) {
		console.error(`Error: ${ex}`);
	} finally {
		form.style.display = "block";
	}
});