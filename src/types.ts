import { InferSelectModel, SQL } from "drizzle-orm";
import { AnyPgTable, PgColumn, PgTable } from "drizzle-orm/pg-core";
import z, { ZodObject } from "zod";

export interface RetrieverService<FSchema extends ZodObject, TTable extends PgTable> {
    findAll: (filters?: Filter<FSchema>, page?: number, pageSize?: number) => Promise<TTable["$inferSelect"][]>;
    count:  (filters: Filter<FSchema>) => Promise<number>;
}

export interface FindOneService<TTable extends PgTable> {
    findOne: (id: any) => Promise<InferSelectModel<TTable>>;  
}

export interface CreateService<TTable extends PgTable> {
    create: (data: TTable["$inferInsert"]) => Promise<TTable["$inferSelect"]>;
}

export interface UpdateService<TTable extends PgTable> {
    update: (id: any, data: Partial<TTable["$inferInsert"]>) => Promise<TTable["$inferSelect"]>;
}

export interface DeleteService<TTable extends PgTable> {
    delete: (id: any) => Promise<TTable["$inferSelect"]>;
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
    id: PgColumn;
    deletedAt: PgColumn;
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
