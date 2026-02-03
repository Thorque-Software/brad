import {
    integer,
    pgTable,
    serial,
    varchar
} from "drizzle-orm/pg-core";

export const eventTable = pgTable("course", {
    id: serial().primaryKey().notNull(),
    year: varchar("year", { length: 4 }),
    minCapacity: integer("min_capacity"),
    maxCapacity: integer("max_capacity"),
    cod: varchar("cod", { length: 255 }),
    duration: integer("duration"),
    dayOfWeek: integer("day_of_week"),
});
