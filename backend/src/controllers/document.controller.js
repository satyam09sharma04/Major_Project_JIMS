import { getDocumentsByPropertyId, uploadPropertyDocument } from "../services/document.service.js";
import { sendCreated, sendList } from "../utils/response.util.js";

export const uploadDocument = async (req, res, next) => {
	try {
		const propertyId = req.body?.propertyId ?? req.params?.propertyId;
		const baseUrl = `${req.protocol}://${req.get("host")}`;
		const document = await uploadPropertyDocument({
			propertyId,
			file: req.file,
			baseUrl,
		});

		return sendCreated(res, {
			message: "Document uploaded successfully",
			data: document,
			meta: {
				riskScore: document?.verification?.riskScore ?? null,
			},
		});
	} catch (error) {
		return next(error);
	}
};

export const getDocuments = async (req, res, next) => {
	try {
		const propertyId = req.params?.propertyId ?? req.query?.propertyId;
		const baseUrl = `${req.protocol}://${req.get("host")}`;
		const documents = await getDocumentsByPropertyId(propertyId, baseUrl);

		return sendList(res, {
			message: "Documents fetched successfully",
			data: documents,
		});
	} catch (error) {
		return next(error);
	}
};
