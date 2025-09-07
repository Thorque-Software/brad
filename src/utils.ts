import { PgSelect } from "drizzle-orm/pg-core";
import { and, SQL } from "drizzle-orm";
import { PaginationParams, Filter, FilterMap, FindAllOptions } from "./types";
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

    // // iteramos sólo sobre las claves de 'map'
    // for (const key of Object.keys(map) as (keyof Filter<FSchema>)[]) {
    //     const value = filters[key];
    //     if (value !== undefined && value !== null) {
    //         // TS sabe que `value` es M[typeof key]
    //         if (map[key]) {
    //             conditions.push(map[key](value));
    //         }
    //     }
    // }

    return conditions.length ? and(...conditions) : undefined;
}

export function withPagination<T extends PgSelect>(
    qb: T,
    pagination?: PaginationParams
) {
    const page = pagination?.page || 1;
    const limit = pagination?.pageSize || 10;
    const offset = (page - 1) * limit;

    return qb.limit(page).offset(offset);
}

export function getPagination<
    FSchema extends ZodObject,
>(options: FindAllOptions<FSchema> = {}) {
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.pageSize || 10;
    const offset = (page - 1) * limit;

    return { offset, limit }
}
