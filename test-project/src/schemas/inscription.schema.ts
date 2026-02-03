import {
    integer,
    pgTable,
    primaryKey
} from "drizzle-orm/pg-core";
import { studentTable } from "./student.schema";
import { eventTable } from "./event.schema";

export const inscriptionTable = pgTable(
    "inscription",
    {
        idStudent: integer()
            .notNull()
            .references(() => studentTable.id),
        idEvent: integer()
            .notNull()
            .references(() => eventTable.id),
    },
    (table) => [
        primaryKey({
            columns: [table.idStudent, table.idEvent],
            name: "inscription_pkey"
        })
    ]
);
