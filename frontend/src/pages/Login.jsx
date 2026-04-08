import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toApiErrorMessage } from "../services/api";

const Login = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { login, isAuthenticated } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setLoading(true);

		try {
			await login({ email, password });
			navigate("/dashboard", { replace: true });
		} catch (err) {
			setError(toApiErrorMessage(err, "Login failed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", fontFamily: "sans-serif", padding: 16 }}>
			<form
				onSubmit={handleSubmit}
				style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, display: "grid", gap: 12 }}
			>
				<h1 style={{ margin: 0 }}>Login</h1>
				<p style={{ margin: 0, color: "#64748b" }}>Sign in to continue.</p>

				{location.state?.message ? <p style={{ margin: 0, color: "#166534" }}>{location.state.message}</p> : null}
				{error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}

				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
				/>

				<button
					type="submit"
					disabled={loading}
					style={{
						padding: "10px 12px",
						borderRadius: 8,
						border: "1px solid #0f172a",
						background: "#0f172a",
						color: "#fff",
						cursor: loading ? "not-allowed" : "pointer",
					}}
				>
					{loading ? "Logging in..." : "Login"}
				</button>

				<p style={{ margin: 0, color: "#475569" }}>
					No account? <Link to="/signup">Sign up</Link>
				</p>
			</form>
		</div>
	);
};

export default Login;
