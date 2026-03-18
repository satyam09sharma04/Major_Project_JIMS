import mongoose from "mongoose";
import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";

const buildValidationError = (message, details) => {
	const error = new Error(message || ERROR_MESSAGES.VALIDATION_FAILED);
	error.statusCode = HTTP_STATUS.BAD_REQUEST;

	if (details) {
		error.details = details;
	}

	return error;
};

const isObject = (value) => value != null && typeof value === "object" && !Array.isArray(value);

const normalizeFieldValue = (value) => {
	if (value == null) {
		return "";
	}

	if (typeof value === "string") {
		return value.trim();
	}

	return value;
};

export const validateRequiredFields = (fields = [], source = "body") => {
	return (req, _res, next) => {
		try {
			const payload = req[source];
			if (!isObject(payload)) {
				throw buildValidationError(`Request ${source} must be an object`);
			}

			const missing = fields.filter((field) => {
				const value = normalizeFieldValue(payload[field]);
				return value === "";
			});

			if (missing.length > 0) {
				throw buildValidationError(
					`Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
					{ missingFields: missing }
				);
			}

			return next();
		} catch (error) {
			return next(error);
		}
	};
};

export const validateObjectIdParam = (paramName = "id") => {
	return (req, _res, next) => {
		try {
			const value = req.params?.[paramName];
			if (!value || !mongoose.Types.ObjectId.isValid(value)) {
				throw buildValidationError(`Invalid ${paramName}`);
			}

			return next();
		} catch (error) {
			return next(error);
		}
	};
};

export const validateObjectIdField = (fieldName, source = "body") => {
	return (req, _res, next) => {
		try {
			const container = req[source] || {};
			const value = container?.[fieldName];

			if (!value || !mongoose.Types.ObjectId.isValid(value)) {
				throw buildValidationError(`Invalid ${fieldName}`);
			}

			return next();
		} catch (error) {
			return next(error);
		}
	};
};

export const validateWith = (validator, source = "body") => {
	return (req, _res, next) => {
		try {
			const payload = req[source];
			const result = validator(payload, req);

			if (result === true || result == null) {
				return next();
			}

			if (typeof result === "string") {
				throw buildValidationError(result);
			}

			if (Array.isArray(result)) {
				throw buildValidationError(ERROR_MESSAGES.VALIDATION_FAILED, { errors: result });
			}

			if (isObject(result)) {
				throw buildValidationError(result.message || ERROR_MESSAGES.VALIDATION_FAILED, result);
			}

			return next();
		} catch (error) {
			return next(error);
		}
	};
};

export const parsePagination = (req, _res, next) => {
	try {
		const page = Math.max(1, Number.parseInt(req.query?.page ?? "1", 10) || 1);
		const limit = Math.max(1, Number.parseInt(req.query?.limit ?? "20", 10) || 20);

		req.pagination = {
			page,
			limit,
			skip: (page - 1) * limit,
		};

		return next();
	} catch (error) {
		return next(buildValidationError("Invalid pagination query parameters", { cause: error.message }));
	}
};

export default {
	validateRequiredFields,
	validateObjectIdParam,
	validateObjectIdField,
	validateWith,
	parsePagination,
};

