import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const WalletContext = createContext(null);

const toEth = (hexWei = "0x0") => {
	try {
		const wei = BigInt(hexWei);
		const whole = wei / 1000000000000000000n;
		const fraction = wei % 1000000000000000000n;
		const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
		return `${whole.toString()}.${fractionStr}`;
	} catch {
		return "0.0000";
	}
};

export const WalletProvider = ({ children }) => {
	const [account, setAccount] = useState("");
	const [chainId, setChainId] = useState("");
	const [balance, setBalance] = useState("0.0000");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const isConnected = Boolean(account);

	const syncWallet = useCallback(async () => {
		if (!window.ethereum) {
			setError("MetaMask not detected");
			setAccount("");
			setChainId("");
			setBalance("0.0000");
			return null;
		}

		setLoading(true);
		setError("");

		try {
			const accounts = await window.ethereum.request({ method: "eth_accounts" });
			const selected = accounts?.[0] || "";
			const nextChainId = await window.ethereum.request({ method: "eth_chainId" });

			setAccount(selected);
			setChainId(nextChainId || "");

			if (selected) {
				const weiHex = await window.ethereum.request({
					method: "eth_getBalance",
					params: [selected, "latest"],
				});
				const nextBalance = toEth(weiHex);
				setBalance(nextBalance);

				return {
					account: selected,
					chainId: nextChainId || "",
					balance: nextBalance,
				};
			} else {
				setBalance("0.0000");
				return {
					account: "",
					chainId: nextChainId || "",
					balance: "0.0000",
				};
			}
		} catch (err) {
			setError(err?.message || "Failed to sync wallet");
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	const connectWallet = useCallback(async () => {
		if (!window.ethereum) {
			setError("MetaMask is not available. Please install MetaMask extension.");
			return null;
		}

		setLoading(true);
		setError("");

		try {
			await window.ethereum.request({ method: "eth_requestAccounts" });
			const snapshot = await syncWallet();
			return snapshot;
		} catch (err) {
			if (err?.code === 4001) {
				setError("Connection request was rejected by user.");
			} else {
				setError(err?.message || "Failed to connect wallet");
			}
			return null;
		} finally {
			setLoading(false);
		}
	}, [syncWallet]);

	const disconnectWallet = useCallback(() => {
		setAccount("");
		setChainId("");
		setBalance("0.0000");
		setError("");
	}, []);

	useEffect(() => {
		syncWallet().catch(() => {});

		if (!window.ethereum) {
			return undefined;
		}

		const handleAccountsChanged = (accounts) => {
			setAccount(accounts?.[0] || "");
			syncWallet().catch(() => {});
		};

		const handleChainChanged = (nextChainId) => {
			setChainId(nextChainId || "");
			syncWallet().catch(() => {});
		};

		window.ethereum.on("accountsChanged", handleAccountsChanged);
		window.ethereum.on("chainChanged", handleChainChanged);

		return () => {
			window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
			window.ethereum.removeListener("chainChanged", handleChainChanged);
		};
	}, [syncWallet]);

	const value = useMemo(
		() => ({
			account,
			chainId,
			balance,
			loading,
			error,
			isConnected,
			connectWallet,
			disconnectWallet,
			syncWallet,
		}),
		[account, balance, chainId, connectWallet, disconnectWallet, error, isConnected, loading, syncWallet]
	);

	return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
	const context = useContext(WalletContext);
	if (!context) {
		throw new Error("useWallet must be used within a WalletProvider");
	}

	return context;
};

export default WalletContext;
