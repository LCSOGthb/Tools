import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post(
  "/upload-test",
  (req, res, next) => {
    req.on("data", () => {});
    req.on("end", next);
    req.on("error", next);
  },
  (_req, res) => {
    res.json({ ok: true });
  },
);

export default router;
