import { SQL } from "drizzle-orm";
import { AnyPgTable, PgColumn, PgTable } from "drizzle-orm/pg-core";
import z, { ZodObject } from "zod";

export interface CRUDService<FSchema extends ZodObject> {
    findOne: (id: any) => Promise<any>; 
    findAll: (filters?: Filter<FSchema>, page?: number, pageSize?: number) => Promise<any>;
    count:  (filters: Filter<FSchema>) => Promise<number>;
    create: (data: any) => Promise<any>;
    update: (id: any, data: Partial<any>) => Promise<any>;
    delete: (id: any) => Promise<any>;
}

// export interface CRUDService<
//     T extends PgTable,
//     PrimaryKeyType = T["_"]["columns"]["id"]["_"]["data"],
//     Insert = InferInsertModel<T>,
//     Select = Partial<InferSelectModel<T>>
// > {
//     findOne: (id: PrimaryKeyType) => Promise<Select>; 
//     findAll: (options: FindAllOptions<T>) => Promise<Select[]>;
//     count:  (options: FindAllOptions<T>) => Promise<{count: number}>;
//     create: (data: Insert) => Promise<Select>;
//     update: (id: PrimaryKeyType, data: Partial<Insert>) => Promise<Select>;
//     softDelete: (id: PrimaryKeyType) => Promise<Select>;
// }
//
//

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
