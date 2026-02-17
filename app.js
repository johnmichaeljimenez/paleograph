import { question } from 'readline-sync'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { askLLM } from 'core-common'
import path from 'path'

const pathStr = question("Input path: ");
if (!pathStr) {
	console.error("empty");
	process.exit(1);
}

if (!existsSync(pathStr)) {
	console.error("invalid");
	process.exit(1);
}

console.log(pathStr);

const validFiles = [
	".txt",
	".xml",
	".html",
	".css",
	".js",
	".json"
];

function isFileValid(file) {
	const fileName = file.name.toLocaleLowerCase();
	if (fileName === "system-prompt.txt" ||
		fileName === "reports" || 
		fileName === "$temp.txt" ||
		fileName === ".git" || fileName === "node_modules" || fileName === ".env" || fileName === "bin" || fileName === "obj" || fileName === "package-lock.json")
		return false;

	if (file.isDirectory())
		return true;

	let valid = false;

	validFiles.forEach(element => {
		if (path.extname(fileName) === element.toLocaleLowerCase())
			valid = true;
	});

	return valid;
}

function getFilesRecursively(dir) {
	let results = [];

	const list = readdirSync(dir, { withFileTypes: true }).filter(file => {
		return isFileValid(file);
	});

	list.forEach((dirent) => {
		const fullPath = path.join(dir, dirent.name);

		if (dirent.isDirectory()) {
			results = results.concat(getFilesRecursively(fullPath));
		} else if (dirent.isFile()) {
			results.push(fullPath);
		}
	});

	return results;
}

const allFiles = getFilesRecursively(pathStr);
console.log(allFiles);

let mainText = "";

mainText += `===== FILE START =====\n\n`;
allFiles.forEach(file => {
	let txt = `===== ${file} =====\n\n`;
	txt += readFileSync(file);
	mainText += `${txt}\n\n`;
});
mainText += `\n\n===== FILE END =====\n\n`;

writeFileSync("$temp.txt", mainText);

const llmResponse = await askLLM(mainText);
const now = new Date();
const dateTimeString = now.toISOString()
						.replace(/:/g, "-")
						.replace(/\./g, "-");
const fn = `log_${dateTimeString}.md`;

writeFileSync(`./reports/${fn}`, llmResponse.response);
console.log(`Report done! ${fn}`);