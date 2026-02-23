// This is Paleograph project source code (your own source code) and you are self-evaluating it.
// This is only used as a personal local application for Windows 10 PC. No symlinks, no networked paths, just default local files.

import { existsSync, readdirSync, readFileSync, statSync, realpathSync } from 'fs'
import { askLLM } from 'core-common' //core-common's author is the same as this codebase.
import path from 'path'

const MB_SIZE = 5;
const MB_TOTAL_SIZE = 10;
const MAX_FILE_SIZE = MB_SIZE * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = MB_TOTAL_SIZE * 1024 * 1024;
const MAX_DEPTH = 10;

function getTokenCost(llmResponse) {
	const totalTokens = llmResponse.tokensUsed || 0;
	const blendedRatePerMillion = 0.275;

	return (totalTokens / 1000000) * blendedRatePerMillion;
}

async function processFiles(req) {
	const base = realpathSync("E:/Projects/");
	const realPath = realpathSync(req.sourcePath);

	const relative = path.relative(base, realPath);

	if (relative.startsWith("..") || path.isAbsolute(relative))
		throw new Error("Path is outside allowed root");

	console.log(`Working on: '${realPath}'`);

	if (!realPath || !existsSync(realPath))
		throw new Error("Invalid path");

	if (!statSync(realPath).isDirectory())
		throw new Error("Invalid path (not directory)");

	const allFiles = getFilesRecursively(realPath, realPath, req.blacklist, req.whitelist);
	console.log(allFiles);

	if (allFiles.length == 0) {
		throw new Error("File list does not contain valid files to evaluate");
	}

	let mainText = "";
	let totalSize = 0;

	mainText += `===== FILE START =====\n\n`;

	let skippedFiles = [];
	allFiles.forEach(file => {
		const stats = statSync(file);

		if (stats.size > MAX_FILE_SIZE || totalSize + stats.size > MAX_TOTAL_FILE_SIZE) {
			console.log(`File '${file}' skipped (file size limit)`);
			skippedFiles.push(file);
			return;
		}

		try {
			let txt = `===== ${file} =====\n\n`;
			txt += readFileSync(file, { encoding: 'utf8' });
			mainText += `${txt}\n\n`;

			totalSize += stats.size;
		} catch (e) {
			console.error(`File reading error (${file}): ${e.message}`);
		}
	});

	mainText += `\n\n===== FILE END =====\n\n`;

	const llmResponse = req.dryRun ? {
		response: ""
	} : await askLLM(mainText, {
		temperature: 0,
		topP: 1
	});

	console.log(`LLM response: ${llmResponse.tokensUsed} tokens used. (~$${getTokenCost(llmResponse).toFixed(6)})`);

	return {
		fileList: allFiles,
		inputFile: mainText,
		content: llmResponse.response,
		skippedFiles: skippedFiles,
		tokenCount: req.dryRun ? 0 : llmResponse.tokensUsed,
		tokenCost: req.dryRun ? 0 : getTokenCost(llmResponse).toFixed(6)
	};
}

function isFileValid(dirent, skipDirs, validFiles) {
	if (dirent.isSymbolicLink()) return false;

	const name = dirent.name.toLowerCase();
	if (skipDirs.includes(name)) return false;
	if (dirent.isDirectory()) return true;

	const ext = path.extname(name);
	return validFiles.includes(ext);
}

function getFilesRecursively(realPath, dir, skipDirs, validFiles, depth = 0) {
	if (depth > MAX_DEPTH) return [];

	let results = [];
	const list = readdirSync(dir, { withFileTypes: true, followSymlinks: false })
		.filter(p => isFileValid(p, skipDirs, validFiles));

	list.forEach(dirent => {
		const fullPath = path.join(dir, dirent.name);
		if (!fullPath.startsWith(realPath)) return;

		if (dirent.isDirectory()) {
			results = results.concat(getFilesRecursively(realPath, fullPath, skipDirs, validFiles, depth + 1));
		} else {
			results.push(fullPath);
		}
	});
	return results;
}

export {
	processFiles
}