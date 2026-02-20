const template = {
	"sourcePath": "",
	"outputPath": "report.md",

	// "tag": "web development",
	"customPrompt": "",

	"whitelist": [
		".txt",
		".xml",
		".html",
		".css",
		".js",
		".json",
		".cs",
		".csproj"
	],

	"blacklist": [
		'reports',
		'$temp.txt',
	]
}

export function newRequest() {
	return structuredClone(template);
}

export function validateRequest(req) {
	req = { ...newRequest(), ...req };

	if (typeof req.whitelist === "string") {
		req.whitelist = req.whitelist
			.split("|")
			.map(item => item.trim())
			.filter(Boolean);
	}

	if (typeof req.blacklist === "string") {
		req.blacklist = req.blacklist
			.split("|")
			.map(item => item.trim())
			.filter(Boolean);
	}

	const mandatoryBlacklist = [
		".vscode",
		'.git',
		'node_modules',
		'.env',
		'bin',
		'obj',
		'package-lock.json'
	];

	req.blacklist = [
		...new Set([...req.blacklist, ...mandatoryBlacklist])
	];

	return req;
}