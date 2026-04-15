import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getAllProperties } from "../services/propertyService";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');

  :root {
    --bg-primary: #080c12;
    --bg-card: #0d1117;
    --bg-elevated: #12171f;
    --border: rgba(255,255,255,0.065);
    --border-active: rgba(99,102,241,0.35);
    --indigo: #6366f1;
    --indigo-light: #818cf8;
    --indigo-dim: rgba(99,102,241,0.12);
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #475569;
    --green: #34d399;
    --green-bg: rgba(52,211,153,0.08);
    --amber: #fbbf24;
    --amber-bg: rgba(251,191,36,0.08);
    --red: #f87171;
    --red-bg: rgba(248,113,113,0.08);
    --slate: #64748b;
    --slate-bg: rgba(100,116,139,0.1);
    --shadow-card: 0 4px 24px rgba(0,0,0,0.4);
    --radius: 14px;
    --radius-sm: 9px;
    --radius-pill: 999px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .admin-root {
    min-height: 100vh;
    background: var(--bg-primary);
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
      radial-gradient(ellipse 70% 40% at 50% -5%, rgba(99,102,241,0.14) 0%, transparent 70%);
    background-size: 48px 48px, 48px 48px, 100% 100%;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-primary);
    padding: 0 0 60px 0;
  }

  .admin-topbar {
    border-bottom: 1px solid var(--border);
    padding: 0 40px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(8,12,18,0.85);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .topbar-brand { display: flex; align-items: center; gap: 12px; }

  .brand-icon {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, var(--indigo), var(--indigo-light));
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }

  .brand-name {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text-primary);
  }

  .brand-sub {
    font-size: 10px;
    font-weight: 500;
    color: var(--indigo-light);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .topbar-right { display: flex; align-items: center; gap: 8px; }

  .status-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse-dot 2.5s ease-in-out infinite;
  }

  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }

  .status-label {
    font-size: 12px;
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.04em;
  }

  .admin-container { max-width: 1300px; margin: 0 auto; padding: 40px 40px 0; }

  .admin-header { margin-bottom: 36px; animation: fadeUp 0.4s ease both; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  .header-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--indigo-light);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-eyebrow::before {
    content: '';
    display: block;
    width: 18px;
    height: 1px;
    background: var(--indigo);
    opacity: 0.7;
  }

  .admin-title {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--text-primary);
    margin-bottom: 8px;
    line-height: 1.1;
  }

  .admin-title span { color: var(--indigo-light); }

  .admin-subtitle {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 400;
    line-height: 1.6;
    max-width: 500px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 26px;
    animation: fadeUp 0.4s ease 0.08s both;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.25s, transform 0.2s;
  }

  .stat-card:hover { border-color: var(--border-active); transform: translateY(-2px); }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .stat-card.indigo::before { background: linear-gradient(90deg, var(--indigo), transparent); }
  .stat-card.green::before  { background: linear-gradient(90deg, var(--green), transparent); }
  .stat-card.red::before    { background: linear-gradient(90deg, var(--red), transparent); }
  .stat-card.amber::before  { background: linear-gradient(90deg, var(--amber), transparent); }

  .stat-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-label { font-size: 12px; color: var(--text-muted); letter-spacing: 0.04em; }
  .stat-icon { position: absolute; right: 18px; top: 18px; font-size: 20px; opacity: 0.18; }

  .controls-bar {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 10px;
    margin-bottom: 18px;
    animation: fadeUp 0.4s ease 0.13s both;
  }

  .search-wrap { position: relative; }

  .search-icon {
    position: absolute;
    left: 13px; top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 14px;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 11px 14px 11px 38px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input::placeholder { color: var(--text-muted); }

  .search-input:focus {
    border-color: var(--border-active);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }

  .filter-select {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 11px 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text-secondary);
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
    min-width: 160px;
  }

  .filter-select:focus { border-color: var(--border-active); }

  .refresh-btn {
    background: linear-gradient(135deg, var(--indigo), var(--indigo-light));
    border: none;
    border-radius: var(--radius-sm);
    padding: 11px 20px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: opacity 0.2s, transform 0.15s;
    letter-spacing: 0.02em;
  }

  .refresh-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .refresh-btn:active { transform: translateY(0); }

  .table-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    animation: fadeUp 0.4s ease 0.18s both;
  }

  .table-header-bar {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .table-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .table-count {
    font-size: 12px;
    font-family: 'DM Mono', monospace;
    color: var(--indigo-light);
    background: var(--indigo-dim);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    border: 1px solid rgba(99,102,241,0.2);
  }

  table { width: 100%; border-collapse: collapse; }

  thead tr { background: rgba(0,0,0,0.25); }

  th {
    padding: 12px 20px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(99,102,241,0.03); }

  td { padding: 16px 20px; vertical-align: middle; }

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
    margin-bottom: 3px;
    letter-spacing: 0.02em;
  }

  .prop-location { font-size: 13px; color: var(--text-secondary); }

  .owner-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--indigo-dim);
    border: 1px solid rgba(99,102,241,0.25);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--indigo-light);
    margin-right: 10px;
    flex-shrink: 0;
  }

  .owner-wrap { display: flex; align-items: center; }
  .owner-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
  .owner-email { font-size: 12px; color: var(--text-muted); font-family: 'DM Mono', monospace; }

  .risk-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
    margin-bottom: 5px;
  }

  .risk-score { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text-muted); }

  .badge-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; }

  .badge-low { background: var(--green-bg); color: var(--green); border: 1px solid rgba(52,211,153,0.25); }
  .badge-low .badge-dot { background: var(--green); }
  .badge-medium { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(251,191,36,0.25); }
  .badge-medium .badge-dot { background: var(--amber); }
  .badge-high { background: var(--red-bg); color: var(--red); border: 1px solid rgba(248,113,113,0.25); }
  .badge-high .badge-dot { background: var(--red); }
  .badge-unverified { background: var(--slate-bg); color: var(--slate); border: 1px solid rgba(100,116,139,0.25); }
  .badge-unverified .badge-dot { background: var(--slate); }

  .doc-count { font-family: 'DM Mono', monospace; font-size: 14px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
  .doc-count-icon { font-size: 15px; opacity: 0.45; }

  .inspect-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
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
    border-color: var(--border-active);
    color: var(--indigo-light);
    background: var(--indigo-dim);
  }

  .empty-state { padding: 60px 20px; text-align: center; color: var(--text-muted); font-size: 14px; }
  .empty-icon { font-size: 38px; margin-bottom: 10px; opacity: 0.25; }

  .loading-state { padding: 60px 20px; text-align: center; color: var(--text-muted); }

  .loading-spinner {
    width: 30px; height: 30px;
    border: 2px solid var(--border);
    border-top-color: var(--indigo);
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
    margin: 0 auto 12px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .error-bar {
    background: var(--red-bg);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    color: var(--red);
    font-size: 14px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .detail-panel {
    margin-top: 22px;
    background: var(--bg-card);
    border: 1px solid var(--border-active);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 0 40px rgba(99,102,241,0.07), var(--shadow-card);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .detail-header {
    background: linear-gradient(135deg, rgba(99,102,241,0.07), transparent);
    border-bottom: 1px solid var(--border);
    padding: 22px 28px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .detail-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin-bottom: 5px;
  }

  .detail-summary { font-size: 13px; color: var(--text-secondary); line-height: 1.55; max-width: 600px; }

  .close-btn {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 6px 10px;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 15px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .close-btn:hover { border-color: rgba(248,113,113,0.4); color: var(--red); }

  .detail-body { padding: 24px 28px; }

  .timeline-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--indigo-light);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .timeline-label::after { content:''; flex:1; height:1px; background:var(--border); }

  .timeline-list { list-style:none; display:flex; flex-direction:column; gap:0; position:relative; }

  .timeline-list::before {
    content:''; position:absolute;
    left:10px; top:0; bottom:0; width:1px;
    background: linear-gradient(to bottom, rgba(99,102,241,0.4), transparent);
  }

  .timeline-item {
    display:flex; align-items:flex-start; gap:16px;
    padding:13px 0; border-bottom:1px solid var(--border);
  }

  .timeline-item:last-child { border-bottom:none; }

  .timeline-dot {
    width:20px; height:20px; border-radius:50%;
    background:var(--bg-elevated);
    border:1px solid rgba(99,102,241,0.35);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; margin-top:1px; z-index:1;
  }

  .timeline-dot-inner { width:6px; height:6px; border-radius:50%; background:var(--indigo-light); }

  .timeline-event { font-size:14px; font-weight:500; color:var(--text-primary); margin-bottom:3px; }
  .timeline-time { font-family:'DM Mono',monospace; font-size:12px; color:var(--text-muted); letter-spacing:0.03em; }

  .empty-timeline { text-align:center; padding:32px; color:var(--text-muted); font-size:14px; }
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

        <header className="admin-header">
          <div className="header-eyebrow">Property Intelligence</div>
          <h1 className="admin-title">Admin <span>Review Panel</span></h1>
          <p className="admin-subtitle">
            Audit property records, track document verification, and monitor ownership history from one command center.
          </p>
        </header>

        <div className="stats-row">
          <div className="stat-card indigo">
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

        {error && (
          <div className="error-bar">
            <span>⚠</span> {error}
          </div>
        )}

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
                          Survey: {row.surveyNumber || "—"} · Plot: {row.plotNumber || "—"}
                        </div>
                        <div className="prop-location">📍 {row.location || "Unknown"}</div>
                      </td>
                      <td>
                        <div className="owner-wrap">
                          <div className="owner-avatar">{getInitials(row.owner?.name)}</div>
                          <div>
                            <div className="owner-name">{row.owner?.name || "Unknown"}</div>
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

        {selected && (
          <div className="detail-panel">
            <div className="detail-header">
              <div>
                <div className="detail-title">
                  {selected.khasraNumber || "Property"} — Inspection
                </div>
                <div className="detail-summary">{selected.latestVerificationSummary}</div>
              </div>
              <button type="button" className="close-btn" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <div className="detail-body">
              <div className="timeline-label">Ownership Timeline</div>
              {selected.timelineLoading ? (
                <div className="loading-state" style={{ padding: "20px" }}>
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
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
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