import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../services/propertyService";
import { firstError, hasErrors, validatePropertyForm } from "../utils/validators";

const initialForm = {
	khasraNumber: "",
	surveyNumber: "",
	plotNumber: "",
	owner: "",
	location: "",
	area: "",
};

const RegisterProperty = () => {
	const navigate = useNavigate();
	const [form, setForm] = useState(initialForm);
	const [fieldErrors, setFieldErrors] = useState({});
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	const canSubmit = useMemo(() => !loading, [loading]);

	const updateField = (key) => (event) => {
		const nextValue = event.target.value;
		setForm((prev) => ({ ...prev, [key]: nextValue }));
		setFieldErrors((prev) => {
			if (!prev[key]) {
				return prev;
			}

			const next = { ...prev };
			delete next[key];
			return next;
		});
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		const payload = {
			khasraNumber: form.khasraNumber.trim(),
			surveyNumber: form.surveyNumber.trim(),
			plotNumber: form.plotNumber.trim(),
			owner: form.owner.trim(),
			location: form.location.trim(),
			area: Number(form.area),
		};

		const errors = validatePropertyForm(payload);
		if (hasErrors(errors)) {
			setFieldErrors(errors);
			setError(firstError(errors) || "Please correct the form fields.");
			return;
		}

		try {
			setLoading(true);
			const response = await createProperty(payload);
			const createdId = response?.data?._id;

			setSuccess("Property added successfully.");
			setForm(initialForm);

			if (createdId) {
				navigate(`/properties/${createdId}`);
			}
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to add property.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main style={{ maxWidth: 760, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
			<h1 style={{ marginBottom: 8 }}>Register Property</h1>
			<p style={{ marginTop: 0, color: "#475569" }}>Create a new property record in the system.</p>

			<form
				onSubmit={handleSubmit}
				style={{
					display: "grid",
					gap: 12,
					background: "#ffffff",
					padding: 16,
					borderRadius: 10,
					border: "1px solid #e2e8f0",
				}}
			>
				<input
					type="text"
					placeholder="Khasra Number"
					value={form.khasraNumber}
					onChange={updateField("khasraNumber")}
					required
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				{fieldErrors.khasraNumber ? <small style={{ color: "#b91c1c" }}>{fieldErrors.khasraNumber}</small> : null}

				<input
					type="text"
					placeholder="Survey Number"
					value={form.surveyNumber}
					onChange={updateField("surveyNumber")}
					required
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				{fieldErrors.surveyNumber ? <small style={{ color: "#b91c1c" }}>{fieldErrors.surveyNumber}</small> : null}

				<input
					type="text"
					placeholder="Plot Number"
					value={form.plotNumber}
					onChange={updateField("plotNumber")}
					required
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				{fieldErrors.plotNumber ? <small style={{ color: "#b91c1c" }}>{fieldErrors.plotNumber}</small> : null}

				<input
					type="text"
					placeholder="Owner User ID"
					value={form.owner}
					onChange={updateField("owner")}
					required
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				{fieldErrors.owner ? <small style={{ color: "#b91c1c" }}>{fieldErrors.owner}</small> : null}

				<input
					type="text"
					placeholder="Location"
					value={form.location}
					onChange={updateField("location")}
					required
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				{fieldErrors.location ? <small style={{ color: "#b91c1c" }}>{fieldErrors.location}</small> : null}

				<input
					type="number"
					min="0.01"
					step="0.01"
					placeholder="Area"
					value={form.area}
					onChange={updateField("area")}
					required
					style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
				/>
				{fieldErrors.area ? <small style={{ color: "#b91c1c" }}>{fieldErrors.area}</small> : null}

				{error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
				{success ? <p style={{ color: "#166534", margin: 0 }}>{success}</p> : null}

				<button
					type="submit"
					disabled={!canSubmit}
					style={{
						padding: "10px 14px",
						borderRadius: 8,
						border: "1px solid #0f172a",
						background: "#0f172a",
						color: "#ffffff",
						cursor: canSubmit ? "pointer" : "not-allowed",
					}}
				>
					{loading ? "Adding Property..." : "Add Property"}
				</button>
			</form>
		</main>
	);
};

export default RegisterProperty;
