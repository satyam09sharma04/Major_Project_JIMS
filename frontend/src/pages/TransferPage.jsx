import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppNav from "../components/common/AppNav";
import useWallet from "../hooks/useWallet";
import { toApiErrorMessage } from "../services/api";
import { transferOwnershipOnChain } from "../services/blockchainService";
import { getPropertyById } from "../services/propertyService";
import { transferOwnership } from "../services/transferService";
import { firstError, hasErrors, validateTransferForm } from "../utils/validators";

const S = {
	page: {
		minHeight: "100vh",
		background: "#0d1117",
		fontFamily: "'IBM Plex Sans', sans-serif",
	},
	main: {
		maxWidth: 720,
		margin: "0 auto",
		padding: "28px 20px 40px",
	},
	backLink: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: "#4a6282",
		textDecoration: "none",
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		marginBottom: 20,
		transition: "color 0.15s",
	},
	pageLabel: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		letterSpacing: "0.15em",
		textTransform: "uppercase",
		marginBottom: 6,
	},
	pageLabelLine: {
		display: "inline-block",
		width: 20,
		height: 1,
		background: "#1e2736",
	},
	pageTitle: {
		fontSize: 26,
		fontWeight: 300,
		color: "#e2e8f0",
		margin: "0 0 4px",
	},
	pageTitleAccent: {
		color: "#6b8cba",
		fontWeight: 500,
	},
	pageDesc: {
		fontSize: 13,
		color: "#4a6282",
		marginBottom: 10,
		lineHeight: 1.6,
	},
	walletBadge: (connected) => ({
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: connected ? "#1d9e75" : "#EF9F27",
		background: connected ? "#041a12" : "#1a1000",
		border: `1px solid ${connected ? "#085041" : "#634200"}`,
		borderRadius: 6,
		padding: "5px 10px",
		marginBottom: 18,
	}),
	walletDot: (connected) => ({
		width: 6,
		height: 6,
		borderRadius: "50%",
		background: connected ? "#1d9e75" : "#EF9F27",
		flexShrink: 0,
	}),
	card: {
		background: "#111827",
		border: "1px solid #1e2736",
		borderRadius: 10,
		padding: 20,
	},
	sectionLabel: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		letterSpacing: "0.12em",
		textTransform: "uppercase",
		marginBottom: 10,
		paddingBottom: 8,
		borderBottom: "1px solid #1e2736",
	},
	fieldRow: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 12,
		marginBottom: 12,
	},
	fieldRowFull: {
		display: "grid",
		gridTemplateColumns: "1fr",
		marginBottom: 12,
	},
	fieldGroup: {
		display: "flex",
		flexDirection: "column",
		gap: 5,
	},
	fieldLabel: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		letterSpacing: "0.1em",
		textTransform: "uppercase",
	},
	fieldInput: (hasErr) => ({
		background: "#0d1117",
		border: `1px solid ${hasErr ? "#3a1010" : "#1e2736"}`,
		borderRadius: 6,
		padding: "9px 12px",
		fontFamily: "'IBM Plex Sans', sans-serif",
		fontSize: 13,
		color: "#c9d6e8",
		outline: "none",
		width: "100%",
		transition: "border-color 0.15s",
	}),
	fieldError: {
		fontSize: 11,
		color: "#e24b4a",
	},
	walletActions: {
		display: "flex",
		gap: 8,
		flexWrap: "wrap",
		marginTop: 6,
	},
	ghostBtn: {
		background: "transparent",
		border: "1px solid #1e2736",
		borderRadius: 6,
		padding: "6px 12px",
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: "#6b8cba",
		cursor: "pointer",
		letterSpacing: "0.06em",
		textTransform: "uppercase",
		transition: "all 0.15s",
	},
	divider: {
		height: 1,
		background: "#1e2736",
		margin: "16px 0",
	},
	chainInfoBox: {
		background: "#0d1117",
		border: "1px solid #1e2736",
		borderRadius: 6,
		padding: "10px 12px",
		marginBottom: 12,
		display: "grid",
		gap: 4,
	},
	chainInfoRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	chainInfoKey: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		textTransform: "uppercase",
		letterSpacing: "0.08em",
	},
	chainInfoVal: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: "#9ab4d4",
		maxWidth: 320,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	statusBar: (type) => ({
		display: "flex",
		alignItems: "center",
		gap: 10,
		padding: "10px 12px",
		background: "#0d1117",
		border: `1px solid ${
			type === "pending" ? "#634200" : type === "success" ? "#085041" : "#791f1f"
		}`,
		borderRadius: 6,
		marginBottom: 12,
	}),
	statusDot: (type) => ({
		width: 8,
		height: 8,
		borderRadius: "50%",
		flexShrink: 0,
		background:
			type === "pending" ? "#EF9F27" : type === "success" ? "#1d9e75" : "#e24b4a",
		animation: type === "pending" ? "lv-pulse 1s infinite" : "none",
	}),
	statusLabel: (type) => ({
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color:
			type === "pending" ? "#EF9F27" : type === "success" ? "#1d9e75" : "#e24b4a",
	}),
	txHash: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		marginLeft: "auto",
		maxWidth: 200,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
	msgError: {
		background: "#1a0a0a",
		border: "1px solid #3a1010",
		borderRadius: 6,
		padding: "9px 12px",
		fontSize: 12,
		color: "#e24b4a",
		marginBottom: 12,
	},
	msgSuccess: {
		background: "#041a12",
		border: "1px solid #085041",
		borderRadius: 6,
		padding: "9px 12px",
		fontSize: 12,
		color: "#1d9e75",
		marginBottom: 12,
	},
	submitBtn: (loading) => ({
		width: "100%",
		padding: "11px",
		background: "transparent",
		border: "1px solid #1e2736",
		borderRadius: 6,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 12,
		letterSpacing: "0.08em",
		color: loading ? "#4a6282" : "#6b8cba",
		cursor: loading ? "not-allowed" : "pointer",
		textTransform: "uppercase",
		transition: "all 0.15s",
		opacity: loading ? 0.5 : 1,
	}),
	note: {
		fontSize: 11,
		color: "#4a6282",
		marginTop: 8,
		paddingLeft: 2,
	},
	resultCard: {
		background: "#111827",
		border: "1px solid #085041",
		borderRadius: 10,
		padding: 16,
		marginTop: 16,
	},
	resultLabel: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#1d9e75",
		letterSpacing: "0.12em",
		textTransform: "uppercase",
		marginBottom: 12,
		paddingBottom: 8,
		borderBottom: "1px solid #085041",
	},
	resultRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "5px 0",
		borderBottom: "1px solid #1e2736",
	},
	resultKey: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		textTransform: "uppercase",
		letterSpacing: "0.08em",
	},
	resultVal: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: "#9ab4d4",
		maxWidth: 340,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	},
};

