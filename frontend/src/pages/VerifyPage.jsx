import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import { toApiErrorMessage } from "../services/api";
import { getDocumentsByPropertyId, verifyDocumentById } from "../services/documentService";

const S = {
	page: {
		minHeight: "100vh",
		background: "#0d1117",
		fontFamily: "'IBM Plex Sans', sans-serif",
	},
	main: {
		maxWidth: 760,
		margin: "0 auto",
		padding: "28px 20px 40px",
	},
	backLink: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: "#4a6282",
		textDecoration: "none",
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		marginBottom: 20,
		transition: "color 0.15s",
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
	pidBadge: {
		display: "inline-flex",
		alignItems: "center",
		gap: 6,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		color: "#4a6282",
		background: "#0d1117",
		border: "1px solid #1e2736",
		borderRadius: 6,
		padding: "4px 10px",
		marginBottom: 18,
	},
	searchCard: {
		background: "#111827",
		border: "1px solid #1e2736",
		borderRadius: 10,
		padding: 16,
		marginBottom: 16,
	},
	searchRow: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: 10,
		marginBottom: 10,
	},
	searchRowFull: {
		display: "flex",
		gap: 10,
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
		width: "100%",
		transition: "border-color 0.15s",
	},
	loadBtn: (loading) => ({
		padding: "9px 20px",
		background: "transparent",
		border: "1px solid #1e2736",
		borderRadius: 6,
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 11,
		letterSpacing: "0.08em",
		color: loading ? "#4a6282" : "#6b8cba",
		cursor: loading ? "not-allowed" : "pointer",
		textTransform: "uppercase",
		opacity: loading ? 0.5 : 1,
		whiteSpace: "nowrap",
		transition: "all 0.15s",
		flexShrink: 0,
	}),
	msgError: {
		background: "#1a0a0a",
		border: "1px solid #3a1010",
		borderRadius: 6,
		padding: "9px 12px",
		fontSize: 12,
		color: "#e24b4a",
		marginBottom: 12,
		fontFamily: "'IBM Plex Mono', monospace",
	},
	msgInfo: {
		background: "#041a12",
		border: "1px solid #085041",
		borderRadius: 6,
		padding: "9px 12px",
		fontSize: 12,
		color: "#1d9e75",
		marginBottom: 12,
		fontFamily: "'IBM Plex Mono', monospace",
	},
	docsGrid: {
		display: "grid",
		gap: 10,
	},
	docCard: (riskLevel) => {
		const borderColor =
			riskLevel === "HIGH"
				? "#791f1f"
				: riskLevel === "MEDIUM"
				? "#634200"
				: riskLevel === "LOW"
				? "#085041"
				: "#1e2736";
		return {
			background: "#111827",
			border: `1px solid ${borderColor}`,
			borderRadius: 10,
			padding: 16,
			transition: "border-color 0.2s",
		};
	},
	docHeader: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		marginBottom: 12,
		gap: 10,
	},
	docFileName: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 13,
		color: "#c9d6e8",
		fontWeight: 500,
		wordBreak: "break-all",
	},
	docFileType: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#4a6282",
		marginTop: 3,
	},
	riskBadge: (level) => {
		const map = {
			HIGH: { bg: "#1a0a0a", border: "#791f1f", color: "#e24b4a" },
			MEDIUM: { bg: "#1a1000", border: "#634200", color: "#EF9F27" },
			LOW: { bg: "#041a12", border: "#085041", color: "#1d9e75" },
		};
		const t = map[level] || { bg: "#0d1117", border: "#1e2736", color: "#4a6282" };
		return {
			display: "inline-flex",
			alignItems: "center",
			gap: 5,
			fontFamily: "'IBM Plex Mono', monospace",
			fontSize: 10,
			letterSpacing: "0.1em",
			textTransform: "uppercase",
			color: t.color,
			background: t.bg,
			border: `1px solid ${t.border}`,
			borderRadius: 5,
			padding: "4px 8px",
			flexShrink: 0,
		};
	},
	statusBadge: (status) => {
		const isVerified = status === "VERIFIED";
		const isPending = status === "PENDING" || !status;
		return {
			display: "inline-block",
			fontFamily: "'IBM Plex Mono', monospace",
			fontSize: 10,
			letterSpacing: "0.1em",
			textTransform: "uppercase",
			color: isVerified ? "#1d9e75" : isPending ? "#4a6282" : "#EF9F27",
			marginBottom: 2,
		};
	},
	docMeta: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: "6px 16px",
		marginBottom: 10,
	},
	metaRow: {
		display: "flex",
		flexDirection: "column",
		gap: 2,
	},
	metaKey: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 9,
		color: "#4a6282",
		textTransform: "uppercase",
		letterSpacing: "0.1em",
	},
	metaVal: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 12,
		color: "#9ab4d4",
	},
	summaryBox: {
		background: "#0d1117",
		border: "1px solid #1e2736",
		borderRadius: 6,
		padding: "8px 10px",
		fontFamily: "'IBM Plex Sans', sans-serif",
		fontSize: 12,
		color: "#6b8cba",
		lineHeight: 1.5,
		marginBottom: 12,
	},
	flagsList: {
		display: "flex",
		flexWrap: "wrap",
		gap: 6,
		marginBottom: 12,
	},
	flagChip: {
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		color: "#EF9F27",
		background: "#1a1000",
		border: "1px solid #634200",
		borderRadius: 4,
		padding: "3px 8px",
	},
	docDivider: {
		height: 1,
		background: "#1e2736",
		marginBottom: 12,
	},
	rerunBtn: (running) => ({
		background: "transparent",
		border: "1px solid #1e2736",
		borderRadius: 6,
		padding: "7px 14px",
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 10,
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		color: running ? "#4a6282" : "#6b8cba",
		cursor: running ? "not-allowed" : "pointer",
		opacity: running ? 0.5 : 1,
		transition: "all 0.15s",
	}),
	emptyState: {
		textAlign: "center",
		padding: "40px 20px",
		fontFamily: "'IBM Plex Mono', monospace",
		fontSize: 12,
		color: "#4a6282",
		background: "#111827",
		border: "1px solid #1e2736",
		borderRadius: 10,
	},
};

