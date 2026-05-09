import { BrowserProvider, Contract, formatEther } from "ethers";

let configCache = null;
let configCacheKey = "";

const toError = (message, code = "BLOCKCHAIN_ERROR") => {
	const error = new Error(message);
	error.code = code;
	return error;
};

const getEthereum = () => {
	if (!window.ethereum) {
		throw toError("MetaMask not installed. Please install MetaMask extension.", "METAMASK_MISSING");
	}
	return window.ethereum;
};

export const loadBlockchainConfig = async () => {
	const targets = ["/contract-config.json", "/blockchain-config.json"];
	let config = null;

	for (const target of targets) {
		const response = await fetch(`${target}?t=${Date.now()}`, { cache: "no-store" });
		if (!response.ok) {
			continue;
		}
		config = await response.json();
		console.log(`[blockchainService] loaded contract config from ${target}`);
		break;
	}

	if (!config) {
		throw toError("Unable to load contract config. Run blockchain deploy first.", "CONFIG_MISSING");
	}

	const contracts = config?.contracts || config;
	const registry = contracts?.PropertyRegistry;
	const history = contracts?.PropertyHistory;

	if (!registry?.address || !registry?.abi?.length) {
		throw toError("Invalid blockchain config. Contract addresses/ABI missing.", "CONFIG_INVALID");
	}
	if (!history?.address || !history?.abi?.length) {
		throw toError("Invalid blockchain config. PropertyHistory address/ABI missing.", "CONFIG_INVALID");
	}

	config = {
		...config,
		contracts: {
			...contracts,
			PropertyRegistry: registry,
			PropertyHistory: history,
		},
	};

	// Prefer ABI files generated from the latest Hardhat artifacts during deploy.
	try {
		const [registryAbiResponse, historyAbiResponse] = await Promise.all([
			fetch(`/abi/PropertyRegistry.abi.json?t=${Date.now()}`, { cache: "no-store" }),
			fetch(`/abi/PropertyHistory.abi.json?t=${Date.now()}`, { cache: "no-store" }),
		]);

		if (registryAbiResponse.ok) {
			const latestRegistryAbi = await registryAbiResponse.json();
			if (Array.isArray(latestRegistryAbi) && latestRegistryAbi.length > 0) {
				config.contracts.PropertyRegistry.abi = latestRegistryAbi;
				console.log("[blockchainService] loaded latest PropertyRegistry ABI from /abi/PropertyRegistry.abi.json");
			}
		}

		if (historyAbiResponse.ok) {
			const latestHistoryAbi = await historyAbiResponse.json();
			if (Array.isArray(latestHistoryAbi) && latestHistoryAbi.length > 0) {
				config.contracts.PropertyHistory.abi = latestHistoryAbi;
				console.log("[blockchainService] loaded latest PropertyHistory ABI from /abi/PropertyHistory.abi.json");
			}
		}
	} catch (abiLoadError) {
		console.warn("[blockchainService] could not load ABI files from /abi, using config ABI", abiLoadError);
	}

	configCacheKey = `${registry.address}-${history.address}-${config?.updatedAt || ""}`;
	console.log(`[blockchainService] config cache key: ${configCacheKey}`);
	configCache = config;
	return config;
};

export const clearBlockchainConfigCache = () => {
	configCache = null;
	configCacheKey = "";
	console.log("[blockchainService] contract config cache cleared");
};

export const getBrowserProvider = () => {
	const ethereum = getEthereum();
	return new BrowserProvider(ethereum);
};

export const connectWallet = async () => {
	const ethereum = getEthereum();
	console.log("[blockchainService] requesting MetaMask account access");
	await ethereum.request({ method: "eth_requestAccounts" });
	return getWalletInfo();
};

export const autoConnectWallet = async () => {
	const ethereum = getEthereum();
	const accounts = await ethereum.request({ method: "eth_accounts" });
	if (!accounts?.length) {
		return null;
	}
	return getWalletInfo();
};

export const getWalletInfo = async () => {
	const provider = getBrowserProvider();
	const signer = await provider.getSigner();
	const address = await signer.getAddress();
	const network = await provider.getNetwork();
	const balanceWei = await provider.getBalance(address);

	return {
		address,
		chainId: Number(network.chainId),
		balance: formatEther(balanceWei),
	};
};

const ensureWalletConnected = async () => {
	const info = await connectWallet();
	if (!info?.address) {
		throw toError("MetaMask account not connected.", "WALLET_NOT_CONNECTED");
	}
	console.log(`[blockchainService] MetaMask connected: ${info.address}`);
	return info;
};

export const ensureCorrectNetwork = async () => {
	const config = await loadBlockchainConfig();
	const provider = getBrowserProvider();
	const network = await provider.getNetwork();
	const expected = Number(config?.network?.chainId || 31337);
	if (Number(network.chainId) !== expected) {
		throw toError(`Network mismatch. Switch MetaMask to chainId ${expected}.`, "NETWORK_MISMATCH");
	}
	return true;
};

const getContractBundle = async () => {
	await ensureWalletConnected();
	await ensureCorrectNetwork();
	const config = await loadBlockchainConfig();
	const provider = getBrowserProvider();
	const signer = await provider.getSigner();
	console.log(`[blockchainService] using registry contract: ${config.contracts.PropertyRegistry.address}`);

	return {
		signer,
		registry: new Contract(
			config.contracts.PropertyRegistry.address,
			config.contracts.PropertyRegistry.abi,
			signer
		),
		history: new Contract(
			config.contracts.PropertyHistory.address,
			config.contracts.PropertyHistory.abi,
			signer
		),
	};
};

