import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import { toApiErrorMessage } from "../services/api";
import { getDocumentsByPropertyId, uploadDocument } from "../services/documentService";

const S = {
  page: {
    minHeight: "100vh",
    background: "#080c12",
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
    background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: 960,
    margin: "0 auto",
    padding: "28px 20px 60px",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#64748b",
    fontSize: 13,
    textDecoration: "none",
    marginBottom: 24,
    fontWeight: 500,
    transition: "color 0.2s",
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
    margin: "0 0 4px",
    fontSize: 28,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  propId: {
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    color: "#475569",
    marginBottom: 28,
    letterSpacing: "0.04em",
  },
  uploadCard: {
    background: "rgba(13,17,25,0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "24px 24px 20px",
    marginBottom: 28,
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 16,
  },
  fieldRow: {
    display: "grid",
    gap: 10,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 5,
    display: "block",
  },
  btnRow: {
    display: "flex",
    gap: 10,
    marginTop: 4,
  },
  uploadBtn: {
    padding: "11px 22px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.02em",
    transition: "opacity 0.2s",
  },
  refreshBtn: {
    padding: "11px 18px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  errorBox: {
    padding: "12px 16px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    color: "#fca5a5",
    fontSize: 13,
    marginBottom: 14,
  },
  successBox: {
    padding: "12px 16px",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: 10,
    color: "#86efac",
    fontSize: 13,
    marginBottom: 14,
  },
  docGrid: {
    display: "grid",
    gap: 12,
  },
  docCard: {
    background: "rgba(13,17,25,0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "18px 20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    transition: "border-color 0.2s",
  },
  docName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f1f5f9",
    marginBottom: 4,
  },
  docType: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "'DM Mono', monospace",
    marginBottom: 12,
  },
  docMetaRow: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  docMetaItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  docMetaLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#475569",
  },
  docMetaValue: {
    fontSize: 13,
    color: "#cbd5e1",
    fontWeight: 500,
  },
  docActions: {
    display: "flex",
    gap: 10,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 12,
  },
  docLink: {
    padding: "6px 14px",
    borderRadius: 7,
    border: "1px solid rgba(99,102,241,0.3)",
    background: "rgba(99,102,241,0.06)",
    color: "#818cf8",
    fontSize: 12,
    fontWeight: 500,
    textDecoration: "none",
    transition: "all 0.2s",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    padding: "40px 0",
  },
};

const inputStyle = (focused) => ({
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: `1px solid ${focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
  background: "rgba(255,255,255,0.04)",
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
});

const StatusBadge = ({ status }) => {
  const map = {
    VERIFIED: { bg: "rgba(34,197,94,0.1)", color: "#86efac", border: "rgba(34,197,94,0.2)" },
    PENDING: { bg: "rgba(251,191,36,0.08)", color: "#fcd34d", border: "rgba(251,191,36,0.2)" },
    FAILED: { bg: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "rgba(239,68,68,0.2)" },
  };
  const s = map[status] || map.PENDING;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
      }}
    >
      {status || "PENDING"}
    </span>
  );
};

const FocusInput = ({ value, onChange, placeholder, type = "text" }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle(focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

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
    <div style={S.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div style={S.gridOverlay} />
      <div style={S.glow} />

      <AppNav title="Documents" />

      <main style={S.main}>
        <Link
          to="/dashboard"
          style={S.backLink}
          onMouseEnter={(e) => (e.target.style.color = "#a5b4fc")}
          onMouseLeave={(e) => (e.target.style.color = "#64748b")}
        >
          ← Back to Dashboard
        </Link>

        <div style={S.eyebrow}>
          <span style={S.eyebrowLine} />
          Property Documents
        </div>
        <h1 style={S.title}>Document Manager</h1>
        <div style={S.propId}>Property ID: {routePropertyId}</div>

        {/* UPLOAD FORM */}
        <div style={S.uploadCard}>
          <div style={S.uploadTitle}>Upload New Document</div>
          <form onSubmit={handleUpload}>
            <div style={S.fieldRow}>
              <div>
                <label style={S.label}>Property ID</label>
                <FocusInput
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="Enter property ID"
                />
              </div>
              <div>
                <label style={S.label}>Select File</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#94a3b8",
                    fontSize: 13,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={S.btnRow}>
              <button
                type="submit"
                disabled={uploading}
                style={{ ...S.uploadBtn, opacity: uploading ? 0.6 : 1, cursor: uploading ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!uploading) e.target.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.target.style.opacity = uploading ? "0.6" : "1"; }}
              >
                {uploading ? "Uploading…" : "↑ Upload Document"}
              </button>
              <button
                type="button"
                onClick={() => fetchDocuments()}
                disabled={loadingDocs}
                style={{ ...S.refreshBtn, opacity: loadingDocs ? 0.5 : 1 }}
                onMouseEnter={(e) => {
                  if (!loadingDocs) {
                    e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    e.target.style.color = "#a5b4fc";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.color = "#94a3b8";
                }}
              >
                {loadingDocs ? "Loading…" : "⟳ Refresh"}
              </button>
            </div>
          </form>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}
        {success && <div style={S.successBox}>{success}</div>}

        {/* DOCUMENTS LIST */}
        <div style={S.docGrid}>
          {sortedDocuments.map((doc) => (
            <article
              key={doc._id}
              style={S.docCard}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            >
              <div style={S.docName}>{doc.fileName}</div>
              <div style={S.docType}>{doc.fileType}</div>

              <div style={S.docMetaRow}>
                <div style={S.docMetaItem}>
                  <span style={S.docMetaLabel}>Status</span>
                  <StatusBadge status={doc?.verification?.status} />
                </div>
                <div style={S.docMetaItem}>
                  <span style={S.docMetaLabel}>Risk Score</span>
                  <span style={S.docMetaValue}>
                    {typeof doc?.verification?.riskScore === "number" ? doc.verification.riskScore : "—"}
                  </span>
                </div>
                <div style={S.docMetaItem}>
                  <span style={S.docMetaLabel}>Risk Level</span>
                  <span style={S.docMetaValue}>{doc?.verification?.riskLevel || "—"}</span>
                </div>
              </div>

              {doc?.fileUrl && (
                <div style={S.docActions}>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={S.docLink}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(99,102,241,0.14)";
                      e.target.style.borderColor = "rgba(99,102,241,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(99,102,241,0.06)";
                      e.target.style.borderColor = "rgba(99,102,241,0.3)";
                    }}
                  >
                    ↗ Open
                  </a>
                  <a
                    href={doc.fileUrl}
                    download
                    style={S.docLink}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(99,102,241,0.14)";
                      e.target.style.borderColor = "rgba(99,102,241,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(99,102,241,0.06)";
                      e.target.style.borderColor = "rgba(99,102,241,0.3)";
                    }}
                  >
                    ↓ Download
                  </a>
                </div>
              )}
            </article>
          ))}

          {!loadingDocs && sortedDocuments.length === 0 && (
            <div style={S.emptyText}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>📄</div>
              No documents found for this property.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;