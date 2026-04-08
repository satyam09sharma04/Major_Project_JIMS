import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = () => {
  const location = useLocation();
	const { loading, isAuthenticated } = useAuth();

	if (loading) {
		return <div style={{ padding: 24, fontFamily: "sans-serif" }}>Checking login...</div>;
	}

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
