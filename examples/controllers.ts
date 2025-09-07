import { serviceService } from "./services";
import { BaseController } from "bradb";
import { serviceSchema } from "./validator";
import { serviceFilterSchema } from "./filter";

export const serviceController = new BaseController(
    serviceService,
    serviceSchema,
    serviceFilterSchema
);
