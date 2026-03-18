import { extractTextFromBuffer, extractTextFromFile } from "../ocr/tesseract.js";
import { scoreRisk } from "../riskAnalysis/riskScorer.js";

const DEFAULT_REQUIRED_FIELDS = Object.freeze([
	"khasraNumber",
	"surveyNumber",
	"plotNumber",
	"location",
	"area",
]);

const normalize = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const buildMatchedFields = ({ extractedText, property = {}, requiredFields = DEFAULT_REQUIRED_FIELDS }) => {
	const normalizedText = normalize(extractedText);
	const matchedFields = {};

	for (const field of requiredFields) {
		const expected = property?.[field];
		if (expected == null || expected === "") {
			matchedFields[field] = false;
			continue;
		}

		matchedFields[field] = normalizedText.includes(normalize(expected));
	}

	const entries = Object.entries(matchedFields);
	const matchedCount = entries.filter(([, matched]) => matched).length;
	const totalFields = entries.length;
	const matchPercentage = totalFields > 0 ? Math.round((matchedCount / totalFields) * 100) : 0;

	return {
		matchedFields,
		matchedCount,
		totalFields,
		matchPercentage,
	};
};

const ensureInput = ({ filePath, buffer }) => {
	if (!filePath && !buffer) {
		const error = new Error("Either filePath or buffer is required for verification");
		error.statusCode = 400;
		throw error;
	}
};

const runOcr = async ({ filePath, buffer, ocrOptions }) => {
	if (filePath) {
		return extractTextFromFile(filePath, ocrOptions);
	}

	return extractTextFromBuffer(buffer, ocrOptions);
};

export const verifyDocument = async ({
	filePath,
	buffer,
	property = {},
	requiredFields = DEFAULT_REQUIRED_FIELDS,
	ocrOptions = {},
	verificationContext = {},
	riskOptions = {},
} = {}) => {
	ensureInput({ filePath, buffer });

	const ocrResult = await runOcr({ filePath, buffer, ocrOptions });
	const extractedText = ocrResult.text || "";

	const matching = buildMatchedFields({
		extractedText,
		property,
		requiredFields,
	});

	const verification = {
		...verificationContext,
		ocrConfidence: toNumber(ocrResult.confidence, null),
		matchPercentage: matching.matchPercentage,
		matchedCount: matching.matchedCount,
		totalFields: matching.totalFields,
	};

	const risk = await scoreRisk(
		{
			extractedText,
			property,
			matchedFields: matching.matchedFields,
			verification,
			extraContext: {
				filePath: filePath || "",
				requiredFields,
			},
		},
		riskOptions
	);

	return {
		extractedText,
		ocr: {
			confidence: ocrResult.confidence,
			language: ocrResult.language,
			meta: ocrResult.meta,
		},
		matching,
		risk,
	};
};

export default verifyDocument;

