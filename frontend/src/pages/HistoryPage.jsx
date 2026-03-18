import { useMemo, useState } from "react";
import api from "../services/api";

const formatDateTime = (value) => {
	if (!value) {
		return "-";
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return "-";
	}

	return parsed.toLocaleString();
};

const toDisplayOwner = (owner) => {
	if (!owner) {
		return "Unknown Owner";
	}

	if (typeof owner === "string") {
		return owner;
	}

	if (owner.name && owner.email) {
		return `${owner.name} (${owner.email})`;
	}

	return owner.name || owner.email || owner._id || "Unknown Owner";
};

const HistoryPage = () => {
	const [propertyId, setPropertyId] = useState("");
	const [historyData, setHistoryData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const timeline = useMemo(() => historyData?.timeline ?? [], [historyData]);

	const handleFetchHistory = async (event) => {
		event.preventDefault();
		const trimmedId = propertyId.trim();

		if (!trimmedId) {
			setError("Please enter a property ID.");
			setHistoryData(null);
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await api.get(`/history/${trimmedId}`);
			setHistoryData(response?.data?.data || null);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load history.");
			setHistoryData(null);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main style={{ maxWidth: 1000, margin: "32px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
			<header style={{ marginBottom: 18 }}>
				<h1 style={{ marginBottom: 6 }}>Ownership History</h1>
				<p style={{ margin: 0, color: "#475569" }}>
					View complete property ownership timeline including registration and transfer events.
				</p>
			</header>

			<section
				style={{
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 16,
					background: "#ffffff",
					marginBottom: 18,
				}}
			>
				<form onSubmit={handleFetchHistory} style={{ display: "grid", gap: 10 }}>
					<label htmlFor="propertyId" style={{ fontSize: 14, color: "#334155" }}>
						Property ID
					</label>
					<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
						<input
							id="propertyId"
							type="text"
							placeholder="Enter property ID"
							value={propertyId}
							onChange={(event) => setPropertyId(event.target.value)}
							style={{
								flex: 1,
								minWidth: 280,
								padding: 10,
								borderRadius: 8,
								border: "1px solid #cbd5e1",
							}}
						/>
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
							{loading ? "Fetching..." : "Get Timeline"}
						</button>
					</div>
				</form>

				{error ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{error}</p> : null}
			</section>

			{historyData ? (
				<>
					<section
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
							gap: 12,
							marginBottom: 16,
						}}
					>
						<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
							<div style={{ fontSize: 12, color: "#64748b" }}>Khasra Number</div>
							<div style={{ fontWeight: 700 }}>{historyData?.property?.khasraNumber || "-"}</div>
						</div>
						<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
							<div style={{ fontSize: 12, color: "#64748b" }}>Survey / Plot</div>
							<div style={{ fontWeight: 700 }}>
								{historyData?.property?.surveyNumber || "-"} / {historyData?.property?.plotNumber || "-"}
							</div>
						</div>
						<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
							<div style={{ fontSize: 12, color: "#64748b" }}>Current Owner</div>
							<div style={{ fontWeight: 700 }}>{toDisplayOwner(historyData?.property?.currentOwner)}</div>
						</div>
						<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
							<div style={{ fontSize: 12, color: "#64748b" }}>Total Transfers</div>
							<div style={{ fontWeight: 700 }}>{historyData?.totalTransfers ?? 0}</div>
						</div>
					</section>

					<section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#ffffff" }}>
						<h2 style={{ marginTop: 0 }}>Timeline Events</h2>
						{timeline.length === 0 ? (
							<p style={{ color: "#64748b" }}>No history events available.</p>
						) : (
							<div style={{ display: "grid", gap: 12 }}>
								{timeline.map((event, index) => {
									const isTransfer = event.eventType === "OWNERSHIP_TRANSFER";
									return (
										<article
											key={`${event.transactionId || event.timestamp}-${index}`}
											style={{
												border: "1px solid #f1f5f9",
												borderRadius: 10,
												padding: 12,
												background: isTransfer ? "#f8fafc" : "#f0fdf4",
											}}
										>
											<div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
												<strong>{event.eventType}</strong>
												<span style={{ color: "#64748b", fontSize: 13 }}>{formatDateTime(event.timestamp)}</span>
											</div>

											{isTransfer ? (
												<p style={{ marginBottom: 0 }}>
													From: {toDisplayOwner(event.fromOwner)}
													<br />
													To: {toDisplayOwner(event.toOwner)}
												</p>
											) : (
												<p style={{ marginBottom: 0 }}>{event.details || "Property record created"}</p>
											)}
										</article>
									);
								})}
							</div>
						)}
					</section>
				</>
			) : null}
		</main>
	);
};

export default HistoryPage;
