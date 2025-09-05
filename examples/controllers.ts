import { serviceService } from "./services";
import { BaseController } from "bradb";
import { serviceSchema } from "./validator";

export const serviceController = new BaseController(
    serviceService,
    serviceSchema,
    serviceFilter
);
