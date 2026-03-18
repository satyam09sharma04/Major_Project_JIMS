import { Router } from "express";
import { transferOwnership } from "../controllers/transfer.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const transferRouter = Router();

transferRouter.use(requireAuth);

transferRouter.post("/", transferOwnership);

export default transferRouter;
