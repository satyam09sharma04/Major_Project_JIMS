import axios from "axios";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const DEFAULT_TIMEOUT_MS = 15000;
export const AUTH_CHANGED_EVENT = "auth:changed";

export const emitAuthChanged = () => {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
	}
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token) => {
	if (!token) {
		localStorage.removeItem(TOKEN_KEY);
		emitAuthChanged();
		return;
	}

	localStorage.setItem(TOKEN_KEY, token);
	emitAuthChanged();
};

export const clearAuthStorage = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	emitAuthChanged();
};

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
	timeout: DEFAULT_TIMEOUT_MS,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor — har request mein token lagao
api.interceptors.request.use(
	(config) => {
		const token = getAuthToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor — 401 aane par auto logout
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401) {
			// Storage clear karo
			clearAuthStorage();
			// AuthContext ko batao
			window.dispatchEvent(new Event("auth:unauthorized"));
		}

		return Promise.reject(error);
	}
);

export const toApiErrorMessage = (error, fallback = "Something went wrong") => {
	if (error?.response?.data?.message) {
		return error.response.data.message;
	}

	if (error?.code === "ECONNABORTED") {
		return "Request timed out. Please try again.";
	}

	return error?.message || fallback;
};

export default api;