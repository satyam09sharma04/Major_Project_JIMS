import { useCallback, useMemo, useState } from "react";
import { useWallet } from "../context/WalletContext";
import {
	approveOwnershipTransferOnChain,
	executeOwnershipTransferOnChain,
	getPropertyOnChain,
	getPropertyOwnerOnChain,
	requestOwnershipTransferOnChain,
	registerPropertyOnChain,
	transferOwnershipDirectOnChain,
} from "../services/blockchainService";

const normalizeError = (error, fallbackMessage) => {
	if (!error) {
		return fallbackMessage;
	}

	if (typeof error === "string") {
		return error;
	}

	return (
		error?.reason ||
		error?.shortMessage ||
		error?.message ||
		error?.data?.message ||
		fallbackMessage
	);
};

const useContract = () => {
	const { isConnected, connectWallet, syncWallet } = useWallet();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [lastTxHash, setLastTxHash] = useState("");

	const clearError = useCallback(() => {
		setError("");
	}, []);

	const reset = useCallback(() => {
		setLoading(false);
		setError("");
		setLastTxHash("");
	}, []);

	const ensureWalletConnection = useCallback(async () => {
		if (isConnected) {
			return true;
		}

		const connected = await connectWallet();
		return Boolean(connected?.account);
	}, [connectWallet, isConnected]);

	const runWrite = useCallback(
		async (fn, fallbackMessage) => {
			setLoading(true);
			setError("");

			try {
				const canContinue = await ensureWalletConnection();
				if (!canContinue) {
					throw new Error("Wallet connection is required.");
				}

				const result = await fn();
				setLastTxHash(result?.txHash || "");
				await syncWallet();
				return result;
			} catch (err) {
				setLastTxHash("");
				const message = normalizeError(err, fallbackMessage);
				setError(message);
				throw new Error(message);
			} finally {
				setLoading(false);
			}
		},
		[ensureWalletConnection, syncWallet]
	);

	const runRead = useCallback(async (fn, fallbackMessage) => {
		setLoading(true);
		setError("");

		try {
			return await fn();
		} catch (err) {
			const message = normalizeError(err, fallbackMessage);
			setError(message);
			throw new Error(message);
		} finally {
			setLoading(false);
		}
	}, []);

	const registerProperty = useCallback(
		(payload) => {
			return runWrite(
				() => registerPropertyOnChain(payload),
				"Unable to register property on-chain."
			);
		},
		[runWrite]
	);

	const transferOwnershipDirect = useCallback(
		(payload) => {
			return runWrite(
				() => transferOwnershipDirectOnChain(payload),
				"Unable to transfer ownership on-chain."
			);
		},
		[runWrite]
	);

	const requestTransfer = useCallback(
		(payload) => {
			return runWrite(
				() => requestOwnershipTransferOnChain(payload),
				"Unable to request ownership transfer on-chain."
			);
		},
		[runWrite]
	);

	const approveTransfer = useCallback(
		(payload) => {
			return runWrite(
				() => approveOwnershipTransferOnChain(payload),
				"Unable to approve ownership transfer on-chain."
			);
		},
		[runWrite]
	);

	const executeTransfer = useCallback(
		(payload) => {
			return runWrite(
				() => executeOwnershipTransferOnChain(payload),
				"Unable to execute ownership transfer on-chain."
			);
		},
		[runWrite]
	);

	const getProperty = useCallback(
		(propertyId) => {
			return runRead(() => getPropertyOnChain(propertyId), "Unable to fetch property from chain.");
		},
		[runRead]
	);

	const getPropertyOwner = useCallback(
		(propertyId) => {
			return runRead(() => getPropertyOwnerOnChain(propertyId), "Unable to fetch property owner from chain.");
		},
		[runRead]
	);

	return useMemo(
		() => ({
			loading,
			error,
			lastTxHash,
			isReady: isConnected,
			clearError,
			reset,
			registerProperty,
			transferOwnershipDirect,
			requestTransfer,
			approveTransfer,
			executeTransfer,
			getProperty,
			getPropertyOwner,
		}),
		[
			approveTransfer,
			clearError,
			error,
			executeTransfer,
			getProperty,
			getPropertyOwner,
			isConnected,
			lastTxHash,
			loading,
			registerProperty,
			requestTransfer,
			reset,
			transferOwnershipDirect,
		]
	);
};

export default useContract;

