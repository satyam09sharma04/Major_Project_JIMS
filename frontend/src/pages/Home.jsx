import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
	const navigate = useNavigate();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const id = window.setTimeout(() => setMounted(true), 80);
		return () => window.clearTimeout(id);
	}, []);

	const stats = [
		{ label: "Total Properties", value: "2,400+" },
		{ label: "Verified Records", value: "98%" },
		{ label: "Risk Alerts", value: "42" },
	];

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap');

				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

				.lh-page {
					min-height: 100vh;
					position: relative;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 40px 22px;
					background:
						radial-gradient(1200px 540px at -10% -10%, rgba(99, 102, 241, 0.20), transparent 60%),
						radial-gradient(900px 520px at 110% 10%, rgba(139, 92, 246, 0.16), transparent 62%),
						linear-gradient(160deg, #080a12 0%, #0b0f1b 52%, #0b0d16 100%);
					font-family: 'Inter', sans-serif;
					overflow: hidden;
				}

				.lh-page::before {
					content: '';
					position: absolute;
					inset: 0;
					background-image:
						linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
						linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
					background-size: 48px 48px;
					opacity: 0.12;
					pointer-events: none;
				}

				.lh-glow {
					position: relative;
					width: min(1100px, 100%);
					border-radius: 26px;
					padding: 42px;
					z-index: 1;
					background: rgba(8, 11, 24, 0.58);
					border: 1px solid rgba(148, 163, 184, 0.20);
					backdrop-filter: blur(14px);
					box-shadow:
						0 20px 70px rgba(2, 6, 23, 0.55),
						inset 0 1px 0 rgba(255, 255, 255, 0.05);
					opacity: 0;
					transform: translateY(18px);
					transition: opacity 0.65s ease, transform 0.65s ease;
				}
				.lh-glow.mounted { opacity: 1; transform: translateY(0); }

				.lh-orb {
					content: '';
					position: absolute;
					width: 320px;
					height: 320px;
					border-radius: 50%;
					pointer-events: none;
					filter: blur(8px);
					animation: floatOrb 8s ease-in-out infinite;
				}
				.lh-orb.one {
					top: -120px;
					right: -90px;
					background: radial-gradient(circle, rgba(99, 102, 241, 0.34) 0%, transparent 70%);
				}
				.lh-orb.two {
					bottom: -130px;
					left: -110px;
					background: radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, transparent 72%);
					animation-delay: 1.8s;
				}

				@keyframes floatOrb {
					0%,100% { transform: translateY(0); }
					50%      { transform: translateY(-22px); }
				}

				.lh-header {
					position: relative;
					z-index: 2;
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 16px;
					margin-bottom: 30px;
				}

				.lh-brand {
					display: flex;
					align-items: center;
					gap: 12px;
				}
				.lh-brand-icon {
					width: 42px;
					height: 42px;
					border-radius: 12px;
					display: grid;
					place-items: center;
					background: linear-gradient(135deg, #6366f1, #8b5cf6);
					color: #f8fafc;
					font-size: 20px;
					box-shadow: 0 12px 30px rgba(99, 102, 241, 0.45);
				}
				.lh-brand-name {
					font-family: 'JetBrains Mono', monospace;
					font-size: 18px;
					font-weight: 600;
					color: #e2e8f0;
				}
				.lh-brand-sub {
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					letter-spacing: 0.16em;
					text-transform: uppercase;
					color: rgba(148, 163, 184, 0.85);
					margin-top: 2px;
				}

				.lh-main {
					position: relative;
					z-index: 2;
					display: grid;
					grid-template-columns: 1.1fr 0.9fr;
					gap: 26px;
					align-items: stretch;
				}

				.lh-eyebrow {
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					color: #818cf8;
					letter-spacing: 0.18em;
					text-transform: uppercase;
					margin-bottom: 16px;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				.lh-eyebrow::before {
					content: '';
					width: 28px;
					height: 1px;
					background: rgba(129, 140, 248, 0.85);
				}

				.lh-title {
					font-size: clamp(36px, 5vw, 58px);
					font-weight: 300;
					line-height: 1.06;
					margin-bottom: 18px;
					letter-spacing: -0.02em;
					color: #f8fafc;
				}
				.lh-title strong {
					font-weight: 600;
					background: linear-gradient(135deg, #93c5fd 0%, #a78bfa 42%, #818cf8 100%);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
				}

				.lh-subtext {
					font-size: 14px;
					font-weight: 300;
					line-height: 1.8;
					max-width: 62ch;
					color: rgba(226, 232, 240, 0.74);
				}

				.lh-actions {
					display: flex;
					flex-wrap: wrap;
					gap: 12px;
					margin-top: 26px;
				}

				.lh-btn {
					border: 0;
					cursor: pointer;
					min-height: 52px;
					padding: 0 20px;
					border-radius: 14px;
					font-family: 'JetBrains Mono', monospace;
					font-size: 12px;
					font-weight: 600;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
				}
				.lh-btn.primary {
					color: #ffffff;
					background: linear-gradient(135deg, #3b82f6, #8b5cf6);
					box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
				}
				.lh-btn.secondary {
					color: #e2e8f0;
					background: linear-gradient(135deg, #1e293b, #334155);
					border: 1px solid rgba(148, 163, 184, 0.35);
					box-shadow: 0 10px 24px rgba(15, 23, 42, 0.4);
				}
				.lh-btn.ghost {
					color: #cbd5e1;
					background: rgba(15, 23, 42, 0.6);
					border: 1px solid rgba(148, 163, 184, 0.22);
				}
				.lh-btn:hover {
					transform: translateY(-2px);
				}
				.lh-btn.primary:hover {
					box-shadow: 0 16px 36px rgba(99, 102, 241, 0.45);
				}
				.lh-btn.secondary:hover,
				.lh-btn.ghost:hover {
					box-shadow: 0 14px 28px rgba(15, 23, 42, 0.55);
				}

				.lh-panel {
					background: rgba(15, 23, 42, 0.55);
					border: 1px solid rgba(148, 163, 184, 0.22);
					border-radius: 18px;
					padding: 20px;
					backdrop-filter: blur(8px);
				}

				.lh-panel-title {
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					letter-spacing: 0.14em;
					text-transform: uppercase;
					color: rgba(148, 163, 184, 0.9);
					margin-bottom: 14px;
				}

				.lh-stats {
					display: grid;
					gap: 10px;
				}
				.lh-stat {
					border-radius: 12px;
					padding: 14px;
					background: rgba(30, 41, 59, 0.56);
					border: 1px solid rgba(148, 163, 184, 0.2);
				}
				.lh-stat-value {
					font-family: 'JetBrains Mono', monospace;
					font-size: 24px;
					font-weight: 500;
					color: #f8fafc;
					display: block;
					margin-bottom: 6px;
				}
				.lh-stat-label {
					font-family: 'JetBrains Mono', monospace;
					font-size: 10px;
					color: rgba(203, 213, 225, 0.72);
					letter-spacing: 0.12em;
					text-transform: uppercase;
				}

				.lh-status {
					display: flex;
					align-items: center;
					gap: 8px;
					margin-top: 16px;
					padding: 11px 13px;
					background: rgba(59, 130, 246, 0.10);
					border: 1px solid rgba(59, 130, 246, 0.22);
					border-radius: 8px;
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					color: rgba(191, 219, 254, 0.9);
					letter-spacing: 0.08em;
				}
				.lh-status-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: #60a5fa;
					box-shadow: 0 0 12px rgba(96, 165, 250, 0.8);
					animation: statusPulse 2s ease-in-out infinite;
					flex-shrink: 0;
				}
				@keyframes statusPulse {
					0%,100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
				.lh-footer {
					margin-top: 30px;
					padding-top: 20px;
					border-top: 1px solid rgba(148, 163, 184, 0.22);
					font-family: 'JetBrains Mono', monospace;
					font-size: 11px;
					letter-spacing: 0.1em;
					text-transform: uppercase;
					color: rgba(148, 163, 184, 0.82);
					text-align: center;
				}

				@media (max-width: 960px) {
					.lh-glow { padding: 30px 22px; }
					.lh-main { grid-template-columns: 1fr; }
					.lh-title { font-size: clamp(32px, 8vw, 46px); }
					.lh-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
				}

				@media (max-width: 640px) {
					.lh-page { padding: 20px 14px; }
					.lh-header { margin-bottom: 20px; }
					.lh-actions { flex-direction: column; }
					.lh-btn { width: 100%; }
					.lh-stats { grid-template-columns: 1fr; }
					.lh-orb { width: 230px; height: 230px; }
				}
			`}</style>

			<div className="lh-page">
				<div className={`lh-glow ${mounted ? "mounted" : ""}`}>
					<div className="lh-orb one" />
					<div className="lh-orb two" />

					<header className="lh-header">
						<div className="lh-brand">
							<div className="lh-brand-icon">L</div>
							<div>
								<div className="lh-brand-name">LandVerify</div>
								<div className="lh-brand-sub">Blockchain Property Intelligence</div>
							</div>
						</div>
					</header>

					<main className="lh-main">
						<section className="lh-panel">
							<div className="lh-eyebrow">Trusted Property Stack</div>
							<h1 className="lh-title">
								Secure. Verify. <strong>Trust Property Ownership.</strong>
							</h1>
							<p className="lh-subtext">
								LandVerify provides blockchain-backed property records, fraud-aware verification,
								and a reliable ownership trail for citizens, operators, and administrators.
							</p>

							<div className="lh-actions">
								<button className="lh-btn primary" type="button" onClick={() => navigate("/admin")}>
									Go to Admin Panel
								</button>
								<button className="lh-btn secondary" type="button" onClick={() => navigate("/dashboard")}>
									Go to Dashboard
								</button>
								<button className="lh-btn ghost" type="button" onClick={() => navigate("/login")}>
									Login
								</button>
							</div>
						</section>

						<section className="lh-panel">
							<div className="lh-panel-title">Network Snapshot</div>
							<div className="lh-stats">
								{stats.map((stat) => (
									<div key={stat.label} className="lh-stat">
										<span className="lh-stat-value">{stat.value}</span>
										<span className="lh-stat-label">{stat.label}</span>
									</div>
								))}
							</div>
							<div className="lh-status">
								<span className="lh-status-dot" />
								Powered by live blockchain verification
							</div>
						</section>
					</main>

					<footer className="lh-footer">
						Powered by Blockchain Verification
					</footer>
				</div>
			</div>
		</>
	);
};

export default Home; 