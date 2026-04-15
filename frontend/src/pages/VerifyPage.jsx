import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import { toApiErrorMessage } from "../services/api";
import { getDocumentsByPropertyId, verifyDocumentById } from "../services/documentService";

const VerifyPage = () => {
	const { propertyId: routePropertyId } = useParams();
	const [propertyId, setPropertyId] = useState(routePropertyId || "");
	const [query, setQuery] = useState("");
	const [documents, setDocuments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshingId, setRefreshingId] = useState("");
	const [error, setError] = useState("");
	const [info, setInfo] = useState("");

	useEffect(() => {
		setPropertyId(routePropertyId || "");
	}, [routePropertyId]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return documents;
		return documents.filter((doc) => {
			const content = [
				doc.fileName,
				doc.fileType,
				doc?.verification?.status,
				doc?.verification?.riskLevel,
				doc?.verification?.summary,
				...(doc?.verification?.flags || []),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return content.includes(q);
		});
	}, [documents, query]);

	const fetchDocuments = async (target = routePropertyId) => {
		const pid = String(target || "").trim();
		if (!pid) return;

		setLoading(true);
		setError("");
		setInfo("");
		try {
			const response = await getDocumentsByPropertyId(pid);
			const list = response?.data || [];
			setDocuments(list);
			setInfo(`Loaded ${list.length} document(s).`);
		} catch (err) {
			setError(toApiErrorMessage(err, "Failed to load documents for verification."));
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDocuments(routePropertyId).catch(() => {});
	}, [routePropertyId]);

	const rerun = async (documentId) => {
		setRefreshingId(documentId);
		setError("");
		setInfo("");
		try {
			await verifyDocumentById(documentId);
			await fetchDocuments(propertyId);
			setInfo("Verification completed.");
		} catch (err) {
			setError(toApiErrorMessage(err, "Failed to rerun verification."));
		} finally {
			setRefreshingId("");
		}
	};

	return (
		<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
			<AppNav title="Verify Documents" />
			<main style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
				<div style={{ marginBottom: 12 }}>
					<Link to="/dashboard">Back to Dashboard</Link>
				</div>

				<h1>Verification</h1>
				<p style={{ color: "#475569" }}>Property ID: {routePropertyId}</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						fetchDocuments(propertyId).catch(() => {});
					}}
					style={{ display: "grid", gap: 8, marginBottom: 12 }}
				>
					<input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="Property ID" />
					<div style={{ display: "flex", gap: 8 }}>
						<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter documents" style={{ flex: 1 }} />
						<button type="submit" disabled={loading}>{loading ? "Loading..." : "Load"}</button>
					</div>
				</form>

				{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
				{info ? <p style={{ color: "#166534" }}>{info}</p> : null}

				<section style={{ display: "grid", gap: 10 }}>
					{filtered.map((doc) => (
						<article key={doc._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
							<div><strong>{doc.fileName}</strong></div>
							<div>Status: {doc?.verification?.status || "PENDING"}</div>
							<div>Risk: {typeof doc?.verification?.riskScore === "number" ? doc.verification.riskScore : "-"}</div>
							<div>Level: {doc?.verification?.riskLevel || "-"}</div>
							<div>Summary: {doc?.verification?.summary || "-"}</div>
							<button type="button" onClick={() => rerun(doc._id)} disabled={refreshingId === doc._id}>
								{refreshingId === doc._id ? "Running..." : "Run Verification Again"}
							</button>
						</article>
					))}
				</section>
			</main>
		</div>
	);
};

export default VerifyPage;
// lund dhaar

