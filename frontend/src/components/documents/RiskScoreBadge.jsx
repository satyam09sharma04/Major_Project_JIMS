const getRiskMeta = (score, riskLevel, status) => {
	if (status === "FAILED") {
		return {
			label: "Verification Failed",
			bg: "#fee2e2",
			color: "#991b1b",
			border: "#fca5a5",
		};
	}

	if (status === "PENDING") {
		return {
			label: "Pending",
			bg: "#e2e8f0",
			color: "#334155",
			border: "#cbd5e1",
		};
	}

	if (typeof score !== "number") {
		return {
			label: "Not Verified",
			bg: "#e2e8f0",
			color: "#334155",
			border: "#cbd5e1",
		};
	}

	if (riskLevel === "LOW" || score >= 80) {
		return {
			label: "Low Risk",
			bg: "#dcfce7",
			color: "#166534",
			border: "#86efac",
		};
	}

	if (riskLevel === "MEDIUM" || (score >= 50 && score < 80)) {
		return {
			label: "Medium Risk",
			bg: "#fef9c3",
			color: "#854d0e",
			border: "#fde047",
		};
	}

	return {
		label: "High Risk",
		bg: "#fee2e2",
		color: "#991b1b",
		border: "#fca5a5",
	};
};

const RiskScoreBadge = ({
	score,
	riskLevel,
	status,
	showScore = true,
	size = "md",
	className = "",
	style = {},
}) => {
	const meta = getRiskMeta(score, riskLevel, status);
	const isSmall = size === "sm";

	return (
		<span
			className={className}
			title={typeof score === "number" ? `Risk score: ${score}` : "Risk score unavailable"}
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				padding: isSmall ? "3px 8px" : "5px 10px",
				borderRadius: 999,
				background: meta.bg,
				color: meta.color,
				border: `1px solid ${meta.border}`,
				fontSize: isSmall ? 12 : 13,
				fontWeight: 700,
				fontFamily: "sans-serif",
				lineHeight: 1.2,
				whiteSpace: "nowrap",
				...style,
			}}
		>
			<span>{meta.label}</span>
			{showScore && typeof score === "number" ? (
				<span
					style={{
						background: "rgba(255, 255, 255, 0.7)",
						borderRadius: 999,
						padding: "1px 6px",
						fontSize: isSmall ? 11 : 12,
					}}
				>
					{score}
				</span>
			) : null}
		</span>
	);
};

export default RiskScoreBadge;
