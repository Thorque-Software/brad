import { PgSelect, PgTable } from "drizzle-orm/pg-core";
import { and, SQL } from "drizzle-orm";
import { PaginationParams, Filter, FilterMap, FindAllOptions } from "./types";
import { ZodObject } from "zod";

export function buildFilters<FSchema extends ZodObject>(
    filters: Filter<FSchema>,
    map: FilterMap<FSchema>
) {
    const conditions: SQL[] = [];

    // iteramos sólo sobre las claves de 'map'
    for (const key of Object.keys(map)) {
        const value = filters[key];
        if (value !== undefined) {
            // TS sabe que `value` es M[typeof key]
            if (map[key]) {
                conditions.push(map[key](value));
            }
        }
    }

    return conditions.length ? and(...conditions) : undefined;
}

function withPagination<T extends PgSelect>(
    qb: T,
    pagination: PaginationParams
) {
    return qb.limit(pagination.pageSize).offset(pagination.page * pagination.pageSize);
}

function withFilters<
    FSchema extends ZodObject,
    S extends PgSelect
>(
    qb: S,
    filters: Filter<FSchema>,
    map: FilterMap<FSchema>
) {
    return qb.where(buildFilters(filters, map));
}

export function getPagination<
    FSchema extends ZodObject,
>(options: FindAllOptions<FSchema> = {}) {
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.pageSize || 10;
    const offset = (page - 1) * limit;

    return { offset, limit }
}

export function getConditions<
    FSchema extends ZodObject,
>(options: FindAllOptions<FSchema>, map: FilterMap<FSchema>) {
    const { filters } = options;

    const conditions: (SQL<unknown>[] | undefined) = [];
    if (filters) {
        const whereSql = buildFilters(filters, map);
        conditions.push(whereSql as any);
    }

    return conditions;
}
