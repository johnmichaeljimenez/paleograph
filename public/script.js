import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3/+esm';
import { newRequest, validateRequest } from '/shared/request.js';

window.app = function () {
	const baseData = newRequest();

	return {
		navOpen: false,
		tab: 'form',

		fileHandle: null,
		newData: { ...baseData },
		lastSavedSnapshot: JSON.stringify(baseData),

		loading: false,

		get renderedReport() {
			if (!this.newData?.output?.report) return '';

			const raw = marked.parse(this.newData.output.report, {
				gfm: true,
				breaks: true,
				headerIds: false
			});

			const clean = DOMPurify.sanitize(raw);

			this.$nextTick(() => {
				document.querySelectorAll('#report pre code').forEach((block) => {
					hljs.highlightElement(block);
				});
			});

			return clean;
		},

		async run() {
			if (this.isDirty && this.newData.output?.textBlob?.length > 0) {
				if (!confirm("You have unsaved changes. Run anyway?"))
					return;
			}

			this.loading = true;

			try {
				this.newData = validateRequest({
					...this.newData,
					whitelist: this.whitelistString,
					blacklist: this.blacklistString
				});

				const response = await fetch("/api/process", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(this.newData)
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data?.Error || "Server error");
				}

				this.newData.output = data;
				this.tab = 'report';
				this.showToast("Report generation success!", "success");
			} catch (err) {
				console.error(err);
				this.showToast(`Error: ${err.message}` || "Report generation error.", "error");
			} finally {
				this.loading = false;
			}
		},

		showUnsavedConfirm() {
			return this.isDirty && !confirm("You have unsaved changes. Continue?");
		},

		copyBlob() {
			if (this.newData?.output?.textBlob) {
				navigator.clipboard.writeText(this.newData.output.textBlob);
				this.showToast("Copied blob to clipboard!", "success");
			}
		},

		fileNew() {
			if (this.showUnsavedConfirm())
				return;

			this.fileHandle = null;

			const data = newRequest();
			this.newData = { ...data };
			this.lastSavedSnapshot = JSON.stringify(data);
		},

		async fileOpen() {
			if (this.showUnsavedConfirm())
				return;

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
				this.lastSavedSnapshot = JSON.stringify(parsed);
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
				this.lastSavedSnapshot = JSON.stringify(this.newData);

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

		get isDirty() {
			return JSON.stringify(this.newData) !== this.lastSavedSnapshot;
		},

		get whitelistString() {
			return this.newData.whitelist.join("|");
		},
		set whitelistString(value) {
			this.newData.whitelist = value
				.split("|")
				.map(v => v.trim());
		},

		get blacklistString() {
			return this.newData.blacklist.join("|");
		},
		set blacklistString(value) {
			this.newData.blacklist = value
				.split("|")
				.map(v => v.trim());
		},

		init() {
			window.addEventListener("beforeunload", (e) => {
				if (!this.isDirty) return;
				e.preventDefault();
			});
		}
	}
}

window.Alpine = Alpine;
Alpine.start();