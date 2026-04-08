import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import DocumentsPage from "./pages/DocumentsPage";
import HistoryPage from "./pages/HistoryPage";
import Login from "./pages/Login";
import RegisterProperty from "./pages/RegisterProperty";
import Signup from "./pages/Signup";
import TransferPage from "./pages/TransferPage";
import VerifyPage from "./pages/VerifyPage";

const RootRedirect = () => {
	const { loading, isAuthenticated } = useAuth();

	if (loading) {
		return <div style={{ padding: 24, fontFamily: "sans-serif" }}>Loading...</div>;
	}

	return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

const App = () => {
	return (
		<Routes>
			<Route path="/" element={<RootRedirect />} />
			<Route path="/login" element={<Login />} />
			<Route path="/signup" element={<Signup />} />

			<Route element={<ProtectedRoute />}>
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/add-property" element={<RegisterProperty />} />
				<Route path="/register-property" element={<RegisterProperty />} />
				<Route path="/documents/:propertyId" element={<DocumentsPage />} />
				<Route path="/verify/:propertyId" element={<VerifyPage />} />
				<Route path="/transfer/:propertyId" element={<TransferPage />} />
				<Route path="/history/:propertyId" element={<HistoryPage />} />
				<Route path="/admin" element={<AdminPanel />} />
			</Route>

			<Route path="*" element={<RootRedirect />} />
		</Routes>
	);
};

export default App;
