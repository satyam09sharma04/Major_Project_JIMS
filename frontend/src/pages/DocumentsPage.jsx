import { useMemo, useState } from "react";
import api from "../services/api";

const badgeStyle = (score) => {
	if (typeof score !== "number") {
		return { background: "#e2e8f0", color: "#334155", label: "Not Verified" };
	}

	if (score >= 80) {
		return { background: "#dcfce7", color: "#166534", label: "Low Risk" };
	}

	if (score >= 50) {
		return { background: "#fef9c3", color: "#854d0e", label: "Medium Risk" };
	}

	return { background: "#fee2e2", color: "#991b1b", label: "High Risk" };
};

const DocumentsPage = () => {
	const [propertyId, setPropertyId] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [loadingDocs, setLoadingDocs] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [lastUploadRisk, setLastUploadRisk] = useState(null);

	const canUpload = propertyId.trim().length > 0 && selectedFile;

	const sortedDocuments = useMemo(
		() => [...documents].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
		[documents]
	);

	const fetchDocuments = async (targetPropertyId = propertyId) => {
		if (!targetPropertyId.trim()) {
			setError("Please enter property ID first.");
			return;
		}

		setLoadingDocs(true);
		setError("");
		setSuccess("");

		try {
			const response = await api.get(`/documents/property/${targetPropertyId.trim()}`);
			setDocuments(response?.data?.data || []);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to fetch documents.");
			setDocuments([]);
		} finally {
			setLoadingDocs(false);
		}
	};

	const handleUpload = async (event) => {
		event.preventDefault();
		if (!canUpload) {
			setError("Please provide property ID and choose a file.");
			return;
		}

		setUploading(true);
		setError("");
		setSuccess("");

		try {
			const formData = new FormData();
			formData.append("propertyId", propertyId.trim());
			formData.append("document", selectedFile);

			const response = await api.post("/documents/upload", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			const uploaded = response?.data?.data;
			setLastUploadRisk(response?.data?.riskScore ?? uploaded?.verification?.riskScore ?? null);
			setSuccess("Document uploaded and AI verification completed.");
			setSelectedFile(null);

			await fetchDocuments(propertyId.trim());
		} catch (err) {
			setError(err?.response?.data?.message || "Upload failed.");
		} finally {
			setUploading(false);
		}
	};

	return (
		<main style={{ maxWidth: 1050, margin: "32px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
			<h1 style={{ marginBottom: 6 }}>Documents Management</h1>
			<p style={{ marginTop: 0, color: "#475569" }}>
				Upload property documents, trigger OCR and AI verification, and review risk scores.
			</p>

			<section
				style={{
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 16,
					background: "#ffffff",
					marginBottom: 16,
				}}
			>
				<form onSubmit={handleUpload}>
					<div style={{ display: "grid", gap: 10 }}>
						<label htmlFor="propertyId" style={{ fontSize: 14, color: "#334155" }}>
							Property ID
						</label>
						<input
							id="propertyId"
							type="text"
							placeholder="Enter property ID"
							value={propertyId}
							onChange={(event) => setPropertyId(event.target.value)}
							style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
						/>

						<label htmlFor="document" style={{ fontSize: 14, color: "#334155" }}>
							Document (PDF/Image)
						</label>
						<input
							id="document"
							type="file"
							accept=".pdf,image/*"
							onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
						/>

						<div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
							<button
								type="submit"
								disabled={uploading || !canUpload}
								style={{
									padding: "10px 14px",
									borderRadius: 8,
									border: "1px solid #0f172a",
									background: "#0f172a",
									color: "#fff",
									cursor: uploading || !canUpload ? "not-allowed" : "pointer",
								}}
							>
								{uploading ? "Uploading..." : "Upload and Verify"}
							</button>
							<button
								type="button"
								onClick={() => fetchDocuments()}
								disabled={loadingDocs}
								style={{
									padding: "10px 14px",
									borderRadius: 8,
									border: "1px solid #cbd5e1",
									background: "#fff",
									cursor: loadingDocs ? "not-allowed" : "pointer",
								}}
							>
								{loadingDocs ? "Loading..." : "Fetch Documents"}
							</button>
						</div>
					</div>
				</form>

				{success ? <p style={{ color: "#166534", marginTop: 12 }}>{success}</p> : null}
				{error ? <p style={{ color: "#b91c1c", marginTop: 12 }}>{error}</p> : null}

				{typeof lastUploadRisk === "number" ? (
					<p style={{ marginTop: 10, color: "#0f172a" }}>
						Latest upload risk score: <strong>{lastUploadRisk}</strong>
					</p>
				) : null}
			</section>

			<section>
				<h2 style={{ marginBottom: 12 }}>Uploaded Documents</h2>
				{sortedDocuments.length === 0 ? (
					<p style={{ color: "#64748b" }}>No documents found for this property.</p>
				) : (
					<div style={{ display: "grid", gap: 12 }}>
						{sortedDocuments.map((doc) => {
							const score = doc?.verification?.riskScore;
							const badge = badgeStyle(score);
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
									<div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
										<div>
											<div style={{ fontWeight: 700 }}>{doc.fileName}</div>
											<div style={{ color: "#64748b", fontSize: 13 }}>{doc.fileType}</div>
										</div>
										<span
											style={{
												padding: "4px 10px",
												borderRadius: 999,
												fontSize: 12,
												fontWeight: 700,
												background: badge.background,
												color: badge.color,
											}}
										>
											{badge.label}
										</span>
									</div>

									<div style={{ marginTop: 10, fontSize: 14, color: "#334155" }}>
										<div>Risk Score: {typeof score === "number" ? score : "-"}</div>
										<div>Verification Status: {doc?.verification?.status || "PENDING"}</div>
										<div>
											Match Percentage: {typeof doc?.verification?.matchPercentage === "number" ? doc.verification.matchPercentage : "-"}
											%
										</div>
										{doc?.verification?.summary ? (
											<div style={{ marginTop: 6, color: "#475569" }}>Summary: {doc.verification.summary}</div>
										) : null}
									</div>
								</article>
							);
						})}
					</div>
				)}
			</section>
		</main>
	);
};

export default DocumentsPage;
