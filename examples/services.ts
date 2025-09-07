import { db } from "./db"
import { ServiceBuilder, RelationalBuilder } from "bradb";
import { providerTable, serviceTable } from "./schema"
import { providerFilterMap, serviceFilterMap } from "./filter";
import { AnyPgTable, getTableConfig, PgColumn } from "drizzle-orm/pg-core";
import { eq, InferColumnsDataTypes, SQL } from "drizzle-orm";

const builder = new ServiceBuilder(db, serviceTable, serviceFilterMap);
const rb = RelationalBuilder(db.query.serviceTable, serviceFilterMap);

const providerBuilder = new ServiceBuilder(db, providerTable, providerFilterMap);

type a = typeof db.query.providerTable;

export const providerService = {
    create: providerBuilder.create(),
    count: providerBuilder.count(),
    delete: providerBuilder.softDelete(),
    update: providerBuilder.update(),
    findAll: providerBuilder.findAll( // add pagination and filters
        db.select().from(providerTable).$dynamic()
    ),
}

export const serviceService = {
    create: builder.create(),
    count: builder.count(),
    delete: builder.softDelete(),
    // or you can do a soft delete
    // delete: builder.hardDelete,
    update: builder.update(),
    findAll: builder.findAll( // add pagination and filters
        // Dont forget $dinamyc()
        db.select({name: serviceTable.name}).from(serviceTable).orderBy(serviceTable.id).$dynamic()
    ),
    findAllR: findAllRelational(
        serviceFilterMap,
        db.query.serviceTable, {
            columns: {
                name: true,
                duration: true,
            },
            with: {
                provider: true
            }
    }),
    findOne: builder.findOne(// agrega el where eq y el Custom Error
        db.select().from(serviceTable).$dynamic()
    ),
    findOneR: findOneRelational(db.query.serviceTable, {
        with: {
            provider: true
        }
    })
}

type PrimaryKeyData<TTable extends AnyPgTable> = {
    [K in keyof TTable["_"]["columns"]
        as TTable["_"]["columns"][K] extends { _: { isPrimaryKey: true } }
            ? K
            : never
    ]: TTable["_"]["columns"][K]["_"]["data"];
};

const fn = findByPkBuilder(serviceTable);
const res = fn(9)

function findByPk<
    TTable extends AnyPgTable,
>
(table: TTable, data: PrimaryKeyData<TTable>) {
    const { primaryKeys } = getTableConfig(table)

    const conditions: SQL[] = [];
    for (const pk of primaryKeys) {
        for (const column of pk.columns) {
            const name = column.name as keyof PrimaryKeyData<TTable>;
            // if (data[name] === undefined || data[name] === null) {
            //     throw new Error(`Missing value for pk column: ${column.name}`);
            // }
            conditions.push(eq(table[name as keyof TTable] as PgColumn, data[name]));
        }
    }
    return conditions;
}

type PKArgs<TTable extends AnyPgTable> =
  PrimaryKeyData<TTable> extends Record<string, any>
    ? PrimaryKeyData<TTable>[keyof PrimaryKeyData<TTable>] extends never
      ? []
      : { [K in keyof PrimaryKeyData<TTable>]: PrimaryKeyData<TTable>[K] }
    : never;

type c = PKArgs<typeof serviceTable>;

function findByPkBuilder<TTable extends AnyPgTable>(table: TTable) {
    return (...args: PrimaryKeyData<TTable>[keyof PrimaryKeyData<TTable>][]) => {
        const { primaryKeys } = getTableConfig(table);

        const conditions: SQL[] = [];
        let i = 0;
        for (const pk of primaryKeys) {
            for (const column of pk.columns) {
                const name = column.name as keyof PrimaryKeyData<TTable>;
                const value = args[i++];
                // if (value === undefined || value === null) {
                //     throw new Error(`Missing value for pk column: ${column.name}`);
                // }
                conditions.push(eq(table[name as keyof TTable] as PgColumn, value));
            }
        }
        return conditions;
    };
}
