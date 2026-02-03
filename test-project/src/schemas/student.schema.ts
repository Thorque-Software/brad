import {
    pgTable,
    serial,
    varchar
} from "drizzle-orm/pg-core";

export const studentTable = pgTable("student", {
    id: serial().primaryKey().notNull(),
    legajo: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    name: varchar({ length: 255 }),
    lastname: varchar({ length: 255 }),
});
