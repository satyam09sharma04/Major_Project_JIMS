import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toApiErrorMessage } from "../services/api";

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#080c12",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  glow: {
    position: "absolute",
    top: "-120px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "500px",
    height: "300px",
    background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 420,
    background: "rgba(15, 18, 27, 0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: "36px 32px 32px",
    display: "grid",
    gap: 0,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "#a5b4fc",
    textTransform: "uppercase",
    marginBottom: 18,
    width: "fit-content",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#818cf8",
    display: "inline-block",
  },
  heading: {
    margin: "0 0 6px",
    fontSize: 28,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  subheading: {
    margin: "0 0 28px",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.5,
  },
  errorBox: {
    margin: "0 0 16px",
    padding: "10px 14px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    color: "#fca5a5",
    fontSize: 13,
  },
  successBox: {
    margin: "0 0 16px",
    padding: "10px 14px",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: 10,
    color: "#86efac",
    fontSize: 13,
  },
  fieldGroup: {
    display: "grid",
    gap: 10,
    marginBottom: 6,
  },
  labelWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.05)",
    margin: "22px 0",
  },
  footer: {
    textAlign: "center",
    color: "#475569",
    fontSize: 13,
    margin: 0,
  },
};

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#e2e8f0",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
  fontFamily: "inherit",
};

const FieldInput = ({ type, placeholder, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        borderColor: focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
      }}
    />
  );
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const fromPath = location.state?.from?.pathname || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [fromPath, isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(toApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={styles.gridOverlay} />
      <div style={styles.glow} />

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.badge}>
          <span style={styles.dot} />
          Welcome back
        </div>

        <h1 style={styles.heading}>Sign in</h1>
        <p style={styles.subheading}>Enter your credentials to access your account.</p>

        {location.state?.message && <div style={styles.successBox}>{location.state.message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.fieldGroup}>
          <div style={styles.labelWrapper}>
            <span style={styles.label}>Email Address</span>
            <FieldInput
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.labelWrapper}>
            <span style={styles.label}>Password</span>
            <FieldInput
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "none",
            background: loading
              ? "rgba(99,102,241,0.5)"
              : "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.2s, transform 0.1s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { if (!loading) e.target.style.opacity = "0.88"; }}
          onMouseLeave={(e) => { e.target.style.opacity = "1"; }}
          onMouseDown={(e) => { if (!loading) e.target.style.transform = "scale(0.99)"; }}
          onMouseUp={(e) => { e.target.style.transform = "scale(1)"; }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <div style={styles.divider} />

        <p style={styles.footer}>
          No account?{" "}
          <Link to="/signup" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
            Create one free
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;