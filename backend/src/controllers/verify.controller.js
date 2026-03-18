import { runDocumentVerification } from "../services/verify.service.js";

export const verifyDocument = async (req, res, next) => {
	try {
		const documentId = req.params?.documentId;
		const result = await runDocumentVerification(documentId);

		return res.status(200).json({
			message: "Document verification completed",
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};

export default {
	verifyDocument,
};

