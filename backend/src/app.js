import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import router from "./routes/index.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());
app.use("/api", router);

app.get("/", (_req, res) => {
	return res.status(200).send("API Running");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
