

import { useMemo, useState } from "react";
import api from "../services/api";

const getRiskBadge = (score) => {
	if (typeof score !== "number") {
		return { label: "Not Verified", bg: "#e2e8f0", color: "#334155" };
	}

	if (score >= 80) {
		return { label: "Low Risk", bg: "#dcfce7", color: "#166534" };
	}

	if (score >= 50) {
		return { label: "Medium Risk", bg: "#fef9c3", color: "#854d0e" };
	}

	return { label: "High Risk", bg: "#fee2e2", color: "#991b1b" };
};

const VerifyPage = () => {
	const [propertyId, setPropertyId] = useState("");
	const [query, setQuery] = useState("");
	const [documents, setDocuments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshingId, setRefreshingId] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");

	const filteredDocuments = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) {
			return documents;
		}

		return documents.filter((doc) => {
			const fields = [
				doc.fileName,
				doc.fileType,
				doc.verification?.status,
				doc.verification?.riskLevel,
				doc.verification?.summary,
				...(doc.verification?.flags || []),
			];

			return fields
				.filter(Boolean)
				.some((value) => String(value).toLowerCase().includes(normalized));
		});
	}, [documents, query]);

	const fetchDocuments = async (event) => {
		event.preventDefault();
		const trimmed = propertyId.trim();

		if (!trimmed) {
			setError("Please enter property ID.");
			setDocuments([]);
			return;
		}

		setLoading(true);
		setError("");
		setInfo("");

		try {
			const response = await api.get(`/documents/property/${trimmed}`);
			const list = response?.data?.data || [];
			setDocuments(list);
			setInfo(`Loaded ${list.length} document(s).`);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load documents for verification.");
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	};

	const reRunVerification = async (documentId) => {
		if (!documentId) {
			return;
		}

		setRefreshingId(documentId);
		setError("");
		setInfo("");

		try {
			await api.post(`/verify/${documentId}`);
			setInfo("Verification re-run completed.");

			const response = await api.get(`/documents/property/${propertyId.trim()}`);
			setDocuments(response?.data?.data || []);
		} catch (err) {
			if (err?.response?.status === 404) {
				setError("Verify endpoint is not mounted yet. Current page still shows stored verification results.");
			} else {
				setError(err?.response?.data?.message || "Failed to re-run verification.");
			}
		} finally {
			setRefreshingId("");
		}
	};

	return (
		<main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
			<header style={{ marginBottom: 16 }}>
				<h1 style={{ marginBottom: 6 }}>AI Verification</h1>
				<p style={{ margin: 0, color: "#475569" }}>
					Review OCR extraction, AI matching, and risk scores for uploaded property documents.
				</p>
			</header>

			<section
				style={{
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 16,
					background: "#ffffff",
					marginBottom: 14,
				}}
			>
				<form onSubmit={fetchDocuments} style={{ display: "grid", gap: 10 }}>
					<label htmlFor="propertyId" style={{ color: "#334155", fontSize: 14 }}>
						Property ID
					</label>
					<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
						<input
							id="propertyId"
							type="text"
							value={propertyId}
							onChange={(event) => setPropertyId(event.target.value)}
							placeholder="Enter property ID"
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
								color: "#fff",
								cursor: loading ? "not-allowed" : "pointer",
							}}
						>
							{loading ? "Loading..." : "Load Verification"}
						</button>
					</div>
				</form>

				{documents.length > 0 ? (
					<input
						type="text"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Filter by file/status/risk/summary"
						style={{ marginTop: 10, width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
					/>
				) : null}

				{error ? <p style={{ color: "#b91c1c", marginBottom: 0 }}>{error}</p> : null}
				{info ? <p style={{ color: "#166534", marginBottom: 0 }}>{info}</p> : null}
			</section>

			<section style={{ display: "grid", gap: 12 }}>
				{filteredDocuments.map((doc) => {
					const score = doc?.verification?.riskScore;
					const risk = getRiskBadge(score);

					return (
						<article
							key={doc._id}
							style={{
								border: "1px solid #e2e8f0",
								borderRadius: 12,
								padding: 14,
								background: "#ffffff",
							}}
						>
							<div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
								<div>
									<div style={{ fontWeight: 700 }}>{doc.fileName}</div>
									<div style={{ color: "#64748b", fontSize: 13 }}>{doc.fileType}</div>
								</div>
								<span
									style={{
										background: risk.bg,
										color: risk.color,
										padding: "4px 10px",
										borderRadius: 999,
										fontWeight: 700,
										fontSize: 12,
									}}
								>
									{risk.label}
								</span>
							</div>

							<div style={{ marginTop: 10, display: "grid", gap: 6, color: "#334155", fontSize: 14 }}>
								<div>Verification Status: {doc?.verification?.status || "PENDING"}</div>
								<div>Risk Score: {typeof score === "number" ? score : "-"}</div>
								<div>Risk Level: {doc?.verification?.riskLevel || "-"}</div>
								<div>
									Match Percentage: {typeof doc?.verification?.matchPercentage === "number" ? doc.verification.matchPercentage : "-"}%
								</div>
								<div>Summary: {doc?.verification?.summary || "No verification summary"}</div>
								{doc?.verification?.flags?.length ? <div>Flags: {doc.verification.flags.join(", ")}</div> : null}
								<div>
									Verified At:{" "}
									{doc?.verification?.verifiedAt ? new Date(doc.verification.verifiedAt).toLocaleString() : "-"}
								</div>
							</div>

							<div style={{ marginTop: 12 }}>
								<button
									type="button"
									onClick={() => reRunVerification(doc._id)}
									disabled={refreshingId === doc._id}
									style={{
										padding: "8px 12px",
										borderRadius: 8,
										border: "1px solid #cbd5e1",
										background: "#fff",
										cursor: refreshingId === doc._id ? "not-allowed" : "pointer",
									}}
								>
									{refreshingId === doc._id ? "Re-verifying..." : "Run Verification Again"}
								</button>
							</div>
						</article>
					);
				})}

				{!loading && filteredDocuments.length === 0 ? (
					<p style={{ color: "#64748b" }}>No documents to verify. Load a property ID first.</p>
				) : null}
			</section>
		</main>
	);
};

export default VerifyPage;
