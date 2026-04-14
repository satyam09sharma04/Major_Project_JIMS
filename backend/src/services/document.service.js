import mongoose from "mongoose";
import path from "node:path";
import Document from "../models/Document.model.js";
import Property from "../models/Property.model.js";
import { runDocumentVerification } from "./verify.service.js";

const toPublicFileUrl = (filePath, baseUrl) => {
	if (!filePath) {
		return "";
	}

	const normalized = String(filePath).replace(/\\/g, "/");
	const marker = "/uploads/";
	const markerIndex = normalized.indexOf(marker);

	if (markerIndex === -1) {
		const fileName = path.basename(normalized);
		return `${baseUrl}/uploads/documents/${encodeURIComponent(fileName)}`;
	}

	const publicPath = normalized.slice(markerIndex).split("/").map((part, index) => {
		if (index === 0) {
			return part;
		}

		return encodeURIComponent(part);
	}).join("/");

	return `${baseUrl}${publicPath}`;
};

const withPublicFileUrl = (document, baseUrl) => ({
	...document,
	fileUrl: toPublicFileUrl(document?.filePath, baseUrl),
});

export const uploadPropertyDocument = async ({ propertyId, file, baseUrl }) => {
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

	return withPublicFileUrl({
		...refreshedDocument,
		verification,
	}, baseUrl);
};

export const getDocumentsByPropertyId = async (propertyId, baseUrl) => {
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

	return documents.map((document) => withPublicFileUrl(document.toObject(), baseUrl));
};
