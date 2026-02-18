//This is Paleograph project source code (your own source code)

import { question } from 'readline-sync'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { askLLM } from 'core-common'
import path from 'path'

const MB_SIZE = 5;
const MB_TOTAL_SIZE = 10;
const MAX_FILE_SIZE = MB_SIZE * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = MB_TOTAL_SIZE * 1024 * 1024;
const MAX_DEPTH = 10;

const reportPath = './reports';
if (!existsSync(reportPath))
	mkdirSync(reportPath);

const pathStr = question("Input path: "); //allow path selection anywhere even outside cwd
if (!pathStr) {
	console.error("empty");
	process.exit(1);
}

let reportName = question("Report file name: ");
let gen = "";

const now = new Date();
const dateTimeString = now.toISOString()
	.replace(/:/g, "-")
	.replace(/\./g, "-");
gen = `log_${dateTimeString}`;

reportName = reportName.replace(/[^a-zA-Z0-9_-]/g, '_') || gen;

if (!existsSync(pathStr)) {
	console.error("invalid");
	process.exit(1);
}

const realPath = path.resolve(pathStr);

const validFiles = [
	".txt",
	".xml",
	".html",
	".css",
	".js",
	".json"
];

function isFileValid(dirent) {
	const name = dirent.name.toLowerCase();
	const skipDirs = new Set(
		[
			'system-prompt.txt', 
			'reports',
			'$temp.txt',
			'.git',
			'node_modules',
			'.env',
			'bin',
			'obj',
			'package-lock.json'
		]
	);

	if (skipDirs.has(name)) return false;
	if (dirent.isDirectory()) return true;

	const ext = path.extname(name);
	return validFiles.includes(ext);
}

function getFilesRecursively(dir, depth = 0) {
	let results = [];

	if (depth > MAX_DEPTH) return []; //is depth working properly here?

	const list = readdirSync(dir, { withFileTypes: true, followSymlinks: false }).filter(file => {
		return isFileValid(file);
	});

	list.forEach((dirent) => {
		const fullPath = path.join(dir, dirent.name);

		if (dirent.isDirectory()) {
			results = results.concat(getFilesRecursively(fullPath, depth + 1));
		} else if (dirent.isFile()) {
			results.push(fullPath);
		}
	});

	return results;
}

const allFiles = getFilesRecursively(pathStr);
console.log(allFiles);

let mainText = "";
let totalSize = 0;

mainText += `===== FILE START =====\n\n`;
allFiles.forEach(file => {
	const stats = statSync(file);

	if (stats.size > MAX_FILE_SIZE || totalSize + stats.size > MAX_TOTAL_FILE_SIZE) {
		console.log(`File '${file}' skipped (file size limit)`);
		return;
	}

	try {
		let txt = `===== ${file} =====\n\n`;
		txt += readFileSync(file, 'utf8');
		mainText += `${txt}\n\n`;

		totalSize += stats.size;
	} catch (e) {
		console.error(`File reading error (${file}): ${e.message}`);
	}
});

mainText += `\n\n===== FILE END =====\n\n`;

writeFileSync("$temp.txt", mainText); //leave it as-is after use

const testMode = false;

const llmResponse = testMode ? { response: "this is a test." } : await askLLM(mainText);
console.log(`LLM response: ${llmResponse.tokensUsed} tokens used.`);

writeFileSync(`${reportPath}/${reportName}.md`, llmResponse.response);
console.log(`Report done! ${reportName}`);