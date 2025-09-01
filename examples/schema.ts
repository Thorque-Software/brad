import {
    doublePrecision,
    integer,
    pgEnum,
    pgTable,
    real,
    serial,
    text,
    timestamp,
    varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const timestamps = {
    createdAt: timestamp("created_at", {
        withTimezone: true,
        mode: "date"
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
        mode: "date"
    }).defaultNow(),
    deletedAt: timestamp("deleted_at", {
        withTimezone: true,
        mode: "date"
    })
};

export const userRoles = {
    admin: "admin",
    finalUser: "finalUser",
    provider: "provider"
} as const; // Importante poner el as const, si no TS no infiere bien los tipos
export type UserRole = keyof typeof userRoles;
const userRolesKeys = Object.keys(userRoles) as [UserRole];

export const userTypeEnum = pgEnum("role", userRolesKeys);

const userTable = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(), // password hasheada
    role: userTypeEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at")
});

export const serviceTypeTable = pgTable("service_types", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    ...timestamps
});

export const cityTable = pgTable("cities", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    ...timestamps
});

export const providerTable = pgTable("providers", {
    id: serial("id").primaryKey(),
    fullname: text("fullname").notNull(),
    email: text("email").notNull(),
    phoneNumber: text("phone_number"),
    cuil: text("cuil").notNull(),
    cityId: integer("city_id")
        .notNull()
        .references(() => cityTable.id),
    userId: integer("user_id")
        .notNull()
        .references(() => userTable.id),
    ...timestamps
});

export const serviceTable = pgTable("services", {
    id: serial("id").primaryKey(),
    serviceTypeId: integer("service_type_id")
        .notNull()
        .references(() => serviceTypeTable.id),
    providerId: integer("provider_id")
        .notNull()
        .references(() => providerTable.id),
    name: text("name").notNull(),
    suggestedMaxCapacity: integer("suggested_max_capacity").notNull(),
    locationLat: doublePrecision("location_lat").notNull(),
    locationLong: doublePrecision("location_long").notNull(),
    price: real("price").notNull(),
    duration: integer("duration").notNull(),
    ...timestamps
});

export const serviceRelations = relations(serviceTable, ({ one }) => ({
    serviceType: one(serviceTypeTable, {
        fields: [serviceTable.serviceTypeId],
        references: [serviceTypeTable.id]
    }),
    provider: one(providerTable, {
        fields: [serviceTable.providerId],
        references: [providerTable.id]
    })
}));
