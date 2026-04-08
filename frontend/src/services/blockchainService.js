import { BrowserProvider, Contract, formatEther } from "ethers";

let configCache = null;

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
	if (configCache) {
		console.log("[blockchainService] using cached contract config");
		return configCache;
	}

	const targets = ["/contract-config.json", "/blockchain-config.json"];
	let config = null;

	for (const target of targets) {
		const response = await fetch(target, { cache: "no-store" });
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

	configCache = config;
	return config;
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

export const registerPropertyOnChain = async ({ propertyId, metadata, owner }) => {
	const { registry } = await getContractBundle();
	try {
		const requestedPropertyId = Number(propertyId) || 0;
		const predictedPropertyId = await registry["registerProperty(uint256,string,address)"].staticCall(
			BigInt(requestedPropertyId),
			String(metadata || ""),
			owner
		);

		const tx = await registry["registerProperty(uint256,string,address)"](
			BigInt(requestedPropertyId),
			String(metadata || ""),
			owner
		);
		console.log(`[blockchainService] registerProperty tx: ${tx.hash}`);
		const receipt = await tx.wait();

		const eventLog = receipt?.logs
			?.map((entry) => {
				try {
					return registry.interface.parseLog(entry);
				} catch {
					return null;
				}
			})
			.find((entry) => entry?.name === "PropertyRegistered");

		const finalPropertyId = eventLog?.args?.propertyId
			? Number(eventLog.args.propertyId)
			: Number(predictedPropertyId);

		console.log(`[blockchainService] chainPropertyId: ${finalPropertyId}`);
		return {
			txHash: tx.hash,
			receipt,
			status: "success",
			chainPropertyId: String(finalPropertyId),
		};
	} catch (error) {
		if (error?.code === 4001) {
			throw toError("Transaction rejected by user.", "USER_REJECTED");
		}
		throw toError(error?.shortMessage || error?.message || "Failed to register property on-chain", "TX_FAILED");
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
	connectWallet,
	autoConnectWallet,
	getWalletInfo,
	ensureCorrectNetwork,
	registerPropertyOnChain,
	transferOwnershipOnChain,
	getPropertyOnChain,
	getHistoryFromChain,
};
