import { PgSelect, PgTable } from "drizzle-orm/pg-core";
import { and, SQL } from "drizzle-orm";
import { PaginationParams, Filter, FilterMap, FindAllOptions } from "./types";

export function buildWhere<T extends PgTable>(
    filters: Filter<T>,
    map: FilterMap<T>
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
    TTable extends PgTable,
    S extends PgSelect
>(
    table: TTable,
    qb: S,
    filters: Filter<TTable>,
    map: FilterMap<TTable>
) {
    return qb.where(buildWhere(filters, map));
}

export function getPagination<
    T extends PgTable
>(options: FindAllOptions<T> = {}) {
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.pageSize || 10;
    const offset = (page - 1) * limit;

    return { offset, limit }
}

export function getConditions<
    T extends PgTable
>(options: FindAllOptions<any> = {}, map: FilterMap<T>) {
    const { filters } = options;

    const conditions: (SQL<unknown>[] | undefined) = [];
    if (filters) {
        const whereSql = buildWhere(filters, map);
        conditions.push(whereSql as any);
    }

    return conditions;
}
