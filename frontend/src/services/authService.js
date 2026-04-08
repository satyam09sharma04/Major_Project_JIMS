import api, { emitAuthChanged } from "./api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const registerUser = async (payload) => {
	const response = await api.post("/auth/register", payload);
	return response.data;
};

export const loginUser = async (payload) => {
	const response = await api.post("/auth/login", payload);
	const { token, user } = response.data;

	if (!token) {
		throw new Error("Token not received from login response");
	}

	localStorage.setItem(TOKEN_KEY, token);
	if (user) {
		localStorage.setItem(USER_KEY, JSON.stringify(user));
	}
	emitAuthChanged();

	return response.data;
};

export const logoutUser = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	emitAuthChanged();
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
	const rawUser = localStorage.getItem(USER_KEY);
	if (!rawUser) {
		return null;
	}

	try {
		return JSON.parse(rawUser);
	} catch {
		localStorage.removeItem(USER_KEY);
		return null;
	}
};

export const isAuthenticated = () => Boolean(getAuthToken());
