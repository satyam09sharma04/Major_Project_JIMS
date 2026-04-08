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
			if (!prev[key]) {
				return prev;
			}
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
			const chainResult = await registerPropertyOnChain({
				metadata,
				owner: wallet.account,
			});
			const chainPropertyId = String(chainResult.chainPropertyId || "").trim();
			if (!chainPropertyId) {
				throw new Error("Blockchain registration did not return chainPropertyId");
			}
			console.log(`[RegisterProperty] chainPropertyId: ${chainPropertyId}`);
			setTxHash(chainResult.txHash || "");
			setTxStatus("success");

			await createProperty({
				...payload,
				ownerWallet: wallet.account,
				chainPropertyId,
				chainTxHash: chainResult.txHash,
			});

			setSuccess("Property registered on-chain and cached in backend.");
			setForm(initialForm);
			setTimeout(() => navigate("/dashboard"), 900);
		} catch (err) {
			setTxStatus("failed");
			setError(toApiErrorMessage(err, "Failed to register property."));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
			<AppNav title="Register Property" />

			<main style={{ maxWidth: 760, margin: "20px auto", padding: "0 16px 20px" }}>
				<h1 style={{ marginBottom: 8 }}>Register Property</h1>
				<p style={{ marginTop: 0, color: "#475569" }}>On-chain transaction first, backend cache second.</p>

				<form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, background: "#fff", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
					<input type="text" placeholder="Khasra Number" value={form.khasraNumber} onChange={updateField("khasraNumber")} required />
					{fieldErrors.khasraNumber ? <small style={{ color: "#b91c1c" }}>{fieldErrors.khasraNumber}</small> : null}

					<input type="text" placeholder="Survey Number" value={form.surveyNumber} onChange={updateField("surveyNumber")} required />
					{fieldErrors.surveyNumber ? <small style={{ color: "#b91c1c" }}>{fieldErrors.surveyNumber}</small> : null}

					<input type="text" placeholder="Plot Number" value={form.plotNumber} onChange={updateField("plotNumber")} required />
					{fieldErrors.plotNumber ? <small style={{ color: "#b91c1c" }}>{fieldErrors.plotNumber}</small> : null}

					<input type="text" placeholder="Owner User ID (MongoDB)" value={form.owner} onChange={updateField("owner")} required />
					{fieldErrors.owner ? <small style={{ color: "#b91c1c" }}>{fieldErrors.owner}</small> : null}

					<input type="text" placeholder="Location" value={form.location} onChange={updateField("location")} required />
					{fieldErrors.location ? <small style={{ color: "#b91c1c" }}>{fieldErrors.location}</small> : null}

					<input type="number" min="0.01" step="0.01" placeholder="Area" value={form.area} onChange={updateField("area")} required />
					{fieldErrors.area ? <small style={{ color: "#b91c1c" }}>{fieldErrors.area}</small> : null}

					{txStatus ? <p style={{ margin: 0 }}>Transaction status: <strong>{txStatus}</strong></p> : null}
					{txHash ? <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>Tx Hash: {txHash}</p> : null}
					{error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
					{success ? <p style={{ color: "#166534", margin: 0 }}>{success}</p> : null}

					<button type="submit" disabled={!canSubmit}>{loading ? "Processing..." : "Register Property"}</button>
				</form>
			</main>
		</div>
	);
};

export default RegisterProperty;
