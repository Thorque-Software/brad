import { db } from "./db"
import { ServiceBuilder } from "bradb";
import { findAllRelational, findOneRelational } from "bradb";
import { serviceTable } from "./schema"
import { serviceFilterMap } from "./filter";

const builder = new ServiceBuilder(db, serviceTable, serviceFilterMap);

export const serviceService = {
    create: builder.create(),
    count: builder.count(),
    delete: builder.softDelete(),
    // or you can do a soft delete
    // delete: builder.hardDelete,
    update: builder.update(),
    // findAll: builder.findAll( // add pagination and filters
    //     // Dont forget $dinamyc()
    //     db.select({name: serviceTable.name}).from(serviceTable).orderBy(serviceTable.id).$dynamic()
    // ),
    findAll: findAllRelational(
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
