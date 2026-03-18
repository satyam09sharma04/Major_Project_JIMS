import mongoose from "mongoose";
import Property from "../models/Property.model.js";

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createProperty = async (payload) => {
	const { khasraNumber, surveyNumber, plotNumber, owner, location, area } = payload;

	if (!khasraNumber || !surveyNumber || !plotNumber || !owner || !location || area == null) {
		const error = new Error("khasraNumber, surveyNumber, plotNumber, owner, location and area are required");
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
	});

	return property;
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
