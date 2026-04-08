import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getAllProperties } from "../services/propertyService";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');

  :root {
    --bg-primary: #080c10;
    --bg-secondary: #0d1117;
    --bg-card: #111820;
    --bg-elevated: #16202c;
    --border: rgba(99, 130, 167, 0.12);
    --border-active: rgba(180, 148, 90, 0.4);
    --gold: #b4945a;
    --gold-light: #d4b07a;
    --gold-dim: rgba(180, 148, 90, 0.15);
    --text-primary: #e8edf3;
    --text-secondary: #7a93af;
    --text-muted: #3d5068;
    --green: #2dd4a0;
    --green-bg: rgba(45, 212, 160, 0.08);
    --amber: #f59e47;
    --amber-bg: rgba(245, 158, 71, 0.08);
    --red: #f06674;
    --red-bg: rgba(240, 102, 116, 0.08);
    --slate: #4a6a8a;
    --slate-bg: rgba(74, 106, 138, 0.08);
    --shadow-card: 0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3);
    --shadow-glow: 0 0 40px rgba(180, 148, 90, 0.06);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-pill: 999px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .admin-root {
    min-height: 100vh;
    background: var(--bg-primary);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180, 148, 90, 0.06) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 90% 60%, rgba(45, 212, 160, 0.03) 0%, transparent 60%);
    font-family: 'Outfit', sans-serif;
    color: var(--text-primary);
    padding: 0 0 60px 0;
  }

  /* TOP NAV BAR */
  .admin-topbar {
    border-bottom: 1px solid var(--border);
    padding: 0 40px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(8, 12, 16, 0.8);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-primary);
  }

  .brand-sub {
    font-size: 11px;
    font-weight: 300;
    color: var(--gold);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .status-label {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.04em;
  }

  /* MAIN CONTAINER */
  .admin-container {
    max-width: 1320px;
    margin: 0 auto;
    padding: 40px 40px 0;
  }

  /* HEADER */
  .admin-header {
    margin-bottom: 36px;
    animation: fadeUp 0.5s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .header-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-eyebrow::before {
    content: '';
    display: block;
    width: 20px;
    height: 1px;
    background: var(--gold);
    opacity: 0.6;
  }

  .admin-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: 10px;
  }

  .admin-title span {
    color: var(--gold);
  }

  .admin-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 300;
    line-height: 1.6;
    max-width: 480px;
  }

  /* STATS ROW */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
    animation: fadeUp 0.5s ease 0.1s both;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s ease, transform 0.2s ease;
  }

  .stat-card:hover {
    border-color: var(--border-active);
    transform: translateY(-2px);
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .stat-card.gold::before { background: linear-gradient(90deg, var(--gold), transparent); }
  .stat-card.green::before { background: linear-gradient(90deg, var(--green), transparent); }
  .stat-card.amber::before { background: linear-gradient(90deg, var(--amber), transparent); }
  .stat-card.red::before { background: linear-gradient(90deg, var(--red), transparent); }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 400;
    letter-spacing: 0.04em;
  }

  .stat-icon {
    position: absolute;
    right: 18px;
    top: 18px;
    font-size: 22px;
    opacity: 0.2;
  }

  /* CONTROLS */
  .controls-bar {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    margin-bottom: 20px;
    animation: fadeUp 0.5s ease 0.15s both;
  }

  .search-wrap {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 15px;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 11px 14px 11px 40px;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input::placeholder { color: var(--text-muted); }

  .search-input:focus {
    border-color: var(--border-active);
    background: var(--bg-elevated);
  }

  .filter-select {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 11px 14px;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    color: var(--text-secondary);
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
    min-width: 160px;
  }

  .filter-select:focus { border-color: var(--border-active); }

  .refresh-btn {
    background: var(--gold);
    border: none;
    border-radius: var(--radius-sm);
    padding: 11px 20px;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    color: #0d0a05;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s, transform 0.15s;
    letter-spacing: 0.02em;
  }

  .refresh-btn:hover { background: var(--gold-light); transform: translateY(-1px); }
  .refresh-btn:active { transform: translateY(0); }

  /* TABLE */
  .table-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    animation: fadeUp 0.5s ease 0.2s both;
  }

  .table-header-bar {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .table-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .table-count {
    font-size: 12px;
    font-family: 'DM Mono', monospace;
    color: var(--gold);
    background: var(--gold-dim);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead tr {
    background: rgba(0,0,0,0.2);
  }

  th {
    padding: 12px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }

  tbody tr:last-child { border-bottom: none; }

  tbody tr:hover { background: rgba(180, 148, 90, 0.03); }

  td {
    padding: 16px 20px;
    vertical-align: middle;
  }

  /* PROPERTY CELL */
  .prop-khasra {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: 0.03em;
    margin-bottom: 4px;
  }

  .prop-meta {
    font-size: 12px;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    margin-bottom: 2px;
    letter-spacing: 0.02em;
  }

  .prop-location {
    font-size: 13px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* OWNER CELL */
  .owner-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-dim), rgba(180,148,90,0.25));
    border: 1px solid var(--border-active);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--gold);
    margin-right: 10px;
    flex-shrink: 0;
  }

  .owner-wrap {
    display: flex;
    align-items: center;
  }

  .owner-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .owner-email {
    font-size: 12px;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
  }

  /* RISK BADGE */
  .risk-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    margin-bottom: 6px;
  }

  .risk-score {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 0.04em;
  }

  .badge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    display: inline-block;
  }

  .badge-low { background: var(--green-bg); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .badge-low .badge-dot { background: var(--green); }
  .badge-medium { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(245,158,71,0.2); }
  .badge-medium .badge-dot { background: var(--amber); }
  .badge-high { background: var(--red-bg); color: var(--red); border: 1px solid rgba(240,102,116,0.2); }
  .badge-high .badge-dot { background: var(--red); }
  .badge-unverified { background: var(--slate-bg); color: var(--slate); border: 1px solid rgba(74,106,138,0.2); }
  .badge-unverified .badge-dot { background: var(--slate); }

  /* DOC COUNT */
  .doc-count {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .doc-count-icon { font-size: 16px; opacity: 0.5; }

  /* INSPECT BUTTON */
  .inspect-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .inspect-btn:hover {
    border-color: var(--gold);
    color: var(--gold);
    background: var(--gold-dim);
  }

  /* EMPTY STATE */
  .empty-state {
    padding: 60px 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.3;
  }

  /* LOADING */
  .loading-state {
    padding: 60px 20px;
    text-align: center;
    color: var(--text-muted);
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ERROR */
  .error-bar {
    background: var(--red-bg);
    border: 1px solid rgba(240,102,116,0.2);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    color: var(--red);
    font-size: 14px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* DETAIL PANEL */
  .detail-panel {
    margin-top: 24px;
    background: var(--bg-card);
    border: 1px solid var(--border-active);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-glow), var(--shadow-card);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .detail-header {
    background: linear-gradient(135deg, rgba(180,148,90,0.08), rgba(180,148,90,0.02));
    border-bottom: 1px solid var(--border);
    padding: 20px 28px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .detail-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .detail-summary { 
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    max-width: 600px;
  }

  .close-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 10px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .close-btn:hover { border-color: var(--red); color: var(--red); }

  .detail-body {
    padding: 24px 28px;
  }

  .timeline-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--gold);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .timeline-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .timeline-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
  }

  .timeline-list::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, var(--border-active), transparent);
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }

  .timeline-item:last-child { border-bottom: none; }

  .timeline-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--bg-elevated);
    border: 1px solid var(--border-active);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    z-index: 1;
  }

  .timeline-dot-inner {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
  }

  .timeline-event {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 3px;
  }

  .timeline-time {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  .empty-timeline {
    text-align: center;
    padding: 32px;
    color: var(--text-muted);
    font-size: 14px;
  }
`;

const getRiskMeta = (score) => {
  if (typeof score !== "number") return { label: "Not Verified", cls: "badge-unverified" };
  if (score >= 80) return { label: "Low Risk", cls: "badge-low" };
  if (score >= 50) return { label: "Medium Risk", cls: "badge-medium" };
  return { label: "High Risk", cls: "badge-high" };
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
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
            return { ...property, ...verification };
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

  useEffect(() => { loadAdminData(); }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesSearch =
        query.length === 0 ? true :
        [item.khasraNumber, item.surveyNumber, item.plotNumber, item.location, item.owner?.name, item.owner?.email]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
      const score = item.latestRiskScore;
      const matchesRisk =
        riskFilter === "all" ? true :
        riskFilter === "unverified" ? typeof score !== "number" :
        riskFilter === "low" ? typeof score === "number" && score >= 80 :
        riskFilter === "medium" ? typeof score === "number" && score >= 50 && score < 80 :
        typeof score === "number" && score < 50;
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

  const totalProps = rows.length;
  const lowRisk = rows.filter((r) => typeof r.latestRiskScore === "number" && r.latestRiskScore >= 80).length;
  const highRisk = rows.filter((r) => typeof r.latestRiskScore === "number" && r.latestRiskScore < 50).length;
  const unverified = rows.filter((r) => typeof r.latestRiskScore !== "number").length;

  return (
    <div className="admin-root">
      <style>{styles}</style>

      {/* TOP NAV */}
      <nav className="admin-topbar">
        <div className="topbar-brand">
          <div className="brand-icon">🏛</div>
          <div>
            <div className="brand-name">LandVerify</div>
            <div className="brand-sub">Admin Console</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="status-dot" />
          <span className="status-label">System Operational</span>
        </div>
      </nav>

      <div className="admin-container">

        {/* HEADER */}
        <header className="admin-header">
          <div className="header-eyebrow">Property Intelligence</div>
          <h1 className="admin-title">Admin Review <span>Panel</span></h1>
          <p className="admin-subtitle">
            Audit property records, track document verification status, and monitor ownership history — all from one command center.
          </p>
        </header>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card gold">
            <div className="stat-icon">🏘</div>
            <div className="stat-value">{totalProps}</div>
            <div className="stat-label">Total Properties</div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{lowRisk}</div>
            <div className="stat-label">Low Risk</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon">⚠️</div>
            <div className="stat-value">{highRisk}</div>
            <div className="stat-label">High Risk</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon">🔍</div>
            <div className="stat-value">{unverified}</div>
            <div className="stat-label">Unverified</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="controls-bar">
          <div className="search-wrap">
            <span className="search-icon">🔎</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by khasra, survey, plot, owner, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
            <option value="unverified">Not Verified</option>
          </select>
          <button type="button" className="refresh-btn" onClick={loadAdminData}>
            ↻ Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="error-bar">
            <span>⚠</span> {error}
          </div>
        )}

        {/* TABLE */}
        <div className="table-wrap">
          <div className="table-header-bar">
            <span className="table-title">Property Records</span>
            <span className="table-count">{filteredRows.length} entries</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <div>Loading property records…</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Owner</th>
                  <th>Risk Level</th>
                  <th>Documents</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const risk = getRiskMeta(row.latestRiskScore);
                  return (
                    <tr key={row._id}>
                      <td>
                        <div className="prop-khasra">{row.khasraNumber || "—"}</div>
                        <div className="prop-meta">
                          Survey: {row.surveyNumber || "—"} &nbsp;·&nbsp; Plot: {row.plotNumber || "—"}
                        </div>
                        <div className="prop-location">
                          <span style={{ opacity: 0.5 }}>📍</span> {row.location || "Unknown location"}
                        </div>
                      </td>
                      <td>
                        <div className="owner-wrap">
                          <div className="owner-avatar">{getInitials(row.owner?.name)}</div>
                          <div>
                            <div className="owner-name">{row.owner?.name || "Unknown Owner"}</div>
                            <div className="owner-email">{row.owner?.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`risk-badge ${risk.cls}`}>
                          <span className="badge-dot" />
                          {risk.label}
                        </div>
                        <div className="risk-score">
                          Score: {typeof row.latestRiskScore === "number" ? row.latestRiskScore : "—"}
                        </div>
                      </td>
                      <td>
                        <div className="doc-count">
                          <span className="doc-count-icon">📄</span>
                          {row.documentsCount}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="inspect-btn"
                          onClick={() => openPropertyDetails(row)}
                        >
                          🔬 Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon">🏚</div>
                        <div>No properties found for the selected filters.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* DETAIL PANEL */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-header">
              <div>
                <div className="detail-title">
                  {selected.khasraNumber || "Property"} — Inspection
                </div>
                <div className="detail-summary">{selected.latestVerificationSummary}</div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>
            <div className="detail-body">
              <div className="timeline-label">Ownership Timeline</div>
              {selected.timelineLoading ? (
                <div className="loading-state" style={{ padding: "24px" }}>
                  <div className="loading-spinner" style={{ width: 24, height: 24 }} />
                  <div style={{ fontSize: 13 }}>Loading timeline…</div>
                </div>
              ) : selected.timeline.length === 0 ? (
                <div className="empty-timeline">No transfer events found.</div>
              ) : (
                <ul className="timeline-list">
                  {selected.timeline.map((event, idx) => (
                    <li key={`${event.transactionId || event.timestamp}-${idx}`} className="timeline-item">
                      <div className="timeline-dot">
                        <div className="timeline-dot-inner" />
                      </div>
                      <div>
                        <div className="timeline-event">{event.eventType}</div>
                        <div className="timeline-time">
                          {new Date(event.timestamp).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;