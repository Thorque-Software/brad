import { Filter, FilterMap, PrimaryKeyType, Table } from "./types";
import { PgSelect, PgTable } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, 
    count as drizzleCount, 
    getTableName, InferInsertModel, InferSelectModel, isNull, 
    } from "drizzle-orm";
import { buildFilters } from "./filters";
import { BadRequest, handleSqlError, NotFound } from "./errors";
import { ZodObject } from "zod";

export class ServiceBuilder<
    T extends Table,
    TSchema extends Record<string, unknown>,
    FSchema extends ZodObject
>{
    private readonly db: NodePgDatabase<TSchema>;
    private readonly table: T;
    private readonly map: FilterMap<FSchema>
    readonly tableName: string;

    constructor(db: NodePgDatabase<TSchema>, table: T, map: FilterMap<FSchema>) {
        this.db = db;
        this.table = table;
        this.tableName = getTableName(table);
        this.map = map;
    }

    findOne<S extends PgSelect>(select: S) {
        type Row = Awaited<ReturnType<S["execute"]>>[number];

        return async (id: number): Promise<Row> => {
            const result = await select.where(
                eq(this.table.id, id)
            );

            if (result.length == 0) throw notFoundWithId(this.tableName, id);

            return result[0];
        }
    }

    findAll<S extends PgSelect>(select: S) {
        return async (filters?: Filter<FSchema>, page: number = 1, pageSize: number = 10) => {
            const offset = (page - 1) * pageSize;

            return await select
                .where(and(
                    isNull(this.table.deletedAt),
                    buildFilters(this.map, filters)
                ))
                .limit(pageSize) 
                .offset(offset)
        }
    }

    create() {
        return async (data: InferInsertModel<T>) => {
            const [result] = await this.db
                .insert(this.table)
                .values(data)
                .returning()
                .catch(handleSqlError);
            return result as InferSelectModel<T>;
        }
    }

    update() {
        return async (
            id: PrimaryKeyType<T>,
            data: Partial<InferInsertModel<T>>
        ) => {
            if (Object.keys(data).length == 0) {
                throw new BadRequest("update needs at least one field");
            }
            const [result] = await this.db
                .update(this.table)
                .set(data)
                .where(eq(this.table.id, id))
                .returning()
                .catch((e: any) => handleSqlError(e))  as InferSelectModel<T>[];

            if (!result) {
                throw notFoundWithId(this.tableName, id);
            }
            return result;
        }
    }

    softDelete() {
        return async (id: PrimaryKeyType<T>) => {
            const { rowCount } = await this.db
                .update(this.table as Table)
                .set({ deletedAt: new Date() })
                .where(and(
                    eq(this.table.id, id), 
                    isNull(this.table.deletedAt))
                );
            if (rowCount == 0) {
                throw notFoundWithId(this.tableName, id);
            }
        }
    }

    hardDelete() {
        return async (id: PrimaryKeyType<T>) => {
            const { rowCount } = await this.db
                .delete(this.table)
                .where(eq(this.table.id, id));
            if (rowCount == 0) {
                throw notFoundWithId(this.tableName, id);
            }
        }
    }

    count() {
        return async (filters?: Filter<FSchema>) => {
            const [result] = await this.db
                .select({ count: drizzleCount() })
                .from(this.table as PgTable)
                .where(
                    and(
                        isNull(this.table.deletedAt),
                        buildFilters(this.map, filters)
                    )
                );

            return result.count;
        }
    }
}

function notFoundWithId(tableName: string, id: any) {
    return new NotFound(`${tableName} with id ${id} not found`);
}
