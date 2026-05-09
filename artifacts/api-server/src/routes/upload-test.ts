import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/upload-test", (_req, res) => {
  res.json({ ok: true });
});

export default router;
