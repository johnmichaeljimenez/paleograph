import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3/+esm';
import { newRequest, validateRequest } from '/shared/request.js';

window.app = function () {
	const baseData = newRequest();

	return {
		navOpen: false,
		tab: 'form',

		fileHandle: null,
		form: { ...baseData },
		whitelistString: baseData.whitelist.join("|"),
		blacklistString: baseData.blacklist.join("|"),
		newData: { ...baseData },

		loading: false,

		get renderedReport() {
			if (!this.newData?.output?.report) return '';

			const raw = marked.parse(this.newData.output.report, {
				gfm: true,
				breaks: true,
				headerIds: false
			});

			return DOMPurify.sanitize(raw);
		},

		async run() {
			this.tab = 'report';
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
		},

		fileNew() {
			this.fileHandle = null;

			const data = newRequest();
			this.form = { ...data };
			this.whitelistString = data.whitelist.join("|");
			this.blacklistString = data.blacklist.join("|");
			this.newData = { ...data };
		},

		async fileOpen() {
			try {
				[this.fileHandle] = await window.showOpenFilePicker({
					types: [{
						description: "JSON Files",
						accept: { "application/json": [".json"] }
					}]
				});

				const file = await this.fileHandle.getFile();
				const text = await file.text();
				const parsed = JSON.parse(text);

				this.newData = parsed;

				this.form = { ...parsed };
				this.whitelistString = parsed.whitelist?.join("|") || "";
				this.blacklistString = parsed.blacklist?.join("|") || "";

				console.log("File loaded");

			} catch (error) {
				console.error("File open error:", error);
			}
		},

		async fileSave() {
			try {
				if (!this.fileHandle) {
					this.fileHandle = await window.showSaveFilePicker({
						suggestedName: "paleograph.json",
						types: [{
							description: "JSON Files",
							accept: { "application/json": [".json"] }
						}]
					});
				}

				const writable = await this.fileHandle.createWritable();

				await writable.write(
					JSON.stringify(this.newData, null, 2)
				);

				await writable.close();

				console.log("File saved");
			} catch (error) {
				console.error("File save error:", error);
			}
		}
	}
}

window.Alpine = Alpine;
Alpine.start();