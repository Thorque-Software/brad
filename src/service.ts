import { Filter, FilterMap, PrimaryKeyType, Table } from "./types";
import { getTableConfig, PgColumn, PgSelect, PgTable, PgTransaction } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, 
    count as drizzleCount, 
    getTableName, InferInsertModel, InferSelectModel, isNull,
    SQL,
    } from "drizzle-orm";
import { buildFilters } from "./filters";
import { BadRequest, handleSqlError, NotFound } from "./errors";
import { ZodObject } from "zod";

export class ServiceBuilder<
    T extends Table,
    TSchema extends Record<string, unknown>,
    FSchema extends ZodObject,
>{
    private readonly db: NodePgDatabase<TSchema>;
    private readonly table: T;
    private readonly map: FilterMap<FSchema>
    private readonly pks: PgColumn[];
    readonly haveSoftDelete: boolean;

    readonly findAllConditions: (f?: Filter<FSchema>) => SQL | undefined;
    readonly findOneConditions: (id: PrimaryKeyType<T>/* pkFilter: PrimaryKeyData<T> */) => SQL | undefined;

    readonly tableName: string;

    constructor(db: NodePgDatabase<TSchema>, table: T, map: FilterMap<FSchema>) {
        this.db = db;
        this.table = table;
        this.tableName = getTableName(table);
        this.pks = getPKs(table);
        this.map = map;

        this.haveSoftDelete = haveSoftDelete(table);
        if (this.haveSoftDelete) {
            this.findAllConditions = (f?: Filter<FSchema>) => and(
                isNull(this.table.deletedAt),
                buildFilters(this.map, f)
            );

            this.findOneConditions = (id: PrimaryKeyType<T>/* pkFilter: PrimaryKeyData<T> */) => and(
                isNull(this.table.deletedAt),
                // buildPKFilters(this.pks, pkFilter)
                eq(this.table.id, id)
            );
        } else {
            this.findAllConditions = (f?: Filter<FSchema>) => buildFilters(this.map, f);
            this.findOneConditions = (id: PrimaryKeyType<T>, /* pkFilter: PrimaryKeyData<T> */) => eq(this.table.id, id) // buildPKFilters(this.pks, id);
        }
    }

    findOne<S extends PgSelect>(select: S) {
        type Row = Awaited<ReturnType<S["execute"]>>[number];

        return async (id: PrimaryKeyType<T>/* pkFilter: PrimaryKeyData<T> */): Promise<Row> => {
            const result = await select.where(this.findOneConditions(id));

            if (result.length == 0) throw notFoundWithId(this.tableName, {id: id});

            return result[0];
        }
    }

    findAll<S extends PgSelect>(select: S, paginated=true) {
        type Row = Awaited<ReturnType<S["execute"]>>[number];

        const base = (f?: Filter<FSchema>) => select.where(this.findAllConditions(f));

        if (paginated) {
            return async (filters?: Filter<FSchema>, page: number = 1, pageSize: number = 10): Promise<Row[]> => {
                const offset = (page - 1) * pageSize;

                return await base(filters)
                    .limit(pageSize) 
                    .offset(offset)
            }
        } else {
            return async (filters?: Filter<FSchema>): Promise<Row[]> => {
                return await base(filters);
            }
        }
    }

    count() {
        return async (filters?: Filter<FSchema>) => {
            const [result] = await this.db
                .select({ count: drizzleCount() })
                .from(this.table as PgTable)
                .where(this.findAllConditions(filters));

            return result.count;
        }
    }

    create<S extends any>(hook?: (
        data: S extends Object ? S: InferInsertModel<T>,
        tx?: PgTransaction<any, TSchema, any>
    ) => Promise<InferInsertModel<T>>) {
        return async (
            data: S extends Object ? S : InferInsertModel<T>,
            tx?: PgTransaction<any, TSchema, any>
        ) => {
            // If pre exists data is going to be InferInsertModel<T>
            let values = data as InferInsertModel<T>;
            if (hook) {
                values = await hook(data);
            }

            const executor = tx || this.db;
            const [result] = await executor
                .insert(this.table)
                .values(values)
                .returning()
                .catch(handleSqlError);
            return result as InferSelectModel<T>;
        }
    }

    update<S extends any>(pre?: (
        data: S extends Object ? S: InferInsertModel<T>,
        tx?: PgTransaction<any, TSchema, any>
    ) => Promise<InferInsertModel<T>>) {
        return async (
            id: PrimaryKeyType<T>,
            data: S extends Object ? S : InferInsertModel<T>,
            tx?: PgTransaction<any, TSchema, any>
        ) => {
            let values = data as InferInsertModel<T>;
            if (pre) {
                values = await pre(data);
            }

            if (Object.keys(data).length == 0) {
                throw new BadRequest("update needs at least one field");
            }
            const executor = tx || this.db;
            const [result] = await executor
                .update(this.table)
                .set(values)
                .where(this.findOneConditions(id))
                .returning()
                .catch(handleSqlError) as InferSelectModel<T>[];

            if (!result) {
                throw notFoundWithId(this.tableName, {id: id});
            }
            return result;
        }
    }

    delete() {
        if (this.haveSoftDelete) {
            return this.softDelete();
        } else {
            return this.hardDelete();
        }
    }

    softDelete() {
        return async (
            id: PrimaryKeyType<T>,
            tx?: PgTransaction<any, TSchema, any>
        ) => {
            const executor = tx || this.db;
            const { rowCount } = await executor
                .update(this.table as Table)
                .set({ deletedAt: new Date() })
                .where(this.findOneConditions(id))
            if (rowCount == 0) {
                throw notFoundWithId(this.tableName, {id: id});
            }
        }
    }

    hardDelete() {
        return async (
            // id: PrimaryKeyData<T>,
            id: PrimaryKeyType<T>,
            tx?: PgTransaction<any, TSchema, any>
        ) => {
            const executor = tx || this.db;
            const { rowCount } = await executor
                .delete(this.table)
                .where(this.findOneConditions(id))
            if (rowCount == 0) {
                throw notFoundWithId(this.tableName, {id: id});
            }
        }
    }
}

function haveSoftDelete(table: Table, columnName="deleted_at") {
    const { columns } = getTableConfig(table);
    for (const col of columns) {
        if (col.name == columnName) {
            return true;
        }
    }
    return false;
}

function getPKs(table: Table) {
    const pks = [];
    const { columns } = getTableConfig(table);
    for (const col of columns) {
        if (col.primary) {
            pks.push(col);
        }
    }
    if(pks.length <= 0) throw new Error("Service builder needs at least one primary key field");
    return pks;
}

function notFoundWithId(tableName: string, pkFilter: object) {
    // for (const [key, val] of pkFilter.values()) {
    //
    // }
    // TODO: proper message
    return new NotFound(`${tableName} not found`);
}
