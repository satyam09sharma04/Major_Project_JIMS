import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import DocumentsPage from "./pages/DocumentsPage";
import HistoryPage from "./pages/HistoryPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterProperty from "./pages/RegisterProperty";
import Signup from "./pages/Signup";
import TransferPage from "./pages/TransferPage";
import VerifyPage from "./pages/VerifyPage";

const ALLOW_AUTHENTICATED_USERS_ON_HOME = true;

const RootRedirect = () => {
	const { loading, isAuthenticated } = useAuth();

	if (loading) {
		return <div style={{ padding: 24, fontFamily: "sans-serif" }}>Loading...</div>;
	}

	return <Navigate to={isAuthenticated ? "/dashboard" : "/home"} replace />;
};

const App = () => {
	return (
		<Routes>
			<Route path="/" element={<RootRedirect />} />

			<Route element={<PublicRoute redirectAuthenticated={!ALLOW_AUTHENTICATED_USERS_ON_HOME} />}>
				<Route path="/home" element={<Home />} />
				<Route path="/Home" element={<Home />} />
			</Route>

			<Route element={<PublicRoute />}>
				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
			</Route>

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
