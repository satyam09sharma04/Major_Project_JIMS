import { useMemo, useState } from "react";
import RiskScoreBadge from "./RiskScoreBadge";

const formatDate = (value) => {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	return date.toLocaleString();
};

const VerificationResult = ({ verification, title = "Verification Result", compact = false }) => {
	const [showText, setShowText] = useState(false);

	const safeVerification = verification || {};
	const matchedFields = safeVerification.matchedFields || {};
	const flags = Array.isArray(safeVerification.flags) ? safeVerification.flags : [];

	const matchEntries = useMemo(() => Object.entries(matchedFields), [matchedFields]);

	if (!verification) {
		return (
			<section
				style={{
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 14,
					background: "#ffffff",
					fontFamily: "sans-serif",
				}}
			>
				<h3 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h3>
				<p style={{ margin: 0, color: "#64748b" }}>No verification data available yet.</p>
			</section>
		);
	}

	return (
		<section
			style={{
				border: "1px solid #e2e8f0",
				borderRadius: 12,
				padding: 14,
				background: "#ffffff",
				fontFamily: "sans-serif",
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
				<h3 style={{ margin: 0 }}>{title}</h3>
				<RiskScoreBadge
					score={safeVerification.riskScore}
					riskLevel={safeVerification.riskLevel}
					status={safeVerification.status}
				/>
			</div>

			<div style={{ marginTop: 10, display: "grid", gap: 6, color: "#334155", fontSize: 14 }}>
				<div>
					Status: <strong>{safeVerification.status || "-"}</strong>
				</div>
				<div>
					Source: <strong>{safeVerification.source || "-"}</strong>
				</div>
				<div>
					Risk Level: <strong>{safeVerification.riskLevel || "-"}</strong>
				</div>
				<div>
					Risk Score: <strong>{typeof safeVerification.riskScore === "number" ? safeVerification.riskScore : "-"}</strong>
				</div>
				<div>
					Match Percentage: <strong>{typeof safeVerification.matchPercentage === "number" ? safeVerification.matchPercentage : "-"}%</strong>
				</div>
				<div>
					Verified At: <strong>{formatDate(safeVerification.verifiedAt)}</strong>
				</div>
			</div>

			{safeVerification.summary ? (
				<p style={{ marginTop: 10, marginBottom: 0, color: "#475569" }}>
					<strong>Summary:</strong> {safeVerification.summary}
				</p>
			) : null}

			{matchEntries.length ? (
				<div style={{ marginTop: 12 }}>
					<p style={{ margin: "0 0 6px", fontWeight: 700, color: "#334155" }}>Field Match</p>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
						{matchEntries.map(([field, isMatched]) => (
							<span
								key={field}
								style={{
									padding: "4px 8px",
									borderRadius: 999,
									fontSize: 12,
									fontWeight: 700,
									background: isMatched ? "#dcfce7" : "#fee2e2",
									color: isMatched ? "#166534" : "#991b1b",
									border: `1px solid ${isMatched ? "#86efac" : "#fca5a5"}`,
								}}
							>
								{field}: {isMatched ? "Matched" : "Not Matched"}
							</span>
						))}
					</div>
				</div>
			) : null}

			{flags.length ? (
				<div style={{ marginTop: 12 }}>
					<p style={{ margin: "0 0 6px", fontWeight: 700, color: "#334155" }}>Risk Flags</p>
					<ul style={{ margin: 0, paddingLeft: 18, color: "#7f1d1d" }}>
						{flags.map((flag, index) => (
							<li key={`${flag}-${index}`}>{flag}</li>
						))}
					</ul>
				</div>
			) : null}

			{!compact && safeVerification.extractedText ? (
				<div style={{ marginTop: 12 }}>
					<button
						type="button"
						onClick={() => setShowText((prev) => !prev)}
						style={{
							padding: "8px 10px",
							borderRadius: 8,
							border: "1px solid #cbd5e1",
							background: "#ffffff",
							cursor: "pointer",
						}}
					>
						{showText ? "Hide OCR Text" : "Show OCR Text"}
					</button>

					{showText ? (
						<pre
							style={{
								marginTop: 10,
								padding: 10,
								background: "#f8fafc",
								border: "1px solid #e2e8f0",
								borderRadius: 8,
								maxHeight: 240,
								overflow: "auto",
								whiteSpace: "pre-wrap",
								wordBreak: "break-word",
								fontSize: 13,
								lineHeight: 1.4,
								color: "#334155",
							}}
						>
							{safeVerification.extractedText}
						</pre>
					) : null}
				</div>
			) : null}

			{safeVerification.errorMessage ? (
				<p style={{ marginTop: 10, marginBottom: 0, color: "#991b1b" }}>
					<strong>Error:</strong> {safeVerification.errorMessage}
				</p>
			) : null}
		</section>
	);
};

export default VerificationResult;
