import { loginUser, registerUser } from "../services/auth.service.js";

const normalizeAuthPayload = (body = {}) => ({
	name: typeof body.name === "string"
		? body.name.trim()
		: typeof body.username === "string"
			? body.username.trim()
			: "",
	email: typeof body.email === "string" ? body.email.trim() : "",
	password: typeof body.password === "string" ? body.password : "",
});

export const register = async (req, res, next) => {
	try {
		const { name, email, password } = normalizeAuthPayload(req.body);

		if (!name || !email || !password) {
			return res.status(400).json({ message: "Name, email, and password are required" });
		}

		const result = await registerUser({ name, email, password });

		return res.status(201).json({
			message: "User registered successfully",
			...result,
		});
	} catch (error) {
		return next(error);
	}
};

export const login = async (req, res, next) => {
	try {
		const { email, password } = normalizeAuthPayload(req.body);

		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}

		const result = await loginUser({ email, password });

		return res.status(200).json({
			message: "Login successful",
			...result,
		});
	} catch (error) {
		return next(error);
	}
};
