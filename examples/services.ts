import { db } from "./db"
import { buildFilters, ServiceBuilder } from "bradb";
import { providerTable, serviceTable } from "./schema"
import { providerFilterMap, serviceFilterMap } from "./filter";

const builder = new ServiceBuilder(db, serviceTable, serviceFilterMap);
const rb = relationalBuilder(db.query.serviceTable, serviceFilterMap);

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
