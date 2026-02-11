import "dotenv/config";
import express from "express";

import { inscriptionRouter } from "./src/routes/inscription.router";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/inscription", inscriptionRouter);
