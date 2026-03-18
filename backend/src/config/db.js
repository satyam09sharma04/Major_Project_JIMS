import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const connectDB = async () => {
	const { DB_URI } = process.env;

	if (!DB_URI) {
		throw new Error("DB_URI is missing in environment variables");
	}

	try {
		const connection = await mongoose.connect(DB_URI);
		console.log(`MongoDB connected: ${connection.connection.host}`);
		return connection;
	} catch (error) {
		console.error("MongoDB connection failed:", error.message);
		throw error;
	}
};
