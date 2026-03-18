import mongoose from "mongoose";
import Property from "../models/Property.model.js";
import Transaction from "../models/Transaction.model.js";

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
			khasraNumber: property.khasraNumber,
			surveyNumber: property.surveyNumber,
			plotNumber: property.plotNumber,
			location: property.location,
			area: property.area,
			currentOwner: property.owner,
		},
		totalTransfers: transactions.length,
		timeline,
	};
};
