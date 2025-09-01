import { Filter, FilterMap, FindAllOptions, PrimaryKeyType, Table } from "./types";
import { PgColumn, PgSelect, PgTable } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, 
    count as drizzleCount, 
    getTableName, InferInsertModel, InferSelectModel, isNull } from "drizzle-orm";
import { buildWhere, getConditions, getPagination } from "./utils";
import { BadRequest, handleSqlError, NotFound } from "./errors";

export function findOne<
    T extends Table,
    S extends PgSelect
>(
    table: T, 
    select: S
) {
    return async (id: number) => {
        const result = await select.where(eq(table.id, id));

        if (result.length == 0) {
            throw new Error(
                `${getTableName(table)} with id ${id} not found`
            );
        }

        return result[0];
    }
}

export function findAll<
    T extends PgTable & {id: PgColumn},
    S extends PgSelect<T["_"]["name"]>
>(
    map: FilterMap<T>,
    select: S
) {
    return async (options: FindAllOptions<T>) => {
        const { offset, limit } = getPagination(options);
        const conditions = getConditions(options, map);

        const items = select
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .execute();

        return items as any as InferSelectModel<T>[];
    }
}

export function create<T extends PgTable>(db: any, table: T) {
    return async (data: InferInsertModel<T>) => {
        const [result] = await db
            .insert(table)
            .values(data)
            .returning()
            .catch(handleSqlError);
        return result as InferSelectModel<T>;
    }
}

export function update<
    T extends Table,
    TSchema extends Record<string, unknown>,

>(db: NodePgDatabase<TSchema>, table: T) {
    return async (
        id: PrimaryKeyType<T>,
        data: Partial<InferInsertModel<T>>
    ) => {
        if (Object.keys(data).length == 0) {
            throw new BadRequest("update needs at least one field");
        }
        const result = await db
            .update(table)
            .set(data)
            .where(eq(table.id, id))
            .returning()
            .catch((e: any) => handleSqlError(e));

        if (!result) {
            throw new NotFound(
                `${getTableName(table)} with id ${id} not found`
            );
        }
        return result;
    }
}

export function softDelete<
    T extends Table,
    TSchema extends Record<string, unknown>
>(db: NodePgDatabase<TSchema>, table: T) {
    return async (id: PrimaryKeyType<T>) => {
        const { rowCount } = await db
            .update(table as Table)
            .set({ deletedAt: new Date() })
            .where(and(eq(table.id, id), isNull(table.deletedAt)));
        if (rowCount == 0) {
            throw new NotFound(
                `${getTableName(table)} with id ${id} not found`
            );
        }
    }
}

export function hardDelete<
    T extends Table,
    TSchema extends Record<string, unknown>
>(db: NodePgDatabase<TSchema>, table: T) {
    return async (id: PrimaryKeyType<T>) => {
        const { rowCount } = await db.delete(table)
        if (rowCount == 0) {
            throw new NotFound(
                `${getTableName(table)} with id ${id} not found`
            );
        }
    }
}

export function count<
    T extends Table,
    TSchema extends Record<string, unknown>,
>(
    db: NodePgDatabase<TSchema>,
    table: T,
    map: FilterMap<T>,
) {
    return async (filters: Filter<T>) => {
        const [result] = await db
            .select({ count: drizzleCount() })
            .from(table as PgTable)
            .where(
                and(
                    isNull(table.deletedAt),
                    buildWhere(filters, map)
                )
            );

        return result.count;
    }
}
