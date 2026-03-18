import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const rawPort = process.env.PORT ?? "5000";
const PORT = Number.parseInt(rawPort, 10);

if (Number.isNaN(PORT)) {
	throw new Error("PORT must be a valid number");
}

const startServer = async () => {
	try {
		await connectDB();

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
};

startServer();
