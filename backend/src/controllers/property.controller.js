import {
	createProperty,
	getAllProperties,
	getPropertyById,
	updateProperty,
} from "../services/property.service.js";
import { sendCreated, sendList, sendSuccess } from "../utils/response.util.js";

export const createPropertyHandler = async (req, res, next) => {
	try {
		const property = await createProperty(req.body);
		return sendCreated(res, {
			message: "Property created successfully",
			data: property,
		});
	} catch (error) {
		return next(error);
	}
};

export const getAllPropertiesHandler = async (_req, res, next) => {
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
