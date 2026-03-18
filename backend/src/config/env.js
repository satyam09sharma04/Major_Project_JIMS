import dotenv from "dotenv";

dotenv.config();

const toString = (value, fallback = "") => {
	if (value == null) {
		return fallback;
	}

	return String(value).trim();
};

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return parsed;
};

const toBoolean = (value, fallback = false) => {
	if (value == null || value === "") {
		return fallback;
	}

	const normalized = String(value).toLowerCase().trim();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;

	return fallback;
};

const requireEnv = (key, value) => {
	if (!value) {
		throw new Error(`${key} is missing in environment variables`);
	}

	return value;
};

export const env = Object.freeze({
	NODE_ENV: toString(process.env.NODE_ENV, "development"),
	PORT: toNumber(process.env.PORT, 5000),

	DB_URI: toString(process.env.DB_URI, ""),

	JWT_SECRET: toString(process.env.JWT_SECRET, ""),
	JWT_EXPIRES_IN: toString(process.env.JWT_EXPIRES_IN, "7d"),

	AI_API_KEY: toString(process.env.AI_API_KEY, ""),
	AI_MODEL: toString(process.env.AI_MODEL, "gemini-1.5-flash"),

	CORS_ORIGIN: toString(process.env.CORS_ORIGIN, "*"),
	ENABLE_REQUEST_LOGS: toBoolean(process.env.ENABLE_REQUEST_LOGS, true),
});

export const isProduction = env.NODE_ENV === "production";

export const getRequiredEnv = (key) => {
	const value = toString(process.env[key], "");
	return requireEnv(key, value);
};

export const assertCriticalEnv = () => {
	requireEnv("DB_URI", env.DB_URI);
	requireEnv("JWT_SECRET", env.JWT_SECRET);
};

export default env;

