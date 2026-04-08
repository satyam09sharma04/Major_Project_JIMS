import mongoose from "mongoose";
import Property from "../models/Property.model.js";
import { registerPropertyOnChain } from "./blockchain.service.js";

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createProperty = async (payload, authenticatedUser) => {
	const {
		khasraNumber,
		surveyNumber,
		plotNumber,
		location,
		area,
		ownerWallet,
		chainPropertyId,
		chainTxHash,
	} = payload;
	const owner = authenticatedUser?._id;
	const normalizedChainPropertyId = String(chainPropertyId || "").trim();
	const normalizedChainTxHash = String(chainTxHash || "").trim();

	if (!khasraNumber || !surveyNumber || !plotNumber || !owner || !location || area == null) {
		const error = new Error("khasraNumber, surveyNumber, plotNumber, location and area are required");
		error.statusCode = 400;
		throw error;
	}

	if (!validateObjectId(owner)) {
		const error = new Error("Invalid owner ID");
		error.statusCode = 400;
		throw error;
	}

	const property = await Property.create({
		khasraNumber,
		surveyNumber,
		plotNumber,
		owner,
		location,
		area,
		ownerWallet: ownerWallet || "",
		chainPropertyId: normalizedChainPropertyId || null,
		chainTxHash: normalizedChainTxHash,
	});

	const fallbackChainPropertyId = Number.parseInt(property._id.toString().slice(-8), 16);
	const effectiveChainPropertyId = normalizedChainPropertyId || String(fallbackChainPropertyId);

	try {
		property.chainPropertyId = effectiveChainPropertyId;

		if (normalizedChainTxHash) {
			console.log(`[property.service] chainPropertyId=${effectiveChainPropertyId}, txHash=${normalizedChainTxHash}`);
			property.chainTxHash = normalizedChainTxHash;
			await property.save();
			return property;
		}

		const metadata = JSON.stringify({
			mongoPropertyId: property._id.toString(),
			khasraNumber,
			surveyNumber,
			plotNumber,
			location,
			area,
		});

		const onChain = await registerPropertyOnChain({
			chainPropertyId: Number(effectiveChainPropertyId),
			metadata,
			owner: ownerWallet,
			allowExisting: true,
		});

		property.chainTxHash = onChain?.txHash || "";
		console.log(`[property.service] fallback on-chain tx=${property.chainTxHash}, chainPropertyId=${effectiveChainPropertyId}`);
		await property.save();
	} catch (error) {
		await Property.findByIdAndDelete(property._id);
		const chainError = new Error(`Failed to sync property on-chain: ${error.message}`);
		chainError.statusCode = error.statusCode || 502;
		throw chainError;
	}

	return property;
};

export const getOwnedProperties = async (ownerId) => {
	if (!ownerId || !validateObjectId(ownerId)) {
		const error = new Error("Invalid owner ID");
		error.statusCode = 400;
		throw error;
	}

	const properties = await Property.find({ owner: ownerId }).sort({ createdAt: -1 }).populate("owner", "name email");
	return properties;
};

export const getAllProperties = async () => {
	const properties = await Property.find().sort({ createdAt: -1 }).populate("owner", "name email");
	return properties;
};

export const getPropertyById = async (propertyId) => {
	if (!propertyId || !validateObjectId(propertyId)) {
		const error = new Error("Invalid property ID");
		error.statusCode = 400;
		throw error;
	}

	const property = await Property.findById(propertyId).populate("owner", "name email");

	if (!property) {
		const error = new Error("Property not found");
		error.statusCode = 404;
		throw error;
	}

	return property;
};

export const updateProperty = async (propertyId, payload) => {
	if (!propertyId || !validateObjectId(propertyId)) {
		const error = new Error("Invalid property ID");
		error.statusCode = 400;
		throw error;
	}

	const allowedFields = ["khasraNumber", "surveyNumber", "plotNumber", "owner", "location", "area"];
	const updates = Object.fromEntries(Object.entries(payload ?? {}).filter(([key]) => allowedFields.includes(key)));

	if (Object.keys(updates).length === 0) {
		const error = new Error("No valid fields provided for update");
		error.statusCode = 400;
		throw error;
	}

	if (updates.owner && !validateObjectId(updates.owner)) {
		const error = new Error("Invalid owner ID");
		error.statusCode = 400;
		throw error;
	}

	const property = await Property.findByIdAndUpdate(propertyId, updates, {
		new: true,
		runValidators: true,
	}).populate("owner", "name email");

	if (!property) {
		const error = new Error("Property not found");
		error.statusCode = 404;
		throw error;
	}

	return property;
};
