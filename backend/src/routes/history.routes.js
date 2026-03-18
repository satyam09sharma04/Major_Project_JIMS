import { Router } from "express";
import { getPropertyHistory } from "../controllers/history.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const historyRouter = Router();

historyRouter.use(requireAuth);

historyRouter.get("/:propertyId", getPropertyHistory);

export default historyRouter;
