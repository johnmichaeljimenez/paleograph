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
				this.tab = 'report';
				this.showToast("Report generation success!", "success");
			} catch (err) {
				console.error(err);
				this.showToast("Report generation error. Check console.", "error");
			} finally {
				this.loading = false;
			}
		},

		copyBlob() {
			if (this.newData?.output?.textBlob) {
				navigator.clipboard.writeText(this.newData.output.textBlob);
				this.showToast("Copied blob to clipboard!", "success");
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

				this.showToast(`File loaded: ${this.fileHandle.name}`, "success");

			} catch (error) {
				this.showToast("File open error. Check console.", "error");
				console.error("File open error:", error);
			}
		},

		async fileSave(saveAs) {
			try {
				if (!this.fileHandle || saveAs) {
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

				this.showToast(`File saved: ${this.fileHandle.name}`, "success");
			} catch (error) {
				this.showToast("File save error. Check console.", "error");
				console.error("File save error:", error);
			}
		},

		toast: {
			show: false,
			message: '',
			type: 'info',
			timeout: null
		},

		showToast(message, type = 'info', duration = 3000) {
			this.toast.message = message;
			this.toast.type = type;
			this.toast.show = true;

			clearTimeout(this.toast.timeout);

			this.toast.timeout = setTimeout(() => {
				this.toast.show = false;
			}, duration);
		},
	}
}

window.Alpine = Alpine;
Alpine.start();