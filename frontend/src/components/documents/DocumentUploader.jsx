import { useMemo, useState } from "react";
import AlertBanner from "../common/AlertBanner";
import Loader from "../common/Loader";
import api from "../../services/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]);

const formatBytes = (value) => {
	if (value < 1024) return `${value} B`;
	if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
	return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const DocumentUploader = ({ propertyId = "", onUploaded }) => {
	const [file, setFile] = useState(null);
	const [dragActive, setDragActive] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [uploadResult, setUploadResult] = useState(null);

	const canUpload = useMemo(() => Boolean(propertyId?.trim() && file && !loading), [file, loading, propertyId]);

	const validateFile = (candidate) => {
		if (!candidate) {
			return "Please select a file.";
		}

		if (!ALLOWED_MIME_TYPES.has(candidate.type)) {
			return "Only PDF and image files are allowed (pdf, jpg, jpeg, png, webp).";
		}

		if (candidate.size > MAX_FILE_SIZE) {
			return "File size must be 10MB or less.";
		}

		return "";
	};

	const handleFileSelect = (candidate) => {
		setError("");
		setSuccess("");
		setUploadResult(null);

		const validationError = validateFile(candidate);
		if (validationError) {
			setFile(null);
			setError(validationError);
			return;
		}

		setFile(candidate);
	};

	const handleDrop = (event) => {
		event.preventDefault();
		setDragActive(false);
		const dropped = event.dataTransfer?.files?.[0];
		handleFileSelect(dropped);
	};

	const handleUpload = async () => {
		if (!propertyId?.trim()) {
			setError("Property ID is required to upload a document.");
			return;
		}

		if (!file) {
			setError("Please select a file before uploading.");
			return;
		}

		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const payload = new FormData();
			payload.append("propertyId", propertyId.trim());
			payload.append("document", file);

			const response = await api.post("/documents/upload", payload, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const result = response?.data?.data || null;
			setUploadResult(result);
			setSuccess("Document uploaded and verification completed successfully.");
			setFile(null);
			onUploaded?.(result, response?.data);
		} catch (err) {
			setError(err?.response?.data?.message || "Upload failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

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
			<h3 style={{ marginTop: 0, marginBottom: 8 }}>Upload Property Document</h3>
			<p style={{ marginTop: 0, color: "#64748b", fontSize: 14 }}>
				Supported: PDF, JPG, PNG, WEBP. Max size: 10MB.
			</p>

			<div
				onDragOver={(event) => {
					event.preventDefault();
					setDragActive(true);
				}}
				onDragLeave={() => setDragActive(false)}
				onDrop={handleDrop}
				style={{
					border: `1px dashed ${dragActive ? "#2563eb" : "#cbd5e1"}`,
					background: dragActive ? "#eff6ff" : "#f8fafc",
					borderRadius: 10,
					padding: 14,
					textAlign: "center",
					marginBottom: 10,
				}}
			>
				<input
					type="file"
					accept=".pdf,image/*"
					onChange={(event) => handleFileSelect(event.target.files?.[0])}
					style={{ marginBottom: 8 }}
				/>
				<p style={{ margin: 0, fontSize: 13, color: "#475569" }}>or drag and drop your file here</p>
			</div>

			{file ? (
				<div style={{ marginBottom: 10, fontSize: 14, color: "#334155" }}>
					Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})
				</div>
			) : null}

			<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={handleUpload}
					disabled={!canUpload}
					style={{
						padding: "9px 13px",
						borderRadius: 8,
						border: "1px solid #0f172a",
						background: canUpload ? "#0f172a" : "#94a3b8",
						color: "#ffffff",
						cursor: canUpload ? "pointer" : "not-allowed",
					}}
				>
					Upload and Verify
				</button>

				{loading ? <Loader inline size="sm" label="Uploading document..." /> : null}
			</div>

			{error ? (
				<div style={{ marginTop: 10 }}>
					<AlertBanner variant="error" message={error} dismissible onClose={() => setError("")} />
				</div>
			) : null}

			{success ? (
				<div style={{ marginTop: 10 }}>
					<AlertBanner variant="success" message={success} dismissible onClose={() => setSuccess("")} />
				</div>
			) : null}

			{uploadResult?.verification ? (
				<div
					style={{
						marginTop: 12,
						padding: 10,
						borderRadius: 8,
						border: "1px solid #e2e8f0",
						background: "#f8fafc",
						fontSize: 14,
						color: "#334155",
					}}
				>
					<div>
						Verification Status: <strong>{uploadResult.verification.status || "-"}</strong>
					</div>
					<div>
						Risk Score: <strong>{typeof uploadResult.verification.riskScore === "number" ? uploadResult.verification.riskScore : "-"}</strong>
					</div>
					<div>
						Risk Level: <strong>{uploadResult.verification.riskLevel || "-"}</strong>
					</div>
				</div>
			) : null}
		</section>
	);
};

export default DocumentUploader;
