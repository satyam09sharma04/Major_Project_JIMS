import {
	createProperty,
	getAllProperties,
	getOwnedProperties,
	getPropertyById,
	updateProperty,
} from "../services/property.service.js";
import { sendCreated, sendList, sendSuccess } from "../utils/response.util.js";

export const createPropertyHandler = async (req, res, next) => {
	try {
		const { owner: _ignoredOwner, ...safePayload } = req.body || {};
		const property = await createProperty(safePayload, req.user);
		return sendCreated(res, {
			message: "Property created successfully",
			data: property,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAllPropertiesHandler = async (req, res, next) => {
	try {
		const properties = await getOwnedProperties(req.user?._id);
		return sendList(res, {
			message: "Properties fetched successfully",
			data: properties,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAllPropertiesExploreHandler = async (_req, res, next) => {
	try {
		const properties = await getAllProperties();
		return sendList(res, {
			message: "Properties fetched successfully",
			data: properties,
		});
	} catch (error) {
		return next(error);
	}
};

export const getPropertyByIdHandler = async (req, res, next) => {
	try {
		const property = await getPropertyById(req.params.propertyId);
		return sendSuccess(res, {
			message: "Property fetched successfully",
			data: property,
		});
	} catch (error) {
		return next(error);
	}
};

export const updatePropertyHandler = async (req, res, next) => {
	try {
		const property = await updateProperty(req.params.propertyId, req.body);
		return sendSuccess(res, {
			message: "Property updated successfully",
			data: property,
		});
	} catch (error) {
		return next(error);
	}
};
