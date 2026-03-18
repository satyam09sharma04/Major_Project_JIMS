import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

const normalize = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const hasToken = (haystack, needle) => {
	if (!needle) {
		return false;
	}

	return normalize(haystack).includes(normalize(needle));
};

const parseStructuredAiResponse = (rawText) => {
	const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

	try {
		return JSON.parse(cleaned);
	} catch {
		const match = cleaned.match(/\{[\s\S]*\}/);
		if (!match) {
			throw new Error("AI API returned unstructured response");
		}
		return JSON.parse(match[0]);
	}
};

const runHeuristicRisk = ({ extractedText, property, matchedFields }) => {
	const missing = Object.entries(matchedFields)
		.filter(([, isMatched]) => !isMatched)
		.map(([field]) => field);

	let score = 90;
	score -= missing.length * 20;

	if ((extractedText ?? "").length < 80) {
		score -= 15;
	}

	const boundedScore = Math.max(0, Math.min(100, score));

	return {
		source: "heuristic",
		riskScore: boundedScore,
		riskLevel: boundedScore >= 80 ? "LOW" : boundedScore >= 50 ? "MEDIUM" : "HIGH",
		flags: missing.map((field) => `${field} not found in extracted text`),
		summary:
			missing.length === 0
				? "All key property identifiers were matched in the document text"
				: "One or more key property identifiers are missing from extracted document text",
		propertySnapshot: {
			khasraNumber: property.khasraNumber,
			surveyNumber: property.surveyNumber,
			plotNumber: property.plotNumber,
			location: property.location,
			area: property.area,
		},
	};
};

const ocrImageBuffer = async (fileBuffer) => {
	let tesseract;

	try {
		tesseract = await import("tesseract.js");
	} catch {
		const error = new Error("Missing OCR dependency: install tesseract.js");
		error.statusCode = 500;
		throw error;
	}

	const { data } = await tesseract.recognize(fileBuffer, "eng");
	return data?.text?.trim() ?? "";
};

const extractTextFromPdf = async (fileBuffer) => {
	let pdfParse;

	try {
		pdfParse = (await import("pdf-parse")).default;
	} catch {
		const error = new Error("Missing PDF dependency: install pdf-parse");
		error.statusCode = 500;
		throw error;
	}

	const parsed = await pdfParse(fileBuffer);
	return parsed?.text?.trim() ?? "";
};

export const extractTextFromDocument = async ({ filePath, fileType }) => {
	if (!filePath) {
		const error = new Error("filePath is required for OCR extraction");
		error.statusCode = 400;
		throw error;
	}

	const resolvedPath = path.resolve(filePath);
	const fileBuffer = await fs.readFile(resolvedPath);

	if (fileType === "application/pdf") {
		return extractTextFromPdf(fileBuffer);
	}

	if ((fileType ?? "").startsWith("image/")) {
		return ocrImageBuffer(fileBuffer);
	}

	const error = new Error("Unsupported document type for OCR");
	error.statusCode = 400;
	throw error;
};

export const matchPropertyDetails = ({ extractedText, property }) => {
	if (!property) {
		const error = new Error("property is required for matching");
		error.statusCode = 400;
		throw error;
	}

	const matchedFields = {
		khasraNumber: hasToken(extractedText, property.khasraNumber),
		surveyNumber: hasToken(extractedText, property.surveyNumber),
		plotNumber: hasToken(extractedText, property.plotNumber),
		location: hasToken(extractedText, property.location),
		area: hasToken(extractedText, property.area),
	};

	const matchedCount = Object.values(matchedFields).filter(Boolean).length;
	const totalFields = Object.keys(matchedFields).length;

	return {
		matchedFields,
		matchedCount,
		totalFields,
		matchPercentage: Math.round((matchedCount / totalFields) * 100),
	};
};

export const generateRiskScore = async ({ extractedText, property, matchedFields }) => {
	const apiKey = process.env.AI_API_KEY;

	if (!apiKey) {
		return runHeuristicRisk({ extractedText, property, matchedFields });
	}

	const model = process.env.AI_MODEL ?? DEFAULT_GEMINI_MODEL;
	const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

	const prompt = [
		"You are a land-record verification expert.",
		"Analyze OCR text against property metadata and return strict JSON only.",
		"Return object keys: riskScore (0-100), riskLevel (LOW|MEDIUM|HIGH), flags (string[]), summary (string).",
		"Risk should be lower when identifiers match, higher on mismatch/ambiguity.",
		"Property metadata:",
		JSON.stringify(
			{
				khasraNumber: property.khasraNumber,
				surveyNumber: property.surveyNumber,
				plotNumber: property.plotNumber,
				location: property.location,
				area: property.area,
			},
			null,
			2
		),
		"Match results:",
		JSON.stringify(matchedFields, null, 2),
		"OCR extracted text:",
		extractedText || "",
	].join("\n\n");

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			contents: [
				{
					role: "user",
					parts: [{ text: prompt }],
				},
			],
			generationConfig: {
				temperature: 0.2,
				responseMimeType: "application/json",
			},
		}),
	});

	if (!response.ok) {
		return runHeuristicRisk({ extractedText, property, matchedFields });
	}

	const payload = await response.json();
	const rawText =
		payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text ?? "";

	if (!rawText) {
		return runHeuristicRisk({ extractedText, property, matchedFields });
	}

	try {
		const parsed = parseStructuredAiResponse(rawText);
		const boundedScore = Math.max(0, Math.min(100, Number(parsed.riskScore ?? 50)));

		return {
			source: "ai",
			riskScore: boundedScore,
			riskLevel: parsed.riskLevel ?? (boundedScore >= 80 ? "LOW" : boundedScore >= 50 ? "MEDIUM" : "HIGH"),
			flags: Array.isArray(parsed.flags) ? parsed.flags : [],
			summary: parsed.summary ?? "AI risk analysis completed",
			propertySnapshot: {
				khasraNumber: property.khasraNumber,
				surveyNumber: property.surveyNumber,
				plotNumber: property.plotNumber,
				location: property.location,
				area: property.area,
			},
		};
	} catch {
		return runHeuristicRisk({ extractedText, property, matchedFields });
	}
};

export const verifyPropertyDocumentWithAi = async ({ document, property }) => {
	if (!document) {
		const error = new Error("document is required");
		error.statusCode = 400;
		throw error;
	}

	if (!property) {
		const error = new Error("property is required");
		error.statusCode = 400;
		throw error;
	}

	const extractedText = await extractTextFromDocument({
		filePath: document.filePath,
		fileType: document.fileType,
	});

	const matching = matchPropertyDetails({ extractedText, property });
	const risk = await generateRiskScore({
		extractedText,
		property,
		matchedFields: matching.matchedFields,
	});

	return {
		extractedText,
		matching,
		risk,
	};
};
