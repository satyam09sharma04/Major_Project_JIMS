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

const EVENT_COLORS = {
	TRANSFER: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", dot: "#818cf8", label: "#818cf8" },
	REGISTER: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", dot: "#4ade80", label: "#4ade80" },
	VERIFY: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", dot: "#4ade80", label: "#4ade80" },
	UPDATE: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)", dot: "#facc15", label: "#facc15" },
	FLAG: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", dot: "#f87171", label: "#f87171" },
	DEFAULT: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", dot: "#64748b", label: "#94a3b8" },
};

const getEventStyle = (type = "") => {
	const key = type.toUpperCase().split("_")[0];
	return EVENT_COLORS[key] || EVENT_COLORS.DEFAULT;
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

	const sourceIsChain = source === "blockchain";

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap');

				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

				.hp-root {
					min-height: 100vh;
					background: #0d0f14;
					font-family: 'Inter', sans-serif;
					color: #e2e8f0;
				}

				.hp-main {
					max-width: 900px;
					margin: 0 auto;
					padding: 32px 24px 64px;
				}

				/* Back link */
				.hp-back {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					letter-spacing: 0.12em;
					text-transform: uppercase;
					color: rgba(255,255,255,0.3);
					text-decoration: none;
					margin-bottom: 32px;
					transition: color 0.2s;
				}
				.hp-back:hover { color: #818cf8; }

				/* Page header */
				.hp-header {
					margin-bottom: 32px;
					padding-bottom: 24px;
					border-bottom: 1px solid rgba(255,255,255,0.06);
				}
				.hp-eyebrow {
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					color: #6366f1;
					letter-spacing: 0.18em;
					text-transform: uppercase;
					margin-bottom: 12px;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.hp-eyebrow::before {
					content: '';
					display: inline-block;
					width: 20px; height: 1px;
					background: #6366f1;
				}
				.hp-title {
					font-size: 28px;
					font-weight: 300;
					color: #f1f5f9;
					letter-spacing: -0.02em;
					margin-bottom: 16px;
					line-height: 1.2;
				}
				.hp-title strong { font-weight: 600; color: #818cf8; }

				/* Meta badges */
				.hp-meta {
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					gap: 10px;
				}
				.hp-badge {
					display: inline-flex;
					align-items: center;
					gap: 6px;
					padding: 5px 12px;
					border-radius: 6px;
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					letter-spacing: 0.06em;
					border: 1px solid;
				}
				.hp-badge-id {
					background: rgba(99,102,241,0.08);
					border-color: rgba(99,102,241,0.2);
					color: #818cf8;
				}
				.hp-badge-chain {
					background: rgba(34,197,94,0.06);
					border-color: rgba(34,197,94,0.18);
					color: #4ade80;
				}
				.hp-badge-db {
					background: rgba(234,179,8,0.06);
					border-color: rgba(234,179,8,0.18);
					color: #facc15;
				}
				.hp-badge-dot {
					width: 6px; height: 6px;
					border-radius: 50%;
					background: currentColor;
					animation: badgePulse 2s ease-in-out infinite;
				}
				@keyframes badgePulse {
					0%,100% { opacity: 1; }
					50% { opacity: 0.4; }
				}

				/* Toolbar */
				.hp-toolbar {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 24px;
					gap: 12px;
					flex-wrap: wrap;
				}
				.hp-count {
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					color: rgba(255,255,255,0.25);
					letter-spacing: 0.1em;
					text-transform: uppercase;
				}
				.hp-count span { color: #818cf8; font-weight: 600; }

				.hp-refresh-btn {
					display: inline-flex;
					align-items: center;
					gap: 7px;
					padding: 9px 18px;
					background: linear-gradient(135deg, #6366f1, #8b5cf6);
					border: none;
					border-radius: 8px;
					color: #fff;
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					font-weight: 600;
					letter-spacing: 0.12em;
					text-transform: uppercase;
					cursor: pointer;
					transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
				}
				.hp-refresh-btn:not(:disabled):hover {
					transform: translateY(-1px);
					box-shadow: 0 6px 20px rgba(99,102,241,0.35);
				}
				.hp-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

				.hp-spinner {
					width: 13px; height: 13px;
					border: 2px solid rgba(255,255,255,0.25);
					border-top-color: #fff;
					border-radius: 50%;
					animation: spin 0.7s linear infinite;
				}
				@keyframes spin { to { transform: rotate(360deg); } }

				/* Error */
				.hp-error {
					display: flex;
					align-items: center;
					gap: 10px;
					background: rgba(239,68,68,0.06);
					border: 1px solid rgba(239,68,68,0.18);
					border-radius: 10px;
					padding: 14px 16px;
					color: #fca5a5;
					font-family: 'JetBrains Mono', monospace;
					font-size: 12px;
					margin-bottom: 20px;
				}

				/* Empty state */
				.hp-empty {
					text-align: center;
					padding: 64px 24px;
					border: 1px dashed rgba(255,255,255,0.07);
					border-radius: 14px;
					background: rgba(255,255,255,0.01);
				}
				.hp-empty-icon {
					font-size: 36px;
					margin-bottom: 16px;
					opacity: 0.4;
				}
				.hp-empty-text {
					font-family: 'JetBrains Mono', monospace;
					font-size: 12px;
					color: rgba(255,255,255,0.25);
					letter-spacing: 0.1em;
					text-transform: uppercase;
				}

				/* Timeline */
				.hp-timeline {
					position: relative;
					display: flex;
					flex-direction: column;
					gap: 0;
				}

				/* Vertical line */
				.hp-timeline::before {
					content: '';
					position: absolute;
					left: 18px;
					top: 28px;
					bottom: 28px;
					width: 1px;
					background: linear-gradient(to bottom, rgba(99,102,241,0.4), rgba(99,102,241,0.05));
				}

				.hp-event {
					display: flex;
					gap: 20px;
					padding: 0 0 20px;
					position: relative;
					animation: eventIn 0.4s ease forwards;
					opacity: 0;
				}
				.hp-event:nth-child(1) { animation-delay: 0.05s; }
				.hp-event:nth-child(2) { animation-delay: 0.1s; }
				.hp-event:nth-child(3) { animation-delay: 0.15s; }
				.hp-event:nth-child(4) { animation-delay: 0.2s; }
				.hp-event:nth-child(5) { animation-delay: 0.25s; }
				.hp-event:nth-child(n+6) { animation-delay: 0.3s; }
				@keyframes eventIn {
					from { opacity: 0; transform: translateX(-8px); }
					to   { opacity: 1; transform: translateX(0); }
				}

				/* Dot on timeline */
				.hp-event-dot-wrap {
					flex-shrink: 0;
					display: flex;
					flex-direction: column;
					align-items: center;
					padding-top: 14px;
				}
				.hp-event-dot {
					width: 10px; height: 10px;
					border-radius: 50%;
					border: 2px solid;
					flex-shrink: 0;
					background: #0d0f14;
					position: relative;
					z-index: 1;
					box-shadow: 0 0 10px currentColor;
				}

				.hp-event-card {
					flex: 1;
					border-radius: 12px;
					padding: 16px 18px;
					border: 1px solid;
					transition: transform 0.2s, box-shadow 0.2s;
				}
				.hp-event-card:hover {
					transform: translateX(4px);
				}

				.hp-event-top {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 8px;
					gap: 12px;
					flex-wrap: wrap;
				}
				.hp-event-type {
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					font-weight: 600;
					letter-spacing: 0.14em;
					text-transform: uppercase;
				}
				.hp-event-time {
					font-family: 'JetBrains Mono', monospace;
					font-size: 10px;
					color: rgba(255,255,255,0.25);
					letter-spacing: 0.06em;
				}

				.hp-event-detail {
					font-size: 13px;
					color: rgba(255,255,255,0.55);
					line-height: 1.6;
					font-weight: 300;
					margin-bottom: 8px;
				}

				.hp-event-meta {
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					gap: 8px;
					margin-top: 10px;
					padding-top: 10px;
					border-top: 1px solid rgba(255,255,255,0.04);
				}
				.hp-event-meta-item {
					display: flex;
					align-items: center;
					gap: 5px;
					font-family: 'JetBrains Mono', monospace;
					font-size: 10px;
					color: rgba(255,255,255,0.2);
					letter-spacing: 0.06em;
				}
				.hp-event-meta-item svg { opacity: 0.5; }

				/* Loading skeleton */
				.hp-skeleton-wrap { display: flex; flex-direction: column; gap: 16px; }
				.hp-skeleton {
					height: 90px;
					border-radius: 12px;
					background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
					background-size: 200% 100%;
					animation: shimmer 1.5s infinite;
				}
				@keyframes shimmer {
					0% { background-position: 200% 0; }
					100% { background-position: -200% 0; }
				}
			`}</style>

			<div className="hp-root">
				<AppNav title="Property History" />
				<main className="hp-main">
					<Link to="/dashboard" className="hp-back">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
						</svg>
						Back to Dashboard
					</Link>

					{/* Header */}
					<div className="hp-header">
						<div className="hp-eyebrow">Property Intelligence</div>
						<h1 className="hp-title">
							Ownership <strong>History</strong>
						</h1>
						<div className="hp-meta">
							<span className="hp-badge hp-badge-id">
								# {routePropertyId}
							</span>
							{propertyData?.chainPropertyId && (
								<span className="hp-badge hp-badge-id">
									Chain ID: {propertyData.chainPropertyId}
								</span>
							)}
							{source !== "-" && (
								<span className={`hp-badge ${sourceIsChain ? "hp-badge-chain" : "hp-badge-db"}`}>
									<span className="hp-badge-dot" />
									{sourceIsChain ? "Blockchain" : "DB Fallback"}
								</span>
							)}
						</div>
					</div>

					{/* Toolbar */}
					<div className="hp-toolbar">
						<span className="hp-count">
							<span>{timeline.length}</span> event{timeline.length !== 1 ? "s" : ""} recorded
						</span>
						<button
							type="button"
							className="hp-refresh-btn"
							onClick={() => load().catch(() => {})}
							disabled={loading}
						>
							{loading ? (
								<><span className="hp-spinner" /> Loading…</>
							) : (
								<>
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
										<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
									</svg>
									Refresh
								</>
							)}
						</button>
					</div>

					{/* Error */}
					{error && (
						<div className="hp-error">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
							</svg>
							{error}
						</div>
					)}

					{/* Loading skeleton */}
					{loading && timeline.length === 0 && (
						<div className="hp-skeleton-wrap">
							{[...Array(4)].map((_, i) => <div key={i} className="hp-skeleton" />)}
						</div>
					)}

					{/* Timeline */}
					{!loading && timeline.length === 0 && !error && (
						<div className="hp-empty">
							<div className="hp-empty-icon">📋</div>
							<div className="hp-empty-text">No history records found</div>
						</div>
					)}

					{timeline.length > 0 && (
						<div className="hp-timeline">
							{timeline.map((item, index) => {
								const style = getEventStyle(item.eventType);
								return (
									<div className="hp-event" key={`${item.recordId || index}`}>
										<div className="hp-event-dot-wrap">
											<span
												className="hp-event-dot"
												style={{ borderColor: style.dot, color: style.dot }}
											/>
										</div>
										<div
											className="hp-event-card"
											style={{
												background: style.bg,
												borderColor: style.border,
											}}
										>
											<div className="hp-event-top">
												<span className="hp-event-type" style={{ color: style.label }}>
													{item.eventType || "EVENT"}
												</span>
												<span className="hp-event-time">{formatDate(item.timestamp)}</span>
											</div>

											{item.details && (
												<p className="hp-event-detail">{item.details}</p>
											)}

											<div className="hp-event-meta">
												{item.actor && (
													<span className="hp-event-meta-item">
														<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
															<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
														</svg>
														{item.actor}
													</span>
												)}
												{item.recordId && (
													<span className="hp-event-meta-item">
														<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
															<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
														</svg>
														{item.recordId}
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</main>
			</div>
		</>
	);
};

export default HistoryPage;