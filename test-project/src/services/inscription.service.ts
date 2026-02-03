import { ServiceBuilder } from "bradb";
import { inscriptionTable } from "../schemas/inscription.schema"
import { db } from "../db";

const builder = new ServiceBuilder(db, inscriptionTable, {});

export const inscriptionService = {
    create: builder.create(),
    update: builder.update(),
    count: builder.count(),
    delete: builder.delete(),
    findAll: builder.findAll(db.select().from(inscriptionTable).$dynamic()),
    findOne: builder.findOne(db.select().from(inscriptionTable).$dynamic())
};
