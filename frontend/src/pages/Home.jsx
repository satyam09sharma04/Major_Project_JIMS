import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

const Home = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setLoading(true);

		try {
			await loginUser({ email, password });
			navigate("/dashboard");
		} catch (err) {
			setError(err?.response?.data?.message || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main style={{ maxWidth: 420, margin: "64px auto", fontFamily: "sans-serif" }}>
			<h1>Property Registry</h1>
			<p>Sign in to access dashboard and protected pages.</p>
			<form onSubmit={handleSubmit}>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					required
					style={{ width: "100%", marginBottom: 12, padding: 10 }}
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
					style={{ width: "100%", marginBottom: 12, padding: 10 }}
				/>
				{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
				<button type="submit" disabled={loading} style={{ padding: "10px 16px" }}>
					{loading ? "Signing in..." : "Sign In"}
				</button>
			</form>
		</main>
	);
};

export default Home;
