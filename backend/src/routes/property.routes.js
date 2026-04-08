import { Router } from "express";
import {
	createPropertyHandler,
	getAllPropertiesExploreHandler,
	getAllPropertiesHandler,
	getPropertyByIdHandler,
	updatePropertyHandler,
} from "../controllers/property.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const propertyRouter = Router();

propertyRouter.use(requireAuth);

propertyRouter.post("/", createPropertyHandler);
propertyRouter.get("/", getAllPropertiesHandler);
propertyRouter.get("/all", getAllPropertiesExploreHandler);
propertyRouter.get("/:propertyId", getPropertyByIdHandler);
propertyRouter.put("/:propertyId", updatePropertyHandler);

export default propertyRouter;
