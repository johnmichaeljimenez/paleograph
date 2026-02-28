import { newRequest, validateRequest } from '/shared/request.js';

const form = document.getElementById('processForm');

let reportData = newRequest();
let fileHandle = null;

function loadData(req) {
	for (const key in req) {
		if (req.hasOwnProperty(key)) {
			const field = form.querySelector(`[name="${key}"]`);
			if (!field)
				continue;

			if (Array.isArray(req[key])) {
				field.value = req[key].join("|");
			} else {
				field.value = req[key];
			}
		}
	}
}

form.addEventListener('submit', async (event) => {
	event.preventDefault();

	const formData = new FormData(form);
	reportData = validateRequest({ ...Object.fromEntries(formData.entries()) });
	reportData.dryRun = form.elements.dryRun.checked;

	console.log(reportData);

	try {
		form.style.display = "none";
		const response = await fetch("/api/process", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(reportData)
		});

		if (response.ok) {
			reportData.output = await response.json();
			console.log(reportData.output);

			const fileList = document.getElementById("fileList");
			fileList.innerHTML = "";
			reportData.output.fileList.forEach(file => {
				const li = document.createElement("li");
				li.textContent = file;
				fileList.appendChild(li);
			});

			const skippedFileList = document.getElementById("skippedFileList");
			skippedFileList.innerHTML = "";
			reportData.output.skippedFiles.forEach(file => {
				const li = document.createElement("li");
				li.textContent = file;
				skippedFileList.appendChild(li);
			});

			const blobFile = document.getElementById("blobFile");
			blobFile.textContent = reportData.output.textBlob;

			if (!reportData.dryRun) {
				const report = reportData.output.report;
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


document.getElementById('blobCopyButton').addEventListener('click', (e) => {
	const cData = document.getElementById("blobFile").textContent;
	if (cData) {
		navigator.clipboard.writeText(cData);
		console.log("Copied blob to clipboard");
	}
});

loadData(newRequest());

document.getElementById("newButton")
	.addEventListener("click", async () => {
		fileHandle = null;
	});

document.getElementById("openButton")
	.addEventListener("click", async () => {
		[fileHandle] = await window.showOpenFilePicker();
	});

document.getElementById("saveButton")
	.addEventListener("click", async () => {
		if (!fileHandle) {
			return;
		}

		// const writable = await fileHandle.createWritable();
		// await writable.write(editor.value);
		// await writable.close();
	});