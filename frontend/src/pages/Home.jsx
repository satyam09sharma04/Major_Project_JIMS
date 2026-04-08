import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
	const navigate = useNavigate();
	const { login, isAuthenticated } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [focusedField, setFocusedField] = useState(null);

	useEffect(() => {
		setTimeout(() => setMounted(true), 60);
	}, []);

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
			navigate("/dashboard");
		} catch (err) {
			setError(err?.response?.data?.message || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap');

				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

				.hl-page {
					min-height: 100vh;
					display: grid;
					grid-template-columns: 1fr 1fr;
					background: #080a09;
					font-family: 'Outfit', sans-serif;
					overflow: hidden;
					position: relative;
				}

				/* ── LEFT PANEL ── */
				.hl-left {
					position: relative;
					overflow: hidden;
					display: flex;
					flex-direction: column;
					justify-content: flex-end;
					padding: 52px;
				}

				.hl-left-img {
					position: absolute;
					inset: 0;
					background:
						linear-gradient(160deg, rgba(8,10,9,0) 30%, rgba(8,10,9,0.85) 100%),
						linear-gradient(to right, rgba(8,10,9,0.3) 0%, transparent 50%),
						url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80') center/cover no-repeat;
					transform: scale(1.06);
					animation: zoomOut 12s ease-out forwards;
					filter: brightness(0.75);
				}

				@keyframes zoomOut {
					from { transform: scale(1.06); }
					to   { transform: scale(1.0); }
				}

				.hl-left-content {
					position: relative;
					z-index: 2;
					opacity: 0;
					transform: translateY(24px);
					animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s forwards;
				}

				.hl-tag {
					display: inline-flex;
					align-items: center;
					gap: 8px;
					background: rgba(180,255,120,0.12);
					border: 1px solid rgba(180,255,120,0.3);
					border-radius: 100px;
					padding: 5px 14px;
					font-size: 11px;
					letter-spacing: 0.18em;
					text-transform: uppercase;
					color: #b4ff78;
					font-weight: 500;
					margin-bottom: 20px;
				}
				.hl-tag-dot {
					width: 6px; height: 6px;
					border-radius: 50%;
					background: #b4ff78;
					animation: pulse 2s ease-in-out infinite;
				}

				.hl-left-heading {
					font-family: 'Cormorant Garamond', serif;
					font-size: clamp(38px, 4.5vw, 58px);
					font-weight: 300;
					color: #f2ede4;
					line-height: 1.1;
					margin-bottom: 16px;
				}
				.hl-left-heading em {
					font-style: italic;
					color: #b4ff78;
				}

				.hl-left-sub {
					font-size: 14px;
					color: rgba(242,237,228,0.5);
					line-height: 1.7;
					max-width: 340px;
					font-weight: 300;
				}

				.hl-left-stats {
					display: flex;
					gap: 32px;
					margin-top: 36px;
					padding-top: 28px;
					border-top: 1px solid rgba(255,255,255,0.08);
				}
				.hl-stat-val {
					font-family: 'Cormorant Garamond', serif;
					font-size: 30px;
					font-weight: 400;
					color: #f2ede4;
					display: block;
					line-height: 1;
				}
				.hl-stat-lbl {
					font-size: 11px;
					color: rgba(255,255,255,0.35);
					letter-spacing: 0.08em;
					text-transform: uppercase;
					display: block;
					margin-top: 4px;
				}

				/* ── RIGHT PANEL ── */
				.hl-right {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					padding: 60px 52px;
					position: relative;
					background: #0d100d;
					border-left: 1px solid rgba(255,255,255,0.04);
				}

				/* Subtle grid pattern */
				.hl-right::before {
					content: '';
					position: absolute;
					inset: 0;
					background-image:
						linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
						linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
					background-size: 48px 48px;
					pointer-events: none;
				}
				/* Radial vignette over grid */
				.hl-right::after {
					content: '';
					position: absolute;
					inset: 0;
					background: radial-gradient(ellipse at 50% 50%, transparent 30%, #0d100d 100%);
					pointer-events: none;
				}

				/* Glow orb */
				.hl-orb {
					position: absolute;
					top: -120px; right: -120px;
					width: 400px; height: 400px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(180,255,120,0.07) 0%, transparent 70%);
					pointer-events: none;
				}

				.hl-form-wrap {
					position: relative;
					z-index: 2;
					width: 100%;
					max-width: 380px;
					opacity: 0;
					transform: translateX(20px);
					animation: slideIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.5s forwards;
				}

				.hl-logo {
					display: flex;
					align-items: center;
					gap: 10px;
					margin-bottom: 48px;
				}
				.hl-logo-mark {
					width: 36px; height: 36px;
					border: 1.5px solid #b4ff78;
					border-radius: 8px;
					display: flex; align-items: center; justify-content: center;
					color: #b4ff78;
					font-size: 16px;
					flex-shrink: 0;
				}
				.hl-logo-text {
					font-family: 'Cormorant Garamond', serif;
					font-size: 20px;
					font-weight: 600;
					color: #f2ede4;
					letter-spacing: 0.04em;
				}
				.hl-logo-sub {
					font-size: 10px;
					letter-spacing: 0.18em;
					text-transform: uppercase;
					color: rgba(255,255,255,0.25);
					margin-top: 1px;
					font-family: 'Outfit', sans-serif;
				}

				.hl-form-title {
					font-family: 'Cormorant Garamond', serif;
					font-size: 36px;
					font-weight: 300;
					color: #f2ede4;
					margin-bottom: 6px;
					line-height: 1.1;
				}
				.hl-form-title em { font-style: italic; color: #b4ff78; }
				.hl-form-sub {
					font-size: 13px;
					color: rgba(255,255,255,0.3);
					margin-bottom: 40px;
					font-weight: 300;
				}

				/* Input groups */
				.hl-field {
					margin-bottom: 18px;
					position: relative;
				}
				.hl-label {
					display: block;
					font-size: 11px;
					letter-spacing: 0.12em;
					text-transform: uppercase;
					color: rgba(255,255,255,0.35);
					margin-bottom: 8px;
					transition: color 0.2s;
				}
				.hl-field.focused .hl-label { color: #b4ff78; }

				.hl-input-wrap {
					position: relative;
					display: flex;
					align-items: center;
				}
				.hl-input-icon {
					position: absolute;
					left: 16px;
					color: rgba(255,255,255,0.2);
					transition: color 0.25s;
					pointer-events: none;
					display: flex;
				}
				.hl-field.focused .hl-input-icon { color: #b4ff78; }

				.hl-input {
					width: 100%;
					background: rgba(255,255,255,0.04);
					border: 1px solid rgba(255,255,255,0.08);
					border-radius: 12px;
					padding: 14px 16px 14px 44px;
					color: #f2ede4;
					font-family: 'Outfit', sans-serif;
					font-size: 14px;
					font-weight: 300;
					outline: none;
					transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
					-webkit-appearance: none;
				}
				.hl-input::placeholder { color: rgba(255,255,255,0.18); }
				.hl-input:focus {
					border-color: rgba(180,255,120,0.4);
					background: rgba(180,255,120,0.04);
					box-shadow: 0 0 0 3px rgba(180,255,120,0.08), inset 0 0 20px rgba(180,255,120,0.02);
				}
				.hl-input:-webkit-autofill {
					-webkit-box-shadow: 0 0 0 1000px #131613 inset;
					-webkit-text-fill-color: #f2ede4;
				}

				/* Underline highlight bar */
				.hl-input-bar {
					position: absolute;
					bottom: 0; left: 12px; right: 12px;
					height: 2px;
					background: linear-gradient(90deg, #b4ff78, #78ffd6);
					border-radius: 2px;
					transform: scaleX(0);
					transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
				}
				.hl-field.focused .hl-input-bar { transform: scaleX(1); }

				/* Error */
				.hl-error {
					display: flex;
					align-items: center;
					gap: 8px;
					background: rgba(239,68,68,0.07);
					border: 1px solid rgba(239,68,68,0.2);
					border-radius: 10px;
					padding: 12px 14px;
					color: #fca5a5;
					font-size: 13px;
					margin-bottom: 20px;
					animation: shake 0.4s ease;
				}
				@keyframes shake {
					0%,100% { transform: translateX(0); }
					20%      { transform: translateX(-6px); }
					40%      { transform: translateX(6px); }
					60%      { transform: translateX(-4px); }
					80%      { transform: translateX(4px); }
				}

				/* Submit button */
				.hl-btn {
					width: 100%;
					padding: 15px;
					border-radius: 12px;
					border: none;
					background: #b4ff78;
					color: #0a0f09;
					font-family: 'Outfit', sans-serif;
					font-size: 14px;
					font-weight: 600;
					letter-spacing: 0.06em;
					text-transform: uppercase;
					cursor: pointer;
					position: relative;
					overflow: hidden;
					transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
					margin-top: 8px;
				}
				.hl-btn:not(:disabled):hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 32px rgba(180,255,120,0.3);
					background: #c8ff99;
				}
				.hl-btn:not(:disabled):active { transform: translateY(0); }
				.hl-btn:disabled { opacity: 0.6; cursor: not-allowed; }

				/* Shimmer on button */
				.hl-btn::after {
					content: '';
					position: absolute;
					top: 0; left: -100%; width: 60%; height: 100%;
					background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
					transform: skewX(-20deg);
					animation: shimmer 2.4s ease-in-out infinite;
				}
				@keyframes shimmer {
					0%   { left: -100%; }
					60%,100% { left: 160%; }
				}

				.hl-btn-inner {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					position: relative;
					z-index: 1;
				}

				/* Spinner */
				.hl-spinner {
					width: 16px; height: 16px;
					border: 2px solid rgba(10,15,9,0.3);
					border-top-color: #0a0f09;
					border-radius: 50%;
					animation: spin 0.7s linear infinite;
				}
				@keyframes spin { to { transform: rotate(360deg); } }

				.hl-divider {
					display: flex;
					align-items: center;
					gap: 12px;
					margin: 28px 0 0;
					color: rgba(255,255,255,0.15);
					font-size: 11px;
					letter-spacing: 0.08em;
					text-transform: uppercase;
				}
				.hl-divider::before, .hl-divider::after {
					content: '';
					flex: 1;
					height: 1px;
					background: rgba(255,255,255,0.07);
				}

				/* ── Animations ── */
				@keyframes fadeUp {
					from { opacity: 0; transform: translateY(24px); }
					to   { opacity: 1; transform: translateY(0); }
				}
				@keyframes slideIn {
					from { opacity: 0; transform: translateX(20px); }
					to   { opacity: 1; transform: translateX(0); }
				}
				@keyframes pulse {
					0%,100% { opacity: 1; transform: scale(1); }
					50%      { opacity: 0.4; transform: scale(0.8); }
				}

				/* ── Responsive ── */
				@media (max-width: 768px) {
					.hl-page { grid-template-columns: 1fr; }
					.hl-left  { display: none; }
					.hl-right { padding: 48px 28px; min-height: 100vh; }
				}
			`}</style>

			<div className="hl-page">
				{/* ── LEFT PANEL ── */}
				<div className="hl-left">
					<div className="hl-left-img" />
					<div className="hl-left-content">
						<div className="hl-tag">
							<span className="hl-tag-dot" />
							Premium Real Estate
						</div>
						<h2 className="hl-left-heading">
							Where Luxury<br />Meets <em>Property</em>
						</h2>
						<p className="hl-left-sub">
							Access exclusive listings, manage your portfolio, and connect with the finest properties across the globe — all in one place.
						</p>
						<div className="hl-left-stats">
							<div>
								<span className="hl-stat-val">2,400+</span>
								<span className="hl-stat-lbl">Properties</span>
							</div>
							<div>
								<span className="hl-stat-val">₹ 840 Cr</span>
								<span className="hl-stat-lbl">Portfolio Value</span>
							</div>
							<div>
								<span className="hl-stat-val">98%</span>
								<span className="hl-stat-lbl">Client Satisfaction</span>
							</div>
						</div>
					</div>
				</div>

				{/* ── RIGHT PANEL ── */}
				<div className="hl-right">
					<div className="hl-orb" />

					<div className="hl-form-wrap">
						{/* Logo */}
						<div className="hl-logo">
							<div className="hl-logo-mark">⬡</div>
							<div>
								<div className="hl-logo-text">PropRegistry</div>
								<div className="hl-logo-sub">Realty Intelligence</div>
							</div>
						</div>

						<h1 className="hl-form-title">Welcome <em>back</em></h1>
						<p className="hl-form-sub">Sign in to your account to continue</p>

						<form onSubmit={handleSubmit}>
							{/* Email */}
							<div className={`hl-field ${focusedField === "email" ? "focused" : ""}`}>
								<label className="hl-label">Email Address</label>
								<div className="hl-input-wrap">
									<span className="hl-input-icon">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
											<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
										</svg>
									</span>
									<input
										className="hl-input"
										type="email"
										placeholder="name@company.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										onFocus={() => setFocusedField("email")}
										onBlur={() => setFocusedField(null)}
										required
									/>
									<span className="hl-input-bar" />
								</div>
							</div>

							{/* Password */}
							<div className={`hl-field ${focusedField === "password" ? "focused" : ""}`}>
								<label className="hl-label">Password</label>
								<div className="hl-input-wrap">
									<span className="hl-input-icon">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
											<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
										</svg>
									</span>
									<input
										className="hl-input"
										type="password"
										placeholder="••••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										onFocus={() => setFocusedField("password")}
										onBlur={() => setFocusedField(null)}
										required
									/>
									<span className="hl-input-bar" />
								</div>
							</div>

							{/* Error */}
							{error && (
								<div className="hl-error">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
									</svg>
									{error}
								</div>
							)}

							{/* Button */}
							<button className="hl-btn" type="submit" disabled={loading}>
								<span className="hl-btn-inner">
									{loading ? (
										<><span className="hl-spinner" /> Signing in…</>
									) : (
										<>
											Sign In
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
											</svg>
										</>
									)}
								</span>
							</button>

							<div className="hl-divider">Secure access portal</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
};

export default Home;