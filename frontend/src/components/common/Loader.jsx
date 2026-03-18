const SIZE_MAP = {
	sm: 18,
	md: 28,
	lg: 40,
};

const Loader = ({
	label = "Loading...",
	size = "md",
	fullScreen = false,
	inline = false,
	color = "#0f172a",
}) => {
	const spinnerSize = SIZE_MAP[size] || SIZE_MAP.md;

	const wrapperStyle = fullScreen
		? {
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "rgba(248, 250, 252, 0.92)",
				padding: 16,
			}
		: {
				display: inline ? "inline-flex" : "flex",
				alignItems: "center",
				justifyContent: inline ? "flex-start" : "center",
				padding: inline ? 0 : 8,
			};

	return (
		<div role="status" aria-live="polite" style={wrapperStyle}>
			<div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "sans-serif" }}>
				<span
					aria-hidden="true"
					style={{
						width: spinnerSize,
						height: spinnerSize,
						border: `3px solid ${color}33`,
						borderTopColor: color,
						borderRadius: "50%",
						display: "inline-block",
						animation: "loader-spin 0.8s linear infinite",
					}}
				/>
				{label ? <span style={{ fontSize: 14, color: "#334155" }}>{label}</span> : null}
			</div>

			<style>
				{`@keyframes loader-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
			</style>
		</div>
	);
};

export default Loader;
