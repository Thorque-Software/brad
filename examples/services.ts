import { db } from "./db"
import { ServiceBuilder, RelationalBuilder, PrimaryKeyData } from "bradb";
import { providerTable, serviceTable } from "./schema"
import { providerFilterMap, serviceFilterMap } from "./filter";
import { AnyPgTable } from "drizzle-orm/pg-core";

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
type LengthOfKeys<T> = 
    keyof T extends infer K ? (K extends string | number | symbol ? K[] : never) : never extends infer KeysArray ? KeysArray["length"] : never;

type pks = {fileId: string, userId: string};
type b = Prettify<[keyof pks]>;
type IsUnion<T> = [T] extends [never] ? false : T extends any ? ([T] extends [infer U] ? (U extends any ? false : true) : false) : false;

type pklen = keyof pks extends [any] ? true : false;

type a = IsUnion<keyof pks>;
type list = [1];
type c = list["length"] extends 1 ? true : false;  

type ExtractPKs<TTable extends AnyPgTable> = {
    [K in keyof TTable["_"]["columns"]
        as TTable["_"]["columns"][K] extends { _: { isPrimaryKey: true } }
            ? K
            : never
    ]: TTable["_"]["columns"][K];
}[keyof TTable["_"]["columns"]];

type aaa = ExtractPKs<typeof serviceTable>;


// CRU
// Retriever
const builder = new ServiceBuilder(db, serviceTable, serviceFilterMap);
const rb = RelationalBuilder(db.query.serviceTable, serviceFilterMap);

const providerBuilder = new ServiceBuilder(db, providerTable, providerFilterMap);

// const findAll = builder.query(
//     db.select({cuil: providerTable.email}).from(providerTable).$dynamic(
// )
// .addFilters(filterSchema)
// .addPagination()

// const findOne = builder.query(
//     db.select({cuil: providerTable.email}).from(providerTable).$dynamic(
// ).findByPK()

export const providerService = {
    create: providerBuilder.create(),
    count: providerBuilder.count(),
    delete: providerBuilder.softDelete(),
    update: providerBuilder.update(),
    findAll: providerBuilder.findAll( // add pagination and filters
        db.select({cuil: providerTable.email}).from(providerTable).$dynamic()
    ),
}

export const serviceService = {
    create: builder.create(),
    count: builder.count(),
    delete: builder.softDelete(),
    // or you can do a soft delete
    // delete: builder.hardDelete,
    update: builder.update(),
    findAllNR: builder.findAll( // add pagination and filters
        // Dont forget $dinamyc()
        db.select({name: serviceTable.name}).from(serviceTable).$dynamic()
    ),
    findAll: rb.findAll({
        columns: {
            name: true,
            duration: true,
        },
        with: {
            provider: {
                columns: {
                    email: true
                }
            }
        }
    }),
    findOne: builder.findOne(// agrega el where eq y el Custom Error
        db.select({name: serviceTable.name}).from(serviceTable).$dynamic()
    ),
    findOneRelational: rb.findOne({
        columns: {
            name: true
        },
        with: {
            provider: true
        }
    })
}
