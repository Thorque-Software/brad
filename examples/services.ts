import { db } from "./db"
import { count, create, findAll, findOne, softDelete, update } from "brad";
import { findAllRelational, findOneRelational } from "brad";
import { serviceTable } from "./schema"
import { serviceFilterMap } from "./filter";

export const serviceService = {
    create: create(db, serviceTable),
    count: count(db, serviceTable, serviceFilterMap),
    delete: softDelete(db, serviceTable),
    update: update(db, serviceTable),
    // findAll: findAll( // add pagination and filters
    //     serviceFilterMap,
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
    findOne: findOne(serviceTable, // agrega el where eq y el Custom Error
        db.select().from(serviceTable).$dynamic()
    ),
    findOneR: findOneRelational(db.query.serviceTable, {
        with: {
            provider: true
        }
    })
}
