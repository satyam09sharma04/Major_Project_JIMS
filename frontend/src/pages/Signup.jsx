import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toApiErrorMessage } from "../services/api";

const Signup = () => {
	const navigate = useNavigate();
	const { register, isAuthenticated } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			await register({ name, email, password });
			setSuccess("Signup successful. Redirecting to login...");
			setTimeout(() => {
				navigate("/login", {
					replace: true,
					state: { message: "Signup successful. Please login." },
				});
			}, 800);
		} catch (err) {
			setError(toApiErrorMessage(err, "Signup failed"));
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
				<h1 style={{ margin: 0 }}>Signup</h1>
				<p style={{ margin: 0, color: "#64748b" }}>Create your account.</p>

				{error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
				{success ? <p style={{ margin: 0, color: "#166534" }}>{success}</p> : null}

				<input type="text" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
				<input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
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
					{loading ? "Creating account..." : "Signup"}
				</button>

				<p style={{ margin: 0, color: "#475569" }}>
					Already have an account? <Link to="/login">Login</Link>
				</p>
			</form>
		</div>
	);
};

export default Signup;
