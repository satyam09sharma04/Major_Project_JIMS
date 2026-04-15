import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ redirectAuthenticated = true }) => {
	const { loading, isAuthenticated } = useAuth();

	if (loading) {
		return <div style={{ padding: 24, fontFamily: "sans-serif" }}>Loading...</div>;
	}

	if (redirectAuthenticated && isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return <Outlet />;
};

export default PublicRoute;
