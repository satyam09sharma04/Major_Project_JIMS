import fs from "node:fs/promises";
import path from "node:path";
import { createOcrPreset, preprocessImageBuffer, preprocessImageFile } from "./preprocessor.js";

const DEFAULT_LANGUAGE = "eng";

const isBuffer = (value) => Buffer.isBuffer(value);

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
	if (value == null) {
		return fallback;
	}

	if (typeof value === "boolean") {
		return value;
	}

	const normalized = String(value).trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;

	return fallback;
};

const loadTesseract = async () => {
	try {
		const mod = await import("tesseract.js");
		return mod.default || mod;
	} catch {
		const error = new Error("Missing OCR dependency: install 'tesseract.js' in ai-services package");
		error.statusCode = 500;
		throw error;
	}
};

const normalizeOptions = (options = {}) => {
	const language = String(options.language || DEFAULT_LANGUAGE).trim() || DEFAULT_LANGUAGE;
	const usePreprocess = toBoolean(options.usePreprocess, true);
	const includeWords = toBoolean(options.includeWords, false);
	const includeBlocks = toBoolean(options.includeBlocks, false);
	const includeLines = toBoolean(options.includeLines, false);

	const psm = options.psm == null ? null : toNumber(options.psm, null);
	const oem = options.oem == null ? null : toNumber(options.oem, null);

	return {
		language,
		usePreprocess,
		preprocessPreset: options.preprocessPreset || "default",
		preprocessOptions: options.preprocessOptions || {},
		psm,
		oem,
		includeWords,
		includeBlocks,
		includeLines,
		logger: typeof options.logger === "function" ? options.logger : null,
	};
};

const buildTesseractConfig = (options) => {
	const config = {};

	if (options.psm != null) {
		config.tessedit_pageseg_mode = String(options.psm);
	}

	if (options.oem != null) {
		config.tessedit_ocr_engine_mode = String(options.oem);
	}

	return config;
};

const pickDetailedData = (data, options) => {
	const details = {};

	if (options.includeWords) {
		details.words = data?.words || [];
	}

	if (options.includeLines) {
		details.lines = data?.lines || [];
	}

	if (options.includeBlocks) {
		details.blocks = data?.blocks || [];
	}

	return details;
};

export const extractTextFromBuffer = async (buffer, options = {}) => {
	if (!isBuffer(buffer)) {
		const error = new Error("extractTextFromBuffer expects a Buffer input");
		error.statusCode = 400;
		throw error;
	}

	const finalOptions = normalizeOptions(options);
	const start = Date.now();

	let ocrBuffer = buffer;
	let preprocessMeta = {
		engine: "disabled",
		transformed: false,
		bytesIn: buffer.length,
		bytesOut: buffer.length,
	};

	if (finalOptions.usePreprocess) {
		const preset = createOcrPreset(finalOptions.preprocessPreset);
		const preprocessResult = await preprocessImageBuffer(buffer, {
			...preset,
			...finalOptions.preprocessOptions,
		});

		ocrBuffer = preprocessResult.buffer;
		preprocessMeta = preprocessResult.meta;
	}

	const tesseract = await loadTesseract();
	const config = buildTesseractConfig(finalOptions);

	const { data } = await tesseract.recognize(ocrBuffer, finalOptions.language, {
		logger: finalOptions.logger || undefined,
		...(Object.keys(config).length ? { config } : {}),
	});

	const text = String(data?.text || "").trim();

	return {
		text,
		confidence: typeof data?.confidence === "number" ? data.confidence : null,
		language: finalOptions.language,
		meta: {
			durationMs: Date.now() - start,
			characters: text.length,
			preprocess: preprocessMeta,
			ocrBytes: ocrBuffer.length,
		},
		...pickDetailedData(data, finalOptions),
	};
};

export const extractTextFromFile = async (filePath, options = {}) => {
	if (!filePath) {
		const error = new Error("filePath is required");
		error.statusCode = 400;
		throw error;
	}

	const resolvedPath = path.resolve(filePath);

	if (toBoolean(options.usePreprocess, true) && options.writePreprocessedToPath) {
		await preprocessImageFile(resolvedPath, {
			...createOcrPreset(options.preprocessPreset || "default"),
			...(options.preprocessOptions || {}),
			outputPath: options.writePreprocessedToPath,
		});
	}

	const inputBuffer = await fs.readFile(resolvedPath);
	const result = await extractTextFromBuffer(inputBuffer, options);

	return {
		...result,
		filePath: resolvedPath,
	};
};

export const runOcr = extractTextFromFile;

export default {
	extractTextFromBuffer,
	extractTextFromFile,
	runOcr,
};

