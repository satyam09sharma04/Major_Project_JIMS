const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer
			style={{
				marginTop: 40,
				padding: "18px 16px",
				borderTop: "1px solid #e2e8f0",
				background: "#f8fafc",
			}}
		>
			<div
				style={{
					maxWidth: 1100,
					margin: "0 auto",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 12,
					flexWrap: "wrap",
					fontFamily: "sans-serif",
				}}
			>
				<div>
					<p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Property Registry Platform</p>
					<p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
						Secure ownership tracking with Blockchain and AI Verification.
					</p>
				</div>

				<nav style={{ display: "flex", gap: 14, flexWrap: "wrap" }} aria-label="Footer links">
					<a href="/dashboard" style={{ color: "#334155", textDecoration: "none", fontSize: 14 }}>
						Dashboard
					</a>
					<a href="/documents" style={{ color: "#334155", textDecoration: "none", fontSize: 14 }}>
						Documents
					</a>
					<a href="/verify" style={{ color: "#334155", textDecoration: "none", fontSize: 14 }}>
						Verify
					</a>
					<a href="/history" style={{ color: "#334155", textDecoration: "none", fontSize: 14 }}>
						History
					</a>
				</nav>
			</div>

			<div style={{ maxWidth: 1100, margin: "10px auto 0", fontFamily: "sans-serif" }}>
				<p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
					© {currentYear} Property Registry. All rights reserved.
				</p>
			</div>
		</footer>
	);
};

export default Footer;
