import { InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

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

export interface FindAllOptions<T extends PgTable> {
    pagination?: PaginationParams;
    filters?: Filter<T>;
}

export type Table = PgTable & {
    id: PgColumn;
    deletedAt: PgColumn;
};

export type PrimaryKeyType<T extends PgTable> = T["_"]["columns"]["id"]["_"]["data"];

export type Filter<T extends PgTable> = Partial<T["$inferSelect"]>;

export type FilterMap<T extends PgTable> = {
    [K in keyof T["$inferSelect"]]?: (value: T["$inferSelect"][K]) => SQL;
};
