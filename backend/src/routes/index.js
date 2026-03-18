import { Router } from "express";
import authRouter from "./auth.routes.js";
import documentRouter from "./document.routes.js";
import historyRouter from "./history.routes.js";
import propertyRouter from "./property.routes.js";
import transferRouter from "./transfer.routes.js";
import verifyRouter from "./verify.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/properties", propertyRouter);
router.use("/documents", documentRouter);
router.use("/transfer", transferRouter);
router.use("/history", historyRouter);
router.use("/verify", verifyRouter);

export default router;
