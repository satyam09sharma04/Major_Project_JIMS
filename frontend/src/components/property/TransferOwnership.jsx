import { useEffect, useMemo, useState } from "react";
import AlertBanner from "../common/AlertBanner";
import Loader from "../common/Loader";
import { toApiErrorMessage } from "../../services/api";
import { transferOwnership } from "../../services/transferService";

const TransferOwnership = ({
	defaultPropertyId = "",
	onTransferSuccess,
	onCancel,
	title = "Transfer Ownership",
	submitLabel = "Transfer Ownership",
}) => {
	const [propertyId, setPropertyId] = useState(defaultPropertyId);
	const [newOwnerId, setNewOwnerId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [result, setResult] = useState(null);

	useEffect(() => {
		setPropertyId(defaultPropertyId || "");
	}, [defaultPropertyId]);

	const canSubmit = useMemo(() => {
		return propertyId.trim() && newOwnerId.trim() && !loading;
	}, [propertyId, newOwnerId, loading]);

	const resetMessages = () => {
		setError("");
		setSuccess("");
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		resetMessages();
		setResult(null);

		if (!propertyId.trim() || !newOwnerId.trim()) {
			setError("Property ID and New Owner ID are required.");
			return;
		}

		setLoading(true);

		try {
 			const response = await transferOwnership({
				propertyId: propertyId.trim(),
				newOwnerId: newOwnerId.trim(),
			});

			const payload = response?.data || null;
			setResult(payload);
			setSuccess("Property ownership transferred successfully.");
			setNewOwnerId("");
			onTransferSuccess?.(payload, response);
		} catch (err) {
			setError(toApiErrorMessage(err, "Failed to transfer ownership."));
		} finally {
			setLoading(false);
		}
	};

	return (
		<section
			style={{
				border: "1px solid #e2e8f0",
				borderRadius: 12,
				padding: 16,
				background: "#ffffff",
				fontFamily: "sans-serif",
			}}
		>
			<h3 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h3>
			<p style={{ marginTop: 0, color: "#64748b", fontSize: 14 }}>
				Transfer a property to a new owner by entering their user ID.
			</p>

			<form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
				<input
					type="text"
					placeholder="Property ID"
					value={propertyId}
					onChange={(event) => setPropertyId(event.target.value)}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<input
					type="text"
					placeholder="New Owner User ID"
					value={newOwnerId}
					onChange={(event) => setNewOwnerId(event.target.value)}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
					<button
						type="submit"
						disabled={!canSubmit}
						style={{
							padding: "10px 14px",
							borderRadius: 8,
							border: "1px solid #0f172a",
							background: canSubmit ? "#0f172a" : "#94a3b8",
							color: "#ffffff",
							cursor: canSubmit ? "pointer" : "not-allowed",
						}}
					>
						{submitLabel}
					</button>

					{onCancel ? (
						<button
							type="button"
							onClick={onCancel}
							style={{
								padding: "10px 14px",
								borderRadius: 8,
								border: "1px solid #cbd5e1",
								background: "#ffffff",
								cursor: "pointer",
							}}
						>
							Cancel
						</button>
					) : null}

					{loading ? <Loader inline size="sm" label="Transferring..." /> : null}
				</div>
			</form>

			{error ? (
				<div style={{ marginTop: 10 }}>
					<AlertBanner variant="error" message={error} dismissible onClose={() => setError("")} />
				</div>
			) : null}

			{success ? (
				<div style={{ marginTop: 10 }}>
					<AlertBanner variant="success" message={success} dismissible onClose={() => setSuccess("")} />
				</div>
			) : null}

			{result ? (
				<div
					style={{
						marginTop: 12,
						border: "1px solid #e2e8f0",
						borderRadius: 10,
						padding: 12,
						background: "#f8fafc",
						color: "#334155",
						fontSize: 14,
					}}
				>
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
			) : null}
		</section>
	);
};

export default TransferOwnership;
