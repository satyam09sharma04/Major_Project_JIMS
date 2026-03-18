const formatDateTime = (value) => {
	if (!value) {
		return "-";
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return "-";
	}

	return parsed.toLocaleString();
};

const toDisplayOwner = (owner) => {
	if (!owner) {
		return "Unknown Owner";
	}

	if (typeof owner === "string") {
		return owner;
	}

	if (owner.name && owner.email) {
		return `${owner.name} (${owner.email})`;
	}

	return owner.name || owner.email || owner._id || "Unknown Owner";
};

const PropertyHistory = ({
	historyData,
	loading = false,
	error = "",
	title = "Ownership Timeline",
	compact = false,
}) => {
	if (loading) {
		return (
			<section
				style={{
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 16,
					background: "#ffffff",
					fontFamily: "sans-serif",
				}}
			>
				<p style={{ margin: 0 }}>Loading property history...</p>
			</section>
		);
	}

	if (error) {
		return (
			<section
				style={{
					border: "1px solid #fecaca",
					borderRadius: 12,
					padding: 16,
					background: "#fff1f2",
					fontFamily: "sans-serif",
					color: "#991b1b",
				}}
			>
				<p style={{ margin: 0 }}>{error}</p>
			</section>
		);
	}

	if (!historyData) {
		return (
			<section
				style={{
					border: "1px solid #e2e8f0",
					borderRadius: 12,
					padding: 16,
					background: "#ffffff",
					fontFamily: "sans-serif",
					color: "#64748b",
				}}
			>
				<p style={{ margin: 0 }}>No history data available.</p>
			</section>
		);
	}

	const timeline = historyData.timeline ?? [];

	return (
		<section style={{ display: "grid", gap: 12, fontFamily: "sans-serif" }}>
			{!compact ? (
				<section
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
						gap: 12,
					}}
				>
					<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
						<div style={{ fontSize: 12, color: "#64748b" }}>Khasra Number</div>
						<div style={{ fontWeight: 700 }}>{historyData?.property?.khasraNumber || "-"}</div>
					</div>
					<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
						<div style={{ fontSize: 12, color: "#64748b" }}>Survey / Plot</div>
						<div style={{ fontWeight: 700 }}>
							{historyData?.property?.surveyNumber || "-"} / {historyData?.property?.plotNumber || "-"}
						</div>
					</div>
					<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
						<div style={{ fontSize: 12, color: "#64748b" }}>Current Owner</div>
						<div style={{ fontWeight: 700 }}>{toDisplayOwner(historyData?.property?.currentOwner)}</div>
					</div>
					<div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#fff" }}>
						<div style={{ fontSize: 12, color: "#64748b" }}>Total Transfers</div>
						<div style={{ fontWeight: 700 }}>{historyData?.totalTransfers ?? 0}</div>
					</div>
				</section>
			) : null}

			<section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#ffffff" }}>
				<h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
				{timeline.length === 0 ? (
					<p style={{ color: "#64748b", marginBottom: 0 }}>No timeline events available.</p>
				) : (
					<div style={{ display: "grid", gap: 10 }}>
						{timeline.map((event, index) => {
							const isTransfer = event.eventType === "OWNERSHIP_TRANSFER";

							return (
								<article
									key={`${event.transactionId || event.timestamp}-${index}`}
									style={{
										border: "1px solid #f1f5f9",
										borderRadius: 10,
										padding: 12,
										background: isTransfer ? "#f8fafc" : "#f0fdf4",
									}}
								>
									<div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
										<strong>{event.eventType}</strong>
										<span style={{ color: "#64748b", fontSize: 13 }}>{formatDateTime(event.timestamp)}</span>
									</div>

									{isTransfer ? (
										<p style={{ marginBottom: 0 }}>
											From: {toDisplayOwner(event.fromOwner)}
											<br />
											To: {toDisplayOwner(event.toOwner)}
										</p>
									) : (
										<p style={{ marginBottom: 0 }}>{event.details || "Property record created"}</p>
									)}
								</article>
							);
						})}
					</div>
				)}
			</section>
		</section>
	);
};

export default PropertyHistory;
