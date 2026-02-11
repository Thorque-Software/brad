import {
    integer,
    pgTable,
    serial,
    varchar
} from "drizzle-orm/pg-core";

export const eventTable = pgTable("event", {
    id: serial().primaryKey().notNull(),
    year: varchar("year", { length: 4 }).notNull(),
    minCapacity: integer("min_capacity").notNull(),
    maxCapacity: integer("max_capacity").notNull(),
    cod: varchar("cod", { length: 255 }).notNull(),
    duration: integer("duration").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
});
