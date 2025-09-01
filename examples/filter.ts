import { eq, ilike } from "drizzle-orm";
import { FilterMap } from "brad";
import { cityTable, serviceTable } from "./schema";

export const serviceFilterMap: FilterMap<typeof serviceTable> = {
    name: (value) => ilike(serviceTable.name, `%${value}%`),
    serviceTypeId: (value) => eq(serviceTable.serviceTypeId, value),
    providerId: (value) => eq(serviceTable.providerId, value)
};

export const cityFilterMap: FilterMap<typeof cityTable> = {
    name: (value: string) => ilike(cityTable.name, `%${value}%`)
};
