const DEFAULT_MODEL = "gemini-1.5-flash";
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_TIMEOUT_MS = 30000;

const toString = (value, fallback = "") => String(value ?? fallback).trim();

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const createAbortController = (timeoutMs) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	return {
		signal: controller.signal,
		clear: () => clearTimeout(timeoutId),
	};
};

export const getGeminiConfig = () => {
	const apiKey = toString(process.env.AI_API_KEY || process.env.GEMINI_API_KEY);
	const model = toString(process.env.AI_MODEL || process.env.GEMINI_MODEL, DEFAULT_MODEL);
	const baseUrl = toString(process.env.GEMINI_BASE_URL, DEFAULT_BASE_URL);
	const timeoutMs = toNumber(process.env.GEMINI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

	return {
		apiKey,
		model,
		baseUrl,
		timeoutMs,
		enabled: Boolean(apiKey),
	};
};

const ensureConfigured = (config) => {
	if (!config.enabled) {
		const error = new Error("Gemini API is not configured. Set AI_API_KEY or GEMINI_API_KEY.");
		error.statusCode = 503;
		throw error;
	}
};

const buildEndpoint = (config) => {
	const cleanBase = config.baseUrl.replace(/\/+$/, "");
	return `${cleanBase}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
};

export const extractGeminiText = (payload) => {
	const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];

	for (const candidate of candidates) {
		const parts = candidate?.content?.parts;
		if (!Array.isArray(parts)) {
			continue;
		}

		for (const part of parts) {
			if (typeof part?.text === "string" && part.text.trim()) {
				return part.text;
			}
		}
	}

	return "";
};

export const callGemini = async ({
	contents = [],
	systemInstruction,
	generationConfig,
	safetySettings,
	config: partialConfig = {},
} = {}) => {
	const config = {
		...getGeminiConfig(),
		...partialConfig,
	};

	ensureConfigured(config);

	if (!Array.isArray(contents) || contents.length === 0) {
		const error = new Error("Gemini request requires at least one content message");
		error.statusCode = 400;
		throw error;
	}

	const body = {
		contents,
	};

	if (systemInstruction) {
		body.systemInstruction = systemInstruction;
	}

	if (generationConfig && typeof generationConfig === "object") {
		body.generationConfig = generationConfig;
	}

	if (Array.isArray(safetySettings) && safetySettings.length > 0) {
		body.safetySettings = safetySettings;
	}

	const timer = createAbortController(config.timeoutMs || DEFAULT_TIMEOUT_MS);

	try {
		const response = await fetch(buildEndpoint(config), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			signal: timer.signal,
		});

		const payload = await response.json().catch(() => null);

		if (!response.ok) {
			const reason = payload?.error?.message || payload?.error || "Gemini API request failed";
			const error = new Error(reason);
			error.statusCode = response.status || 502;
			error.details = payload;
			throw error;
		}

		return {
			text: extractGeminiText(payload),
			payload,
		};
	} catch (error) {
		if (error?.name === "AbortError") {
			const timeoutError = new Error("Gemini request timed out");
			timeoutError.statusCode = 504;
			throw timeoutError;
		}

		throw error;
	} finally {
		timer.clear();
	}
};

export const createGeminiModelRunner = (options = {}) => {
	const baseGenerationConfig = {
		temperature: 0.2,
		...((options.generationConfig && typeof options.generationConfig === "object")
			? options.generationConfig
			: {}),
	};

	return async ({ systemPrompt = "", userPrompt = "" } = {}) => {
		const contents = [
			{
				role: "user",
				parts: [{ text: userPrompt }],
			},
		];

		const systemInstruction = systemPrompt
			? {
				parts: [{ text: systemPrompt }],
			}
			: undefined;

		const { text } = await callGemini({
			contents,
			systemInstruction,
			generationConfig: baseGenerationConfig,
			safetySettings: options.safetySettings,
			config: options.config,
		});

		return text;
	};
};

export const runGeminiModel = createGeminiModelRunner();

export default {
	getGeminiConfig,
	extractGeminiText,
	callGemini,
	createGeminiModelRunner,
	runGeminiModel,
};

