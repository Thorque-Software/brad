import {
    integer,
    pgTable,
    primaryKey,
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

export const eventTable = pgTable("event", {
    id: serial().primaryKey().notNull(),
    year: varchar("year", { length: 4 }).notNull(),
    minCapacity: integer("min_capacity").notNull(),
    maxCapacity: integer("max_capacity").notNull(),
    cod: varchar("cod", { length: 255 }).notNull().unique(),
    duration: integer("duration").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
});

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
