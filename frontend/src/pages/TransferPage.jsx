import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import useWallet from "../hooks/useWallet";
import { toApiErrorMessage } from "../services/api";
import { transferOwnershipOnChain } from "../services/blockchainService";
import { getPropertyById } from "../services/propertyService";
import { transferOwnership } from "../services/transferService";

const TransferPage = () => {
	const { propertyId: routePropertyId } = useParams();
	const wallet = useWallet();
	const [propertyId, setPropertyId] = useState(routePropertyId || "");
	const [newOwnerId, setNewOwnerId] = useState("");
	const [newOwnerWallet, setNewOwnerWallet] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [result, setResult] = useState(null);
	const [propertyDetails, setPropertyDetails] = useState(null);
	const [txHash, setTxHash] = useState("");
	const [txStatus, setTxStatus] = useState("");

	useEffect(() => {
		setPropertyId(routePropertyId || "");
	}, [routePropertyId]);

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

	const handleTransfer = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		setResult(null);
		setTxHash("");
		setTxStatus("");

		if (!propertyId.trim() || !newOwnerId.trim() || !newOwnerWallet.trim()) {
			setError("Property ID, New Owner ID and New Owner Wallet are required.");
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
				newOwner: newOwnerWallet.trim(),
			});
			setTxHash(chainResult.txHash || "");
			setTxStatus("success");

			const response = await transferOwnership({
				propertyId,
				newOwnerId,
				newOwnerWallet: newOwnerWallet.trim(),
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

	return (
		<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
			<AppNav title="Transfer Ownership" />
			<main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
				<div style={{ marginBottom: 12 }}>
					<Link to="/dashboard">Back to Dashboard</Link>
				</div>
				<h1>Transfer Ownership</h1>
				<p style={{ color: "#475569" }}>First blockchain transfer, then backend cache sync.</p>

				<form onSubmit={handleTransfer} style={{ display: "grid", gap: 10, background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 10 }}>
					<input type="text" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Property ID (Mongo)" />
					<input type="text" value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)} placeholder="New Owner ID (Mongo)" />
					<input type="text" value={newOwnerWallet} onChange={(e) => setNewOwnerWallet(e.target.value)} placeholder="New Owner Wallet (0x...)" />

					{propertyDetails?.chainPropertyId ? <p style={{ margin: 0 }}>Chain Property ID: {propertyDetails.chainPropertyId}</p> : null}
					{txStatus ? <p style={{ margin: 0 }}>Transaction status: <strong>{txStatus}</strong></p> : null}
					{txHash ? <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>Tx Hash: {txHash}</p> : null}

					<button type="submit" disabled={loading}>{loading ? "Transferring..." : "Transfer Ownership"}</button>
				</form>

				{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
				{success ? <p style={{ color: "#166534" }}>{success}</p> : null}

				{result ? (
					<section style={{ marginTop: 12, background: "#fff", border: "1px solid #e2e8f0", padding: 12, borderRadius: 10 }}>
						<div><strong>Property ID:</strong> {result?.property?._id || "-"}</div>
						<div><strong>New Owner:</strong> {result?.property?.owner?.name || result?.property?.owner?._id || "-"}</div>
						<div><strong>Transaction ID:</strong> {result?.transaction?._id || "-"}</div>
					</section>
				) : null}
			</main>
		</div>
	);
};

export default TransferPage;
