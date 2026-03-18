import { useEffect, useMemo, useState } from "react";
import AlertBanner from "../common/AlertBanner";
import Loader from "../common/Loader";
import { createProperty, updateProperty } from "../../services/propertyService";

const EMPTY_FORM = {
	khasraNumber: "",
	surveyNumber: "",
	plotNumber: "",
	owner: "",
	location: "",
	area: "",
};

const PropertyForm = ({
	mode = "create",
	propertyId,
	initialValues,
	onSuccess,
	onCancel,
	title,
	submitLabel,
}) => {
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const isEdit = mode === "edit";

	useEffect(() => {
		if (!initialValues) {
			setForm(EMPTY_FORM);
			return;
		}

		setForm({
			khasraNumber: initialValues.khasraNumber || "",
			surveyNumber: initialValues.surveyNumber || "",
			plotNumber: initialValues.plotNumber || "",
			owner:
				typeof initialValues.owner === "string"
					? initialValues.owner
					: initialValues.owner?._id || "",
			location: initialValues.location || "",
			area: initialValues.area != null ? String(initialValues.area) : "",
		});
	}, [initialValues]);

	const canSubmit = useMemo(() => {
		return (
			form.khasraNumber.trim() &&
			form.surveyNumber.trim() &&
			form.plotNumber.trim() &&
			form.owner.trim() &&
			form.location.trim() &&
			Number(form.area) > 0 &&
			!loading
		);
	}, [form, loading]);

	const handleChange = (field) => (event) => {
		setForm((prev) => ({ ...prev, [field]: event.target.value }));
	};

	const validate = () => {
		if (!form.khasraNumber.trim()) return "Khasra number is required.";
		if (!form.surveyNumber.trim()) return "Survey number is required.";
		if (!form.plotNumber.trim()) return "Plot number is required.";
		if (!form.owner.trim()) return "Owner ID is required.";
		if (!form.location.trim()) return "Location is required.";

		const areaValue = Number(form.area);
		if (!Number.isFinite(areaValue) || areaValue <= 0) {
			return "Area must be a valid number greater than 0.";
		}

		return "";
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}

		const payload = {
			khasraNumber: form.khasraNumber.trim(),
			surveyNumber: form.surveyNumber.trim(),
			plotNumber: form.plotNumber.trim(),
			owner: form.owner.trim(),
			location: form.location.trim(),
			area: Number(form.area),
		};

		setLoading(true);

		try {
			const response = isEdit ? await updateProperty(propertyId, payload) : await createProperty(payload);
			const result = response?.data || null;

			setSuccess(isEdit ? "Property updated successfully." : "Property created successfully.");
			if (!isEdit) {
				setForm(EMPTY_FORM);
			}

			onSuccess?.(result, response);
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to save property.");
		} finally {
			setLoading(false);
		}
	};

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
			<h3 style={{ marginTop: 0, marginBottom: 8 }}>{title || (isEdit ? "Edit Property" : "Register Property")}</h3>
			<p style={{ marginTop: 0, color: "#64748b", fontSize: 14 }}>
				Fill the property information and submit to save it in the registry.
			</p>

			<form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
				<input
					type="text"
					placeholder="Khasra Number"
					value={form.khasraNumber}
					onChange={handleChange("khasraNumber")}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<input
					type="text"
					placeholder="Survey Number"
					value={form.surveyNumber}
					onChange={handleChange("surveyNumber")}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<input
					type="text"
					placeholder="Plot Number"
					value={form.plotNumber}
					onChange={handleChange("plotNumber")}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<input
					type="text"
					placeholder="Owner User ID"
					value={form.owner}
					onChange={handleChange("owner")}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<input
					type="text"
					placeholder="Location"
					value={form.location}
					onChange={handleChange("location")}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<input
					type="number"
					min="0.01"
					step="0.01"
					placeholder="Area"
					value={form.area}
					onChange={handleChange("area")}
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>

				<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
					<button
						type="submit"
						disabled={!canSubmit}
						style={{
							padding: "10px 14px",
							borderRadius: 8,
							border: "1px solid #0f172a",
							background: canSubmit ? "#0f172a" : "#94a3b8",
							color: "#fff",
							cursor: canSubmit ? "pointer" : "not-allowed",
						}}
					>
						{submitLabel || (isEdit ? "Update Property" : "Create Property")}
					</button>

					{onCancel ? (
						<button
							type="button"
							onClick={onCancel}
							style={{
								padding: "10px 14px",
								borderRadius: 8,
								border: "1px solid #cbd5e1",
								background: "#fff",
								cursor: "pointer",
							}}
						>
							Cancel
						</button>
					) : null}

					{loading ? <Loader inline size="sm" label={isEdit ? "Updating..." : "Saving..."} /> : null}
				</div>
			</form>

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
		</section>
	);
};

export default PropertyForm;
