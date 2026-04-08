import { transferPropertyOwnership } from "../services/transfer.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { HTTP_STATUS } from "../config/constants.js";

export const transferOwnership = async (req, res, next) => {
	try {
		const propertyId = req.body?.propertyId;
		const newOwnerId = req.body?.newOwnerId;
		const newOwnerWallet = req.body?.newOwnerWallet;
		const chainTxHash = req.body?.chainTxHash;

		if (!propertyId || !newOwnerId || !newOwnerWallet) {
			return sendError(res, {
				statusCode: HTTP_STATUS.BAD_REQUEST,
				message: "propertyId, newOwnerId and newOwnerWallet are required",
			});
		}

		const result = await transferPropertyOwnership({
			propertyId,
			newOwnerId,
			newOwnerWallet,
			chainTxHash,
			requestUser: req.user,
		});

		return sendSuccess(res, {
			message: "Property ownership transferred successfully",
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};
