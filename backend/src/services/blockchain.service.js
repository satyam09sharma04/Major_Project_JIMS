const DEFAULT_CONFIRMATIONS = 1;

const REGISTRY_ABI = [
	"function registerProperty(string khasraNumber,string surveyNumber,string plotNumber,string location,uint256 area,address owner) returns (uint256)",
	"function transferOwnership(uint256 propertyId,address newOwner)",
	"function getProperty(uint256 propertyId) view returns (tuple(uint256 propertyId,string khasraNumber,string surveyNumber,string plotNumber,string location,uint256 area,address currentOwner,uint256 registeredAt,uint256 updatedAt,bool exists))",
	"function ownerOf(uint256 propertyId) view returns (address)",
	"event PropertyRegistered(uint256 indexed propertyId,address indexed owner,string khasraNumber,string surveyNumber,string plotNumber)",
];

const TRANSFER_ABI = [
	"function requestTransfer(uint256 propertyId,address toOwner) returns (uint256)",
	"function approveTransfer(uint256 requestId)",
	"function executeTransfer(uint256 requestId)",
	"function cancelTransfer(uint256 requestId)",
	"function transferRequests(uint256 requestId) view returns (uint256 requestIdOut,uint256 propertyId,address fromOwner,address toOwner,bool approved,bool executed,uint256 createdAt)",
	"event TransferRequested(uint256 indexed requestId,uint256 indexed propertyId,address indexed fromOwner,address toOwner)",
];

const HISTORY_ABI = [
	"function recordAction(uint256 propertyId,address actor,string action,string details) returns (uint256)",
	"function getHistoryCount(uint256 propertyId) view returns (uint256)",
	"function getFullHistory(uint256 propertyId) view returns ((uint256 recordId,uint256 propertyId,address actor,string action,string details,uint256 timestamp)[])",
	"function getHistoryByRange(uint256 propertyId,uint256 offset,uint256 limit) view returns ((uint256 recordId,uint256 propertyId,address actor,string action,string details,uint256 timestamp)[])",
];

const toError = (message, statusCode = 500, details) => {
	const error = new Error(message);
	error.statusCode = statusCode;
	if (details) {
		error.details = details;
	}
	return error;
};

const normalizeAddress = (value) => String(value ?? "").trim();

const normalizePrivateKey = (privateKeyRaw) => {
	const key = String(privateKeyRaw ?? "").trim();
	if (!key) {
		return "";
	}

	return key.startsWith("0x") ? key : `0x${key}`;
};

const normalizeBigintRecord = (record) => ({
	recordId: Number(record.recordId),
	propertyId: Number(record.propertyId),
	actor: record.actor,
	action: record.action,
	details: record.details,
	timestamp: Number(record.timestamp),
});

export const getBlockchainConfig = () => {
	const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.LOCAL_RPC_URL || "";
	const privateKey = normalizePrivateKey(process.env.BLOCKCHAIN_PRIVATE_KEY || process.env.PRIVATE_KEY || "");

	const registryAddress = normalizeAddress(
		process.env.PROPERTY_REGISTRY_ADDRESS || process.env.BLOCKCHAIN_REGISTRY_ADDRESS
	);
	const transferAddress = normalizeAddress(
		process.env.OWNERSHIP_TRANSFER_ADDRESS || process.env.BLOCKCHAIN_TRANSFER_ADDRESS
	);
	const historyAddress = normalizeAddress(
		process.env.PROPERTY_HISTORY_ADDRESS || process.env.BLOCKCHAIN_HISTORY_ADDRESS
	);

	const enabled = Boolean(rpcUrl && privateKey && registryAddress && transferAddress);

	return {
		enabled,
		rpcUrl,
		privateKey,
		addresses: {
			registry: registryAddress,
			transfer: transferAddress,
			history: historyAddress,
		},
	};
};

export const assertBlockchainEnabled = () => {
	const config = getBlockchainConfig();

	if (!config.enabled) {
		throw toError(
			"Blockchain service is not configured. Set BLOCKCHAIN_RPC_URL/LOCAL_RPC_URL, PRIVATE_KEY, PROPERTY_REGISTRY_ADDRESS and OWNERSHIP_TRANSFER_ADDRESS.",
			503
		);
	}

	return config;
};

const loadEthers = async () => {
	try {
		return await import("ethers");
	} catch {
		throw toError("Missing dependency: install 'ethers' in backend package", 500);
	}
};

const getClients = async () => {
	const config = assertBlockchainEnabled();
	const { JsonRpcProvider, Wallet, Contract } = await loadEthers();

	const provider = new JsonRpcProvider(config.rpcUrl);
	const signer = new Wallet(config.privateKey, provider);

	const registry = new Contract(config.addresses.registry, REGISTRY_ABI, signer);
	const transfer = new Contract(config.addresses.transfer, TRANSFER_ABI, signer);
	const history = config.addresses.history
		? new Contract(config.addresses.history, HISTORY_ABI, signer)
		: null;

	return {
		provider,
		signer,
		registry,
		transfer,
		history,
		config,
	};
};

const waitForTx = async (tx, confirmations = DEFAULT_CONFIRMATIONS) => {
	const receipt = await tx.wait(confirmations);
	return {
		txHash: tx.hash,
		blockNumber: receipt?.blockNumber ?? null,
		status: receipt?.status ?? null,
		receipt,
	};
};

