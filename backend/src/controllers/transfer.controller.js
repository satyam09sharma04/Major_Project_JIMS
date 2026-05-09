import { transferPropertyOwnership } from "../services/transfer.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { HTTP_STATUS } from "../config/constants.js";
import { isAddress } from "ethers";

export const transferOwnership = async (req, res, next) => {
	try {
		const propertyId = req.body?.propertyId;
		const newOwnerId = req.body?.newOwnerId;
		const newOwnerWallet = typeof req.body?.newOwnerWallet === "string" ? req.body.newOwnerWallet.trim() : "";
		const chainTxHash = req.body?.chainTxHash;

		if (!propertyId || !newOwnerId || !newOwnerWallet) {
			return sendError(res, {
				statusCode: HTTP_STATUS.BAD_REQUEST,
				message: "propertyId, newOwnerId and newOwnerWallet are required",
			});
		}

		if (!isAddress(newOwnerWallet)) {
			return sendError(res, {
				statusCode: HTTP_STATUS.BAD_REQUEST,
				message: "newOwnerWallet must be a valid Ethereum address",
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
