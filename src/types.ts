import { SQL } from "drizzle-orm";
import { AnyPgTable, PgTable, PgTransaction } from "drizzle-orm/pg-core";
import z, { ZodObject } from "zod";

export type FindOneFunc<T extends PgTable> = (pks: PrimaryKeyData<T>) => Promise<object>;

export type FindAllFunc<F extends ZodObject> = (filters?: F, page?: number, pageSize?: number) => Promise<object>;

export type CountFunc<F extends ZodObject> = (filters?: F) => Promise<object>;

export type CreateFunc<T extends PgTable> = (
    data: T["$inferInsert"], 
    tx?: PgTransaction<any, any, any>
) => Promise<T["$inferSelect"]>;

export type UpdateFunc<T extends PgTable> = (
    pks: PrimaryKeyData<T>,
    data: Partial<T["$inferInsert"]>,
    tx?: PgTransaction<any, any, any>
) => Promise<T["$inferSelect"]>;

export type DeleteFunc<T extends PgTable> = (pks: PrimaryKeyData<T>) => Promise<void>;

export type PrimaryKeyData<TTable extends AnyPgTable> = {
    [K in keyof TTable["_"]["columns"]
        as TTable["_"]["columns"][K] extends { _: { isPrimaryKey: true } }
            ? K
            : never
    ]: TTable["_"]["columns"][K]["_"]["data"];
};

export type FilterMap<
    Schema extends z.ZodObject,
    Out = z.infer<Schema>
> = {
    [K in keyof Out]: (value: NonNullable<Out[K]>) => SQL;
};

// just a rename
export type Filter<Schema extends ZodObject> = z.infer<Schema>;
