export const APP = Object.freeze({
	NAME: "Property Registry API",
	API_PREFIX: "/api",
	DEFAULT_PORT: 5000,
	DEFAULT_TIMEZONE: "Asia/Kolkata",
});

export const AUTH = Object.freeze({
	JWT_EXPIRES_IN: "7d",
	SALT_ROUNDS: 10,
	TOKEN_HEADER: "authorization",
	BEARER_PREFIX: "Bearer ",
});

export const UPLOAD = Object.freeze({
	DIRECTORY: "uploads/documents",
	FIELD_NAME: "document",
	MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
	ALLOWED_MIME_TYPES: Object.freeze([
		"application/pdf",
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
	]),
});

export const VERIFICATION = Object.freeze({
	RISK_LEVELS: Object.freeze({
		LOW: "LOW",
		MEDIUM: "MEDIUM",
		HIGH: "HIGH",
	}),
	RISK_THRESHOLDS: Object.freeze({
		LOW_MIN: 80,
		MEDIUM_MIN: 50,
	}),
	DEFAULT_RISK_SCORE: 50,
	DEFAULT_SOURCE: "HEURISTIC",
	STATUSES: Object.freeze({
		PENDING: "PENDING",
		VERIFIED: "VERIFIED",
		FAILED: "FAILED",
	}),
});

export const PAGINATION = Object.freeze({
	DEFAULT_LIMIT: 20,
	MAX_LIMIT: 100,
});

export const HTTP_STATUS = Object.freeze({
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
});

export const ERROR_MESSAGES = Object.freeze({
	INTERNAL_ERROR: "Internal server error",
	NOT_FOUND: "Resource not found",
	VALIDATION_FAILED: "Validation failed",
	UNAUTHORIZED: "Unauthorized",
	FORBIDDEN: "Forbidden",
});

export default Object.freeze({
	APP,
	AUTH,
	UPLOAD,
	VERIFICATION,
	PAGINATION,
	HTTP_STATUS,
	ERROR_MESSAGES,
});

