import api, { emitAuthChanged } from "./api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

const decodeJwtPayload = (token) => {
	if (!token || typeof token !== "string") {
		return null;
	}

	const parts = token.split(".");
	if (parts.length !== 3) {
		return null;
	}

	try {
		const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
		const json = atob(padded);
		return JSON.parse(json);
	} catch {
		return null;
	}
};

const isTokenExpired = (token) => {
	const payload = decodeJwtPayload(token);

	if (!payload || typeof payload.exp !== "number") {
		return false;
	}

	const nowInSeconds = Math.floor(Date.now() / 1000);
	return payload.exp <= nowInSeconds;
};

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

export const getAuthToken = () => {
	const token = localStorage.getItem(TOKEN_KEY);

	if (!token) {
		return "";
	}

	if (isTokenExpired(token)) {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		emitAuthChanged();
		return "";
	}

	return token;
};

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
