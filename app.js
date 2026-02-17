import { question } from 'readline-sync'
import { existsSync, readdirSync, readFileSync } from 'fs'
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
	if (fileName === ".git" || fileName === "node_modules" || fileName === ".env" || fileName === "bin")
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
allFiles.forEach(file => {
	let txt = `===== ${file} =====`; //readFileSync(file);
	mainText += `${txt}\n\n`;
});

console.log(mainText);