import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";


const DATABASE_URL="postgres://chato:chato123@localhost:5432/backtemplate";
const url = DATABASE_URL!;
export const db = drizzle(url, { schema, logger: true});

// export const db = drizzle.mock({schema})
