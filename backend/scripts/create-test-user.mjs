import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../src/models/User.model.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

const email = "testuser@property.local";
const password = "Test@12345";
const name = "Test User";

const run = async () => {
	if (!process.env.DB_URI) {
		throw new Error("DB_URI is missing in environment variables");
	}

	await mongoose.connect(process.env.DB_URI);

	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await User.findOneAndUpdate(
		{ email },
		{ $set: { name, email, password: hashedPassword } },
		{ upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
	);

	console.log("TEST_USER_EMAIL=" + email);
	console.log("TEST_USER_PASSWORD=" + password);
	console.log("TEST_USER_ID=" + user._id.toString());

	await mongoose.disconnect();
};

run().catch(async (error) => {
	console.error("Failed to create test user:", error.message);
	try {
		await mongoose.disconnect();
	} catch {
		// ignore disconnect errors
	}
	process.exit(1);
});
