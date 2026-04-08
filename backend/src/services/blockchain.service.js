import fs from "node:fs";
import path from "node:path";
import { JsonRpcProvider, Wallet, Contract } from "ethers";

const DEFAULT_CONFIRMATIONS = 1;

const resolveConfigPaths = () => {
	const cwd = process.cwd();
	return [
		path.resolve(cwd, "src", "config", "contract-config.json"),
		path.resolve(cwd, "..", "blockchain", "config", "contract-config.json"),
		path.resolve(cwd, "..", "shared", "blockchain-config.json"),
		path.resolve(cwd, "src", "config", "blockchain-config.json"),
	];
};

const loadChainConfig = () => {
	for (const target of resolveConfigPaths()) {
		if (fs.existsSync(target)) {
			const raw = fs.readFileSync(target, "utf8");
			console.log(`[backend:blockchain] Loaded config from ${target}`);
			return JSON.parse(raw);
		}
	}

	return null;
};

const toError = (message, statusCode = 500, details) => {
	const error = new Error(message);
	error.statusCode = statusCode;
	if (details) {
		error.details = details;
	}
	return error;
};

const normalizeAddress = (value = "") => String(value).trim();

const normalizePrivateKey = (value = "") => {
	const raw = String(value).trim();
	if (!raw) {
		return "";
	}
	return raw.startsWith("0x") ? raw : `0x${raw}`;
};

export const getBlockchainConfig = () => {
	const fileConfig = loadChainConfig();
	const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY || "");
	const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.LOCAL_RPC_URL || fileConfig?.network?.rpcUrl || "";
	const contracts = fileConfig?.contracts || fileConfig || {};

	const registry = normalizeAddress(
		process.env.PROPERTY_REGISTRY_ADDRESS || contracts?.PropertyRegistry?.address || ""
	);
	const transfer = normalizeAddress(
		process.env.OWNERSHIP_TRANSFER_ADDRESS || contracts?.OwnershipTransfer?.address || ""
	);
	const history = normalizeAddress(
		process.env.PROPERTY_HISTORY_ADDRESS || contracts?.PropertyHistory?.address || ""
	);

	return {
		enabled: Boolean(fileConfig && privateKey && rpcUrl && registry && history),
		privateKey,
		rpcUrl,
		fileConfig,
		contracts: {
			registry: {
				address: registry,
				abi: contracts?.PropertyRegistry?.abi || [],
			},
			transfer: {
				address: transfer,
				abi: contracts?.OwnershipTransfer?.abi || [],
			},
			history: {
				address: history,
				abi: contracts?.PropertyHistory?.abi || [],
			},
		},
		network: fileConfig?.network || {},
	};
};

export const assertBlockchainEnabled = () => {
	const config = getBlockchainConfig();
	if (!config.enabled) {
		throw toError("Blockchain config missing. Run blockchain deployment first.", 503, {
			expectedPaths: resolveConfigPaths(),
		});
	}
	return config;
};

const getClients = async () => {
	const config = assertBlockchainEnabled();
	const provider = new JsonRpcProvider(config.rpcUrl);
	const signer = new Wallet(config.privateKey, provider);
	console.log(`[backend:blockchain] registry=${config.contracts.registry.address}`);

	return {
		provider,
		signer,
		registry: new Contract(config.contracts.registry.address, config.contracts.registry.abi, signer),
		transfer: new Contract(config.contracts.transfer.address, config.contracts.transfer.abi, signer),
		history: new Contract(config.contracts.history.address, config.contracts.history.abi, signer),
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
		return { enabled: false };
	}

	const { provider, signer } = await getClients();
	const network = await provider.getNetwork();

	return {
		enabled: true,
		network: {
			name: network.name,
			chainId: Number(network.chainId),
		},
		signerAddress: await signer.getAddress(),
		contracts: {
			registry: config.contracts.registry.address,
			transfer: config.contracts.transfer.address,
			history: config.contracts.history.address,
		},
	};
};

export const getPropertyOnChain = async (chainPropertyId) => {
	if (!Number.isFinite(Number(chainPropertyId))) {
		throw toError("chainPropertyId is required", 400);
	}

	const { registry } = await getClients();
	const data = await registry.getProperty(BigInt(chainPropertyId));

	return {
		propertyId: Number(data.propertyId),
		metadata: data.metadata,
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

export const registerPropertyOnChain = async ({
	chainPropertyId,
	metadata,
	owner,
	allowExisting = true,
} = {}) => {
	if (!Number.isFinite(Number(chainPropertyId))) {
		throw toError("chainPropertyId is required", 400);
	}

	const { registry, signer } = await getClients();
	const ownerAddress = normalizeAddress(owner) || (await signer.getAddress());

	if (allowExisting) {
		try {
			const existing = await registry.getProperty(BigInt(chainPropertyId));
			if (existing?.exists) {
				return {
					skipped: true,
					propertyId: Number(existing.propertyId),
					currentOwner: existing.currentOwner,
				};
			}
		} catch {
			// Ignore and proceed to register.
		}
	}

	const tx = await registry["registerProperty(uint256,string,address)"](
		BigInt(chainPropertyId),
		String(metadata || ""),
		ownerAddress
	);
	const mined = await waitForTx(tx);

	return {
		...mined,
		propertyId: Number(chainPropertyId),
	};
};

export const transferOwnershipOnChain = async ({
	chainPropertyId,
	newOwner,
	chainTxHash,
} = {}) => {
	if (!Number.isFinite(Number(chainPropertyId))) {
		throw toError("chainPropertyId is required", 400);
	}

	if (!newOwner) {
		throw toError("newOwner wallet is required for on-chain transfer", 400);
	}

	const { registry } = await getClients();
	const currentOwner = await registry.ownerOf(BigInt(chainPropertyId));
	if (normalizeAddress(currentOwner).toLowerCase() === normalizeAddress(newOwner).toLowerCase()) {
		return {
			skipped: true,
			txHash: chainTxHash || "",
			reason: "Ownership already updated on-chain",
		};
	}

	const tx = await registry.transferOwnership(BigInt(chainPropertyId), newOwner);
	return waitForTx(tx);
};

export const getHistoryFromChain = async (chainPropertyId) => {
	if (!Number.isFinite(Number(chainPropertyId))) {
		throw toError("chainPropertyId is required", 400);
	}

	const { history } = await getClients();
	const records = await history.getHistory(BigInt(chainPropertyId));

	return records.map((record) => ({
		recordId: Number(record.recordId),
		propertyId: Number(record.propertyId),
		actor: record.actor,
		action: record.action,
		details: record.details,
		timestamp: Number(record.timestamp),
	}));
};

export const getChainTransactionByHash = async (txHash) => {
	const normalizedHash = String(txHash || "").trim();
	if (!normalizedHash) {
		throw toError("chainTxHash is required", 400);
	}

	const { provider } = await getClients();
	const transaction = await provider.getTransaction(normalizedHash);
	if (!transaction) {
		throw toError("Blockchain transaction not found", 404);
	}

	return transaction;
};

export default {
	getBlockchainConfig,
	assertBlockchainEnabled,
	getBlockchainStatus,
	registerPropertyOnChain,
	transferOwnershipOnChain,
	getPropertyOnChain,
	getHistoryFromChain,
	getChainTransactionByHash,
};
