import { Router } from "express";
import { getDocuments, uploadDocument } from "../controllers/document.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadSingleDocument } from "../middleware/upload.middleware.js";

const documentRouter = Router();

documentRouter.use(requireAuth);

documentRouter.post("/upload", uploadSingleDocument, uploadDocument);
documentRouter.get("/property/:propertyId", getDocuments);

export default documentRouter;