const riskDot = (level) => {
	const color =
		level === "HIGH" ? "#e24b4a" : level === "MEDIUM" ? "#EF9F27" : level === "LOW" ? "#1d9e75" : "#4a6282";
	return (
		<span
			style={{
				display: "inline-block",
				width: 6,
				height: 6,
				borderRadius: "50%",
				background: color,
				flexShrink: 0,
			}}
		/>
	);
};

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
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
				.lv-input:focus { border-color: #6b8cba !important; }
				.lv-input::placeholder { color: #2a3a52; }
				.lv-load:hover:not(:disabled) { background: #1a2332 !important; border-color: #6b8cba !important; color: #9ab4d4 !important; }
				.lv-rerun:hover:not(:disabled) { background: #1a2332 !important; border-color: #6b8cba !important; color: #9ab4d4 !important; }
				.lv-back:hover { color: #9ab4d4 !important; }
			`}</style>

			<div style={S.page}>
				<AppNav title="Verify Documents" />

				<main style={S.main}>
					<Link to="/dashboard" className="lv-back" style={S.backLink}>
						← Back to Dashboard
					</Link>

					<div style={S.pageLabel}>
						<span style={S.pageLabelLine} />
						Document Intelligence
					</div>
					<h1 style={S.pageTitle}>
						Document <span style={S.pageTitleAccent}>Verification</span>
					</h1>

					{routePropertyId && (
						<div style={S.pidBadge}>
							Property ID: {routePropertyId}
						</div>
					)}

					{/* Search / Load Card */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							fetchDocuments(propertyId).catch(() => {});
						}}
						style={S.searchCard}
					>
						<div style={S.searchRow}>
							<div style={S.fieldGroup}>
								<label style={S.fieldLabel}>Property ID</label>
								<input
									className="lv-input"
									style={S.fieldInput}
									value={propertyId}
									onChange={(e) => setPropertyId(e.target.value)}
									placeholder="e.g. 64f3a2bc9d1e8c0012..."
								/>
							</div>
							<div style={S.fieldGroup}>
								<label style={S.fieldLabel}>Filter Documents</label>
								<input
									className="lv-input"
									style={S.fieldInput}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search by name, status, risk..."
								/>
							</div>
						</div>
						<button
							type="submit"
							className="lv-load"
							style={S.loadBtn(loading)}
							disabled={loading}
						>
							{loading ? "Loading..." : "Load Documents"}
						</button>
					</form>

					{error && <p style={S.msgError}>{error}</p>}
					{info && <p style={S.msgInfo}>{info}</p>}

					{/* Documents */}
					<section style={S.docsGrid}>
						{filtered.length === 0 && !loading && (
							<div style={S.emptyState}>
								No documents found. Enter a property ID and click Load.
							</div>
						)}

						{filtered.map((doc) => {
							const riskLevel = doc?.verification?.riskLevel;
							const status = doc?.verification?.status || "PENDING";
							const flags = doc?.verification?.flags || [];
							const isRunning = refreshingId === doc._id;

							return (
								<article key={doc._id} style={S.docCard(riskLevel)}>
									{/* Header */}
									<div style={S.docHeader}>
										<div>
											<div style={S.docFileName}>{doc.fileName}</div>
											{doc.fileType && (
												<div style={S.docFileType}>{doc.fileType}</div>
											)}
										</div>
										{riskLevel && (
											<span style={S.riskBadge(riskLevel)}>
												{riskDot(riskLevel)}
												{riskLevel} Risk
											</span>
										)}
									</div>

									{/* Meta Grid */}
									<div style={S.docMeta}>
										<div style={S.metaRow}>
											<span style={S.metaKey}>Status</span>
											<span style={S.statusBadge(status)}>{status}</span>
										</div>
										<div style={S.metaRow}>
											<span style={S.metaKey}>Risk Score</span>
											<span style={S.metaVal}>
												{typeof doc?.verification?.riskScore === "number"
													? doc.verification.riskScore
													: "—"}
											</span>
										</div>
									</div>

									{/* Summary */}
									{doc?.verification?.summary && (
										<div style={S.summaryBox}>
											{doc.verification.summary}
										</div>
									)}

									{/* Flags */}
									{flags.length > 0 && (
										<div style={S.flagsList}>
											{flags.map((flag, i) => (
												<span key={i} style={S.flagChip}>
													⚑ {flag}
												</span>
											))}
										</div>
									)}

									<div style={S.docDivider} />

									<button
										type="button"
										className="lv-rerun"
										style={S.rerunBtn(isRunning)}
										onClick={() => rerun(doc._id)}
										disabled={isRunning}
									>
										{isRunning ? "Running Verification..." : "Run Verification Again"}
									</button>
								</article>
							);
						})}
					</section>
				</main>
			</div>
		</>
	);
};

export default VerifyPage;