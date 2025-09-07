import { SQL } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";
import z, { ZodObject } from "zod";

export interface CRUDService<FSchema extends ZodObject> {
    findOne: (id: any) => Promise<any>; 
    findAll: (options: FindAllOptions<FSchema>) => Promise<any>;
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

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface FindAllOptions<FSchema extends ZodObject> {
    pagination?: PaginationParams;
    filters?: Filter<FSchema>;
}

export type Table = PgTable & {
    id: PgColumn;
    deletedAt: PgColumn;
};

export type PrimaryKeyType<T extends PgTable> = T["_"]["columns"]["id"]["_"]["data"];

export type FilterMap<
    Schema extends z.ZodObject,
    Out = z.infer<Schema>
> = {
    [K in keyof Out]: (value: NonNullable<Out[K]>) => SQL;
};

// just a rename
export type Filter<Schema extends ZodObject> = z.infer<Schema>;
