import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadTestRouter from "./upload-test";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadTestRouter);

export default router;
