import RiskScoreBadge from "../documents/RiskScoreBadge";

const formatArea = (value) => {
	if (typeof value !== "number") {
		return "-";
	}

	return `${value.toLocaleString()} sq.ft`;
};

const formatDate = (value) => {
	if (!value) {
		return "-";
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return "-";
	}

	return parsed.toLocaleDateString();
};

const PropertyCard = ({
	property,
	onView,
	onEdit,
	onTransfer,
	showActions = true,
	showRisk = true,
}) => {
	if (!property) {
		return null;
	}

	const ownerName = property?.owner?.name || property?.owner?.email || "Unknown Owner";
	const verification = property?.verification || {};

	return (
		<article
			style={{
				border: "1px solid #e2e8f0",
				borderRadius: 14,
				padding: 14,
				background: "#ffffff",
				boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
				display: "grid",
				gap: 10,
				fontFamily: "sans-serif",
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
				<div>
					<h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#0f172a" }}>
						Khasra #{property.khasraNumber || "-"}
					</h3>
					<p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
						Survey: {property.surveyNumber || "-"} | Plot: {property.plotNumber || "-"}
					</p>
				</div>

				{showRisk ? (
					<RiskScoreBadge
						score={verification.riskScore}
						riskLevel={verification.riskLevel}
						status={verification.status}
						size="sm"
					/>
				) : null}
			</div>

			<div style={{ display: "grid", gap: 6, fontSize: 14, color: "#334155" }}>
				<div>
					<strong>Owner:</strong> {ownerName}
				</div>
				<div>
					<strong>Location:</strong> {property.location || "-"}
				</div>
				<div>
					<strong>Area:</strong> {formatArea(property.area)}
				</div>
				<div>
					<strong>Registered:</strong> {formatDate(property.createdAt)}
				</div>
			</div>

			{showActions ? (
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					<button
						type="button"
						onClick={() => onView?.(property)}
						style={{
							padding: "8px 11px",
							borderRadius: 8,
							border: "1px solid #cbd5e1",
							background: "#ffffff",
							cursor: "pointer",
							fontSize: 13,
						}}
					>
						View
					</button>
					<button
						type="button"
						onClick={() => onEdit?.(property)}
						style={{
							padding: "8px 11px",
							borderRadius: 8,
							border: "1px solid #cbd5e1",
							background: "#ffffff",
							cursor: "pointer",
							fontSize: 13,
						}}
					>
						Edit
					</button>
					<button
						type="button"
						onClick={() => onTransfer?.(property)}
						style={{
							padding: "8px 11px",
							borderRadius: 8,
							border: "1px solid #0f172a",
							background: "#0f172a",
							color: "#ffffff",
							cursor: "pointer",
							fontSize: 13,
						}}
					>
						Transfer
					</button>
				</div>
			) : null}
		</article>
	);
};

export default PropertyCard;
