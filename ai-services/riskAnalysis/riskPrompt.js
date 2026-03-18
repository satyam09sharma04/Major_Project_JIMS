const DEFAULT_FIELDS = Object.freeze([
	"khasraNumber",
	"surveyNumber",
	"plotNumber",
	"location",
	"area",
]);

const normalizeText = (value, fallback = "") => {
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

const pickFieldSnapshot = (source = {}, fields = DEFAULT_FIELDS) => {
	const snapshot = {};

	for (const field of fields) {
		snapshot[field] = source?.[field] ?? null;
	}

	return snapshot;
};

const buildStrictJsonInstruction = () => {
	return [
		"Return ONLY a valid JSON object. Do not include markdown, code fences, or prose.",
		"JSON keys required:",
		"- riskScore: number (0-100, where 100 means lowest risk and 0 means highest risk)",
		"- riskLevel: string (LOW | MEDIUM | HIGH)",
		"- flags: string[] (specific mismatch or concern points)",
		"- summary: string (concise 1-3 sentence explanation)",
		"- confidence: number (0-1 confidence of your own assessment)",
	].join("\n");
};

export const buildRiskSystemPrompt = () => {
	return [
		"You are a land-record fraud and integrity analyst.",
		"You compare extracted OCR text against expected property metadata and identify fraud/mismatch indicators.",
		"Your assessment should be conservative and evidence-based.",
		buildStrictJsonInstruction(),
	].join("\n\n");
};

export const buildRiskUserPrompt = ({
	extractedText = "",
	property = {},
	matchedFields = {},
	verification = {},
	extraContext = {},
	requiredFields = DEFAULT_FIELDS,
} = {}) => {
	const propertySnapshot = pickFieldSnapshot(property, requiredFields);

	const sections = [
		"Assess the document integrity risk for this property verification input.",
		"Expected Property Metadata:",
		toPrettyJson(propertySnapshot),
		"Matched Fields (boolean map):",
		toPrettyJson(matchedFields || {}),
		"Verification Context:",
		toPrettyJson(verification || {}),
		"Extra Context:",
		toPrettyJson(extraContext || {}),
		"OCR Extracted Text:",
		normalizeText(extractedText, "(empty OCR text)"),
		"Rules:",
		"1) Missing/contradictory identifiers should increase risk.",
		"2) Consistent identifiers and location/area alignment should reduce risk.",
		"3) Unreadable or very short OCR content should increase uncertainty and be flagged.",
		"4) Keep riskLevel aligned with riskScore:",
		"   - LOW for 80-100",
		"   - MEDIUM for 50-79",
		"   - HIGH for 0-49",
		buildStrictJsonInstruction(),
	];

	return sections.join("\n\n");
};

export const buildRiskPrompts = (payload = {}) => {
	return {
		systemPrompt: buildRiskSystemPrompt(),
		userPrompt: buildRiskUserPrompt(payload),
	};
};

export const buildRiskSchemaHint = () => {
	return {
		type: "object",
		required: ["riskScore", "riskLevel", "flags", "summary", "confidence"],
		properties: {
			riskScore: { type: "number", minimum: 0, maximum: 100 },
			riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
			flags: { type: "array", items: { type: "string" } },
			summary: { type: "string" },
			confidence: { type: "number", minimum: 0, maximum: 1 },
		},
	};
};

export default {
	buildRiskSystemPrompt,
	buildRiskUserPrompt,
	buildRiskPrompts,
	buildRiskSchemaHint,
};

