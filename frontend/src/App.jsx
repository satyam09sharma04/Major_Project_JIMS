import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import PropertyDetail from "./pages/PropertyDetail";
import RegisterProperty from "./pages/RegisterProperty";

const App = () => {
	return (
		<Routes>
			<Route path="/" element={<Home />} />

			<Route element={<ProtectedRoute />}>
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/properties/new" element={<RegisterProperty />} />
				<Route path="/properties/:propertyId" element={<PropertyDetail />} />
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

export default App;
