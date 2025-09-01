import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL!;
console.log(url);
export const db = drizzle(url, { schema });
