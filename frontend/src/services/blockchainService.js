import { BrowserProvider, Contract, formatEther } from "ethers";

const REGISTRY_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const TRANSFER_ADDRESS = import.meta.env.VITE_TRANSFER_CONTRACT_ADDRESS || "";

const PROPERTY_REGISTRY_ABI = [
	"function registerProperty(string khasraNumber,string surveyNumber,string plotNumber,string location,uint256 area,address owner) returns (uint256)",
	"function transferOwnership(uint256 propertyId,address newOwner)",
	"function getProperty(uint256 propertyId) view returns (tuple(uint256 propertyId,string khasraNumber,string surveyNumber,string plotNumber,string location,uint256 area,address currentOwner,uint256 registeredAt,uint256 updatedAt,bool exists))",
	"function ownerOf(uint256 propertyId) view returns (address)",
	"event PropertyRegistered(uint256 indexed propertyId,address indexed owner,string khasraNumber,string surveyNumber,string plotNumber)",
	"event PropertyOwnershipTransferred(uint256 indexed propertyId,address indexed fromOwner,address indexed toOwner)",
];

const OWNERSHIP_TRANSFER_ABI = [
	"function requestTransfer(uint256 propertyId,address toOwner) returns (uint256)",
	"function approveTransfer(uint256 requestId)",
	"function executeTransfer(uint256 requestId)",
	"function cancelTransfer(uint256 requestId)",
	"function transferRequests(uint256 requestId) view returns (uint256 requestIdOut,uint256 propertyId,address fromOwner,address toOwner,bool approved,bool executed,uint256 createdAt)",
];

const getEthereum = () => {
	if (!window.ethereum) {
		throw new Error("MetaMask is not available. Please install MetaMask.");
	}

	return window.ethereum;
};

const requireAddress = (address, name) => {
	if (!address) {
		throw new Error(`${name} is missing. Set it in frontend .env.`);
	}

	return address;
};

export const getBrowserProvider = () => {
	const ethereum = getEthereum();
	return new BrowserProvider(ethereum);
};

export const connectWallet = async () => {
	const ethereum = getEthereum();
	await ethereum.request({ method: "eth_requestAccounts" });
	return getWalletInfo();
};

export const disconnectWallet = () => {
	return null;
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

export const getRegistryContract = async () => {
	const provider = getBrowserProvider();
	const signer = await provider.getSigner();
	const address = requireAddress(REGISTRY_ADDRESS, "VITE_CONTRACT_ADDRESS");

	return new Contract(address, PROPERTY_REGISTRY_ABI, signer);
};

export const getOwnershipTransferContract = async () => {
	const provider = getBrowserProvider();
	const signer = await provider.getSigner();
	const address = requireAddress(TRANSFER_ADDRESS, "VITE_TRANSFER_CONTRACT_ADDRESS");

	return new Contract(address, OWNERSHIP_TRANSFER_ABI, signer);
};

export const registerPropertyOnChain = async ({
	khasraNumber,
	surveyNumber,
	plotNumber,
	location,
	area,
	owner,
}) => {
	const contract = await getRegistryContract();

	const tx = await contract.registerProperty(
		khasraNumber,
		surveyNumber,
		plotNumber,
		location,
		BigInt(Math.floor(Number(area))),
		owner
	);

	const receipt = await tx.wait();
	return { txHash: tx.hash, receipt };
};

export const transferOwnershipDirectOnChain = async ({ propertyId, newOwner }) => {
	const contract = await getRegistryContract();
	const tx = await contract.transferOwnership(BigInt(propertyId), newOwner);
	const receipt = await tx.wait();

	return { txHash: tx.hash, receipt };
};

export const requestOwnershipTransferOnChain = async ({ propertyId, toOwner }) => {
	const transferContract = await getOwnershipTransferContract();
	const tx = await transferContract.requestTransfer(BigInt(propertyId), toOwner);
	const receipt = await tx.wait();

	return { txHash: tx.hash, receipt };
};

export const approveOwnershipTransferOnChain = async ({ requestId }) => {
	const transferContract = await getOwnershipTransferContract();
	const tx = await transferContract.approveTransfer(BigInt(requestId));
	const receipt = await tx.wait();

	return { txHash: tx.hash, receipt };
};

export const executeOwnershipTransferOnChain = async ({ requestId }) => {
	const transferContract = await getOwnershipTransferContract();
	const tx = await transferContract.executeTransfer(BigInt(requestId));
	const receipt = await tx.wait();

	return { txHash: tx.hash, receipt };
};

export const getPropertyOnChain = async (propertyId) => {
	const contract = await getRegistryContract();
	return contract.getProperty(BigInt(propertyId));
};

export const getPropertyOwnerOnChain = async (propertyId) => {
	const contract = await getRegistryContract();
	return contract.ownerOf(BigInt(propertyId));
};

export default {
	connectWallet,
	disconnectWallet,
	getWalletInfo,
	getRegistryContract,
	getOwnershipTransferContract,
	registerPropertyOnChain,
	transferOwnershipDirectOnChain,
	requestOwnershipTransferOnChain,
	approveOwnershipTransferOnChain,
	executeOwnershipTransferOnChain,
	getPropertyOnChain,
	getPropertyOwnerOnChain,
};