export const getBlockchainStatus = async () => {
	const config = getBlockchainConfig();
	if (!config.enabled) {
		return {
			enabled: false,
			configuredContracts: config.addresses,
		};
	}

	const { provider, signer, config: safeConfig } = await getClients();
	const network = await provider.getNetwork();

	return {
		enabled: true,
		network: {
			name: network.name,
			chainId: Number(network.chainId),
		},
		signer: await signer.getAddress(),
		configuredContracts: safeConfig.addresses,
	};
};

export const registerPropertyOnChain = async ({
	khasraNumber,
	surveyNumber,
	plotNumber,
	location,
	area,
	owner,
}) => {
	const { registry, signer } = await getClients();

	if (!khasraNumber || !surveyNumber || !plotNumber || !location || area == null) {
		throw toError("khasraNumber, surveyNumber, plotNumber, location and area are required", 400);
	}

	const ownerAddress = normalizeAddress(owner) || (await signer.getAddress());
	const tx = await registry.registerProperty(
		khasraNumber,
		surveyNumber,
		plotNumber,
		location,
		BigInt(Math.floor(Number(area))),
		ownerAddress
	);

	const mined = await waitForTx(tx);

	let propertyId = null;
	try {
		for (const log of mined.receipt?.logs || []) {
			const parsed = registry.interface.parseLog(log);
			if (parsed?.name === "PropertyRegistered") {
				propertyId = Number(parsed.args.propertyId);
				break;
			}
		}
	} catch {
		propertyId = null;
	}

	return {
		...mined,
		propertyId,
	};
};

export const requestOwnershipTransferOnChain = async ({ propertyId, toOwner }) => {
	if (propertyId == null || !toOwner) {
		throw toError("propertyId and toOwner are required", 400);
	}

	const { transfer } = await getClients();
	const tx = await transfer.requestTransfer(BigInt(propertyId), toOwner);
	const mined = await waitForTx(tx);

	let requestId = null;
	try {
		for (const log of mined.receipt?.logs || []) {
			const parsed = transfer.interface.parseLog(log);
			if (parsed?.name === "TransferRequested") {
				requestId = Number(parsed.args.requestId);
				break;
			}
		}
	} catch {
		requestId = null;
	}

	return {
		...mined,
		requestId,
	};
};

export const approveOwnershipTransferOnChain = async ({ requestId }) => {
	if (requestId == null) {
		throw toError("requestId is required", 400);
	}

	const { transfer } = await getClients();
	const tx = await transfer.approveTransfer(BigInt(requestId));
	return waitForTx(tx);
};

export const executeOwnershipTransferOnChain = async ({ requestId }) => {
	if (requestId == null) {
		throw toError("requestId is required", 400);
	}

	const { transfer } = await getClients();
	const tx = await transfer.executeTransfer(BigInt(requestId));
	return waitForTx(tx);
};

export const getPropertyOnChain = async (propertyId) => {
	if (propertyId == null) {
		throw toError("propertyId is required", 400);
	}

	const { registry } = await getClients();
	const data = await registry.getProperty(BigInt(propertyId));

	return {
		propertyId: Number(data.propertyId),
		khasraNumber: data.khasraNumber,
		surveyNumber: data.surveyNumber,
		plotNumber: data.plotNumber,
		location: data.location,
		area: Number(data.area),
		currentOwner: data.currentOwner,
		registeredAt: Number(data.registeredAt),
		updatedAt: Number(data.updatedAt),
		exists: Boolean(data.exists),
	};
};

export const getPropertyOwnerOnChain = async (propertyId) => {
	if (propertyId == null) {
		throw toError("propertyId is required", 400);
	}

	const { registry } = await getClients();
	return registry.ownerOf(BigInt(propertyId));
};

export const recordPropertyHistoryOnChain = async ({ propertyId, actor, action, details = "" }) => {
	if (propertyId == null || !actor || !action) {
		throw toError("propertyId, actor and action are required", 400);
	}

	const { history } = await getClients();
	if (!history) {
		throw toError("PROPERTY_HISTORY_ADDRESS is not configured", 503);
	}

	const tx = await history.recordAction(BigInt(propertyId), actor, action, details);
	return waitForTx(tx);
};

export const getPropertyHistoryOnChain = async (propertyId, { offset = 0, limit = 20, full = false } = {}) => {
	if (propertyId == null) {
		throw toError("propertyId is required", 400);
	}

	const { history } = await getClients();
	if (!history) {
		throw toError("PROPERTY_HISTORY_ADDRESS is not configured", 503);
	}

	const records = full
		? await history.getFullHistory(BigInt(propertyId))
		: await history.getHistoryByRange(BigInt(propertyId), BigInt(offset), BigInt(limit));

	return records.map(normalizeBigintRecord);
};

export default {
	getBlockchainConfig,
	assertBlockchainEnabled,
	getBlockchainStatus,
	registerPropertyOnChain,
	requestOwnershipTransferOnChain,
	approveOwnershipTransferOnChain,
	executeOwnershipTransferOnChain,
	getPropertyOnChain,
	getPropertyOwnerOnChain,
	recordPropertyHistoryOnChain,
	getPropertyHistoryOnChain,
};

