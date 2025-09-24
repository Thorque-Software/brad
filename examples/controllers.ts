import { serviceService } from "./services";
import { createBuilder, findAllBuilder, findOneBuilder } from "bradb";
import { serviceCreateSchema } from "./validator";
import { PgTable } from "drizzle-orm/pg-core";
import { serviceTable } from "./schema";

type a = Parameters<typeof serviceService.create>[0];
type c = Parameters<CreateService<typeof serviceTable>["create"]>[0];
type i = a extends c ? true : false;

interface CreateService<TTable extends PgTable> {
    create: (data: TTable["$inferInsert"]) => Promise<TTable["$inferSelect"]>;
}


export const serviceController = {
    create: createBuilder(serviceService, serviceCreateSchema),
    getAll: findAllBuilder(serviceService, (items, total) => {
        items.forEach(i => i.);
    }),
    getById: findOneBuilder(serviceService)
}
