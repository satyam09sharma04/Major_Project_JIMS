import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_CHANGED_EVENT } from "../services/api";
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

    // Token expire hone par auto logout
    const handleUnauthorized = useCallback(() => {
        logoutUser();
        setToken("");
        setUser(null);
        window.location.href = "/login";
    }, []);

    useEffect(() => {
        // Teeno ek saath set — no race condition
        const nextToken = getAuthToken() || "";
        const nextUser = getStoredUser();
        setToken(nextToken);
        setUser(nextUser);
        setLoading(false);

        const handleStorage = () => syncFromStorage();
        const handleAuthChanged = () => syncFromStorage();
        const handleUnauth = () => handleUnauthorized();

        window.addEventListener("storage", handleStorage);
        window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
        window.addEventListener("auth:unauthorized", handleUnauth);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
            window.removeEventListener("auth:unauthorized", handleUnauth);
        };
    }, [syncFromStorage, handleUnauthorized]);

    const login = useCallback(async (payload) => {
        const response = await loginUser(payload);
        syncFromStorage();
        return response;
    }, [syncFromStorage]);

    const register = useCallback(async (payload) => {
        const response = await registerUser(payload);
        syncFromStorage();
        return response;
    }, [syncFromStorage]);

    const logout = useCallback(() => {
        logoutUser();
        setToken("");
        setUser(null);
    }, []);

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