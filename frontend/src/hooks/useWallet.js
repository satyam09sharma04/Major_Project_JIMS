import { useCallback, useMemo } from "react";
import { useWallet as useWalletContext } from "../context/WalletContext";

const CHAIN_NAMES = {
	"0x1": "Ethereum Mainnet",
	"0x89": "Polygon Mainnet",
	"0x13881": "Polygon Mumbai",
	"0xaa36a7": "Sepolia",
	"0x539": "Localhost 8545",
	"0x7a69": "Hardhat Local",
};

export const formatWalletAddress = (address = "", prefix = 6, suffix = 4) => {
	if (!address || address.length <= prefix + suffix + 3) {
		return address || "-";
	}

	return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
};

export const getChainName = (chainId = "") => {
	if (!chainId) {
		return "-";
	}

	return CHAIN_NAMES[chainId] || `Unknown (${chainId})`;
};

const useWallet = () => {
	const wallet = useWalletContext();

	const chainName = useMemo(() => getChainName(wallet.chainId), [wallet.chainId]);
	const shortAddress = useMemo(() => formatWalletAddress(wallet.account), [wallet.account]);

	const refresh = useCallback(() => wallet.syncWallet(), [wallet]);

	const connect = useCallback(async () => {
		const result = await wallet.connectWallet();
		return result;
	}, [wallet]);

	const disconnect = useCallback(() => {
		wallet.disconnectWallet();
	}, [wallet]);

	return {
		...wallet,
		connect,
		disconnect,
		refresh,
		shortAddress,
		chainName,
		hasProvider: typeof window !== "undefined" && Boolean(window.ethereum),
		isMetaMaskInstalled: typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask),
	};
};

export default useWallet;

