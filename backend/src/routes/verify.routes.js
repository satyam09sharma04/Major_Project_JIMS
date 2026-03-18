import { Router } from "express";
import { verifyDocument } from "../controllers/verify.controller.js";

const verifyRouter = Router();

verifyRouter.post("/:documentId", verifyDocument);

export default verifyRouter;

