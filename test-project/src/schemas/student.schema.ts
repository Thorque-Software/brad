import {
    pgTable,
    serial,
    varchar
} from "drizzle-orm/pg-core";

export const studentTable = pgTable("student", {
    id: serial().primaryKey().notNull(),
    legajo: varchar({ length: 255 }).notNull(),
    doc: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    lastname: varchar({ length: 255 }).notNull(),
});
