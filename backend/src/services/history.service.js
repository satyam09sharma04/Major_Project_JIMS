import mongoose from "mongoose";
import Property from "../models/Property.model.js";
import Transaction from "../models/Transaction.model.js";
import { getHistoryFromChain } from "./blockchain.service.js";

const validatePropertyId = (propertyId) => {
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
};

export const getPropertyHistoryTimeline = async (propertyId) => {
	validatePropertyId(propertyId);

	const property = await Property.findById(propertyId).populate("owner", "name email");

	if (!property) {
		const error = new Error("Property not found");
		error.statusCode = 404;
		throw error;
	}

	const transactions = await Transaction.find({ property: propertyId })
		.sort({ transferredAt: 1, createdAt: 1 })
		.populate("fromOwner", "name email")
		.populate("toOwner", "name email");

	if (property.chainPropertyId) {
		try {
			const chainRecords = await getHistoryFromChain(property.chainPropertyId);
			const chainTimeline = chainRecords.map((record) => ({
				eventType: record.action,
				timestamp: record.timestamp ? new Date(record.timestamp * 1000) : property.createdAt,
				actor: record.actor,
				details: record.details,
				recordId: record.recordId,
			}));

			return {
				property: {
					id: property._id,
					chainPropertyId: property.chainPropertyId,
					khasraNumber: property.khasraNumber,
					surveyNumber: property.surveyNumber,
					plotNumber: property.plotNumber,
					location: property.location,
					area: property.area,
					currentOwner: property.owner,
				},
				totalTransfers: chainTimeline.length,
				timeline: chainTimeline,
				source: "blockchain",
			};
		} catch {
			// fallback to DB timeline below
		}
	}

	const timeline = [
		{
			eventType: "PROPERTY_CREATED",
			timestamp: property.createdAt,
			owner: property.owner,
			details: "Property record created",
		},
		...transactions.map((item) => ({
			eventType: "OWNERSHIP_TRANSFER",
			timestamp: item.transferredAt,
			fromOwner: item.fromOwner,
			toOwner: item.toOwner,
			transactionId: item._id,
		})),
	];

	return {
		property: {
			id: property._id,
			chainPropertyId: property.chainPropertyId || null,
			khasraNumber: property.khasraNumber,
			surveyNumber: property.surveyNumber,
			plotNumber: property.plotNumber,
			location: property.location,
			area: property.area,
			currentOwner: property.owner,
		},
		totalTransfers: transactions.length,
		timeline,
		source: "database",
	};
};
