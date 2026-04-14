import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import { toApiErrorMessage } from "../services/api";
import { getDocumentsByPropertyId, uploadDocument } from "../services/documentService";

const DocumentsPage = () => {
	const { propertyId: routePropertyId } = useParams();
	const [propertyId, setPropertyId] = useState(routePropertyId || "");
	const [selectedFile, setSelectedFile] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [loadingDocs, setLoadingDocs] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		setPropertyId(routePropertyId || "");
	}, [routePropertyId]);

	const sortedDocuments = useMemo(
		() => [...documents].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
		[documents]
	);

	const fetchDocuments = async (targetPropertyId = propertyId) => {
		const pid = String(targetPropertyId || "").trim();
		if (!pid) return;

		setLoadingDocs(true);
		setError("");
		try {
			const response = await getDocumentsByPropertyId(pid);
			setDocuments(response?.data || []);
		} catch (err) {
			setError(toApiErrorMessage(err, "Failed to fetch documents."));
			setDocuments([]);
		} finally {
			setLoadingDocs(false);
		}
	};

	useEffect(() => {
		fetchDocuments(routePropertyId).catch(() => {});
	}, [routePropertyId]);

	const handleUpload = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		if (!propertyId.trim() || !selectedFile) {
			setError("Please provide property ID and choose a file.");
			return;
		}

		setUploading(true);
		try {
			const response = await uploadDocument({ propertyId, file: selectedFile });
			const risk = response?.meta?.riskScore;
			setSuccess(
				typeof risk === "number"
					? `Document uploaded and verified. Risk score: ${risk}`
					: "Document uploaded and verified successfully."
			);
			setSelectedFile(null);
			await fetchDocuments(propertyId);
		} catch (err) {
			setError(toApiErrorMessage(err, "Upload failed."));
		} finally {
			setUploading(false);
		}
	};

	return (
		<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
			<AppNav title="Documents" />
			<main style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
				<div style={{ marginBottom: 12 }}>
					<Link to="/dashboard">Back to Dashboard</Link>
				</div>

				<h1>Documents for Property</h1>
				<p style={{ color: "#475569" }}>Property ID: {routePropertyId}</p>

				<form onSubmit={handleUpload} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: 16, borderRadius: 10 }}>
					<div style={{ display: "grid", gap: 10 }}>
						<input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Property ID" />
						<input type="file" accept=".pdf,image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
						<div style={{ display: "flex", gap: 8 }}>
							<button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload Document"}</button>
							<button type="button" onClick={() => fetchDocuments()} disabled={loadingDocs}>{loadingDocs ? "Loading..." : "Refresh"}</button>
						</div>
					</div>
				</form>

				{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
				{success ? <p style={{ color: "#166534" }}>{success}</p> : null}

				<section style={{ marginTop: 14, display: "grid", gap: 10 }}>
					{sortedDocuments.map((doc) => (
						<article key={doc._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
							<div><strong>{doc.fileName}</strong></div>
							<div style={{ color: "#64748b", fontSize: 13 }}>{doc.fileType}</div>
							<div>Status: {doc?.verification?.status || "PENDING"}</div>
							<div>Risk Score: {typeof doc?.verification?.riskScore === "number" ? doc.verification.riskScore : "-"}</div>
							<div>Risk Level: {doc?.verification?.riskLevel || "-"}</div>
							{doc?.fileUrl ? (
								<div style={{ display: "flex", gap: 10, marginTop: 8 }}>
									<a href={doc.fileUrl} target="_blank" rel="noreferrer">Open</a>
									<a href={doc.fileUrl} download>Download</a>
								</div>
							) : null}
						</article>
					))}

					{!loadingDocs && sortedDocuments.length === 0 ? (
						<p style={{ color: "#64748b" }}>No documents found.</p>
					) : null}
				</section>
			</main>
		</div>
	);
};

export default DocumentsPage;