const TransferPage = () => {
	const { user } = useAuth();
	const { propertyId: routePropertyId } = useParams();
	const wallet = useWallet();
	const [propertyId, setPropertyId] = useState(routePropertyId || "");
	const [newOwnerId, setNewOwnerId] = useState("");
	const [newOwnerWallet, setNewOwnerWallet] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [result, setResult] = useState(null);
	const [propertyDetails, setPropertyDetails] = useState(null);
	const [txHash, setTxHash] = useState("");
	const [txStatus, setTxStatus] = useState("");
	const profileWalletPrefilled = useRef(false);

	const walletSuggestion = useMemo(
		() => String(user?.walletAddress || wallet.account || "").trim(),
		[user?.walletAddress, wallet.account]
	);

	useEffect(() => {
		setPropertyId(routePropertyId || "");
	}, [routePropertyId]);

	useEffect(() => {
		if (!profileWalletPrefilled.current && !newOwnerWallet && user?.walletAddress) {
			setNewOwnerWallet(user.walletAddress);
			profileWalletPrefilled.current = true;
		}
	}, [newOwnerWallet, user?.walletAddress]);

	useEffect(() => {
		const load = async () => {
			if (!routePropertyId) return;
			try {
				const response = await getPropertyById(routePropertyId);
				setPropertyDetails(response?.data || null);
			} catch {
				setPropertyDetails(null);
			}
		};
		load();
	}, [routePropertyId]);

	const clearFieldError = (key) =>
		setFieldErrors((prev) => {
			if (!prev[key]) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});

	const handleTransfer = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		setResult(null);
		setTxHash("");
		setTxStatus("");
		setFieldErrors({});

		const normalizedPropertyId = propertyId.trim();
		const normalizedNewOwnerId = newOwnerId.trim();
		const normalizedNewOwnerWallet = newOwnerWallet.trim();

		const validationErrors = validateTransferForm({
			propertyId: normalizedPropertyId,
			newOwnerId: normalizedNewOwnerId,
			newOwnerWallet: normalizedNewOwnerWallet,
		});

		if (hasErrors(validationErrors)) {
			setFieldErrors(validationErrors);
			setError(firstError(validationErrors) || "Please correct the highlighted fields.");
			return;
		}

		if (!wallet.isConnected) {
			const connected = await wallet.connect();
			if (!connected?.account && !wallet.account) {
				setError("MetaMask wallet connection is required before transfer.");
				return;
			}
		}

		const chainPropertyId = Number(propertyDetails?.chainPropertyId);
		if (!Number.isFinite(chainPropertyId)) {
			setError("Property does not have chainPropertyId. Register on-chain first.");
			return;
		}

		setLoading(true);
		try {
			setTxStatus("pending");
			const chainResult = await transferOwnershipOnChain({
				propertyId: chainPropertyId,
				newOwner: normalizedNewOwnerWallet,
			});
			setTxHash(chainResult.txHash || "");
			setTxStatus("success");

			const response = await transferOwnership({
				propertyId: normalizedPropertyId,
				newOwnerId: normalizedNewOwnerId,
				newOwnerWallet: normalizedNewOwnerWallet,
				chainTxHash: chainResult.txHash,
			});

			setResult(response?.data || null);
			setSuccess("Ownership transferred on-chain and cache updated.");
			setNewOwnerId("");
			setNewOwnerWallet("");
		} catch (err) {
			setTxStatus("failed");
			setError(toApiErrorMessage(err, "Failed to transfer ownership."));
		} finally {
			setLoading(false);
		}
	};

	const useSuggestedWallet = (value) => {
		setNewOwnerWallet(value);
		clearFieldError("newOwnerWallet");
	};

	const hasChainInfo = propertyDetails?.chainPropertyId || propertyDetails?.ownerWallet;

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
				@keyframes lv-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
				.lv-input:focus { border-color: #6b8cba !important; }
				.lv-input::placeholder { color: #2a3a52; }
				.lv-ghost:hover { background: #1a2332 !important; border-color: #6b8cba !important; color: #9ab4d4 !important; }
				.lv-submit:hover:not(:disabled) { background: #1a2332 !important; border-color: #6b8cba !important; color: #9ab4d4 !important; }
				.lv-back:hover { color: #9ab4d4 !important; }
			`}</style>

			<div style={S.page}>
				<AppNav title="Transfer Ownership" />

				<main style={S.main}>
					<Link to="/dashboard" className="lv-back" style={S.backLink}>
						← Back to Dashboard
					</Link>

					<div style={S.pageLabel}>
						<span style={S.pageLabelLine} />
						Ownership Transfer
					</div>
					<h1 style={S.pageTitle}>
						Transfer <span style={S.pageTitleAccent}>Ownership</span>
					</h1>
					<p style={S.pageDesc}>
						The recipient wallet must be a valid Ethereum address. MetaMask is used to sign the
						transfer transaction, not to infer the recipient automatically.
					</p>

					<div style={S.walletBadge(wallet.isConnected)}>
						<span style={S.walletDot(wallet.isConnected)} />
						{wallet.isConnected
							? `Connected: ${wallet.shortAddress}`
							: "MetaMask not connected — you will be prompted before transfer."}
					</div>

					<form onSubmit={handleTransfer} style={S.card}>
						<div style={S.sectionLabel}>Transfer Details</div>

						{/* Row 1 */}
						<div style={S.fieldRow}>
							<div style={S.fieldGroup}>
								<label style={S.fieldLabel}>Property ID (MongoDB)</label>
								<input
									className="lv-input"
									style={S.fieldInput(!!fieldErrors.propertyId)}
									type="text"
									placeholder="e.g. 64f3a2bc9d1e8c0012..."
									value={propertyId}
									onChange={(e) => {
										setPropertyId(e.target.value);
										clearFieldError("propertyId");
									}}
								/>
								{fieldErrors.propertyId && (
									<small style={S.fieldError}>{fieldErrors.propertyId}</small>
								)}
							</div>
							<div style={S.fieldGroup}>
								<label style={S.fieldLabel}>New Owner ID (MongoDB)</label>
								<input
									className="lv-input"
									style={S.fieldInput(!!fieldErrors.newOwnerId)}
									type="text"
									placeholder="e.g. 64f3a2bc9d1e8c0045..."
									value={newOwnerId}
									onChange={(e) => {
										setNewOwnerId(e.target.value);
										clearFieldError("newOwnerId");
									}}
								/>
								{fieldErrors.newOwnerId && (
									<small style={S.fieldError}>{fieldErrors.newOwnerId}</small>
								)}
							</div>
						</div>

						{/* Wallet Row */}
						<div style={{ ...S.fieldRowFull, marginBottom: 0 }}>
							<div style={S.fieldGroup}>
								<label style={S.fieldLabel}>New Owner Wallet Address</label>
								<input
									className="lv-input"
									style={S.fieldInput(!!fieldErrors.newOwnerWallet)}
									type="text"
									placeholder="0x..."
									value={newOwnerWallet}
									onChange={(e) => {
										setNewOwnerWallet(e.target.value);
										clearFieldError("newOwnerWallet");
									}}
								/>
								{fieldErrors.newOwnerWallet && (
									<small style={S.fieldError}>{fieldErrors.newOwnerWallet}</small>
								)}
								<div style={S.walletActions}>
									{walletSuggestion && (
										<button
											type="button"
											className="lv-ghost"
											style={S.ghostBtn}
											onClick={() => useSuggestedWallet(walletSuggestion)}
										>
											Use saved / connected wallet
										</button>
									)}
									{wallet.isMetaMaskInstalled && (
										<button
											type="button"
											className="lv-ghost"
											style={S.ghostBtn}
											onClick={() => wallet.connect()}
											disabled={wallet.loading}
										>
											{wallet.isConnected ? "Reconnect MetaMask" : "Connect MetaMask"}
										</button>
									)}
								</div>
							</div>
						</div>

						{/* Chain Info */}
						{hasChainInfo && (
							<>
								<div style={S.divider} />
								<div style={S.chainInfoBox}>
									{propertyDetails?.chainPropertyId && (
										<div style={S.chainInfoRow}>
											<span style={S.chainInfoKey}>Chain Property ID</span>
											<span style={S.chainInfoVal}>{propertyDetails.chainPropertyId}</span>
										</div>
									)}
									{propertyDetails?.ownerWallet && (
										<div style={{ ...S.chainInfoRow, marginTop: 4 }}>
											<span style={S.chainInfoKey}>Current Owner Wallet</span>
											<span style={S.chainInfoVal}>{propertyDetails.ownerWallet}</span>
										</div>
									)}
								</div>
							</>
						)}

						<div style={S.divider} />

						{/* Transaction Status */}
						{txStatus && (
							<div style={S.statusBar(txStatus)}>
								<span style={S.statusDot(txStatus)} />
								<span style={S.statusLabel(txStatus)}>
									Transaction status: <strong>{txStatus}</strong>
								</span>
								{txHash && <span style={S.txHash}>Tx: {txHash}</span>}
							</div>
						)}

						{error && <p style={S.msgError}>{error}</p>}
						{success && <p style={S.msgSuccess}>{success}</p>}

						<button
							type="submit"
							className="lv-submit"
							style={S.submitBtn(loading)}
							disabled={loading}
						>
							{loading ? "Transferring..." : "Transfer Ownership"}
						</button>

						<p style={S.note}>
							MetaMask wallet connection required to sign the on-chain transaction.
						</p>
					</form>

					{/* Result Card */}
					{result && (
						<div style={S.resultCard}>
							<div style={S.resultLabel}>Transfer Confirmed</div>
							<div style={S.resultRow}>
								<span style={S.resultKey}>Property ID</span>
								<span style={S.resultVal}>{result?.property?._id || "—"}</span>
							</div>
							<div style={S.resultRow}>
								<span style={S.resultKey}>New Owner</span>
								<span style={S.resultVal}>
									{result?.property?.owner?.name || result?.property?.owner?._id || "—"}
								</span>
							</div>
							<div style={{ ...S.resultRow, borderBottom: "none" }}>
								<span style={S.resultKey}>Transaction ID</span>
								<span style={S.resultVal}>{result?.transaction?._id || "—"}</span>
							</div>
						</div>
					)}
				</main>
			</div>
		</>
	);
};

export default TransferPage;