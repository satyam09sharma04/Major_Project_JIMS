import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useWallet from "../../hooks/useWallet";

const navStyle = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: "12px 16px",
	borderBottom: "1px solid #e2e8f0",
	background: "#ffffff",
	position: "sticky",
	top: 0,
	zIndex: 10,
};

const AppNav = ({ title = "Property Registry" }) => {
	const navigate = useNavigate();
	const { user, logout, isAuthenticated } = useAuth();
	const wallet = useWallet();

	const handleLogout = () => {
		logout();
		navigate("/login", { replace: true });
	};

	return (
		<nav style={navStyle}>
			<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
				<strong>{title}</strong>
				{isAuthenticated ? (
					<Link to="/dashboard">Dashboard</Link>
				) : (
					<>
						<Link to="/login">Login</Link>
						<Link to="/signup">Signup</Link>
					</>
				)}
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
				{isAuthenticated && wallet.isConnected ? (
					<span style={{ fontSize: 12, color: "#0f766e" }}>{wallet.shortAddress}</span>
				) : null}
				{isAuthenticated && !wallet.isConnected ? (
					<button
						type="button"
						onClick={() => wallet.connect()}
						style={{
							padding: "8px 12px",
							borderRadius: 8,
							border: "1px solid #155e75",
							background: "#ecfeff",
							color: "#155e75",
							cursor: "pointer",
						}}
					>
						Connect Wallet
					</button>
				) : null}
				{isAuthenticated ? (
					<>
						<span style={{ fontSize: 13, color: "#475569" }}>{user?.name || user?.email || "User"}</span>
						<button
							type="button"
							onClick={handleLogout}
							style={{
								padding: "8px 12px",
								borderRadius: 8,
								border: "1px solid #0f172a",
								background: "#0f172a",
								color: "#ffffff",
								cursor: "pointer",
							}}
						>
							Logout
						</button>
					</>
				) : null}
			</div>
		</nav>
	);
};

export default AppNav;
