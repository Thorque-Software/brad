import "dotenv/config"; // Importante cargar el .env
import express from "express";
import serviceRouter from "./router";
import { errorHandler } from "brad";

export const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.use("/services", serviceRouter);

app.use(errorHandler);

app.listen(port, (err) => {
    if (err) {
        console.log("Error running the server", err);
    } else {
        console.log(`Server is running on port ${port}`);
    }
});
