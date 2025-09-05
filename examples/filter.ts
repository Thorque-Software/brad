import { FilterMap } from "bradb";
import { eq, ilike } from "drizzle-orm";
import { providerTable, serviceTable } from "./schema";
import { db } from "./db";
import z from "zod";
import { serviceSchema } from "./validator";

const serviceFilterSchema = serviceSchema
    .pick({
        name: true,
        serviceTypeId: true,
        providerId: true
    }).extend({
        providerEmail: z.string()
    })

export const serviceFilterMap: FilterMap<typeof serviceFilterSchema> = {
    name: (value) => ilike(serviceTable.name, `%${value}%`),
    serviceTypeId: (value) => eq(serviceTable.serviceTypeId, value),
    providerId: (value) => eq(serviceTable.providerId, value),
    providerEmail: (email) => eq(
        serviceTable,
        db.select({ id: providerTable.id })
        .from(providerTable)
        .where(
            eq(providerTable.email, email)
        ),
    ),
}
