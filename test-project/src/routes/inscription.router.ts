import { Router } from "express";
import { inscriptionController } from "../controllers/inscription.controller";
export const inscriptionRouter = Router();

// Get All
inscriptionRouter.get("/", inscriptionController.getAll);

// Create
inscriptionRouter.post("/", inscriptionController.create);

// Get one
inscriptionRouter.get("/:idStudent/:idEvent", inscriptionController.getOne);

// Update
inscriptionRouter.put("/:idStudent/:idEvent", inscriptionController.update);

// Delete
inscriptionRouter.delete("/:idStudent/:idEvent", inscriptionController.remove);