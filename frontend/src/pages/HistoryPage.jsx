import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import api, { toApiErrorMessage } from "../services/api";
import { getHistoryFromChain } from "../services/blockchainService";
import { getPropertyById } from "../services/propertyService";

const formatDate = (value) => {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const HistoryPage = () => {
	const { propertyId: routePropertyId } = useParams();
	const [propertyData, setPropertyData] = useState(null);
	const [timeline, setTimeline] = useState([]);
	const [source, setSource] = useState("-");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const load = async () => {
		if (!routePropertyId) return;

		setLoading(true);
		setError("");
		try {
			const propertyResp = await getPropertyById(routePropertyId);
			const property = propertyResp?.data || null;
			setPropertyData(property);

			const chainPropertyId = Number(property?.chainPropertyId);
			if (Number.isFinite(chainPropertyId)) {
				const chainHistory = await getHistoryFromChain(chainPropertyId);
				setTimeline(
					chainHistory.map((item) => ({
						eventType: item.action,
						timestamp: item.timestamp ? new Date(item.timestamp * 1000).toISOString() : null,
						details: item.details,
						actor: item.actor,
						recordId: item.recordId,
					}))
				);
				setSource("blockchain");
				return;
			}

			throw new Error("Chain property id missing");
		} catch (chainErr) {
			try {
				const fallback = await api.get(`/history/${routePropertyId}`);
				setTimeline(fallback?.data?.data?.timeline || []);
				setSource("database-fallback");
			} catch (err) {
				setError(toApiErrorMessage(err, toApiErrorMessage(chainErr, "Failed to load history.")));
				setTimeline([]);
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load().catch(() => {});
	}, [routePropertyId]);

	return (
		<div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
			<AppNav title="Property History" />
			<main style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
				<div style={{ marginBottom: 12 }}>
					<Link to="/dashboard">Back to Dashboard</Link>
				</div>

				<h1>Ownership History</h1>
				<p style={{ color: "#475569" }}>Property ID: {routePropertyId}</p>
				<p style={{ color: "#0f766e" }}>Source: {source}</p>
				{propertyData?.chainPropertyId ? <p>Chain Property ID: {propertyData.chainPropertyId}</p> : null}

				<button type="button" onClick={() => load().catch(() => {})} disabled={loading}>
					{loading ? "Loading..." : "Refresh Timeline"}
				</button>

				{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

				<section style={{ display: "grid", gap: 10, marginTop: 12 }}>
					{timeline.map((item, index) => (
						<article key={`${item.recordId || index}`} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
							<div><strong>{item.eventType || "EVENT"}</strong></div>
							<div>{formatDate(item.timestamp)}</div>
							{item.actor ? <div>Actor: {item.actor}</div> : null}
							<div>{item.details || "-"}</div>
						</article>
					))}

					{!loading && timeline.length === 0 ? <p style={{ color: "#64748b" }}>No history records found.</p> : null}
				</section>
			</main>
		</div>
	);
};

export default HistoryPage;
