import fs from "node:fs/promises";
import path from "node:path";
import { Blob } from "node:buffer";

const DEFAULT_PINATA_BASE_URL = "https://api.pinata.cloud";
const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";

const toString = (value, fallback = "") => String(value ?? fallback).trim();

const normalizeFileName = (name = "file") => {
	const raw = toString(name, "file");
	return raw.replace(/[^a-zA-Z0-9._-]+/g, "_");
};

const readConfig = () => {
	const pinataApiKey = toString(process.env.PINATA_API_KEY);
	const pinataSecretApiKey = toString(process.env.PINATA_SECRET_API_KEY);
	const pinataJwt = toString(process.env.PINATA_JWT);

	const pinataBaseUrl = toString(process.env.PINATA_BASE_URL, DEFAULT_PINATA_BASE_URL);
	const ipfsGateway = toString(process.env.IPFS_GATEWAY, DEFAULT_IPFS_GATEWAY).replace(/\/+$/, "");
	const mockMode = ["1", "true", "yes", "on"].includes(toString(process.env.IPFS_MOCK_MODE).toLowerCase());

	const hasJwt = Boolean(pinataJwt);
	const hasKeys = Boolean(pinataApiKey && pinataSecretApiKey);

	return {
		pinataApiKey,
		pinataSecretApiKey,
		pinataJwt,
		pinataBaseUrl,
		ipfsGateway,
		mockMode,
		enabled: hasJwt || hasKeys,
	};
};

const createAuthHeaders = (config) => {
	if (config.pinataJwt) {
		return {
			Authorization: `Bearer ${config.pinataJwt}`,
		};
	}

	if (config.pinataApiKey && config.pinataSecretApiKey) {
		return {
			pinata_api_key: config.pinataApiKey,
			pinata_secret_api_key: config.pinataSecretApiKey,
		};
	}

	return {};
};

const normalizeIpfsResponse = (payload, config) => {
	const cid = payload?.IpfsHash || payload?.cid || payload?.Hash || "";

	if (!cid) {
		const error = new Error("IPFS upload succeeded but CID was not returned");
		error.statusCode = 502;
		throw error;
	}

	const sizeValue = payload?.PinSize;
	const size = Number.isFinite(Number(sizeValue)) ? Number(sizeValue) : null;

	return {
		cid,
		size,
		timestamp: payload?.Timestamp || new Date().toISOString(),
		provider: "pinata",
		url: `${config.ipfsGateway}/${cid}`,
		raw: payload,
	};
};

const mockUploadResponse = (name, config) => {
	const seed = `${name}-${Date.now()}`;
	const hex = Buffer.from(seed).toString("hex").slice(0, 46).padEnd(46, "0");
	const cid = `bafy${hex}`;

	return {
		cid,
		size: null,
		timestamp: new Date().toISOString(),
		provider: "mock",
		url: `${config.ipfsGateway}/${cid}`,
		raw: {
			IpfsHash: cid,
			PinSize: null,
			Timestamp: new Date().toISOString(),
		},
	};
};

const pinataRequest = async ({ endpoint, body, isJson = false }) => {
	const config = readConfig();

	if (!config.enabled) {
		if (config.mockMode) {
			return mockUploadResponse("mock", config);
		}

		const error = new Error(
			"IPFS is not configured. Set PINATA_JWT or PINATA_API_KEY + PINATA_SECRET_API_KEY."
		);
		error.statusCode = 503;
		throw error;
	}

	const headers = {
		...createAuthHeaders(config),
	};

	if (isJson) {
		headers["Content-Type"] = "application/json";
	}

	const response = await fetch(`${config.pinataBaseUrl}${endpoint}`, {
		method: "POST",
		headers,
		body,
	});

	let payload = null;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}

	if (!response.ok) {
		const error = new Error(payload?.error?.reason || payload?.error || "IPFS upload failed");
		error.statusCode = response.status || 502;
		error.details = payload;
		throw error;
	}

	return normalizeIpfsResponse(payload, config);
};

export const isIpfsConfigured = () => {
	return readConfig().enabled;
};

export const getIpfsGatewayUrl = (cid) => {
	if (!cid) {
		return "";
	}

	const config = readConfig();
	return `${config.ipfsGateway}/${cid}`;
};

export const uploadBufferToIpfs = async ({ buffer, fileName = "file", contentType = "application/octet-stream" }) => {
	if (!buffer) {
		const error = new Error("buffer is required");
		error.statusCode = 400;
		throw error;
	}

	const config = readConfig();
	if (!config.enabled && config.mockMode) {
		return mockUploadResponse(fileName, config);
	}

	const safeFileName = normalizeFileName(fileName);
	const fileBlob = new Blob([buffer], { type: contentType || "application/octet-stream" });
	const form = new FormData();
	form.append("file", fileBlob, safeFileName);

	return pinataRequest({
		endpoint: "/pinning/pinFileToIPFS",
		body: form,
	});
};

export const uploadFilePathToIpfs = async ({ filePath, fileName, contentType }) => {
	if (!filePath) {
		const error = new Error("filePath is required");
		error.statusCode = 400;
		throw error;
	}

	const resolvedPath = path.resolve(filePath);
	const fileBuffer = await fs.readFile(resolvedPath);

	return uploadBufferToIpfs({
		buffer: fileBuffer,
		fileName: fileName || path.basename(resolvedPath),
		contentType,
	});
};

export const pinJsonToIpfs = async ({ data, name = "metadata.json" }) => {
	if (data == null) {
		const error = new Error("data is required");
		error.statusCode = 400;
		throw error;
	}

	const config = readConfig();
	if (!config.enabled && config.mockMode) {
		return mockUploadResponse(name, config);
	}

	const payload = {
		pinataContent: data,
		pinataMetadata: {
			name: normalizeFileName(name),
		},
	};

	return pinataRequest({
		endpoint: "/pinning/pinJSONToIPFS",
		body: JSON.stringify(payload),
		isJson: true,
	});
};

export default {
	isIpfsConfigured,
	getIpfsGatewayUrl,
	uploadBufferToIpfs,
	uploadFilePathToIpfs,
	pinJsonToIpfs,
};

