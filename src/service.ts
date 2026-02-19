import { Filter, FilterMap, PrimaryKeyData } from "./types";
import { AnyPgTable, getTableConfig, PgColumn, PgSelect, PgTable, PgTransaction } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { 
    and, 
    count,
    getTableName, InferInsertModel, InferSelectModel, isNull,
    SQL
    } from "drizzle-orm";
import { buildFilters, buildPKFilters } from "./filters";
import { BadRequest, handleSqlError, NotFound } from "./errors";
import { ZodObject } from "zod";
import { getPKs } from "./pg";
import { Pagination } from "./controller";

export class ServiceBuilder<
    T extends AnyPgTable,
    TSchema extends Record<string, unknown>,
    FSchema extends ZodObject,
    PKType extends object = PrimaryKeyData<T>
>{
    private readonly db: NodePgDatabase<TSchema>;
    private readonly table: T;
    private readonly map: FilterMap<FSchema>
    readonly pks: PgColumn[];
    readonly haveSoftDelete: boolean;

    readonly findAllConditions: (f?: Filter<FSchema>) => SQL | undefined;
    readonly findOneConditions: (pkFilter: PKType) => SQL | undefined;

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
                isNull((this.table as any).deletedAt),
                buildFilters(this.map, f)
            );

            this.findOneConditions = (pkFilter: PKType) => and(
                isNull((this.table as any).deletedAt),
                buildPKFilters(this.pks, pkFilter)
            );
        } else {
            this.findAllConditions = (f?: Filter<FSchema>) => buildFilters(this.map, f);
            this.findOneConditions = (pkFilter: PKType) => buildPKFilters(this.pks, pkFilter);
        }
    }

    findOne<S extends PgSelect>(select?: () => PgSelect) {
        type Row = S["_"]["result"][0];

        if (!select) select = () => this.db.select().from(this.table as PgTable).$dynamic();

        return async (pkValues: PKType): Promise<Row> => {
            const result = await select().where(this.findOneConditions(pkValues));
            if (result.length == 0) throw notFoundWithId(this.tableName, pkValues);
            return result[0];
        }
    }

    findAll<S extends PgSelect>(
        select?: () => PgSelect, 
        paginated = true
    ) {
        type Row = S["_"]["result"][0];

        if (!select) select = () => this.db.select().from(this.table as PgTable).$dynamic();

        const base = (f?: Filter<FSchema>) => select().where(this.findAllConditions(f));

        if (paginated) {
            return async (filters?: Filter<FSchema>, p?: Pagination): Promise<Row[]> => {
                if (!p) p = { page: 1, pageSize: 10 };

                const sub = select().where(this.findAllConditions(filters)).as('sub') as any; // TODO: not any
                const countQuery = this.db
                    .select({ count: count() })
                    .from(sub)

                const offset = (p.page - 1) * p.pageSize;

                const items = await base(filters).limit(p.pageSize).offset(offset);
                const [res] = await countQuery;
                p.total = res.count;
                p.count = items.length;
                return items;
            }
        } else {
            return async (filters?: Filter<FSchema>): Promise<Row[]> => {
                const items = await base(filters);
                return items;
            }
        }
    }

    count<S extends PgSelect>(select?: S) {
        if (select) {
            return async (filters?: Filter<FSchema>) => {
                const base = select.where(this.findAllConditions(filters));
                const subquery = base.as('countsubquery') as any;
                const [result] = await this.db.select({ count: count() }).from(subquery);
                return result.count;
            }
        }

        return async (filters?: Filter<FSchema>) => {
            const [result] = await this.db
                .select({ count: count() })
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
        data: S extends Object ? S: Partial<InferInsertModel<T>>,
        tx?: PgTransaction<any, TSchema, any>
    ) => Promise<InferInsertModel<T>>) {
        return async (
            pks: PKType,
            data: S extends Object ? S : Partial<InferInsertModel<T>>,
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
                .where(this.findOneConditions(pks))
                .returning()
                .catch(handleSqlError) as InferSelectModel<T>[];

            if (!result) {
                throw notFoundWithId(this.tableName, pks);
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
            pks: PKType,
            tx?: PgTransaction<any, TSchema, any>
        ) => {
            const executor = tx || this.db;
            const { rowCount } = await executor
                .update(this.table as any)
                .set({ deletedAt: new Date() })
                .where(this.findOneConditions(pks))
            if (rowCount == 0) {
                throw notFoundWithId(this.tableName, pks);
            }
        }
    }

    hardDelete() {
        return async (
            pks: PKType,
            tx?: PgTransaction<any, TSchema, any>
        ) => {
            const executor = tx || this.db;
            const { rowCount } = await executor
                .delete(this.table)
                .where(this.findOneConditions(pks))
            if (rowCount == 0) {
                throw notFoundWithId(this.tableName, pks);
            }
        }
    }
}

function haveSoftDelete(table: AnyPgTable, columnName="deleted_at"): table is AnyPgTable & { deletedAt: PgColumn } {
    const { columns } = getTableConfig(table);
    for (const col of columns) {
        if (col.name == columnName) {
            return true;
        }
    }
    return false;
}

function notFoundWithId(tableName: string, pkFilter: object) {
    const message = Object.entries(pkFilter).map(([k, v]) => `${k}=${v}`).join(' and ');
    return new NotFound(`${tableName} with ${message} not found`);
}
