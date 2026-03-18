import { useState } from "react";
import api from "../services/api";

const TransferPage = () => {
	const [propertyId, setPropertyId] = useState("");
	const [newOwnerId, setNewOwnerId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [result, setResult] = useState(null);

	const handleTransfer = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		setResult(null);

		if (!propertyId.trim() || !newOwnerId.trim()) {
			setError("Property ID and New Owner ID are required.");
			return;
		}

		setLoading(true);

		try {
			const response = await api.post("/transfer", {
				propertyId: propertyId.trim(),
				newOwnerId: newOwnerId.trim(),
			});

			setResult(response?.data?.data || null);
			setSuccess("Ownership transferred successfully.");
			setPropertyId("");
			setNewOwnerId("");
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to transfer ownership.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
			<header style={{ marginBottom: 16 }}>
				<h1 style={{ marginBottom: 6 }}>Transfer Ownership</h1>
				<p style={{ margin: 0, color: "#475569" }}>
					Transfer a property from the current owner to another registered user.
				</p>
			</header>

			<section
				style={{
					background: "#ffffff",
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 16,
					marginBottom: 16,
				}}
			>
				<form onSubmit={handleTransfer} style={{ display: "grid", gap: 12 }}>
					<div style={{ display: "grid", gap: 6 }}>
						<label htmlFor="propertyId" style={{ fontSize: 14, color: "#334155" }}>
							Property ID
						</label>
						<input
							id="propertyId"
							type="text"
							value={propertyId}
							onChange={(event) => setPropertyId(event.target.value)}
							placeholder="Enter property ID"
							style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
						/>
					</div>

					<div style={{ display: "grid", gap: 6 }}>
						<label htmlFor="newOwnerId" style={{ fontSize: 14, color: "#334155" }}>
							New Owner ID
						</label>
						<input
							id="newOwnerId"
							type="text"
							value={newOwnerId}
							onChange={(event) => setNewOwnerId(event.target.value)}
							placeholder="Enter new owner user ID"
							style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						style={{
							padding: "10px 14px",
							borderRadius: 8,
							border: "1px solid #0f172a",
							background: "#0f172a",
							color: "#ffffff",
							cursor: loading ? "not-allowed" : "pointer",
						}}
					>
						{loading ? "Transferring..." : "Transfer Ownership"}
					</button>
				</form>

				{error ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{error}</p> : null}
				{success ? <p style={{ color: "#166534", marginTop: 10 }}>{success}</p> : null}
			</section>

			{result ? (
				<section
					style={{
						background: "#ffffff",
						border: "1px solid #e2e8f0",
						borderRadius: 12,
						padding: 16,
					}}
				>
					<h2 style={{ marginTop: 0, marginBottom: 10 }}>Transfer Result</h2>

					<div style={{ display: "grid", gap: 10 }}>
						<div>
							<strong>Property ID:</strong> {result?.property?._id || "-"}
						</div>
						<div>
							<strong>New Owner:</strong> {result?.property?.owner?.name || "Unknown"}
							{result?.property?.owner?.email ? ` (${result.property.owner.email})` : ""}
						</div>
						<div>
							<strong>Transfer Time:</strong>{" "}
							{result?.transaction?.transferredAt
								? new Date(result.transaction.transferredAt).toLocaleString()
								: "-"}
						</div>
						<div>
							<strong>Transaction ID:</strong> {result?.transaction?._id || "-"}
						</div>
					</div>
				</section>
			) : null}
		</main>
	);
};

export default TransferPage;
