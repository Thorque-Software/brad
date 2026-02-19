import { ServiceBuilder } from "bradb";
import { eventTable, inscriptionTable } from "./schemas"
import { inscriptionFilterMap } from "./filters"
import { db } from "../src/db";
import { eq } from "drizzle-orm";

const builder = new ServiceBuilder(db, inscriptionTable, inscriptionFilterMap);

export const inscriptionService = {
    create: builder.create(),
    update: builder.update(),
    delete: builder.delete(),
    findAll: builder.findAll(() => 
        db
            .select()
            .from(inscriptionTable)
            .innerJoin(eventTable,
                eq(eventTable.id, inscriptionTable.idEvent)
            )
            .$dynamic()
    ),
    findOne: builder.findOne(() => 
        db
            .select({
                idFoo: inscriptionTable.idEvent,
                idAaa: inscriptionTable.idEvent,
            })
            .from(inscriptionTable)
            .$dynamic()
    ) 
};
