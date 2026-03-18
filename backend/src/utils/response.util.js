import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";

const toObject = (value) => {
	if (value == null || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return value;
};

const normalizeList = (data) => {
	if (Array.isArray(data)) {
		return data;
	}

	if (data == null) {
		return [];
	}

	return [data];
};

export const sendSuccess = (res, {
	statusCode = HTTP_STATUS.OK,
	message = "Request successful",
	data = null,
	meta,
} = {}) => {
	const body = {
		message,
		data,
	};

	if (meta && typeof meta === "object") {
		body.meta = meta;
	}

	return res.status(statusCode).json(body);
};

export const sendCreated = (res, {
	message = "Created successfully",
	data = null,
	meta,
} = {}) => {
	return sendSuccess(res, {
		statusCode: HTTP_STATUS.CREATED,
		message,
		data,
		meta,
	});
};

export const sendList = (res, {
	statusCode = HTTP_STATUS.OK,
	message = "Data fetched successfully",
	data = [],
	meta,
} = {}) => {
	const list = normalizeList(data);

	const body = {
		message,
		count: list.length,
		data: list,
	};

	if (meta && typeof meta === "object") {
		body.meta = meta;
	}

	return res.status(statusCode).json(body);
};

export const sendPaginated = (res, {
	message = "Data fetched successfully",
	data = [],
	page = 1,
	limit = 20,
	total = 0,
	extraMeta,
} = {}) => {
	const list = normalizeList(data);
	const safeLimit = Math.max(1, Number(limit) || 1);
	const safePage = Math.max(1, Number(page) || 1);
	const safeTotal = Math.max(0, Number(total) || 0);
	const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));

	return res.status(HTTP_STATUS.OK).json({
		message,
		count: list.length,
		data: list,
		meta: {
			page: safePage,
			limit: safeLimit,
			total: safeTotal,
			totalPages,
			...toObject(extraMeta),
		},
	});
};

export const sendError = (res, {
	statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
	message = ERROR_MESSAGES.INTERNAL_ERROR,
	errors,
	meta,
} = {}) => {
	const body = {
		message,
	};

	if (errors !== undefined) {
		body.errors = errors;
	}

	if (meta && typeof meta === "object") {
		body.meta = meta;
	}

	return res.status(statusCode).json(body);
};

export const createdResponse = sendCreated;
export const successResponse = sendSuccess;
export const listResponse = sendList;
export const paginatedResponse = sendPaginated;
export const errorResponse = sendError;

export default {
	sendSuccess,
	sendCreated,
	sendList,
	sendPaginated,
	sendError,
	createdResponse,
	successResponse,
	listResponse,
	paginatedResponse,
	errorResponse,
};

