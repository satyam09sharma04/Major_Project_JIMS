import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getAllProperties } from "../services/propertyService";

const getRiskMeta = (score) => {
	if (typeof score !== "number") {
		return { label: "Not Verified", color: "#64748b", bg: "#e2e8f0" };
	}

	if (score >= 80) {
		return { label: "Low Risk", color: "#065f46", bg: "#d1fae5" };
	}

	if (score >= 50) {
		return { label: "Medium Risk", color: "#92400e", bg: "#fef3c7" };
	}

	return { label: "High Risk", color: "#7f1d1d", bg: "#fee2e2" };
};

const AdminPanel = () => {
	const [rows, setRows] = useState([]);
	const [search, setSearch] = useState("");
	const [riskFilter, setRiskFilter] = useState("all");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selected, setSelected] = useState(null);

	const fetchPropertyRiskSummary = async (propertyId) => {
		const { data } = await api.get(`/documents/property/${propertyId}`);
		const documents = data?.data ?? [];
		const latestVerified = documents.find((doc) => typeof doc?.verification?.riskScore === "number");

		return {
			documentsCount: documents.length,
			latestRiskScore: latestVerified?.verification?.riskScore ?? null,
			latestRiskLevel: latestVerified?.verification?.riskLevel ?? null,
			latestVerificationStatus: latestVerified?.verification?.status ?? "PENDING",
			latestVerificationSummary: latestVerified?.verification?.summary ?? "No verification summary",
		};
	};

	const fetchPropertyHistory = async (propertyId) => {
		const { data } = await api.get(`/history/${propertyId}`);
		return data?.data?.timeline ?? [];
	};

	const loadAdminData = async () => {
		setLoading(true);
		setError("");

		try {
			const response = await getAllProperties();
			const properties = response?.data ?? [];

			const withVerification = await Promise.all(
				properties.map(async (property) => {
					try {
						const verification = await fetchPropertyRiskSummary(property._id);
						return {
							...property,
							...verification,
						};
					} catch {
						return {
							...property,
							documentsCount: 0,
							latestRiskScore: null,
							latestRiskLevel: null,
							latestVerificationStatus: "FAILED",
							latestVerificationSummary: "Could not fetch verification data",
						};
					}
				})
			);

			setRows(withVerification);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to load admin data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAdminData();
	}, []);

	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();

		return rows.filter((item) => {
			const matchesSearch =
				query.length === 0
					? true
					: [
							item.khasraNumber,
							item.surveyNumber,
							item.plotNumber,
							item.location,
							item.owner?.name,
							item.owner?.email,
						]
							.filter(Boolean)
							.some((value) => String(value).toLowerCase().includes(query));

			const score = item.latestRiskScore;
			const matchesRisk =
				riskFilter === "all"
					? true
					: riskFilter === "unverified"
						? typeof score !== "number"
						: riskFilter === "low"
							? typeof score === "number" && score >= 80
							: riskFilter === "medium"
								? typeof score === "number" && score >= 50 && score < 80
								: typeof score === "number" && score < 50;

			return matchesSearch && matchesRisk;
		});
	}, [rows, search, riskFilter]);

	const openPropertyDetails = async (row) => {
		setSelected({ ...row, timeline: [], timelineLoading: true });

		try {
			const timeline = await fetchPropertyHistory(row._id);
			setSelected({ ...row, timeline, timelineLoading: false });
		} catch {
			setSelected({ ...row, timeline: [], timelineLoading: false });
		}
	};

	return (
		<main style={{ maxWidth: 1200, margin: "32px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
			<header style={{ marginBottom: 20 }}>
				<h1 style={{ marginBottom: 8 }}>Admin Review Panel</h1>
				<p style={{ margin: 0, color: "#475569" }}>
					Review property records, document verification status, and ownership history from one place.
				</p>
			</header>

			<section
				style={{
					display: "grid",
					gridTemplateColumns: "1fr auto auto",
					gap: 12,
					marginBottom: 16,
				}}
			>
				<input
					type="text"
					placeholder="Search by khasra, survey, plot, owner, location"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				<select
					value={riskFilter}
					onChange={(event) => setRiskFilter(event.target.value)}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				>
					<option value="all">All Risk Levels</option>
					<option value="high">High Risk</option>
					<option value="medium">Medium Risk</option>
					<option value="low">Low Risk</option>
					<option value="unverified">Not Verified</option>
				</select>
				<button
					type="button"
					onClick={loadAdminData}
					style={{
						padding: "10px 14px",
						borderRadius: 8,
						border: "1px solid #0f172a",
						background: "#0f172a",
						color: "#ffffff",
						cursor: "pointer",
					}}
				>
					Refresh
				</button>
			</section>

			{error ? (
				<p style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</p>
			) : null}

			{loading ? (
				<p>Loading admin data...</p>
			) : (
				<div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10, background: "#ffffff" }}>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead style={{ background: "#f8fafc" }}>
							<tr>
								<th style={{ padding: 12, textAlign: "left" }}>Property</th>
								<th style={{ padding: 12, textAlign: "left" }}>Owner</th>
								<th style={{ padding: 12, textAlign: "left" }}>Verification</th>
								<th style={{ padding: 12, textAlign: "left" }}>Documents</th>
								<th style={{ padding: 12, textAlign: "left" }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.map((row) => {
								const riskMeta = getRiskMeta(row.latestRiskScore);
								return (
									<tr key={row._id} style={{ borderTop: "1px solid #f1f5f9" }}>
										<td style={{ padding: 12 }}>
											<div style={{ fontWeight: 600 }}>{row.khasraNumber}</div>
											<div style={{ color: "#475569", fontSize: 13 }}>
												Survey: {row.surveyNumber} | Plot: {row.plotNumber}
											</div>
											<div style={{ color: "#64748b", fontSize: 13 }}>{row.location}</div>
										</td>
										<td style={{ padding: 12 }}>
											<div>{row.owner?.name || "Unknown owner"}</div>
											<div style={{ color: "#64748b", fontSize: 13 }}>{row.owner?.email || "-"}</div>
										</td>
										<td style={{ padding: 12 }}>
											<span
												style={{
													padding: "4px 8px",
													borderRadius: 999,
													background: riskMeta.bg,
													color: riskMeta.color,
													fontWeight: 600,
													fontSize: 12,
												}}
											>
												{riskMeta.label}
											</span>
											<div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
												Score: {typeof row.latestRiskScore === "number" ? row.latestRiskScore : "-"}
											</div>
										</td>
										<td style={{ padding: 12 }}>{row.documentsCount}</td>
										<td style={{ padding: 12 }}>
											<button
												type="button"
												onClick={() => openPropertyDetails(row)}
												style={{
													padding: "8px 12px",
													borderRadius: 8,
													border: "1px solid #cbd5e1",
													background: "#ffffff",
													cursor: "pointer",
												}}
											>
												Inspect
											</button>
										</td>
									</tr>
								);
							})}
							{filteredRows.length === 0 ? (
								<tr>
									<td style={{ padding: 16, color: "#64748b" }} colSpan={5}>
										No properties found for the selected filters.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			)}

			{selected ? (
				<section
					style={{
						marginTop: 20,
						padding: 16,
						border: "1px solid #e2e8f0",
						borderRadius: 10,
						background: "#ffffff",
					}}
				>
					<h2 style={{ marginTop: 0, marginBottom: 8 }}>Property Inspection</h2>
					<p style={{ marginTop: 0, color: "#475569" }}>{selected.latestVerificationSummary}</p>
					<h3 style={{ marginBottom: 8 }}>Ownership Timeline</h3>
					{selected.timelineLoading ? (
						<p>Loading timeline...</p>
					) : selected.timeline.length === 0 ? (
						<p style={{ color: "#64748b" }}>No transfer events found.</p>
					) : (
						<ul style={{ paddingLeft: 20, marginBottom: 0 }}>
							{selected.timeline.map((event, index) => (
								<li key={`${event.transactionId || event.timestamp}-${index}`} style={{ marginBottom: 8 }}>
									<strong>{event.eventType}</strong> | {new Date(event.timestamp).toLocaleString()}
								</li>
							))}
						</ul>
					)}
				</section>
			) : null}
		</main>
	);
};

export default AdminPanel;
