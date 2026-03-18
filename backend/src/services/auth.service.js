import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const SALT_ROUNDS = 10;

const getJwtSecret = () => {
	const { JWT_SECRET } = process.env;

	if (!JWT_SECRET) {
		throw new Error("JWT_SECRET is missing in environment variables");
	}

	return JWT_SECRET;
};

const generateToken = (userId) => {
	const secret = getJwtSecret();
	const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

	return jwt.sign({ userId }, secret, { expiresIn });
};

export const registerUser = async ({ name, email, password }) => {
	const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

	if (existingUser) {
		const error = new Error("Email is already registered");
		error.statusCode = 409;
		throw error;
	}

	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

	const user = await User.create({
		name,
		email,
		password: hashedPassword,
	});

	const token = generateToken(user._id.toString());

	return {
		user,
		token,
	};
};

export const loginUser = async ({ email, password }) => {
	const normalizedEmail = email.toLowerCase().trim();

	const user = await User.findOne({ email: normalizedEmail }).select("+password");

	if (!user) {
		const error = new Error("Invalid email or password");
		error.statusCode = 401;
		throw error;
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		const error = new Error("Invalid email or password");
		error.statusCode = 401;
		throw error;
	}

	const token = generateToken(user._id.toString());
	const userObject = user.toObject();
	delete userObject.password;

	return {
		user: userObject,
		token,
	};
};
