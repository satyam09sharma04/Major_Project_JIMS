import mongoose from "mongoose";
import Document from "../models/Document.model.js";
import Property from "../models/Property.model.js";
import { verifyPropertyDocumentWithAi } from "./ai.service.js";

const validateObjectId = (id, label) => {
	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		const error = new Error(`Invalid ${label}`);
		error.statusCode = 400;
		throw error;
	}
};

export const runDocumentVerification = async (documentId) => {
	validateObjectId(documentId, "document ID");

	const document = await Document.findById(documentId);
	if (!document) {
		const error = new Error("Document not found");
		error.statusCode = 404;
		throw error;
	}

	const property = await Property.findById(document.property);
	if (!property) {
		const error = new Error("Linked property not found");
		error.statusCode = 404;
		throw error;
	}

	try {
		const verificationResult = await verifyPropertyDocumentWithAi({ document, property });

		document.verification = {
			status: "COMPLETED",
			riskScore: verificationResult.risk.riskScore,
			riskLevel: verificationResult.risk.riskLevel,
			source: verificationResult.risk.source,
			matchPercentage: verificationResult.matching.matchPercentage,
			matchedFields: verificationResult.matching.matchedFields,
			flags: verificationResult.risk.flags,
			summary: verificationResult.risk.summary,
			extractedText: verificationResult.extractedText,
			verifiedAt: new Date(),
			errorMessage: "",
		};

		await document.save();

		return {
			document,
			verification: document.verification,
		};
	} catch (error) {
		document.verification = {
			status: "FAILED",
			flags: [],
			summary: "Verification failed",
			extractedText: "",
			verifiedAt: new Date(),
			errorMessage: error.message || "Unknown verification error",
		};

		await document.save();
		throw error;
	}
};
