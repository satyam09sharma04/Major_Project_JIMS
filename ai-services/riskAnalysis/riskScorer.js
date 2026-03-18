import { buildRiskPrompts } from "./riskPrompt.js";
import { createGeminiModelRunner } from "../verification/geminiClient.js";

const RISK_LEVEL = Object.freeze({
	LOW: "LOW",
	MEDIUM: "MEDIUM",
	HIGH: "HIGH",
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const toString = (value, fallback = "") => {
	if (value == null) {
		return fallback;
	}

	return String(value).trim();
};

const normalizeRiskLevel = (riskLevel, riskScore) => {
	const normalized = toString(riskLevel).toUpperCase();
	if (normalized === RISK_LEVEL.LOW || normalized === RISK_LEVEL.MEDIUM || normalized === RISK_LEVEL.HIGH) {
		return normalized;
	}

	if (riskScore >= 80) return RISK_LEVEL.LOW;
	if (riskScore >= 50) return RISK_LEVEL.MEDIUM;
	return RISK_LEVEL.HIGH;
};

const makeSummaryFromFlags = (flags, riskLevel) => {
	if (!flags.length) {
		return "Property identifiers appear consistent with OCR evidence.";
	}

	if (riskLevel === RISK_LEVEL.HIGH) {
		return "Multiple high-risk inconsistencies detected between OCR and expected property metadata.";
	}

	if (riskLevel === RISK_LEVEL.MEDIUM) {
		return "Some inconsistencies or quality issues detected; manual review is recommended.";
	}

	return "Minor inconsistencies detected, but overall risk remains low.";
};

const parseModelResponse = (raw) => {
	if (raw == null) {
		return null;
	}

	if (typeof raw === "object") {
		return raw;
	}

	const text = toString(raw);
	if (!text) {
		return null;
	}

	const cleaned = text
		.replace(/^```json\s*/i, "")
		.replace(/^```/i, "")
		.replace(/```$/i, "")
		.trim();

	try {
		return JSON.parse(cleaned);
	} catch {
		const match = cleaned.match(/\{[\s\S]*\}/);
		if (!match) {
			return null;
		}

		try {
			return JSON.parse(match[0]);
		} catch {
			return null;
		}
	}
};

export const normalizeRiskResult = (result = {}, { source = "heuristic" } = {}) => {
	const riskScore = clamp(Math.round(toNumber(result.riskScore, 50)), 0, 100);
	const riskLevel = normalizeRiskLevel(result.riskLevel, riskScore);

	const flags = Array.isArray(result.flags)
		? result.flags.map((flag) => toString(flag)).filter(Boolean)
		: [];

	const summary = toString(result.summary) || makeSummaryFromFlags(flags, riskLevel);
	const confidence = clamp(toNumber(result.confidence, 0.65), 0, 1);

	return {
		riskScore,
		riskLevel,
		flags,
		summary,
		confidence,
		source: toString(result.source || source, source),
	};
};

export const scoreRiskHeuristic = ({ extractedText = "", matchedFields = {}, verification = {} } = {}) => {
	const fieldEntries = Object.entries(matchedFields || {});
	const totalFields = fieldEntries.length;

	const missingFields = fieldEntries.filter(([, matched]) => !Boolean(matched)).map(([field]) => field);
	const matchedCount = totalFields - missingFields.length;

	let score = 90;

	if (totalFields > 0) {
		const matchPenalty = Math.round((missingFields.length / totalFields) * 70);
		score -= matchPenalty;
	}

	const cleanText = toString(extractedText);
	if (cleanText.length < 80) {
		score -= 15;
	}

	if (cleanText.length < 20) {
		score -= 10;
	}

	const ocrConfidence = toNumber(verification?.ocrConfidence, null);
	if (ocrConfidence != null && ocrConfidence < 50) {
		score -= 10;
	}

	const riskScore = clamp(Math.round(score), 0, 100);
	const riskLevel = normalizeRiskLevel(null, riskScore);

	const flags = [
		...missingFields.map((field) => `${field} not found in OCR text`),
		...(cleanText.length < 80 ? ["OCR text appears short or incomplete"] : []),
		...(ocrConfidence != null && ocrConfidence < 50 ? ["Low OCR confidence detected"] : []),
	];

	return normalizeRiskResult(
		{
			riskScore,
			riskLevel,
			flags,
			summary:
				matchedCount === totalFields && cleanText.length >= 80
					? "Key identifiers appear aligned with OCR evidence."
					: "One or more verification concerns were detected from OCR matching.",
			confidence: totalFields > 0 ? clamp(matchedCount / totalFields, 0.3, 0.95) : 0.6,
			source: "heuristic",
		},
		{ source: "heuristic" }
	);
};

export const scoreRiskWithModel = async (payload = {}, options = {}) => {
	const { runModel } = options;

	if (typeof runModel !== "function") {
		const error = new Error("runModel callback is required for model-based risk scoring");
		error.statusCode = 500;
		throw error;
	}

	const prompts = buildRiskPrompts(payload);
	const raw = await runModel({
		...prompts,
		payload,
	});

	const parsed = parseModelResponse(raw);
	if (!parsed) {
		const error = new Error("Model returned an unparseable risk response");
		error.statusCode = 502;
		throw error;
	}

	return normalizeRiskResult(parsed, { source: "ai" });
};

export const scoreRisk = async (payload = {}, options = {}) => {
	const {
		preferModel = true,
		runModel,
		useGemini = true,
		geminiOptions = {},
	} = options;

	const modelRunner =
		typeof runModel === "function"
			? runModel
			: (preferModel && useGemini ? createGeminiModelRunner(geminiOptions) : null);

	if (preferModel && typeof modelRunner === "function") {
		try {
			return await scoreRiskWithModel(payload, {
				...options,
				runModel: modelRunner,
			});
		} catch {
			return scoreRiskHeuristic(payload);
		}
	}

	return scoreRiskHeuristic(payload);
};

export default {
	normalizeRiskResult,
	scoreRiskHeuristic,
	scoreRiskWithModel,
	scoreRisk,
};

