const toSafeString = (value) => {
	if (value == null) {
		return "";
	}

	return String(value);
};

const toNumber = (value) => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const formatDate = (value, locale = "en-IN", options = {}) => {
	if (!value) {
		return "-";
	}

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	const defaultOptions = {
		year: "numeric",
		month: "short",
		day: "2-digit",
	};

	return date.toLocaleDateString(locale, { ...defaultOptions, ...options });
};

export const formatDateTime = (value, locale = "en-IN", options = {}) => {
	if (!value) {
		return "-";
	}

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	const defaultOptions = {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	};

	return date.toLocaleString(locale, { ...defaultOptions, ...options });
};

export const formatCurrency = (value, currency = "INR", locale = "en-IN") => {
	const amount = toNumber(value);
	if (amount == null) {
		return "-";
	}

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(amount);
};

export const formatArea = (value, unit = "sq ft") => {
	const area = toNumber(value);
	if (area == null) {
		return "-";
	}

	return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(area)} ${unit}`;
};

export const formatAddress = (address, { prefix = 6, suffix = 4 } = {}) => {
	const value = toSafeString(address).trim();
	if (!value) {
		return "-";
	}

	if (value.length <= prefix + suffix + 3) {
		return value;
	}

	return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
};

export const formatFileSize = (bytes) => {
	const size = toNumber(bytes);
	if (size == null || size < 0) {
		return "-";
	}

	if (size === 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
	const scaled = size / 1024 ** i;

	return `${scaled.toFixed(scaled >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

export const normalizeRiskLevel = (riskLevel, riskScore) => {
	const level = toSafeString(riskLevel).trim().toUpperCase();
	if (level === "LOW" || level === "MEDIUM" || level === "HIGH") {
		return level;
	}

	const score = toNumber(riskScore);
	if (score == null) {
		return "UNKNOWN";
	}

	if (score >= 80) {
		return "LOW";
	}

	if (score >= 50) {
		return "MEDIUM";
	}

	return "HIGH";
};

export const formatRiskLabel = (riskLevel, riskScore) => {
	const normalized = normalizeRiskLevel(riskLevel, riskScore);
	if (normalized === "UNKNOWN") {
		return "Unknown Risk";
	}

	return `${normalized.charAt(0)}${normalized.slice(1).toLowerCase()} Risk`;
};

