const template = {
	"sourcePath": "",
	"outputPath": "",
	
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
		".vscode",
		'reports',
		'$temp.txt',
		'.git',
		'node_modules',
		'.env',
		'bin',
		'obj',
		'package-lock.json'
	]
}

export function newTemplate() {
	return structuredClone(template);
}