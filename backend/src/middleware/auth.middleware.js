import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { AUTH, ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";
import env from "../config/env.js";

const buildAuthError = (message = ERROR_MESSAGES.UNAUTHORIZED) => {
	const error = new Error(message);
	error.statusCode = HTTP_STATUS.UNAUTHORIZED;
	return error;
};

const getTokenFromHeader = (req) => {
	const headerValue = req.get("Authorization") || req.headers?.[AUTH.TOKEN_HEADER] || "";

	if (!headerValue) {
		return "";
	}

	if (!headerValue.startsWith(AUTH.BEARER_PREFIX)) {
		return "";
	}

	return headerValue.slice(AUTH.BEARER_PREFIX.length).trim();
};

const decodeAuthToken = (token) => {
	if (!env.JWT_SECRET) {
		const error = new Error("JWT_SECRET is missing in environment variables");
		error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
		throw error;
	}

	return jwt.verify(token, env.JWT_SECRET);
};

const hydrateRequestUser = async (req, token) => {
	const payload = decodeAuthToken(token);
	const userId = payload?.userId;

	if (!userId) {
		throw buildAuthError("Invalid token payload");
	}

	const user = await User.findById(userId);
	if (!user) {
		throw buildAuthError("User not found for token");
	}

	req.user = user;
	req.auth = {
		token,
		payload,
	};
};

export const requireAuth = async (req, _res, next) => {
	try {
		const token = getTokenFromHeader(req);
		if (!token) {
			return next(buildAuthError("Authorization token is required"));
		}

		await hydrateRequestUser(req, token);
		return next();
	} catch (error) {
		if (error?.name === "TokenExpiredError") {
			return next(buildAuthError("Token has expired"));
		}

		if (error?.name === "JsonWebTokenError") {
			return next(buildAuthError("Invalid authorization token"));
		}

		return next(error);
	}
};

export const optionalAuth = async (req, _res, next) => {
	try {
		const token = getTokenFromHeader(req);
		if (!token) {
			return next();
		}

		await hydrateRequestUser(req, token);
		return next();
	} catch {
		return next();
	}
};

export default requireAuth;

