import { FilterMap } from "bradb";
import { eq, ilike, inArray } from "drizzle-orm";
import { providerTable, serviceTable } from "./schema";
import { db } from "./db";
import z from "zod";
import { providerSchema, serviceSchema } from "./validator";

export const serviceFilterSchema = serviceSchema
    .pick({
        name: true,
        serviceTypeId: true,
        providerId: true
    }).extend({
        providerEmail: z.string(),
        providerCuil: z.string()
    }).partial();

const providerFilterSchema = providerSchema
    .pick({
        cuil: true
    });

export const providerFilterMap: FilterMap<typeof providerFilterSchema> = {
    cuil: (cuil) => eq(providerTable.cuil, cuil)
}

export const serviceFilterMap: FilterMap<typeof serviceFilterSchema> = {
    name: (value) => ilike(serviceTable.name, `%${value}%`),
    serviceTypeId: (value) => eq(serviceTable.serviceTypeId, value),
    providerId: (value) => eq(serviceTable.providerId, value),
    providerEmail: (email) => eq(serviceTable.providerId,
        db.select({ id: providerTable.id })
        .from(providerTable)
        .where(
            eq(providerTable.email, email)
        )
    ),
    // providerCuil: providerFilterMap.cuil,
    providerCuil: (cuil) => inArray(serviceTable.providerId,
        db.select({id: providerTable.id})
        .from(providerTable)
        .where(
            eq(providerTable.cuil, cuil)
        )
    ),
}
