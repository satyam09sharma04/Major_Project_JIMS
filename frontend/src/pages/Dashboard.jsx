import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConnectWallet from "../components/wallet/ConnectWallet";
import WalletStatus from "../components/wallet/WalletStatus";
import { logoutUser } from "../services/authService";
import { getAllProperties } from "../services/propertyService";

const Dashboard = () => {
	const navigate = useNavigate();
	const [properties, setProperties] = useState([]);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadProperties = async () => {
			try {
				const response = await getAllProperties();
				setProperties(response.data || []);
			} catch (err) {
				setError(err?.response?.data?.message || "Could not load properties");
			}
		};

		loadProperties();
	}, []);

	const handleLogout = () => {
		logoutUser();
		navigate("/");
	};

	return (
		<main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
			<div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
				<h1 style={{ marginBottom: 0 }}>Dashboard</h1>
				<button onClick={handleLogout} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
					Logout
				</button>
			</div>

			<section
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
					gap: 12,
					marginTop: 16,
					marginBottom: 16,
				}}
			>
				<div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#ffffff" }}>
					<h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 16 }}>Connect Wallet</h3>
					<ConnectWallet />
				</div>

				<WalletStatus />
			</section>

			{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
			<section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#ffffff" }}>
				<p style={{ margin: 0 }}>
					Total properties: <strong>{properties.length}</strong>
				</p>
			</section>
		</main>
	);
};

export default Dashboard;
