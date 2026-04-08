import mongoose from "mongoose";
import Property from "../models/Property.model.js";
import Transaction from "../models/Transaction.model.js";
import User from "../models/User.model.js";
import { getChainTransactionByHash } from "./blockchain.service.js";

const validateObjectId = (id, label) => {
	if (!id) {
		const error = new Error(`${label} is required`);
		error.statusCode = 400;
		throw error;
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const error = new Error(`Invalid ${label}`);
		error.statusCode = 400;
		throw error;
	}
};

export const transferPropertyOwnership = async ({
	propertyId,
	newOwnerId,
	newOwnerWallet,
	chainTxHash,
	requestUser,
}) => {
	validateObjectId(propertyId, "propertyId");
	validateObjectId(newOwnerId, "newOwnerId");
	validateObjectId(requestUser?._id, "requestUser._id");

	const session = await mongoose.startSession();

	try {
		const property = await Property.findById(propertyId);

		if (!property) {
			const error = new Error("Property not found");
			error.statusCode = 404;
			throw error;
		}

		if (property.owner.toString() !== requestUser._id.toString()) {
			const error = new Error("You are not authorized to transfer this property");
			error.statusCode = 403;
			throw error;
		}

		const newOwner = await User.findById(newOwnerId);
		if (!newOwner) {
			const error = new Error("New owner not found");
			error.statusCode = 404;
			throw error;
		}

		if (property.owner.toString() === newOwnerId.toString()) {
			const error = new Error("Property is already owned by this user");
			error.statusCode = 400;
			throw error;
		}

		const chainPropertyId = String(property.chainPropertyId || "").trim();
		if (!chainPropertyId) {
			const error = new Error("Property does not have chainPropertyId. Register on-chain first.");
			error.statusCode = 400;
			throw error;
		}

		let onChain = null;
		let verifiedTxSender = "";
		if (chainTxHash) {
			if (!property.ownerWallet) {
				const error = new Error("Current property owner wallet is missing");
				error.statusCode = 400;
				throw error;
			}

			const chainTx = await getChainTransactionByHash(chainTxHash);
			verifiedTxSender = String(chainTx.from || "").trim().toLowerCase();
			const currentOwnerWallet = String(property.ownerWallet || "").trim().toLowerCase();
			if (!verifiedTxSender || verifiedTxSender !== currentOwnerWallet) {
				const error = new Error("You are not authorized to transfer this property");
				error.statusCode = 403;
				throw error;
			}

			onChain = {
				txHash: chainTxHash,
				skipped: true,
				reason: "Frontend already executed blockchain transfer",
				from: verifiedTxSender,
			};
		} else {
			const error = new Error("chainTxHash is required to validate owner wallet authorization");
			error.statusCode = 400;
			throw error;
		}

		session.startTransaction();

		const previousOwnerId = property.owner;
		const propertyInTxn = await Property.findById(propertyId).session(session);
		if (!propertyInTxn) {
			const error = new Error("Property not found during sync");
			error.statusCode = 404;
			throw error;
		}

		propertyInTxn.owner = newOwnerId;
		if (newOwnerWallet) {
			propertyInTxn.ownerWallet = newOwnerWallet;
		}
		await propertyInTxn.save({ session });

		const finalTxHash = onChain?.txHash || chainTxHash || "";

		const transaction = await Transaction.create(
			[
				{
					property: propertyInTxn._id,
					fromOwner: previousOwnerId,
					toOwner: newOwnerId,
					transferredAt: new Date(),
					chainTxHash: finalTxHash,
				},
			],
			{ session }
		);

		console.log(`[transfer.service] chainPropertyId=${chainPropertyId}, txHash=${finalTxHash}`);

		await session.commitTransaction();

		const updatedProperty = await Property.findById(propertyInTxn._id).populate("owner", "name email");

		return {
			property: updatedProperty,
			transaction: transaction[0],
			onChain,
		};
	} catch (error) {
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		throw error;
	} finally {
		session.endSession();
	}
};