const decodeRevertReason = (error) => {
	return (
		error?.reason
		|| error?.shortMessage
		|| error?.info?.error?.message
		|| error?.error?.message
		|| error?.data?.message
		|| error?.message
		|| "Unknown blockchain error"
	);
};

const classifyBlockchainError = (error) => {
	if (error?.code === 4001) {
		return { code: "USER_REJECTED", message: "Transaction rejected by user." };
	}

	const raw = decodeRevertReason(error);
	const lower = String(raw).toLowerCase();

	if (lower.includes("could not decode result data") || lower.includes("buffer overrun") || lower.includes("bad data")) {
		return {
			code: "ABI_DECODE_ERROR",
			message: "ABI decode mismatch detected. Recompile and redeploy contracts, then hard refresh frontend.",
		};
	}

	if (lower.includes("execution reverted") || lower.includes("revert")) {
		return {
			code: "CONTRACT_REVERT",
			message: raw,
		};
	}

	if (lower.includes("network") || lower.includes("rpc") || lower.includes("failed to fetch") || lower.includes("timeout")) {
		return {
			code: "RPC_NETWORK_ERROR",
			message: `RPC/network error: ${raw}`,
		};
	}

	return {
		code: "TX_FAILED",
		message: raw,
	};
};

export const registerPropertyOnChain = async ({ propertyId, metadata, owner }) => {
	const { registry } = await getContractBundle();
	try {
		const requestedPropertyId = Number(propertyId) || 0;
		const metadataString = String(metadata || "");

		let tx;
		if (registry.interface.hasFunction("registerProperty(uint256,string,address)")) {
			tx = await registry["registerProperty(uint256,string,address)"](
				BigInt(requestedPropertyId),
				metadataString,
				owner
			);
		} else if (registry.interface.hasFunction("registerProperty(string,string,string,string,uint256,address)")) {
			let parsedMetadata = {};
			try {
				parsedMetadata = JSON.parse(metadataString || "{}");
			} catch {
				parsedMetadata = {};
			}

			tx = await registry["registerProperty(string,string,string,string,uint256,address)"](
				String(parsedMetadata.khasraNumber || ""),
				String(parsedMetadata.surveyNumber || ""),
				String(parsedMetadata.plotNumber || ""),
				String(parsedMetadata.location || ""),
				BigInt(Number(parsedMetadata.area) || 0),
				owner
			);
		} else {
			throw toError("No supported registerProperty function found in ABI.", "ABI_DECODE_ERROR");
		}

		console.log("Contract Address:", registry.target);
		console.log("Transaction Hash:", tx.hash);
		const receipt = await tx.wait();
		console.log("Transaction Receipt:", receipt);

		if (!receipt || Number(receipt.status) !== 1) {
			throw toError("Transaction mined but failed on-chain.", "TX_MINED_FAILED");
		}

		const eventLog = receipt?.logs
			?.map((entry) => {
				try {
					return registry.interface.parseLog(entry);
				} catch {
					return null;
				}
			})
			.find((entry) => entry?.name === "PropertyRegistered");

		const finalPropertyId = eventLog?.args?.propertyId ? Number(eventLog.args.propertyId) : null;

		console.log(`[blockchainService] chainPropertyId: ${finalPropertyId}`);
		return {
			txHash: tx.hash,
			receipt,
			status: "success",
			chainPropertyId: finalPropertyId != null ? String(finalPropertyId) : null,
		};
	} catch (error) {
		const normalized = classifyBlockchainError(error);
		throw toError(normalized.message, normalized.code);
	}
};

export const transferOwnershipOnChain = async ({ propertyId, newOwner }) => {
	const { registry } = await getContractBundle();
	try {
		const tx = await registry.transferOwnership(BigInt(propertyId), newOwner);
		console.log(`[blockchainService] transferOwnership tx: ${tx.hash}`);
		const receipt = await tx.wait();
		return {
			txHash: tx.hash,
			receipt,
			status: "success",
		};
	} catch (error) {
		if (error?.code === 4001) {
			throw toError("Transaction rejected by user.", "USER_REJECTED");
		}
		throw toError(error?.shortMessage || error?.message || "Failed to transfer ownership on-chain", "TX_FAILED");
	}
};

export const getPropertyOnChain = async (propertyId) => {
	const { registry } = await getContractBundle();
	return registry.getProperty(BigInt(propertyId));
};

export const getHistoryFromChain = async (propertyId) => {
	const { history } = await getContractBundle();
	const records = await history.getHistory(BigInt(propertyId));
	return records.map((record) => ({
		recordId: Number(record.recordId),
		propertyId: Number(record.propertyId),
		actor: record.actor,
		action: record.action,
		details: record.details,
		timestamp: Number(record.timestamp),
	}));
};

export default {
	loadBlockchainConfig,
	clearBlockchainConfigCache,
	connectWallet,
	autoConnectWallet,
	getWalletInfo,
	ensureCorrectNetwork,
	registerPropertyOnChain,
	transferOwnershipOnChain,
	getPropertyOnChain,
	getHistoryFromChain,
};
