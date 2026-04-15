import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useWallet from "../hooks/useWallet";
import { toApiErrorMessage } from "../services/api";
import { getAllProperties, getMyProperties } from "../services/propertyService";

const S = {
  page: {
    background: "#080c12",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    color: "#e2e8f0",
    position: "relative",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none",
    zIndex: 0,
  },
  glow: {
    position: "fixed",
    top: "-80px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "280px",
    background: "radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 20px 60px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#818cf8",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  eyebrowLine: {
    display: "inline-block",
    width: 18,
    height: 1,
    background: "#6366f1",
    opacity: 0.7,
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  tabRow: {
    display: "flex",
    gap: 6,
    marginTop: 14,
  },
  addBtn: {
    padding: "11px 20px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "opacity 0.2s, transform 0.15s",
    fontFamily: "inherit",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  errorBox: {
    padding: "12px 16px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    color: "#fca5a5",
    fontSize: 14,
    marginBottom: 16,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
    padding: "20px 0",
  },
  emptyCard: {
    background: "rgba(15,18,27,0.9)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "32px 24px",
    textAlign: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 12,
    margin: "0 0 14px",
  },
  grid: {
    display: "grid",
    gap: 14,
  },
};

const tabStyle = (active) => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: `1px solid ${active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
  background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
  color: active ? "#a5b4fc" : "#64748b",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  transition: "all 0.2s",
  fontFamily: "inherit",
  letterSpacing: "0.02em",
});

const actionBtnStyle = {
  padding: "7px 14px",
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
  fontFamily: "inherit",
  letterSpacing: "0.02em",
};

const shortenAddress = (value = "") => {
  if (!value) return "Wallet not connected";
  if (value.length <= 11) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const PropertyCard = ({ property, isOwner, navigate }) => {
  const fields = [
    { label: "Khasra", value: property.khasraNumber },
    { label: "Survey", value: property.surveyNumber },
    { label: "Plot", value: property.plotNumber },
    { label: "Area", value: property.area },
    { label: "Location", value: property.location },
    { label: "Owner", value: property?.owner?.name || property?.owner?.email || "—" },
  ];

  return (
    <article
      style={{
        background: "rgba(13,17,25,0.95)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "20px 22px",
        transition: "border-color 0.2s",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "10px 20px",
          marginBottom: 18,
        }}
      >
        {fields.map(({ label, value }) => (
          <div key={label}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#475569",
                marginBottom: 3,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 14, color: "#cbd5e1", fontWeight: 500 }}>{value || "—"}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 14,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "📄 Documents", action: () => navigate(`/documents/${property._id}`) },
          { label: "✓ Verify", action: () => navigate(`/verify/${property._id}`) },
          { label: "⟳ History", action: () => navigate(`/history/${property._id}`) },
        ].map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={actionBtnStyle}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(99,102,241,0.4)";
              e.target.style.color = "#a5b4fc";
              e.target.style.background = "rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.08)";
              e.target.style.color = "#94a3b8";
              e.target.style.background = "rgba(255,255,255,0.04)";
            }}
          >
            {label}
          </button>
        ))}
        {isOwner(property) && (
          <button
            type="button"
            onClick={() => navigate(`/transfer/${property._id}`)}
            style={{
              ...actionBtnStyle,
              borderColor: "rgba(251,191,36,0.2)",
              color: "#d97706",
              background: "rgba(251,191,36,0.05)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(251,191,36,0.1)";
              e.target.style.borderColor = "rgba(251,191,36,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(251,191,36,0.05)";
              e.target.style.borderColor = "rgba(251,191,36,0.2)";
            }}
          >
            ⇄ Transfer
          </button>
        )}
      </div>
    </article>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const wallet = useWallet();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const displayAddress = wallet?.isConnected
    ? wallet.shortAddress
    : shortenAddress(user?.walletAddress || user?.address || "");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handlePropertiesNav = () => {
    setActiveNav("properties");
    setActiveTab("all");
    setMobileMenuOpen(false);
    document.getElementById("properties-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDashboardNav = () => {
    setActiveNav("dashboard");
    setMobileMenuOpen(false);
    navigate("/dashboard");
  };

  const getOwnerId = (property) => {
    if (!property?.owner) return "";
    if (typeof property.owner === "string") return property.owner;
    return property.owner?._id || property.owner?.id || "";
  };

  const isOwner = (property) => {
    const ownerId = String(getOwnerId(property) || "");
    const loggedInUserId = String(user?._id || user?.id || "");
    return Boolean(ownerId && loggedInUserId && ownerId === loggedInUserId);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = activeTab === "all" ? await getAllProperties() : await getMyProperties();
        setProperties(response?.data || []);
      } catch (err) {
        setError(toApiErrorMessage(err, "Could not load properties"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={S.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .db-nav {
          position: sticky;
          top: 0;
          z-index: 30;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          background: linear-gradient(120deg, rgba(8,12,18,0.86), rgba(13,17,25,0.76));
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 34px rgba(2, 6, 23, 0.35);
          overflow: hidden;
        }

        .db-nav::after {
          content: "";
          position: absolute;
          left: -10%;
          bottom: 0;
          width: 120%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.9), rgba(56,189,248,0.85), transparent);
          animation: navGlow 4.6s linear infinite;
        }

        @keyframes navGlow {
          0% { transform: translateX(-22%); opacity: 0.35; }
          50% { opacity: 0.9; }
          100% { transform: translateX(22%); opacity: 0.35; }
        }

        .db-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .db-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .db-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          color: #f8fafc;
          font-size: 18px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          box-shadow: 0 10px 24px rgba(79, 70, 229, 0.42);
        }

        .db-brand-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 45%, #7dd3fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          white-space: nowrap;
        }

        .db-center-links {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.45);
        }

        .db-nav-link {
          border: none;
          background: transparent;
          color: #94a3b8;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
        }

        .db-nav-link:hover {
          color: #dbeafe;
          background: rgba(99, 102, 241, 0.16);
        }

        .db-nav-link.active {
          color: #e0e7ff;
          background: rgba(99, 102, 241, 0.18);
          box-shadow: inset 0 -2px 0 #818cf8;
        }

        .db-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .db-user-wrap {
          position: relative;
        }

        .db-user-pill {
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(15, 23, 42, 0.56);
          border-radius: 999px;
          min-height: 40px;
          padding: 7px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .db-user-pill:hover {
          border-color: rgba(129, 140, 248, 0.5);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.55);
          transform: translateY(-1px);
        }

        .db-user-avatar {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(139, 92, 246, 0.95));
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .db-user-meta {
          line-height: 1.15;
          text-align: left;
        }

        .db-user-name {
          font-size: 12px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .db-user-address {
          font-size: 10px;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .db-profile-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(9, 13, 22, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 44px rgba(2, 6, 23, 0.55);
          padding: 10px;
          z-index: 40;
        }

        .db-profile-email {
          font-size: 11px;
          color: #94a3b8;
          padding: 8px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          margin-bottom: 8px;
          word-break: break-word;
        }

        .db-menu-item {
          width: 100%;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #cbd5e1;
          padding: 9px 10px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .db-menu-item:hover {
          background: rgba(99, 102, 241, 0.18);
          color: #e0e7ff;
        }

        .db-logout {
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 999px;
          min-height: 40px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9));
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .db-logout:hover {
          transform: translateY(-1px) scale(1.02);
          border-color: rgba(129, 140, 248, 0.54);
          box-shadow: 0 10px 28px rgba(79, 70, 229, 0.35);
        }

        .db-mobile-toggle {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.32);
          background: rgba(15, 23, 42, 0.62);
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .db-mobile-toggle:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #e0e7ff;
        }

        .db-mobile-panel {
          display: none;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 12px;
        }

        .db-mobile-card {
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.62);
          padding: 10px;
          display: grid;
          gap: 8px;
        }

        .db-mobile-btn {
          width: 100%;
          min-height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(30, 41, 59, 0.6);
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .db-mobile-btn.active,
        .db-mobile-btn:hover {
          border-color: rgba(129, 140, 248, 0.56);
          background: rgba(99, 102, 241, 0.2);
        }

        @media (max-width: 960px) {
          .db-center-links,
          .db-right {
            display: none;
          }

          .db-mobile-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .db-mobile-panel.open {
            display: block;
          }
        }
      `}</style>
      <div style={S.gridOverlay} />
      <div style={S.glow} />

      <nav className="db-nav">
        <div className="db-nav-inner">
          <div className="db-brand">
            <div className="db-brand-icon">▦</div>
            <div className="db-brand-title">Property Dashboard</div>
          </div>

          <div className="db-center-links">
            <button
              type="button"
              className={`db-nav-link ${activeNav === "dashboard" ? "active" : ""}`}
              onClick={handleDashboardNav}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`db-nav-link ${activeNav === "properties" ? "active" : ""}`}
              onClick={handlePropertiesNav}
            >
              Properties
            </button>
          </div>

          <div className="db-right">
            <div className="db-user-wrap" ref={profileRef}>
              <button
                type="button"
                className="db-user-pill"
                onClick={() => setProfileMenuOpen((v) => !v)}
              >
                <span className="db-user-avatar">{displayName.slice(0, 2).toUpperCase()}</span>
                <span className="db-user-meta">
                  <span className="db-user-name">{displayName}</span>
                  <br />
                  <span className="db-user-address">{displayAddress}</span>
                </span>
              </button>

              {profileMenuOpen && (
                <div className="db-profile-menu">
                  <div className="db-profile-email">{user?.email || "No email available"}</div>
                  <button type="button" className="db-menu-item" onClick={() => navigate("/admin")}>
                    Open Admin Panel
                  </button>
                  <button type="button" className="db-menu-item" onClick={handlePropertiesNav}>
                    Jump to Properties
                  </button>
                </div>
              )}
            </div>

            <button type="button" className="db-logout" onClick={handleLogout}>
              <span aria-hidden="true">↪</span>
              Logout
            </button>
          </div>

          <button
            type="button"
            className="db-mobile-toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className={`db-mobile-panel ${mobileMenuOpen ? "open" : ""}`}>
          <div className="db-mobile-card">
            <button
              type="button"
              className={`db-mobile-btn ${activeNav === "dashboard" ? "active" : ""}`}
              onClick={handleDashboardNav}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`db-mobile-btn ${activeNav === "properties" ? "active" : ""}`}
              onClick={handlePropertiesNav}
            >
              Properties
            </button>
            <button type="button" className="db-mobile-btn" onClick={() => navigate("/admin")}>
              Go to Admin Panel
            </button>
            <button type="button" className="db-mobile-btn" onClick={handleLogout}>
              Logout ({displayName})
            </button>
          </div>
        </div>
      </nav>

      <main style={S.main} id="properties-section">
        <section style={S.header}>
          <div>
            <div style={S.eyebrow}>
              <span style={S.eyebrowLine} />
              Property Registry
            </div>
            <h1 style={S.title}>
              {activeTab === "all" ? "All Properties" : "My Properties"}
            </h1>
            <div style={S.tabRow}>
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                style={tabStyle(activeTab === "my")}
              >
                My Properties
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                style={tabStyle(activeTab === "all")}
              >
                All Properties
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/add-property")}
            style={S.addBtn}
            onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
            onMouseDown={(e) => (e.target.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
          >
            + Add Property
          </button>
        </section>

        {loading && <p style={S.loadingText}>Loading properties…</p>}
        {error && <div style={S.errorBox}>{error}</div>}

        {!loading && !error && properties.length === 0 && (
          <div style={S.emptyCard}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🏚</div>
            <p style={S.emptyText}>
              {activeTab === "all"
                ? "No properties found."
                : "No properties found for your account."}
            </p>
            <Link
              to="/add-property"
              style={{ color: "#818cf8", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              Create your first property →
            </Link>
          </div>
        )}

        {properties.length > 0 && (
          <div style={S.grid}>
            {properties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                isOwner={isOwner}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;