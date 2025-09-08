import { and, SQL } from "drizzle-orm";
import { Filter, FilterMap } from "./types";
import { ZodObject } from "zod";

export function buildFilters<FSchema extends ZodObject>(
    map: FilterMap<FSchema>,
    filters?: Filter<FSchema>
) {
    const conditions: SQL[] = [];

    if (!filters) return undefined;

    for (const f of Object.keys(filters) as (keyof Filter<FSchema>)[]) {
        if (f in map) {
            const func = map[f];
            const value = filters[f];
            if (value !== undefined && value !== null) {
                conditions.push(func(value));
            }
        }
    }

    return conditions.length ? and(...conditions) : undefined;
}
