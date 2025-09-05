import { SQL } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";
import z from "zod";

export interface CRUDService {
    findOne: (id: any) => Promise<any>; 
    findAll: (options: FindAllOptions<any>) => Promise<any>;
    count:  (filters: Filter<any>) => Promise<number>;
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

export interface FindAllOptions<FSchema extends z.ZodObject> {
    pagination?: PaginationParams;
    filters?: Filter<FSchema>;
}

export type Table = PgTable & {
    id: PgColumn;
    deletedAt: PgColumn;
};

export type PrimaryKeyType<T extends PgTable> = T["_"]["columns"]["id"]["_"]["data"];

export type FilterMap<Schema extends z.ZodObject> = {
    [K in keyof z.infer<Schema>]?: (value: z.infer<Schema>[K]) => SQL;
}

export type Filter<Schema extends z.ZodObject> = {
    [K in keyof z.infer<Schema>]?: z.infer<Schema>[K];
}
