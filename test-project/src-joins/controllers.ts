import {
    findAllBuilder,
    findOneBuilder,
    updateBuilder,
    deleteBuilder,
    createBuilder
} from "bradb";
import { inscriptionService } from "./services"
import { inscriptionValidator } from "./validators";

export const inscriptionController = {
    getAll: findAllBuilder(inscriptionService.findAll, inscriptionValidator.filter),
    getOne: findOneBuilder(inscriptionService.findOne, inscriptionValidator.pk),
    create: createBuilder(inscriptionService.create, inscriptionValidator.insert),
    update: updateBuilder(inscriptionService.update, inscriptionValidator.pk, inscriptionValidator.update),
    remove: deleteBuilder(inscriptionService.delete, inscriptionValidator.pk)
};
