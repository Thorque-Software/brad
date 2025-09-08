import { db } from "./db"
import { ServiceBuilder, RelationalBuilder } from "bradb";
import { providerTable, serviceTable } from "./schema"
import { providerFilterMap, serviceFilterMap } from "./filter";

// CRU
// Retriever

const builder = new ServiceBuilder(db, serviceTable, serviceFilterMap);
const rb = RelationalBuilder(db.query.serviceTable, serviceFilterMap);

const providerBuilder = new ServiceBuilder(db, providerTable, providerFilterMap);

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
        db.select().from(serviceTable).$dynamic()
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

function findMany<
    TConfig extends DBQueryConfig<'many', true, TSchema, TFields>
>(
    config?: KnownKeysOnly<TConfig, DBQueryConfig<'many', true, TSchema, TFields>>
 ): PgRelationalQuery<BuildQueryResult<TSchema, TFields, TConfig>[]>;


 findFirst<TSelection extends Omit<DBQueryConfig<'many', true, TSchema, TFields>, 'limit'>>(config?: KnownKeysOnly<TSelection, Omit<DBQueryConfig<'many', true, TSchema, TFields>, 'limit'>>): PgRelationalQuery<BuildQueryResult<TSchema, TFields, TSelection> | undefined>;

type a = typeof db.query.serviceTable.findFirst;
type b = typeof rb.findAll;
