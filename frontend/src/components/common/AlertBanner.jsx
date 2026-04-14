import { useEffect, useMemo, useState } from "react";

const VARIANT_STYLES = {
	success: {
		background: "#dcfce7",
		border: "#86efac",
		text: "#14532d",
		title: "Success",
	},
	error: {
		background: "#fee2e2",
		border: "#fca5a5",
		text: "#7f1d1d",
		title: "Error",
	},
	warning: {
		background: "#fef9c3",
		border: "#fde047",
		text: "#713f12",
		title: "Warning",
	},
	info: {
		background: "#dbeafe",
		border: "#93c5fd",
		text: "#1e3a8a",
		title: "Info",
	},
};

const AlertBanner = ({
	message,
	variant = "info",
	title,
	showIcon = true,
	dismissible = false,
	onClose,
	autoHideDuration,
	className = "",
	style = {},
}) => {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		setVisible(true);
	}, [message, variant]);

	useEffect(() => {
		if (!autoHideDuration || autoHideDuration <= 0 || !visible) {
			return undefined;
		}

		const timeoutId = setTimeout(() => {
			setVisible(false);
			onClose?.();
		}, autoHideDuration);

		return () => clearTimeout(timeoutId);
	}, [autoHideDuration, onClose, visible]);

	const alertStyle = useMemo(() => VARIANT_STYLES[variant] || VARIANT_STYLES.info, [variant]);

	if (!message || !visible) {
		return null;
	}

	const handleClose = () => {
		setVisible(false);
		onClose?.();
	};

	const icon =
		variant === "success"
			? "✓"
			: variant === "error"
				? "!"
				: variant === "warning"
					? "⚠"
					: "i";

	return (
		<div
			role="alert"
			aria-live={variant === "error" ? "assertive" : "polite"}
			className={className}
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 10,
				padding: "10px 12px",
				borderRadius: 10,
				border: `1px solid ${alertStyle.border}`,
				background: alertStyle.background,
				color: alertStyle.text,
				...style,
			}}
		>
			{showIcon ? (
				<span
					aria-hidden="true"
					style={{
						width: 20,
						height: 20,
						borderRadius: 999,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						border: `1px solid ${alertStyle.border}`,
						fontWeight: 700,
						fontSize: 12,
						flexShrink: 0,
					}}
				>
					{icon}
				</span>
			) : null}

			<div style={{ flex: 1, minWidth: 0 }}>
				{title || alertStyle.title ? (
					<p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{title || alertStyle.title}</p>
				) : null}
				<p style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.4 }}>{message}</p>
			</div>

			{dismissible ? (
				<button
					type="button"
					onClick={handleClose}
					aria-label="Dismiss alert"
					style={{
						border: "none",
						background: "transparent",
						color: alertStyle.text,
						cursor: "pointer",
						fontSize: 18,
						lineHeight: 1,
						padding: 2,
						flexShrink: 0,
					}}
				>
					×
				</button>
			) : null}
		</div>
	);
};

export default AlertBanner;
//lund dhari 