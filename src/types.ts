import { SQL } from "drizzle-orm";
import { AnyPgTable, PgColumn, PgTable, PgTransaction } from "drizzle-orm/pg-core";
import z, { ZodObject } from "zod";

export interface RetrieverService<FSchema extends ZodObject, TTable extends PgTable> {
    findAll: (filters?: Filter<FSchema>, page?: number, pageSize?: number) => Promise<TTable["$inferSelect"][]>;
    count:  (filters: Filter<FSchema>) => Promise<number>;
}

export interface FindOneService<TTable extends PgTable> {
    findOne: (id: PrimaryKeyType<TTable>) => Promise<Partial<TTable>>;  
}

export interface CreateService<
    TTable extends PgTable,
    TSchema extends Record<string, unknown>
> {
    create: (
        data: TTable["$inferInsert"],
        tx?: PgTransaction<any, TSchema, any>
    ) => Promise<TTable["$inferSelect"]>;
}

export interface UpdateService<
    TTable extends PgTable,
    TSchema extends Record<string, unknown>
> {
    update: (
        id: PrimaryKeyType<TTable>, 
        data: Partial<TTable["$inferInsert"]>,
        tx?: PgTransaction<any, TSchema, any>
    ) => Promise<TTable["$inferSelect"]>;
}

export interface DeleteService<
    TTable extends PgTable,
    TSchema extends Record<string, unknown>
> {
    delete: (
        id: PrimaryKeyType<TTable>,
        tx?: PgTransaction<any, TSchema, any>
    ) => Promise<void>;
}

export type PrimaryKeyData<TTable extends AnyPgTable> = {
    [K in keyof TTable["_"]["columns"]
        as TTable["_"]["columns"][K] extends { _: { isPrimaryKey: true } }
            ? K
            : never
    ]: TTable["_"]["columns"][K]["_"]["data"];
};

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export type Table = AnyPgTable & {
    deletedAt: PgColumn;
    id: any;
};

export type PrimaryKeyType<T extends AnyPgTable> = T["_"]["columns"]["id"]["_"]["data"];

export type FilterMap<
    Schema extends z.ZodObject,
    Out = z.infer<Schema>
> = {
    [K in keyof Out]: (value: NonNullable<Out[K]>) => SQL;
};

// just a rename
export type Filter<Schema extends ZodObject> = z.infer<Schema>;
