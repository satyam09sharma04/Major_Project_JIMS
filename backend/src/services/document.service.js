import mongoose from "mongoose";
import Document from "../models/Document.model.js";
import Property from "../models/Property.model.js";
import { runDocumentVerification } from "./verify.service.js";

export const uploadPropertyDocument = async ({ propertyId, file }) => {
	if (!propertyId) {
		const error = new Error("propertyId is required");
		error.statusCode = 400;
		throw error;
	}

	if (!mongoose.Types.ObjectId.isValid(propertyId)) {
		const error = new Error("Invalid property ID");
		error.statusCode = 400;
		throw error;
	}

	if (!file) {
		const error = new Error("Document file is required");
		error.statusCode = 400;
		throw error;
	}

	const property = await Property.findById(propertyId);

	if (!property) {
		const error = new Error("Property not found");
		error.statusCode = 404;
		throw error;
	}

	const document = await Document.create({
		property: property._id,
		fileName: file.originalname,
		filePath: file.path,
		fileType: file.mimetype,
	});

	const { verification } = await runDocumentVerification(document._id);

	const refreshedDocument = await Document.findById(document._id)
		.populate("property", "khasraNumber surveyNumber plotNumber location area")
		.lean();

	return {
		...refreshedDocument,
		verification,
	};
};

export const getDocumentsByPropertyId = async (propertyId) => {
	if (!propertyId) {
		const error = new Error("propertyId is required");
		error.statusCode = 400;
		throw error;
	}

	if (!mongoose.Types.ObjectId.isValid(propertyId)) {
		const error = new Error("Invalid property ID");
		error.statusCode = 400;
		throw error;
	}

	const documents = await Document.find({ property: propertyId })
		.sort({ createdAt: -1 })
		.populate("property", "khasraNumber surveyNumber plotNumber location");

	return documents;
};
