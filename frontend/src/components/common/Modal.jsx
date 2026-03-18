import { useEffect } from "react";

const Modal = ({
	isOpen,
	onClose,
	title = "Modal",
	children,
	footer,
	closeOnOverlayClick = true,
	showCloseButton = true,
	maxWidth = 560,
}) => {
	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}

		const handleEscape = (event) => {
			if (event.key === "Escape") {
				onClose?.();
			}
		};

		document.addEventListener("keydown", handleEscape);
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen, onClose]);

	if (!isOpen) {
		return null;
	}

	const handleOverlayClick = () => {
		if (closeOnOverlayClick) {
			onClose?.();
		}
	};

	const stopPropagation = (event) => {
		event.stopPropagation();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			onClick={handleOverlayClick}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
				background: "rgba(15, 23, 42, 0.55)",
			}}
		>
			<div
				onClick={stopPropagation}
				style={{
					width: "100%",
					maxWidth,
					maxHeight: "90vh",
					overflow: "auto",
					background: "#ffffff",
					borderRadius: 12,
					boxShadow: "0 20px 45px rgba(15, 23, 42, 0.25)",
					fontFamily: "sans-serif",
				}}
			>
				<header
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 10,
						padding: "14px 16px",
						borderBottom: "1px solid #e2e8f0",
					}}
				>
					<h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>{title}</h2>
					{showCloseButton ? (
						<button
							type="button"
							onClick={() => onClose?.()}
							aria-label="Close modal"
							style={{
								border: "none",
								background: "transparent",
								fontSize: 20,
								lineHeight: 1,
								cursor: "pointer",
								color: "#475569",
							}}
						>
							×
						</button>
					) : null}
				</header>

				<section style={{ padding: 16 }}>{children}</section>

				{footer ? <footer style={{ padding: 16, borderTop: "1px solid #e2e8f0" }}>{footer}</footer> : null}
			</div>
		</div>
	);
};

export default Modal;
