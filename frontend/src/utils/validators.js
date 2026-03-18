const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
	"application/pdf",
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
]);

export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

const toSafeString = (value) => (value == null ? "" : String(value));

const normalize = (value) => toSafeString(value).trim();

export const isRequired = (value) => normalize(value).length > 0;

export const isValidEmail = (value) => {
	const input = normalize(value);
	if (!input) {
		return false;
	}

	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
};

export const isStrongPassword = (value, minLength = 6) => {
	return toSafeString(value).length >= minLength;
};

export const isPositiveNumber = (value) => {
	const num = Number(value);
	return Number.isFinite(num) && num > 0;
};

export const isValidObjectId = (value) => {
	return /^[a-f\d]{24}$/i.test(normalize(value));
};

export const isValidEthereumAddress = (value) => {
	return /^0x[a-fA-F0-9]{40}$/.test(normalize(value));
};

export const validateLoginForm = (payload = {}) => {
	const errors = {};

	if (!isRequired(payload.email)) {
		errors.email = "Email is required.";
	} else if (!isValidEmail(payload.email)) {
		errors.email = "Please enter a valid email address.";
	}

	if (!isRequired(payload.password)) {
		errors.password = "Password is required.";
	}

	return errors;
};

export const validateRegisterForm = (payload = {}) => {
	const errors = {};

	if (!isRequired(payload.name)) {
		errors.name = "Name is required.";
	}

	if (!isRequired(payload.email)) {
		errors.email = "Email is required.";
	} else if (!isValidEmail(payload.email)) {
		errors.email = "Please enter a valid email address.";
	}

	if (!isRequired(payload.password)) {
		errors.password = "Password is required.";
	} else if (!isStrongPassword(payload.password, 6)) {
		errors.password = "Password must be at least 6 characters.";
	}

	if (payload.confirmPassword != null && payload.password !== payload.confirmPassword) {
		errors.confirmPassword = "Passwords do not match.";
	}

	return errors;
};

export const validatePropertyForm = (payload = {}) => {
	const errors = {};

	if (!isRequired(payload.khasraNumber)) {
		errors.khasraNumber = "Khasra number is required.";
	}

	if (!isRequired(payload.surveyNumber)) {
		errors.surveyNumber = "Survey number is required.";
	}

	if (!isRequired(payload.plotNumber)) {
		errors.plotNumber = "Plot number is required.";
	}

	if (!isRequired(payload.owner)) {
		errors.owner = "Owner ID is required.";
	} else if (!isValidObjectId(payload.owner)) {
		errors.owner = "Owner ID must be a valid 24-character ID.";
	}

	if (!isRequired(payload.location)) {
		errors.location = "Location is required.";
	}

	if (!isRequired(payload.area)) {
		errors.area = "Area is required.";
	} else if (!isPositiveNumber(payload.area)) {
		errors.area = "Area must be greater than 0.";
	}

	return errors;
};

export const validateTransferForm = (payload = {}) => {
	const errors = {};

	if (!isRequired(payload.propertyId)) {
		errors.propertyId = "Property ID is required.";
	} else if (!isValidObjectId(payload.propertyId)) {
		errors.propertyId = "Property ID must be a valid 24-character ID.";
	}

	if (!isRequired(payload.newOwnerId)) {
		errors.newOwnerId = "New owner ID is required.";
	} else if (!isValidObjectId(payload.newOwnerId)) {
		errors.newOwnerId = "New owner ID must be a valid 24-character ID.";
	}

	return errors;
};

export const validateDocumentFile = (file) => {
	if (!file) {
		return "Please select a file.";
	}

	if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
		return "Only PDF and image files are allowed (pdf, jpg, jpeg, png, webp).";
	}

	if (file.size > MAX_DOCUMENT_FILE_SIZE) {
		return "File size must be 10MB or less.";
	}

	return "";
};

export const hasErrors = (errors) => {
	if (!errors || typeof errors !== "object") {
		return false;
	}

	return Object.keys(errors).length > 0;
};

export const firstError = (errors) => {
	if (!hasErrors(errors)) {
		return "";
	}

	const firstKey = Object.keys(errors)[0];
	return errors[firstKey] || "";
};

export const documentValidationConfig = {
	allowedMimeTypes: ALLOWED_DOCUMENT_MIME_TYPES,
	maxFileSize: MAX_DOCUMENT_FILE_SIZE,
};

