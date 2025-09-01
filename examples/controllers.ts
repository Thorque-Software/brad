import { serviceService } from "./services";
import { BaseController } from "brad";
import { serviceFilterSchema, serviceSchema } from "./validator";

export const serviceController = new BaseController(
    serviceService,
    serviceSchema,
    serviceFilterSchema
);
