const DEFAULT_REQUIRED_FIELDS = Object.freeze([
	"khasraNumber",
	"surveyNumber",
	"plotNumber",
	"location",
	"area",
]);

const toString = (value, fallback = "") => {
	if (value == null) {
		return fallback;
	}

	return String(value).trim();
};

const toPrettyJson = (value) => {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "{}";
	}
};

const pickSnapshot = (source = {}, fields = DEFAULT_REQUIRED_FIELDS) => {
	const snapshot = {};

	for (const field of fields) {
		snapshot[field] = source?.[field] ?? null;
	}

	return snapshot;
};

export const buildVerificationSchemaHint = () => {
	return {
		type: "object",
		required: [
			"riskScore",
			"riskLevel",
			"flags",
			"summary",
			"confidence",
			"matchedFields",
			"matchPercentage",
		],
		properties: {
			riskScore: { type: "number", minimum: 0, maximum: 100 },
			riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
			flags: { type: "array", items: { type: "string" } },
			summary: { type: "string" },
			confidence: { type: "number", minimum: 0, maximum: 1 },
			matchedFields: { type: "object", additionalProperties: { type: "boolean" } },
			matchPercentage: { type: "number", minimum: 0, maximum: 100 },
		},
	};
};

const strictInstruction = () => {
	return [
		"Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON.",
		"Risk score convention: 100 means safest, 0 means highest risk.",
		"Risk level mapping:",
		"- LOW: 80-100",
		"- MEDIUM: 50-79",
		"- HIGH: 0-49",
		"Required keys:",
		"riskScore, riskLevel, flags, summary, confidence, matchedFields, matchPercentage",
	].join("\n");
};

export const buildVerificationSystemPrompt = () => {
	return [
		"You are an expert land-document verification analyst.",
		"You assess consistency between OCR text and expected property metadata.",
		"Be conservative and prioritize fraud detection signals.",
		strictInstruction(),
	].join("\n\n");
};

export const buildVerificationUserPrompt = ({
	extractedText = "",
	property = {},
	matchedFields = {},
	verification = {},
	extraContext = {},
	requiredFields = DEFAULT_REQUIRED_FIELDS,
} = {}) => {
	const snapshot = pickSnapshot(property, requiredFields);

	const sections = [
		"Evaluate this property document verification input and generate the final JSON decision.",
		"Expected property metadata:",
		toPrettyJson(snapshot),
		"Current matched fields map (pre-check result):",
		toPrettyJson(matchedFields || {}),
		"Verification context:",
		toPrettyJson(verification || {}),
		"Additional context:",
		toPrettyJson(extraContext || {}),
		"OCR extracted text:",
		toString(extractedText, "(empty OCR text)"),
		"Decision rules:",
		"1) Missing identifiers increase risk.",
		"2) Contradicting location/area/plot identifiers strongly increase risk.",
		"3) Very short or noisy OCR should reduce confidence and add flags.",
		"4) If evidence is mixed, set MEDIUM risk with clear flags.",
		strictInstruction(),
	];

	return sections.join("\n\n");
};

export const buildVerificationPrompts = (payload = {}) => {
	return {
		systemPrompt: buildVerificationSystemPrompt(),
		userPrompt: buildVerificationUserPrompt(payload),
	};
};

export const buildRiskPayloadFromVerification = ({
	extractedText = "",
	property = {},
	matching = {},
	ocr = {},
	extraContext = {},
} = {}) => {
	return {
		extractedText,
		property,
		matchedFields: matching?.matchedFields || {},
		verification: {
			ocrConfidence: ocr?.confidence ?? null,
			matchPercentage: matching?.matchPercentage ?? null,
			matchedCount: matching?.matchedCount ?? null,
			totalFields: matching?.totalFields ?? null,
		},
		extraContext,
	};
};

export default {
	buildVerificationSchemaHint,
	buildVerificationSystemPrompt,
	buildVerificationUserPrompt,
	buildVerificationPrompts,
	buildRiskPayloadFromVerification,
};

