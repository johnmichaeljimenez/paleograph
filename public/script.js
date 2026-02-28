import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3/+esm';
import { newRequest, validateRequest } from '/shared/request.js';

const form = document.getElementById('processForm');

let reportData = newRequest();
let fileHandle = null;

window.app = function () {
	const baseData = newRequest();

	return {
		form: { ...baseData },

		whitelistString: baseData.whitelist.join("|"),
		blacklistString: baseData.blacklist.join("|"),

		loading: false,
		newData: { ...baseData },

		async run() {
			this.loading = true;

			try {
				this.newData = validateRequest({
					...this.form,
					whitelist: this.whitelistString,
					blacklist: this.blacklistString
				});

				const response = await fetch("/api/process", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(this.newData)
				});

				if (!response.ok) {
					throw new Error("Server error");
				}

				this.newData.output = await response.json();

			} catch (err) {
				console.error(err);
				alert(err.message);
			} finally {
				this.loading = false;
			}
		},

		copyBlob() {
			if (this.newData?.output?.textBlob) {
				navigator.clipboard.writeText(this.newData.output.textBlob);
				console.log("Copied blob to clipboard");
			}
		}
	}
}

window.Alpine = Alpine
Alpine.start()

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