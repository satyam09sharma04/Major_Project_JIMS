import env from "../config/env.js";

const LEVELS = Object.freeze({
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3,
});

const normalizeLevel = (value) => {
	const normalized = String(value || "INFO").trim().toUpperCase();
	if (normalized in LEVELS) {
		return normalized;
	}

	return "INFO";
};

const ACTIVE_LEVEL = normalizeLevel(process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "INFO" : "DEBUG"));

const safeSerialize = (value) => {
	if (value == null) {
		return value;
	}

	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
			statusCode: value.statusCode,
			details: value.details,
		};
	}

	if (typeof value === "bigint") {
		return value.toString();
	}

	if (Array.isArray(value)) {
		return value.map((item) => safeSerialize(item));
	}

	if (typeof value === "object") {
		const output = {};
		for (const [key, item] of Object.entries(value)) {
			output[key] = safeSerialize(item);
		}
		return output;
	}

	return value;
};

const shouldLog = (level) => {
	return LEVELS[level] <= LEVELS[ACTIVE_LEVEL];
};

const writeLog = (level, message, meta) => {
	if (!shouldLog(level)) {
		return;
	}

	const payload = {
		timestamp: new Date().toISOString(),
		level,
		message,
		meta: safeSerialize(meta),
	};

	const line = JSON.stringify(payload);

	if (level === "ERROR" || level === "WARN") {
		console.error(line);
		return;
	}

	console.log(line);
};

export const logger = {
	error(message, meta = {}) {
		writeLog("ERROR", message, meta);
	},
	warn(message, meta = {}) {
		writeLog("WARN", message, meta);
	},
	info(message, meta = {}) {
		writeLog("INFO", message, meta);
	},
	debug(message, meta = {}) {
		writeLog("DEBUG", message, meta);
	},
	child(baseMeta = {}) {
		return {
			error(message, meta = {}) {
				logger.error(message, { ...baseMeta, ...meta });
			},
			warn(message, meta = {}) {
				logger.warn(message, { ...baseMeta, ...meta });
			},
			info(message, meta = {}) {
				logger.info(message, { ...baseMeta, ...meta });
			},
			debug(message, meta = {}) {
				logger.debug(message, { ...baseMeta, ...meta });
			},
		};
	},
};

export const requestLogger = (req, res, next) => {
	if (!env.ENABLE_REQUEST_LOGS) {
		return next();
	}

	const startedAt = Date.now();

	res.on("finish", () => {
		const durationMs = Date.now() - startedAt;
		logger.info("HTTP request completed", {
			method: req.method,
			path: req.originalUrl,
			statusCode: res.statusCode,
			durationMs,
			ip: req.ip,
			userAgent: req.get("user-agent") || "",
			requestId: req.headers["x-request-id"] || "",
			userId: req.user?._id?.toString?.() || "",
		});
	});

	return next();
};

export default logger;

