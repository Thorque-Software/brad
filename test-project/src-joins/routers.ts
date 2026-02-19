import { Router } from "express";
import { inscriptionController } from "./controllers";
export const inscriptionRouter = Router();

// Get All
inscriptionRouter.get("/", inscriptionController.getAll);

// Create
inscriptionRouter.post("/", inscriptionController.create);

// Get one
inscriptionRouter.get("/student/:idStudent/event/:idEvent", inscriptionController.getOne);

// Update
inscriptionRouter.put("/student/:idStudent/event/:idEvent", inscriptionController.update);

// Delete
inscriptionRouter.delete("/student/:idStudent/event/:idEvent", inscriptionController.remove);
