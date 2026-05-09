import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import useWallet from "../hooks/useWallet";
import { toApiErrorMessage } from "../services/api";
import { registerPropertyOnChain } from "../services/blockchainService";
import { createProperty } from "../services/propertyService";
import { firstError, hasErrors, validatePropertyForm } from "../utils/validators";

const initialForm = {
	khasraNumber: "",
	surveyNumber: "",
	plotNumber: "",
	owner: "",
	location: "",
	area: "",
};

const styles = {
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
		marginBottom: 20,
	},
	card: {
		background: "#111827",
		border: "1px solid #1e2736",
		borderRadius: 10,
		padding: 20,
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
		gap: 12,
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
	fieldInput: {
		background: "#0d1117",
		border: "1px solid #1e2736",
		borderRadius: 6,
		padding: "9px 12px",
		fontFamily: "'IBM Plex Sans', sans-serif",
		fontSize: 13,
		color: "#c9d6e8",
		outline: "none",
		transition: "border-color 0.15s",
		width: "100%",
	},
	fieldInputError: {
		borderColor: "#3a1010",
	},
	fieldError: {
		fontSize: 11,
		color: "#e24b4a",
	},
	divider: {
		height: 1,
		background: "#1e2736",
		margin: "16px 0",
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
};

const RegisterProperty = () => {
	const navigate = useNavigate();
	const wallet = useWallet();
	const [form, setForm] = useState(initialForm);
	const [fieldErrors, setFieldErrors] = useState({});
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [txHash, setTxHash] = useState("");
	const [txStatus, setTxStatus] = useState("");

	const canSubmit = useMemo(() => !loading, [loading]);

	const updateField = (key) => (event) => {
		const nextValue = event.target.value;
		setForm((prev) => ({ ...prev, [key]: nextValue }));
		setFieldErrors((prev) => {
			if (!prev[key]) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		setTxHash("");
		setTxStatus("");

		const payload = {
			khasraNumber: form.khasraNumber.trim(),
			surveyNumber: form.surveyNumber.trim(),
			plotNumber: form.plotNumber.trim(),
			owner: form.owner.trim(),
			location: form.location.trim(),
			area: Number(form.area),
		};

		const errors = validatePropertyForm(payload);
		if (hasErrors(errors)) {
			setFieldErrors(errors);
			setError(firstError(errors) || "Please correct the form fields.");
			return;
		}

		if (!wallet.isConnected) {
			const connected = await wallet.connect();
			if (!connected?.account && !wallet.account) {
				setError("MetaMask wallet connection is required before registering property.");
				return;
			}
		}

		setLoading(true);
		try {
			const metadata = JSON.stringify({
				khasraNumber: payload.khasraNumber,
				surveyNumber: payload.surveyNumber,
				plotNumber: payload.plotNumber,
				location: payload.location,
				area: payload.area,
				mongoOwner: payload.owner,
			});

			setTxStatus("pending");
			const chainResult = await registerPropertyOnChain({ metadata, owner: wallet.account });
			const chainPropertyId = String(chainResult.chainPropertyId || "").trim();

			setTxHash(chainResult.txHash || "");
			setTxStatus("success");

			if (!chainPropertyId) {
				setSuccess("Property registered successfully on blockchain.");
				setError(
					"On-chain transaction is confirmed, but property ID could not be extracted from logs. Please refresh and check dashboard history."
				);
				return;
			}

			try {
				await createProperty({
					...payload,
					ownerWallet: wallet.account,
					chainPropertyId,
					chainTxHash: chainResult.txHash,
				});
				setSuccess("Property registered successfully");
			} catch (backendError) {
				setSuccess("Property registered successfully on blockchain.");
				setError(
					`On-chain transaction confirmed, but backend save failed: ${toApiErrorMessage(
						backendError,
						"Unable to save property in backend."
					)}`
				);
				return;
			}

			setForm(initialForm);
			setTimeout(() => navigate("/dashboard"), 900);
		} catch (err) {
			setTxStatus("failed");
			setError(toApiErrorMessage(err, "Failed to register property."));
		} finally {
			setLoading(false);
		}
	};

	const inputStyle = (key) => ({
		...styles.fieldInput,
		...(fieldErrors[key] ? styles.fieldInputError : {}),
	});

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
				@keyframes lv-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
				.lv-input:focus { border-color: #6b8cba !important; }
				.lv-input::placeholder { color: #2a3a52; }
				.lv-btn:hover:not(:disabled) { background: #1a2332 !important; border-color: #6b8cba !important; color: #9ab4d4 !important; }
			`}</style>

			<div style={styles.page}>
				<AppNav title="Register Property" />

				<main style={styles.main}>
					<div style={styles.pageLabel}>
						<span style={styles.pageLabelLine} />
						Property Registry
					</div>
					<h1 style={styles.pageTitle}>
						Register <span style={styles.pageTitleAccent}>Property</span>
					</h1>
					<p style={styles.pageDesc}>On-chain transaction first, backend cache second.</p>

					<form onSubmit={handleSubmit} style={styles.card}>
						{/* Row 1 */}
						<div style={styles.fieldRow}>
							<div style={styles.fieldGroup}>
								<label style={styles.fieldLabel}>Khasra Number</label>
								<input
									className="lv-input"
									style={inputStyle("khasraNumber")}
									type="text"
									placeholder="e.g. KH-2234"
									value={form.khasraNumber}
									onChange={updateField("khasraNumber")}
									required
								/>
								{fieldErrors.khasraNumber && (
									<small style={styles.fieldError}>{fieldErrors.khasraNumber}</small>
								)}
							</div>
							<div style={styles.fieldGroup}>
								<label style={styles.fieldLabel}>Survey Number</label>
								<input
									className="lv-input"
									style={inputStyle("surveyNumber")}
									type="text"
									placeholder="e.g. SV-089"
									value={form.surveyNumber}
									onChange={updateField("surveyNumber")}
									required
								/>
								{fieldErrors.surveyNumber && (
									<small style={styles.fieldError}>{fieldErrors.surveyNumber}</small>
								)}
							</div>
						</div>

						{/* Row 2 */}
						<div style={styles.fieldRow}>
							<div style={styles.fieldGroup}>
								<label style={styles.fieldLabel}>Plot Number</label>
								<input
									className="lv-input"
									style={inputStyle("plotNumber")}
									type="text"
									placeholder="e.g. PLT-412"
									value={form.plotNumber}
									onChange={updateField("plotNumber")}
									required
								/>
								{fieldErrors.plotNumber && (
									<small style={styles.fieldError}>{fieldErrors.plotNumber}</small>
								)}
							</div>
							<div style={styles.fieldGroup}>
								<label style={styles.fieldLabel}>Area (sq. ft.)</label>
								<input
									className="lv-input"
									style={inputStyle("area")}
									type="number"
									min="0.01"
									step="0.01"
									placeholder="e.g. 1250"
									value={form.area}
									onChange={updateField("area")}
									required
								/>
								{fieldErrors.area && (
									<small style={styles.fieldError}>{fieldErrors.area}</small>
								)}
							</div>
						</div>

						{/* Row 3 — Location full width */}
						<div style={styles.fieldRowFull}>
							<div style={styles.fieldGroup}>
								<label style={styles.fieldLabel}>Location</label>
								<input
									className="lv-input"
									style={inputStyle("location")}
									type="text"
									placeholder="e.g. Sector 14, Rithala, Delhi"
									value={form.location}
									onChange={updateField("location")}
									required
								/>
								{fieldErrors.location && (
									<small style={styles.fieldError}>{fieldErrors.location}</small>
								)}
							</div>
						</div>

						{/* Row 4 — Owner full width */}
						<div style={{ ...styles.fieldRowFull, marginBottom: 0 }}>
							<div style={styles.fieldGroup}>
								<label style={styles.fieldLabel}>Owner User ID (MongoDB)</label>
								<input
									className="lv-input"
									style={inputStyle("owner")}
									type="text"
									placeholder="e.g. 64f3a2bc9d1e8c0012a4f7e2"
									value={form.owner}
									onChange={updateField("owner")}
									required
								/>
								{fieldErrors.owner && (
									<small style={styles.fieldError}>{fieldErrors.owner}</small>
								)}
							</div>
						</div>

						<div style={styles.divider} />

						{/* Transaction Status */}
						{txStatus && (
							<div style={styles.statusBar(txStatus)}>
								<span style={styles.statusDot(txStatus)} />
								<span style={styles.statusLabel(txStatus)}>
									Transaction status: <strong>{txStatus}</strong>
								</span>
								{txHash && <span style={styles.txHash}>Tx: {txHash}</span>}
							</div>
						)}

						{/* Messages */}
						{error && <p style={styles.msgError}>{error}</p>}
						{success && <p style={styles.msgSuccess}>{success}</p>}

						<button
							type="submit"
							className="lv-btn"
							style={styles.submitBtn(loading)}
							disabled={!canSubmit}
						>
							{loading ? "Processing..." : "Register Property"}
						</button>

						<p style={styles.note}>
							MetaMask wallet connection required to sign the transaction.
						</p>
					</form>
				</main>
			</div>
		</>
	);
};

export default RegisterProperty;