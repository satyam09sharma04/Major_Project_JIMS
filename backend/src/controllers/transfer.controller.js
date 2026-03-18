import { transferPropertyOwnership } from "../services/transfer.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { HTTP_STATUS } from "../config/constants.js";

export const transferOwnership = async (req, res, next) => {
	try {
		const propertyId = req.body?.propertyId;
		const newOwnerId = req.body?.newOwnerId;

		if (!propertyId || !newOwnerId) {
			return sendError(res, {
				statusCode: HTTP_STATUS.BAD_REQUEST,
				message: "propertyId and newOwnerId are required",
			});
		}

		const result = await transferPropertyOwnership({ propertyId, newOwnerId });

		return sendSuccess(res, {
			message: "Property ownership transferred successfully",
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};
