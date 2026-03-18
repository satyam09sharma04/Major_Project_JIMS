import dotenv from "dotenv";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loginUser } from "../src/services/auth.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

const run = async () => {
	if (!process.env.DB_URI) {
		throw new Error("DB_URI is missing in environment variables");
	}

	await mongoose.connect(process.env.DB_URI);

	const result = await loginUser({
		email: "testuser@property.local",
		password: "Test@12345",
	});

	console.log("LOGIN_OK=true");
	console.log("LOGIN_USER_ID=" + result.user._id.toString());
	console.log("TOKEN_PREFIX=" + result.token.slice(0, 20));

	await mongoose.disconnect();
};

run().catch(async (error) => {
	console.error("LOGIN_OK=false");
	console.error("LOGIN_ERROR=" + error.message);
	try {
		await mongoose.disconnect();
	} catch {
		// ignore disconnect errors
	}
	process.exit(1);
});
