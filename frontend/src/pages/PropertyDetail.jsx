import { useParams } from "react-router-dom";

const PropertyDetail = () => {
	const { propertyId } = useParams();

	return (
		<main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
			<h1>Property Detail</h1>
			<p>Property ID: {propertyId}</p>
		</main>
	);
};

export default PropertyDetail;
