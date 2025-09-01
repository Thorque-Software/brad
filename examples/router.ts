import { Router } from "express";
import { serviceController } from "./controllers";

const router = Router();

router.get("/", serviceController.getAll);
router.get("/:id", serviceController.getById);

export default router;
