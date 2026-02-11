import {
    integer,
    pgTable,
    primaryKey
} from "drizzle-orm/pg-core";
import { eventTable } from "./event.schema";
import { studentTable } from "./student.schema";

// This is a many to many relation between event-student
// One student can be inscripted to zero or more events
// One event can have zero or more students
//
// We want to generate the following routes
// GET /events/:idEvent/inscriptions/
// GET, PUT, POST, DELETE /events/:idEvent/inscriptions/:idStudent
//
// GET /students/:idStudent/inscriptions/
// GET, PUT, POST, DELETE /students/:idStudent/inscriptions/:idEvent
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
