import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	getAuthToken,
	getStoredUser,
	loginUser,
	logoutUser,
	registerUser,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState("");
	const [loading, setLoading] = useState(true);

	const syncFromStorage = useCallback(() => {
		const nextToken = getAuthToken() || "";
		const nextUser = getStoredUser();

		setToken(nextToken);
		setUser(nextUser);
	}, []);

	useEffect(() => {
		syncFromStorage();
		setLoading(false);

		const handleStorage = () => syncFromStorage();
		window.addEventListener("storage", handleStorage);

		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, [syncFromStorage]);

	const login = useCallback(async (payload) => {
		const response = await loginUser(payload);
		syncFromStorage();
		return response;
	}, [syncFromStorage]);

	const register = useCallback(async (payload) => {
		const response = await registerUser(payload);
		return response;
	}, []);

	const logout = useCallback(() => {
		logoutUser();
		syncFromStorage();
	}, [syncFromStorage]);

	const value = useMemo(
		() => ({
			user,
			token,
			loading,
			isAuthenticated: Boolean(token),
			login,
			register,
			logout,
			refreshAuth: syncFromStorage,
		}),
		[loading, login, logout, register, syncFromStorage, token, user]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
};

export default AuthContext;
