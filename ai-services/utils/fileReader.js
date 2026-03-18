import fs from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXTENSION = Object.freeze({
	".txt": "text/plain",
	".md": "text/markdown",
	".json": "application/json",
	".csv": "text/csv",
	".pdf": "application/pdf",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".tiff": "image/tiff",
	".tif": "image/tiff",
	".bmp": "image/bmp",
});

const ensureFilePath = (filePath) => {
	const value = String(filePath ?? "").trim();
	if (!value) {
		const error = new Error("filePath is required");
		error.statusCode = 400;
		throw error;
	}

	return value;
};

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const detectMimeType = (resolvedPath) => {
	const ext = path.extname(resolvedPath).toLowerCase();
	return MIME_BY_EXTENSION[ext] || "application/octet-stream";
};

const assertSizeLimit = (size, maxBytes) => {
	if (maxBytes == null) {
		return;
	}

	const max = toNumber(maxBytes, null);
	if (max == null || max <= 0) {
		return;
	}

	if (size > max) {
		const error = new Error(`File exceeds maximum allowed size of ${max} bytes`);
		error.statusCode = 413;
		throw error;
	}
};

const buildFileMeta = (resolvedPath, stats) => {
	return {
		path: resolvedPath,
		name: path.basename(resolvedPath),
		ext: path.extname(resolvedPath).toLowerCase(),
		size: stats.size,
		mimeType: detectMimeType(resolvedPath),
		createdAt: stats.birthtime,
		updatedAt: stats.mtime,
	};
};

export const statFile = async (filePath, options = {}) => {
	const resolvedPath = path.resolve(ensureFilePath(filePath));
	const stats = await fs.stat(resolvedPath);

	if (!stats.isFile()) {
		const error = new Error("Provided path is not a file");
		error.statusCode = 400;
		throw error;
	}

	assertSizeLimit(stats.size, options.maxBytes);
	return buildFileMeta(resolvedPath, stats);
};

export const readFileBuffer = async (filePath, options = {}) => {
	const meta = await statFile(filePath, options);
	const buffer = await fs.readFile(meta.path);

	return {
		buffer,
		meta,
	};
};

export const readFileText = async (filePath, options = {}) => {
	const encoding = String(options.encoding || "utf8");
	const { buffer, meta } = await readFileBuffer(filePath, options);

	return {
		text: buffer.toString(encoding),
		meta,
	};
};

export const readJsonFile = async (filePath, options = {}) => {
	const { text, meta } = await readFileText(filePath, options);

	try {
		return {
			data: JSON.parse(text),
			meta,
		};
	} catch (parseError) {
		const error = new Error(`Invalid JSON file: ${parseError.message}`);
		error.statusCode = 400;
		throw error;
	}
};

export const readFileBase64 = async (filePath, options = {}) => {
	const { buffer, meta } = await readFileBuffer(filePath, options);

	return {
		base64: buffer.toString("base64"),
		meta,
	};
};

export const writeJsonFile = async (filePath, data, options = {}) => {
	const resolvedPath = path.resolve(ensureFilePath(filePath));
	const pretty = options.pretty !== false;
	const spaces = pretty ? toNumber(options.spaces, 2) : 0;
	const payload = JSON.stringify(data, null, spaces);

	await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
	await fs.writeFile(resolvedPath, payload, "utf8");

	return statFile(resolvedPath);
};

export const toDataUri = ({ base64, mimeType = "application/octet-stream" }) => {
	const value = String(base64 ?? "");
	if (!value) {
		return "";
	}

	return `data:${mimeType};base64,${value}`;
};

export default {
	statFile,
	readFileBuffer,
	readFileText,
	readJsonFile,
	readFileBase64,
	writeJsonFile,
	toDataUri,
};

