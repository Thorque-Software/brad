import "dotenv/config";
import express from "express";
import { Request, Response, NextFunction } from "express";

import { inscriptionRouter } from "./src/routes/inscription.router";
import { eventRouter } from "./src/routes/event.router";
import { studentRouter } from "./src/routes/student.router";
import { errorHandler } from "bradb";
import { db } from "./src/db";
import { DrizzleQueryError } from "drizzle-orm";

export const app = express();

async function testDBConnection() {
    try {
        await db.execute("select 1");
    } catch {
        console.error("DB is not configured correctly");
        process.exit(1);
    }
}
testDBConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/inscriptions", inscriptionRouter);
app.use("/events", eventRouter);
app.use("/students", studentRouter);

app.use(errorHandler);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("ERROR", err);
    if (err instanceof DrizzleQueryError) {
        console.log("DRIZZLE");
    }
    return res.status(500).send("INTERNAL SERVER ERROR");
});
