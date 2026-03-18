import fs from "node:fs/promises";
import path from "node:path";

const SUPPORTED_OUTPUT_FORMATS = new Set(["keep", "png", "jpeg", "webp"]);

const DEFAULT_OPTIONS = Object.freeze({
	enabled: true,
	requireSharp: false,
	grayscale: true,
	normalize: true,
	sharpen: true,
	threshold: null,
	maxWidth: 2200,
	outputFormat: "png",
	jpegQuality: 90,
	webpQuality: 90,
});

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isBuffer = (value) => Buffer.isBuffer(value);

const loadSharp = async () => {
	try {
		const mod = await import("sharp");
		return mod.default || mod;
	} catch {
		return null;
	}
};

const normalizeOptions = (options = {}) => {
	const merged = {
		...DEFAULT_OPTIONS,
		...(options || {}),
	};

	const outputFormat = String(merged.outputFormat || "keep").toLowerCase();

	return {
		enabled: Boolean(merged.enabled),
		requireSharp: Boolean(merged.requireSharp),
		grayscale: Boolean(merged.grayscale),
		normalize: Boolean(merged.normalize),
		sharpen: Boolean(merged.sharpen),
		threshold:
			merged.threshold == null
				? null
				: clamp(Math.round(toNumber(merged.threshold, 180)), 0, 255),
		maxWidth: clamp(Math.round(toNumber(merged.maxWidth, 2200)), 200, 10000),
		outputFormat: SUPPORTED_OUTPUT_FORMATS.has(outputFormat) ? outputFormat : "png",
		jpegQuality: clamp(Math.round(toNumber(merged.jpegQuality, 90)), 1, 100),
		webpQuality: clamp(Math.round(toNumber(merged.webpQuality, 90)), 1, 100),
	};
};

const applyOutputFormat = (pipeline, options) => {
	if (options.outputFormat === "keep") {
		return pipeline;
	}

	if (options.outputFormat === "png") {
		return pipeline.png();
	}

	if (options.outputFormat === "jpeg") {
		return pipeline.jpeg({ quality: options.jpegQuality, mozjpeg: true });
	}

	if (options.outputFormat === "webp") {
		return pipeline.webp({ quality: options.webpQuality });
	}

	return pipeline;
};

export const preprocessImageBuffer = async (buffer, options = {}) => {
	if (!isBuffer(buffer)) {
		const error = new Error("preprocessImageBuffer expects a Buffer input");
		error.statusCode = 400;
		throw error;
	}

	const finalOptions = normalizeOptions(options);
	if (!finalOptions.enabled) {
		return {
			buffer,
			meta: {
				engine: "disabled",
				transformed: false,
				bytesIn: buffer.length,
				bytesOut: buffer.length,
			},
		};
	}

	const sharp = await loadSharp();
	if (!sharp) {
		if (finalOptions.requireSharp) {
			const error = new Error("OCR preprocessing requires 'sharp'. Install it in ai-services package.");
			error.statusCode = 500;
			throw error;
		}

		return {
			buffer,
			meta: {
				engine: "fallback",
				transformed: false,
				bytesIn: buffer.length,
				bytesOut: buffer.length,
				reason: "sharp-not-installed",
			},
		};
	}

	let pipeline = sharp(buffer, { failOnError: false }).rotate();

	const inputMeta = await pipeline.metadata();
	if (inputMeta.width && inputMeta.width > finalOptions.maxWidth) {
		pipeline = pipeline.resize({ width: finalOptions.maxWidth, fit: "inside", withoutEnlargement: true });
	}

	if (finalOptions.grayscale) {
		pipeline = pipeline.grayscale();
	}

	if (finalOptions.normalize) {
		pipeline = pipeline.normalize();
	}

	if (finalOptions.sharpen) {
		pipeline = pipeline.sharpen();
	}

	if (finalOptions.threshold != null) {
		pipeline = pipeline.threshold(finalOptions.threshold);
	}

	pipeline = applyOutputFormat(pipeline, finalOptions);

	const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

	return {
		buffer: data,
		meta: {
			engine: "sharp",
			transformed: true,
			bytesIn: buffer.length,
			bytesOut: data.length,
			input: {
				width: inputMeta.width || null,
				height: inputMeta.height || null,
				format: inputMeta.format || null,
			},
			output: {
				width: info.width || null,
				height: info.height || null,
				format: info.format || null,
				size: info.size || data.length,
			},
			options: finalOptions,
		},
	};
};

export const preprocessImageFile = async (inputPath, options = {}) => {
	if (!inputPath) {
		const error = new Error("inputPath is required");
		error.statusCode = 400;
		throw error;
	}

	const resolvedInputPath = path.resolve(inputPath);
	const inputBuffer = await fs.readFile(resolvedInputPath);
	const result = await preprocessImageBuffer(inputBuffer, options);

	const outputPath = options.outputPath ? path.resolve(options.outputPath) : "";
	if (outputPath) {
		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		await fs.writeFile(outputPath, result.buffer);
	}

	return {
		...result,
		inputPath: resolvedInputPath,
		outputPath: outputPath || null,
	};
};

export const createOcrPreset = (preset = "default") => {
	const key = String(preset || "default").toLowerCase();

	if (key === "aggressive") {
		return {
			...DEFAULT_OPTIONS,
			grayscale: true,
			normalize: true,
			sharpen: true,
			threshold: 165,
			maxWidth: 2600,
			outputFormat: "png",
		};
	}

	if (key === "light") {
		return {
			...DEFAULT_OPTIONS,
			grayscale: false,
			normalize: true,
			sharpen: false,
			threshold: null,
			maxWidth: 1800,
			outputFormat: "keep",
		};
	}

	return { ...DEFAULT_OPTIONS };
};

export default {
	preprocessImageBuffer,
	preprocessImageFile,
	createOcrPreset,
};

