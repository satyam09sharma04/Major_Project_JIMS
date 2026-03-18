import mongoose from "mongoose";
import Property from "../models/Property.model.js";
import Transaction from "../models/Transaction.model.js";
import User from "../models/User.model.js";

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

export const transferPropertyOwnership = async ({ propertyId, newOwnerId }) => {
	validateObjectId(propertyId, "propertyId");
	validateObjectId(newOwnerId, "newOwnerId");

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const property = await Property.findById(propertyId).session(session);

		if (!property) {
			const error = new Error("Property not found");
			error.statusCode = 404;
			throw error;
		}

		const newOwner = await User.findById(newOwnerId).session(session);
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

		const previousOwnerId = property.owner;
		property.owner = newOwnerId;
		await property.save({ session });

		const transaction = await Transaction.create(
			[
				{
					property: property._id,
					fromOwner: previousOwnerId,
					toOwner: newOwnerId,
					transferredAt: new Date(),
				},
			],
			{ session }
		);

		await session.commitTransaction();

		const updatedProperty = await Property.findById(property._id).populate("owner", "name email");

		return {
			property: updatedProperty,
			transaction: transaction[0],
		};
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};
