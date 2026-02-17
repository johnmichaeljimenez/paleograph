import { question } from 'readline-sync'
import { existsSync, readdirSync } from 'fs'
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

function getFilesRecursively(dir) {
	let results = [];

	const list = readdirSync(dir, { withFileTypes: true });

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