import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, isAuthenticated, logoutUser } from "../../services/authService";

const linkStyle = ({ isActive }) => ({
	textDecoration: "none",
	color: isActive ? "#0f172a" : "#475569",
	fontWeight: isActive ? 700 : 500,
	padding: "6px 8px",
	borderRadius: 8,
	background: isActive ? "#e2e8f0" : "transparent",
	fontSize: 14,
});

const Navbar = () => {
	const navigate = useNavigate();
	const [loggedIn, setLoggedIn] = useState(isAuthenticated());
	const [user, setUser] = useState(getStoredUser());

	useEffect(() => {
		const syncAuthState = () => {
			setLoggedIn(isAuthenticated());
			setUser(getStoredUser());
		};

		syncAuthState();
		window.addEventListener("storage", syncAuthState);
		window.addEventListener("focus", syncAuthState);

		return () => {
			window.removeEventListener("storage", syncAuthState);
			window.removeEventListener("focus", syncAuthState);
		};
	}, []);

	const walletLabel = useMemo(() => {
		if (!loggedIn) {
			return "Wallet: Not Connected";
		}

		const sampleAddress = "0xA1b2...9F3D";
		return `Wallet: ${sampleAddress}`;
	}, [loggedIn]);

	const handleLogout = () => {
		logoutUser();
		setLoggedIn(false);
		setUser(null);
		navigate("/");
	};

	return (
		<header
			style={{
				borderBottom: "1px solid #e2e8f0",
				background: "#ffffff",
				position: "sticky",
				top: 0,
				zIndex: 50,
			}}
		>
			<div
				style={{
					maxWidth: 1150,
					margin: "0 auto",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
					padding: "12px 16px",
					flexWrap: "wrap",
					fontFamily: "sans-serif",
				}}
			>
				<Link to="/" style={{ textDecoration: "none", color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
					PropLedger
				</Link>

				<nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }} aria-label="Main navigation">
					<NavLink to="/dashboard" style={linkStyle}>
						Dashboard
					</NavLink>
					<NavLink to="/properties/new" style={linkStyle}>
						Register
					</NavLink>
					<NavLink to="/documents" style={linkStyle}>
						Documents
					</NavLink>
					<NavLink to="/verify" style={linkStyle}>
						Verify
					</NavLink>
					<NavLink to="/history" style={linkStyle}>
						History
					</NavLink>
					<NavLink to="/transfer" style={linkStyle}>
						Transfer
					</NavLink>
					<NavLink to="/admin" style={linkStyle}>
						Admin
					</NavLink>
				</nav>

				<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
					<span
						style={{
							fontSize: 12,
							color: "#334155",
							background: "#f8fafc",
							border: "1px solid #e2e8f0",
							padding: "6px 8px",
							borderRadius: 999,
						}}
					>
						{walletLabel}
					</span>

					{loggedIn ? (
						<>
							<span style={{ fontSize: 13, color: "#475569" }}>{user?.name || user?.email || "User"}</span>
							<button
								type="button"
								onClick={handleLogout}
								style={{
									border: "1px solid #cbd5e1",
									background: "#fff",
									color: "#0f172a",
									padding: "7px 10px",
									borderRadius: 8,
									cursor: "pointer",
									fontSize: 13,
								}}
							>
								Logout
							</button>
						</>
					) : (
						<button
							type="button"
							onClick={() => navigate("/")}
							style={{
								border: "1px solid #0f172a",
								background: "#0f172a",
								color: "#fff",
								padding: "7px 10px",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 13,
							}}
						>
							Login
						</button>
					)}
				</div>
			</div>
		</header>
	);
};

export default Navbar;