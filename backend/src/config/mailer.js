import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

const parseBoolean = (value, fallback = false) => {
	if (value == null || value === "") {
		return fallback;
	}

	const normalized = String(value).trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;

	return fallback;
};

const parseNumber = (value, fallback) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return parsed;
};

export const mailerConfig = Object.freeze({
	provider: String(process.env.EMAIL_PROVIDER || "gmail").trim().toLowerCase(),
	emailUser: String(process.env.EMAIL_USER || "").trim(),
	emailPass: String(process.env.EMAIL_PASS || "").trim(),
	adminEmail: String(process.env.ADMIN_EMAIL || "").trim(),
	emailFrom: String(process.env.EMAIL_FROM || "").trim(),
	smtpHost: String(process.env.EMAIL_HOST || "").trim(),
	smtpPort: parseNumber(process.env.EMAIL_PORT, 587),
	smtpSecure: parseBoolean(process.env.EMAIL_SECURE, false),
});

const buildTransportOptions = () => {
	const commonAuth = {
		auth: {
			user: mailerConfig.emailUser,
			pass: mailerConfig.emailPass,
		},
	};

	if (mailerConfig.provider === "smtp") {
		return {
			host: mailerConfig.smtpHost,
			port: mailerConfig.smtpPort,
			secure: mailerConfig.smtpSecure || mailerConfig.smtpPort === 465,
			...commonAuth,
		};
	}

	return {
		service: "gmail",
		...commonAuth,
	};
};

export const isMailerConfigured = () => {
	if (!mailerConfig.emailUser || !mailerConfig.emailPass) {
		logger.warn("Mailer disabled: EMAIL_USER or EMAIL_PASS is missing", {
			emailUserConfigured: Boolean(mailerConfig.emailUser),
			emailPassConfigured: Boolean(mailerConfig.emailPass),
			hint: "Use a Gmail App Password for EMAIL_PASS (not your normal Gmail password).",
		});
		return false;
	}

	if (mailerConfig.provider === "smtp" && !mailerConfig.smtpHost) {
		logger.warn("Mailer disabled: SMTP provider selected but EMAIL_HOST is missing");
		return false;
	}

	return true;
};

export const transporter = nodemailer.createTransport(buildTransportOptions());

let verifyPromise;

export const verifyMailerTransporter = async () => {
	if (!isMailerConfigured()) {
		return false;
	}

	if (verifyPromise) {
		return verifyPromise;
	}

	verifyPromise = transporter
		.verify()
		.then(() => {
			logger.info("Nodemailer transporter verified successfully", {
				provider: mailerConfig.provider,
				hasAdminEmail: Boolean(mailerConfig.adminEmail),
			});
			return true;
		})
		.catch((error) => {
			logger.error("Nodemailer transporter verification failed", {
				error,
				provider: mailerConfig.provider,
				hint: "Check EMAIL_USER and EMAIL_PASS. For Gmail, EMAIL_PASS must be an App Password.",
			});
			verifyPromise = undefined;
			return false;
		});

	return verifyPromise;
};
