import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppNav from "../components/common/AppNav";
import { useAuth } from "../context/AuthContext";
import { toApiErrorMessage } from "../services/api";
import { getAllProperties, getMyProperties } from "../services/propertyService";

const Dashboard = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [properties, setProperties] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState("all");

	const getOwnerId = (property) => {
		if (!property?.owner) {
			return "";
		}

		if (typeof property.owner === "string") {
			return property.owner;
		}

		return property.owner?._id || property.owner?.id || "";
	};

	const isOwner = (property) => {
		const ownerId = String(getOwnerId(property) || "");
		const loggedInUserId = String(user?._id || user?.id || "");
		return Boolean(ownerId && loggedInUserId && ownerId === loggedInUserId);
	};

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const response = activeTab === "all" ? await getAllProperties() : await getMyProperties();
				setProperties(response?.data || []);
			} catch (err) {
				setError(toApiErrorMessage(err, "Could not load properties"));
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [activeTab]);

	return (
		<div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif" }}>
			<AppNav title="Property Dashboard" />

			<main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
				<section
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 16,
						flexWrap: "wrap",
						gap: 10,
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<h1 style={{ margin: 0 }}>{activeTab === "all" ? "All Properties" : "My Properties"}</h1>
						<div style={{ display: "flex", gap: 8 }}>
							<button
								type="button"
								onClick={() => setActiveTab("my")}
								style={{
									padding: "8px 12px",
									borderRadius: 8,
									border: "1px solid #cbd5e1",
									background: activeTab === "my" ? "#0f172a" : "#fff",
									color: activeTab === "my" ? "#fff" : "#0f172a",
									cursor: "pointer",
								}}
							>
								My Properties
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("all")}
								style={{
									padding: "8px 12px",
									borderRadius: 8,
									border: "1px solid #cbd5e1",
									background: activeTab === "all" ? "#0f172a" : "#fff",
									color: activeTab === "all" ? "#fff" : "#0f172a",
									cursor: "pointer",
								}}
							>
								All Properties
							</button>
						</div>
					</div>
					<button
						type="button"
						onClick={() => navigate("/add-property")}
						style={{
							padding: "10px 14px",
							borderRadius: 8,
							border: "1px solid #0f172a",
							background: "#0f172a",
							color: "#fff",
							cursor: "pointer",
						}}
					>
						Add Property
					</button>
				</section>

				{loading ? <p>Loading properties...</p> : null}
				{error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

				{!loading && !error && properties.length === 0 ? (
					<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
						<p style={{ marginTop: 0 }}>
							{activeTab === "all" ? "No properties found." : "No properties found for your account."}
						</p>
						<Link to="/add-property">Create your first property</Link>
					</div>
				) : null}

				{properties.length > 0 ? (
					<div style={{ display: "grid", gap: 12 }}>
						{properties.map((property) => (
							<article
								key={property._id}
								style={{
									background: "#fff",
									border: "1px solid #e2e8f0",
									borderRadius: 10,
									padding: 14,
								}}
							>
								<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
									<div><strong>Khasra:</strong> {property.khasraNumber}</div>
									<div><strong>Survey:</strong> {property.surveyNumber}</div>
									<div><strong>Plot:</strong> {property.plotNumber}</div>
									<div><strong>Area:</strong> {property.area}</div>
									<div><strong>Location:</strong> {property.location}</div>
									<div><strong>Owner:</strong> {property?.owner?.name || property?.owner?.email || getOwnerId(property) || "-"}</div>
								</div>

								<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
									<button type="button" onClick={() => navigate(`/documents/${property._id}`)}>View Documents</button>
									<button type="button" onClick={() => navigate(`/verify/${property._id}`)}>Verify</button>
									{isOwner(property) ? (
										<button type="button" onClick={() => navigate(`/transfer/${property._id}`)}>Transfer Ownership</button>
									) : null}
									<button type="button" onClick={() => navigate(`/history/${property._id}`)}>View History</button>
								</div>
							</article>
						))}
					</div>
				) : null}
			</main>
		</div>
	);
};

export default Dashboard;
