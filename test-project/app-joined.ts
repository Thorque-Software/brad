import "dotenv/config";
import express from "express";
import { Request, Response, NextFunction } from "express";

import { inscriptionRouter } from "./src-joins/routers";
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

app.use(errorHandler);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("ERROR", err);
    if (err instanceof DrizzleQueryError) {
        console.log("DRIZZLE");
    }
    return res.status(500).send("INTERNAL SERVER ERROR");
});
