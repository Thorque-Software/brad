import { and, eq, SQL } from "drizzle-orm";
import { Filter, FilterMap, PrimaryKeyData } from "./types";
import { ZodObject } from "zod";
import { AnyPgTable, PgColumn } from "drizzle-orm/pg-core";

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

export function buildPKFilters<T extends AnyPgTable>(
    pks: PgColumn[],
    values: PrimaryKeyData<T>
) {
    if (pks.length === 0) {
        throw new Error(`Table has no detectable primary keys`);
    }

    const conditions = pks.map(pk => 
        eq(pk, values[pk.name as keyof typeof values])
    );

    return conditions.length === 1 ? conditions[0] : and(...conditions);
}
