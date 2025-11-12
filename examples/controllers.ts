import { serviceService } from "./services";
import { createBuilder, findAllBuilder, findOneBuilder, updateBuilder } from "bradb";
import { serviceCreateSchema, serviceUpdateSchema } from "./validator";

export const serviceController = {
    create: createBuilder(serviceService, serviceCreateSchema),
    getAll: findAllBuilder(serviceService, (items, total) => {
        items.forEach(i => i.);
    }),
    update: updateBuilder(serviceService, serviceUpdateSchema),
    getById: findOneBuilder(serviceService)
}
